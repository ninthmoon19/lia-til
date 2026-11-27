// Pure plan math: dates, phases, the daily schedule and the outcome stats.
// Every date is a local-calendar "YYYY-MM-DD" string; nothing here reads the clock
// except todayISO(), so the rest is deterministic.

import type { DayLog, LaunchSettings, PlanPhase } from "@/lib/launchPath";
import { BLOCKS, P4TRACK, TRACKDAY, type BlockKind } from "./data";

export const DAY = 86_400_000;

export const pD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
};
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (s: string, n: number) => {
  const d = pD(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const daysBetween = (a: string, b: string) => Math.round((pD(b).getTime() - pD(a).getTime()) / DAY);
export const fmt = (s: string) => pD(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtS = (s: string) => pD(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const todayISO = () => iso(new Date());
export const toMin = (s: string) => {
  const [h, m] = String(s || "09:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const hm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " m" : ""}` : `${m} m`);

export type Phase = PlanPhase & { start: string; end: string; days: number };

export function computePhases(s: LaunchSettings, plan: PlanPhase[]): Phase[] {
  let cur = s.start;
  return plan.map((p, i) => {
    const n = Math.max(1, Math.min(90, Math.trunc(s.days[i] ?? 14) || 1));
    const start = cur;
    const end = addDays(start, n - 1);
    cur = addDays(end, 1);
    return { ...p, start, end, days: n };
  });
}

/** Every checklist item, tagged with its phase. */
export const allItems = (phases: PlanPhase[]) => phases.flatMap((p) => p.items.map((i) => ({ ...i, phaseId: p.id })));

export const planEnd = (phases: Phase[]) => phases[phases.length - 1].end;

export function phaseFor(phases: Phase[], d: string): Phase {
  return (
    phases.find((p) => d >= p.start && d <= p.end) ?? (d < phases[0].start ? phases[0] : phases[phases.length - 1])
  );
}

/** Rescale the phases proportionally so the plan ends on `finish`. */
export function fitPhases(s: LaunchSettings, finish: string): number[] {
  const total = daysBetween(s.start, finish) + 1;
  const sum = s.days.reduce((a, b) => a + b, 0);
  const nd = s.days.map((d) => Math.max(2, Math.round((d * total) / sum)));
  nd[nd.length - 1] = Math.max(2, total - nd.slice(0, -1).reduce((a, b) => a + b, 0));
  return nd;
}

export type SchedBlock = { k: BlockKind; start: number; mins: number; title: string; desc: string };

export function buildSchedule(s: LaunchSettings, phases: Phase[], date: string): SchedBlock[] {
  const p4 = phaseFor(phases, date).interview;
  const dow = pD(date).getDay();
  const f = (s.hours * 60) / 360;
  let t = toMin(s.dayStart);
  const out: SchedBlock[] = [];
  for (const b of BLOCKS) {
    const mins = b.k === "brk" ? b.m! : Math.max(10, Math.round((b.w! * f) / 5) * 5);
    let title = b.t;
    let desc = b.d ?? "";
    if (b.k === "trk") [title, desc] = (p4 && P4TRACK[dow]) || TRACKDAY[dow];
    if (p4 && b.p4) [title, desc] = b.p4;
    out.push({ k: b.k, start: t, mins, title, desc });
    t += mins;
  }
  return out;
}

const active = (l?: DayLog) => !!l && l.newCount + l.redo > 0;

export type Stats = {
  nw: number; // new problems solved
  nh: number; // ...of those, no hint
  rd: number;
  mk: number;
  hr: number;
  streak: number;
  expected: number; // where plan pace says the total should be today
  left: number; // days left in the plan, today included
  need: number; // new problems per day needed to hit the goal
};

export function stats(s: LaunchSettings, phases: Phase[], logs: Record<string, DayLog>, today: string): Stats {
  let nw = 0,
    nh = 0,
    rd = 0,
    mk = 0,
    hr = 0;
  for (const l of Object.values(logs)) {
    nw += l.newCount;
    nh += l.noHint;
    rd += l.redo;
    mk += l.mocks;
    hr += l.hours;
  }
  // The streak counts back from today; an unlogged today doesn't break it yet.
  let streak = 0;
  let d = today;
  if (!active(logs[d])) d = addDays(d, -1);
  while (active(logs[d])) {
    streak++;
    d = addDays(d, -1);
  }
  const end = planEnd(phases);
  const total = daysBetween(s.start, end) + 1;
  const elapsed = Math.min(total, Math.max(0, daysBetween(s.start, today) + 1));
  const expected = Math.round((s.goal * elapsed) / total);
  const left = today > end ? 0 : Math.min(total, daysBetween(today, end) + 1);
  const need = left ? Math.ceil(Math.max(0, s.goal - nw) / left) : 0;
  return { nw, nh, rd, mk, hr: Math.round(hr * 10) / 10, streak, expected, left, need };
}
