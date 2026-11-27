// Chinese strings for the Launch Path tab, keyed by the exact English source text.
// A missing key falls back to English. {name} placeholders must match the English key.
export const ZH_STATIC: Record<string, string> = {
  // ---- weekly rotation ----
  "Mon": "周一",
  "Tue": "周二",
  "Wed": "周三",
  "Thu": "周四",
  "Fri": "周五",
  "Sat": "周六",
  "Sun": "周日",
  "Day": "星期",
  "Rotating track (block 4)": "轮换方向（第 4 段）",
  "In interview mode (last phase)": "面试模式下（最后阶段）",
  "Same": "同上",
  "LLM concepts or the lia-reading RAG upgrade": "LLM 概念，或 lia-reading 的 RAG 升级",
  "HTTP, SQL, Git, testing": "HTTP、SQL、Git、测试",
  "URL shortener, rate limiter, cache, queue": "短链接、限流器、缓存、队列",
  "README, tests or a demo for one repo": "给一个 repo 补 README、测试或 demo",
  "agent loop, evals, tradeoff answers": "agent 循环、评测、取舍类回答",
  "RAG support bot + eval pipeline": "RAG 客服机器人 + 评测流水线",
  "record one STAR story, one resume pass": "录一个 STAR 故事，过一遍简历",
  "open-ended project work, the one allowed rabbit hole": "开放式项目开发，唯一允许的兔子洞",
  "check pace, redo every failed problem, set next week's patterns": "检查进度，重做所有失败的题，定好下周的题型",
  "Spaced redo": "间隔重做",
  "1, 3, 7 days later": "1、3、7 天后",
  "Every new problem comes back three times. Block 3 is only these redos. If you can't rewrite it cleanly on day 7, it goes back into the queue.":
    "每道新题都会回来三次。第 3 段只做这些重做。如果第 7 天还不能干净地重写，就放回队列。",
  "Stuck rule": "卡住规则",
  "15 minutes, then a hint": "卡 15 分钟再看提示",
  "Stuck for 15 minutes: take one hint. Stuck for 30: read the solution, close it, and rewrite it tomorrow. Log it as a redo, not as new.":
    "卡住 15 分钟：看一个提示。卡住 30 分钟：读题解，关掉，明天重写。记为重做，不算新题。",
  "Bad-energy day": "状态差的日子",
  "Minimum viable day": "最低可行日",
  "2 new problems, 1 redo, and log it. The streak survives and tomorrow starts clean.":
    "2 道新题，1 道重做，然后记录。连续记录不断，明天重新开始。",

  // ---- chart reading ----
  "Each system read on its own terms first, then compared. Covers personality, career, money, relationships and the long arc, compressed. Each claim names its source in the chart.":
    "每个体系先按自身逻辑解读，再做对比。浓缩覆盖性格、事业、财运、感情和人生长线。每个结论都标出它在盘中的出处。",
  "BaZi 八字 · Day Master 丁 fire": "八字 · 日主丁火",
  "An expressive critic who earns through output": "善于表达的批判者，靠产出赚钱",
  "Zi Wei 紫微斗数 · Life palace 酉": "紫微斗数 · 命宫在酉",
  "A steady, trusted operator who rises through learning": "稳重可靠的执行者，靠学习上升",
  "Western · Virgo rising, night chart": "西洋占星 · 处女座上升，夜间盘",
  "A precise doer with an investigative, restless mind": "精确的实干者，头脑爱钻研又静不下来",
  "BaZi plate": "八字命盘",
  "Favorable element (用)": "喜用五行（用）",
  "Unfavorable (忌)": "忌神（忌）",
  "Zi Wei palaces": "紫微斗数十二宫",
  "Life palace + its three supports (三方四正)": "命宫及其三方四正",
  "Active now": "当前激活",
  "birth-year transformations": "生年四化",
  "Natal wheel": "本命盘",
  "Hard aspect (square, opposition)": "硬相位（刑、冲）",
  "Soft aspect (trine, sextile)": "柔相位（三分、六合）",
  "Tropical, Placidus, Virgo rising on the left. Line weight follows orb: tighter aspects draw stronger. Hover a planet or line for its position or orb. Note the tight Moon–Mercury–Pluto axis crossing the Midheaven.":
    "回归黄道，Placidus 分宫制，处女座上升点在左侧。线条粗细跟随容许度：相位越紧，线越粗。悬停在行星或连线上可查看位置或容许度。注意月亮–水星–冥王星这条紧密轴线穿过天顶 MC。",
  "Where all three agree": "三者一致之处",
  "Conclusion": "结论",
  "Where they disagree": "分歧之处",
  "Topic": "主题",
  "The split": "分歧",
  "Why they differ": "为什么不同",
  "My call": "我的判断",
  "Gaps in the data": "数据缺口",
  "The request names five systems, but only three charts were supplied. No Vedic or 七政四余 data, so neither system is read here.":
    "请求里点名了五个体系，但只提供了三张盘。没有吠陀占星或七政四余的数据，所以这两个体系这里不解读。",
  "Moon conjunct Midheaven (orb 0°01′) and the house cusps depend on the exact birth minute. A few minutes' error moves them. The BaZi hour (丑) and the Zi Wei hour hold either way.":
    "月亮合天顶 MC（容许度 0°01′）和各宫宫头取决于精确的出生分钟，几分钟的误差就会让它们移动。八字时辰（丑）和紫微斗数的时辰则不受影响。",
  "Relationship timing would need more than these charts show. It is left out here on purpose. This page is about the job.":
    "感情时机需要比这几张盘更多的信息，这里有意不谈。这一页只关于工作。",

  // ---- toolkit ----
  "Operating rules": "行动守则",
  "Your projects become interview stories": "把你的项目变成面试故事",
  "Repo": "仓库",
  "Story angle": "故事角度",
  "Upgrade before interviews": "面试前要做的升级",
  "RAG over EPUB/PDF with Claude. Your flagship AI-engineer story.": "用 Claude 对 EPUB/PDF 做 RAG。你的 AI 工程师主打故事。",
  "Add a 30-question eval set, then measure retrieval hit rate before and after a chunking change.":
    "加一个 30 题评测集，然后测量修改分块策略前后的检索命中率。",
  "A screen-aware, local-first agent that works with any model. Covers tool use, privacy and how a skill system is designed.":
    "能感知屏幕、本地优先、可接任意模型的 agent。涵盖工具调用、隐私，以及 skill 系统怎么设计。",
  'Write a one-page architecture doc. Be ready for "why local-first, and what did it cost you".':
    "写一页架构文档。准备好回答“为什么本地优先，代价是什么”。",
  "A Python backend with LLM structured output. The bridge between SWE and AI work.":
    "带 LLM 结构化输出的 Python 后端。连接 SWE 和 AI 工作的桥梁。",
  "Add pytest tests, schema validation, a retry and timeout policy, and a latency note.":
    "加上 pytest 测试、schema 校验、重试和超时策略，以及一份延迟说明。",
  "Classic ML/CV: data, labels, metrics.": "经典 ML/CV：数据、标注、指标。",
  "Know the precision/recall tradeoff for this use case, and explain why.": "清楚这个场景下 precision/recall 的取舍，并能讲出原因。",
  "You built a tool for your own learning problem. A good behavioral story.": "你为自己的学习问题做了一个工具。很好的行为面试故事。",
  "Use it daily, so the story is true.": "每天都用它，让这个故事成真。",
  "From your stars, the short list": "从你的 GitHub star 里精选的短名单",
  'The main problem lists. labuladong for the "why" when a pattern won\'t click.':
    "主力题单。某个题型想不通时，用 labuladong 理解“为什么”。",
  "Behavioral prep, resume and negotiation chapters. Skip the parts you already cover.":
    "行为面试准备、简历和薪资谈判章节。已经覆盖的部分跳过。",
  "Chapters on tokens, embeddings, attention, context. Read for interview answers, not to train models.":
    "讲 token、embedding、注意力、上下文的章节。为面试答案而读，不是为了训练模型。",
  "Build a nano agent loop. Pairs with hello-agents and microsoft/ai-agents-for-beginners for theory.":
    "动手写一个迷你 agent 循环。理论部分搭配 hello-agents 和 microsoft/ai-agents-for-beginners。",
  "Evals and reliability. Gives you something most junior candidates can't talk about.":
    "评测与可靠性。给你一个大多数 junior 候选人讲不出来的话题。",
  "Junior level only: caching, queues, a URL shortener, a rate limiter. CS-Notes for OS and networking gaps.":
    "只看 junior 级别：缓存、队列、短链接、限流器。操作系统和网络的缺口用 CS-Notes 补。",
  "Parked on purpose: kunal-kushwaha/DSA-Bootcamp-Java and trekhleb/javascript-algorithms. You interview in Python, and you already have enough lists.":
    "有意搁置：kunal-kushwaha/DSA-Bootcamp-Java 和 trekhleb/javascript-algorithms。你用 Python 面试，题单也已经够多了。",

  // Research (RA) track
  "writing sample first, then professor emails": "先写写作样本，再给教授发邮件",
  "paper reading or project work for the writing sample, the one allowed rabbit hole": "为写作样本读论文或做项目，每周唯一允许的深挖时间",
};
