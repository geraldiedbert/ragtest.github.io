"""Controlled vocabulary and shared constants for the ingestion pipeline.

NOTE: Keep SECTOR_LIST and FUNDING_STAGES in sync with
src/lib/constants.ts in the Next.js project.
"""

COLLECTION_NAME = "startup_pitches"

SECTOR_LIST = [
    "climate_tech",
    "energy_storage",
    "fintech",
    "healthtech",
    "edtech",
    "agritech",
    "logistics",
    "proptech",
    "cybersecurity",
    "ai_ml",
    "saas",
    "marketplace",
    "deeptech",
    "mobility",
    "foodtech",
    "biotech",
    "regtech",
    "hrtech",
    "retail_tech",
    "other",
]

FUNDING_STAGES = ["pre_seed", "seed", "series_a", "series_b", "unknown"]

SLIDE_TYPES = ["problem", "solution", "market", "traction", "team", "ask", "other"]

EMBEDDING_MODEL = "text-embedding-001"
ENRICHMENT_MODEL = "gemini-1.5-flash"

# Gemini text-embedding-004 output dimensions
EMBEDDING_DIM = 768

# Maximum tokens per chunk before falling back to sliding-window sub-chunking
MAX_CHUNK_TOKENS = 1500

# Cache file for resumable ingestion
CACHE_FILE = "ingestion_cache.jsonl"
