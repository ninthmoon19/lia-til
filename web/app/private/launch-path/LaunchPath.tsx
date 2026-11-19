"use client";

// The Launch Path tab: a two-month, LeetCode-first interview sprint. Six hash-
// routed sub-views (#today #path #day #timing #chart #kit). State comes from the
// server on load; every change is applied optimistically and saved through a
// Server Action (ticks + settings → site_meta, day results → that day's log).

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { cleanLog, isIsoDate, type DayLog, type LaunchSettings } from "@/lib/launchPath";
import { saveDayLog, saveSettings, setTick } from "./actions";
import { CumChart, DailyChart, DayBar, Gantt, Roadmap, Tracks } from "./charts";
import { ALL_ITEMS, KCOL } from "./data";
import {
  buildSchedule,
  computePhases,
  daysBetween,
  dur,
  fitPhases,
  fmt,
  fmtS,
  hm,
  iso,
  phaseFor,
  planEnd,
  stats,
  type Phase,
} from "./plan";
import { ChartReading, TimelineList, Toolkit, WeekRotation } from "./static-views";

const VIEWS = [
  ["today", "Today"],
  ["path", "Path"],
  ["day", "Day"],
  ["timing", "Timing"],
  ["chart", "Chart reading"],
  ["kit", "Toolkit"],
] as const;
type View = (typeof VIEWS)[number][0];

type Status = { text: string; err?: boolean };

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
  initialSettings: LaunchSettings;
  initialDone: string[];
  initialLogs: Record<string, DayLog>;
};

export default function LaunchPath(props: LaunchPathProps) {
  const isClient = useIsClient();
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
  return <LaunchPathClient {...props} />;
}

function LaunchPathClient({ initialSettings, initialDone, initialLogs }: LaunchPathProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [done, setDone] = useState(() => new Set(initialDone));
  const [logs, setLogs] = useState(initialLogs);
  const [now, setNow] = useState(() => Date.now());
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
  const phases = computePhases(settings);
  const end = planEnd(phases);
  const cur = phaseFor(phases, today);
  const totalDays = daysBetween(settings.start, end) + 1;
  const nDone = ALL_ITEMS.filter((i) => done.has(i.id)).length;

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
      setSync({ text: `Not saved: ${res.error}`, err: true });
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
      setSetStatus(res.ok ? { text: "Saved" } : { text: `Not saved: ${res.error}`, err: true });
    }, 700);
  };

  const saveLog = async (date: string, log: DayLog): Promise<Status> => {
    const before = logs[date];
    setLogs((prev) => ({ ...prev, [date]: log }));
    const res = await saveDayLog(date, log);
    if (res.ok) return { text: `Saved ${fmtS(date)} to the daily log` };
    setLogs((prev) => {
      const next = { ...prev };
      if (before) next[date] = before;
      else delete next[date];
      return next;
    });
    return { text: `Not saved: ${res.error}`, err: true };
  };

  return (
    <div className="wrap">
      <header className="top">
        <Link href="/private" className="back">&larr; Private</Link>
        <span className="label">{`Prep sprint · ${fmt(settings.start)} → ${fmt(end)} · ${totalDays} days`}</span>
        <h1>Lia&apos;s Launch Path</h1>
        <p className="sub">
          A two-month, LeetCode-first interview sprint for junior SWE and AI engineer roles. Every date, hour and target is yours to change on the Path tab. The charts (BaZi, Zi Wei Dou Shu, Western) and your ADHD + ENTP wiring shape the pacing. Your logged results decide what happens next.
        </p>
        <div className="overall">
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${(100 * nDone) / ALL_ITEMS.length}%` }} />
          </div>
          <span className="mono">{`${nDone} / ${ALL_ITEMS.length} items`}</span>
          <span className={"status" + (sync.err ? " err" : "")} role="status">{sync.text}</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Sections">
        {VIEWS.map(([v, label]) => (
          <a key={v} href={`#${v}`} aria-current={view === v ? "page" : undefined}>{label}</a>
        ))}
      </nav>

      {view === "today" && (
        <TodayView settings={settings} phases={phases} cur={cur} done={done} logs={logs} today={today}
          minuteOfDay={minuteOfDay} onSaveLog={saveLog} />
      )}
      {view === "path" && (
        <PathView settings={settings} phases={phases} cur={cur} done={done} status={setStatus}
          onChange={changeSettings} onToggle={toggle} onStatus={setSetStatus} />
      )}
      {view === "day" && (
        <section className="view">
          <p className="lede">
            One template for every day. LeetCode takes the three morning-and-early-afternoon blocks while focus is freshest. The fourth block rotates by weekday so the novelty-hungry side stays engaged. Change your hours or start time on the Path tab and every block rescales.
          </p>
          <div className="vizcard">
            <div className="ph-row">
              <h3>The day, block by block</h3>
              <span className="legend">
                <span><i className="sw" style={{ background: "var(--s1)" }} />LeetCode</span>
                <span><i className="sw" style={{ background: "var(--s2)" }} />Rotating track</span>
                <span><i className="sw" style={{ background: "var(--s3)" }} />Output + applications</span>
                <span><i className="sw" style={{ background: "var(--neutral-soft)" }} />Break</span>
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
            Dates come straight from the precomputed charts. They are a pacing guide, not a forecast. The job market and your prep set the real calendar.
          </p>
          <div className="vizcard">
            <div className="ph-row">
              <h3>Cycles, 2026–2028</h3>
              <span className="legend">
                <span><i className="sw" style={{ background: "var(--plan-soft)", outline: "1.5px solid var(--s1)" }} />Your plan</span>
                <span><i className="sw" style={{ background: "var(--accent-soft)", outline: "1.5px solid var(--accent)" }} />Favorable</span>
                <span><i className="sw" style={{ background: "var(--warm-soft)", outline: "1.5px solid var(--warm)" }} />Caution</span>
                <span><i className="sw" style={{ background: "var(--neutral-soft)" }} />Background theme</span>
              </span>
            </div>
            <div className="vizbox"><Gantt phases={phases} today={today} /></div>
            <p className="cap">Each row comes from one system. Hover any bar or diamond for details. The dashed line is today.</p>
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

function TodayView({
  settings, phases, cur, done, logs, today, minuteOfDay, onSaveLog,
}: {
  settings: LaunchSettings; phases: Phase[]; cur: Phase; done: Set<string>; logs: Record<string, DayLog>;
  today: string; minuteOfDay: number; onSaveLog: (date: string, log: DayLog) => Promise<Status>;
}) {
  const next = ALL_ITEMS.filter((i) => !done.has(i.id))
    .sort((a, b) => (a.phaseId === cur.id ? 0 : 1) - (b.phaseId === cur.id ? 0 : 1))
    .slice(0, 3);
  const sch = buildSchedule(settings, phases, today);
  const lc = sch.filter((b) => b.k === "lc").reduce((a, b) => a + b.mins, 0);
  const st = sch.filter((b) => b.k !== "brk").reduce((a, b) => a + b.mins, 0);
  const s = stats(settings, phases, logs, today);
  const diff = s.nw - s.expected;
  return (
    <section className="view">
      <div className="today">
        <span className="label">{`Current phase · ${fmt(cur.start)} – ${fmt(cur.end)}`}</span>
        <h2>{cur.name}</h2>
        <p className="ph-why">{cur.why}</p>
        <h3 style={{ marginTop: 6 }}>Next three unchecked</h3>
        <ol>
          {next.length === 0 && <li>Everything is checked. Go take the offer.</li>}
          {next.map((i) => (
            <li key={i.id}><b>{i.title}</b>{" — " + i.detail}</li>
          ))}
        </ol>
      </div>

      <div className="kpis">
        <Kpi cls={diff >= 0 ? "ok" : "warn"} label="Solved" big={String(s.nw)} unit={`/ ${settings.goal}`}
          sub={diff >= 0 ? `${diff} ahead of plan pace` : `${-diff} behind plan pace`} />
        <Kpi cls={s.need <= settings.dailyNew ? "ok" : "warn"} label="Pace needed" big={String(s.need)} unit="/ day"
          sub={s.left ? `to reach ${settings.goal} by ${fmtS(planEnd(phases))} · ${s.left} days left` : "Sprint window is over"} />
        <Kpi cls={s.nw && s.nh / s.nw >= 0.6 ? "ok" : ""} label="No-hint rate" big={s.nw ? Math.round((100 * s.nh) / s.nw) + "%" : "—"}
          sub={`${s.nh} of ${s.nw} solved without a hint`} />
        <Kpi cls={s.streak >= 3 ? "ok" : ""} label="Streak" big={String(s.streak)} unit={s.streak === 1 ? "day" : "days"}
          sub="days in a row with problems logged" />
        <Kpi cls="" label="Redo + mocks" big={String(s.rd)} unit="redo" sub={`${s.mk} timed mocks · ${s.hr} h logged`} />
      </div>

      <div className="split">
        <div className="vizcard">
          <div className="ph-row">
            <h3>Today&apos;s schedule</h3>
            <span className="mono">{`${dur(st)} study · LeetCode ${dur(lc)} (${Math.round((100 * lc) / st)}%)`}</span>
          </div>
          <Schedule settings={settings} phases={phases} date={today} today={today} minuteOfDay={minuteOfDay} />
        </div>
        <LogForm logs={logs} today={today} onSave={onSaveLog} />
      </div>

      <div className="vizcard">
        <div className="ph-row">
          <h3>New problems per day</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--s1)" }} />Solved, no hint</span>
            <span><i className="sw" style={{ background: "var(--s1)", opacity: 0.38 }} />Solved with a hint</span>
            <span>– – Daily target</span>
          </span>
        </div>
        <div className="vizbox"><DailyChart settings={settings} phases={phases} logs={logs} today={today} /></div>
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>Total vs goal</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--s1)" }} />You</span>
            <span><i className="sw" style={{ background: "var(--muted)" }} />Plan pace</span>
          </span>
        </div>
        <div className="vizbox"><CumChart settings={settings} phases={phases} logs={logs} today={today} /></div>
        <p className="cap">
          A problem counts as solved only if you could write it again tomorrow without looking. Anything you finished with the solution open goes in &quot;Redo&quot; instead.
        </p>
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>Roadmap</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--accent)" }} />Done</span>
            <span><i className="sw" style={{ background: "var(--accent-soft)", outline: "1px solid var(--accent)" }} />To do</span>
            <span>◆ chart milestone</span>
          </span>
        </div>
        <div className="vizbox"><Roadmap settings={settings} phases={phases} done={done} today={today} /></div>
        <p className="cap">Each bar fills as you tick items in that phase. Change phase lengths on the Path tab and this redraws.</p>
      </div>
      <div className="vizcard">
        <h3>Progress by track</h3>
        <Tracks done={done} />
      </div>
    </section>
  );
}

function Kpi({ cls, label, big, unit, sub }: { cls: string; label: string; big: string; unit?: string; sub: string }) {
  return (
    <div className={"kpi " + cls}>
      <span className="label">{label}</span>
      <div className="big">
        {big}
        {unit && <small>{" " + unit}</small>}
      </div>
      <span className="sub">{sub}</span>
    </div>
  );
}

function Schedule({ settings, phases, date, today, minuteOfDay }: {
  settings: LaunchSettings; phases: Phase[]; date: string; today: string; minuteOfDay: number;
}) {
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
              <b>{b.title}</b>
              {b.desc && <div className="d">{b.desc}</div>}
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

function LogForm({ logs, today, onSave }: {
  logs: Record<string, DayLog>; today: string; onSave: (date: string, log: DayLog) => Promise<Status>;
}) {
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
      <span>{label}</span>
      <input type="number" min={0} max={max} step={step} inputMode={step ? "decimal" : "numeric"} placeholder="0"
        value={draft[k]} onChange={set(k)} />
    </label>
  );

  return (
    <form className="vizcard" autoComplete="off" onSubmit={submit}>
      <div className="ph-row">
        <h3>Log the day</h3>
        <span className={"status" + (status.err ? " err" : "")} role="status">{status.text}</span>
      </div>
      <div className="fields">
        <label className="fld">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => pickDate(e.target.value)} />
        </label>
        {num("newCount", "New problems solved", 40)}
        {num("noHint", "…of those, no hint", 40)}
        {num("redo", "Redo problems", 40)}
        {num("mocks", "Timed mocks", 5)}
        {num("hours", "Hours studied", 16, 0.5)}
      </div>
      <label className="fld">
        <span>One-line win or blocker</span>
        <input type="text" maxLength={200} placeholder="e.g. sliding window clicked; stuck on #76" value={draft.note} onChange={set("note")} />
      </label>
      <button type="submit" className="btn" disabled={busy}>Save day</button>
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

function PathView({ settings, phases, cur, done, status, onChange, onToggle, onStatus }: {
  settings: LaunchSettings; phases: Phase[]; cur: Phase; done: Set<string>; status: Status;
  onChange: (patch: Partial<LaunchSettings>) => void; onToggle: (id: string, on: boolean) => void;
  onStatus: (s: Status) => void;
}) {
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
          <h3>Plan settings</h3>
          <span className={"status" + (status.err ? " err" : "")} role="status">{status.text}</span>
        </div>
        <p className="cap">
          Change anything here and every date, schedule and chart on the page follows. To shorten or stretch one phase, edit its day count below. To move the whole finish line, set &quot;Finish by&quot; and press Fit.
        </p>
        <div className="fields">
          <label className="fld">
            <span>Start date</span>
            <DraftInput type="date" value={settings.start} parse={(v) => (isIsoDate(v) ? v : null)} onCommit={(v) => onChange({ start: v })} />
          </label>
          <label className="fld">
            <span>Finish by</span>
            <DraftInput type="date" value={end} parse={(v) => (isIsoDate(v) ? v : null)} onCommit={setFinish} />
          </label>
          <label className="fld">
            <span>Study hours per day</span>
            <DraftInput type="number" min={1} max={12} step={0.5} value={String(settings.hours)}
              parse={(v) => { const n = parseFloat(v); return n >= 1 && n <= 12 ? String(n) : null; }}
              onCommit={(v) => onChange({ hours: Number(v) })} />
          </label>
          <label className="fld">
            <span>Day starts at</span>
            <DraftInput type="time" value={settings.dayStart} parse={(v) => (/^\d{2}:\d{2}$/.test(v) ? v : null)}
              onCommit={(v) => onChange({ dayStart: v })} />
          </label>
          <label className="fld">
            <span>New problems per day</span>
            <DraftInput type="number" min={1} max={15} value={String(settings.dailyNew)} parse={intParse(1, 15)}
              onCommit={(v) => onChange({ dailyNew: Number(v) })} />
          </label>
          <label className="fld">
            <span>Total problem goal</span>
            <DraftInput type="number" min={10} max={1000} step={10} value={String(settings.goal)} parse={intParse(10, 1000)}
              onCommit={(v) => onChange({ goal: Number(v) })} />
          </label>
        </div>
        <div className="ph-row">
          <button type="button" className="btn" onClick={fit}>Fit phases to finish date</button>
          <span className="mono">
            {`${total} days · ${phases.map((p) => p.days).join(" + ")} · goal ${settings.goal} ≈ ${(settings.goal / total).toFixed(1)} new / day`}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {phases.map((p, idx) => {
          const n = p.items.filter((i) => done.has(i.id)).length;
          const isCur = cur.id === p.id;
          return (
            <div key={p.id} className="phase">
              <div className="ph-head">
                <div className="ph-row">
                  <h3>{p.name}</h3>
                  <span className="mono">{`${fmt(p.start)} – ${fmt(p.end)} · ${n}/${p.items.length}`}</span>
                </div>
                <div className="ph-row">
                  <span className={"pill" + (isCur ? "" : " ink")}>{isCur ? "Now · " + p.tag : p.tag}</span>
                  <label className="ph-days">
                    <DraftInput type="number" min={1} max={90} value={String(p.days)} aria-label={`Days for ${p.name}`}
                      parse={intParse(1, 90)}
                      onCommit={(v) => onChange({ days: settings.days.map((d, i) => (i === idx ? Number(v) : d)) })} />
                    days
                  </label>
                </div>
                <p className="ph-why">{p.why}</p>
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
                          <span className="tx">{it.title}</span>
                        </div>
                        <div className="d">{it.detail}</div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
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
