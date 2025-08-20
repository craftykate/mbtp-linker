import { Container, Paper } from "@mantine/core";
import PageVisitPing from "@/components/ui/PageVisitPing";
import Header from "@/components/layout/header/Header";
import BTPLinker from "@/components/btp-linker/BTPLinker";
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
        <BTPLinker />
        <Dictionary />
        <Timer />
        <OtherLinks />
      </Paper>
      <Footer />
    </Container>
  );
}
