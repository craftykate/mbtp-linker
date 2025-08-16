export type CacheState = "HIT" | "MISS" | "STALE" | null;

export type LogCategory = "event" | "error" | "perf" | "audit";
export type Severity = "info" | "warn" | "error" | "critical";

export type EventName =
  | "dictionary_lookup"
  | "link_suffix_submit"
  | "link_click"
  | "unknown";
