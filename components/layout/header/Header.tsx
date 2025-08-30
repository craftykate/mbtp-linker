"use client";

import { Anchor, Button, Paper, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { logUi } from "@/lib/logging/client-logging/logClient";

export default function Header() {
  const handleLogClick = (
    type: "external_link_click" | "button_click",
    link_id: string,
    url: string,
    label: string
  ) => {
    const eventId = crypto.randomUUID();
    void logUi(
      type,
      { link_id, label, url, page: "/", component: "Header" },
      { eventId }
    ).catch(() => {});

    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <>
      <Text
        component="h1"
        size="3rem"
        lh={1.1}
        mb="sm"
        variant="gradient"
        gradient={{ from: "cyan", to: "purple", deg: 120 }}
      >
        Easy BTP Linker
      </Text>
      <Paper withBorder p="md">
        <Text c="red" size="lg">
          <Text span fw="bold">
            We&apos;ve moved!
          </Text>
        </Text>
        <Text>
          Visit the new{" "}
          <Anchor
            href="https://homeroom-hub.vercel.app"
            onClick={() =>
              handleLogClick(
                "external_link_click",
                "homeroom-hub",
                "https://homeroom-hub.vercel.app",
                "Homeroom Hub"
              )
            }
          >
            Homeroom Hub
          </Anchor>{" "}
          - all the same kid-safe tools, now better than ever. Sync links and
          timers across devices, with more features coming soon!
        </Text>
        <Button
          rightSection={<IconExternalLink size="16" />}
          mt="md"
          onClick={() =>
            handleLogClick(
              "button_click",
              "homeroom-hub",
              "https://homeroom-hub.vercel.app",
              "Homeroom Hub"
            )
          }
        >
          Visit Homeroom Hub
        </Button>
      </Paper>
    </>
  );
}
