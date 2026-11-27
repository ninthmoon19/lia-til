// Every English string the Launch Path tab shows must have a Chinese entry in
// app/private/launch-path/zh/*.ts, with the same {placeholders}. Untranslated
// strings fall back to English at runtime, so without this test they slip by.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const dir = new URL("../app/private/launch-path/", import.meta.url);
const zh = {};
for (const f of ["app", "data", "static", "charts"]) {
  Object.assign(zh, (await import(new URL(`zh/${f}.ts`, dir)))[`ZH_${f.toUpperCase()}`]);
}
const data = await import(new URL("data.ts", dir));

// Names said in English in Chinese too, so they need no entry.
const SAME = new Set(["DSA"]);

test("every t(\"…\") and row(\"…\") literal in the Launch Path views has a Chinese entry", () => {
  const missing = [];
  for (const f of ["LaunchPath.tsx", "plan-editor.tsx", "static-views.tsx", "charts.tsx"]) {
    const src = fs.readFileSync(new URL(f, dir), "utf8");
    for (const m of src.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g)) {
      const key = JSON.parse(`"${m[1]}"`);
      if (!(key in zh)) missing.push(`${f}: ${key}`);
    }
    // WeekRotation's row("label", "text") helper translates both arguments.
    for (const m of src.matchAll(/\brow\("([^"]+)", "([^"]+)"\)/g)) {
      for (const key of [m[1], m[2]]) if (!(key in zh)) missing.push(`${f}: ${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("every user-visible string in data.ts has a Chinese entry", () => {
  const strings = [
    ...data.DEFAULT_PLAN.flatMap((p) => [p.name, p.tag, p.why, ...p.items.flatMap((i) => [i.title, i.detail])]),
    ...data.TRACKS.map((t) => t.name),
    ...data.TL.flatMap((r) => [r[1], r[2], r[3]]),
    ...data.RULES.flat(),
    ...data.BLOCKS.flatMap((b) => [b.t, b.d, ...(b.p4 ?? [])]),
    ...Object.values(data.TRACKDAY).flat(),
    ...Object.values(data.P4TRACK).flat(),
  ].filter((s) => s && !SAME.has(s));
  assert.deepEqual(strings.filter((s) => !(s in zh)), []);
});

test("Chinese entries keep the English {placeholders}", () => {
  const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  assert.deepEqual(Object.entries(zh).filter(([k, v]) => ph(k) !== ph(v)).map(([k]) => k), []);
});
