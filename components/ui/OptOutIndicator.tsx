"use client";
import { ActionIcon } from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";
import { useLogOptOut } from "@/lib/logging/useLogOptOut";

export function OptOutIndicator() {
  const { optedOut, disable } = useLogOptOut();
  if (!optedOut) return null;

  return (
    <ActionIcon variant="transparent" c="gray" onClick={disable}>
      <IconHeart size={16} fill="gray" />
    </ActionIcon>
  );
}
