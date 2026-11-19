// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  cleanLog,
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
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, days: [14, 14, 14] }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, days: [0, 14, 14, 17] }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, hours: 13 }), null);
  assert.equal(parseSettings({ ...DEFAULT_SETTINGS, dayStart: "9am" }), null);
  assert.equal(parseSettings(null), null);
});
