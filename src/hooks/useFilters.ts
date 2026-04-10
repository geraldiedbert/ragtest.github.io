"use client";

import { useEffect, useState } from "react";
import type { FilterManifest } from "@/lib/types";

const EMPTY: FilterManifest = { funding_stages: [], sectors: [], countries: [] };

export function useFilters() {
  const [manifest, setManifest] = useState<FilterManifest>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  return { manifest, loading };
}
