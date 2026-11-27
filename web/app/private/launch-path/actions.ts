"use server";

// Writes from the Launch Path tab. Server Actions are reachable by a direct POST,
// so each one re-checks the admin session itself — the page's requireAdmin()
// does not cover them. The backend secret never leaves the server.

import { currentAdmin } from "@/lib/auth";
import { fetchJsonWithRetry } from "@/lib/net";
import { LOG_SECTION, cleanLog, formatLogSection, isIsoDate, parsePlan, parseSettings, type DayLog } from "@/lib/launchPath";

type Result = { ok: true } | { ok: false; error: string };

async function backend(path: string, method: "PATCH" | "PUT", body: unknown): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Signed out. Reload and sign in again." };
  const base = process.env.API_URL?.replace(/\/$/, "");
  const secret = process.env.BACKEND_SECRET;
  if (!base || !secret) return { ok: false, error: "The backend isn't configured." };
  // Both writes are idempotent (set-to-value), so a retry after a cold-start
  // timeout can't double-apply anything.
  const res = await fetchJsonWithRetry<unknown>(
    `${base}${path}`,
    {
      method,
      headers: { "x-admin-secret": secret, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    { deadlineMs: 25_000 },
  );
  return res === null ? { ok: false, error: "The backend didn't respond." } : { ok: true };
}

/** Tick or untick one checklist item. */
export async function setTick(id: string, done: boolean): Promise<Result> {
  // Items are user-editable now, so check the id's shape rather than a fixed list.
  if (typeof id !== "string" || !/^[a-z0-9-]{1,64}$/.test(id) || typeof done !== "boolean") return { ok: false, error: "Unknown item." };
  return backend("/api/launch-path", "PATCH", { tick: { id, done } });
}

/** Replace the plan settings. */
export async function saveSettings(raw: unknown): Promise<Result> {
  const settings = parseSettings(raw);
  if (!settings) return { ok: false, error: "Some settings are out of range." };
  return backend("/api/launch-path", "PATCH", { settings });
}

/** Replace the phases and checklist, with settings whose day counts match it.
 * `plan: null` drops the saved plan so the tab goes back to the default one. */
export async function savePlan(rawPlan: unknown, rawSettings: unknown): Promise<Result> {
  const settings = parseSettings(rawSettings);
  if (!settings) return { ok: false, error: "Some settings are out of range." };
  if (rawPlan === null) return backend("/api/launch-path", "PATCH", { plan: null, settings });
  const phases = parsePlan(rawPlan);
  if (!phases) return { ok: false, error: "Every phase and item needs a name, within the length limits." };
  if (phases.length !== settings.days.length) return { ok: false, error: "Each phase needs a day count." };
  return backend("/api/launch-path", "PATCH", { plan: { phases }, settings });
}

/** Save one day's results as the "Launch Path" section of that day's log. */
export async function saveDayLog(date: string, raw: Partial<Record<keyof DayLog, unknown>>): Promise<Result> {
  if (!isIsoDate(date)) return { ok: false, error: "Pick a date first." };
  const content = formatLogSection(cleanLog(raw ?? {}));
  return backend(`/api/daily-log/${date}/section`, "PUT", { heading: LOG_SECTION, content });
}
