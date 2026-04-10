"use client";

import { useSearch } from "@/hooks/useSearch";
import { useFilters } from "@/hooks/useFilters";
import { SearchBar } from "./SearchBar";
import { FilterSidebar } from "./FilterSidebar";
import { ResultsGrid } from "./ResultsGrid";

export function SearchView() {
  const { query, setQuery, filters, setFilters, results, loading, error } =
    useSearch();
  const { manifest } = useFilters();

  return (
    <div className="flex gap-8">
      <FilterSidebar
        manifest={manifest}
        filters={filters}
        onChange={setFilters}
      />

      <div className="min-w-0 flex-1 space-y-5">
        <SearchBar value={query} onChange={setQuery} />
        <ResultsGrid
          results={results}
          loading={loading}
          query={query}
          error={error}
        />
      </div>
    </div>
  );
}
