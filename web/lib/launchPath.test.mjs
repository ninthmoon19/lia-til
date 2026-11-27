// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  cleanLog,
  fitDays,
  parsePlan,
  formatLogSection,
  logsFromDailyLog,
  parseLogSection,
  parseSettings,
} from "./launchPath.ts";

test("a day's results round-trip through the daily-log section", () => {
  const log = { newCount: 4, noHint: 3, redo: 2, mocks: 1, hours: 5.5, note: "sliding window clicked; stuck on #76" };
  const md = formatLogSection(log);
  assert.equal(
    md,
    "- New problems: 4\n- No hint: 3\n- Redo: 2\n- Timed mocks: 1\n- Hours: 5.5\n- Note: sliding window clicked; stuck on #76",
  );
  assert.deepEqual(parseLogSection(md), log);
});

test("the section never trips the backend's public leetcode auto-tag", () => {
  const md = formatLogSection(cleanLog({ newCount: 3 }));
  assert.ok(!/leetcode|\blc\s*\d+/i.test(md));
});

test("input is clamped: no-hint <= new, bounded counts, one-line note", () => {
  assert.deepEqual(cleanLog({ newCount: "3", noHint: 9, redo: -2, mocks: 99, hours: "2.26", note: " a\nb " }), {
    newCount: 3,
    noHint: 3,
    redo: 0,
    mocks: 5,
    hours: 2.5,
    note: "a b",
  });
});

test("hand-edited sections still parse; junk lines are ignored", () => {
  assert.deepEqual(parseLogSection("* new problems: 2\nrandom text\n- Hours: x"), {
    newCount: 2,
    noHint: 0,
    redo: 0,
    mocks: 0,
    hours: 0,
    note: "",
  });
});

test("logsFromDailyLog keeps only days that carry the section", () => {
  const logs = logsFromDailyLog([
    { date: "2026-11-18", sections: { "Launch Path": "- New problems: 4", Tech: "x" } },
    { date: "2026-11-19", sections: { Tech: "y" } },
    { date: "2026-11-20", sections: null },
  ]);
  assert.deepEqual(Object.keys(logs), ["2026-11-18"]);
  assert.equal(logs["2026-11-18"].newCount, 4);
});

test("parseSettings accepts the defaults and rejects out-of-range values", () => {
  assert.deepEqual(parseSettings(DEFAULT_SETTINGS), DEFAULT_SETTINGS);
  // The day count follows the plan's length (1 to 8 phases).
  assert.deepEqual(parseSettings({ ...DEFAULT_SETTINGS, days: [14, 14, 14] })?.days, [14, 14, 14]);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, days: [] }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, days: Array(9).fill(7) }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, days: [0, 14, 14, 17] }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, hours: 13 }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, dayStart: "9am" }), null);
  assert.equal(parseSettings(null), null);
});

test("one-tap logging counts new, no-hint and redo, and undo never goes negative", async () => {
  const { bumpLog } = await import("./launchPath.ts");
  let l = bumpLog(undefined, "noHint", 1);
  assert.deepEqual([l.newCount, l.noHint, l.redo], [1, 1, 0]);
  l = bumpLog(l, "hint", 1);
  assert.deepEqual([l.newCount, l.noHint], [2, 1]);
  l = bumpLog(l, "redo", 1);
  assert.equal(l.redo, 1);
  // Undoing a hinted solve leaves the no-hint one alone.
  l = bumpLog(l, "hint", -1);
  assert.deepEqual([l.newCount, l.noHint], [1, 1]);
  assert.deepEqual(bumpLog(l, "hint", -1), l);
  l = bumpLog(bumpLog(l, "noHint", -1), "noHint", -1);
  assert.deepEqual([l.newCount, l.noHint], [0, 0]);
  // Other fields survive a tap.
  const kept = bumpLog({ newCount: 3, noHint: 1, redo: 0, mocks: 1, hours: 4, note: "ok" }, "redo", 1);
  assert.deepEqual([kept.mocks, kept.hours, kept.note], [1, 4, "ok"]);
});

test("projection and heatmap levels", async () => {
  const { projectTotal, heatLevel } = await import("./launchPath.ts");
  assert.equal(projectTotal(40, 10, 59), 236);
  assert.equal(projectTotal(0, 2, 59), 0);
  assert.equal(projectTotal(5, 0, 59), 5);
  assert.deepEqual([0, 1, 2, 4, 5, 6].map((n) => heatLevel(n, 4)), [0, 1, 2, 3, 3, 4]);
});

const phase = (id, items = []) => ({ id, name: "Phase " + id, tag: "", why: "", interview: false, items });
const item = (id) => ({ id, track: "DSA", title: "Task " + id, detail: "" });

test("parsePlan accepts a clean plan and tidies whitespace", () => {
  const got = parsePlan({ phases: [{ ...phase("p1", [{ ...item("a"), title: "  Two   pointers " }]), interview: true }] });
  assert.equal(got[0].items[0].title, "Two pointers");
  assert.equal(got[0].interview, true);
});

test("parsePlan rejects anything malformed", () => {
  for (const bad of [
    null,
    { phases: [] },
    { phases: Array.from({ length: 9 }, (_, i) => phase("p" + i)) },
    { phases: [phase("p1"), phase("p1")] }, // duplicate phase id
    { phases: [phase("p1", [item("x")]), phase("p2", [item("x")])] }, // duplicate item id
    { phases: [{ ...phase("p1"), name: "  " }] },
    { phases: [phase("p1", [{ ...item("a"), track: "MATH" }])] },
    { phases: [phase("Not An Id")] },
    { phases: [phase("p1", [{ ...item("a"), title: "x".repeat(121) }])] },
  ]) assert.equal(parsePlan(bad), null, JSON.stringify(bad)?.slice(0, 80));
});

test("fitDays keeps existing counts and fills new phases", () => {
  assert.deepEqual(fitDays([10, 20, 30, 40], 2), [10, 20]);
  assert.deepEqual(fitDays([10], 3), [10, 14, 14]);
});
