"use client";

import { StartupCard } from "./StartupCard";
import type { StartupResult } from "@/lib/types";

interface Props {
  results: StartupResult[];
  loading: boolean;
  query: string;
  error: string | null;
}

export function ResultsGrid({ results, loading, query, error }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm">Type a query to search the startup knowledge base</p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-sm">No startups found for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-gray-400">{results.length} startups found</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((r) => (
          <StartupCard key={r.startup_name} result={r} />
        ))}
      </div>
    </div>
  );
}
