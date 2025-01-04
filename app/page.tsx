import { Container, Paper } from "@mantine/core";
import Header from "@/components/layout/header/Header";
import QuickLinks from "@/components/quick-links/QuickLinks";

export default function Home() {
  return (
    <Container size="sm" mt="md">
      <Paper shadow="xs" mb="md" p="md" withBorder>
        <Header />
        <QuickLinks />
      </Paper>
    </Container>
  );
}
