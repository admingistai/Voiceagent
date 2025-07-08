import asyncio
import json
import os
import requests

from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, JobProcess
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.agents.log import logger
from livekit.plugins import deepgram, silero, cartesia, openai
from typing import List, Any

from dotenv import load_dotenv
from knowledge_base import KnowledgeBase

load_dotenv()


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
    
    # Enhanced system prompt that references the knowledge base
    initial_ctx = ChatContext(
        messages=[
            ChatMessage(
                role="system",
                content="""You are a knowledgeable voice assistant created by LiveKit. 
You have access to a knowledge base that contains specific information about various topics. 
When answering questions, you should:
1. Use information from the knowledge base when relevant
2. Clearly indicate when you're providing information from the knowledge base
3. Be conversational and natural in your speech
4. If you don't have information in the knowledge base about something, you can still use your general knowledge
5. Keep responses concise and suitable for voice interaction

Remember, you're having a voice conversation, so avoid lengthy responses or complex formatting.""",
            )
        ]
    )
    
    cartesia_voices: List[dict[str, Any]] = ctx.proc.userdata["cartesia_voices"]

    tts = cartesia.TTS(
        model="sonic-2",
    )
    
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
    
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=rag_llm,
        tts=tts,
        chat_ctx=initial_ctx,
    )

    is_user_speaking = False
    is_agent_speaking = False

    @ctx.room.on("participant_attributes_changed")
    def on_participant_attributes_changed(
        changed_attributes: dict[str, str], participant: rtc.Participant
    ):
        # check for attribute changes from the user itself
        if participant.kind != rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD:
            return

        if "voice" in changed_attributes:
            voice_id = participant.attributes.get("voice")
            logger.info(
                f"participant {participant.identity} requested voice change: {voice_id}"
            )
            if not voice_id:
                return

            voice_data = next(
                (voice for voice in cartesia_voices if voice["id"] == voice_id), None
            )
            if not voice_data:
                logger.warning(f"Voice {voice_id} not found")
                return
            if "embedding" in voice_data:
                language = "en"
                if "language" in voice_data and voice_data["language"] != "en":
                    language = voice_data["language"]
                tts._opts.voice = voice_data["embedding"]
                tts._opts.language = language
                # allow user to confirm voice change as long as no one is speaking
                if not (is_agent_speaking or is_user_speaking):
                    asyncio.create_task(
                        agent.say("How do I sound now?", allow_interruptions=True)
                    )

    await ctx.connect()

    @agent.on("agent_started_speaking")
    def agent_started_speaking():
        nonlocal is_agent_speaking
        is_agent_speaking = True

    @agent.on("agent_stopped_speaking")
    def agent_stopped_speaking():
        nonlocal is_agent_speaking
        is_agent_speaking = False

    @agent.on("user_started_speaking")
    def user_started_speaking():
        nonlocal is_user_speaking
        is_user_speaking = True

    @agent.on("user_stopped_speaking")
    def user_stopped_speaking():
        nonlocal is_user_speaking
        is_user_speaking = False

    # set voice listing as attribute for UI
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

    agent.start(ctx.room)
    
    # Modified greeting to mention knowledge base
    await agent.say(
        "Hi there! I'm your AI assistant with access to a specialized knowledge base. How can I help you today?", 
        allow_interruptions=True
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))