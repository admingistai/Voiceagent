# Knowledge Base Integration for Divine Halo Voice Agent

## Overview

The voice agent now includes a powerful knowledge base system that allows it to answer questions about specific topics using Retrieval Augmented Generation (RAG). This means your voice assistant can provide accurate, contextual information from your custom documents.

## How It Works

1. **User speaks a question** → Deepgram converts to text
2. **Knowledge base searches** for relevant documents using semantic similarity
3. **Relevant context is injected** into the GPT-4o-mini prompt
4. **Agent responds** with information from the knowledge base
5. **Cartesia converts** the response to natural speech

## Setup Instructions

### 1. Install Dependencies

First, activate your virtual environment and install the new dependencies:

```bash
cd agent
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Load Your Knowledge Base

#### Option A: Load Sample Documents
```bash
python load_knowledge.py sample
```

This loads sample documents about LiveKit, Cartesia, and the voice agent system.

#### Option B: Load Custom Documents from JSON
```bash
python load_knowledge.py load your_documents.json
```

Your JSON file should follow this format:
```json
[
    {
        "content": "The main content of your document...",
        "metadata": {
            "title": "Document Title",
            "category": "Category Name",
            "tags": ["tag1", "tag2"]
        }
    }
]
```

### 3. Run the Knowledge-Enhanced Agent

Instead of running `main.py`, use the enhanced version:

```bash
python main_with_kb.py dev
```

## Managing the Knowledge Base

### List All Documents
```bash
python load_knowledge.py list
```

### Clear All Documents
```bash
python load_knowledge.py clear
```

### Add Documents Programmatically

```python
from knowledge_base import KnowledgeBase

kb = KnowledgeBase()
kb.add_document(
    content="Your document content here...",
    metadata={"title": "My Document", "category": "info"}
)
```

## Best Practices

### Document Structure
- Keep documents focused on single topics
- Use clear, concise language
- Include relevant keywords for better search
- Add descriptive metadata

### Content Guidelines
- **Product Information**: Features, pricing, specifications
- **FAQs**: Common questions and answers
- **Procedures**: Step-by-step instructions
- **Policies**: Company policies, terms of service
- **Technical Docs**: API references, setup guides

### Performance Tips
- Documents are automatically chunked for optimal retrieval
- The system uses semantic search, so exact keyword matches aren't required
- Keep individual documents under 2000 words for best results

## Example Use Cases

### Customer Support Bot
Load documents about:
- Product features and pricing
- Troubleshooting guides
- Return policies
- FAQ responses

### Technical Assistant
Load documents about:
- API documentation
- Code examples
- Architecture diagrams (as text descriptions)
- Best practices

### Sales Assistant
Load documents about:
- Product comparisons
- Case studies
- Pricing tiers
- Customer testimonials

## Advanced Configuration

### Adjust Search Parameters

In `knowledge_base.py`, you can modify:
- `n_results`: Number of documents to retrieve (default: 3)
- `max_tokens`: Maximum context size (default: 1000)

### Change Embedding Model

The system uses OpenAI's `text-embedding-3-small` by default. To use a different model:

```python
self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
    api_key=os.getenv("OPENAI_API_KEY"),
    model_name="text-embedding-3-large"  # Or another model
)
```

## Troubleshooting

### "No relevant documents found"
- Check if documents are loaded: `python load_knowledge.py list`
- Ensure documents contain relevant keywords
- Try rephrasing the question

### High Latency
- Reduce `n_results` to retrieve fewer documents
- Use shorter documents
- Ensure ChromaDB is using local storage

### Incorrect Responses
- Review document content for accuracy
- Check if conflicting information exists
- Ensure metadata is properly categorized

## Architecture Details

The knowledge base uses:
- **ChromaDB**: Local vector database for document storage
- **OpenAI Embeddings**: For semantic search
- **RAG Pipeline**: Retrieves context before LLM generation

The enhanced agent (`main_with_kb.py`) wraps the standard OpenAI LLM with a RAG-enabled version that automatically searches and includes relevant context.

## Future Enhancements

Potential improvements:
- Web UI for document management
- Real-time document updates
- Multi-language support
- Document version control
- Analytics on knowledge base usage

---

For questions or issues, please refer to the main project documentation or create an issue on GitHub.