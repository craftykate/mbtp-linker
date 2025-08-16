"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  TextInput,
  Input,
  Button,
  Divider,
  Text,
  Anchor,
  Image,
  Box,
  ActionIcon,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconSearch, IconX } from "@tabler/icons-react";
import { logCacheHit } from "@/lib/logging/client-logging/logClient";
import { fetchDefine, ApiError } from "@/lib/api-helpers/fetchDefine";
import { DefineResult } from "@/types/dictionary";
import Results from "./Results";

export default function Dictionary() {
  const [result, setResult] = useState<DefineResult | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    onSubmitPreventDefault: "always",
    initialValues: {
      searchTerm: "",
    },
    validate: {
      searchTerm: (value) => {
        if (!isNotEmpty(value)) {
          return "Search word is required";
        }
      },
    },
  });

  const handleSubmit = async (values: { searchTerm: string }) => {
    const q = values.searchTerm.trim();
    if (!q || q.length > 64) return;
    setLoading(true);

    try {
      const { data, response } = await fetchDefine(q);

      // Log the event (only when HIT/STALE) — keep as-is if your logger expects Response
      await logCacheHit(response, "dictionary_lookup", {
        word_original: q,
        word_lower: q.toLowerCase(),
        normalized: q.toLowerCase(),
        pos: data.entries?.[0]?.fl ?? null,
        source: "mw",
      });

      setResult(data);
      form.reset();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Something went wrong. Try again.";
      console.error("Define error:", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Dictionary</Text>}
        labelPosition="center"
        size="xs"
      />
      <form
        onSubmit={form.onSubmit(
          // If no errors
          (values) => {
            setLoading(true);
            handleSubmit(values);
          }
        )}
      >
        <Stack gap="0" mb="md">
          {form.errors.searchTerm && (
            <Input.Error mb={0}>{form.errors.searchTerm}</Input.Error>
          )}
          <Input.Label size="md" required>
            Enter Word to Look Up
          </Input.Label>
          <Group align="flex-end">
            <TextInput
              required
              value={form.values.searchTerm}
              {...form.getInputProps("searchTerm")}
              error={false}
              style={{ flex: 1 }}
            />
            <Button
              type="submit"
              loading={loading}
              rightSection={<IconSearch size={16} />}
            >
              Define
            </Button>
          </Group>
        </Stack>
      </form>
      {result && (
        <Group align="center" gap="0">
          <ActionIcon onClick={() => setResult(null)} variant="transparent">
            <IconX />
          </ActionIcon>{" "}
          <Text size="xl">{result.word}</Text>
        </Group>
      )}

      {result && <Results result={result} key={result.word} />}
      <Group justify="flex-end" align="center" mt="md" gap="xs" wrap="nowrap">
        <Text
          size="xs"
          c="dimmed"
          ta="right"
          style={{
            flex: "1 1 auto", // take remaining space
            minWidth: 0, // IMPORTANT: allow text to shrink
            wordBreak: "break-word", // wrap long strings
          }}
        >
          Merriam-Webster® Intermediate (Grades 6-8): kid-friendly definitions &
          synonyms
        </Text>
        <Anchor
          href="https://www.merriam-webster.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: "0 0 auto" }} // keep logo fixed-size on the right
        >
          <Box w={50} h={50} style={{ flex: "0 0 auto" }}>
            <Image
              src="/images/MWLogo_LightBG_120x120_2x.png"
              alt="Merriam-Webster®"
              w="100%"
              h="100%"
              fit="contain"
            />
          </Box>
        </Anchor>
      </Group>
    </>
  );
}
