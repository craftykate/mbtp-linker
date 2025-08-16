// Front end call to API define endpoint
// Return data, cache state, and response
// Throw error if non-OK

"use client";

export type CacheState = "HIT" | "MISS" | "STALE" | null;

// Keep in sync with your API type
export type DefineResult = {
  word: string;
  entries: Array<{
    fl: string;
    definitions: string[];
    pronunciation?: { mw?: string; audioUrl?: string };
    examples: string[];
    etymologies: string[];
  }>;
  synonymsByPartOfSpeech: Array<{ fl: string; synonyms: string[] }>;
  suggestions: string[];
};

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
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = ct.includes("application/json")
        ? await res.json()
        : await res.text();
      if (typeof body === "string") msg = body || msg;
      else if (body?.message || body?.error)
        msg = String(body.message ?? body.error);
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(msg, res.status);
  }

  const data: DefineResult = await res.json();
  return { data, cache, response: res };
}
