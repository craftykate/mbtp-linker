import { Text } from "@mantine/core";

export default function Header() {
  return (
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
  );
}
