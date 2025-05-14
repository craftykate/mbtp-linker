"use client";

import { Button, Flex } from "@mantine/core";

export default function QuickLinks() {
  return (
    <Flex justify="center" gap="md" my="md">
      <Button
        variant="light"
        onClick={() =>
          window.open("https://www.beyondthepage.com/learning-gate/")
        }
      >
        Learning Gates
      </Button>
      <Button
        variant="light"
        onClick={() => window.open("https://www.beyondthepage.com/online/")}
      >
        Online Curriculum
      </Button>
    </Flex>
  );
}
