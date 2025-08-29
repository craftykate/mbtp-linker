import { Paper, Text } from "@mantine/core";

export default function Header() {
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
            Coming soon!
          </Text>{" "}
          I&apos;m working on a NEW version of this site with lots more tools!
        </Text>
        <Text>
          You&apos;ll also be able to log in (with a free account) and sync your
          saved links and timers across devices! I&apos;ll add the link here
          when it&apos;s ready for testing, which should be very soon.
        </Text>
      </Paper>
    </>
  );
}
