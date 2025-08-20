import { Divider, Text } from "@mantine/core";
import QuickLinks from "./QuickLinks";
import InputSection from "./InputSection";
import PreviousLinks from "./PreviousLinks";

export default function BTPLinker() {
  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">BTP Link Builder</Text>}
        labelPosition="center"
        size="xs"
      />
      <QuickLinks />
      <InputSection />
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Previous 5 Links</Text>}
        labelPosition="center"
        size="xs"
      />
      <PreviousLinks />
    </>
  );
}
