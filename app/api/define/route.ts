type ApiResult = {
  word: string;
  entries: Array<{ fl: string; definitions: string[] }>;
  synonymsByPartOfSpeech: Array<{ fl: string; synonyms: string[] }>;
  suggestions: string[];
};

type MWDictEntry = {
  fl?: unknown; // part of speech
  shortdef?: unknown; // string[]
  meta?: { id?: unknown } | unknown;
};

type MWThesEntry = {
  fl?: unknown; // part of speech
  def?: Array<{ sseq?: unknown }>;
};

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

// ---- Dictionary: collect all shortdefs grouped by part of speech ----
function extractAllDefsByPOS(
  json: unknown
): Array<{ fl: string; definitions: string[] }> {
  if (!isMWDictEntryArray(json)) return [];
  const byPOS = new Map<string, string[]>();

  for (const e of json) {
    const flVal = isString((e as { fl?: unknown }).fl)
      ? ((e as { fl?: unknown }).fl as string)
      : null;
    const sdVal = (e as { shortdef?: unknown }).shortdef;
    if (!flVal || !isStringArray(sdVal)) continue;

    const bucket = byPOS.get(flVal) ?? [];
    for (const d of sdVal) {
      if (!bucket.includes(d)) bucket.push(d);
    }
    byPOS.set(flVal, bucket);
  }

  return Array.from(byPOS, ([fl, definitions]) => ({ fl, definitions }));
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

    // Only add this POS if we actually found any synonyms
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
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return new Response("Missing q", { status: 400 });

  console.info(
    JSON.stringify({
      event: "define_lookup",
      word: q,
      ts: new Date().toISOString(),
    })
  );

  const dictKey = process.env.MW_INTERMEDIATE_DICT_KEY;
  const thesKey = process.env.MW_INTERMEDIATE_THES_KEY;
  if (!dictKey || !thesKey)
    return new Response("Missing MW keys", { status: 500 });

  const [dRes, tRes] = await Promise.all([
    fetch(
      `https://www.dictionaryapi.com/api/v3/references/sd3/json/${encodeURIComponent(
        q
      )}?key=${dictKey}`
    ),
    fetch(
      `https://www.dictionaryapi.com/api/v3/references/ithesaurus/json/${encodeURIComponent(
        q
      )}?key=${thesKey}`
    ),
  ]);

  const dictJson: unknown = dRes.ok ? await dRes.json() : undefined;
  const thesJson: unknown = tRes.ok ? await tRes.json() : undefined;

  const entries = extractAllDefsByPOS(dictJson);
  const synonymsByPartOfSpeech = extractSynonymsByPOS(thesJson);
  const suggestions = extractSuggestions(dictJson);

  const payload: ApiResult = {
    word: q,
    entries,
    synonymsByPartOfSpeech,
    suggestions,
  };

  return Response.json(payload);
}
