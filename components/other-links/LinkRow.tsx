"use client";

import { StaticImageData } from "next/image";
import { Anchor, Grid, Image } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

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
        <Anchor href={href} target="_blank">
          {label}
        </Anchor>{" "}
        - {description}
      </Grid.Col>
    </Grid>
  );
}
