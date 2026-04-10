"""
pipeline.py — Orchestrator CLI for the ingestion pipeline.

Usage:
    python pipeline.py \
        --input-dir ./data/pdfs \
        --startup-map ./data/startup_names.csv \
        [--resume] \
        [--concurrency 10]

startup_names.csv format (no header required):
    filename.pdf,Startup Name
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import json
import logging
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from tqdm import tqdm

from config import CACHE_FILE, COLLECTION_NAME, MAX_CHUNK_TOKENS
from enrich import enrich_all
from embed import embed_all
from parse import parse_pdf, chunk_slide
from upload import build_points, upsert_points

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def load_startup_map(csv_path: Path) -> dict[str, str]:
    """Returns {filename: startup_name}."""
    mapping = {}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.reader(f):
            if len(row) >= 2:
                filename, startup_name = row[0].strip(), row[1].strip()
                mapping[filename] = startup_name
    return mapping


def load_cache(cache_path: Path) -> set[str]:
    """Return set of already-processed PDF filenames."""
    done = set()
    if cache_path.exists():
        with open(cache_path, encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    done.add(entry["filename"])
                except Exception:
                    pass
    return done


def save_to_cache(cache_path: Path, filename: str) -> None:
    with open(cache_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"filename": filename}) + "\n")


async def process_pdf(
    pdf_path: Path,
    startup_name: str,
    qdrant_client: QdrantClient,
    concurrency: int,
) -> int:
    """Parse, enrich, embed, and upsert one PDF. Returns number of points uploaded."""
    logger.info("Processing: %s (%s)", pdf_path.name, startup_name)

    # 1. Parse
    slides = parse_pdf(pdf_path)
    if not slides:
        logger.warning("No slides extracted from %s", pdf_path.name)
        return 0

    # 2. Chunk (with size guard)
    chunks: list[dict] = []
    for slide in slides:
        chunks.extend(chunk_slide(slide, startup_name, max_tokens=MAX_CHUNK_TOKENS))

    # 3. Enrich
    enrichments = await enrich_all(chunks, concurrency=concurrency)

    # 4. Embed
    texts = [e.embedding_text for e in enrichments]
    vectors = await embed_all(texts, concurrency=concurrency * 2)

    # 5. Build + upsert
    points = build_points(chunks, enrichments, vectors, pdf_path.name)
    upsert_points(qdrant_client, points)

    return len(points)


async def main(args: argparse.Namespace) -> None:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])

    qdrant = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ.get("QDRANT_API_KEY"),
    )

    input_dir = Path(args.input_dir)
    startup_map = load_startup_map(Path(args.startup_map))
    cache_path = Path(CACHE_FILE)
    done = load_cache(cache_path) if args.resume else set()

    pdf_files = sorted(input_dir.glob("*.pdf"))
    total = 0

    for pdf_path in tqdm(pdf_files, desc="PDFs"):
        filename = pdf_path.name
        if filename not in startup_map:
            logger.warning("No startup name for %s — skipping", filename)
            continue
        if filename in done:
            logger.debug("Skipping (cached): %s", filename)
            continue

        startup_name = startup_map[filename]
        try:
            count = await process_pdf(pdf_path, startup_name, qdrant, args.concurrency)
            total += count
            save_to_cache(cache_path, filename)
            logger.info("Done: %s → %d points", filename, count)
        except Exception as exc:
            logger.error("Failed: %s — %s", filename, exc)

    logger.info("Ingestion complete. Total points upserted: %d", total)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Startup KB ingestion pipeline")
    parser.add_argument("--input-dir", required=True, help="Directory containing PDFs")
    parser.add_argument("--startup-map", required=True, help="CSV mapping filename to startup name")
    parser.add_argument("--resume", action="store_true", help="Skip already-processed files")
    parser.add_argument("--concurrency", type=int, default=10, help="Async concurrency limit")
    args = parser.parse_args()
    asyncio.run(main(args))
