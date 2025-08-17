export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { LOG_OPT_OUT_COOKIE } from "@/lib/logging/constants";
import { logEvent } from "@/lib/logging/server-logging/logEvent";
import type { CacheState, EventName } from "@/types/logging";

type Body = {
  event: EventName;
  data: Record<string, unknown>;
  cache?: CacheState;
  client_ts?: number;
  session?: string;
  clientId?: string;
  eventId?: string;
};

const headersNoStore = {
  "Cache-Control": "no-store",
  Vary: "Accept-Encoding",
  "X-Robots-Tag": "noindex",
};

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const isOptedOut = cookieHeader
      .split(";")
      .some((c) => c.trim().startsWith(`${LOG_OPT_OUT_COOKIE}=1`));
    if (isOptedOut) {
      return new Response(null, { status: 204, headers: headersNoStore }); // drop
    }

    const text = await req.text();
    if (!text) {
      return new Response(null, { status: 204, headers: headersNoStore });
    }

    let body: Body;
    try {
      body = JSON.parse(text) as Body;
    } catch {
      return new Response(null, { status: 204, headers: headersNoStore });
    }

    if (!body.event || typeof body.data !== "object" || body.data === null) {
      return new Response(null, { status: 204, headers: headersNoStore });
    }

    const ua = req.headers.get("user-agent");

    // ✅ Await the write so the serverless runtime doesn't freeze mid-log
    await logEvent(body.event, body.data, {
      cache: body.cache ?? null,
      client_ts: body.client_ts,
      session: body.session ?? null,
      clientId: body.clientId ?? null,
      eventId: body.eventId,
      route: "/api/event",
      ua,
      origin: "client", // <— important
      category: "event", // <— explicit (you can map per-event later)
      severity: "info", // <— explicit
    });

    return new Response(null, { status: 204, headers: headersNoStore });
  } catch {
    // Swallow to keep UX unaffected
    return new Response(null, { status: 204, headers: headersNoStore });
  }
}
