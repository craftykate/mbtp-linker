import { Box, Text } from "@mantine/core";
import { OptOutIndicator } from "@/components/ui/OptOutIndicator";

export default function Footer() {
  return (
    <Box ta="center">
      <Text size="sm">
        &copy; {new Date().getFullYear()} Easy MBTP Linker. All rights reserved.
        Site built by Kate McFaul.
      </Text>
      <Text size="sm">Not affiliated with Beyond the Page.</Text>
      <OptOutIndicator />
    </Box>
  );
}
