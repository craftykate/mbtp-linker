import { Button, Group, Modal } from "@mantine/core";

export default function ConfirmDeleteModal({
  opened,
  close,
  title,
  description,
  onConfirm,
}: {
  opened: boolean;
  close: () => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
}) {
  return (
    <Modal opened={opened} onClose={close} title={title}>
      {description}
      <Group my="sm">
        <Button onClick={close}>Cancel</Button>
        <Button color="error-red" onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
