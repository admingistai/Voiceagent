"""
Knowledge Base module for the Cartesia Voice Agent
Implements RAG (Retrieval Augmented Generation) for contextual responses
"""

import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import numpy as np
from datetime import datetime

# We'll use ChromaDB for vector storage - it's lightweight and serverless
import chromadb
from chromadb.utils import embedding_functions
import openai
from livekit.agents.log import logger


@dataclass
class Document:
    """Represents a document in the knowledge base"""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None


class KnowledgeBase:
    """
    Manages document storage and retrieval for the voice agent
    Uses ChromaDB for vector storage and OpenAI for embeddings
    """
    
    def __init__(self, 
                 collection_name: str = "voice_agent_kb",
                 persist_directory: str = "./chroma_db"):
        """
        Initialize the knowledge base
        
        Args:
            collection_name: Name of the ChromaDB collection
            persist_directory: Directory to persist the database
        """
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Use OpenAI embeddings for consistency with the LLM
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is required for KnowledgeBase. "
                "Please set it in Railway environment variables."
            )
        
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_key,
            model_name="text-embedding-3-small"
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function
        )
        
        logger.info(f"Knowledge base initialized with {self.collection.count()} documents")
    
    def add_document(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a document to the knowledge base
        
        Args:
            content: The text content of the document
            metadata: Optional metadata for the document
            
        Returns:
            The ID of the added document
        """
        if metadata is None:
            metadata = {}
        
        # Add timestamp
        metadata["added_at"] = datetime.now().isoformat()
        
        # Generate unique ID
        doc_id = f"doc_{datetime.now().timestamp()}"
        
        # Add to collection
        self.collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id]
        )
        
        logger.info(f"Added document {doc_id} to knowledge base")
        return doc_id
    
    def add_documents_batch(self, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Add multiple documents to the knowledge base
        
        Args:
            documents: List of documents with 'content' and optional 'metadata'
            
        Returns:
            List of document IDs
        """
        contents = []
        metadatas = []
        ids = []
        
        for doc in documents:
            content = doc.get("content", "")
            metadata = doc.get("metadata", {})
            metadata["added_at"] = datetime.now().isoformat()
            
            doc_id = f"doc_{datetime.now().timestamp()}_{len(ids)}"
            
            contents.append(content)
            metadatas.append(metadata)
            ids.append(doc_id)
        
        # Add batch to collection
        self.collection.add(
            documents=contents,
            metadatas=metadatas,
            ids=ids
        )
        
        logger.info(f"Added {len(documents)} documents to knowledge base")
        return ids
    
    def search(self, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Search the knowledge base for relevant documents
        
        Args:
            query: The search query
            n_results: Number of results to return
            
        Returns:
            List of relevant documents with content and metadata
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        documents = []
        for i in range(len(results['ids'][0])):
            doc = {
                'id': results['ids'][0][i],
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i] if 'distances' in results else None
            }
            documents.append(doc)
        
        logger.info(f"Found {len(documents)} relevant documents for query: {query}")
        return documents
    
    def get_context_for_query(self, query: str, max_tokens: int = 1000) -> str:
        """
        Get relevant context for a query to inject into the LLM prompt
        
        Args:
            query: The user's query
            max_tokens: Maximum tokens to include in context
            
        Returns:
            Formatted context string
        """
        # Search for relevant documents
        documents = self.search(query, n_results=5)
        
        if not documents:
            return ""
        
        # Format context
        context_parts = ["Here is relevant information from the knowledge base:\n"]
        
        for doc in documents:
            # Estimate tokens (rough approximation)
            doc_text = f"\n[Document: {doc['metadata'].get('title', 'Untitled')}]\n{doc['content']}\n"
            
            # Simple token estimation (1 token ≈ 4 characters)
            if len(" ".join(context_parts)) + len(doc_text) > max_tokens * 4:
                break
                
            context_parts.append(doc_text)
        
        return "\n".join(context_parts)
    
    def delete_document(self, doc_id: str):
        """Delete a document from the knowledge base"""
        self.collection.delete(ids=[doc_id])
        logger.info(f"Deleted document {doc_id} from knowledge base")
    
    def clear_all(self):
        """Clear all documents from the knowledge base"""
        # Delete and recreate the collection
        self.client.delete_collection(name=self.collection.name)
        self.collection = self.client.create_collection(
            name=self.collection.name,
            embedding_function=self.embedding_function
        )
        logger.info("Cleared all documents from knowledge base")
    
    def list_documents(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all documents in the knowledge base"""
        results = self.collection.get(limit=limit)
        
        documents = []
        for i in range(len(results['ids'])):
            doc = {
                'id': results['ids'][i],
                'content': results['documents'][i],
                'metadata': results['metadatas'][i]
            }
            documents.append(doc)
        
        return documents
    
    def load_from_file(self, file_path: str):
        """
        Load documents from a JSON file
        
        Expected format:
        [
            {
                "content": "Document content...",
                "metadata": {"title": "Doc Title", "category": "category"}
            },
            ...
        ]
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                documents = json.load(f)
            
            if isinstance(documents, list):
                self.add_documents_batch(documents)
                logger.info(f"Loaded {len(documents)} documents from {file_path}")
            else:
                logger.error(f"Invalid format in {file_path}. Expected a list of documents.")
        except Exception as e:
            logger.error(f"Error loading documents from {file_path}: {e}")


# Example usage and testing
if __name__ == "__main__":
    # Initialize knowledge base
    kb = KnowledgeBase()
    
    # Example: Add some documents
    kb.add_document(
        content="LiveKit is an open-source project that provides scalable, real-time video and audio communication infrastructure.",
        metadata={"title": "About LiveKit", "category": "technology"}
    )
    
    kb.add_document(
        content="Cartesia offers state-of-the-art text-to-speech synthesis with natural-sounding voices and low latency.",
        metadata={"title": "About Cartesia", "category": "technology"}
    )
    
    # Search example
    results = kb.search("What is LiveKit?")
    for result in results:
        print(f"Found: {result['content'][:100]}...")