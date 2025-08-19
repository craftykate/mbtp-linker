export const formatTimer = (secs: number) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes}:${s}`
    : `${minutes}:${s}`;
};

// Use in client components
export function formatIsoToLocalTime(
  iso: string | Date,
  opts: {
    timeZone?: string; // e.g. "America/New_York"; default = browser tz (client) or "UTC" (SSR)
    hour12?: boolean; // default: true (12-hour clock)
    includeSeconds?: boolean; // default: false
    includeDate?: boolean; // default: false (prefix with "Aug 18" if true)
    ampmLowercase?: boolean; // default: true -> "pm" instead of "PM"
    locale?: string; // default: undefined (user locale)
  } = {}
): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return typeof iso === "string" ? iso : "";

  const tz =
    opts.timeZone ??
    (typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const timeFmt = new Intl.DateTimeFormat(opts.locale, {
    hour: "numeric",
    minute: "2-digit",
    ...(opts.includeSeconds ? { second: "2-digit" } : {}),
    hour12: opts.hour12 ?? true,
    timeZone: tz,
  });

  let time = timeFmt.format(d);

  // Normalize AM/PM to lowercase if requested
  if (opts.ampmLowercase !== false) {
    time = time.replace(/\s?(AM|PM)$/i, (m) => m.trim().toLowerCase());
  }

  if (!opts.includeDate) return time;

  // Add a short date prefix if requested
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(opts.locale, {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    timeZone: tz,
  });

  return `${dateFmt.format(d)} ${time}`;
}
