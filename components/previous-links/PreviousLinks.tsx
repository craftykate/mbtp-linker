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
import { IconExternalLink, IconTrash } from "@tabler/icons-react";
import { logUi } from "@/lib/logging/client-logging/logClient";
import { useSavedLinksContext } from "@/store/settings";

export default function PreviousLinks() {
  const { savedLinks, removeSavedLink, updateAllLinks } =
    useSavedLinksContext();

  if (savedLinks.length === 0) {
    return null;
  }

  // Move link to top of saved links, updating date to today
  const bumpLink = (index: number) => {
    const link = savedLinks[index];
    link.date = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    });
    const updatedLinks = [...savedLinks];
    updatedLinks.splice(index, 1);
    updatedLinks.unshift(savedLinks[index]);
    updateAllLinks(updatedLinks);

    const eventId = crypto.randomUUID();
    void logUi(
      "link_suffix_submit",
      { link_suffix: link.label },
      { eventId }
    ).catch(() => {});
  };

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
        {savedLinks.map((link, index) => (
          <Group key={link.id} justify="space-between">
            <Group justify="flex-start" gap="0.2rem">
              <Anchor
                href={link.href}
                target="_blank"
                onClick={() => bumpLink(index)}
              >
                <ActionIcon
                  variant="transparent"
                  size="xs"
                  style={{ top: "3px" }}
                >
                  <IconExternalLink />
                </ActionIcon>
                {link.label}
              </Anchor>{" "}
              - {link.date}
            </Group>
            <Tooltip label="Delete Link">
              <ActionIcon
                variant="transparent"
                size="sm"
                onClick={() => removeSavedLink(link.id)}
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
