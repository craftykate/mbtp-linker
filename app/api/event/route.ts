export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { logEvent } from "@/lib/logging/server-logging/logEvent";
import type { CacheState } from "@/types/logging";

type EventName =
  | "dictionary_lookup"
  | "link_suffix_submit"
  | "link_click"
  | "unknown";

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
    const text = await req.text();
    if (!text)
      return new Response(null, { status: 204, headers: headersNoStore });

    let body: Body;
    try {
      body = JSON.parse(text) as Body;
    } catch {
      return new Response(null, { status: 204, headers: headersNoStore });
    }

    if (!body.event || typeof body.data !== "object" || body.data === null) {
      return new Response(null, { status: 204, headers: headersNoStore });
    }

    // Fire-and-forget; let the logger enforce enablement
    const ua = req.headers.get("user-agent");
    void logEvent(body.event, body.data, {
      cache: body.cache ?? null,
      client_ts: body.client_ts,
      session: body.session,
      clientId: body.clientId,
      eventId: body.eventId,
      route: "/api/event",
      ua,
    }).catch(() => {});

    return new Response(null, { status: 204, headers: headersNoStore });
  } catch {
    // Swallow to keep UX unaffected
    return new Response(null, { status: 204, headers: headersNoStore });
  }
}
