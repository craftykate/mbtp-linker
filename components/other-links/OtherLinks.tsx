import { Stack, Text, Divider } from "@mantine/core";
import LinkRow from "./LinkRow";
import numberSortImage from "@/public/images/sort-numbers.png";
import numberPracticeImage from "@/public/images/number-practice.png";

const links = [
  {
    label: "Number practice",
    href: "https://numberpractice.surge.sh",
    description:
      "An app I built for kids to practice entering phone numbers on a phone keypad simulator. Throws confetti when they get it right!",
    image: numberPracticeImage,
  },
  {
    label: "Number sort",
    href: "https://sort-numbers.vercel.app",
    description:
      "An interactive, educational tool I built that aims to make practicing math concepts like place value and greater than/less than easy and engaging.",
    image: numberSortImage,
  },
];

export default function OtherLinks() {
  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Other Links</Text>}
        labelPosition="center"
        size="xs"
      />
      <Stack>
        {links.map(({ href, label, image, description }) => (
          <LinkRow
            key={href}
            href={href}
            label={label}
            image={image}
            description={description}
          />
        ))}
      </Stack>
    </>
  );
}
