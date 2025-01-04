"use client";

import { useState } from "react";
import { Button, Group, Input, NumberInput, Stack, Text } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { IconExternalLink } from "@tabler/icons-react";

export default function InputSection() {
  const focusTrapRef = useFocusTrap();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      linkSuffix: "",
    },
    validate: {
      linkSuffix: (value) => {
        if (!isNotEmpty(value)) {
          return "Link suffix is required";
        }
        const number = Number(value);
        if (isNaN(number) || number <= 0) {
          return "Link suffix must be a positive number";
        }
      },
    },
  });

  const handleSubmit = (values: { linkSuffix: string }) => {
    console.log(values);
    window.open(
      `https://www.movingbeyondthepage.com/link/${values.linkSuffix}`
    );
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
            value={form.values.linkSuffix}
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
            www.movingbeyondthepage.com/link/
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
