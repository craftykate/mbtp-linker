"use client";

import { useCallback, useEffect, useState } from "react";
import { LOG_OPT_OUT_COOKIE } from "@/lib/logging/constants";

const hasCookie = () =>
  typeof document !== "undefined" &&
  document.cookie.split("; ").some((c) => c === `${LOG_OPT_OUT_COOKIE}=1`);

export function useLogOptOut() {
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => setOptedOut(hasCookie()), []);

  const enable = useCallback(async () => {
    await fetch("/api/logging/optout?on=1", { method: "POST" });
    setOptedOut(true);
  }, []);
  const disable = useCallback(async () => {
    await fetch("/api/logging/optout?on=0", { method: "POST" });
    setOptedOut(false);
  }, []);

  return { optedOut, enable, disable };
}
