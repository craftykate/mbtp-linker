"use client";

import type { CacheState } from "@/types/logging";

export type EventName =
  | "dictionary_lookup"
  | "link_suffix_submit"
  | "link_click"
  | "unknown";

type CacheHit = Extract<CacheState, "HIT" | "STALE">;

function isHit(x: CacheState): x is CacheHit {
  return x === "HIT" || x === "STALE";
}

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

/** Log only when CDN served the request (HIT/STALE). */
export async function logCacheHit(
  cacheState: CacheState,
  event: EventName,
  data: Record<string, unknown>,
  opts?: { eventId?: string }
): Promise<void> {
  if (!isHit(cacheState)) return;
  // fire-and-forget at call site if you don’t want to await
  await sendEvent({
    event,
    data,
    cache: cacheState,
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
