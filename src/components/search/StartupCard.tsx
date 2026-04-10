"use client";

import { FUNDING_STAGE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import type { StartupResult } from "@/lib/types";

interface Props {
  result: StartupResult;
}

export function StartupCard({ result }: Props) {
  const { representative_slide: s, best_score, slide_count } = result;
  const displayedSectors = s.sector.slice(0, 3);
  const extraSectors = s.sector.length - displayedSectors.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-snug">
          {s.startup_name}
        </h3>
        <span className="shrink-0 text-xs text-gray-400 tabular-nums">
          {(best_score * 100).toFixed(0)}%
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {s.country && s.country !== "unknown" && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {s.country}
          </span>
        )}
        {s.funding_stage && s.funding_stage !== "unknown" && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            {FUNDING_STAGE_LABELS[s.funding_stage] ?? s.funding_stage}
          </span>
        )}
      </div>

      {/* Sector tags */}
      {displayedSectors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayedSectors.map((sec) => (
            <span
              key={sec}
              className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
            >
              {SECTOR_LABELS[sec] ?? sec.replace(/_/g, " ")}
            </span>
          ))}
          {extraSectors > 0 && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{extraSectors} more
            </span>
          )}
        </div>
      )}

      {/* Snippet */}
      {s.embedding_text && (
        <p className="line-clamp-3 text-sm text-gray-600">{s.embedding_text}</p>
      )}

      {/* Footer */}
      {slide_count > 1 && (
        <p className="text-xs text-gray-400">{slide_count} slides matched</p>
      )}
    </div>
  );
}
