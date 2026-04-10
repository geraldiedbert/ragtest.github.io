"""
embed.py — Batch embed texts using Gemini text-embedding-004.

Uses synchronous calls wrapped in asyncio.to_thread for concurrency.
"""
from __future__ import annotations

import asyncio
import logging

import google.generativeai as genai

from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)


async def _embed_one(
    model: genai.GenerativeModel,
    text: str,
    semaphore: asyncio.Semaphore,
) -> list[float]:
    async with semaphore:
        try:
            result = await asyncio.to_thread(model.embed_content, text)
            return result["embedding"]
        except Exception as exc:
            logger.error("Embedding failed: %s", exc)
            return []


async def embed_all(
    texts: list[str],
    concurrency: int = 20,
) -> list[list[float]]:
    """Embed all texts concurrently. Returns a list of float vectors."""
    model = genai.GenerativeModel(EMBEDDING_MODEL)
    semaphore = asyncio.Semaphore(concurrency)
    tasks = [_embed_one(model, t, semaphore) for t in texts]
    return await asyncio.gather(*tasks)


def embed_sync(texts: list[str], concurrency: int = 20) -> list[list[float]]:
    """Synchronous wrapper for embed_all."""
    return asyncio.run(embed_all(texts, concurrency))
