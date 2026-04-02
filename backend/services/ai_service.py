"""
HireMind — AI Service
Wrapper around OpenAI (or any OpenAI-compatible LLM).
Swap the base_url to use local models (Ollama, LM Studio, etc.)
"""

import json
import httpx
from openai import AsyncOpenAI
from core.config import settings

# Initialise async client — swap base_url for local models
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    # base_url="http://localhost:11434/v1",  # ← uncomment for Ollama
)


async def chat_completion(prompt: str, system: str = "", temperature: float = 0.7) -> str:
    """
    Generic chat completion wrapper.
    Returns the raw text content from the LLM.
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""


async def json_completion(prompt: str, system: str = "") -> dict:
    """
    Like chat_completion but enforces JSON output mode
    and parses the result into a Python dict.
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


async def get_embedding(text: str) -> list[float]:
    """Generate a text embedding for FAISS storage / retrieval."""
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding


async def generate_question(prompt: str) -> str:
    """Convenience wrapper for question generation."""
    return await chat_completion(prompt, temperature=0.8)


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribe voice input using Whisper.
    audio_bytes — raw audio data from the browser
    """
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
    )
    return transcript.text
