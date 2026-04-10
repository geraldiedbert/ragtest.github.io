export type SlideType =
  | "problem"
  | "solution"
  | "market"
  | "traction"
  | "team"
  | "ask"
  | "other";

export type FundingStage =
  | "pre_seed"
  | "seed"
  | "series_a"
  | "series_b"
  | "unknown";

export interface SlidePayload {
  startup_name: string;
  sector: string[];
  slide_type: SlideType;
  funding_stage: FundingStage;
  country: string;
  section_heading: string;
  prev_slide_title: string;
  page_number: number;
  embedding_text: string;
  original_text: string;
}

export interface SearchHit {
  id: string;
  score: number;
  payload: SlidePayload;
}

export interface StartupResult {
  startup_name: string;
  best_score: number;
  representative_slide: SlidePayload;
  matched_slides: SlidePayload[];
  slide_count: number;
}

export interface FilterState {
  funding_stage?: string[];
  sector?: string[];
  country?: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface FilterManifest {
  funding_stages: string[];
  sectors: string[];
  countries: string[];
}
