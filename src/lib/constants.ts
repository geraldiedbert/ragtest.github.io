export const SECTOR_LIST = [
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
] as const;

export const FUNDING_STAGES = [
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "unknown",
] as const;

export const FUNDING_STAGE_LABELS: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  unknown: "Unknown",
};

export const SECTOR_LABELS: Record<string, string> = {
  climate_tech: "Climate Tech",
  energy_storage: "Energy Storage",
  fintech: "Fintech",
  healthtech: "Healthtech",
  edtech: "Edtech",
  agritech: "Agritech",
  logistics: "Logistics",
  proptech: "Proptech",
  cybersecurity: "Cybersecurity",
  ai_ml: "AI / ML",
  saas: "SaaS",
  marketplace: "Marketplace",
  deeptech: "Deep Tech",
  mobility: "Mobility",
  foodtech: "Foodtech",
  biotech: "Biotech",
  regtech: "Regtech",
  hrtech: "HR Tech",
  retail_tech: "Retail Tech",
  other: "Other",
};

export const QDRANT_COLLECTION = "startup_pitches";
