// The tab's charts, as pure components of (settings, phases, ticks, logs, today).
// Ported from the original page's imperative SVG builders; geometry is unchanged.
// Hover details ride on `data-tip` attributes, read by the tooltip in LaunchPath.
// Text goes through useT(): English is the key, zh/charts.ts holds the Chinese.

import { heatLevel, projectTotal, type DayLog, type LaunchSettings } from "@/lib/launchPath";
import { ALL_ITEMS, KCOL, TL, TRACKS } from "./data";
import { useT } from "./i18n";
import { DAY, addDays, daysBetween, hm, iso, pD, planEnd, type Phase, type SchedBlock } from "./plan";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const VS15 = "︎"; // text-style variation selector for astro glyphs
const textW = (s: string) => [...s].reduce((w, ch) => w + (ch.codePointAt(0)! > 0x2e80 ? 12.5 : 6.7), 0);
const nextDay = (s: string) => new Date(pD(s).getTime() + DAY);

/** Monday ticks along a date axis. */
function DayAxis({ x, y0, t0, t1 }: { x: (d: Date) => number; y0: number; t0: Date; t1: Date }) {
  const { fmtS } = useT();
  const out = [];
  for (let d = new Date(t0); d <= t1; d = new Date(d.getTime() + DAY)) {
    if (d.getDay() !== 1) continue;
    const X = x(d);
    out.push(
      <g key={d.getTime()}>
        <line x1={X} x2={X} y1={y0} y2={y0 + 5} className="tick" />
        <text x={X} y={y0 + 18} className="axis" textAnchor="middle">
          {fmtS(iso(d))}
        </text>
      </g>,
    );
  }
  return <>{out}</>;
}

export function Roadmap({ settings, phases, done, today }: { settings: LaunchSettings; phases: Phase[]; done: Set<string>; today: string }) {
  const { t, fmt } = useT();
  const W = 900, H = 150, L = 12, R = 888;
  const t0 = pD(addDays(settings.start, -2)), t1 = pD(addDays(planEnd(phases), 3));
  const x = (d: Date) => L + ((R - L) * (d.getTime() - t0.getTime())) / (t1.getTime() - t0.getTime());
  const td = pD(today);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={t("Roadmap of the study phases")}>
      <line x1={L} x2={R} y1={120} y2={120} className="tick" />
      <DayAxis x={x} y0={120} t0={t0} t1={t1} />
      {phases.map((p) => {
        const a = x(pD(p.start)) + 1, b = x(nextDay(p.end)) - 1, w = b - a;
        const n = p.items.filter((i) => done.has(i.id)).length, f = n / p.items.length;
        const name = t(p.name);
        const tip = t("{name} · {start} – {end} · {n}/{total} done", { name, start: fmt(p.start), end: fmt(p.end), n, total: p.items.length });
        const first = name.split(" ")[0];
        const nm = textW(name) + 4 < w ? name : textW(first) + 4 < w ? first : "";
        return (
          <g key={p.id}>
            {nm && <text x={a + 2} y={46} className="lbl">{nm}</text>}
            <text x={a + 2} y={62} className="sublbl">{`${n}/${p.items.length}`}</text>
            <rect x={a} y={70} width={w} height={30} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1} data-tip={tip} />
            {f > 0 && <rect x={a} y={70} width={Math.max(4, w * f)} height={30} rx={4} fill="var(--accent)" data-tip={tip} />}
          </g>
        );
      })}
      {TL.filter(([w]) => ISO_RE.test(w)).map(([w, title, sys]) => {
        const d = pD(w);
        if (d < t0 || d > t1) return null;
        const X = x(d);
        return (
          <path key={w + title} d={`M${X} 104 l5 6 l-5 6 l-5 -6z`} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5}
            data-tip={`${fmt(w)} · ${t(title)} (${t(sys)})`} style={{ cursor: "help" }} />
        );
      })}
      {td >= t0 && td <= t1 && (
        <>
          <line x1={x(td)} x2={x(td)} y1={20} y2={118} className="today-line" />
          <text x={Math.min(Math.max(x(td), 24), R - 20)} y={14} className="today-txt" textAnchor="middle">{t("Today")}</text>
        </>
      )}
    </svg>
  );
}

export function CumChart({ settings, phases, logs, today }: { settings: LaunchSettings; phases: Phase[]; logs: Record<string, DayLog>; today: string }) {
  const { t, fmtS } = useT();
  const W = 900, H = 230, L = 40, R = 820, T = 16, B = 196;
  const t0 = pD(settings.start), t1 = pD(planEnd(phases)), n = daysBetween(settings.start, planEnd(phases));
  const span = Math.max(1, n);
  const x = (d: Date) => L + ((R - L) * ((d.getTime() - t0.getTime()) / DAY)) / span;
  // Days logged before the start date count toward the total from day one.
  const before = Object.entries(logs).filter(([k]) => k < settings.start).reduce((a, [, l]) => a + l.newCount, 0);
  const last = Object.keys(logs).filter((k) => k >= settings.start).sort().pop();
  const stop = [today, last ?? settings.start].sort().pop()!;
  const pts: [string, number][] = [];
  let cum = before;
  for (let i = 0; i <= n; i++) {
    const ds = addDays(settings.start, i);
    if (ds > stop) break;
    cum += logs[ds]?.newCount ?? 0;
    pts.push([ds, cum]);
  }
  // Projection: the average so far (today counted as a day) carried to the end.
  const elapsed = Math.min(n + 1, Math.max(0, daysBetween(settings.start, today) + 1));
  const proj = cum > 0 && elapsed > 0 && today <= planEnd(phases) ? projectTotal(cum, elapsed, n + 1) : null;
  const ymax = Math.max(settings.goal, cum, proj ?? 0) * 1.05;
  const y = (v: number) => B - ((B - T) * v) / ymax;
  const plan = (ds: string) => (settings.goal * daysBetween(settings.start, ds)) / span;
  const step = ymax > 400 ? 100 : ymax > 150 ? 50 : 20;
  const grid = [];
  for (let v = 0; v <= ymax; v += step)
    grid.push(
      <g key={v}>
        <line x1={L} x2={R} y1={y(v)} y2={y(v)} className={v ? "gridl" : "tick"} />
        <text x={L - 8} y={y(v) + 4} className="axis" textAnchor="end">{v}</text>
      </g>,
    );
  const lastPt = pts[pts.length - 1];
  const colW = (R - L) / span;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={t("Cumulative problems solved versus plan pace")}>
      {grid}
      {/* Green where you're ahead of the dashed plan, orange where you're behind. */}
      {pts.slice(1).map(([ds, v], i) => {
        const [pa, va] = pts[i];
        const xa = x(pD(pa)), xb = x(pD(ds));
        const ahead = va + v >= plan(pa) + plan(ds);
        return (
          <path key={ds} d={`M${xa} ${y(va)} L${xb} ${y(v)} L${xb} ${y(plan(ds))} L${xa} ${y(plan(pa))}Z`}
            fill={ahead ? "var(--accent-soft)" : "var(--warm-soft)"} />
        );
      })}
      <line x1={x(t0)} y1={y(0)} x2={x(t1)} y2={y(settings.goal)} stroke="var(--muted)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={x(t1) + 6} y={y(settings.goal) + 4} className="sublbl">{t("Plan {n}", { n: settings.goal })}</text>
      {lastPt && proj !== null && (
        <>
          <line x1={x(pD(lastPt[0]))} y1={y(lastPt[1])} x2={x(t1)} y2={y(proj)} stroke="var(--s1)" strokeWidth={2}
            strokeDasharray="1 5" strokeLinecap="round" />
          <text x={x(t1) + 6} y={y(proj) + (Math.abs(y(proj) - y(settings.goal)) < 14 ? (proj >= settings.goal ? -10 : 18) : 4)}
            className="lbl" data-tip={t("If your average so far holds, you finish with about {n}", { n: proj })}>{t("Pace {n}", { n: proj })}</text>
        </>
      )}
      {cum === 0 && (
        <text x={x(pD(today < settings.start ? settings.start : today)) + 10} y={y(0) - 10} className="lbl">
          {t("Your line starts with the first problem you log. {n} a day keeps you on the dashed plan.", { n: settings.dailyNew })}
        </text>
      )}
      {lastPt && cum > 0 && (
        <>
          <path d={pts.map(([ds, v], i) => `${i ? "L" : "M"}${x(pD(ds)).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")}
            fill="none" stroke="var(--s1)" strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={x(pD(lastPt[0]))} cy={y(lastPt[1])} r={5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2}
            data-tip={t("{date} · {n} solved", { date: fmtS(lastPt[0]), n: lastPt[1] })} />
          <text x={x(pD(lastPt[0])) + 9} y={y(lastPt[1]) - 8} className="lbl">{t("You {n}", { n: lastPt[1] })}</text>
          {pts.map(([ds, v]) => (
            <rect key={ds} x={x(pD(ds)) - colW / 2} y={T} width={colW} height={B - T} fill="transparent"
              data-tip={t("{date} · {n} total · plan {p}", { date: fmtS(ds), n: v, p: Math.round((settings.goal * daysBetween(settings.start, ds)) / span) })} />
          ))}
        </>
      )}
      <DayAxis x={x} y0={B} t0={t0} t1={t1} />
    </svg>
  );
}

export function DayBar({ schedule }: { schedule: SchedBlock[] }) {
  const { t, lang } = useT();
  const W = 900, H = 86, L = 8, R = 892;
  const s0 = schedule[0].start, s1 = schedule[schedule.length - 1].start + schedule[schedule.length - 1].mins;
  const x = (m: number) => L + ((R - L) * (m - s0)) / (s1 - s0);
  const hours = [];
  for (let h = Math.ceil(s0 / 60) * 60; h <= s1; h += 60)
    hours.push(
      <g key={h}>
        <line x1={x(h)} x2={x(h)} y1={52} y2={58} className="tick" />
        <text x={x(h)} y={74} className="axis" textAnchor="middle">{hm(h)}</text>
      </g>,
    );
  // Chinese glyphs are about twice as wide as the 6.4px Latin estimate.
  const fits = (s: string, w: number) => (lang === "zh" ? textW(s) : s.length * 6.4) < w - 10;
  const clip = (s: string, w: number) => {
    let out = "";
    for (const ch of s) {
      if (!fits(out + ch + "…", w)) return out + "…";
      out += ch;
    }
    return out;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={t("Today's study blocks laid out across the day")}>
      {schedule.map((b) => {
        const a = x(b.start) + 1, w = x(b.start + b.mins) - a - 1;
        const title = t(b.title), first = title.split(" ")[0];
        const label = b.k === "lc" ? "LeetCode" : fits(title, w) ? title : lang === "zh" && !fits(first, w) ? clip(first, w) : first;
        return (
          <g key={b.start}>
            <rect x={a} y={10} width={Math.max(2, w)} height={38} rx={4} fill={KCOL[b.k]}
              data-tip={`${hm(b.start)}–${hm(b.start + b.mins)} · ${title}${b.desc ? " — " + t(b.desc) : ""}`} />
            {b.k !== "brk" && w > 70 && (
              <text x={a + 6} y={33} style={{ font: "600 11.5px var(--f-body)", fill: "#fff", pointerEvents: "none" }}>{label}</text>
            )}
          </g>
        );
      })}
      {hours}
    </svg>
  );
}

type HBarRow = { en: string; cn?: string; v: number; color: string; tip?: string; cls?: string; label?: string };

function HBars({ rows, max }: { rows: HBarRow[]; max: number }) {
  const { t, lang } = useT();
  return (
    <div className="hbars">
      {rows.map((r) => {
        // In Chinese the cn name says it all; in English it rides along after the English name.
        const zh = lang === "zh";
        const name = zh ? (r.cn ?? t(r.en)) : r.en;
        const tip = r.tip ? t(r.tip) : zh ? `${name}: ${r.v}%` : `${r.en} ${r.cn ?? ""}: ${r.v}%`;
        return (
          <div key={r.en} className="hb" data-tip={tip}>
            <span className={"nm" + (r.cls ? " " + r.cls : "")}>
              {name}
              {!zh && r.cn && <span className="cn">{r.cn}</span>}
            </span>
            <div className="trk">
              <div className="fill" style={{ width: `${(100 * r.v) / max}%`, background: r.color }} />
            </div>
            <span className="v">{r.label ?? `${r.v}%`}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Tracks({ done }: { done: Set<string> }) {
  const { t } = useT();
  const rows = TRACKS.map((tr) => {
    const its = ALL_ITEMS.filter((i) => i.track === tr.id);
    const n = its.filter((i) => done.has(i.id)).length;
    return {
      en: tr.name,
      v: (100 * n) / its.length,
      color: tr.color,
      cls: tr.id,
      label: `${n}/${its.length}`,
      tip: t("{name}: {n} of {total} items done", { name: t(tr.name), n, total: its.length }),
    };
  });
  return <HBars rows={rows} max={100} />;
}

// ---- chart reading: BaZi --------------------------------------------------------

const PILLARS: [string, string, string, string, string, string, string][] = [
  ["Year 年", "戊", "寅", "伤官 Hurting Officer", "甲 丙 戊", "earth", "wood"],
  ["Month 月", "壬", "戌", "正官 Direct Officer", "戊 辛 丁", "water", "earth"],
  ["Day 日", "丁", "巳", "Day Master", "丙 庚 戊", "fire", "fire"],
  ["Hour 时", "辛", "丑", "偏财 Indirect Wealth", "己 癸 辛", "metal", "earth"],
];
const G = "var(--accent)", BAD = "var(--warm)", MUTED = "var(--muted)";
const ELEMENTS: HBarRow[] = [
  { en: "Earth", cn: "土", v: 45.5, color: G },
  { en: "Fire", cn: "火", v: 26.6, color: BAD, tip: "Fire 火: 26.6% · the one unfavorable element" },
  { en: "Metal", cn: "金", v: 20.1, color: G },
  { en: "Wood", cn: "木", v: 5.2, color: G },
  { en: "Water", cn: "水", v: 2.6, color: G, tip: "Water 水: 2.6% · scarce, and wanted" },
];
const TEN_GODS: HBarRow[] = [
  { en: "Hurting Officer", cn: "伤官", v: 37.5, color: G, tip: "伤官 Hurting Officer 37.5% · expression, critique, new ideas. Your structure." },
  { en: "Rob Wealth", cn: "劫财", v: 18, color: MUTED },
  { en: "Indirect Wealth", cn: "偏财", v: 17.6, color: MUTED },
  { en: "Friend", cn: "比肩", v: 8.6, color: MUTED },
  { en: "Eating God", cn: "食神", v: 8, color: MUTED },
  { en: "Direct Resource", cn: "正印", v: 5.2, color: MUTED },
  { en: "Direct Wealth", cn: "正财", v: 2.5, color: MUTED },
  { en: "Direct Officer", cn: "正官", v: 2, color: MUTED },
  { en: "Seven Killings", cn: "七杀", v: 0.6, color: MUTED },
];

export function BaziPlate() {
  const { t } = useT();
  return (
    <div className="split">
      <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
        <div className="pillars">
          {PILLARS.map(([ph, st, br, tg, hid, se, be]) => (
            <div key={ph} className={"pillar" + (st === "丁" ? " dm" : "")}>
              <span className="ph">{t(ph)}</span>
              <span className="tg">{t(tg)}</span>
              <span className={"gz" + (se === "fire" ? " bad" : "")} data-tip={t("Stem {s} · {el}", { s: st, el: t(se) })}>{st}</span>
              <span className="el">{t(se)}</span>
              <span className={"gz" + (be === "fire" ? " bad" : "")} data-tip={t("Branch {b} · {el} · hidden stems {hid}", { b: br, el: t(be), hid })}>{br}</span>
              <span className="el">{t(be)}</span>
              <span className="hid">{hid}</span>
            </div>
          ))}
        </div>
        <p className="cap">{t("Four pillars, year to hour. The framed one is you, the Day Master 丁 fire. Each underline shows whether that element helps you.")}</p>
      </div>
      <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <div>
          <span className="label">{t("Five elements · share of energy")}</span>
          <div style={{ marginTop: 8 }}><HBars rows={ELEMENTS} max={50} /></div>
        </div>
        <div>
          <span className="label">{t("Ten gods · share of energy")}</span>
          <div style={{ marginTop: 8 }}><HBars rows={TEN_GODS} max={40} /></div>
        </div>
      </div>
    </div>
  );
}

// ---- chart reading: Zi Wei -------------------------------------------------------

// [branch, cn, en, majors [[star, hua?]], borrowed, minors, flags, row, col, tip]
type Palace = [string, string, string, [string, string?][], string, string, string[], number, number, string];
const PALACES: Palace[] = [
  ["巳", "财帛", "Wealth", [], "借 廉贞 贪狼", "文曲 禄存", [], 1, 1, "Wealth: no main star. Fame and skill come first, then money."],
  ["午", "子女", "Children", [["天机", "忌"]], "", "擎羊", ["2026 year"], 1, 2, "天机化忌 here. 2026 annual life palace: 天机化权, busy planning mind."],
  ["未", "夫妻", "Spouse", [["紫微"], ["破军"]], "", "天钺", ["Decade 2020–29"], 1, 3, "Current decade palace (己): 武曲化禄, 贪狼化权, 天梁化科, 文曲化忌."],
  ["申", "兄弟", "Siblings", [], "借 天同 天梁", "天马", [], 1, 4, ""],
  ["辰", "疾厄", "Health", [["太阳"]], "", "陀罗 铃星", [], 2, 1, ""],
  ["酉", "命宫", "Life", [["天府"]], "", "文昌", ["命 Life"], 2, 4, "天府 + 文昌庙: steady, trusted; learning is your lever (文星拱命)."],
  ["卯", "迁移", "Travel", [["武曲"], ["七杀"]], "", "", [], 3, 1, "Strong away from home. This decade's 武曲化禄 lands here: gains from going outward."],
  ["戌", "父母", "Parents", [["太阴", "权"]], "", "地空", [], 3, 4, ""],
  ["寅", "交友", "Friends", [["天同"], ["天梁"]], "", "右弼科 火星", [], 4, 1, "右弼化科: helpful people among friends and peers."],
  ["丑", "官禄", "Career", [["天相"]], "", "天魁", [], 4, 2, "天相庙 + 天魁: thrives inside a structure, strong team player."],
  ["子", "田宅", "Property", [["巨门"]], "", "左辅 地劫", [], 4, 3, ""],
  ["亥", "福德", "Fortune", [["廉贞"], ["贪狼", "禄"]], "", "", ["身 Body"], 4, 4, "Body palace. 贪狼化禄: many appetites and interests (novelty engine)."],
];
const SAN_FANG = new Set(["酉", "卯", "巳", "丑"]); // life palace + its three supports
const ACTIVE_NOW = new Set(["未", "午"]);

export function ZiweiGrid() {
  const { t, lang } = useT();
  return (
    <div className="zwbox">
      <div className="zw">
        {PALACES.map(([b, cn, en, maj, bor, mn, flags, r, c, tip]) => {
          // The palace's Chinese name already says it in zh; English keeps both.
          const name = lang === "zh" ? cn : `${en} ${cn}`;
          return (
            <div key={b} className={"zc" + (SAN_FANG.has(b) ? " sf" : "") + (ACTIVE_NOW.has(b) ? " now" : "")}
              style={{ gridRow: r, gridColumn: c }} data-tip={`${name} · ${b}${tip ? " — " + t(tip) : ""}`}>
              <div className="pn">
                <span>{name}</span>
                <span className="br">{b}</span>
              </div>
              <div className="mj">
                {maj.map(([s, h], i) => (
                  <span key={s}>
                    {i ? " " : ""}
                    {s}
                    {h && <span className={"hua" + (h === "忌" ? " ji" : "")}>{h}</span>}
                  </span>
                ))}
                {bor && <span className="bor">{bor}</span>}
              </div>
              {mn && <div className="mn">{mn}</div>}
              {flags.length > 0 && (
                <div className="flags">
                  {flags.map((f) => <span key={f} className="flag">{t(f)}</span>)}
                </div>
              )}
            </div>
          );
        })}
        <div className="zcenter">
          <span className="label">{t("Zi Wei Dou Shu")}</span>
          <span className="big">戊寅年 · 木三局</span>
          <span className="mono">{t("Life 酉 · Body 亥")}</span>
          <span className="ev">{t("Decade palace 未 runs 2020–2029. 2026's year palace is 午.")}</span>
        </div>
      </div>
    </div>
  );
}

// ---- chart reading: Western natal wheel ------------------------------------------

const ASC = 156.53;
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGN_GLYPHS = [..."♈♉♊♋♌♍♎♏♐♑♒♓"];
const CUSPS = [156.53, 182.87, 212.87, 245.0, 277.13, 307.87, 336.53, 2.87, 32.87, 65.0, 97.13, 127.87];
const PLANETS: [string, string, number, string][] = [
  ["Sun", "☉", 223.12, "Scorpio 13°07′ · house 3"],
  ["Moon", "☽", 65.02, "Gemini 5°01′ · house 10 · on the Midheaven"],
  ["Mercury", "☿", 245.22, "Sagittarius 5°13′ · house 4 · detriment"],
  ["Venus", "♀", 224.78, "Scorpio 14°47′ · house 3 · combust"],
  ["Mars", "♂", 167.55, "Virgo 17°33′ · house 1"],
  ["Jupiter", "♃", 348.27, "Pisces 18°16′ ℞ · house 7 · domicile"],
  ["Saturn", "♄", 29.13, "Aries 29°08′ ℞ · house 8 · fall"],
  ["Uranus", "♅", 308.95, "Aquarius 8°57′ · house 6"],
  ["Neptune", "♆", 299.57, "Capricorn 29°34′ · house 5"],
  ["Pluto", "♇", 246.97, "Sagittarius 6°58′ · house 4"],
  ["North Node", "☊", 147.38, "Leo 27°23′ · house 12"],
];
const ASPECTS: [string, string, string, number][] = [
  ["Moon", "Mercury", "opposite", 0.2],
  ["Saturn", "Neptune", "square", 0.42],
  ["Mars", "Jupiter", "opposite", 0.72],
  ["Moon", "Pluto", "opposite", 1.95],
  ["Uranus", "Pluto", "sextile", 1.98],
  ["Venus", "Mars", "sextile", 2.77],
  ["Venus", "Jupiter", "trine", 3.48],
  ["Mercury", "Uranus", "sextile", 3.73],
  ["Moon", "Uranus", "trine", 3.93],
  ["Sun", "Uranus", "square", 4.17],
];

export function NatalWheel() {
  const { t } = useT();
  const c = 260;
  const rad = (l: number) => ((180 + (l - ASC)) * Math.PI) / 180;
  const P = (l: number, r: number): [number, number] => [c + r * Math.cos(rad(l)), c - r * Math.sin(rad(l))];
  // Planets within 8° of each other alternate between two radii so glyphs don't collide.
  const pos: Record<string, { l: number; r: number }> = {};
  let prev: { l: number; r: number } | null = null;
  for (const p of [...PLANETS].sort((a, b) => a[2] - b[2])) {
    const r: number = prev && p[2] - prev.l < 8 && prev.r === 166 ? 144 : 166;
    pos[p[0]] = { l: p[2], r };
    prev = { l: p[2], r };
  }
  const om = (o: number) => `${Math.floor(o)}°${String(Math.round((o % 1) * 60)).padStart(2, "0")}′`;
  return (
    <svg viewBox="0 0 520 520" className="viz" role="img" aria-label={t("Natal chart wheel: Virgo rising, Moon on the Midheaven")}>
      <circle cx={c} cy={c} r={246} className="w-ring" />
      <circle cx={c} cy={c} r={212} className="w-line" />
      <circle cx={c} cy={c} r={188} className="w-inner" />
      <circle cx={c} cy={c} r={124} className="w-line" />
      {SIGNS.map((s, i) => {
        const [a, b] = P(i * 30, 212), [a2, b2] = P(i * 30, 246), [gx, gy] = P(i * 30 + 15, 229);
        return (
          <g key={s}>
            <line x1={a} y1={b} x2={a2} y2={b2} className="w-line" />
            <text x={gx} y={gy} className="w-sign" textAnchor="middle" dominantBaseline="central" data-tip={t(s)}>{SIGN_GLYPHS[i] + VS15}</text>
          </g>
        );
      })}
      {CUSPS.map((l, i) => {
        const axis = i % 3 === 0;
        const [a, b] = P(l, axis ? 60 : 124), [a2, b2] = P(l, 212);
        const nx = CUSPS[(i + 1) % 12], mid = l + ((nx - l + 360) % 360) / 2;
        const [hx, hy] = P(mid, 134);
        return (
          <g key={i}>
            <line x1={a} y1={b} x2={a2} y2={b2} className={axis ? "w-axis" : "w-cusp"} />
            <text x={hx} y={hy} className="w-hn" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
          </g>
        );
      })}
      {([["AC", 156.53], ["IC", 245.0], ["DC", 336.53], ["MC", 65.0]] as const).map(([ax, l]) => {
        const [a, b] = P(l - 5, 74);
        return <text key={ax} x={a} y={b} className="w-ax" textAnchor="middle" dominantBaseline="central">{ax}</text>;
      })}
      {ASPECTS.map(([a, b, kind, o]) => {
        const [x1, y1] = P(pos[a].l, 122), [x2, y2] = P(pos[b].l, 122);
        const hard = kind === "opposite" || kind === "square";
        return (
          <g key={a + b}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={hard ? "w-hard" : "w-soft"} opacity={(1 - o / 6).toFixed(2)} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="w-hit"
              data-tip={t("{a} {aspect} {b} · orb {orb}", { a: t(a), aspect: t(kind), b: t(b), orb: om(o) })} />
          </g>
        );
      })}
      {PLANETS.map(([n, gl, l, desc]) => {
        const [t1x, t1y] = P(l, 188), [t2x, t2y] = P(l, 180), [px, py] = P(l, pos[n].r);
        return (
          <g key={n}>
            <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} className="w-tickp" />
            <g className="w-pl" data-tip={`${t(n)} · ${t(desc)}`} style={{ cursor: "help" }}>
              <circle cx={px} cy={py} r={13} />
              <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="central">{gl + VS15}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ---- timing: cycles Gantt ------------------------------------------------------------

type BarStyle = "plan" | "good" | "bad" | "neutral";
const BAR_STYLE: Record<BarStyle, [string, string]> = {
  plan: ["var(--plan-soft)", "var(--s1)"],
  good: ["var(--accent-soft)", "var(--accent)"],
  bad: ["var(--warm-soft)", "var(--warm)"],
  neutral: ["var(--neutral-soft)", "none"],
};
const HITS: [string, string][] = [
  ["2026-08-01", "Uranus conjunct Moon + MC"],
  ["2026-10-22", "Uranus conjunct Moon + MC"],
  ["2027-01-22", "Pluto trine Moon + MC"],
  ["2027-05-14", "Uranus conjunct Moon + MC"],
  ["2027-06-09", "Uranus square Ascendant"],
  ["2027-09-13", "Pluto trine Moon + MC"],
  ["2027-11-20", "Pluto trine MC"],
  ["2028-01-06", "Uranus square Ascendant"],
  ["2028-04-06", "Saturn return"],
];

export function Gantt({ phases, today }: { phases: Phase[]; today: string }) {
  const { t, lang, fmt } = useT();
  const W = 900, LB = 150, R = 888;
  const t0 = pD("2026-01-01"), t1 = pD("2029-01-01");
  const x = (d: Date) => LB + ((R - LB) * (d.getTime() - t0.getTime())) / (t1.getTime() - t0.getTime());
  const D = pD;
  const rows: [string, [Date, Date, string, BarStyle, string][]][] = [
    ["Your plan", phases.map((p) => [D(p.start), nextDay(p.end), p.name, "plan", `${t(p.name)} · ${fmt(p.start)} – ${fmt(p.end)}`])],
    ["BaZi luck pillar", [
      [t0, D("2028-04-01"), "庚申 正财 · steady wages", "neutral", "庚申 luck (Apr 2018 – Apr 2028): Direct Wealth. Turn skill into a paycheck."],
      [D("2028-04-01"), t1, "己未 食神 · craft", "good", "己未 luck (Apr 2028 – 2038): Eating God. Calm, sustained craft."],
    ]],
    ["BaZi year", [
      [D("2026-02-04"), D("2027-02-04"), "2026 丙午 · fire", "bad", "2026 丙午: Rob Wealth, fire = unfavorable. Competition, scattered energy."],
      [D("2027-02-04"), D("2028-02-04"), "2027 丁未 · mixed", "bad", "2027 丁未: fire stem (peers) + earth branch (craft). Mixed; protect energy."],
      [D("2028-02-04"), t1, "2028 戊申 · favorable", "good", "2028 戊申: Hurting Officer + Direct Wealth. Output turns into income."],
    ]],
    ["Zi Wei decade", [[t0, t1, "己 decade · 武曲化禄 outward · 文曲化忌 paperwork", "neutral", "Decade palace 未 (2020–2029): gains from going outward; double-check documents."]]],
    ["Saturn in 8th", [[D("2026-03-11"), D("2028-05-06"), "Depth, shared resources", "neutral", "Saturn in house 8: Mar 11 2026 – May 6 2028"]]],
    ["Jupiter in 12th", [[D("2026-08-06"), D("2027-08-26"), "Quiet prep year", "neutral", "Jupiter in house 12: Aug 6 2026 – Aug 26 2027. Behind-the-scenes growth."]]],
    ["Uranus in 10th", [[D("2026-08-02"), t1, "Career wants autonomy (to 2034)", "neutral", "Uranus in house 10: Aug 2 2026 – Jul 2034"]]],
  ];
  const RH = 34, top = 34, H = top + (rows.length + 1) * RH + 26;
  const quarters = [];
  for (let d = new Date(t0); d <= t1; d = new Date(d.getFullYear(), d.getMonth() + 3, 1)) {
    const X = x(d);
    quarters.push(
      <g key={d.getTime()}>
        <line x1={X} x2={X} y1={top - 6} y2={H - 24} className="gridl" />
        {d.getMonth() % 6 === 0 && (
          <text x={X} y={H - 8} className="axis" textAnchor={d < t1 ? "start" : "end"}>
            {lang === "zh"
              ? `${d.getFullYear()}年${d.getMonth() + 1}月`
              : (d.getMonth() === 0 ? "Jan " : "Jul ") + d.getFullYear()}
          </text>
        )}
      </g>,
    );
  }
  const yh = top + rows.length * RH + 11;
  const td = pD(today);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz" role="img" aria-label={t("Timeline of luck periods and transits from 2026 to 2028")}>
      {quarters}
      {rows.map(([lab, bars], i) => {
        const y = top + i * RH;
        return (
          <g key={lab}>
            <text x={0} y={y + 15} className="rowlbl">{t(lab)}</text>
            {bars.map(([a, b, key, st, tip]) => {
              const xa = Math.max(x(a), LB) + 1, xb = Math.min(x(b), R) - 1, w = xb - xa;
              const [f, s] = BAR_STYLE[st];
              const lbl = t(key);
              return (
                <g key={key}>
                  <rect x={xa} y={y} width={w} height={22} rx={4} fill={f} stroke={s} strokeWidth={s === "none" ? 0 : 1.5} data-tip={t(tip)} />
                  {textW(lbl) + 12 < w && (
                    <text x={xa + 7} y={y + 15} className="rowlbl" style={{ fontSize: 11.5, pointerEvents: "none" }}>{lbl}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <text x={0} y={yh + 4} className="rowlbl">{t("Exact hits")}</text>
      <line x1={LB} x2={R} y1={yh} y2={yh} className="tick" />
      {HITS.map(([d, hit]) => {
        const X = x(D(d));
        return (
          <path key={d} d={`M${X} ${yh - 7} l7 7 l-7 7 l-7 -7z`} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5}
            data-tip={`${fmt(d)} · ${t(hit)}`} style={{ cursor: "help" }} />
        );
      })}
      {td >= t0 && td <= t1 && (
        <>
          <line x1={x(td)} x2={x(td)} y1={top - 14} y2={H - 24} className="today-line" />
          <text x={x(td)} y={top - 18} className="today-txt" textAnchor="middle">{t("Today")}</text>
        </>
      )}
    </svg>
  );
}

// ---- Today: sprint heatmap, ring, sparkline -------------------------------------

const HEAT = ["var(--empty)", "var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)"];

/** The whole sprint as a contribution-style grid: one column per week (Mon-Sun),
 * shaded by new problems against the daily target. Today is outlined and days
 * still ahead stay hollow, so the runway left is always visible. */
export function Heatmap({ settings, phases, logs, today }: { settings: LaunchSettings; phases: Phase[]; logs: Record<string, DayLog>; today: string }) {
  const { t, lang, fmtS } = useT();
  const end = planEnd(phases);
  const c = 24, gap = 4, step = c + gap, L = 34, T = 26;
  const mon = addDays(settings.start, -((pD(settings.start).getDay() + 6) % 7));
  const weeks = Math.ceil((daysBetween(mon, end) + 1) / 7);
  const W = L + weeks * step + 6, H = T + 7 * step;
  const col = (d: string) => Math.floor(daysBetween(mon, d) / 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(mon, i);
    if (d < settings.start || d > end) continue;
    const X = L + Math.floor(i / 7) * step, Y = T + (i % 7) * step;
    const l = logs[d], ahead = d > today, isToday = d === today;
    const tip = t("{date} · day {n}", { date: fmtS(d), n: daysBetween(settings.start, d) + 1 }) + " · " +
      (l ? t("{n} new ({h} no hint) · {r} redo", { n: l.newCount, h: l.noHint, r: l.redo }) : ahead ? t("still ahead") : t("nothing logged"));
    cells.push(
      <rect key={d} x={X + 0.5} y={Y + 0.5} width={c - 1} height={c - 1} rx={4} data-tip={tip}
        fill={ahead ? "none" : HEAT[heatLevel(l?.newCount ?? 0, settings.dailyNew)]}
        stroke={isToday ? "var(--ink)" : ahead ? "var(--line)" : "none"} strokeWidth={isToday ? 2 : 1}
        strokeDasharray={ahead && !isToday ? "3 2" : undefined} />,
    );
    const m = TL.find(([w]) => w === d);
    if (m) cells.push(
      <path key={d + "m"} d={`M${X + c / 2} ${Y + c / 2 - 5} l5 5 l-5 5 l-5 -5z`} fill="var(--warm)" stroke="var(--surface)"
        strokeWidth={1} data-tip={`${fmtS(d)} · ${t(m[1])} (${t(m[2])})`} style={{ cursor: "help" }} />,
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="viz heat" role="img"
      aria-label={t("Calendar of the sprint, one square per day, shaded by new problems solved")}>
      {/* Weekdays are formatted by hand like dates (and "Sun" is also a planet key in zh/charts.ts). */}
      {(lang === "zh" ? ["周一", "", "周三", "", "周五", "", "周日"] : ["Mon", "", "Wed", "", "Fri", "", "Sun"]).map((d, i) => d && (
        <text key={d} x={0} y={T + i * step + 16} className="axis">{d}</text>
      ))}
      {phases.map((p, i) => {
        const x1 = L + col(p.start) * step, x2 = L + col(p.end) * step + c;
        const cur = today >= p.start && today <= p.end;
        return (
          <g key={p.id} data-tip={`${t(p.name)} · ${fmtS(p.start)} – ${fmtS(p.end)}`}>
            <rect x={x1} y={4} width={x2 - x1} height={4} rx={2} fill={cur ? "var(--accent)" : "var(--line)"} />
            <text x={x1} y={20} className={cur ? "today-txt" : "axis"}>{`P${i + 1}`}</text>
          </g>
        );
      })}
      {cells}
    </svg>
  );
}

/** Outer ring: problems solved against the goal. Inner ring: days used. */
export function SprintRing({ solved, goal, dayN, totalDays }: { solved: number; goal: number; dayN: number; totalDays: number }) {
  const { t } = useT();
  const arc = (r: number, f: number, color: string, w: number) => {
    const circ = 2 * Math.PI * r;
    return (
      <>
        <circle cx={66} cy={66} r={r} fill="none" stroke="var(--empty)" strokeWidth={w} />
        {f > 0 && (
          <circle cx={66} cy={66} r={r} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"
            strokeDasharray={`${(circ * Math.min(1, f)).toFixed(1)} ${circ.toFixed(1)}`} transform="rotate(-90 66 66)" />
        )}
      </>
    );
  };
  return (
    <svg viewBox="0 0 132 132" width={132} height={132} role="img" className="sprint-ring"
      aria-label={t("{solved} of {goal} problems solved, day {n} of {total}", { solved, goal, n: dayN, total: totalDays })}>
      <g data-tip={t("{solved} of {goal} problems solved", { solved, goal })}>{arc(56, solved / goal, "var(--s1)", 11)}</g>
      <g data-tip={t("Day {n} of {total}", { n: dayN, total: totalDays })}>{arc(40, dayN / totalDays, "var(--muted)", 6)}</g>
      <text x={66} y={68} textAnchor="middle" className="ring-big">{solved}</text>
      <text x={66} y={86} textAnchor="middle" className="axis">{t("of {goal}", { goal })}</text>
    </svg>
  );
}

/** A tiny trend line with its last point marked. */
export function Spark({ values, color }: { values: number[]; color: string }) {
  const w = 72, h = 22, m = Math.max(1, ...values);
  const y = (v: number) => (h - 3 - (v / m) * (h - 6)).toFixed(1);
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i * w) / (values.length - 1)).toFixed(1)} ${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="spark">
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={w} cy={y(values[values.length - 1])} r={2.4} fill={color} />
    </svg>
  );
}
