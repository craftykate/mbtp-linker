import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/logging/server-logging/firebaseAdmin";
import type {
  CacheState,
  LogCategory,
  Severity,
  EventName,
} from "@/types/logging";

/* ---------- config & types ---------- */

type AppEnv = "dev" | "stage" | "prod";
const ENV: AppEnv =
  (process.env.APP_ENV as AppEnv | undefined) ??
  (process.env.NODE_ENV === "production" ? "prod" : "dev");

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
  session: string | null;
  clientId: string | null;
  userId: string | null;
  ua: string | null;
  eventId: string; // for de-dupe
  origin: "client" | "server";
  category: LogCategory;
  severity: Severity;
  version: string | null;
  ttlDays: number; // (to compute ttlAt)
}>;

type EventEnvelope = {
  appId: string;
  env: AppEnv;
  event: EventName;
  category: LogCategory;
  severity: Severity;
  origin: "client" | "server";
  ts: FieldValue;
  client_ts?: number;
  eventId?: string;

  // principals / trace
  userId?: string | null;
  session?: string | null;
  clientId?: string | null;

  // request-ish
  route?: string;
  cache: CacheState;
  version?: string | null;
  ua: string | null;

  // housekeeping
  ttlAt?: FieldValue;

  // payload
  data: Record<string, unknown>;
};

/* ---------- helpers ---------- */

// Deeply remove all `undefined` values from plain objects/arrays
function isPlainObject(x: unknown): x is Record<string, unknown> {
  if (typeof x !== "object" || x === null) return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

function pruneUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneUndefinedDeep);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = pruneUndefinedDeep(v);
    }
    return out;
  }
  // IMPORTANT: leave non-plain objects alone (FieldValue, Timestamp, etc.)
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

    // Prefer true idempotency: if eventId present, create doc with that ID.
    if (extras?.eventId) {
      const base: EventEnvelope = {
        appId: APP_ID,
        env: ENV,
        event,
        category: extras.category ?? "event",
        severity: extras.severity ?? "info",
        origin: extras.origin ?? "server",
        ts: FieldValue.serverTimestamp(),
        client_ts: extras.client_ts,
        eventId: extras.eventId,
        userId: extras.userId ?? null,
        session: extras.session ?? null,
        clientId: extras.clientId ?? null,
        route: extras.route,
        cache: extras.cache ?? null,
        version: extras.version ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        ua: extras.ua ? extras.ua.slice(0, 160) : null,
        data,
        ttlAt:
          extras.ttlDays != null
            ? (FieldValue.serverTimestamp() as unknown as FieldValue) // placeholder; see note below
            : undefined,
      };

      // NOTE: Firestore can't compute ttlAt = now+N at write without Cloud Functions.
      // If you want TTL, either write an absolute timestamp from server code,
      // or attach a Cloud Function to backfill ttlAt. For now you can omit ttlAt
      // or pass a precomputed Date from server where you know "now".
      const doc = pruneUndefinedDeep(base) as DocumentData;

      try {
        await coll.doc(extras.eventId).create(doc);
      } catch {
        // ALREADY_EXISTS -> drop
      }
      return;
    }

    // Fallback (no eventId): simple add()
    const base: EventEnvelope = {
      appId: APP_ID,
      env: ENV,
      event,
      category: extras?.category ?? "event",
      severity: extras?.severity ?? "info",
      origin: extras?.origin ?? "server",
      ts: FieldValue.serverTimestamp(),
      client_ts: extras?.client_ts,
      userId: extras?.userId ?? null,
      session: extras?.session ?? null,
      clientId: extras?.clientId ?? null,
      route: extras?.route,
      cache: extras?.cache ?? null,
      version: extras?.version ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      ua: extras?.ua ? extras.ua.slice(0, 160) : null,
      data,
    };

    const doc = pruneUndefinedDeep(base) as DocumentData;
    await coll.add(doc);
  } catch {
    // swallow
  }
}
