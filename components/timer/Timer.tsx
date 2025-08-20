"use client";

import { useEffect, useRef, useState } from "react";
import {
  Divider,
  Box,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
} from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { logUi } from "@/lib/logging/client-logging/logClient";
import { useTimerSessionsContext } from "@/store/timerSessions";
import { TimerSessionType } from "@/types/timer";
import { formatTimer } from "@/utils/format-helpers";
import PreviousTimers from "./PreviousTimers";
import { KeepScreenAwake } from "@/components/ui/KeepScreenAwake";

export default function Timer() {
  const { addTimerSession, updateSession } = useTimerSessionsContext();

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Refs
  const startedAtRef = useRef<Date | null>(null);
  const runStartMsRef = useRef<number | null>(null);
  const baseSecRef = useRef<number>(0);
  const endedAtRef = useRef<Date | null>(null);
  const baseAtLoadRef = useRef<number>(0);

  const interval = useInterval(() => {
    if (!running || runStartMsRef.current == null) return;
    const now = Date.now();
    const currentRunSec = Math.floor((now - runStartMsRef.current) / 1000);
    const next = baseSecRef.current + currentRunSec;
    // only update when the displayed value changes
    setSeconds((prev) => (prev === next ? prev : next));
  }, 250);

  useEffect(() => () => interval.stop(), [interval]);

  const startOrResume = () => {
    if (!showTimer) {
      const eventId = crypto.randomUUID();
      void logUi(
        "timer_action",
        { action: "start", page: "/", component: "Timer" },
        { eventId }
      ).catch(() => {});
    }
    setShowTimer(true);
    if (!startedAtRef.current) startedAtRef.current = new Date();
    runStartMsRef.current = Date.now();
    endedAtRef.current = null;
    setRunning(true);
    interval.start();
  };

  const pause = () => {
    if (!running) return;
    interval.stop();
    setRunning(false);

    if (runStartMsRef.current != null) {
      const now = Date.now();
      const currentRunSec = Math.floor((now - runStartMsRef.current) / 1000);
      baseSecRef.current += currentRunSec;
      runStartMsRef.current = null;
      setSeconds(baseSecRef.current);
    }
    endedAtRef.current = new Date();
  };

  const toggleTimer = () => (running ? pause() : startOrResume());

  const resetTimer = () => {
    interval.stop();
    setRunning(false);
    baseSecRef.current = 0;
    runStartMsRef.current = null;
    startedAtRef.current = null;
    endedAtRef.current = null;
    baseAtLoadRef.current = 0;
    setSeconds(0);
    setShowTimer(false);
    setLabel("");
    setEditingId(null);
    // note: do NOT touch `saving` here; `saveTimer` handles that
  };

  const saveTimer = async () => {
    if (saving) return;
    if (running) pause();

    const durationSec = baseSecRef.current;
    if (durationSec <= 0) return;

    setSaving(true);

    const action = editingId ? "update" : "create";
    const eventId = crypto.randomUUID();
    void logUi(
      "timer_action",
      { action, duration: durationSec, page: "/", component: "Timer" },
      { eventId }
    ).catch(() => {});

    try {
      // derive ended/start based on how you paused/loaded
      const endedAt =
        endedAtRef.current ??
        new Date(
          (startedAtRef.current?.getTime() ?? Date.now()) + durationSec * 1000
        );
      const startedAt =
        startedAtRef.current ??
        new Date(endedAt.getTime() - durationSec * 1000);

      if (editingId) {
        // update-in-place
        const added = durationSec - baseAtLoadRef.current;
        const updates: Partial<Omit<TimerSessionType, "id">> = {};

        if (added > 0) {
          updates.durationSec = durationSec;
          updates.endedAt = endedAt.toISOString();
          // keep original startedAt untouched
        }
        const labelTrim = label.trim();
        if (labelTrim !== "") updates.label = labelTrim;

        if (Object.keys(updates).length > 0) {
          updateSession(editingId, updates);
        }
        resetTimer();
        return;
      }

      // create new
      addTimerSession({
        startedAt,
        endedAt,
        durationSec,
        label: label.trim() || undefined,
      });

      resetTimer();
    } finally {
      setSaving(false);
    }
  };

  const handleResumeFromSession = (s: TimerSessionType) => {
    interval.stop();
    setRunning(false);

    // Load prior elapsed & label
    baseSecRef.current = s.durationSec;
    baseAtLoadRef.current = s.durationSec; // remember baseline
    setSeconds(s.durationSec);
    setLabel(s.label ?? "");
    setShowTimer(true);

    // Mark editing and preserve original timestamps
    setEditingId(s.id);
    startedAtRef.current = new Date(s.startedAt);
    endedAtRef.current = new Date(s.endedAt);
    runStartMsRef.current = null; // not started yet

    const eventId = crypto.randomUUID();
    void logUi(
      "timer_action",
      { action: "load", page: "/", component: "Timer" },
      { eventId }
    ).catch(() => {});
  };

  return (
    <>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Timer</Text>}
        labelPosition="center"
        size="xs"
      />
      <Stack>
        <Group justify="center">
          <Button onClick={toggleTimer}>
            {running ? "Pause" : showTimer ? "Resume" : "Start"} Timer
          </Button>
          {showTimer && (
            <Button variant="light" color="red" onClick={resetTimer}>
              {editingId ? "Cancel" : "Reset"}
            </Button>
          )}
        </Group>

        {showTimer && (
          <Box
            style={{
              backgroundColor: "#c2c2c2",
              borderRadius: "8px",
              display: "inline-block",
              padding: "0.25em 0.5em",
            }}
          >
            <Text
              fw={700}
              size="4rem"
              ff="monospace"
              ta="center"
              c="cyan.7"
              style={{ letterSpacing: "0.1em" }}
            >
              {formatTimer(seconds)}
            </Text>
          </Box>
        )}

        {showTimer && (
          <Group>
            <TextInput
              placeholder="Timer label (Reading - Charlotte's Web)"
              value={label}
              onChange={(e) => setLabel(e.currentTarget.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={saveTimer} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Timer" : "Save Timer"}
            </Button>
          </Group>
        )}
        {showTimer && <KeepScreenAwake />}
      </Stack>
      <Divider
        my="sm"
        color="cyan"
        label={<Text size="lg">Today&apos;s Timers</Text>}
        labelPosition="center"
        size="xs"
      />
      <PreviousTimers
        onResume={handleResumeFromSession}
        loadDisabled={showTimer /* disable loading when any timer is active */}
      />
    </>
  );
}
