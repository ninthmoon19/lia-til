"use client";

// The Launch Path tab: a two-month, LeetCode-first interview sprint. Six hash-
// routed sub-views (#today #path #day #timing #chart #kit). State comes from the
// server on load; every change is applied optimistically and saved through a
// Server Action (ticks + settings → site_meta, day results → that day's log).

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { CalendarClock, CircleCheckBig, Clock3, Lightbulb, Map as MapIcon, Orbit, Pencil, RotateCcw, Sparkles, Sun, Wrench, type LucideIcon } from "lucide-react";
import { bumpLog, cleanLog, isIsoDate, type DayLog, type LaunchSettings, type PlanPhase, type Tap } from "@/lib/launchPath";
import { saveDayLog, savePlan, saveSettings, setTick } from "./actions";
import { CumChart, DayBar, Gantt, Heatmap, Roadmap, Spark, SprintRing, Tracks } from "./charts";
import { DEFAULT_PLAN, KCOL } from "./data";
import {
  addDays,
  allItems,
  buildSchedule,
  computePhases,
  daysBetween,
  dur,
  fitPhases,
  hm,
  iso,
  pD,
  phaseFor,
  planEnd,
  stats,
  type Phase,
  type SchedBlock,
} from "./plan";
import { LangProvider, setStoredLang, useStoredLang, useT, type I18n, type Vars } from "./i18n";
import { SKINS, skinPref, type Skin } from "./prefs";
import { PlanEditor } from "./plan-editor";
import { ChartReading, TimelineList, Toolkit, WeekRotation } from "./static-views";

const VIEWS = [
  ["today", "Today", Sun],
  ["path", "Path", MapIcon],
  ["day", "Day", Clock3],
  ["timing", "Timing", CalendarClock],
  ["chart", "Chart reading", Orbit],
  ["kit", "Toolkit", Wrench],
] as const satisfies readonly (readonly [string, string, LucideIcon])[];
type View = (typeof VIEWS)[number][0];

/** `text` is an English key for t(); `date` fills {d} in the viewer's language. */
export type Status = { text: string; vars?: Vars; date?: string; err?: boolean };

// Dates follow the browser's clock and time zone, and the view follows the URL
// hash, so the tab renders on the client only (the server sends a shell).
const noopSubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const useHash = () => useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");

export type LaunchPathProps = {
  initialPlan: PlanPhase[];
  initialSettings: LaunchSettings;
  initialDone: string[];
  initialLogs: Record<string, DayLog>;
};

export default function LaunchPath(props: LaunchPathProps) {
  const isClient = useIsClient();
  const lang = useStoredLang();
  if (!isClient) {
    return (
      <div className="wrap">
        <header className="top">
          <span className="label">Prep sprint</span>
          <h1>Lia&apos;s Launch Path</h1>
          <p className="sub">Loading…</p>
        </header>
      </div>
    );
  }
  return (
    <LangProvider lang={lang}>
      <LaunchPathClient {...props} />
    </LangProvider>
  );
}

function LaunchPathClient({ initialPlan, initialSettings, initialDone, initialLogs }: LaunchPathProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [settings, setSettings] = useState(initialSettings);
  const [done, setDone] = useState(() => new Set(initialDone));
  const [logs, setLogs] = useState(initialLogs);
  const [now, setNow] = useState(() => Date.now());
  const i18n = useT();
  const { t, lang } = i18n;
  // The visual style is a data attribute on the page root (.lp, rendered by the
  // server component), so skins.css can restyle everything including the background.
  const skin = skinPref.use();
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = wrapRef.current?.closest<HTMLElement>(".lp");
    if (root) root.dataset.skin = skin;
  }, [skin]);
  const [sync, setSync] = useState<Status>({ text: "Synced with lia-til" });
  const [setStatus, setSetStatus] = useState<Status>({ text: "" });

  const hash = useHash();
  const view: View = VIEWS.some(([v]) => v === hash) ? (hash as View) : "today";

  // Re-render each minute so "today" and the current schedule block stay right.
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const top = () => window.scrollTo({ top: 0 });
    window.addEventListener("hashchange", top);
    return () => window.removeEventListener("hashchange", top);
  }, []);
  const tipRef = useTooltip();

  const nowDate = new Date(now);
  const today = iso(nowDate);
  const minuteOfDay = nowDate.getHours() * 60 + nowDate.getMinutes();
  const phases = computePhases(settings, plan);
  const end = planEnd(phases);
  const cur = phaseFor(phases, today);
  const totalDays = daysBetween(settings.start, end) + 1;
  const items = allItems(phases);
  const nDone = items.filter((i) => done.has(i.id)).length;

  // ---- writes ---------------------------------------------------------------
  const toggle = async (id: string, on: boolean) => {
    const apply = (val: boolean) =>
      setDone((prev) => {
        const next = new Set(prev);
        if (val) next.add(id);
        else next.delete(id);
        return next;
      });
    apply(on);
    setSync({ text: "Saving…" });
    const res = await setTick(id, on);
    if (res.ok) setSync({ text: "Saved" });
    else {
      apply(!on);
      setSync({ text: "Not saved: {e}", vars: { e: res.error }, err: true });
    }
  };

  // Settings save 700 ms after the last change, always sending the newest copy.
  const latest = useRef(settings);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeSettings = (patch: Partial<LaunchSettings>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    setSetStatus({ text: "Saving…" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveSettings(latest.current);
      setSetStatus(res.ok ? { text: "Saved" } : { text: "Not saved: {e}", vars: { e: res.error }, err: true });
    }, 700);
  };

  // The plan saves as a whole, together with one day count per phase. `null`
  // goes back to the default plan. On failure the page keeps the old plan and
  // the editor stays open with the draft.
  const changePlan = async (next: PlanPhase[] | null, days: number[]): Promise<Status> => {
    const before = { plan, settings: latest.current };
    const nextSettings = { ...latest.current, days };
    if (timer.current) clearTimeout(timer.current); // this save carries the newest settings too
    latest.current = nextSettings;
    setPlan(next ?? DEFAULT_PLAN);
    setSettings(nextSettings);
    const res = await savePlan(next, nextSettings);
    if (res.ok) {
      setSetStatus({ text: "Saved" });
      return { text: "Saved" };
    }
    latest.current = before.settings;
    setPlan(before.plan);
    setSettings(before.settings);
    return { text: "Not saved: {e}", vars: { e: res.error }, err: true };
  };

  const saveLog = async (date: string, log: DayLog): Promise<Status> => {
    const before = logs[date];
    setLogs((prev) => ({ ...prev, [date]: log }));
    const res = await saveDayLog(date, log);
    if (res.ok) return { text: "Saved {d} to the daily log", date };
    setLogs((prev) => {
      const next = { ...prev };
      if (before) next[date] = before;
      else delete next[date];
      return next;
    });
    return { text: "Not saved: {e}", vars: { e: res.error }, err: true };
  };

  // One-tap counters on the Now card. Taps apply at once; a burst of taps is
  // saved once, 600 ms after the last one, and rolled back if the save fails.
  const tapSave = useRef<{ timer: ReturnType<typeof setTimeout> | null; date: string; before?: DayLog; latest?: DayLog }>(
    { timer: null, date: "" },
  );
  const tap = (kind: Tap, delta: 1 | -1) => {
    const t = tapSave.current;
    if (!t.timer || t.date !== today) {
      if (t.timer) clearTimeout(t.timer);
      t.date = today;
      t.before = logs[today];
    }
    const next = bumpLog(logs[today], kind, delta);
    t.latest = next;
    setLogs((prev) => ({ ...prev, [today]: next }));
    setSync({ text: "Saving…" });
    t.timer = setTimeout(async () => {
      const { date, before, latest } = t;
      t.timer = null;
      const res = await saveDayLog(date, latest!);
      if (res.ok) {
        setSync({ text: "Saved {d} to the daily log", date });
        return;
      }
      setLogs((prev) => {
        const out = { ...prev };
        if (before) out[date] = before;
        else delete out[date];
        return out;
      });
      setSync({ text: "Not saved: {e}", vars: { e: res.error }, err: true });
    }, 600);
  };

  return (
    <div className="wrap" ref={wrapRef} lang={lang === "zh" ? "zh-Hans" : "en"}>
      <header className="top">
        <div className="toprow">
          <Link href="/private" className="back">&larr; {t("Private")}</Link>
          <div className="prefs">
            <SkinSwitch />
            <LangSwitch />
          </div>
        </div>
        <span className="label">{sprintEyebrow(i18n, settings.start, end, today, totalDays)}</span>
        <h1>{t("Lia's Launch Path")}</h1>
        <p className="sub">
          {t("A LeetCode-first interview sprint for junior SWE and AI engineer roles. Change any date, hour or target on the Path tab.")}
        </p>
        <div className="overall">
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${items.length ? (100 * nDone) / items.length : 0}%` }} />
          </div>
          <span className="mono">{t("{n} / {total} items", { n: nDone, total: items.length })}</span>
          <StatusText s={sync} />
        </div>
      </header>

      <nav className="tabs" aria-label={t("Sections")}>
        {VIEWS.map(([v, label, Icon]) => (
          <a key={v} href={`#${v}`} aria-current={view === v ? "page" : undefined}>
            <Icon aria-hidden="true" className="ico" />
            {t(label)}
          </a>
        ))}
      </nav>

      {view === "today" && (
        <TodayView settings={settings} phases={phases} cur={cur} done={done} logs={logs} today={today}
          minuteOfDay={minuteOfDay} onSaveLog={saveLog} onTap={tap} sync={sync} />
      )}
      {view === "path" && (
        <PathView settings={settings} plan={plan} phases={phases} cur={cur} done={done} status={setStatus}
          onChange={changeSettings} onToggle={toggle} onStatus={setSetStatus} onSavePlan={changePlan} />
      )}
      {view === "day" && (
        <section className="view">
          <p className="lede">
            {t("One template for every day. LeetCode takes the three morning-and-early-afternoon blocks while focus is freshest. The fourth block rotates by weekday so the novelty-hungry side stays engaged. Change your hours or start time on the Path tab and every block rescales.")}
          </p>
          <div className="vizcard">
            <div className="ph-row">
              <h3>{t("The day, block by block")}</h3>
              <span className="legend">
                <span><i className="sw" style={{ background: "var(--s1)" }} />{t("LeetCode")}</span>
                <span><i className="sw" style={{ background: "var(--s2)" }} />{t("Rotating track")}</span>
                <span><i className="sw" style={{ background: "var(--s3)" }} />{t("Output + applications")}</span>
                <span><i className="sw" style={{ background: "var(--neutral-soft)" }} />{t("Break")}</span>
              </span>
            </div>
            <div className="vizbox"><DayBar schedule={buildSchedule(settings, phases, today)} /></div>
            <Schedule settings={settings} phases={phases} date={today} today={today} minuteOfDay={minuteOfDay} />
          </div>
          <WeekRotation />
        </section>
      )}
      {view === "timing" && (
        <section className="view">
          <p className="lede">
            {t("Dates come straight from the precomputed charts. They are a pacing guide, not a forecast. The job market and your prep set the real calendar.")}
          </p>
          <div className="vizcard">
            <div className="ph-row">
              <h3>{t("Cycles, 2026–2028")}</h3>
              <span className="legend">
                <span><i className="sw" style={{ background: "var(--plan-soft)", outline: "1.5px solid var(--s1)" }} />{t("Your plan")}</span>
                <span><i className="sw" style={{ background: "var(--accent-soft)", outline: "1.5px solid var(--accent)" }} />{t("Favorable")}</span>
                <span><i className="sw" style={{ background: "var(--warm-soft)", outline: "1.5px solid var(--warm)" }} />{t("Caution")}</span>
                <span><i className="sw" style={{ background: "var(--neutral-soft)" }} />{t("Background theme")}</span>
              </span>
            </div>
            <div className="vizbox"><Gantt phases={phases} today={today} /></div>
            <p className="cap">{t("Each row comes from one system. Hover any bar or diamond for details. The dashed line is today.")}</p>
          </div>
          <TimelineList />
        </section>
      )}
      {view === "chart" && (
        <section className="view"><ChartReading /></section>
      )}
      {view === "kit" && (
        <section className="view"><Toolkit /></section>
      )}
      <div className="lp-tip" ref={tipRef} hidden />
    </div>
  );
}

// ---- Today ----------------------------------------------------------------------

function sprintEyebrow({ t, fmt }: I18n, start: string, end: string, today: string, totalDays: number) {
  if (today < start) return t("Prep sprint · starts {d} · {n} days", { d: fmt(start), n: totalDays });
  if (today > end) return t("Prep sprint · ended {d}", { d: fmt(end) });
  const dayN = daysBetween(start, today) + 1;
  return t("Day {n} of {total} · {left} days left · ends {d}", { n: dayN, total: totalDays, left: totalDays - dayN, d: fmt(end) });
}

function TodayView({
  settings, phases, cur, done, logs, today, minuteOfDay, onSaveLog, onTap, sync,
}: {
  settings: LaunchSettings; phases: Phase[]; cur: Phase; done: Set<string>; logs: Record<string, DayLog>;
  today: string; minuteOfDay: number; onSaveLog: (date: string, log: DayLog) => Promise<Status>;
  onTap: (kind: Tap, delta: 1 | -1) => void; sync: Status;
}) {
  const { t, fmt, fmtS } = useT();
  const next = allItems(phases).filter((i) => !done.has(i.id))
    .sort((a, b) => (a.phaseId === cur.id ? 0 : 1) - (b.phaseId === cur.id ? 0 : 1))
    .slice(0, 3);
  const sch = buildSchedule(settings, phases, today);
  const lc = sch.filter((b) => b.k === "lc").reduce((a, b) => a + b.mins, 0);
  const st = sch.filter((b) => b.k !== "brk").reduce((a, b) => a + b.mins, 0);
  const s = stats(settings, phases, logs, today);
  const diff = s.nw - s.expected;
  const end = planEnd(phases);
  const totalDays = daysBetween(settings.start, end) + 1;
  const dayN = Math.min(totalDays, Math.max(0, daysBetween(settings.start, today) + 1));
  const last14 = Array.from({ length: 14 }, (_, i) => logs[addDays(today, i - 13)]?.newCount ?? 0);

  // This week (Mon-Sun) for the heatmap's side panel.
  const mon = addDays(today, -((pD(today).getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i)).filter((d) => d >= settings.start && d <= today);
  const wk = week.reduce((a, d) => ({ n: a.n + (logs[d]?.newCount ?? 0), r: a.r + (logs[d]?.redo ?? 0), on: a.on + (logs[d] ? 1 : 0) }), { n: 0, r: 0, on: 0 });
  const best = Object.entries(logs).filter(([d]) => d >= settings.start && d <= end).sort((a, b) => b[1].newCount - a[1].newCount)[0];

  return (
    <section className="view">
      <div className="row2">
        <NowCard sch={sch} minuteOfDay={minuteOfDay} log={logs[today]} target={settings.dailyNew} onTap={onTap} sync={sync} />
        <div className="vizcard glance">
          <span className="label">{t("Sprint at a glance")}</span>
          <div className="ringwrap">
            <SprintRing solved={s.nw} goal={settings.goal} dayN={dayN} totalDays={totalDays} />
            <dl className="klist">
              <div className={s.need <= settings.dailyNew ? "ok" : "warn"}>
                <dt>{t("{n} / day", { n: s.need })}</dt>
                <dd>{s.left ? t("pace needed for {goal} by {d}", { goal: settings.goal, d: fmtS(end) }) : t("sprint window is over")}</dd>
              </div>
              <div className={s.nw ? (diff >= 0 ? "ok" : "warn") : ""}>
                <dt>{s.nw ? (diff >= 0 ? `+${diff}` : String(diff)) : "—"}</dt>
                <dd>{s.nw ? (diff >= 0 ? t("ahead of plan") : t("behind plan")) : t("vs plan, after your first log")}</dd>
                {s.nw > 0 && <Spark values={last14} color={diff >= 0 ? "var(--accent)" : "var(--warm)"} />}
              </div>
              <div>
                <dt>{s.nw ? `${Math.round((100 * s.nh) / s.nw)}%` : "—"}</dt>
                <dd>{t("solved with no hint · {nh} of {nw}", { nh: s.nh, nw: s.nw })}</dd>
              </div>
              <div className={s.streak >= 3 ? "ok" : ""}>
                <dt>{t(s.streak === 1 ? "{n} day" : "{n} days", { n: s.streak })}</dt>
                <dd>{s.streak ? t("logging streak") : t("streak starts with today's log")}</dd>
              </div>
            </dl>
          </div>
          <p className="note">{t("{rd} redo · {mk} timed mocks · {hr} h logged", { rd: s.rd, mk: s.mk, hr: s.hr })}</p>
        </div>
      </div>

      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("{n}-day sprint", { n: totalDays })}</h3>
          <span className="legend">
            <span>{t("Fewer")}</span>
            {[0, 1, 2, 3, 4].map((l) => <i key={l} className="sw" style={{ background: `var(${["--empty", "--h1", "--h2", "--h3", "--h4"][l]})`, margin: 0 }} />)}
            <span>{t("More new problems (target {n})", { n: settings.dailyNew })}</span>
            <span>{t("◆ chart milestone")}</span>
          </span>
        </div>
        <div className="heatrow">
          <div className="vizbox"><Heatmap settings={settings} phases={phases} logs={logs} today={today} /></div>
          <dl className="heatside">
            <div><dt>{wk.n}</dt><dd>{t("new this week · {r} redo", { r: wk.r })}</dd></div>
            <div><dt>{`${wk.on} / ${week.length}`}</dt><dd>{t("days logged this week")}</dd></div>
            <div><dt>{best && best[1].newCount ? best[1].newCount : "—"}</dt><dd>{best && best[1].newCount ? t("best day · {d}", { d: fmtS(best[0]) }) : t("best day so far")}</dd></div>
          </dl>
        </div>
        <p className="cap">{t("One square per day. Today is outlined; dashed squares are still ahead. Hover a square for that day's numbers.")}</p>
      </div>

      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("Total vs plan")}</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--s1)" }} />{t("You")}</span>
            <span>{t("– – Plan")}</span>
            <span>{t("··· Your pace")}</span>
            <span><i className="sw" style={{ background: "var(--accent-soft)", outline: "1px solid var(--accent)" }} />{t("Ahead")}</span>
            <span><i className="sw" style={{ background: "var(--warm-soft)", outline: "1px solid var(--warm)" }} />{t("Behind")}</span>
          </span>
        </div>
        <div className="vizbox"><CumChart settings={settings} phases={phases} logs={logs} today={today} /></div>
        <p className="cap">
          {t("A problem counts as solved only if you could write it again tomorrow without looking. Anything you finished with the solution open goes in \"Redo\" instead.")}
        </p>
      </div>

      <div className="split">
        <div className="today">
          <span className="label">{t("Current phase · {a} – {b}", { a: fmt(cur.start), b: fmt(cur.end) })}</span>
          <h2>{t(cur.name)}</h2>
          <p className="ph-why">{t(cur.why)}</p>
          <h3 style={{ marginTop: 6 }}>{t("Next three unchecked")}</h3>
          <ol>
            {next.length === 0 && <li>{t("Everything is checked. Go take the offer.")}</li>}
            {next.map((i) => (
              <li key={i.id}><b>{t(i.title)}</b>{" — " + t(i.detail)}</li>
            ))}
          </ol>
        </div>
        <div className="vizcard">
          <div className="ph-row">
            <h3>{t("Today's schedule")}</h3>
            <span className="mono">{t("{st} study · LeetCode {lc} ({pct}%)", { st: dur(st), lc: dur(lc), pct: Math.round((100 * lc) / st) })}</span>
          </div>
          <Schedule settings={settings} phases={phases} date={today} today={today} minuteOfDay={minuteOfDay} />
        </div>
      </div>

      <details className="vizcard more">
        <summary><h3>{t("Mocks, hours, a note, or another day")}</h3><span className="cap">{t("The buttons above cover new problems and redos. Use this for everything else.")}</span></summary>
        <LogForm logs={logs} today={today} onSave={onSaveLog} className="logform" />
      </details>

      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("Roadmap")}</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--accent)" }} />{t("Done")}</span>
            <span><i className="sw" style={{ background: "var(--accent-soft)", outline: "1px solid var(--accent)" }} />{t("To do")}</span>
            <span>{t("◆ chart milestone")}</span>
          </span>
        </div>
        <div className="vizbox"><Roadmap settings={settings} phases={phases} done={done} today={today} /></div>
        <p className="cap">{t("Each bar fills as you tick items in that phase. Change phase lengths on the Path tab and this redraws.")}</p>
      </div>
      <div className="vizcard">
        <h3>{t("Progress by track")}</h3>
        <Tracks done={done} phases={phases} />
      </div>
    </section>
  );
}

const TAPS: { kind: Tap; label: string; add: string; Icon: LucideIcon; count: (l: DayLog) => number }[] = [
  { kind: "noHint", label: "Solved, no hint", add: "+1 solved, no hint", Icon: CircleCheckBig, count: (l) => l.noHint },
  { kind: "hint", label: "Solved with a hint", add: "+1 solved with a hint", Icon: Lightbulb, count: (l) => l.newCount - l.noHint },
  { kind: "redo", label: "Redo", add: "+1 redo", Icon: RotateCcw, count: (l) => l.redo },
];
const ZERO: DayLog = { newCount: 0, noHint: 0, redo: 0, mocks: 0, hours: 0, note: "" };

/** What to do right now, from today's schedule and the clock, plus one-tap
 * counters so logging happens as you go instead of in a form at night. */
function NowCard({ sch, minuteOfDay, log = ZERO, target, onTap, sync }: {
  sch: SchedBlock[]; minuteOfDay: number; log?: DayLog; target: number;
  onTap: (kind: Tap, delta: 1 | -1) => void; sync: Status;
}) {
  const { t } = useT();
  const i = sch.findIndex((b) => minuteOfDay >= b.start && minuteOfDay < b.start + b.mins);
  const curB = i >= 0 ? sch[i] : null;
  const before = minuteOfDay < sch[0].start;
  const dayEnd = sch[sch.length - 1].start + sch[sch.length - 1].mins;
  const upNext = sch.slice(i >= 0 ? i + 1 : 0).find((b) => b.k !== "brk");
  const pct = curB ? (100 * (minuteOfDay - curB.start)) / curB.mins : before ? 0 : 100;
  return (
    <div className="nowcard">
      <div className="ph-row">
        <span className="label">
          {curB ? t("Now · block {n} of {total}", { n: i + 1, total: sch.length }) : before ? t("Before the day starts") : t("Today's blocks are done")}
        </span>
        <StatusText s={sync} />
      </div>
      <div className="now-title">
        {curB && <i className="dot" style={{ "--c": KCOL[curB.k] } as CSSProperties} />}
        {curB ? t(curB.title) : before ? t("First block at {tm}: {title}", { tm: hm(sch[0].start), title: t(sch[0].title) }) : t("Log what you did, then stop.")}
      </div>
      <p className="ph-why">
        {curB
          ? curB.desc ? t(curB.desc) : t("Step away from the screen. Water, a short walk.")
          : before
            ? t("Warm up with one easy redo if you want a head start.")
            : t("Target was {n} new problems. A bad-energy day still counts with 2 new and 1 redo.", { n: target })}
      </p>
      <div className="tbar" aria-hidden="true"><i style={{ width: `${pct.toFixed(1)}%` }} /></div>
      <div className="now-meta mono">
        <span>{curB ? `${hm(curB.start)}–${hm(curB.start + curB.mins)}` : `${hm(sch[0].start)}–${hm(dayEnd)}`}</span>
        <span>{curB ? t("{n} min left", { n: curB.start + curB.mins - minuteOfDay }) : before ? t("{n} min to start", { n: sch[0].start - minuteOfDay }) : ""}</span>
      </div>
      <div className="taps">
        {TAPS.map((tp) => {
          const n = tp.count(log);
          return (
            <div key={tp.kind} className={"tap " + tp.kind}>
              <button type="button" className="tap-add" onClick={() => onTap(tp.kind, 1)} aria-label={t("Add one: {what}", { what: t(tp.label) })}>
                <tp.Icon aria-hidden="true" className="ico" />
                <span className="v">{n}</span>
                <span className="k">{t(tp.add)}</span>
              </button>
              <button type="button" className="tap-undo" onClick={() => onTap(tp.kind, -1)} disabled={n === 0}
                aria-label={t("Remove one: {what}", { what: t(tp.label) })} title={t("Undo one")}>−1</button>
            </div>
          );
        })}
      </div>
      <div className="now-goal">
        <div className="tbar thin" aria-hidden="true"><i style={{ width: `${Math.min(100, (100 * log.newCount) / target)}%` }} /></div>
        <span className="mono">{t("{n} of {target} new today", { n: log.newCount, target })}</span>
      </div>
      {upNext && curB && (
        <p className="now-next">
          <span className="label">{t("Next")}</span>
          <i className="dot" style={{ "--c": KCOL[upNext.k] } as CSSProperties} />
          {`${hm(upNext.start)} · ${t(upNext.title)}`}
        </p>
      )}
    </div>
  );
}

/** A save-status line. Status keeps the English key so it re-renders in the
 * current language; `date` is formatted at render time for the same reason. */
function StatusText({ s }: { s: Status }) {
  const { t, fmtS } = useT();
  return (
    <span className={"status" + (s.err ? " err" : "")} role="status">
      {s.text ? t(s.text, { ...s.vars, d: s.date ? fmtS(s.date) : "" }) : ""}
    </span>
  );
}

const SKIN_LABEL: Record<Skin, string> = { classic: "Classic", pixel: "Pixel", bubbly: "Bubbly", poster: "Poster" };

/** Visual style switch. The choice is stored per browser. */
function SkinSwitch() {
  const { t } = useT();
  const skin = skinPref.use();
  return (
    <div className="lang skin" role="group" aria-label={t("Style")}>
      <Sparkles aria-hidden="true" className="ico" />
      {SKINS.map((s) => (
        <button key={s} type="button" aria-pressed={skin === s} onClick={() => skinPref.set(s)}>{t(SKIN_LABEL[s])}</button>
      ))}
    </div>
  );
}

/** EN / 中文 switch. The choice is stored per browser. */
function LangSwitch() {
  const { lang, t } = useT();
  return (
    <div className="lang" role="group" aria-label={t("Language")}>
      <button type="button" aria-pressed={lang === "en"} onClick={() => setStoredLang("en")} lang="en">EN</button>
      <button type="button" aria-pressed={lang === "zh"} onClick={() => setStoredLang("zh")} lang="zh-Hans">中文</button>
    </div>
  );
}

function Schedule({ settings, phases, date, today, minuteOfDay }: {
  settings: LaunchSettings; phases: Phase[]; date: string; today: string; minuteOfDay: number;
}) {
  const { t } = useT();
  const isToday = date === today;
  return (
    <ol className="sched">
      {buildSchedule(settings, phases, date).map((b) => {
        const nowBlock = isToday && minuteOfDay >= b.start && minuteOfDay < b.start + b.mins;
        return (
          <li key={b.start} className={(b.k === "brk" ? "brk" : "") + (nowBlock ? " now" : "")}>
            <span className="tm">{`${hm(b.start)}–${hm(b.start + b.mins)}`}</span>
            <div className="bl">
              <i className="dot" style={{ "--c": KCOL[b.k] } as CSSProperties} />
              <b>{t(b.title)}</b>
              {b.desc && <div className="d">{t(b.desc)}</div>}
            </div>
            <span className="du">{dur(b.mins)}</span>
          </li>
        );
      })}
    </ol>
  );
}

type LogDraft = Record<"newCount" | "noHint" | "redo" | "mocks" | "hours" | "note", string>;
const draftFrom = (l?: DayLog): LogDraft => ({
  newCount: l ? String(l.newCount) : "",
  noHint: l ? String(l.noHint) : "",
  redo: l ? String(l.redo) : "",
  mocks: l ? String(l.mocks) : "",
  hours: l ? String(l.hours) : "",
  note: l?.note ?? "",
});

function LogForm({ logs, today, onSave, className = "vizcard" }: {
  logs: Record<string, DayLog>; today: string; onSave: (date: string, log: DayLog) => Promise<Status>; className?: string;
}) {
  const { t } = useT();
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState(() => draftFrom(logs[today]));
  const [status, setStatus] = useState<Status>({ text: "" });
  const [busy, setBusy] = useState(false);

  const pickDate = (d: string) => {
    setDate(d);
    if (isIsoDate(d)) setDraft(draftFrom(logs[d]));
  };
  const set = (k: keyof LogDraft) => (e: { target: { value: string } }) => setDraft((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isIsoDate(date)) {
      setStatus({ text: "Pick a date first.", err: true });
      return;
    }
    const log = cleanLog(draft);
    setDraft(draftFrom(log)); // show what will be stored (e.g. no-hint capped at new)
    setBusy(true);
    setStatus({ text: "Saving…" });
    setStatus(await onSave(date, log));
    setBusy(false);
  };

  const num = (k: keyof LogDraft, label: string, max: number, step?: number) => (
    <label className="fld">
      <span>{t(label)}</span>
      <input type="number" min={0} max={max} step={step} inputMode={step ? "decimal" : "numeric"} placeholder="0"
        value={draft[k]} onChange={set(k)} />
    </label>
  );

  return (
    <form className={className} autoComplete="off" onSubmit={submit}>
      <div className="ph-row">
        <h3>{t("Edit any day")}</h3>
        <StatusText s={status} />
      </div>
      <div className="fields">
        <label className="fld">
          <span>{t("Date")}</span>
          <input type="date" value={date} onChange={(e) => pickDate(e.target.value)} />
        </label>
        {num("newCount", "New problems solved", 40)}
        {num("noHint", "…of those, no hint", 40)}
        {num("redo", "Redo problems", 40)}
        {num("mocks", "Timed mocks", 5)}
        {num("hours", "Hours studied", 16, 0.5)}
      </div>
      <label className="fld">
        <span>{t("One-line win or blocker")}</span>
        <input type="text" maxLength={200} placeholder={t("e.g. sliding window clicked; stuck on #76")} value={draft.note} onChange={set("note")} />
      </label>
      <button type="submit" className="btn" disabled={busy}>{t("Save day")}</button>
    </form>
  );
}

// ---- Path -------------------------------------------------------------------------

/** An input that commits valid values as you type, but keeps your half-typed
 * draft while focused and snaps back to the stored value on blur. */
function DraftInput({ value, parse, onCommit, ...rest }: {
  value: string;
  parse: (raw: string) => string | null;
  onCommit: (v: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onFocus" | "onBlur">) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (value !== prev) {
    // Adjust state while rendering when the stored value changes elsewhere.
    setPrev(value);
    if (!focused) setDraft(value);
  }
  return (
    <input
      {...rest}
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setDraft(value);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = parse(e.target.value);
        if (v !== null) onCommit(v);
      }}
    />
  );
}

const intParse = (lo: number, hi: number) => (raw: string) => {
  const n = Number(raw);
  return raw.trim() !== "" && Number.isInteger(n) && n >= lo && n <= hi ? String(n) : null;
};

function PathView({ settings, plan, phases, cur, done, status, onChange, onToggle, onStatus, onSavePlan }: {
  settings: LaunchSettings; plan: PlanPhase[]; phases: Phase[]; cur: Phase; done: Set<string>; status: Status;
  onChange: (patch: Partial<LaunchSettings>) => void; onToggle: (id: string, on: boolean) => void;
  onStatus: (s: Status) => void; onSavePlan: (plan: PlanPhase[] | null, days: number[]) => Promise<Status>;
}) {
  const { t, fmt } = useT();
  const [editing, setEditing] = useState(false);
  const end = planEnd(phases);
  const total = daysBetween(settings.start, end) + 1;
  const [finish, setFinish] = useState<string | null>(null);

  const fit = () => {
    const f = finish ?? end;
    if (!isIsoDate(f) || f <= settings.start) {
      onStatus({ text: "Finish date must be after the start date.", err: true });
      return;
    }
    onChange({ days: fitPhases(settings, f) });
    setFinish(null);
  };

  return (
    <section className="view">
      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("Plan settings")}</h3>
          <StatusText s={status} />
        </div>
        <p className="cap">
          {t("Change anything here and every date, schedule and chart on the page follows. To shorten or stretch one phase, edit its day count below. To move the whole finish line, set \"Finish by\" and press Fit.")}
        </p>
        <div className="fields">
          <label className="fld">
            <span>{t("Start date")}</span>
            <DraftInput type="date" value={settings.start} parse={(v) => (isIsoDate(v) ? v : null)} onCommit={(v) => onChange({ start: v })} />
          </label>
          <label className="fld">
            <span>{t("Finish by")}</span>
            <DraftInput type="date" value={end} parse={(v) => (isIsoDate(v) ? v : null)} onCommit={setFinish} />
          </label>
          <label className="fld">
            <span>{t("Study hours per day")}</span>
            <DraftInput type="number" min={1} max={12} step={0.5} value={String(settings.hours)}
              parse={(v) => { const n = parseFloat(v); return n >= 1 && n <= 12 ? String(n) : null; }}
              onCommit={(v) => onChange({ hours: Number(v) })} />
          </label>
          <label className="fld">
            <span>{t("Day starts at")}</span>
            <DraftInput type="time" value={settings.dayStart} parse={(v) => (/^\d{2}:\d{2}$/.test(v) ? v : null)}
              onCommit={(v) => onChange({ dayStart: v })} />
          </label>
          <label className="fld">
            <span>{t("New problems per day")}</span>
            <DraftInput type="number" min={1} max={15} value={String(settings.dailyNew)} parse={intParse(1, 15)}
              onCommit={(v) => onChange({ dailyNew: Number(v) })} />
          </label>
          <label className="fld">
            <span>{t("Total problem goal")}</span>
            <DraftInput type="number" min={10} max={1000} step={10} value={String(settings.goal)} parse={intParse(10, 1000)}
              onCommit={(v) => onChange({ goal: Number(v) })} />
          </label>
        </div>
        <div className="ph-row">
          <button type="button" className="btn" onClick={fit}>{t("Fit phases to finish date")}</button>
          <span className="mono">
            {t("{total} days · {split} · goal {goal} ≈ {rate} new / day", { total, split: phases.map((p) => p.days).join(" + "), goal: settings.goal, rate: (settings.goal / total).toFixed(1) })}
          </span>
        </div>
      </div>

      <div className="ph-row plan-head">
        <h3>{t("Phases and checklist")}</h3>
        {!editing && (
          <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="ico" />{t("Edit plan")}
          </button>
        )}
      </div>
      {editing ? (
        <PlanEditor plan={plan} days={settings.days} done={done}
          onSave={onSavePlan} onClose={() => setEditing(false)} />
      ) : (
      <div style={{ display: "grid", gap: 18 }}>
        {phases.map((p, idx) => {
          const n = p.items.filter((i) => done.has(i.id)).length;
          const isCur = cur.id === p.id;
          return (
            <div key={p.id} className="phase">
              <div className="ph-head">
                <div className="ph-row">
                  <h3>{t(p.name)}</h3>
                  <span className="mono">{`${fmt(p.start)} – ${fmt(p.end)} · ${n}/${p.items.length}`}</span>
                </div>
                <div className="ph-row">
                  <span className={"pill" + (isCur ? "" : " ink")}>{isCur ? t("Now · {tag}", { tag: t(p.tag) }) : t(p.tag)}</span>
                  <label className="ph-days">
                    <DraftInput type="number" min={1} max={90} value={String(p.days)} aria-label={t("Days for {name}", { name: t(p.name) })}
                      parse={intParse(1, 90)}
                      onCommit={(v) => onChange({ days: settings.days.map((d, i) => (i === idx ? Number(v) : d)) })} />
                    {t("days")}
                  </label>
                </div>
                <p className="ph-why">{t(p.why)}</p>
              </div>
              <ul className="items">
                {p.items.map((it) => {
                  const on = done.has(it.id);
                  return (
                    <li key={it.id} className={on ? "done" : ""}>
                      <input type="checkbox" id={"cb-" + it.id} checked={on} onChange={(e) => onToggle(it.id, e.target.checked)} />
                      <label htmlFor={"cb-" + it.id}>
                        <div className="t">
                          <span className={"tk " + it.track}>{it.track}</span>
                          <span className="tx">{t(it.title)}</span>
                        </div>
                        <div className="d">{t(it.detail)}</div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}

// ---- tooltip ------------------------------------------------------------------------

/** One floating tooltip for every `[data-tip]` element. Positioned directly on
 * the DOM node (no React state), since it moves on every pointer event. */
function useTooltip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tip = ref.current;
    if (!tip) return;
    const place = (e: PointerEvent) => {
      if (tip.hidden) return;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let X = e.clientX + 14, Y = e.clientY + 16;
      if (X + w > window.innerWidth - 8) X = Math.max(8, e.clientX - w - 14);
      if (Y + h > window.innerHeight - 8) Y = e.clientY - h - 12;
      tip.style.left = X + "px";
      tip.style.top = Y + "px";
    };
    const show = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.("[data-tip]");
      if (!t) {
        tip.hidden = true;
        return;
      }
      tip.textContent = t.getAttribute("data-tip");
      tip.hidden = false;
      place(e);
    };
    const hide = () => {
      tip.hidden = true;
    };
    document.addEventListener("pointerover", show);
    document.addEventListener("pointermove", place);
    document.addEventListener("pointerdown", show);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("pointerover", show);
      document.removeEventListener("pointermove", place);
      document.removeEventListener("pointerdown", show);
      window.removeEventListener("scroll", hide);
    };
  }, []);
  return ref;
}
