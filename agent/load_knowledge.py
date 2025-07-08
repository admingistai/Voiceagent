#!/usr/bin/env python3
"""
Script to load documents into the knowledge base
"""

import json
import os
import sys
from knowledge_base import KnowledgeBase
from dotenv import load_dotenv

load_dotenv()


def load_sample_documents():
    """Load sample documents to demonstrate the knowledge base"""
    kb = KnowledgeBase()
    
    # Sample documents about the voice agent system
    sample_docs = [
        {
            "content": """LiveKit is an open-source platform that provides real-time video, audio, and data communication infrastructure. 
It supports WebRTC and offers SDKs for various platforms including JavaScript, Python, Go, and more. 
LiveKit is designed for building scalable real-time applications like video conferencing, live streaming, and collaborative tools.""",
            "metadata": {
                "title": "About LiveKit",
                "category": "technology",
                "source": "system_knowledge"
            }
        },
        {
            "content": """Cartesia is an AI company that specializes in ultra-fast, realistic text-to-speech synthesis. 
Their Sonic model offers state-of-the-art voice generation with extremely low latency, making it perfect for real-time applications. 
Cartesia supports multiple languages and offers a variety of natural-sounding voices.""",
            "metadata": {
                "title": "About Cartesia TTS",
                "category": "technology",
                "source": "system_knowledge"
            }
        },
        {
            "content": """Deepgram is an AI speech recognition company that provides fast and accurate speech-to-text services. 
Their API offers real-time transcription with support for multiple languages, custom vocabulary, and various audio formats. 
Deepgram uses deep learning models trained on diverse datasets to achieve high accuracy.""",
            "metadata": {
                "title": "About Deepgram STT",
                "category": "technology",
                "source": "system_knowledge"
            }
        },
        {
            "content": """The Divine Halo Voice Agent combines several technologies:
- Speech recognition using Deepgram for converting voice to text
- OpenAI's GPT-4o-mini for intelligent conversation
- Cartesia's Sonic v2 for natural text-to-speech
- LiveKit for real-time WebRTC communication
- A beautiful visualization system with three modes: Divine Halo, Particles, and Wave
The agent can access a knowledge base to provide informed responses about specific topics.""",
            "metadata": {
                "title": "Divine Halo Voice Agent Overview",
                "category": "system",
                "source": "system_knowledge"
            }
        },
        {
            "content": """The visualization system in the Divine Halo Voice Agent includes:
1. Divine Halo Mode: Purple radiant rings that expand and pulse with voice amplitude
2. Particles Mode: 200 particles arranged in a circular wave pattern
3. Wave Mode: Dual waveform visualization with floating particles
Users can adjust sensitivity from 10% to 200% and upload a face image to appear in the center.""",
            "metadata": {
                "title": "Visualization Features",
                "category": "features",
                "source": "system_knowledge"
            }
        }
    ]
    
    # Add documents to knowledge base
    print("Loading sample documents into knowledge base...")
    doc_ids = kb.add_documents_batch(sample_docs)
    print(f"Successfully loaded {len(doc_ids)} documents")
    
    # Test search
    print("\nTesting search functionality...")
    test_queries = [
        "What is LiveKit?",
        "How does the visualization work?",
        "Tell me about Cartesia"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        results = kb.search(query, n_results=2)
        for i, result in enumerate(results):
            print(f"  Result {i+1}: {result['content'][:100]}...")


def load_from_json(file_path: str):
    """Load documents from a JSON file"""
    kb = KnowledgeBase()
    
    try:
        kb.load_from_file(file_path)
        print(f"Successfully loaded documents from {file_path}")
        
        # Show document count
        doc_count = kb.collection.count()
        print(f"Total documents in knowledge base: {doc_count}")
        
    except Exception as e:
        print(f"Error loading documents: {e}")
        sys.exit(1)


def clear_knowledge_base():
    """Clear all documents from the knowledge base"""
    kb = KnowledgeBase()
    
    response = input("Are you sure you want to clear all documents? (yes/no): ")
    if response.lower() == 'yes':
        kb.clear_all()
        print("Knowledge base cleared")
    else:
        print("Operation cancelled")


def list_documents():
    """List all documents in the knowledge base"""
    kb = KnowledgeBase()
    
    documents = kb.list_documents()
    print(f"\nTotal documents: {len(documents)}")
    
    for doc in documents:
        print(f"\nID: {doc['id']}")
        print(f"Title: {doc['metadata'].get('title', 'Untitled')}")
        print(f"Category: {doc['metadata'].get('category', 'Uncategorized')}")
        print(f"Content preview: {doc['content'][:100]}...")


def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python load_knowledge.py sample     - Load sample documents")
        print("  python load_knowledge.py load <file.json> - Load from JSON file")
        print("  python load_knowledge.py list       - List all documents")
        print("  python load_knowledge.py clear      - Clear all documents")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "sample":
        load_sample_documents()
    elif command == "load" and len(sys.argv) > 2:
        load_from_json(sys.argv[2])
    elif command == "list":
        list_documents()
    elif command == "clear":
        clear_knowledge_base()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()