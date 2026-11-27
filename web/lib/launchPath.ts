// Launch Path data shapes, shared by the server (page, Server Actions) and the
// client tab. No imports on purpose: `node --test` runs the sibling test file
// against this module directly.

/** Plan settings — every date, schedule and chart on the tab derives from these. */
export type LaunchSettings = {
  start: string; // YYYY-MM-DD
  days: number[]; // one length per phase, in plan order (1-8 phases)
  hours: number; // study hours per day, 1-12
  dayStart: string; // HH:MM
  dailyNew: number; // new problems per day, 1-15
  goal: number; // total problem goal, 10-1000
};

/** One day's LeetCode results. */
export type DayLog = {
  newCount: number;
  noHint: number;
  redo: number;
  mocks: number;
  hours: number;
  note: string;
};

export const DEFAULT_SETTINGS: LaunchSettings = {
  start: "2026-11-18",
  days: [14, 14, 14, 17],
  hours: 6,
  dayStart: "09:00",
  dailyNew: 4,
  goal: 220,
};

/** The heading the results are stored under in daily_logs.sections. */
export const LOG_SECTION = "Launch Path";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^\d{2}:\d{2}$/;
export const isIsoDate = (s: unknown): s is string => typeof s === "string" && ISO.test(s);

const intIn = (v: unknown, lo: number, hi: number): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

/** Accept settings only if every field is in range; otherwise null. Used on
 * stored data (fall back to defaults) and on Server Action input (reject). */
export function parseSettings(raw: unknown): LaunchSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const hours = Number(s.hours);
  const days = Array.isArray(s.days) ? s.days.map((d) => intIn(d, 1, 90)) : [];
  const dailyNew = intIn(s.dailyNew, 1, 15);
  const goal = intIn(s.goal, 10, 1000);
  if (!isIsoDate(s.start) || typeof s.dayStart !== "string" || !HM.test(s.dayStart)) return null;
  if (!(hours >= 1 && hours <= 12) || dailyNew === null || goal === null) return null;
  if (days.length < 1 || days.length > PLAN_LIMITS.phases || days.some((d) => d === null)) return null;
  return { start: s.start, days: days as number[], hours, dayStart: s.dayStart, dailyNew, goal };
}

// ---- the editable plan ---------------------------------------------------------
// The phases and their checklist. The default lives in the tab's data.ts; once
// saved from the Path tab, the stored copy replaces it. Settings keep one day
// count per phase, so `fitDays` lines the two up after any change.

export const TRACK_IDS = ["DSA", "AI", "SWE", "STORY", "RA"] as const;
export type Track = (typeof TRACK_IDS)[number];
export type PlanItem = { id: string; track: Track; title: string; detail: string };
/** `interview` switches the daily schedule to mock-interview blocks during the phase. */
export type PlanPhase = { id: string; name: string; tag: string; why: string; interview: boolean; items: PlanItem[] };

export const PLAN_LIMITS = { phases: 8, items: 40, name: 80, tag: 40, why: 600, title: 120, detail: 300 } as const;
const PLAN_ID = /^[a-z0-9-]{1,64}$/;

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  return s.length <= max ? s : null;
};

/** Accept a plan only if every phase and item is well formed; otherwise null.
 * Phase and item ids must be unique, since ticks are stored by item id. */
export function parsePlan(raw: unknown): PlanPhase[] | null {
  const list = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as { phases?: unknown }).phases : raw;
  if (!Array.isArray(list) || list.length < 1 || list.length > PLAN_LIMITS.phases) return null;
  const seen = new Set<string>();
  const fresh = (id: unknown): id is string => typeof id === "string" && PLAN_ID.test(id) && !seen.has(id) && !!seen.add(id);
  const out: PlanPhase[] = [];
  for (const p of list) {
    if (!p || typeof p !== "object") return null;
    const q = p as Record<string, unknown>;
    const name = text(q.name, PLAN_LIMITS.name), tag = text(q.tag ?? "", PLAN_LIMITS.tag), why = text(q.why ?? "", PLAN_LIMITS.why);
    if (!fresh(q.id) || !name || tag === null || why === null || !Array.isArray(q.items) || q.items.length > PLAN_LIMITS.items) return null;
    const items: PlanItem[] = [];
    for (const i of q.items) {
      if (!i || typeof i !== "object") return null;
      const r = i as Record<string, unknown>;
      const title = text(r.title, PLAN_LIMITS.title), detail = text(r.detail ?? "", PLAN_LIMITS.detail);
      if (!fresh(r.id) || !title || detail === null || !TRACK_IDS.includes(r.track as Track)) return null;
      items.push({ id: r.id, track: r.track as Track, title, detail });
    }
    out.push({ id: q.id, name, tag, why, interview: q.interview === true, items });
  }
  return out;
}

/** One day count per phase: keep the ones there are, give new phases `fill` days. */
export const fitDays = (days: number[], n: number, fill = 14): number[] =>
  Array.from({ length: n }, (_, i) => days[i] ?? fill);

/** A new id for a phase or item that no existing one uses. */
export function newPlanId(prefix: "ph" | "it", taken: Iterable<string>): string {
  const used = new Set(taken);
  for (;;) {
    const id = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
    if (!used.has(id)) return id;
  }
}

// ---- the daily-log section -----------------------------------------------------
// Stored as a short, human-readable markdown list so it reads naturally in the
// private Daily Log view (and in a vault export), while still parsing back
// exactly. The labels deliberately avoid "LeetCode"/"LC <n>", which would make
// the backend's auto-tagger add a public "leetcode" tag to the day.

const FIELDS: [keyof Omit<DayLog, "note">, string][] = [
  ["newCount", "New problems"],
  ["noHint", "No hint"],
  ["redo", "Redo"],
  ["mocks", "Timed mocks"],
  ["hours", "Hours"],
];
const NOTE_LABEL = "Note";

const clampNum = (v: unknown, hi: number, step = 1): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(hi, Math.round(n / step) * step);
};

/** Normalize untrusted input into a valid DayLog (no-hint never exceeds new). */
export function cleanLog(raw: Partial<Record<keyof DayLog, unknown>>): DayLog {
  const newCount = clampNum(raw.newCount, 40);
  return {
    newCount,
    noHint: Math.min(newCount, clampNum(raw.noHint, 40)),
    redo: clampNum(raw.redo, 40),
    mocks: clampNum(raw.mocks, 5),
    hours: clampNum(raw.hours, 16, 0.5),
    note: String(raw.note ?? "").replace(/\s+/g, " ").trim().slice(0, 200),
  };
}

export function formatLogSection(log: DayLog): string {
  const lines = FIELDS.map(([k, label]) => `- ${label}: ${log[k]}`);
  if (log.note) lines.push(`- ${NOTE_LABEL}: ${log.note}`);
  return lines.join("\n");
}

/** Parse a stored section back. Unknown or missing lines read as 0 / "". */
export function parseLogSection(md: string): DayLog {
  const raw: Partial<Record<keyof DayLog, unknown>> = {};
  for (const line of md.split("\n")) {
    const m = /^\s*[-*]\s*([^:]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const label = m[1].trim().toLowerCase();
    if (label === NOTE_LABEL.toLowerCase()) {
      raw.note = m[2];
      continue;
    }
    const field = FIELDS.find(([, l]) => l.toLowerCase() === label);
    if (field) raw[field[0]] = m[2];
  }
  return cleanLog(raw);
}

/** Pull every day's results out of the full daily log. */
export function logsFromDailyLog(
  entries: { date: string; sections?: Record<string, string> | null }[],
): Record<string, DayLog> {
  const out: Record<string, DayLog> = {};
  for (const e of entries) {
    const md = e.sections?.[LOG_SECTION];
    if (isIsoDate(e.date) && typeof md === "string" && md.trim()) out[e.date] = parseLogSection(md);
  }
  return out;
}

// ---- one-tap logging and the Today visuals ---------------------------------------

/** The three one-tap counters on the Now card. */
export type Tap = "noHint" | "hint" | "redo";

const EMPTY_LOG: DayLog = { newCount: 0, noHint: 0, redo: 0, mocks: 0, hours: 0, note: "" };

/** Apply one tap (+1) or undo (-1) to a day's log. "noHint" and "hint" both
 * count a new problem; only "noHint" also counts toward the no-hint total. */
export function bumpLog(log: DayLog | undefined, tap: Tap, delta: 1 | -1): DayLog {
  const l = { ...EMPTY_LOG, ...log };
  if (tap === "redo") l.redo += delta;
  else {
    // Undoing a hinted solve can't take away a no-hint one.
    if (tap === "hint" && delta < 0 && l.newCount - 1 < l.noHint) return cleanLog(l);
    l.newCount += delta;
    if (tap === "noHint") l.noHint += delta;
  }
  return cleanLog(l);
}

/** Where the total lands on the last day if the average so far holds.
 * `elapsed` counts today, so day 1 with 4 solved projects 4 per day. */
export function projectTotal(solved: number, elapsed: number, totalDays: number): number {
  if (elapsed <= 0) return solved;
  return Math.round((solved / elapsed) * totalDays);
}

/** Heatmap shade 0-4 for a day's new problems against the daily target. */
export function heatLevel(n: number, target: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n >= target * 1.5) return 4;
  if (n >= target) return 3;
  if (n >= target / 2) return 2;
  return 1;
}
