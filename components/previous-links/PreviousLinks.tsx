"use client";

import {
  Divider,
  Text,
  Stack,
  Group,
  Anchor,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useSavedLinksContext } from "@/store/settings";

export default function PreviousLinks() {
  const { savedLinks, removeSavedLink } = useSavedLinksContext();

  if (savedLinks.length === 0) {
    return null;
  }

  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Previous 5 Links</Text>}
        labelPosition="center"
        size="xs"
      />
      <Stack gap="xs">
        {savedLinks.map(({ id, href, label, date }) => (
          <Group key={id} justify="space-between">
            <Group justify="flex-start" gap="0.2rem">
              <Anchor href={href} target="_blank">
                {label}
              </Anchor>{" "}
              - {date}
            </Group>
            <Tooltip label="Delete Link">
              <ActionIcon
                variant="transparent"
                size="sm"
                onClick={() => removeSavedLink(id)}
              >
                <IconTrash />
              </ActionIcon>
            </Tooltip>
          </Group>
        ))}
      </Stack>
    </>
  );
}
