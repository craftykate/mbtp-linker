"use client";

import type { DefineResult } from "@/types/dictionary";
import {
  LOG_OPT_OUT_COOKIE,
  LOG_OPT_OUT_HEADER,
} from "@/lib/logging/constants";
import { CacheState } from "@/types/logging";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function cacheHeader(res: Response): CacheState {
  const v = res.headers.get("x-vercel-cache");
  return v === "HIT" || v === "MISS" || v === "STALE" ? v : null;
}

/** Fetch a definition, parse JSON, throw typed error on non-OK. */
export async function fetchDefine(
  q: string,
  opts?: { eventId?: string }
): Promise<{ data: DefineResult; cache: CacheState; response: Response }> {
  const qLower = q.toLowerCase(); // ← canonical key
  const headers = new Headers();
  headers.set("x-q-original", q); // keep user casing off-key
  if (opts?.eventId) headers.set("x-event-id", opts.eventId);

  // if opted out, tag request so server can skip MISS logging
  const optedOut =
    typeof document !== "undefined" &&
    document.cookie.split("; ").some((c) => c === `${LOG_OPT_OUT_COOKIE}=1`);
  if (optedOut) headers.set(LOG_OPT_OUT_HEADER, "1");

  const res = await fetch(`/api/define?q=${encodeURIComponent(qLower)}`, {
    headers,
  });
  const cache = cacheHeader(res);

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.toLowerCase().includes("json");

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = isJson ? await res.json() : await res.text();
      if (typeof body === "string") msg = body || msg;
      else if (
        (body as { message?: unknown; error?: unknown })?.message ||
        (body as { message?: unknown; error?: unknown })?.error
      ) {
        const { message, error } = body as {
          message?: unknown;
          error?: unknown;
        };
        msg = String(
          (message as string | undefined) ??
            (error as string | undefined) ??
            msg
        );
      }
    } catch {}
    throw new ApiError(msg, res.status);
  }

  const data: DefineResult = await res.json();
  return { data, cache, response: res };
}
