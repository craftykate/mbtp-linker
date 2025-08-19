import { Container, Paper } from "@mantine/core";
import PageVisitPing from "@/components/ui/PageVisitPing";
import Header from "@/components/layout/header/Header";
import QuickLinks from "@/components/quick-links/QuickLinks";
import InputSection from "@/components/linker/InputSection";
import PreviousLinks from "@/components/previous-links/PreviousLinks";
import Dictionary from "@/components/dictionary/Dictionary";
import Timer from "@/components/timer/Timer";
import OtherLinks from "@/components/other-links/OtherLinks";
import Footer from "@/components/layout/footer/Footer";

export default function Home() {
  return (
    <Container size="sm" mt="md">
      <PageVisitPing afterInteraction />
      <Paper shadow="xs" mb="md" p="md" withBorder>
        <Header />
        <QuickLinks />
        <InputSection />
        <PreviousLinks />
        <Dictionary />
        <Timer />
        <OtherLinks />
      </Paper>
      <Footer />
    </Container>
  );
}
