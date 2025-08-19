import { useState } from "react";
import {
  ActionIcon,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash, IconClockPlay } from "@tabler/icons-react";
import { useTimerSessionsContext } from "@/store/timerSessions";
import type { TimerSessionType } from "@/types/timer";
import { formatTimer, formatIsoToLocalTime } from "@/utils/format-helpers";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

export default function PreviousTimers({
  onResume,
  loadDisabled,
}: {
  onResume: (session: TimerSessionType) => void;
  loadDisabled: boolean;
}) {
  const { sessions, removeSession, totalSecondsToday } =
    useTimerSessionsContext();

  const [opened, { open, close }] = useDisclosure(false);
  const [session, setSession] = useState<TimerSessionType | null>(null);

  const handleOpenModal = (session: TimerSessionType) => {
    setSession(session);
    open();
  };

  const handleDeleteSession = () => {
    if (session) {
      removeSession(session.id);
    }
    close();
  };

  if (sessions.length === 0) return null;

  const descriptionText = session ? (
    <>
      <Text fw="bold">
        {formatTimer(session.durationSec)}
        {session.label && ` - ${session.label}`}
      </Text>
      <Text c="dimmed" fs="italic">
        Are you sure you want to delete this timer? This action cannot be
        undone.
      </Text>
    </>
  ) : null;

  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Today&apos;s Timers</Text>}
        labelPosition="center"
        size="xs"
      />
      {opened && (
        <ConfirmDeleteModal
          opened={opened}
          close={close}
          title="Delete timer?"
          description={descriptionText}
          onConfirm={handleDeleteSession}
        />
      )}
      <Stack gap="xs" mb="md">
        {sessions.map((session) => (
          <Group key={session.id} justify="space-between">
            <Group justify="flex-start" gap="0.2rem">
              <Text>{formatIsoToLocalTime(session.startedAt)}</Text>
              {session.label && <Text>- {session.label}</Text>}
            </Group>
            <Group gap="0.2rem">
              <Text>{formatTimer(session.durationSec)}</Text>

              <Tooltip label="Resume timer">
                <ActionIcon
                  variant="transparent"
                  size="sm"
                  onClick={() => onResume(session)}
                  disabled={loadDisabled}
                >
                  <IconClockPlay />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete timer">
                <ActionIcon
                  variant="transparent"
                  size="sm"
                  onClick={() => handleOpenModal(session)}
                >
                  <IconTrash />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        ))}
        <Group justify="flex-end">
          <Text>Today&apos;s Total: {formatTimer(totalSecondsToday)}</Text>
        </Group>
      </Stack>
      <Text span c="dimmed" fs="italic">
        Timers will save for one day and be cleared tomorrow
      </Text>
    </>
  );
}
