import {
  ActionIcon,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconTrash, IconClockPlay } from "@tabler/icons-react";
import { useTimerSessionsContext } from "@/store/timerSessions";
import type { TimerSessionType } from "@/types/timer";
import { formatTimer, formatIsoToLocalTime } from "@/utils/format-helpers";

export default function PreviousTimers({
  onResume,
  loadDisabled,
}: {
  onResume: (session: TimerSessionType) => void;
  loadDisabled: boolean;
}) {
  const { sessions, removeSession, totalSecondsToday } =
    useTimerSessionsContext();

  if (sessions.length === 0) return null;

  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Today&apos;s Timers</Text>}
        labelPosition="center"
        size="xs"
      />
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
                  onClick={() => removeSession(session.id)}
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
