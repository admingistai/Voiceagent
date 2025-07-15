import asyncio
import json
import os
import requests

from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, JobProcess, Agent, AgentSession, RoomInputOptions
from livekit.agents.log import logger
from livekit.plugins import deepgram, silero, cartesia, openai
import time
import asyncio
from typing import List, Any

from dotenv import load_dotenv

load_dotenv()


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a voice assistant created by LiveKit. Your interface with users will be voice. Pretend we're having a conversation, no special formatting or headings, just natural speech.")


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
    cartesia_voices: List[dict[str, Any]] = ctx.proc.userdata["cartesia_voices"]

    # Create Deepgram STT with retry logic and error handling
    try:
        stt = create_deepgram_stt_with_retry()
    except Exception as e:
        logger.error(f"❌ Failed to initialize Deepgram STT: {e}")
        logger.error("❌ Voice agent cannot continue without STT")
        raise e
    
    # Create the agent session with all components
    session = AgentSession(
        stt=stt,
        llm=openai.LLM(model="gpt-4o-mini"),
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

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
