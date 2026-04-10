import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_COLLECTION } from "./constants";
import type { SlidePayload, StartupResult, FilterState } from "./types";

let _client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!_client) {
    _client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    });
  }
  return _client;
}

function buildFilter(filters?: FilterState) {
  const must: object[] = [];
  if (filters?.funding_stage?.length) {
    must.push({ key: "funding_stage", match: { any: filters.funding_stage } });
  }
  if (filters?.country?.length) {
    must.push({ key: "country", match: { any: filters.country } });
  }
  if (filters?.sector?.length) {
    must.push({ key: "sector", match: { any: filters.sector } });
  }
  return must.length > 0 ? { must } : undefined;
}

function groupByStartup(
  hits: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>
): StartupResult[] {
  const map = new Map<string, StartupResult>();

  for (const hit of hits) {
    const payload = hit.payload as unknown as SlidePayload;
    if (!payload?.startup_name) continue;
    const name = payload.startup_name;

    const existing = map.get(name);
    if (!existing) {
      map.set(name, {
        startup_name: name,
        best_score: hit.score,
        representative_slide: payload,
        matched_slides: [payload],
        slide_count: 1,
      });
    } else {
      existing.matched_slides.push(payload);
      existing.slide_count++;
      if (hit.score > existing.best_score) {
        existing.best_score = hit.score;
        existing.representative_slide = payload;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.best_score - a.best_score);
}

export async function semanticSearch(
  vector: number[],
  filters?: FilterState,
  limit = 20
): Promise<StartupResult[]> {
  const client = getQdrantClient();
  const hits = await client.search(QDRANT_COLLECTION, {
    vector,
    limit: limit * 3,
    filter: buildFilter(filters),
    with_payload: true,
  });
  const grouped = groupByStartup(hits);
  return grouped.slice(0, limit);
}

export async function lookupByName(
  startupName: string
): Promise<SlidePayload[]> {
  const client = getQdrantClient();
  const result = await client.scroll(QDRANT_COLLECTION, {
    filter: { must: [{ key: "startup_name", match: { value: startupName } }] },
    with_payload: true,
    limit: 100,
  });
  const slides = (result.points ?? []).map(
    (p) => p.payload as unknown as SlidePayload
  );
  return slides.sort((a, b) => a.page_number - b.page_number);
}
