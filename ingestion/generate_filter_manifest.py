"""
generate_filter_manifest.py — Scroll all Qdrant payloads and aggregate
distinct filter values into public/filter_manifest.json.

Run this after ingestion is complete. Commit the output file to the repo.

Usage:
    python generate_filter_manifest.py [--output ../public/filter_manifest.json]
"""
from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from tqdm import tqdm

from config import COLLECTION_NAME, FUNDING_STAGES, SECTOR_LIST

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def generate(client: QdrantClient, output_path: Path) -> None:
    funding_stages: set[str] = set()
    sectors: set[str] = set()
    countries: set[str] = set()

    offset = None
    total = 0

    logger.info("Scrolling collection '%s'…", COLLECTION_NAME)

    with tqdm(desc="Points scrolled") as pbar:
        while True:
            result = client.scroll(
                collection_name=COLLECTION_NAME,
                with_payload=["funding_stage", "sector", "country"],
                limit=500,
                offset=offset,
            )
            points, next_offset = result

            for p in points:
                pl = p.payload or {}
                if fs := pl.get("funding_stage"):
                    funding_stages.add(fs)
                if secs := pl.get("sector"):
                    sectors.update(secs if isinstance(secs, list) else [secs])
                if c := pl.get("country"):
                    if c and c != "unknown":
                        countries.add(c)

            total += len(points)
            pbar.update(len(points))

            if next_offset is None:
                break
            offset = next_offset

    logger.info("Scrolled %d points.", total)

    # Preserve controlled order for funding stages and sectors;
    # sort countries alphabetically.
    manifest = {
        "funding_stages": [s for s in FUNDING_STAGES if s in funding_stages],
        "sectors": [s for s in SECTOR_LIST if s in sectors],
        "countries": sorted(countries),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info(
        "Written: %s (%d stages, %d sectors, %d countries)",
        output_path,
        len(manifest["funding_stages"]),
        len(manifest["sectors"]),
        len(manifest["countries"]),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default="../public/filter_manifest.json",
        help="Output path for filter_manifest.json",
    )
    args = parser.parse_args()

    client = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ.get("QDRANT_API_KEY"),
    )
    generate(client, Path(args.output))
