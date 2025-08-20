"use client";

import { usePathname } from "next/navigation";
import { Button, Flex } from "@mantine/core";
import { logUi } from "@/lib/logging/client-logging/logClient";

export default function QuickLinks() {
  const pathname = usePathname();

  const handleLogButtonClick = (
    button_id: string,
    url: string,
    label: string
  ) => {
    const eventId = crypto.randomUUID();
    void logUi(
      "button_click",
      { button_id, label, url, page: pathname, component: "QuickLinks" },
      { eventId }
    ).catch(() => {});

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Flex justify="center" gap="md" my="md">
      <Button
        variant="light"
        onClick={() =>
          handleLogButtonClick(
            "quicklinks.learning-gates",
            "https://www.beyondthepage.com/learning-gate/",
            "Learning Gates"
          )
        }
      >
        Learning Gates
      </Button>
      <Button
        variant="light"
        onClick={() =>
          handleLogButtonClick(
            "quicklinks.online-curriculum",
            "https://www.beyondthepage.com/online/",
            "Online Curriculum"
          )
        }
      >
        Online Curriculum
      </Button>
    </Flex>
  );
}
