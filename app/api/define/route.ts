// ---------- Cache settings (literals for Next config) ----------
export const revalidate = 2_592_000; // 30 days: Full Route Cache
const ROUTE_TTL = 60 * 60 * 24 * 30; // 30d CDN s-maxage
const ROUTE_SWR = 60 * 60 * 24 * 180; // 180d CDN SWR
const UPSTREAM_TTL = 60 * 60 * 24 * 180; // 180d Data Cache for MW fetches

// ---------- Types ----------
type ApiResult = {
  word: string;
  entries: Array<{
    fl: string;
    definitions: string[];
    pronunciation?: { mw?: string; audioUrl?: string };
    examples: string[]; // NEW
    etymologies: string[]; // NEW
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
  def?: Array<{ sseq?: unknown }>;
  et?: unknown; // etymology array
  history?: { pt?: unknown }; // school dictionary "Word History"
};
type MWThesEntry = { fl?: unknown; def?: Array<{ sseq?: unknown }> };

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

// Replace MW inline markup with readable text, preserving visible link text.
// Handles tokens like {d_link|Word History|...}, {et_link|astronomy|...}, {sx|star|...},
// and leaves {it}..{/it} content intact while removing the tags.
function cleanMWText(input: string): string {
  if (!input) return "";

  // 1) Replace "piped" tokens with their first visible argument (display text)
  //    {tag|display|...} -> "display"
  let s = input.replace(/\{([^}|]+)\|([^}]+)\}/g, (_match, rawTag, rawRest) => {
    const tag = String(rawTag);
    const parts = String(rawRest).split("|");
    const display = parts[0] ?? "";

    switch (tag) {
      // Link / cross-ref style tokens: keep the display text
      case "d_link":
      case "et_link":
      case "sx":
      case "i_link":
      case "b_link":
      case "a_link":
      case "ma": // morphological annotation often includes “Greek …”; keep visible part
      case "mat": // sometimes appears as mat
        return display;

      // Superscripts etc. — keep a simple inline representation
      case "sup":
        return display; // or `^${display}` if you want to show superscripts

      // Definition break (rare in our fields)
      case "bc":
        return ": ";

      default:
        // Unknown token with pipes: safest is to show the first arg
        return display;
    }
  });

  // 2) Remove stand-alone formatting tokens that wrap content, e.g. {it}word{/it}
  s = s.replace(/\{\/?it\}/g, ""); // italics on/off
  s = s.replace(/\{\/?sc\}/g, ""); // small caps
  s = s.replace(/\{\/?b\}/g, ""); // bold (rare in API)
  s = s.replace(/\{bc\}/g, ": "); // sometimes appears without pipes

  // 3) Drop any other unmatched {…} tokens we don’t recognize
  s = s.replace(/\{[^}]+\}/g, "");

  // 4) Whitespace & punctuation tidy
  s = s.replace(/\s+/g, " ");
  s = s.replace(/\s+([,.;:!?])/g, "$1");
  s = s.replace(/(^|\s)[–—]\s+/g, "$1— "); // normalize dashes a bit
  return s.trim();
}

// Build MW audio URL from token per folder rules
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

/* =========================
   EXAMPLES (recursive walk)
   ========================= */

// Pull example sentences by walking all sense trees and collecting dt tags (vis, uns)
function collectDtExamples(dt: unknown, out: Set<string>, limit: number) {
  if (!Array.isArray(dt)) return;
  for (const item of dt) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const [tag, val] = item;
    if (tag === "vis" && Array.isArray(val)) {
      for (const v of val) {
        const t = (v as { t?: unknown })?.t;
        if (isString(t)) {
          out.add(cleanMWText(t));
          if (out.size >= limit) return;
        }
      }
    } else if (tag === "uns" && Array.isArray(val)) {
      for (const u of val) {
        const t = (u as { t?: unknown })?.t;
        if (isString(t)) {
          out.add(cleanMWText(t));
          if (out.size >= limit) return;
        }
      }
    }
  }
}

// generic deep-walk through sseq/sense-like nodes to find dt arrays
function walkSseq(node: unknown, out: Set<string>, limit: number) {
  if (!node || out.size >= limit) return;

  if (Array.isArray(node)) {
    // could be a ["sense", {...}] pair or a list of such pairs
    if (node.length >= 2 && typeof node[0] === "string") {
      const payload = node[1];
      if (payload && typeof payload === "object") {
        const dt = (payload as { dt?: unknown }).dt;
        if (dt) collectDtExamples(dt, out, limit);
        // recurse into any nested arrays/objects (sdsense, sen, pseq, etc.)
        for (const v of Object.values(payload as Record<string, unknown>)) {
          if (Array.isArray(v) || (v && typeof v === "object")) {
            walkSseq(v, out, limit);
          }
        }
      } else if (Array.isArray(payload)) {
        walkSseq(payload, out, limit);
      }
    } else {
      for (const child of node) walkSseq(child, out, limit);
    }
  } else if (typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>)) {
      if (Array.isArray(v) || (v && typeof v === "object")) {
        walkSseq(v, out, limit);
      }
    }
  }
}

function extractExamplesFromEntry(e: MWDictEntry, limit = 6): string[] {
  const out = new Set<string>();
  const defs = (e as { def?: Array<{ sseq?: unknown }> }).def;
  if (Array.isArray(defs)) {
    for (const d of defs) {
      walkSseq(d?.sseq, out, limit);
      if (out.size >= limit) break;
    }
  }
  return Array.from(out);
}

/* =========================
   ETYMOLOGY (et or history)
   ========================= */

// Pull etymology strings from standard `et` or school "Word History" `history.pt`
function extractEtymologiesFromEntry(e: MWDictEntry, limit = 2): string[] {
  const out: string[] = [];

  // Standard etymology array: [ ["text", "..."], ["et_snote", ...], ... ]
  const et = (e as { et?: unknown }).et as unknown;
  if (Array.isArray(et)) {
    for (const part of et) {
      if (
        Array.isArray(part) &&
        part.length >= 2 &&
        part[0] === "text" &&
        isString(part[1])
      ) {
        const txt = cleanMWText(part[1]);
        if (txt && !out.includes(txt)) {
          out.push(txt);
          if (out.length >= limit) return out;
        }
      }
    }
  }

  // School dictionary "Word History" block: history.pt
  const history = (e as { history?: { pt?: unknown } }).history;
  const pt = history?.pt;
  if (Array.isArray(pt)) {
    for (const chunk of pt) {
      if (
        Array.isArray(chunk) &&
        chunk.length >= 2 &&
        chunk[0] === "text" &&
        isString(chunk[1])
      ) {
        const txt = cleanMWText(chunk[1]);
        if (txt && !out.includes(txt)) {
          out.push(txt);
          if (out.length >= limit) break;
        }
      } else if (isString(chunk)) {
        const txt = cleanMWText(chunk);
        if (txt && !out.includes(txt)) {
          out.push(txt);
          if (out.length >= limit) break;
        }
      }
    }
  }

  return out;
}

// ---- Dictionary: collect ALL shortdefs grouped by POS + pronunciation + examples + etymologies ----
function extractAllDefsByPOS(json: unknown): Array<{
  fl: string;
  definitions: string[];
  pronunciation?: { mw?: string; audioUrl?: string };
  examples: string[];
  etymologies: string[];
}> {
  if (!isMWDictEntryArray(json)) return [];

  const byPOS = new Map<
    string,
    {
      definitions: string[];
      pronunciation?: { mw?: string; audioUrl?: string };
      examples: Set<string>;
      etymologies: Set<string>;
    }
  >();

  for (const e of json) {
    const flVal = isString((e as { fl?: unknown }).fl)
      ? ((e as { fl?: unknown }).fl as string)
      : null;
    const sdVal = (e as { shortdef?: unknown }).shortdef;
    if (!flVal || !isStringArray(sdVal)) continue;

    const bucket = byPOS.get(flVal) ?? {
      definitions: [] as string[],
      examples: new Set<string>(),
      etymologies: new Set<string>(),
    };

    // Merge unique definitions
    for (const d of sdVal)
      if (!bucket.definitions.includes(d)) bucket.definitions.push(d);

    // Pronunciation: first per POS
    if (!bucket.pronunciation) {
      const pron = firstPron(e);
      if (pron) bucket.pronunciation = pron;
    }

    // Examples
    for (const ex of extractExamplesFromEntry(e)) {
      if (bucket.examples.size < 6) bucket.examples.add(ex);
    }

    // Etymologies
    for (const et of extractEtymologiesFromEntry(e)) {
      if (bucket.etymologies.size < 2) bucket.etymologies.add(et);
    }

    byPOS.set(flVal, bucket);
  }

  return Array.from(byPOS, ([fl, b]) => ({
    fl,
    definitions: b.definitions,
    pronunciation: b.pronunciation,
    examples: Array.from(b.examples),
    etymologies: Array.from(b.etymologies),
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
    const defs = (entry as { def?: Array<{ sseq?: unknown }> }).def;
    if (Array.isArray(defs)) {
      for (const d of defs) {
        const sseq = d?.sseq;
        if (!Array.isArray(sseq)) continue;
        for (const s of sseq) {
          if (!Array.isArray(s)) continue;
          for (const maybePair of s) {
            if (
              !Array.isArray(maybePair) ||
              maybePair.length < 2 ||
              !isObject(maybePair[1])
            )
              continue;

            const synList = (maybePair[1] as { syn_list?: unknown }).syn_list;
            if (
              Array.isArray(synList) &&
              synList.every(
                (group) =>
                  Array.isArray(group) && group.every((item) => isObject(item))
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

  const qNormalized = qOriginal.toLowerCase();

  const dictKey = process.env.MW_INTERMEDIATE_DICT_KEY;
  const thesKey = process.env.MW_INTERMEDIATE_THES_KEY;
  if (!dictKey || !thesKey)
    return new Response("Missing MW keys", { status: 500 });

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
    word: qOriginal, // keep user casing for display
    entries,
    synonymsByPartOfSpeech,
    suggestions,
  };

  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": nocache
      ? "no-store"
      : `public, s-maxage=${ROUTE_TTL}, stale-while-revalidate=${ROUTE_SWR}`,
  });

  return new Response(JSON.stringify(payload), { headers });
}
