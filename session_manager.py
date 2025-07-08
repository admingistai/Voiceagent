"""
Session Manager for Voice Agent
Handles session storage with Redis (if available) or in-memory fallback
"""

import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages chat sessions with Redis support and in-memory fallback
    """
    
    def __init__(self, redis_url: Optional[str] = None, session_ttl: int = 3600):
        """
        Initialize session manager
        
        Args:
            redis_url: Redis connection URL (optional)
            session_ttl: Session TTL in seconds (default: 1 hour)
        """
        self.redis_url = redis_url
        self.session_ttl = session_ttl
        self.redis_client: Optional[redis.Redis] = None
        self.in_memory_store: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        
        # Try to connect to Redis if URL provided
        if redis_url:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                logger.info("Connected to Redis for session storage")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}. Using in-memory storage.")
                self.redis_client = None
    
    async def create_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Create a new session
        
        Args:
            session_id: Unique session identifier
            session_data: Session data dictionary
            
        Returns:
            bool: True if successful
        """
        try:
            session_data["last_activity"] = datetime.utcnow().isoformat()
            
            if self.redis_client:
                # Store in Redis with TTL
                await self.redis_client.setex(
                    f"session:{session_id}",
                    self.session_ttl,
                    json.dumps(session_data)
                )
            else:
                # Store in memory
                async with self._lock:
                    self.in_memory_store[session_id] = session_data
            
            logger.info(f"Created session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create session {session_id}: {e}")
            return False
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session data or None if not found
        """
        try:
            if self.redis_client:
                data = await self.redis_client.get(f"session:{session_id}")
                if data:
                    session = json.loads(data)
                    # Update TTL on access
                    await self.redis_client.expire(f"session:{session_id}", self.session_ttl)
                    return session
            else:
                async with self._lock:
                    session = self.in_memory_store.get(session_id)
                    if session:
                        # Check if session expired
                        last_activity = datetime.fromisoformat(session["last_activity"])
                        if datetime.utcnow() - last_activity < timedelta(seconds=self.session_ttl):
                            return session
                        else:
                            # Remove expired session
                            del self.in_memory_store[session_id]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            return None
    
    async def update_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Update an existing session
        
        Args:
            session_id: Session identifier
            session_data: Updated session data
            
        Returns:
            bool: True if successful
        """
        try:
            session_data["last_activity"] = datetime.utcnow().isoformat()
            
            if self.redis_client:
                # Update in Redis with refreshed TTL
                await self.redis_client.setex(
                    f"session:{session_id}",
                    self.session_ttl,
                    json.dumps(session_data)
                )
            else:
                async with self._lock:
                    if session_id in self.in_memory_store:
                        self.in_memory_store[session_id] = session_data
                    else:
                        return False
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update session {session_id}: {e}")
            return False
    
    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            bool: True if successful
        """
        try:
            if self.redis_client:
                await self.redis_client.delete(f"session:{session_id}")
            else:
                async with self._lock:
                    if session_id in self.in_memory_store:
                        del self.in_memory_store[session_id]
            
            logger.info(f"Deleted session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            return False
    
    async def list_sessions(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all sessions, optionally filtered by user
        
        Args:
            user_id: Optional user ID to filter by
            
        Returns:
            List of session data
        """
        sessions = []
        
        try:
            if self.redis_client:
                # Get all session keys
                keys = await self.redis_client.keys("session:*")
                for key in keys:
                    data = await self.redis_client.get(key)
                    if data:
                        session = json.loads(data)
                        if not user_id or session.get("user_id") == user_id:
                            sessions.append(session)
            else:
                async with self._lock:
                    for session_id, session_data in self.in_memory_store.items():
                        # Check expiration
                        last_activity = datetime.fromisoformat(session_data["last_activity"])
                        if datetime.utcnow() - last_activity < timedelta(seconds=self.session_ttl):
                            if not user_id or session_data.get("user_id") == user_id:
                                sessions.append(session_data)
            
            return sessions
            
        except Exception as e:
            logger.error(f"Failed to list sessions: {e}")
            return []
    
    async def cleanup_expired_sessions(self):
        """
        Clean up expired sessions (for in-memory storage)
        """
        if not self.redis_client:
            async with self._lock:
                expired = []
                for session_id, session_data in self.in_memory_store.items():
                    last_activity = datetime.fromisoformat(session_data["last_activity"])
                    if datetime.utcnow() - last_activity >= timedelta(seconds=self.session_ttl):
                        expired.append(session_id)
                
                for session_id in expired:
                    del self.in_memory_store[session_id]
                    logger.info(f"Cleaned up expired session: {session_id}")
    
    async def add_message_to_session(self, session_id: str, message: Dict[str, Any]) -> bool:
        """
        Add a message to session history
        
        Args:
            session_id: Session identifier
            message: Message data (role, content, timestamp)
            
        Returns:
            bool: True if successful
        """
        session = await self.get_session(session_id)
        if not session:
            return False
        
        if "messages" not in session:
            session["messages"] = []
        
        session["messages"].append(message)
        
        # Keep only last 100 messages to prevent memory issues
        if len(session["messages"]) > 100:
            session["messages"] = session["messages"][-100:]
        
        return await self.update_session(session_id, session)
    
    async def get_session_context(self, session_id: str, max_messages: int = 10) -> str:
        """
        Get conversation context from session history
        
        Args:
            session_id: Session identifier
            max_messages: Maximum number of recent messages to include
            
        Returns:
            Formatted conversation context
        """
        session = await self.get_session(session_id)
        if not session or "messages" not in session:
            return ""
        
        messages = session["messages"][-max_messages:]
        context_parts = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts)
    
    async def cleanup(self):
        """
        Cleanup resources
        """
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Closed Redis connection")


# Cleanup task for expired sessions
async def cleanup_task(session_manager: SessionManager, interval: int = 300):
    """
    Background task to clean up expired sessions
    
    Args:
        session_manager: SessionManager instance
        interval: Cleanup interval in seconds (default: 5 minutes)
    """
    while True:
        try:
            await asyncio.sleep(interval)
            await session_manager.cleanup_expired_sessions()
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")


if __name__ == "__main__":
    # Test the session manager
    async def test():
        manager = SessionManager()
        
        # Create session
        session_id = "test-123"
        await manager.create_session(session_id, {
            "user_id": "user-1",
            "room_name": "room-1",
            "metadata": {"test": True}
        })
        
        # Get session
        session = await manager.get_session(session_id)
        print(f"Session: {session}")
        
        # Add message
        await manager.add_message_to_session(session_id, {
            "role": "user",
            "content": "Hello, assistant!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Get context
        context = await manager.get_session_context(session_id)
        print(f"Context: {context}")
        
        # Cleanup
        await manager.cleanup()
    
    asyncio.run(test())