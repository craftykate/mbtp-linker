import { Container, Paper } from "@mantine/core";
import QuickLinks from "@/components/quick-links/QuickLinks";

export default function Home() {
  return (
    <Container size="sm" mt="md">
      <Paper shadow="xs" mb="md" p="md" withBorder>
        <QuickLinks />
      </Paper>
    </Container>
  );
}
