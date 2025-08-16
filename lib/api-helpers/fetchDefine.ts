"use client";

import type { DefineResult } from "@/types/dictionary";

export type CacheState = "HIT" | "MISS" | "STALE" | null;

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
  q: string
): Promise<{ data: DefineResult; cache: CacheState; response: Response }> {
  const res = await fetch(`/api/define?q=${encodeURIComponent(q)}`);
  const cache = cacheHeader(res);

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.toLowerCase().includes("json");

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = isJson ? await res.json() : await res.text();
      if (typeof body === "string") {
        msg = body || msg;
      } else if (
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
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(msg, res.status);
  }

  const data: DefineResult = await res.json();
  return { data, cache, response: res };
}
