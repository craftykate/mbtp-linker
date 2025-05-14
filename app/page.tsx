import { Container, Paper } from "@mantine/core";
import Header from "@/components/layout/header/Header";
import QuickLinks from "@/components/quick-links/QuickLinks";
import InputSection from "@/components/linker/InputSection";
import PreviousLinks from "@/components/previous-links/PreviousLinks";
import OtherLinks from "@/components/other-links/OtherLinks";
import Footer from "@/components/layout/header/footer/Footer";

export default function Home() {
  return (
    <Container size="sm" mt="md">
      <Paper shadow="xs" mb="md" p="md" withBorder>
        <Header />
        <QuickLinks />
        <InputSection />
        <PreviousLinks />
        <OtherLinks />
      </Paper>
      <Footer />
    </Container>
  );
}
