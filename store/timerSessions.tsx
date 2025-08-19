"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
  useMemo,
} from "react";
import { useLocalStorage } from "@mantine/hooks";
import { v4 as uuidv4 } from "uuid";
import { TimerSessionType } from "@/types/timer";

// CONTEXT TYPE DEFINITION
interface TimerSessionsContextType {
  sessions: TimerSessionType[];
  addTimerSession: (args: {
    startedAt: Date;
    endedAt: Date;
    durationSec?: number;
    label?: string;
  }) => void;
  updateSession: (
    id: string,
    updates: Partial<Omit<TimerSessionType, "id">>
  ) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
  totalSecondsToday: number;
}

// INITIAL DEFAULT VALUES
const defaultSessions: TimerSessionType[] = [];

//CREATE THE CONTEXT
const TimerSessionsContext = createContext<TimerSessionsContextType | null>(
  null
);

// CUSTOM HOOK TO ACCESS THE CONTEXT
export function useTimerSessionsContext() {
  const ctx = useContext(TimerSessionsContext);
  if (!ctx)
    throw new Error("useTimerSessionsContext must be used within provider");
  return ctx;
}

// HELPERS
const resolveTZ = (tz?: string) =>
  tz ??
  (typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC");

const ymd = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // "YYYY-MM-DD"

const isoToYMD = (iso: string, tz: string) => ymd(new Date(iso), tz);

const filterToToday = (list: TimerSessionType[], tz: string) => {
  const today = ymd(new Date(), tz);
  return list.filter((s) => isoToYMD(s.endedAt, tz) === today);
};

const sortByStartedAtAsc = (arr: TimerSessionType[]) =>
  [...arr].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

const MAX_TODAY = 50;

// PROVIDER COMPONENT
export function TimerSessionsProvider({
  children,
  timeZone,
}: {
  children: ReactNode;
  timeZone?: string;
}) {
  const tz = resolveTZ(timeZone);

  //=========== Local Storage ===========
  // Get info from local storage, set default if there isn't any
  const [sessionsRaw, setSessionsRaw] = useLocalStorage<TimerSessionType[]>({
    key: "kmd-mbtp-timer-sessions",
    defaultValue: defaultSessions,
    getInitialValueInEffect: true,
  });

  const canonicalize = (list: TimerSessionType[]) =>
    sortByStartedAtAsc(filterToToday(list, tz)).slice(0, MAX_TODAY);

  // Purge once per day (TZ-aware)
  useEffect(() => {
    const key = "kmd-mbtp-timer-last-purge";
    const todayKey = `${ymd(new Date(), tz)}|${tz}`;
    const last = localStorage.getItem(key);
    if (last !== todayKey) {
      setSessionsRaw((prev) => filterToToday(prev, tz));
      localStorage.setItem(key, todayKey);
    }
  }, [tz, setSessionsRaw]);

  // Purge on focus if day changed
  useEffect(() => {
    const onFocus = () => {
      const key = "kmd-mbtp-timer-last-purge";
      const todayKey = `${ymd(new Date(), tz)}|${tz}`;
      const last = localStorage.getItem(key);
      if (last !== todayKey) {
        setSessionsRaw((prev) => filterToToday(prev, tz));
        localStorage.setItem(key, todayKey);
      }
    };
    window.addEventListener("visibilitychange", onFocus, { passive: true });
    window.addEventListener("focus", onFocus, { passive: true });
    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [tz, setSessionsRaw]);

  // Expose canonical list (already today-only + sorted)
  const sessions = canonicalize(sessionsRaw);
  //=========== End Local Storage ===========

  //=========== Define Context Functions ===========
  const addTimerSession: TimerSessionsContextType["addTimerSession"] = ({
    startedAt,
    endedAt,
    durationSec,
    label,
  }) => {
    const computed = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
    );
    const newSession: TimerSessionType = {
      id: uuidv4(),
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSec: typeof durationSec === "number" ? durationSec : computed,
      label,
    };
    setSessionsRaw((prev) => {
      if (prev.some((s) => s.id === newSession.id)) return prev; // strict-mode guard
      return canonicalize([newSession, ...prev]);
    });
  };

  const updateSession: TimerSessionsContextType["updateSession"] = (
    id,
    updates
  ) => {
    setSessionsRaw((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      return canonicalize(next);
    });
  };

  const removeSession = (id: string) =>
    setSessionsRaw((prev) => canonicalize(prev.filter((s) => s.id !== id)));
  const clearSessions = () => setSessionsRaw([]);

  const totalSecondsToday = useMemo(
    () => sessions.reduce((sum, s) => sum + s.durationSec, 0),
    [sessions]
  );
  //=========== End Context Functions ===========

  //=========== Define Context Value ===========
  const value: TimerSessionsContextType = {
    sessions,
    addTimerSession,
    updateSession,
    removeSession,
    clearSessions,
    totalSecondsToday,
  };

  return (
    <TimerSessionsContext.Provider value={value}>
      {children}
    </TimerSessionsContext.Provider>
  );
}
//=========== End Context Value ===========
