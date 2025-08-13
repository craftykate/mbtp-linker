import { Accordion, Group, List, Space, Text } from "@mantine/core";
import { DefineResult } from "@/types/dictionary";
import SpeakButton from "./SpeakButton";

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

  return (
    <div>
      {result.suggestions.length > 0 && (
        <p>Did you mean: {result.suggestions.join(", ")}?</p>
      )}

      <Accordion variant="separated" defaultValue={entries[0]?.fl}>
        {entries.map(
          ({ fl, definitions, pronunciation, examples, etymologies }) => {
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
                  <Group gap="xs">
                    {/* Word */}
                    <Text fw="bold" size="lg">
                      {result.word}
                    </Text>
                    {/* Pronunciation symbols */}
                    {pronunciation?.mw && (
                      <Text c="dimmed">/{pronunciation.mw}/</Text>
                    )}
                    {/* Speak button */}
                    <SpeakButton
                      word={result.word}
                      audioUrl={pronunciation?.audioUrl}
                    />
                  </Group>

                  {/* Definitions */}
                  <List>
                    {definitions.map((d, i) => (
                      <List.Item key={i}>{d}</List.Item>
                    ))}
                  </List>

                  {/* Examples */}
                  {examples.length > 0 && (
                    <>
                      <Space h="md" />
                      <Text fw="bold">Examples:</Text>
                      <List>
                        {examples.map((ex, i) => (
                          <List.Item key={i}>{ex}</List.Item>
                        ))}
                      </List>
                    </>
                  )}

                  {/* Synonyms */}
                  {showSyns.length > 0 && (
                    <>
                      <Space h="md" />
                      <Text fw="bold">Synonyms:</Text>
                      <p>{showSyns.join(", ")}</p>
                    </>
                  )}

                  {/* Etymology */}
                  {etymologies.length > 0 && (
                    <>
                      <Space h="md" />
                      <Text fw="bold">Etymology:</Text>
                      <List spacing="xs">
                        {etymologies.map((et, i) => (
                          <List.Item key={i}>{et}</List.Item>
                        ))}
                      </List>
                    </>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            );
          }
        )}
      </Accordion>
    </div>
  );
}
