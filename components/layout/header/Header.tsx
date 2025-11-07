"use client";

import { Button, Paper, Text, Image } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { logUi } from "@/lib/logging/client-logging/logClient";
import HomeroomHub from "@/public/images/homeroom-hub.png";
import BTP from "@/public/images/btp-screenshot.png";

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
            Come join us!
          </Text>
        </Text>
        <Text mb="md">
          We are <b>shutting this site down</b> at the end of the year, but
          don&apos;t worry, Homeroom Hub has everything you see here and SO MUCH
          MORE. Plus, with a FREE account you can sync your BTP links across
          devices and store timer sessions.
        </Text>
        <Text>
          Get math help, write stories, play with color, build spelling quizzes,
          roll dice for math games, and more.
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
        <Text mt="xl">I mean, just look at all these tools:</Text>
        <Image
          src={HomeroomHub.src}
          alt="Homeroom Hub"
          mt="md"
          radius="md"
          width="100%"
        />

        <Text mt="xl">Look how pretty the new BTP linker looks:</Text>
        <Image
          src={BTP.src}
          alt="BTP Linker"
          mt="md"
          radius="md"
          width="100%"
        />

        <Text mt="xl">New tools are getting added all the time!</Text>
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
          Let&apos;s go!
        </Button>
      </Paper>
    </>
  );
}
