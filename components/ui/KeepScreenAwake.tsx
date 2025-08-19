import { useEffect, useRef, useState, useCallback } from "react";
import { Checkbox, Group, Notification, Text } from "@mantine/core";

// Minimal types
type WakeLockType = "screen";
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: WakeLockType;
  release(): Promise<void>;
}
interface WakeLock {
  request(type: WakeLockType): Promise<WakeLockSentinel>;
}
type MaybeWakeLockNavigator = Navigator & { wakeLock?: Partial<WakeLock> };
function hasWakeLock(n: Navigator): n is Navigator & { wakeLock: WakeLock } {
  const cand = n as MaybeWakeLockNavigator;
  return typeof cand.wakeLock?.request === "function";
}

export function KeepScreenAwake() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs that drive behavior
  const shouldHoldRef = useRef(false); // desired state
  const sentinelRef = useRef<WakeLockSentinel | null>(null); // current lock
  const releaseHandlerRef = useRef<((e: Event) => void) | null>(null);

  // SSR-safe support detection
  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && hasWakeLock(navigator));
  }, []);

  const ensureWakeLock = useCallback(async () => {
    try {
      // If not supported or no navigator yet, make sure we're released
      if (typeof navigator === "undefined" || !hasWakeLock(navigator)) {
        if (sentinelRef.current && !sentinelRef.current.released) {
          await sentinelRef.current.release();
          sentinelRef.current = null;
        }
        setError("Screen Wake Lock not supported");
        return;
      }

      const wantHold = shouldHoldRef.current;
      const visible = document.visibilityState === "visible";
      const current = sentinelRef.current;

      // Need a lock
      if (wantHold && visible) {
        if (!current || current.released) {
          const s = await navigator.wakeLock.request("screen");
          sentinelRef.current = s;
          setError(null);

          // Clean up any previous handler (shouldn't exist if current was null, but safe)
          if (releaseHandlerRef.current) {
            s.removeEventListener("release", releaseHandlerRef.current);
            releaseHandlerRef.current = null;
          }

          const onRelease = () => {
            // Lock was released (by UA or OS). Only re-acquire if we still want it and are visible.
            sentinelRef.current = null;
            if (
              shouldHoldRef.current &&
              document.visibilityState === "visible"
            ) {
              void ensureWakeLock();
            }
          };
          releaseHandlerRef.current = onRelease;
          s.addEventListener("release", onRelease);
        }
        return;
      }

      // Do NOT want a lock (or page hidden): release if held
      if (current && !current.released) {
        // detach this lock's handler
        if (releaseHandlerRef.current) {
          current.removeEventListener("release", releaseHandlerRef.current);
          releaseHandlerRef.current = null;
        }
        await current.release();
        sentinelRef.current = null;
      }
    } catch (e: unknown) {
      // Treat errors as not-held and show a message
      sentinelRef.current = null;
      const msg =
        e instanceof DOMException
          ? `${e.name}: ${e.message}`
          : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "Wake Lock failed";
      setError(msg);
    }
  }, []);

  // Re-acquire or release when page visibility changes
  useEffect(() => {
    const onVisibilityChange = () => {
      void ensureWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [ensureWakeLock]);

  // Toggle from the checkbox: update the ref first, then reconcile
  const onChange = async (checked: boolean) => {
    shouldHoldRef.current = checked;
    setEnabled(checked);
    await ensureWakeLock();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldHoldRef.current = false;
      void ensureWakeLock(); // ensures release on unmount
    };
  }, [ensureWakeLock]);

  const supportedText = supported
    ? "Keep screen awake"
    : "Keep screen awake (not supported)";

  return (
    <Group align="center">
      <Checkbox
        checked={enabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
        disabled={!supported}
        label={<Text mt="-2px">{supportedText}</Text>}
      />
      {error && (
        <Notification color="red" mt="sm">
          {error}
        </Notification>
      )}
    </Group>
  );
}
