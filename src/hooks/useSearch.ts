"use client";

import { useEffect, useState, useRef } from "react";
import type { FilterState, StartupResult } from "@/lib/types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [results, setResults] = useState<StartupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 400);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: debouncedQuery, filters }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResults(data.results ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message ?? "Search failed");
          setResults([]);
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, filters]);

  return { query, setQuery, filters, setFilters, results, loading, error };
}
