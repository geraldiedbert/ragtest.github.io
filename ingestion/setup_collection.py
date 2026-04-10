"""
setup_collection.py — One-time Qdrant collection and payload index setup.

Run this BEFORE any ingestion. Safe to re-run (checks if collection exists).

Usage:
    python setup_collection.py
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PayloadSchemaType,
)

from config import COLLECTION_NAME, EMBEDDING_DIM

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PAYLOAD_INDEXES = [
    "startup_name",
    "funding_stage",
    "country",
    "sector",
    "slide_type",
]


def setup(client: QdrantClient) -> None:
    existing = {c.name for c in client.get_collections().collections}

    if COLLECTION_NAME in existing:
        logger.info("Collection '%s' already exists — skipping creation.", COLLECTION_NAME)
    else:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE,
            ),
        )
        logger.info("Created collection '%s' (%dd, Cosine).", COLLECTION_NAME, EMBEDDING_DIM)

    # Create keyword payload indexes for all filterable fields
    for field_name in PAYLOAD_INDEXES:
        try:
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name=field_name,
                field_schema=PayloadSchemaType.KEYWORD,
            )
            logger.info("Created payload index: %s", field_name)
        except Exception as exc:
            # Index already exists — safe to ignore
            logger.debug("Index '%s' skipped: %s", field_name, exc)

    logger.info("Setup complete.")


if __name__ == "__main__":
    client = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ.get("QDRANT_API_KEY"),
    )
    setup(client)
