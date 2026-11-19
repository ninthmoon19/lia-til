// Static content of the Launch Path tab: the four phases and their checklist,
// the chart-derived timeline, the operating rules and the daily block template.
// Ported verbatim from the original single-file page.

export type Track = "DSA" | "AI" | "SWE" | "STORY";
export type Item = { id: string; track: Track; title: string; detail: string };
export type PhaseBase = { id: string; name: string; tag: string; why: string; items: Item[] };

const it = (id: string, track: Track, title: string, detail: string): Item => ({ id, track, title, detail });

export const BASE: PhaseBase[] = [
  {
    id: "p1",
    name: "Foundations + patterns I",
    tag: "Rhythm first",
    why: "Late in the 2026 fire year (丙午, unfavorable), and Jupiter sits in your 12th: quiet, behind-the-scenes work is favored. Build the daily rhythm and Python fluency, then volume.",
    items: [
      it("p1-py", "DSA", "Python fluency drill", "First week, inside block 1: list, dict, set, deque, heapq, Counter, sorted(key=…)"),
      it("p1-hash", "DSA", "Arrays + hashing", "0x3f basics, 15 problems"),
      it("p1-tp", "DSA", "Two pointers + sliding window", "20 problems"),
      it("p1-bs", "DSA", "Binary search (incl. on answer)", "12 problems"),
      it("p1-stack", "DSA", "Stack + monotonic stack", "10 problems"),
      it("p1-fc", "DSA", "One flashcard per solved problem", "Pattern, trigger, edge case. Use leetcode-pattern-flashcards"),
      it("p1-star", "STORY", "Draft 4 STAR stories", "lia-reading, Bridge, care-plan API, feline pain detection"),
      it("p1-apply", "STORY", "Applications every day", "5 targeted applications a day in block 5, logged in lia-til"),
    ],
  },
  {
    id: "p2",
    name: "Patterns II",
    tag: "DSA heavy",
    why: "Saturn turns direct Dec 11, a natural checkpoint. Lock the rhythm, read your pace numbers honestly, and adjust the phase lengths if needed.",
    items: [
      it("p2-ll", "DSA", "Linked list", "12 problems; draw every pointer move"),
      it("p2-tree", "DSA", "Binary trees + BST", "20 problems"),
      it("p2-graph", "DSA", "BFS / DFS on grids and graphs", "15 problems"),
      it("p2-heap", "DSA", "Heap / top-k + intervals", "12 problems"),
      it("p2-bt", "DSA", "Backtracking", "10 problems"),
      it("p2-mock", "DSA", "First timed mock", "45 min, out loud, recorded; review the recording"),
      it("p2-swe", "SWE", "SWE fundamentals pass", "HTTP/REST, SQL joins + indexes, Git rebase vs merge, pytest"),
    ],
  },
  {
    id: "p3",
    name: "Patterns III + AI core",
    tag: "Hardest topics",
    why: "DP and graphs are the hardest stretch. Your Mercury–Pluto focus helps here: go deep, but only inside the time boxes.",
    items: [
      it("p3-dp", "DSA", "Dynamic programming, 1D then 2D", "25 problems"),
      it("p3-g2", "DSA", "Topological sort, union find, Dijkstra", "12 problems"),
      it("p3-trie", "DSA", "Trie + greedy", "10 problems"),
      it("p3-llm", "AI", "LLM fundamentals", "Tokens, embeddings, attention (high level), context window; happy-llm ch. 1–4"),
      it("p3-rag", "AI", "RAG upgrade in lia-reading", "Chunking, embeddings, rerank; 30-question eval set with hit rate"),
      it("p3-agent", "AI", "Nano agent loop", "Follow learn-claude-code: tool calling + a stop condition in ~200 lines"),
      it("p3-trade", "AI", "Tradeoff answers", "RAG vs fine-tune vs long context: when to switch, in 90 seconds each"),
    ],
  },
  {
    id: "p4",
    name: "Interview mode",
    tag: "Mocks + polish",
    why: "Pluto trines your Midheaven on Jan 22, 2027, right after this phase by default. Interviews in late January fall in a supportive window. Arrive mock-ready.",
    items: [
      it("p4-mock", "DSA", "Daily timed mock", "Block 2 becomes a mock: 2 problems in 45 min, out loud"),
      it("p4-weak", "DSA", "Weak-topic sweep", "Redo every problem you failed or needed the solution for"),
      it("p4-150", "DSA", "Top Interview 150 sweep", "Fill gaps; about 50 new problems"),
      it("p4-sd", "SWE", "System design lite", "URL shortener, rate limiter, cache, queue: system-design-primer"),
      it("p4-aisd", "AI", "AI system design", "Design a RAG support bot and its eval pipeline"),
      it("p4-resume", "STORY", "Resume rewrite with numbers", "Every bullet: action + tech + result. Read it twice, once out loud"),
      it("p4-beh", "STORY", "Behavioral bank", "8 stories recorded and replayed"),
      it("p4-apply", "STORY", "Referrals + volume", "Referrals first, then 10 applications a day"),
    ],
  },
];

export const ALL_ITEMS = BASE.flatMap((p) => p.items.map((i) => ({ ...i, phaseId: p.id })));
export const ITEM_IDS = new Set(ALL_ITEMS.map((i) => i.id));

export const TRACKS: { id: Track; name: string; color: string }[] = [
  { id: "DSA", name: "DSA", color: "var(--s1)" },
  { id: "AI", name: "AI engineering", color: "var(--s2)" },
  { id: "SWE", name: "SWE fundamentals", color: "var(--s3)" },
  { id: "STORY", name: "Story + applications", color: "var(--s4)" },
];

/** [when, title, system, text, tone] — tone "warm" marks a caution. */
export const TL: [string, string, string, string, "" | "warm"][] = [
  ["2026-10-22", "Uranus on Moon + MC (2nd pass)", "Western", "Direction shake-up. Already passed, and it's why this sprint starts now.", "warm"],
  ["2026-12-11", "Saturn stations direct", "Western", "Mid-plan checkpoint. Read your pace numbers and adjust phase lengths if needed.", ""],
  ["2027-01-22", "Pluto trine Moon + MC", "Western", "Just after the default finish. A supportive window for interviews that matter.", ""],
  ["2027-02-04", "BaZi year 丁未 begins", "BaZi", "Fire stem (peers, competition) plus earth branch (食神 craft). Keep the daily rhythm going.", "warm"],
  ["2027-02-19", "Neptune leaves your 7th", "Western", "Clearer reads on recruiters, teams and collaborators.", ""],
  ["2027-05-14", "Uranus on Moon + MC (3rd pass)", "Western", "Career identity shift lands. Likely around a first role or a move.", ""],
  ["2027-06-09", "Uranus square Ascendant", "Western", "Restless. Expect an urge to switch plans. Change tactics, keep the goal.", "warm"],
  ["2027-08-26", "Jupiter leaves your 12th", "Western", "The quiet prep year ends. More visibility.", ""],
  ["2028-02-04", "BaZi year 戊申 begins", "BaZi", "伤官 plus 正财: all favorable elements. Output turns into income.", ""],
  ["2028-04-06", "Saturn return (exact)", "Western", "Adult-structure checkpoint. It coincides with the next BaZi luck pillar.", ""],
  ["2028-04", "BaZi luck pillar 己未 starts", "BaZi", "Ten years of 食神: steady craft, deep work. Good for growing past junior.", ""],
  ["2020–2029", "Zi Wei decade 己 in the spouse palace", "Zi Wei", "武曲化禄 outward: apply widely. 文曲化忌: double-check every document.", "warm"],
];

export const RULES: [string, string][] = [
  ["LeetCode first, every day", "About 60% of study time is LeetCode, placed in the morning while focus is freshest. Everything else fits around it, never the other way."],
  ["Count outcomes, not hours", "A problem counts only if you can rewrite it from scratch a day later. Log new, no-hint and redo numbers every day. The charts on Today keep you honest."],
  ["Output-first", "Every block ends with something made: a card, a note, a recorded explanation. Your charts all say you learn by expressing (伤官格, 文星拱命, Moon on the MC in Gemini)."],
  ["One rabbit hole a week", "Mercury–Pluto deep dives are a strength once they're scheduled. Saturday's block 4 gets one. On weekdays, park the idea in a list and move on."],
  ["Argue to learn", 'For every concept, answer "why this and not the alternative, and when would you switch?" This turns ENTP debate energy into interview answers.'],
  ["Learn with people", "Peer mocks, body doubling, a study buddy. Jupiter in the 7th, 右弼化科 in friends, 天乙贵人 on the hour pillar: help reliably comes through others."],
  ["Six hours is a ceiling", "The whole sprint sits in the 2026 fire year (unfavorable). No all-nighters and no 10-hour days. A minimum viable day still counts."],
  ["Read details twice", "Mercury in detriment plus 文曲化忌 this decade: typos, wrong dates, missed clauses. Resume, applications and offer letters get a slow second read out loud."],
];

/** One study day. `w` blocks scale with the hours setting (weights are minutes
 * of a 6-hour day); `m` breaks are fixed minutes. `p4` overrides the block in
 * the last phase. */
export type BlockKind = "lc" | "brk" | "trk" | "out";
export type Block = { k: BlockKind; w?: number; m?: number; t: string; d?: string; p4?: [string, string] };
export const BLOCKS: Block[] = [
  { k: "lc", w: 90, t: "LeetCode · new problems", d: "Pattern of the phase. Say the approach out loud before typing." },
  { k: "brk", m: 15, t: "Break" },
  {
    k: "lc",
    w: 75,
    t: "LeetCode · new problems, set 2",
    d: "Same pattern, a step harder.",
    p4: ["LeetCode · timed mock", "2 problems in 45 min, out loud, recorded."],
  },
  { k: "brk", m: 60, t: "Lunch" },
  { k: "lc", w: 60, t: "LeetCode · redo + flashcards", d: "Problems from 1, 3 and 7 days ago. Rewrite them without looking." },
  { k: "brk", m: 15, t: "Break" },
  { k: "trk", w: 90, t: "Rotating track", d: "" },
  { k: "brk", m: 15, t: "Break" },
  { k: "out", w: 45, t: "Output + applications", d: "Log the day, write one note or card, then send applications." },
];

/** Block 4 by weekday (0 = Sunday). */
export const TRACKDAY: Record<number, [string, string]> = {
  1: ["AI engineering", "LLM concepts or the lia-reading RAG upgrade."],
  2: ["SWE fundamentals", "HTTP, SQL, Git, testing."],
  3: ["Project polish", "README, tests or a demo for one repo."],
  4: ["AI engineering", "Agent loop, evals, or a tradeoff answer."],
  5: ["Behavioral", "Record one STAR story; one resume pass."],
  6: ["Build day", "Open-ended project work. The one allowed rabbit hole."],
  0: ["Weekly review", "Check pace, redo every failed problem, set next week's patterns."],
};
export const P4TRACK: Record<number, [string, string]> = {
  2: ["System design lite", "URL shortener, rate limiter, cache, queue."],
  4: ["AI system design", "Design a RAG support bot and its eval pipeline."],
};
export const KCOL: Record<BlockKind, string> = {
  lc: "var(--s1)",
  trk: "var(--s2)",
  out: "var(--s3)",
  brk: "var(--neutral-soft)",
};
