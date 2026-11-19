// The parts of the tab that don't depend on state: the weekly rotation table,
// the chart reading, the timeline list and the toolkit. Text ported verbatim.

import type { ReactNode } from "react";
import { BaziPlate, NatalWheel, ZiweiGrid } from "./charts";
import { RULES, TL } from "./data";

export function WeekRotation() {
  const rows: [string, ReactNode, ReactNode][] = [
    ["Mon", <><b>AI engineering</b>: LLM concepts or the lia-reading RAG upgrade</>, "Same"],
    ["Tue", <><b>SWE fundamentals</b>: HTTP, SQL, Git, testing</>, <><b>System design lite</b>: URL shortener, rate limiter, cache, queue</>],
    ["Wed", <><b>Project polish</b>: README, tests or a demo for one repo</>, "Same"],
    ["Thu", <><b>AI engineering</b>: agent loop, evals, tradeoff answers</>, <><b>AI system design</b>: RAG support bot + eval pipeline</>],
    ["Fri", <><b>Behavioral</b>: record one STAR story, one resume pass</>, "Same"],
    ["Sat", <><b>Build day</b>: open-ended project work, the one allowed rabbit hole</>, "Same"],
    ["Sun", <><b>Weekly review</b>: check pace, redo every failed problem, set next week&apos;s patterns</>, "Same"],
  ];
  return (
    <>
      <div className="tablebox">
        <table>
          <thead>
            <tr><th>Day</th><th>Rotating track (block 4)</th><th>In interview mode (last phase)</th></tr>
          </thead>
          <tbody>
            {rows.map(([d, a, b]) => (
              <tr key={d}><td>{d}</td><td>{a}</td><td>{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid3">
        <div className="card">
          <span className="label">Spaced redo</span>
          <h3>1, 3, 7 days later</h3>
          <p>Every new problem comes back three times. Block 3 is only these redos. If you can&apos;t rewrite it cleanly on day 7, it goes back into the queue.</p>
        </div>
        <div className="card">
          <span className="label">Stuck rule</span>
          <h3>15 minutes, then a hint</h3>
          <p>Stuck for 15 minutes: take one hint. Stuck for 30: read the solution, close it, and rewrite it tomorrow. Log it as a redo, not as new.</p>
        </div>
        <div className="card">
          <span className="label">Bad-energy day</span>
          <h3>Minimum viable day</h3>
          <p>2 new problems, 1 redo, and log it. The streak survives and tomorrow starts clean.</p>
        </div>
      </div>
    </>
  );
}

export function TimelineList() {
  return (
    <ul className="timeline">
      {TL.map(([w, t, sys, txt, tone]) => (
        <li key={w + t}>
          <span className="when">{w}</span>
          <div className="what">
            <div className="t" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <h3>{t}</h3>
              <span className={"pill " + (tone || "ink")}>{sys}</span>
            </div>
            <p>{txt}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChartReading() {
  return (
    <>
      <p className="lede">
        Each system read on its own terms first, then compared. Covers personality, career, money, relationships and the long arc, compressed. Each claim names its source in the chart.
      </p>

      <div className="grid3">
        <div className="card">
          <span className="label">BaZi 八字 · Day Master 丁 fire</span>
          <h3>An expressive critic who earns through output</h3>
          <ul>
            <li><b>Personality:</b> 伤官格 (Hurting Officer structure: talent shows through expression, critique and new ideas). 伤官 holds 37.5% of the ten-god energy. You question rules and think out loud.</li>
            <li><b>Friction with authority:</b> 伤官见官 (Hurting Officer meets the Officer star) breaks the structure. 壬丁合 binds the officer, which softens it. Rigid bosses drain you, fair ones get your best work.</li>
            <li><b>Money:</b> 时上偏财 plus 偏财 at 17.6%. Current luck 庚申 (2018–2028) is 正财 (steady wage-type wealth): this decade asks you to turn skill into a paycheck.</li>
            <li><b>Next decade:</b> 己未 (Apr 2028–2038) is 食神 (Eating God: calm craft, steady output). It suits deep, sustained engineering work.</li>
            <li><b>Caution:</b> fire is the unfavorable element (忌神). 2026 丙午 and 2027 丁未 both carry fire stems: more competition, more scattered energy.</li>
          </ul>
          <p className="ev"><b>Evidence:</b> 月令 戌 本气 戊 透年干; 综合取用 用 木土金水 / 忌 火; 大运 table.</p>
        </div>
        <div className="card">
          <span className="label">Zi Wei 紫微斗数 · Life palace 酉</span>
          <h3>A steady, trusted operator who rises through learning</h3>
          <ul>
            <li><b>Personality:</b> 天府 in the life palace: calm under pressure, trusted, good at mediating. 文昌庙 with it, so 文星拱命 (scholar stars face the life palace): study and writing are how you get ahead.</li>
            <li><b>Career:</b> 天相庙 + 天魁 in the career palace. You do well inside a structure: a strong team member, more comfortable as a deputy than the top boss.</li>
            <li><b>Money:</b> empty wealth palace holding 禄存 + 文曲. Reputation and skill come first, then money follows.</li>
            <li><b>Inner engine:</b> body palace in 福德 (inner life) with 廉贞贪狼, 贪狼化禄. Many appetites and interests. This lines up with ADHD novelty-seeking.</li>
            <li><b>This decade (2020–2029):</b> 武曲化禄 into 迁移 (going out): gains from going out into the world. 贪狼化权 into the decade&apos;s career palace: interest drives the career. 文曲化忌 into 财帛: errors in documents and written details tied to money.</li>
            <li><b>Relationships:</b> 紫微破军 庙旺 in the spouse palace: a strong-willed partner, often older. The current decade runs through this palace, so relationships are a major theme of your twenties.</li>
          </ul>
          <p className="ev"><b>Evidence:</b> 命宫 辛酉; 官禄 乙丑; 身宫 亥; 大限 己未 四化.</p>
        </div>
        <div className="card">
          <span className="label">Western · Virgo rising, night chart</span>
          <h3>A precise doer with an investigative, restless mind</h3>
          <ul>
            <li><b>Personality:</b> Virgo Ascendant + Mars in the 1st: methodical, practical, builds things. Sun–Venus in Scorpio in the 3rd: depth, research, intense communication.</li>
            <li><b>Mind:</b> Moon opposite Mercury, Mercury conjunct Pluto, both square the Ascendant (a tight mutable T-square). The mind locks onto obsessive deep dives, then scatters. Mercury rules the 1st and 10th but sits in detriment: big-picture thinking, details slip.</li>
            <li><b>Career:</b> Moon conjunct the Midheaven (orb 0°01′) in Gemini. Your public role runs on information, variety and communicating. Uranus in the 6th rules the 6th: daily work needs tech and novelty.</li>
            <li><b>Luck through others:</b> Jupiter in its own sign (domicile, score +6) in the 7th. Mentors, partners and collaborators carry luck to you.</li>
            <li><b>Relationships:</b> Neptune rules the 7th from the 5th: you can idealize partners. Neptune transiting the 7th until Feb 2027 amplifies that.</li>
          </ul>
          <p className="ev"><b>Evidence:</b> Angles, Major Aspects, Essential Dignities, House Rulers.</p>
        </div>
      </div>

      <div className="vizcard">
        <div className="ph-row">
          <h3>BaZi plate</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--accent)" }} />Favorable element (用)</span>
            <span><i className="sw" style={{ background: "var(--warm)" }} />Unfavorable (忌)</span>
          </span>
        </div>
        <BaziPlate />
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>Zi Wei palaces</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--surface)", outline: "2px solid var(--accent)" }} />Life palace + its three supports (三方四正)</span>
            <span><i className="sw" style={{ background: "var(--plan-soft)" }} />Active now</span>
            <span>
              <span className="hua">禄</span> <span className="hua">权</span> <span className="hua">科</span> <span className="hua ji">忌</span> birth-year transformations
            </span>
          </span>
        </div>
        <ZiweiGrid />
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>Natal wheel</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--warm)" }} />Hard aspect (square, opposition)</span>
            <span><i className="sw" style={{ background: "var(--accent)" }} />Soft aspect (trine, sextile)</span>
          </span>
        </div>
        <div className="wheelwrap"><NatalWheel /></div>
        <p className="cap">
          Tropical, Placidus, Virgo rising on the left. Line weight follows orb: tighter aspects draw stronger. Hover a planet or line for its position or orb. Note the tight Moon–Mercury–Pluto axis crossing the Midheaven.
        </p>
      </div>

      <h2>Where all three agree</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>Conclusion</th><th>BaZi</th><th>Zi Wei</th><th>Western</th></tr></thead>
          <tbody>
            <tr><td><b>You learn and win by expressing.</b> Talk, write, explain, build in public.</td><td>伤官格, 伤官 37.5%</td><td>文星拱命, 文昌庙 in 命宫</td><td>Moon–MC in Gemini, Mercury on the angles</td></tr>
            <tr><td><b>Novelty hunger and scatter risk.</b> You need rotation with guardrails.</td><td>伤官 heavy, fire 忌</td><td>廉贞贪狼化禄 in 身宫/福德</td><td>Mutable T-square (Moon–Mercury–Pluto–ASC)</td></tr>
            <tr><td><b>2026 is a restructuring year, not a harvest.</b></td><td>丙午 劫财 = fire = 忌</td><td>流年 廉贞化忌 into 福德 (inner stress)</td><td>Uranus on Moon/MC Aug 1 and Oct 22, 2026</td></tr>
            <tr><td><b>April 2028 is a real turning point.</b></td><td>己未 luck starts Apr 2028; 2028 戊申 is all favorable elements</td><td>Still the 己 decade; 武曲化禄 outward gains</td><td>Saturn return, exact 2028-04-06</td></tr>
            <tr><td><b>Help comes through people.</b> Peers, mentors, collaborators.</td><td>天乙贵人 + 天德合 on the hour pillar</td><td>右弼化科 + 天同天梁 in 交友</td><td>Jupiter domicile in the 7th</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Where they disagree</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>Topic</th><th>The split</th><th>Why they differ</th><th>My call</th></tr></thead>
          <tbody>
            <tr>
              <td>Lead or support?</td>
              <td>Zi Wei: 天相 says a deputy role suits you. BaZi 伤官见官 and Western Uranus entering the 10th say you resist rigid authority and want autonomy.</td>
              <td>Zi Wei reads role fit inside an organization. BaZi and transits read temperament and the current push.</td>
              <td><b>Strong individual contributor on a small team with real ownership.</b> Avoid rigid, slow corporate tracks. A junior role is fine now: being the &quot;deputy&quot; there costs you nothing.</td>
            </tr>
            <tr>
              <td>How good is 2026?</td>
              <td>Western: Jupiter trines and Uranus on the MC read as breakthroughs. BaZi: a fire (忌) year with competition and energy drain.</td>
              <td>Western transits measure change and opportunity. BaZi measures whether the year&apos;s element helps the day master.</td>
              <td><b>Both are true.</b> Big shifts in direction, at a high energy cost. Use late 2026 to set up, not to sprint.</td>
            </tr>
            <tr>
              <td>Money</td>
              <td>Zi Wei: empty wealth palace, money comes after reputation. BaZi: strong 偏财 plus a 正财 luck pillar.</td>
              <td>Zi Wei reads the order things happen in. BaZi reads raw capacity.</td>
              <td><b>The capacity is there, but visible skill comes first.</b> Portfolio and interview performance unlock the pay. Don&apos;t stay in unpaid work for long.</td>
            </tr>
            <tr>
              <td>BaZi strength models</td>
              <td>The strength model alone says &quot;strong, favor water.&quot; The combined advice says 用 wood, earth, metal, water.</td>
              <td>Three schools weighed differently.</td>
              <td>Follow the <b>combined advice</b>, as the data rules say. The one clear &quot;avoid&quot; is fire.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <span className="label">Gaps in the data</span>
        <ul>
          <li>The request names five systems, but only three charts were supplied. No Vedic or 七政四余 data, so neither system is read here.</li>
          <li>Moon conjunct Midheaven (orb 0°01′) and the house cusps depend on the exact birth minute. A few minutes&apos; error moves them. The BaZi hour (丑) and the Zi Wei hour hold either way.</li>
          <li>Relationship timing would need more than these charts show. It is left out here on purpose. This page is about the job.</li>
        </ul>
      </div>
    </>
  );
}

export function Toolkit() {
  return (
    <>
      <h2>Operating rules</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {RULES.map(([t, b], i) => (
          <div key={t} className="rule card">
            <span className="n">{i + 1}</span>
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <h3>{t}</h3>
              <p>{b}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Your projects become interview stories</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>Repo</th><th>Story angle</th><th>Upgrade before interviews</th></tr></thead>
          <tbody>
            <tr><td><b>lia-reading</b></td><td>RAG over EPUB/PDF with Claude. Your flagship AI-engineer story.</td><td>Add a 30-question eval set, then measure retrieval hit rate before and after a chunking change.</td></tr>
            <tr><td><b>lia-personal-assistant-bridge</b></td><td>A screen-aware, local-first agent that works with any model. Covers tool use, privacy and how a skill system is designed.</td><td>Write a one-page architecture doc. Be ready for &quot;why local-first, and what did it cost you&quot;.</td></tr>
            <tr><td><b>care-plan-generator-api</b></td><td>A Python backend with LLM structured output. The bridge between SWE and AI work.</td><td>Add pytest tests, schema validation, a retry and timeout policy, and a latency note.</td></tr>
            <tr><td><b>feline-pain-detection</b></td><td>Classic ML/CV: data, labels, metrics.</td><td>Know the precision/recall tradeoff for this use case, and explain why.</td></tr>
            <tr><td><b>leetcode-pattern-flashcards</b></td><td>You built a tool for your own learning problem. A good behavioral story.</td><td>Use it daily, so the story is true.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>From your stars, the short list</h2>
      <div className="grid3">
        <div className="card"><span className="pill">DSA</span><h3>EndlessCheng/codeforces-go (0x3f)</h3><p>The main problem lists. labuladong for the &quot;why&quot; when a pattern won&apos;t click.</p></div>
        <div className="card"><span className="pill">DSA</span><h3>yangshun/tech-interview-handbook</h3><p>Behavioral prep, resume and negotiation chapters. Skip the parts you already cover.</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>datawhalechina/happy-llm</h3><p>Chapters on tokens, embeddings, attention, context. Read for interview answers, not to train models.</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>shareAI-lab/learn-claude-code</h3><p>Build a nano agent loop. Pairs with hello-agents and microsoft/ai-agents-for-beginners for theory.</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>yzhao062/awesome-auditable-ai</h3><p>Evals and reliability. Gives you something most junior candidates can&apos;t talk about.</p></div>
        <div className="card"><span className="pill ink">SWE</span><h3>donnemartin/system-design-primer</h3><p>Junior level only: caching, queues, a URL shortener, a rate limiter. CS-Notes for OS and networking gaps.</p></div>
      </div>
      <p className="note">Parked on purpose: kunal-kushwaha/DSA-Bootcamp-Java and trekhleb/javascript-algorithms. You interview in Python, and you already have enough lists.</p>
    </>
  );
}
