"use client";

import type { CacheState } from "@/types/logging";

export type EventName =
  | "dictionary_lookup"
  | "link_suffix_submit"
  | "link_click"
  | "unknown";

type CacheHit = Extract<CacheState, "HIT" | "STALE">;

async function sendEvent(body: {
  event: EventName;
  data: Record<string, unknown>;
  cache: CacheHit | null;
  client_ts: number;
  eventId?: string;
}) {
  const json = JSON.stringify(body);
  const blob = new Blob([json], { type: "application/json" });

  // Try beacon for unload safety; fall back to fetch
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const ok: boolean = navigator.sendBeacon("/api/event", blob);
    if (ok) return;
  }

  await fetch("/api/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json,
    keepalive: true,
    cache: "no-store",
  });
}

export async function logCacheHit(
  cacheState: CacheState,
  event: EventName,
  data: Record<string, unknown>,
  opts?: { eventId?: string; always?: boolean }
): Promise<void> {
  const hit = cacheState === "HIT" || cacheState === "STALE";
  if (!hit && !opts?.always) return;

  await sendEvent({
    event,
    data,
    cache: hit ? (cacheState as Extract<CacheState, "HIT" | "STALE">) : null,
    client_ts: Date.now(),
    eventId: opts?.eventId,
  });
}

/** Generic UI logger (no cache semantics). */
export async function logUi(
  event: EventName,
  data: Record<string, unknown>,
  opts?: { eventId?: string }
): Promise<void> {
  await sendEvent({
    event,
    data,
    cache: null,
    client_ts: Date.now(),
    eventId: opts?.eventId,
  });
}
