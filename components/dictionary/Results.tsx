import { Accordion, List, Space, Text } from "@mantine/core";
import { DefineResult } from "@/types/dictionary";

export default function Results({ result }: { result: DefineResult }) {
  const synMap = new Map(
    result.synonymsByPartOfSpeech.map((s) => [s.fl, s.synonyms])
  );
  const allSynFallback = Array.from(
    new Set(result.synonymsByPartOfSpeech.flatMap((s) => s.synonyms))
  );

  // stable POS order
  const order = [
    "noun",
    "pronoun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "conjunction",
    "interjection",
    "article",
  ];
  const entries = [...result.entries].sort(
    (a, b) => order.indexOf(a.fl) + 999 - (order.indexOf(b.fl) + 999) // unknowns go last
  );
  console.log(result);
  console.log(entries[0]?.fl === "noun");
  return (
    <div>
      {result.suggestions.length > 0 && (
        <p>Did you mean: {result.suggestions.join(", ")}?</p>
      )}

      <Accordion variant="separated" defaultValue={entries[0]?.fl}>
        {entries.map(({ fl, definitions }) => {
          const syns = synMap.get(fl) ?? [];
          const showSyns = syns.length ? syns : allSynFallback;

          return (
            <Accordion.Item key={fl} value={fl}>
              <Accordion.Control>
                <Text fw="bold" tt="capitalize">
                  {fl}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <List>
                  {definitions.map((d, i) => (
                    <List.Item key={i}>{d}</List.Item>
                  ))}
                </List>
                {showSyns.length > 0 && (
                  <>
                    <Space h="md" />
                    <Text fw="bold">Synonyms:</Text>
                    <p>{showSyns.join(", ")}</p>
                  </>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
}
