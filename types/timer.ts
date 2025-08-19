export type TimerSessionType = {
  id: string;
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  durationSec: number; // derived for convenience
  label?: string;
};
