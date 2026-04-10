import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { FilterManifest } from "@/lib/types";
import { FUNDING_STAGES, SECTOR_LIST } from "@/lib/constants";

const MANIFEST_PATH = join(process.cwd(), "public", "filter_manifest.json");

// Fallback manifest with all known controlled values (no countries until ingestion)
const FALLBACK_MANIFEST: FilterManifest = {
  funding_stages: [...FUNDING_STAGES],
  sectors: [...SECTOR_LIST],
  countries: [],
};

export async function GET(_req: NextRequest) {
  try {
    if (existsSync(MANIFEST_PATH)) {
      const raw = readFileSync(MANIFEST_PATH, "utf-8");
      const manifest: FilterManifest = JSON.parse(raw);
      return Response.json(manifest);
    }
    return Response.json(FALLBACK_MANIFEST);
  } catch (err) {
    console.error("/api/filters error:", err);
    return Response.json(FALLBACK_MANIFEST);
  }
}
