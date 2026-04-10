import { NextRequest } from "next/server";
import { embedQuery } from "@/lib/gemini";
import { semanticSearch } from "@/lib/qdrant";
import type { FilterState } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filters, limit = 20 }: { query: string; filters?: FilterState; limit?: number } = body;

    if (!query?.trim()) {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    const vector = await embedQuery(query);
    const results = await semanticSearch(vector, filters, limit);

    return Response.json({ results, total_hits: results.length });
  } catch (err) {
    console.error("/api/search error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
