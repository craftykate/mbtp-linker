export const runtime = "nodejs";
export const revalidate = 0;

import { LOG_OPT_OUT_COOKIE } from "@/lib/logging/constants";

function cookieString(on: boolean) {
  const maxAge = on ? 60 * 60 * 24 * 365 : 0; // ~1 year or delete
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${LOG_OPT_OUT_COOKIE}=${
    on ? "1" : ""
  }; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function noStoreHeaders() {
  return new Headers({
    "Cache-Control": "no-store",
    Vary: "Accept-Encoding",
    "X-Robots-Tag": "noindex",
  });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const on = url.searchParams.get("on") === "1";
  const to = url.searchParams.get("to") || "/"; // where to send the browser after

  const headers = noStoreHeaders();
  headers.append("Set-Cookie", cookieString(on));

  // If it's a browser visit, redirect back to your app
  if (req.method === "GET") {
    headers.set("Location", to);
    return new Response(null, { status: 303, headers }); // 303 See Other
  }

  // For programmatic POSTs, just 204
  return new Response(null, { status: 204, headers });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
