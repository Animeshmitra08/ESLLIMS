const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-06-18T18:29:55.653", optionally followed by "Z" or "+05:30".
const API_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/**
 * Formats an API date-time such as "2026-06-18T18:29:55.653" as
 * "18 Jun 2026, 6:29 PM".
 *
 * The parts are read straight from the string rather than through `Date`, so
 * the server's wall-clock time is shown as-is on every device, whatever its
 * time zone. Anything that doesn't match is returned unchanged.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const match = API_DATE_TIME.exec(value);
  if (!match) return value;

  const [, year, month, day, hour, minute] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return value;

  const hours = Number(hour);
  const period = hours < 12 ? "AM" : "PM";
  const hours12 = hours % 12 || 12;
  return `${Number(day)} ${monthName} ${year}, ${hours12}:${minute} ${period}`;
}
