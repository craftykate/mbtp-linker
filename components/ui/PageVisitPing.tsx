"use client";

import { useEffect } from "react";
import { logUi } from "@/lib/logging/client-logging/logClient";

function ymd(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // "YYYY-MM-DD"
}

export default function PageVisitPing() {
  useEffect(() => {
    // Generate a stable id for this visit; server can de-dupe on this
    const eventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC";

    const payload = {
      ymd: ymd(new Date(), tz),
      tz,
      path: typeof location !== "undefined" ? location.pathname : "/",
      href: typeof location !== "undefined" ? location.href : "/",
    };

    void logUi("page_view", payload, { eventId });
  }, []);

  return null;
}
