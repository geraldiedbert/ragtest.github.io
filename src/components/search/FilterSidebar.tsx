"use client";

import { FilterGroup } from "./FilterGroup";
import { FUNDING_STAGE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import type { FilterManifest, FilterState } from "@/lib/types";

interface Props {
  manifest: FilterManifest;
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function FilterSidebar({ manifest, filters, onChange }: Props) {
  const clear = () => onChange({});
  const hasFilters =
    (filters.funding_stage?.length ?? 0) +
      (filters.sector?.length ?? 0) +
      (filters.country?.length ?? 0) >
    0;

  return (
    <aside className="w-56 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        {hasFilters && (
          <button
            onClick={clear}
            className="text-xs text-indigo-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup
        title="Funding Stage"
        options={manifest.funding_stages}
        labels={FUNDING_STAGE_LABELS}
        selected={filters.funding_stage ?? []}
        onChange={(v) => onChange({ ...filters, funding_stage: v })}
      />

      <FilterGroup
        title="Sector"
        options={manifest.sectors}
        labels={SECTOR_LABELS}
        selected={filters.sector ?? []}
        onChange={(v) => onChange({ ...filters, sector: v })}
      />

      <FilterGroup
        title="Country"
        options={manifest.countries}
        selected={filters.country ?? []}
        onChange={(v) => onChange({ ...filters, country: v })}
      />
    </aside>
  );
}
