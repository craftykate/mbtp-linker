"use client";

import { StaticImageData } from "next/image";
import { Anchor, Grid, Image } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { logUi } from "@/lib/logging/client-logging/logClient";

export default function LinkRow({
  href,
  label,
  image,
  description,
}: {
  href: string;
  label: string;
  image: StaticImageData;
  description: string;
}) {
  const isNarrow = useMediaQuery("(max-width: 700px)");

  const handleLogClick = (link_id: string, url: string, label: string) => {
    const eventId = crypto.randomUUID();
    void logUi(
      "external_link_click",
      { link_id, label, url, page: "/", component: "OtherLinks" },
      { eventId }
    ).catch(() => {});

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Grid align="center">
      {!isNarrow && (
        <Grid.Col span={1}>
          <Image
            src={image.src}
            alt={label}
            w="100%"
            fit="contain"
            radius="md"
          />
        </Grid.Col>
      )}
      <Grid.Col span={isNarrow ? 12 : 11}>
        <Anchor
          href={href}
          target="_blank"
          onClick={() => handleLogClick("otherLinks." + label, href, label)}
        >
          {label}
        </Anchor>{" "}
        - {description}
      </Grid.Col>
    </Grid>
  );
}
