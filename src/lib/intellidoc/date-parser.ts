import { parse, parseISO, isValid } from 'date-fns';

/**
 * All date formats IntelliDoc may produce, in priority order.
 * date-fns `parse` format tokens: https://date-fns.org/v2/docs/parse
 */
const DATE_FORMAT_TEMPLATES = [
  // ISO 8601 — handled separately via parseISO
  // Named month formats
  "d-MMM-yyyy",      // 10-Jun-2026
  "dd-MMM-yyyy",     // 10-Jun-2026 (zero-padded)
  "d MMM yyyy",      // 10 Jun 2026
  "dd MMM yyyy",     // 10 Jun 2026
  "d-MMMM-yyyy",     // 10-June-2026
  "d MMMM yyyy",     // 10 June 2026
  "MMMM d, yyyy",    // June 10, 2026
  "MMM d, yyyy",     // Jun 10, 2026
  "MMM dd, yyyy",    // Jun 10, 2026
  // Numeric separators — slash
  "dd/MM/yyyy",      // 10/06/2026  (dd first — Indian standard)
  "MM/dd/yyyy",      // 06/10/2026  (US format)
  "yyyy/MM/dd",      // 2026/06/10
  "d/M/yyyy",        // 1/6/2026
  "M/d/yyyy",        // 6/1/2026
  // Numeric separators — dash
  "dd-MM-yyyy",      // 10-06-2026
  "MM-dd-yyyy",      // 06-10-2026
  "yyyy-MM-dd",      // 2026-06-10  (also caught by parseISO)
  "d-M-yyyy",        // 1-6-2026
  // Numeric separators — dot
  "dd.MM.yyyy",      // 10.06.2026
  "yyyy.MM.dd",      // 2026.06.10
  // With time (strip time portion; we only keep the date)
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd HH:mm:ss",
  // Two-digit year (treat as 20xx)
  "dd/MM/yy",        // 10/06/26
  "MM/dd/yy",        // 06/10/26
];

const REF_DATE = new Date(2000, 0, 1); // reference for date-fns parse

export interface ParsedDateResult {
  date: Date | null;
  formatUsed: string | null;
  error?: string;
}

/**
 * Parses a date string (or number epoch) using every known format.
 * Returns the first valid match, or null if no format succeeds.
 */
export function parseFlexibleDate(raw: unknown): ParsedDateResult {
  if (raw == null || raw === '') {
    return { date: null, formatUsed: null, error: 'Empty value' };
  }

  // Already a Date object
  if (raw instanceof Date) {
    return isValid(raw) ? { date: raw, formatUsed: 'Date' } : { date: null, formatUsed: null, error: 'Invalid Date object' };
  }

  // Numeric epoch (milliseconds)
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isValid(d) ? { date: d, formatUsed: 'epoch_ms' } : { date: null, formatUsed: null, error: 'Invalid epoch' };
  }

  const str = String(raw).trim();

  // Pure numeric — treat as epoch if >9 digits, otherwise fail
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    if (str.length >= 10) {
      const d = new Date(str.length === 10 ? n * 1000 : n); // seconds or ms
      if (isValid(d)) return { date: d, formatUsed: 'epoch_numeric' };
    }
    return { date: null, formatUsed: null, error: `Cannot interpret '${str}' as a date` };
  }

  // Try ISO 8601 first (fastest path for well-formed inputs)
  try {
    const iso = parseISO(str);
    if (isValid(iso)) return { date: iso, formatUsed: 'ISO8601' };
  } catch { /* fall through */ }

  // Try every template
  for (const fmt of DATE_FORMAT_TEMPLATES) {
    try {
      const d = parse(str, fmt, REF_DATE);
      if (isValid(d)) return { date: d, formatUsed: fmt };
    } catch { /* try next */ }
  }

  return { date: null, formatUsed: null, error: `Unrecognized date format: '${str}'` };
}
