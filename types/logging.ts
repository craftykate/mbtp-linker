export type CacheState = "HIT" | "MISS" | "STALE" | null;

export type LogCategory = "event" | "error" | "perf" | "audit";
export type Severity = "info" | "warn" | "error" | "critical";

export type EventName =
  | "button_click"
  | "link_suffix_submit"
  | "dictionary_lookup"
  | "link_click"
  | "unknown";
