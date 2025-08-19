"use client";

import { useEffect, useRef } from "react";
import { logUi } from "@/lib/logging/client-logging/logClient";

function ymd(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // "YYYY-MM-DD"
}

function isVercelUA(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("vercel") ||
    ua.includes("vercelbot") ||
    ua.includes("vercel-screenshot")
  );
}

type Props = {
  /** If true, only log after the first real user interaction (helps avoid other bots too). */
  afterInteraction?: boolean;
};

export default function PageVisitPing({ afterInteraction = false }: Props) {
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Skip known Vercel preview/screenshot traffic
    if (isVercelUA()) return;

    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC";

    const eventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;

    const payload = {
      ymd: ymd(new Date(), tz),
      tz,
      path: typeof location !== "undefined" ? location.pathname : "/",
      href: typeof location !== "undefined" ? location.href : "/",
    };

    const send = () => {
      void logUi("page_view", payload, { eventId });
    };

    if (!afterInteraction) {
      send();
      return;
    }

    // Only count after a real user interaction
    const onFirstInteraction = () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      send();
    };

    window.addEventListener("pointerdown", onFirstInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [afterInteraction]);

  return null;
}
