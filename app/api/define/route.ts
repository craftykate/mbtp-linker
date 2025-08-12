// ---------- Cache settings ----------
export const revalidate = 60 * 60 * 24 * 30; // 30 days: Next.js Full Route Cache (per URL)
const ROUTE_TTL = 60 * 60 * 24 * 30; // 30 days: CDN s-maxage
const ROUTE_SWR = 60 * 60 * 24 * 180; // 180 days: stale-while-revalidate at CDN
const UPSTREAM_TTL = 60 * 60 * 24 * 180; // 180 days: Next Data Cache for MW fetches
// If you ever want a tiny browser cache, add: const BROWSER_TTL = 60 * 5;
// and include max-age in Cache-Control.

// ---------- Types ----------
type ApiResult = {
  word: string;
  entries: Array<{
    fl: string;
    definitions: string[];
    pronunciation?: { mw?: string; audioUrl?: string };
  }>;
  synonymsByPartOfSpeech: Array<{ fl: string; synonyms: string[] }>;
  suggestions: string[];
};

// ---- Minimal MW shapes we use ----
type MWPron = { mw?: unknown; sound?: { audio?: unknown } };
type MWDictEntry = {
  fl?: unknown; // part of speech
  shortdef?: unknown; // string[]
  meta?: { id?: unknown } | unknown;
  hwi?: { prs?: unknown }; // pronunciations (array of MWPron)
};

type MWThesEntry = {
  fl?: unknown; // part of speech
  def?: Array<{ sseq?: unknown }>;
};

// ---- Tiny guards/utilities ----
const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isString = (x: unknown): x is string => typeof x === "string";
const isStringArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every(isString);

const isMWDictEntry = (x: unknown): x is MWDictEntry => isObject(x);
const isMWThesEntry = (x: unknown): x is MWThesEntry => isObject(x);

const isMWDictEntryArray = (x: unknown): x is MWDictEntry[] =>
  Array.isArray(x) && x.every(isMWDictEntry);

const isMWThesEntryArray = (x: unknown): x is MWThesEntry[] =>
  Array.isArray(x) && x.every(isMWThesEntry);

// Build Merriam-Webster audio URL from token per their folder rules
function audioUrlFromToken(token: string): string {
  const folder = token.startsWith("bix")
    ? "bix"
    : token.startsWith("gg")
    ? "gg"
    : /^\d/.test(token)
    ? "number"
    : token[0];
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${folder}/${token}.mp3`;
}

// First usable pronunciation on an entry (respelling + audio URL)
function firstPron(
  e: MWDictEntry
): { mw?: string; audioUrl?: string } | undefined {
  const prs = (e.hwi as { prs?: unknown } | undefined)?.prs;
  if (!Array.isArray(prs)) return undefined;

  for (const p of prs as MWPron[]) {
    const mwRaw = (p as { mw?: unknown }).mw;
    const tokenRaw = (p as { sound?: { audio?: unknown } }).sound?.audio;

    const mw = isString(mwRaw) ? mwRaw : undefined;
    const audioUrl = isString(tokenRaw)
      ? audioUrlFromToken(tokenRaw)
      : undefined;

    if (mw || audioUrl) return { mw, audioUrl };
  }
  return undefined;
}

// ---- Dictionary: collect ALL shortdefs grouped by POS + pronunciation ----
function extractAllDefsByPOS(json: unknown): Array<{
  fl: string;
  definitions: string[];
  pronunciation?: { mw?: string; audioUrl?: string };
}> {
  if (!isMWDictEntryArray(json)) return [];

  // Group by POS, but capture the first available pronunciation per POS
  const byPOS = new Map<
    string,
    {
      definitions: string[];
      pronunciation?: { mw?: string; audioUrl?: string };
    }
  >();

  for (const e of json) {
    const flVal = isString((e as { fl?: unknown }).fl)
      ? ((e as { fl?: unknown }).fl as string)
      : null;
    const sdVal = (e as { shortdef?: unknown }).shortdef;

    if (!flVal || !isStringArray(sdVal)) continue;

    const bucket = byPOS.get(flVal) ?? { definitions: [] as string[] };

    // Merge unique definitions
    for (const d of sdVal) {
      if (!bucket.definitions.includes(d)) bucket.definitions.push(d);
    }

    // Set pronunciation once per POS (first entry with audio/respelling wins)
    if (!bucket.pronunciation) {
      const pron = firstPron(e);
      if (pron) bucket.pronunciation = pron;
    }

    byPOS.set(flVal, bucket);
  }

  return Array.from(byPOS, ([fl, { definitions, pronunciation }]) => ({
    fl,
    definitions,
    pronunciation,
  }));
}

// ---- Thesaurus: collect synonyms grouped by part of speech ----
function extractSynonymsByPOS(
  json: unknown
): Array<{ fl: string; synonyms: string[] }> {
  if (!isMWThesEntryArray(json)) return [];

  const out: Array<{ fl: string; synonyms: string[] }> = [];

  for (const entry of json) {
    const flVal = isString((entry as { fl?: unknown }).fl)
      ? ((entry as { fl?: unknown }).fl as string)
      : null;
    if (!flVal) continue;

    const synonyms = new Set<string>();

    // Primary path: def[*].sseq -> ... -> syn_list: Array<Array<{ wd: string }>>
    const defs = (entry as { def?: Array<{ sseq?: unknown }> }).def;
    if (Array.isArray(defs)) {
      for (const d of defs) {
        const sseq = d?.sseq;
        if (!Array.isArray(sseq)) continue;
        for (const s of sseq) {
          if (!Array.isArray(s)) continue;
          for (const maybePair of s) {
            if (
              Array.isArray(maybePair) &&
              maybePair.length >= 2 &&
              isObject(maybePair[1])
            ) {
              const synList = (maybePair[1] as { syn_list?: unknown }).syn_list;
              if (
                Array.isArray(synList) &&
                synList.every(
                  (group) =>
                    Array.isArray(group) &&
                    group.every((item) => isObject(item))
                )
              ) {
                for (const group of synList as unknown[]) {
                  for (const item of group as Array<{ wd?: unknown }>) {
                    const wd = item?.wd;
                    if (isString(wd)) synonyms.add(wd);
                  }
                }
              }
            }
          }
        }
      }
    }

    const list = Array.from(synonyms);
    if (list.length) out.push({ fl: flVal, synonyms: list });
  }

  return out;
}

// ---- Suggestions: array of strings when no entry matches ----
function extractSuggestions(json: unknown, limit = 5): string[] {
  return isStringArray(json) ? json.slice(0, limit) : [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qOriginal = url.searchParams.get("q")?.trim();
  const nocache = url.searchParams.get("nocache") === "1";
  if (!qOriginal) return new Response("Missing q", { status: 400 });

  // Normalize for upstream/cache key while preserving original for display
  const qNormalized = qOriginal.toLowerCase();

  console.info(
    JSON.stringify({
      event: "define_lookup",
      word: qOriginal,
      normalized: qNormalized,
      ts: new Date().toISOString(),
    })
  );

  const dictKey = process.env.MW_INTERMEDIATE_DICT_KEY;
  const thesKey = process.env.MW_INTERMEDIATE_THES_KEY;
  if (!dictKey || !thesKey)
    return new Response("Missing MW keys", { status: 500 });

  // Upstream fetch caching
  const fetchOpts = nocache
    ? { cache: "no-store" as const }
    : { cache: "force-cache" as const, next: { revalidate: UPSTREAM_TTL } };

  const [dRes, tRes] = await Promise.all([
    fetch(
      `https://www.dictionaryapi.com/api/v3/references/sd3/json/${encodeURIComponent(
        qNormalized
      )}?key=${dictKey}`,
      fetchOpts
    ),
    fetch(
      `https://www.dictionaryapi.com/api/v3/references/ithesaurus/json/${encodeURIComponent(
        qNormalized
      )}?key=${thesKey}`,
      fetchOpts
    ),
  ]);

  if (!dRes.ok || !tRes.ok) {
    const status = !dRes.ok ? dRes.status : tRes.status;
    return new Response(`Upstream error ${status}`, { status });
  }

  const dictJson: unknown = await dRes.json();
  const thesJson: unknown = await tRes.json();

  const entries = extractAllDefsByPOS(dictJson);
  const synonymsByPartOfSpeech = extractSynonymsByPOS(thesJson);
  const suggestions = extractSuggestions(dictJson);

  const payload: ApiResult = {
    word: qOriginal, // preserve user’s casing for display
    entries,
    synonymsByPartOfSpeech,
    suggestions,
  };

  // CDN / Edge cache headers (no long browser cache by default)
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": nocache
      ? "no-store"
      : `public, s-maxage=${ROUTE_TTL}, stale-while-revalidate=${ROUTE_SWR}`,
    // If you ever enable small browser caching:
    // "Cache-Control": `public, max-age=${BROWSER_TTL}, s-maxage=${ROUTE_TTL}, stale-while-revalidate=${ROUTE_SWR}`,
  });

  return new Response(JSON.stringify(payload), { headers });
}
