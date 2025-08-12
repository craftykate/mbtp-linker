type PosEntry = {
  fl: string;
  definitions: string[];
};

type PosSyns = {
  fl: string;
  synonyms: string[];
};

export type DefineResult = {
  word: string;
  entries: PosEntry[]; // e.g., [{ fl: "noun", definitions:[...] }, { fl:"verb", ...}]
  synonymsByPartOfSpeech: PosSyns[]; // e.g., [{ fl:"noun", synonyms:[...] }, { fl:"verb", ...}]
  suggestions: string[]; // when MW returns spelling suggestions
};
