"""
enrich.py — Call Gemini Flash to classify slide metadata and generate embedding_text.

Runs asynchronously with a semaphore to respect rate limits.
Validates output with Pydantic; falls back to safe defaults on failure.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

import google.generativeai as genai
from pydantic import BaseModel, field_validator

from config import ENRICHMENT_MODEL, SECTOR_LIST, SLIDE_TYPES, FUNDING_STAGES

logger = logging.getLogger(__name__)

SECTOR_CSV = ", ".join(SECTOR_LIST)
SLIDE_TYPE_CSV = ", ".join(SLIDE_TYPES)
FUNDING_STAGE_CSV = ", ".join(FUNDING_STAGES)

ENRICHMENT_PROMPT_TEMPLATE = """You are a structured data extractor for startup pitch deck slides.

Return ONLY valid JSON with exactly these fields — no markdown fences, no explanation.

CONTROLLED VOCABULARY (use ONLY these values):

sector: pick 1 to 3 that apply — {sector_list}
slide_type: pick exactly 1 — {slide_types}
funding_stage: pick exactly 1 — {funding_stages}
country: startup HQ country as a plain English name (e.g. "Germany"). Infer from context. Return "unknown" if unclear.
embedding_text: 2–4 plain-language sentences in third person. Include startup name, what it does, and what problem it addresses. Do NOT invent facts not present in the slide.

INPUT:
STARTUP_NAME: {startup_name}
PREV_SLIDE_TITLE: {prev_slide_title}
SLIDE_CONTENT:
{original_text}

OUTPUT (JSON only):
{{
  "sector": ["..."],
  "slide_type": "...",
  "funding_stage": "...",
  "country": "...",
  "embedding_text": "..."
}}"""


class EnrichmentResult(BaseModel):
    sector: list[str]
    slide_type: str
    funding_stage: str
    country: str
    embedding_text: str

    @field_validator("sector")
    @classmethod
    def validate_sectors(cls, v: list[str]) -> list[str]:
        valid = [s for s in v if s in SECTOR_LIST]
        return valid if valid else ["other"]

    @field_validator("slide_type")
    @classmethod
    def validate_slide_type(cls, v: str) -> str:
        return v if v in SLIDE_TYPES else "other"

    @field_validator("funding_stage")
    @classmethod
    def validate_funding_stage(cls, v: str) -> str:
        return v if v in FUNDING_STAGES else "unknown"


FALLBACK = EnrichmentResult(
    sector=["other"],
    slide_type="other",
    funding_stage="unknown",
    country="unknown",
    embedding_text="",
)


def _build_prompt(chunk: dict) -> str:
    return ENRICHMENT_PROMPT_TEMPLATE.format(
        sector_list=SECTOR_CSV,
        slide_types=SLIDE_TYPE_CSV,
        funding_stages=FUNDING_STAGE_CSV,
        startup_name=chunk["startup_name"],
        prev_slide_title=chunk.get("prev_slide_title", ""),
        original_text=chunk.get("original_text", "")[:3000],  # hard cap
    )


def _parse_response(text: str, chunk: dict) -> EnrichmentResult:
    try:
        data = json.loads(text)
        result = EnrichmentResult(**data)
        # If embedding_text is empty, fall back to a minimal version
        if not result.embedding_text.strip():
            result.embedding_text = (
                f"{chunk['startup_name']}. "
                + chunk.get("original_text", "")[:300]
            )
        return result
    except Exception as exc:
        logger.warning("Enrichment parse failed: %s — using fallback", exc)
        fallback = FALLBACK.model_copy()
        fallback.embedding_text = (
            f"{chunk['startup_name']}. "
            + chunk.get("original_text", "")[:300]
        )
        return fallback


async def _enrich_one(
    model: genai.GenerativeModel,
    chunk: dict,
    semaphore: asyncio.Semaphore,
    retry: bool = True,
) -> EnrichmentResult:
    prompt = _build_prompt(chunk)
    async with semaphore:
        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            return _parse_response(response.text, chunk)
        except Exception as exc:
            if retry:
                logger.warning("Enrichment failed (%s), retrying once…", exc)
                await asyncio.sleep(2)
                return await _enrich_one(model, chunk, semaphore, retry=False)
            logger.error("Enrichment permanently failed: %s", exc)
            fallback = FALLBACK.model_copy()
            fallback.embedding_text = (
                f"{chunk['startup_name']}. "
                + chunk.get("original_text", "")[:300]
            )
            return fallback


async def enrich_all(
    chunks: list[dict],
    concurrency: int = 10,
) -> list[EnrichmentResult]:
    """Enrich all chunks concurrently, respecting the concurrency limit."""
    model = genai.GenerativeModel(ENRICHMENT_MODEL)
    semaphore = asyncio.Semaphore(concurrency)
    tasks = [_enrich_one(model, chunk, semaphore) for chunk in chunks]
    return await asyncio.gather(*tasks)
