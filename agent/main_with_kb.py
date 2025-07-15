import asyncio
import json
import os
import requests

from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, JobProcess, Agent, AgentSession, RoomInputOptions
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.log import logger
from livekit.plugins import deepgram, silero, cartesia, openai
import time
from typing import List, Any

from dotenv import load_dotenv
from knowledge_base import KnowledgeBase

load_dotenv()


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="""You are a knowledgeable voice assistant created by LiveKit. 
You have access to a knowledge base that contains specific information about various topics. 
When answering questions, you should:
1. Use information from the knowledge base when relevant
2. Clearly indicate when you're providing information from the knowledge base
3. Be conversational and natural in your speech
4. If you don't have information in the knowledge base about something, you can still use your general knowledge
5. Keep responses concise and suitable for voice interaction

Remember, you're having a voice conversation, so avoid lengthy responses or complex formatting.""")


def create_deepgram_stt_with_retry(max_retries=3, base_delay=1.0):
    """Create Deepgram STT instance with retry logic and error handling"""
    
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_key:
        logger.error("❌ DEEPGRAM_API_KEY not found in environment variables")
        raise ValueError("DEEPGRAM_API_KEY is required")
    
    logger.info(f"🎤 Initializing Deepgram STT with API key: {deepgram_key[:10]}...")
    
    for attempt in range(max_retries):
        try:
            # Create Deepgram STT instance
            stt = deepgram.STT(
                model="nova-2",  # Use the latest model
                language="en",
                punctuate=True,
                diarize=False,
                smart_format=True,
                interim_results=True,
                utterance_end_ms=1000,
                vad_events=True,
            )
            
            logger.info("✅ Deepgram STT instance created successfully")
            return stt
            
        except Exception as e:
            logger.error(f"❌ Attempt {attempt + 1}/{max_retries} failed to create Deepgram STT: {e}")
            
            if attempt == max_retries - 1:
                logger.error("❌ All attempts to create Deepgram STT failed")
                raise Exception(f"Failed to initialize Deepgram STT after {max_retries} attempts: {e}")
            
            # Exponential backoff
            delay = base_delay * (2 ** attempt)
            logger.info(f"⏳ Retrying in {delay} seconds...")
            time.sleep(delay)
    
    # This should never be reached, but just in case
    raise Exception("Failed to create Deepgram STT instance")


def prewarm(proc: JobProcess):
    # preload models when process starts to speed up first interaction
    proc.userdata["vad"] = silero.VAD.load()
    
    # Initialize knowledge base
    proc.userdata["knowledge_base"] = KnowledgeBase()

    # fetch cartesia voices
    headers = {
        "X-API-Key": os.getenv("CARTESIA_API_KEY", ""),
        "Cartesia-Version": "2024-08-01",
        "Content-Type": "application/json",
    }
    response = requests.get("https://api.cartesia.ai/voices", headers=headers)
    if response.status_code == 200:
        proc.userdata["cartesia_voices"] = response.json()
    else:
        logger.warning(f"Failed to fetch Cartesia voices: {response.status_code}")


async def entrypoint(ctx: JobContext):
    # Get knowledge base instance
    kb: KnowledgeBase = ctx.proc.userdata["knowledge_base"]
    
    cartesia_voices: List[dict[str, Any]] = ctx.proc.userdata["cartesia_voices"]

    # Create Deepgram STT with retry logic and error handling
    try:
        stt = create_deepgram_stt_with_retry()
    except Exception as e:
        logger.error(f"❌ Failed to initialize Deepgram STT: {e}")
        logger.error("❌ Voice agent cannot continue without STT")
        raise e
    
    # Create a custom LLM wrapper that includes RAG
    class RAGEnabledLLM:
        def __init__(self, kb: KnowledgeBase, base_llm):
            self.kb = kb
            self.base_llm = base_llm
        
        async def chat(self, ctx: ChatContext, **kwargs):
            # Get the last user message
            last_user_message = None
            for msg in reversed(ctx.messages):
                if msg.role == "user":
                    last_user_message = msg.content
                    break
            
            # If we have a user message, search the knowledge base
            if last_user_message:
                # Get relevant context from knowledge base
                kb_context = self.kb.get_context_for_query(last_user_message)
                
                if kb_context:
                    # Create a new context with the knowledge base information
                    enhanced_messages = ctx.messages.copy()
                    
                    # Insert knowledge base context before the last user message
                    kb_message = ChatMessage(
                        role="system",
                        content=f"Knowledge Base Context:\n{kb_context}\n\nUse this information to answer the user's question if relevant."
                    )
                    
                    # Find where to insert the KB context (right before the last user message)
                    insert_index = len(enhanced_messages) - 1
                    for i in range(len(enhanced_messages) - 1, -1, -1):
                        if enhanced_messages[i].role == "user":
                            insert_index = i
                            break
                    
                    enhanced_messages.insert(insert_index, kb_message)
                    
                    # Create new context with enhanced messages
                    enhanced_ctx = ChatContext(messages=enhanced_messages)
                    
                    logger.info(f"Added knowledge base context for query: {last_user_message[:50]}...")
                    
                    # Call the base LLM with enhanced context
                    return await self.base_llm.chat(enhanced_ctx, **kwargs)
            
            # If no KB context needed, just use the base LLM
            return await self.base_llm.chat(ctx, **kwargs)
        
        # Delegate other methods to base LLM
        def __getattr__(self, name):
            return getattr(self.base_llm, name)
    
    # Create RAG-enabled LLM
    base_llm = openai.LLM(model="gpt-4o-mini")
    rag_llm = RAGEnabledLLM(kb, base_llm)
    
    # Create the agent session with all components
    session = AgentSession(
        stt=stt,
        llm=rag_llm,
        tts=cartesia.TTS(model="sonic-2"),
        vad=ctx.proc.userdata["vad"],
    )

    # Create the assistant agent
    assistant = Assistant()

    # Start the session
    await session.start(
        room=ctx.room,
        agent=assistant,
    )

    await ctx.connect()

    # Set voice listing as attribute for UI
    voices = []
    for voice in cartesia_voices:
        voices.append(
            {
                "id": voice["id"],
                "name": voice["name"],
            }
        )
    voices.sort(key=lambda x: x["name"])
    await ctx.room.local_participant.set_attributes({"voices": json.dumps(voices)})

    # Generate initial greeting with knowledge base mention
    await session.generate_reply(
        instructions="Greet the user and mention that you have access to a specialized knowledge base. Offer your assistance."
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))