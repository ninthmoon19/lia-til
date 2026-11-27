// The parts of the tab that don't depend on state: the weekly rotation table,
// the chart reading, the timeline list and the toolkit. Text ported verbatim.

import type { ReactNode } from "react";
import { BaziPlate, NatalWheel, ZiweiGrid } from "./charts";
import { RULES, TL } from "./data";
import { useT } from "./i18n";

export function WeekRotation() {
  const { t, lang } = useT();
  const sep = lang === "zh" ? "：" : ": ";
  const row = (label: string, text: string) => <><b>{t(label)}</b>{sep}{t(text)}</>;
  const rows: [string, ReactNode, ReactNode][] = [
    ["Mon", row("AI engineering", "LLM concepts or the lia-reading RAG upgrade"), t("Same")],
    ["Tue", row("SWE fundamentals", "HTTP, SQL, Git, testing"), row("System design lite", "URL shortener, rate limiter, cache, queue")],
    ["Wed", row("Research (RA)", "writing sample first, then professor emails"), t("Same")],
    ["Thu", row("AI engineering", "agent loop, evals, tradeoff answers"), row("AI system design", "RAG support bot + eval pipeline")],
    ["Fri", row("Behavioral", "record one STAR story, one resume pass"), t("Same")],
    ["Sat", row("Research build day", "paper reading or project work for the writing sample, the one allowed rabbit hole"), t("Same")],
    ["Sun", row("Weekly review", "check pace, redo every failed problem, set next week's patterns"), t("Same")],
  ];
  return (
    <>
      <div className="tablebox">
        <table>
          <thead>
            <tr><th>{t("Day")}</th><th>{t("Rotating track (block 4)")}</th><th>{t("In interview mode (last phase)")}</th></tr>
          </thead>
          <tbody>
            {rows.map(([d, a, b]) => (
              <tr key={d}><td>{t(d)}</td><td>{a}</td><td>{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid3">
        <div className="card">
          <span className="label">{t("Spaced redo")}</span>
          <h3>{t("1, 3, 7 days later")}</h3>
          <p>{t("Every new problem comes back three times. Block 3 is only these redos. If you can't rewrite it cleanly on day 7, it goes back into the queue.")}</p>
        </div>
        <div className="card">
          <span className="label">{t("Stuck rule")}</span>
          <h3>{t("15 minutes, then a hint")}</h3>
          <p>{t("Stuck for 15 minutes: take one hint. Stuck for 30: read the solution, close it, and rewrite it tomorrow. Log it as a redo, not as new.")}</p>
        </div>
        <div className="card">
          <span className="label">{t("Bad-energy day")}</span>
          <h3>{t("Minimum viable day")}</h3>
          <p>{t("2 new problems, 1 redo, and log it. The streak survives and tomorrow starts clean.")}</p>
        </div>
      </div>
    </>
  );
}

export function TimelineList() {
  const { t } = useT();
  return (
    <ul className="timeline">
      {TL.map(([w, title, sys, txt, tone]) => (
        <li key={w + title}>
          <span className="when">{w}</span>
          <div className="what">
            <div className="t" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <h3>{t(title)}</h3>
              <span className={"pill " + (tone || "ink")}>{t(sys)}</span>
            </div>
            <p>{t(txt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChartReading() {
  const { t, lang } = useT();
  const zh = lang === "zh";
  return (
    <>
      <p className="lede">
        {t("Each system read on its own terms first, then compared. Covers personality, career, money, relationships and the long arc, compressed. Each claim names its source in the chart.")}
      </p>

      <div className="grid3">
        <div className="card">
          <span className="label">{t("BaZi 八字 · Day Master 丁 fire")}</span>
          <h3>{t("An expressive critic who earns through output")}</h3>
          {zh ? (
            <>
              <ul>
                <li><b>性格：</b>伤官格（才华通过表达、批判和新想法展现）。伤官占十神能量的 37.5%。你会质疑规则，习惯边想边说。</li>
                <li><b>与权威的摩擦：</b>伤官见官，破格。壬丁合绊住官星，有所缓和。死板的上司会消耗你，公正的上司能得到你最好的状态。</li>
                <li><b>财：</b>时上偏财，偏财占 17.6%。当前大运庚申（2018–2028）为正财（稳定的工资型财富）：这十年要你把技能变成薪水。</li>
                <li><b>下一步大运：</b>己未（2028 年 4 月–2038）为食神（平稳的手艺、持续的产出），适合深入、持久的工程工作。</li>
                <li><b>注意：</b>火是忌神。2026 丙午和 2027 丁未天干都带火：竞争更多，精力更分散。</li>
              </ul>
              <p className="ev"><b>依据：</b>月令 戌 本气 戊 透年干；综合取用 用 木土金水 / 忌 火；大运表。</p>
            </>
          ) : (
            <>
              <ul>
                <li><b>Personality:</b> 伤官格 (Hurting Officer structure: talent shows through expression, critique and new ideas). 伤官 holds 37.5% of the ten-god energy. You question rules and think out loud.</li>
                <li><b>Friction with authority:</b> 伤官见官 (Hurting Officer meets the Officer star) breaks the structure. 壬丁合 binds the officer, which softens it. Rigid bosses drain you, fair ones get your best work.</li>
                <li><b>Money:</b> 时上偏财 plus 偏财 at 17.6%. Current luck 庚申 (2018–2028) is 正财 (steady wage-type wealth): this decade asks you to turn skill into a paycheck.</li>
                <li><b>Next decade:</b> 己未 (Apr 2028–2038) is 食神 (Eating God: calm craft, steady output). It suits deep, sustained engineering work.</li>
                <li><b>Caution:</b> fire is the unfavorable element (忌神). 2026 丙午 and 2027 丁未 both carry fire stems: more competition, more scattered energy.</li>
              </ul>
              <p className="ev"><b>Evidence:</b> 月令 戌 本气 戊 透年干; 综合取用 用 木土金水 / 忌 火; 大运 table.</p>
            </>
          )}
        </div>
        <div className="card">
          <span className="label">{t("Zi Wei 紫微斗数 · Life palace 酉")}</span>
          <h3>{t("A steady, trusted operator who rises through learning")}</h3>
          {zh ? (
            <>
              <ul>
                <li><b>性格：</b>天府坐命：临危不乱、值得信赖、善于调和。文昌庙同宫，形成文星拱命：读书和写作是你的上升通道。</li>
                <li><b>事业：</b>官禄宫天相庙 + 天魁。你在体系内表现好：是很强的团队成员，做副手比做一把手更自在。</li>
                <li><b>财：</b>财帛宫空宫，内有禄存 + 文曲。先有名声和技能，钱随后就来。</li>
                <li><b>内在驱动：</b>身宫在福德（内心世界），廉贞贪狼同宫，贪狼化禄。欲望和兴趣都多，这和 ADHD 的求新倾向一致。</li>
                <li><b>这个大限（2020–2029）：</b>武曲化禄入迁移（出外）：走出去才有收获。贪狼化权入大限官禄：兴趣驱动事业。文曲化忌入财帛：与钱相关的文件和书面细节容易出错。</li>
                <li><b>感情：</b>紫微破军 庙旺 在夫妻宫：伴侣意志强，常比你年长。当前大限正走这一宫，所以感情是你二十多岁的一大主题。</li>
              </ul>
              <p className="ev"><b>依据：</b>命宫 辛酉；官禄 乙丑；身宫 亥；大限 己未 四化。</p>
            </>
          ) : (
            <>
              <ul>
                <li><b>Personality:</b> 天府 in the life palace: calm under pressure, trusted, good at mediating. 文昌庙 with it, so 文星拱命 (scholar stars face the life palace): study and writing are how you get ahead.</li>
                <li><b>Career:</b> 天相庙 + 天魁 in the career palace. You do well inside a structure: a strong team member, more comfortable as a deputy than the top boss.</li>
                <li><b>Money:</b> empty wealth palace holding 禄存 + 文曲. Reputation and skill come first, then money follows.</li>
                <li><b>Inner engine:</b> body palace in 福德 (inner life) with 廉贞贪狼, 贪狼化禄. Many appetites and interests. This lines up with ADHD novelty-seeking.</li>
                <li><b>This decade (2020–2029):</b> 武曲化禄 into 迁移 (going out): gains from going out into the world. 贪狼化权 into the decade&apos;s career palace: interest drives the career. 文曲化忌 into 财帛: errors in documents and written details tied to money.</li>
                <li><b>Relationships:</b> 紫微破军 庙旺 in the spouse palace: a strong-willed partner, often older. The current decade runs through this palace, so relationships are a major theme of your twenties.</li>
              </ul>
              <p className="ev"><b>Evidence:</b> 命宫 辛酉; 官禄 乙丑; 身宫 亥; 大限 己未 四化.</p>
            </>
          )}
        </div>
        <div className="card">
          <span className="label">{t("Western · Virgo rising, night chart")}</span>
          <h3>{t("A precise doer with an investigative, restless mind")}</h3>
          {zh ? (
            <>
              <ul>
                <li><b>性格：</b>处女座上升 + 火星在第一宫：有条理、务实、爱动手做东西。太阳金星合相于天蝎座、落第三宫：有深度、爱研究、沟通强烈。</li>
                <li><b>思维：</b>月亮对冲水星，水星合冥王星，二者都刑上升点（紧密的变动宫 T 三角）。思维会锁定在执着的深挖上，然后又分散。水星主管第一宫和第十宫，但落陷：擅长看大局，细节容易漏。</li>
                <li><b>事业：</b>月亮合天顶 MC（容许度 0°01′），在双子座。你的公众角色靠信息、多样性和沟通来运转。天王星在第六宫并主管第六宫：日常工作需要技术和新鲜感。</li>
                <li><b>他人带来的运气：</b>木星入庙（本垣，得分 +6）在第七宫。导师、伙伴和合作者会把运气带给你。</li>
                <li><b>感情：</b>海王星从第五宫主管第七宫：你容易把伴侣理想化。海王星行运第七宫直到 2027 年 2 月，会放大这一点。</li>
              </ul>
              <p className="ev"><b>依据：</b>四轴、主要相位、必然尊贵、宫主星。</p>
            </>
          ) : (
            <>
              <ul>
                <li><b>Personality:</b> Virgo Ascendant + Mars in the 1st: methodical, practical, builds things. Sun–Venus in Scorpio in the 3rd: depth, research, intense communication.</li>
                <li><b>Mind:</b> Moon opposite Mercury, Mercury conjunct Pluto, both square the Ascendant (a tight mutable T-square). The mind locks onto obsessive deep dives, then scatters. Mercury rules the 1st and 10th but sits in detriment: big-picture thinking, details slip.</li>
                <li><b>Career:</b> Moon conjunct the Midheaven (orb 0°01′) in Gemini. Your public role runs on information, variety and communicating. Uranus in the 6th rules the 6th: daily work needs tech and novelty.</li>
                <li><b>Luck through others:</b> Jupiter in its own sign (domicile, score +6) in the 7th. Mentors, partners and collaborators carry luck to you.</li>
                <li><b>Relationships:</b> Neptune rules the 7th from the 5th: you can idealize partners. Neptune transiting the 7th until Feb 2027 amplifies that.</li>
              </ul>
              <p className="ev"><b>Evidence:</b> Angles, Major Aspects, Essential Dignities, House Rulers.</p>
            </>
          )}
        </div>
      </div>

      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("BaZi plate")}</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--accent)" }} />{t("Favorable element (用)")}</span>
            <span><i className="sw" style={{ background: "var(--warm)" }} />{t("Unfavorable (忌)")}</span>
          </span>
        </div>
        <BaziPlate />
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("Zi Wei palaces")}</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--surface)", outline: "2px solid var(--accent)" }} />{t("Life palace + its three supports (三方四正)")}</span>
            <span><i className="sw" style={{ background: "var(--plan-soft)" }} />{t("Active now")}</span>
            <span>
              <span className="hua">禄</span> <span className="hua">权</span> <span className="hua">科</span> <span className="hua ji">忌</span> {t("birth-year transformations")}
            </span>
          </span>
        </div>
        <ZiweiGrid />
      </div>
      <div className="vizcard">
        <div className="ph-row">
          <h3>{t("Natal wheel")}</h3>
          <span className="legend">
            <span><i className="sw" style={{ background: "var(--warm)" }} />{t("Hard aspect (square, opposition)")}</span>
            <span><i className="sw" style={{ background: "var(--accent)" }} />{t("Soft aspect (trine, sextile)")}</span>
          </span>
        </div>
        <div className="wheelwrap"><NatalWheel /></div>
        <p className="cap">
          {t("Tropical, Placidus, Virgo rising on the left. Line weight follows orb: tighter aspects draw stronger. Hover a planet or line for its position or orb. Note the tight Moon–Mercury–Pluto axis crossing the Midheaven.")}
        </p>
      </div>

      <h2>{t("Where all three agree")}</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>{t("Conclusion")}</th><th>{t("BaZi")}</th><th>{t("Zi Wei")}</th><th>{t("Western")}</th></tr></thead>
          {zh ? (
            <tbody>
              <tr><td><b>你靠表达来学习和取胜。</b>说、写、讲解、公开地做东西。</td><td>伤官格，伤官 37.5%</td><td>文星拱命，文昌庙在命宫</td><td>双子座月亮合天顶 MC，水星在四轴上</td></tr>
              <tr><td><b>渴求新鲜，有分散风险。</b>你需要有护栏的轮换。</td><td>伤官重，火为忌</td><td>廉贞贪狼化禄在身宫/福德</td><td>变动宫 T 三角（月亮–水星–冥王星–上升点）</td></tr>
              <tr><td><b>2026 是重组之年，不是收获之年。</b></td><td>丙午 劫财 = 火 = 忌</td><td>流年 廉贞化忌入福德（内在压力）</td><td>天王星合月亮/MC：2026 年 8 月 1 日和 10 月 22 日</td></tr>
              <tr><td><b>2028 年 4 月是真正的转折点。</b></td><td>己未大运 2028 年 4 月起；2028 戊申全是喜用</td><td>仍在己大限；武曲化禄向外得益</td><td>土星回归，精确于 2028-04-06</td></tr>
              <tr><td><b>帮助来自人。</b>同伴、导师、合作者。</td><td>时柱天乙贵人 + 天德合</td><td>右弼化科 + 天同天梁在交友宫</td><td>木星入庙在第七宫</td></tr>
            </tbody>
          ) : (
            <tbody>
              <tr><td><b>You learn and win by expressing.</b> Talk, write, explain, build in public.</td><td>伤官格, 伤官 37.5%</td><td>文星拱命, 文昌庙 in 命宫</td><td>Moon–MC in Gemini, Mercury on the angles</td></tr>
              <tr><td><b>Novelty hunger and scatter risk.</b> You need rotation with guardrails.</td><td>伤官 heavy, fire 忌</td><td>廉贞贪狼化禄 in 身宫/福德</td><td>Mutable T-square (Moon–Mercury–Pluto–ASC)</td></tr>
              <tr><td><b>2026 is a restructuring year, not a harvest.</b></td><td>丙午 劫财 = fire = 忌</td><td>流年 廉贞化忌 into 福德 (inner stress)</td><td>Uranus on Moon/MC Aug 1 and Oct 22, 2026</td></tr>
              <tr><td><b>April 2028 is a real turning point.</b></td><td>己未 luck starts Apr 2028; 2028 戊申 is all favorable elements</td><td>Still the 己 decade; 武曲化禄 outward gains</td><td>Saturn return, exact 2028-04-06</td></tr>
              <tr><td><b>Help comes through people.</b> Peers, mentors, collaborators.</td><td>天乙贵人 + 天德合 on the hour pillar</td><td>右弼化科 + 天同天梁 in 交友</td><td>Jupiter domicile in the 7th</td></tr>
            </tbody>
          )}
        </table>
      </div>

      <h2>{t("Where they disagree")}</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>{t("Topic")}</th><th>{t("The split")}</th><th>{t("Why they differ")}</th><th>{t("My call")}</th></tr></thead>
          {zh ? (
            <tbody>
              <tr>
                <td>领导还是辅助？</td>
                <td>紫微斗数：天相说副手角色适合你。八字伤官见官和西洋占星天王星进入第十宫则说你抗拒死板的权威，想要自主。</td>
                <td>紫微斗数看的是组织内的角色适配。八字和行运看的是性情和当下的推力。</td>
                <td><b>在有真正 ownership 的小团队里做强 IC。</b>避开死板、缓慢的大公司路线。现在做 junior 没问题：在那里当“副手”对你没有损失。</td>
              </tr>
              <tr>
                <td>2026 到底好不好？</td>
                <td>西洋占星：木星三分和天王星合 MC 看起来是突破。八字：火（忌）年，竞争多、耗精力。</td>
                <td>西洋行运衡量变化和机会。八字衡量当年的五行是否帮扶日主。</td>
                <td><b>两者都对。</b>方向大变，能量代价高。用 2026 年末来打基础，而不是冲刺。</td>
              </tr>
              <tr>
                <td>财</td>
                <td>紫微斗数：财帛宫空，先有名声后有钱。八字：偏财强，再加正财大运。</td>
                <td>紫微斗数看事情发生的顺序。八字看原始容量。</td>
                <td><b>容量是有的，但要先让技能被看见。</b>作品集和面试表现会解锁薪资。别在无薪工作里待太久。</td>
              </tr>
              <tr>
                <td>八字强弱模型</td>
                <td>单看强弱模型是“身强，喜水”。综合取用则是用木、土、金、水。</td>
                <td>三个流派的权重不同。</td>
                <td>按数据规则，遵循<b>综合取用</b>。唯一明确要“避开”的是火。</td>
              </tr>
            </tbody>
          ) : (
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
          )}
        </table>
      </div>

      <div className="card">
        <span className="label">{t("Gaps in the data")}</span>
        <ul>
          <li>{t("The request names five systems, but only three charts were supplied. No Vedic or 七政四余 data, so neither system is read here.")}</li>
          <li>{t("Moon conjunct Midheaven (orb 0°01′) and the house cusps depend on the exact birth minute. A few minutes' error moves them. The BaZi hour (丑) and the Zi Wei hour hold either way.")}</li>
          <li>{t("Relationship timing would need more than these charts show. It is left out here on purpose. This page is about the job.")}</li>
        </ul>
      </div>
    </>
  );
}

export function Toolkit() {
  const { t } = useT();
  return (
    <>
      <h2>{t("Operating rules")}</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {RULES.map(([title, b], i) => (
          <div key={title} className="rule card">
            <span className="n">{i + 1}</span>
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <h3>{t(title)}</h3>
              <p>{t(b)}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>{t("Your projects become interview stories")}</h2>
      <div className="tablebox">
        <table>
          <thead><tr><th>{t("Repo")}</th><th>{t("Story angle")}</th><th>{t("Upgrade before interviews")}</th></tr></thead>
          <tbody>
            <tr><td><b>lia-reading</b></td><td>{t("RAG over EPUB/PDF with Claude. Your flagship AI-engineer story.")}</td><td>{t("Add a 30-question eval set, then measure retrieval hit rate before and after a chunking change.")}</td></tr>
            <tr><td><b>lia-personal-assistant-bridge</b></td><td>{t("A screen-aware, local-first agent that works with any model. Covers tool use, privacy and how a skill system is designed.")}</td><td>{t('Write a one-page architecture doc. Be ready for "why local-first, and what did it cost you".')}</td></tr>
            <tr><td><b>care-plan-generator-api</b></td><td>{t("A Python backend with LLM structured output. The bridge between SWE and AI work.")}</td><td>{t("Add pytest tests, schema validation, a retry and timeout policy, and a latency note.")}</td></tr>
            <tr><td><b>feline-pain-detection</b></td><td>{t("Classic ML/CV: data, labels, metrics.")}</td><td>{t("Know the precision/recall tradeoff for this use case, and explain why.")}</td></tr>
            <tr><td><b>leetcode-pattern-flashcards</b></td><td>{t("You built a tool for your own learning problem. A good behavioral story.")}</td><td>{t("Use it daily, so the story is true.")}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>{t("From your stars, the short list")}</h2>
      <div className="grid3">
        <div className="card"><span className="pill">DSA</span><h3>EndlessCheng/codeforces-go (0x3f)</h3><p>{t(`The main problem lists. labuladong for the "why" when a pattern won't click.`)}</p></div>
        <div className="card"><span className="pill">DSA</span><h3>yangshun/tech-interview-handbook</h3><p>{t("Behavioral prep, resume and negotiation chapters. Skip the parts you already cover.")}</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>datawhalechina/happy-llm</h3><p>{t("Chapters on tokens, embeddings, attention, context. Read for interview answers, not to train models.")}</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>shareAI-lab/learn-claude-code</h3><p>{t("Build a nano agent loop. Pairs with hello-agents and microsoft/ai-agents-for-beginners for theory.")}</p></div>
        <div className="card"><span className="pill warm">AI</span><h3>yzhao062/awesome-auditable-ai</h3><p>{t("Evals and reliability. Gives you something most junior candidates can't talk about.")}</p></div>
        <div className="card"><span className="pill ink">SWE</span><h3>donnemartin/system-design-primer</h3><p>{t("Junior level only: caching, queues, a URL shortener, a rate limiter. CS-Notes for OS and networking gaps.")}</p></div>
      </div>
      <p className="note">{t("Parked on purpose: kunal-kushwaha/DSA-Bootcamp-Java and trekhleb/javascript-algorithms. You interview in Python, and you already have enough lists.")}</p>
    </>
  );
}
