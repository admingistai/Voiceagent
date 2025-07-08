"""
FastAPI Gateway for LiveKit Voice Agent
Designed for Railway deployment with widget integration
"""

import os
import json
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import jwt
from livekit import api
import redis
import logging
from dotenv import load_dotenv

# Import our agent components
import sys
sys.path.append('/app/agent')
from agent.knowledge_base import KnowledgeBase
from session_manager import SessionManager

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://localhost:7880")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "your-secret-key-here")
REDIS_URL = os.getenv("REDIS_URL")
PORT = int(os.getenv("PORT", 8000))

# Initialize components
kb = KnowledgeBase()
session_manager = SessionManager(redis_url=REDIS_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting API Gateway...")
    
    # Load default knowledge base if available
    kb_file = os.getenv("DEFAULT_KB_FILE", "sample_knowledge.json")
    if os.path.exists(kb_file):
        try:
            kb.load_from_file(kb_file)
            logger.info(f"Loaded knowledge base from {kb_file}")
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API Gateway...")
    await session_manager.cleanup()

# Create FastAPI app
app = FastAPI(
    title="Divine Halo Voice Agent API",
    description="API Gateway for LiveKit Voice Agent with Knowledge Base",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for widget integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SessionCreateRequest(BaseModel):
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class SessionResponse(BaseModel):
    session_id: str
    room_name: str
    token: str
    livekit_url: str
    created_at: str

class ChatMessage(BaseModel):
    session_id: str
    message: str

class KnowledgeBaseDocument(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = {}

class WidgetConfig(BaseModel):
    api_key: Optional[str] = None
    theme: Optional[str] = "default"
    position: Optional[str] = "bottom-right"
    primary_color: Optional[str] = "#8B2BE2"

# Health check endpoint (required for Railway)
@app.get("/health")
async def health_check():
    """Railway health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "voice-agent-api",
        "version": "1.0.0"
    }

# Session Management Endpoints
@app.post("/api/sessions/create", response_model=SessionResponse)
async def create_session(request: SessionCreateRequest):
    """Create a new voice chat session"""
    try:
        # Generate session ID and room name
        session_id = str(uuid.uuid4())
        room_name = f"voice-session-{session_id}"
        
        # Generate LiveKit access token
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(request.user_id or f"user-{session_id}")
        token.with_name(request.user_id or "User")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        ))
        
        jwt_token = token.to_jwt()
        
        # Create session
        session_data = {
            "session_id": session_id,
            "room_name": room_name,
            "user_id": request.user_id,
            "metadata": request.metadata,
            "created_at": datetime.utcnow().isoformat(),
            "messages": []
        }
        
        await session_manager.create_session(session_id, session_data)
        
        return SessionResponse(
            session_id=session_id,
            room_name=room_name,
            token=jwt_token,
            livekit_url=LIVEKIT_URL,
            created_at=session_data["created_at"]
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str):
    """End a voice chat session"""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update session status
    session["ended_at"] = datetime.utcnow().isoformat()
    session["status"] = "ended"
    await session_manager.update_session(session_id, session)
    
    return {"message": "Session ended successfully", "session_id": session_id}

# Knowledge Base Endpoints
@app.post("/api/knowledge-base/documents")
async def add_document(document: KnowledgeBaseDocument):
    """Add a document to the knowledge base"""
    try:
        doc_id = kb.add_document(
            content=document.content,
            metadata=document.metadata
        )
        return {"document_id": doc_id, "message": "Document added successfully"}
    except Exception as e:
        logger.error(f"Failed to add document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/knowledge-base/documents")
async def list_documents(limit: int = 100):
    """List all documents in the knowledge base"""
    try:
        documents = kb.list_documents(limit=limit)
        return {"documents": documents, "count": len(documents)}
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/knowledge-base/search")
async def search_knowledge_base(query: str, n_results: int = 3):
    """Search the knowledge base"""
    try:
        results = kb.search(query, n_results=n_results)
        return {"query": query, "results": results}
    except Exception as e:
        logger.error(f"Failed to search knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/knowledge-base/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from the knowledge base"""
    try:
        kb.delete_document(doc_id)
        return {"message": "Document deleted successfully", "document_id": doc_id}
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Widget Configuration Endpoint
@app.post("/api/widget/config")
async def get_widget_config(config: WidgetConfig):
    """Get widget configuration for embedding"""
    # Validate API key if provided
    if config.api_key and config.api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {
        "widget_url": f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/widget/embed.js",
        "config": {
            "theme": config.theme,
            "position": config.position,
            "primaryColor": config.primary_color,
            "apiEndpoint": os.getenv('API_BASE_URL', 'http://localhost:8000'),
        }
    }

# WebSocket endpoint for real-time chat (optional)
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    
    try:
        # Verify session exists
        session = await session_manager.get_session(session_id)
        if not session:
            await websocket.close(code=4004, reason="Session not found")
            return
        
        # Handle WebSocket communication
        while True:
            data = await websocket.receive_json()
            
            # Process different message types
            if data.get("type") == "chat":
                # Add message to session
                message = {
                    "role": "user",
                    "content": data.get("content"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                session["messages"].append(message)
                await session_manager.update_session(session_id, session)
                
                # Send acknowledgment
                await websocket.send_json({
                    "type": "ack",
                    "message_id": data.get("id"),
                    "status": "received"
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=4000, reason=str(e))

# Static file serving for widget
@app.get("/widget/embed.js")
async def serve_widget_script():
    """Serve the widget JavaScript file"""
    widget_path = os.path.join(os.path.dirname(__file__), "widget", "embed.js")
    if os.path.exists(widget_path):
        with open(widget_path, "r") as f:
            content = f.read()
        return JSONResponse(
            content=content,
            media_type="application/javascript",
            headers={
                "Cache-Control": "public, max-age=3600"
            }
        )
    else:
        raise HTTPException(status_code=404, detail="Widget script not found")

# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG") else "An error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Run with Railway-compatible settings
    uvicorn.run(
        app,
        host="0.0.0.0",  # Required for Railway
        port=PORT,
        log_level="info"
    )