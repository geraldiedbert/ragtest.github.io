"""
upload.py — Upsert enriched, embedded chunks to Qdrant.

Uses deterministic UUIDs so re-runs are safe (upsert = idempotent).
"""
from __future__ import annotations

import hashlib
import uuid
import logging

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from config import COLLECTION_NAME

logger = logging.getLogger(__name__)


def make_point_id(startup_name: str, pdf_filename: str, page_number: int, sub_index: int = 0) -> str:
    """Deterministic UUID from (startup_name, filename, page, sub_index)."""
    key = f"{startup_name}|{pdf_filename}|{page_number}|{sub_index}"
    return str(uuid.UUID(bytes=hashlib.md5(key.encode()).digest()))


def build_points(
    chunks: list[dict],
    enrichments: list,
    vectors: list[list[float]],
    pdf_filename: str,
) -> list[PointStruct]:
    points = []
    for chunk, enrichment, vector in zip(chunks, enrichments, vectors):
        if not vector:
            logger.warning(
                "Skipping chunk (page %s) — empty embedding vector",
                chunk.get("page_number"),
            )
            continue

        point_id = make_point_id(
            chunk["startup_name"],
            pdf_filename,
            chunk["page_number"],
            chunk.get("sub_index", 0),
        )

        payload = {
            "startup_name": chunk["startup_name"],
            "sector": enrichment.sector,
            "slide_type": enrichment.slide_type,
            "funding_stage": enrichment.funding_stage,
            "country": enrichment.country,
            "section_heading": chunk.get("section_heading", ""),
            "prev_slide_title": chunk.get("prev_slide_title", ""),
            "page_number": chunk["page_number"],
            "embedding_text": enrichment.embedding_text,
            "original_text": chunk.get("original_text", ""),
        }

        points.append(PointStruct(id=point_id, vector=vector, payload=payload))

    return points


def upsert_points(client: QdrantClient, points: list[PointStruct], batch_size: int = 100) -> None:
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=COLLECTION_NAME, points=batch)
        logger.info("Upserted batch %d–%d", i, i + len(batch))
