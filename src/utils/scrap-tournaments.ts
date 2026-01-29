import * as cheerio from "cheerio";
import { ITournament } from "../interfaces/tournament-interface";

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDateInRange(today: Date, start: Date, end: Date): boolean {
  const t = toDateOnly(today).getTime();
  const s = toDateOnly(start).getTime();
  const e = toDateOnly(end).getTime();
  return t >= s && t <= e;
}

function extractCodeFromOnclick(onclick: string | undefined): string | null {
  if (!onclick) return null;

  // Example: location.href='0000167/'
  const m = onclick.match(/location\.href\s*=\s*'([^']+)'/i);
  if (!m) return null;

  // m[1] = "0000167/" (or maybe "/0000167/" etc.)
  const path = m[1].trim().replace(/^\/+/, "").replace(/\/+$/, "");
  // If it's just digits, great. If it's "0000167/something", take first segment.
  const code = path.split("/")[0];
  return code || null;
}

/**
 * Parses:
 * - "January 24-25, 2026"
 * - "January 16-18, 2026"
 * - "October 18, 2025"
 */
function parseDateRange(dateTextRaw: string): { start: Date; end: Date } {
  const dateText = dateTextRaw
    .replace(/\u2013|\u2014/g, "-") // en/em dash -> hyphen
    .replace(/\s+/g, " ")
    .trim();

  // Range: "January 24-25, 2026"
  let m = dateText.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})$/i,
  );
  if (m) {
    const monthName = m[1].toLowerCase();
    const month = MONTHS[monthName];
    if (month === undefined) throw new Error(`Unknown month: ${m[1]}`);

    const dayStart = Number(m[2]);
    const dayEnd = Number(m[3]);
    const year = Number(m[4]);

    const start = new Date(year, month, dayStart);
    const end = new Date(year, month, dayEnd);
    return { start, end };
  }

  // Single day: "October 18, 2025"
  m = dateText.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/i);
  if (m) {
    const monthName = m[1].toLowerCase();
    const month = MONTHS[monthName];
    if (month === undefined) throw new Error(`Unknown month: ${m[1]}`);

    const day = Number(m[2]);
    const year = Number(m[3]);

    const start = new Date(year, month, day);
    const end = new Date(year, month, day);
    return { start, end };
  }

  throw new Error(`Unsupported date format: "${dateTextRaw}"`);
}

function extractNameAndDateFromButtonText(buttonTextRaw: string): {
  name: string;
  dateText: string;
} {
  // Your button text is like:
  // "2026 Mérida ... Championships\n - January 24-25, 2026"
  // There might be \r\n and spaces
  const cleaned = buttonTextRaw.replace(/\r/g, "").split("\n").join(" ").trim();

  // Fallback: if HTML collapses lines to a single string:
  // "Name - January 24-25, 2026"
  const idx = cleaned.lastIndexOf(" - ");
  if (idx !== -1) {
    const name = cleaned.slice(0, idx).trim();
    const dateText = cleaned.slice(idx + 3).trim();
    return { name, dateText };
  }

  throw new Error(
    `Could not split name/date from button text: "${buttonTextRaw}"`,
  );
}

/**
 * Parse the HTML you showed and return tournaments occurring on `today` (default: now).
 */
function getTodaysTournamentsFromHtml(
  html: string,
  today: Date = new Date(),
): ITournament[] {
  const $ = cheerio.load(html);
  const tournaments: ITournament[] = [];

  $("button[onclick]").each((_, el) => {
    const onclick = $(el).attr("onclick");
    const code = extractCodeFromOnclick(onclick);
    if (!code) return;

    const text = $(el).text();
    if (!text?.trim()) return;

    let name: string;
    let dateText: string;
    try {
      ({ name, dateText } = extractNameAndDateFromButtonText(text));
    } catch {
      return;
    }

    let startDate: Date;
    let endDate: Date;
    try {
      const range = parseDateRange(dateText);
      startDate = range.start;
      endDate = range.end;
    } catch {
      return;
    }

    if (isDateInRange(today, startDate, endDate)) {
      tournaments.push({
        code,
        name,
        startDate,
        endDate,
        dateText,
      });
    }
  });

  return tournaments;
}

/**
 * Convenience: fetch the page and return today's tournaments.
 */
export async function fetchTodaysTournaments(
  url: string,
  today: Date = new Date(),
): Promise<ITournament[]> {
  const res = await fetch(url, { headers: { accept: "text/html" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return getTodaysTournamentsFromHtml(html, today);
}
