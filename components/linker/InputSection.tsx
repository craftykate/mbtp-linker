"use client";

import { useState } from "react";
import { Button, Group, Input, NumberInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { IconExternalLink } from "@tabler/icons-react";
import { logUi } from "@/lib/logging/client-logging/logClient";
import { useSavedLinksContext } from "@/store/settings";

export default function InputSection() {
  const { addSavedLink } = useSavedLinksContext();

  const focusTrapRef = useFocusTrap();

  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormValues = { linkSuffix: number | "" };

  const form = useForm<FormValues>({
    initialValues: {
      linkSuffix: "",
    },
    validate: {
      linkSuffix: (v) => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) && n > 0
          ? null
          : "Link suffix must be a positive number";
      },
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (isSubmitting) return;

    const n =
      typeof values.linkSuffix === "number"
        ? values.linkSuffix
        : Number(values.linkSuffix);
    if (!Number.isFinite(n) || n <= 0) return;

    const suffix = String(n); // normalized string for URL/logging
    const eventId = crypto.randomUUID();
    void logUi(
      "link_suffix_submit",
      { link_suffix: suffix },
      { eventId }
    ).catch(() => {});

    const url = `https://www.beyondthepage.com/link/${suffix}`;
    window.open(url);
    addSavedLink(suffix, url);
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <form
      onSubmit={form.onSubmit(
        // If no errors
        (values) => {
          setIsSubmitting(true);
          handleSubmit(values);
        }
      )}
    >
      <Stack gap="0" mb="md">
        {form.errors.linkSuffix && (
          <Input.Error mb={0}>{form.errors.linkSuffix}</Input.Error>
        )}
        <Input.Label size="md" required>
          Enter Link Suffix
        </Input.Label>
        <Group align="flex-end">
          <NumberInput
            required
            placeholder="12345"
            min={1}
            {...form.getInputProps("linkSuffix")}
            error={false}
            hideControls
            style={{ flex: 1 }}
            inputMode="numeric"
            ref={focusTrapRef}
          />
          <Button
            type="submit"
            loading={isSubmitting}
            rightSection={<IconExternalLink size={16} />}
          >
            Open
          </Button>
        </Group>
        <Text>
          <Text span c="dimmed" fs="italic">
            www.beyondthepage.com/link/
          </Text>
          <Text span c="red">
            12345
          </Text>
          <Text span c="dimmed" fs="italic">
            /
          </Text>
        </Text>
      </Stack>
    </form>
  );
}
