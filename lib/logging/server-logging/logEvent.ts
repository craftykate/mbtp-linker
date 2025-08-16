import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/logging/server-logging/firebaseAdmin";
import type { CacheState } from "@/types/logging";

/* ---------- config & types ---------- */

type AppEnv = "dev" | "stage" | "prod";
const ENV: AppEnv =
  (process.env.APP_ENV as AppEnv | undefined) ??
  (process.env.NODE_ENV === "production" ? "prod" : "dev");

type EventName =
  | "dictionary_lookup"
  | "link_suffix_submit"
  | "link_click"
  | "unknown";

const APP_ID = process.env.APP_ID ?? "homeschool-dictionary";

function isServerLoggingEnabled(): boolean {
  // In dev: off by default unless LOG_EVENTS=1
  // In prod: on by default unless LOG_EVENTS=0
  const flag = process.env.LOG_EVENTS;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return process.env.NODE_ENV === "production";
}

type Extras = Partial<{
  cache: CacheState;
  route: string;
  client_ts: number;
  session: string;
  clientId: string;
  ua: string | null;
  eventId: string; // optional de-dupe token
}>;

type EventEnvelope = {
  appId: string;
  env: AppEnv;
  event: EventName;
  ts: FieldValue; // server timestamp sentinel
  cache: CacheState;
  route?: string;
  client_ts?: number;
  session?: string;
  clientId?: string;
  ua: string | null;
  data: Record<string, unknown>;
  eventId?: string;
};

/* ---------- helpers ---------- */

// Deeply remove all `undefined` values from plain objects/arrays
function pruneUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneUndefinedDeep);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = pruneUndefinedDeep(v);
    }
    return out;
  }
  return value;
}

/* ---------- main API ---------- */

export async function logEvent(
  event: EventName,
  data: Record<string, unknown>,
  extras?: Extras
): Promise<void> {
  try {
    if (!isServerLoggingEnabled()) return;

    const coll = db.collection("apps").doc(APP_ID).collection("events");

    // Optional: skip duplicates if the same eventId arrives twice
    if (extras?.eventId) {
      const existing = await coll
        .where("eventId", "==", extras.eventId)
        .limit(1)
        .get();
      if (!existing.empty) return;
    }

    const base: EventEnvelope = {
      appId: APP_ID,
      env: ENV,
      event,
      ts: FieldValue.serverTimestamp(),
      cache: extras?.cache ?? null, // null is allowed in Firestore
      route: extras?.route,
      client_ts: extras?.client_ts,
      session: extras?.session,
      clientId: extras?.clientId,
      ua: extras?.ua ? extras.ua.slice(0, 160) : null,
      data,
      ...(extras?.eventId ? { eventId: extras.eventId } : {}),
    };

    const doc = pruneUndefinedDeep(base) as DocumentData;
    await coll.add(doc);
  } catch {
    // Swallow errors — logging must never affect UX
  }
}
