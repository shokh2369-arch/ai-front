// ═══ start.ai — demo fixture ═══
// An offline stand-in for the Go API, used only when config.js sets

// demoMode. It is a UI fixture and never a fallback for a failed live call.
// It answers with the same response shape as the real backend.

// The fixture fails the way the real API fails: a code, not a sentence.
function demoErr(code) {
  const e = new Error(code);
  e.code = code;
  return e;
}

const DEMO_DB = {
  plans: {},
  calendars: {},
  session: { userId: "demo-user", sessionId: "demo-session" },
  intake: null,
};

function inferSkill(msg) {
  const m = lower(msg);
  if (m.includes("ielts")) return "IELTS 7.0";
  if (m.includes("guitar") || m.includes("gitara")) return "Guitar";
  if (m.includes("data") || m.includes("analit")) return "Data analytics";
  if (m.includes("gamer") || m.includes("geymer")) return "Gaming";
  return msg || "New skill";
}
function intakeText(kind) {
  const dict = {
    en: {
      askWhich: "Which one do you mean?",
      askLevel: "Great goal. What is your current level?",
      askBudget: "What can you spend on gear, tools and materials?",
      askTime: "How much time can you invest per day?",
      askDeadline: "By when do you want this done?",
      done: "Got it. I adapted a real-world roadmap to your level, budget, daily time and deadline.",
      recap: "Here's what I'll plan for: {goal}. Level: {level}. Budget: {budget}. {min} min a day for {months} months. Shall I build it?",
      free: "free only",
      confirm: ["Build my plan", "Change something"],
      level: ["Beginner", "Intermediate", "Advanced"],
      budget: ["Free only", "Up to $100", "Up to $500"],
      time: ["30 min/day", "60 min/day", "90 min/day"],
      deadline: ["2 months", "3 months", "6 months"],
    },
    ru: {
      askWhich: "Что именно вы имеете в виду?",
      askLevel: "Отличная цель. Какой у вас текущий уровень?",
      askBudget: "Сколько готовы потратить на материалы и снаряжение?",
      askTime: "Сколько времени в день вы готовы уделять?",
      askDeadline: "К какому сроку хотите прийти к цели?",
      done: "Принято. Я адаптировал реальный учебный план под ваш уровень, бюджет, время и срок.",
      recap: "Вот что я учту: {goal}. Уровень: {level}. Бюджет: {budget}. {min} мин в день, {months} мес. Составить план?",
      free: "только бесплатно",
      confirm: ["Составить план", "Изменить ответы"],
      level: ["Начальный", "Средний", "Продвинутый"],
      budget: ["Только бесплатно", "До $100", "До $500"],
      time: ["30 мин/день", "60 мин/день", "90 мин/день"],
      deadline: ["2 месяца", "3 месяца", "6 месяцев"],
    },
    uz: {
      askWhich: "Aniqrog'i, qaysi birini nazarda tutyapsiz?",
      askLevel: "Zo'r maqsad. Hozirgi darajangiz qanday?",
      askBudget: "Jihoz va materiallarga qancha sarflay olasiz?",
      askTime: "Kuniga qancha vaqt ajrata olasiz?",
      askDeadline: "Qaysi muddatgacha ulgurmoqchisiz?",
      done: "Qabul qilindi. Haqiqiy yo'l xaritasini daraja, byudjet, vaqt va muddatingizga mosladim.",
      recap: "Men quyidagilarni hisobga olaman: {goal}. Daraja: {level}. Byudjet: {budget}. Kuniga {min} daqiqa, {months} oy. Reja tuzaymi?",
      free: "faqat bepul",
      confirm: ["Reja tuzish", "Javoblarni o'zgartirish"],
      level: ["Boshlang'ich", "O'rta", "Yuqori"],
      budget: ["Faqat bepul", "$100 gacha", "$500 gacha"],
      time: ["30 daqiqa/kun", "60 daqiqa/kun", "90 daqiqa/kun"],
      deadline: ["2 oy", "3 oy", "6 oy"],
    },
  };
  const d = dict[LANG] || dict.en;
  if (kind === "level") return d.level;
  if (kind === "budget") return d.budget;
  if (kind === "time") return d.time;
  if (kind === "deadline") return d.deadline;
  return d;
}
// The demo's own interview metadata, mirroring what the backend reports.
const DEMO_INTAKE_MAX = 4;

// A short list of goals that genuinely mean two different things, so demo mode
// exercises the disambiguation stage rather than pretending it never happens.
const DEMO_AMBIGUOUS = {
  design: ["Graphic design", "UX design"],
  programming: ["Web development", "Data analytics"],
  coding: ["Web development", "Data analytics"],
  dizayn: ["Grafik dizayn", "UX dizayn"],
  дизайн: ["Графический дизайн", "UX-дизайн"],
};
function ambiguousOptions(msg) {
  const m = lower(msg).replace(/[^\p{L}\s]/gu, " ").trim();
  const words = m.split(/\s+/);
  // Only a bare ambiguous term is ambiguous; "learn UX design" already says which.
  if (words.length > 2) return null;
  for (const key of Object.keys(DEMO_AMBIGUOUS)) {
    if (words.includes(key)) return DEMO_AMBIGUOUS[key];
  }
  return null;
}
// Adaptive intake: anything the goal already states is not asked about again.
function presetFromGoal(msg) {
  const m = lower(msg);
  const pre = {};
  if (/\bbeginner|нович|boshlang/.test(m)) pre.level = "beginner";
  else if (/\badvanced|продвин|yuqori/.test(m)) pre.level = "advanced";
  if (/\bfree\b|бесплат|bepul/.test(m)) pre.budget = 0;
  return pre;
}

function parseLevel(msg) {
  const m = lower(msg);
  if (m.includes("begin") || m.includes("boshl") || m.includes("нач")) return "beginner";
  if (m.includes("inter") || m.includes("o'rta") || m.includes("сред")) return "intermediate";
  if (m.includes("adv") || m.includes("yuqori") || m.includes("прод")) return "advanced";
  return "beginner";
}
// Accepts the offered options and anything typed freehand ("$250", "nothing").
function parseBudget(msg) {
  const m = lower(msg);
  if (/free|бесплат|bepul|none|нет|yo'q/.test(m)) return 0;
  const found = (m.match(/\d+/g) || []).map(Number);
  return found.length ? Math.max(...found) : 0;
}
function parseDailyMinutes(msg) {
  const m = lower(msg);
  if (m.includes("90")) return 90;
  if (m.includes("60")) return 60;
  return 30;
}
function parseMonths(msg) {
  const m = lower(msg);
  if (m.includes("6")) return 6;
  if (m.includes("3")) return 3;
  return 2;
}
function skillKey(skill) {
  if (skill === "IELTS 7.0") return "ielts";
  if (skill === "Guitar") return "guitar";
  if (skill === "Data analytics") return "data";
  if (skill === "Gaming") return "gaming";
  return "generic";
}

// Real-world roadmaps adapted from public study plans (IELTS, guitar, analytics, FPS training).
function skillBlueprint(skill, level, dailyMin, months) {
  const weeksTotal = Math.max(8, months * 4);
  const w1 = Math.max(2, Math.floor(weeksTotal * 0.25));
  const w2 = Math.max(w1 + 2, Math.floor(weeksTotal * 0.65));
  const vocab = {
    ielts: {
      path: "Academic IELTS Band 7 track",
      assessment: level === "beginner"
        ? "From beginner English, Band 7 needs language building first, then exam strategy — not mock tests on day one."
        : level === "intermediate"
          ? "You already have usable English; this plan shifts early into IELTS formats and weak-skill drills."
          : "Advanced base: accelerate into timed mocks, writing feedback loops, and speaking fluency polish.",
      feasibility: months < 3 && level === "beginner"
        ? "Band 7 in under 3 months from beginner is aggressive; expect foundation + strategy compression."
        : "Typical Band 7 paths use ~200–300 focused hours across Listening, Reading, Writing, Speaking.",
      phases: [
        { key: "foundation", title: "General English foundation", weekStart: 1, weekEnd: w1, summary: "Grammar (tenses, articles, complex sentences), academic vocabulary, and daily speaking/listening input." },
        { key: "practice", title: "IELTS skill development", weekStart: w1 + 1, weekEnd: w2, summary: "Learn all question types; drill Reading skimming/scanning, Writing Task 1/2 structure, Speaking Parts 1–3." },
        { key: "performance", title: "Mock exams & polish", weekStart: w2 + 1, weekEnd: weeksTotal, summary: "Full timed mocks, error logs, weakest-module overtime, and exam-day stamina." },
      ],
      milestones: [
        { phase: "foundation", title: "Diagnostic mock + baseline band" },
        { phase: "practice", title: "First section targets (L/R ≈ 6.5 practice)" },
        { phase: "performance", title: "Full mock under exam conditions" },
      ],
      todos: [
        { title: "Vocabulary + grammar block", priority: "high", durationMin: Math.min(dailyMin, 25), frequency: "daily", phase: "foundation" },
        { title: "Listening or Reading timed drill", priority: "high", durationMin: Math.max(20, Math.floor(dailyMin * 0.5)), frequency: "daily", phase: "practice" },
        { title: "Writing Task 1 or Task 2", priority: "high", durationMin: 40, frequency: "twice_weekly", phase: "practice" },
        { title: "Speaking practice (record + review)", priority: "medium", durationMin: 15, frequency: "daily", phase: "foundation" },
        { title: "Full IELTS mock + error analysis", priority: "high", durationMin: 180, frequency: "weekly", phase: "performance" },
      ],
      setup: [
        { name: "Cambridge IELTS practice books / free mocks", priceRange: "$0-40", category: "practice", rationale: "Official-style papers for timed Listening/Reading/Writing." },
        { name: "Anki or Quizlet (academic word lists)", priceRange: "$0", category: "vocab", rationale: "Daily spaced-repetition vocabulary for Band 7 writing/speaking." },
        { name: "Voice recorder (phone)", priceRange: "$0", category: "speaking", rationale: "Self-review fluency, pronunciation, and Part 2 timing." },
      ],
    },
    guitar: {
      path: "Open chords → songs track",
      assessment: level === "beginner"
        ? "Beginner path: posture, open chords (Em, Am, G, C, D), slow transitions, then first full songs."
        : level === "intermediate"
          ? "Intermediate path: faster changes, barre chords, metronome rhythm, and 3–4 performance-ready songs."
          : "Advanced path: barre fluency, riffs/power chords, dynamics, and clean recorded takes.",
      feasibility: "Short daily practice (20–40+ min) beats long rare sessions; first recognizable songs usually land in 4–12 weeks.",
      phases: [
        { key: "foundation", title: "Setup & open chords", weekStart: 1, weekEnd: w1, summary: "Hold/tune, fretting, open chords Em/Am/G/C/D, and pain-free short sessions." },
        { key: "practice", title: "Transitions & strumming", weekStart: w1 + 1, weekEnd: w2, summary: "Slow chord changes, basic strum patterns with a metronome, 2–3 chord songs." },
        { key: "performance", title: "Songs & confidence", weekStart: w2 + 1, weekEnd: weeksTotal, summary: "Full songs start-to-finish, speed up changes, optional barre/riffs, record yourself." },
      ],
      milestones: [
        { phase: "foundation", title: "Clean Em + Am + one 2-chord loop" },
        { phase: "practice", title: "Play a 3-chord song with steady strum" },
        { phase: "performance", title: "Perform/record one full song" },
      ],
      todos: [
        { title: "Warm-up fretting / finger drills", priority: "medium", durationMin: 5, frequency: "daily", phase: "foundation" },
        { title: "Open chord practice (clean frets)", priority: "high", durationMin: Math.max(10, Math.floor(dailyMin * 0.4)), frequency: "daily", phase: "foundation" },
        { title: "Chord transition drills (metronome)", priority: "high", durationMin: Math.max(10, Math.floor(dailyMin * 0.35)), frequency: "daily", phase: "practice" },
        { title: "Strumming pattern + song practice", priority: "high", durationMin: Math.max(10, Math.floor(dailyMin * 0.35)), frequency: "daily", phase: "practice" },
        { title: "Record one song take & review", priority: "medium", durationMin: 30, frequency: "weekly", phase: "performance" },
      ],
      setup: [
        { name: "Acoustic or electric starter guitar", priceRange: "$50-200", category: "instrument", rationale: "Playable action matters more than brand for beginners." },
        { name: "Clip-on tuner + picks", priceRange: "$0-15", category: "gear", rationale: "In-tune practice builds ear and clean chords faster." },
        { name: "JustinGuitar / free YouTube beginner course", priceRange: "$0", category: "lessons", rationale: "Structured stages: chords → strumming → songs." },
      ],
    },
    data: {
      path: "Excel → SQL → Python/BI portfolio",
      assessment: level === "beginner"
        ? "Start with Excel/Sheets and stats, then SQL, then Python/Pandas or Power BI — projects last."
        : level === "intermediate"
          ? "Skip basics: deepen SQL joins/windows, Pandas EDA, and one BI dashboard project early."
          : "Advanced: portfolio polish — window functions, end-to-end pipelines, and interview-style cases.",
      feasibility: "Job-ready analytics roadmaps commonly use 8–12 weeks of daily practice plus 2–3 portfolio projects.",
      phases: [
        { key: "foundation", title: "Excel & analytics basics", weekStart: 1, weekEnd: w1, summary: "Pivot tables, VLOOKUP/XLOOKUP, charts, cleaning, and core stats (mean, distribution, correlation)." },
        { key: "practice", title: "SQL + Python/BI tools", weekStart: w1 + 1, weekEnd: w2, summary: "SELECT/JOINs/GROUP BY, then Pandas cleaning/viz or Power BI models and dashboards." },
        { key: "performance", title: "Portfolio & interview cases", weekStart: w2 + 1, weekEnd: weeksTotal, summary: "Ship 2–3 end-to-end projects on GitHub/LinkedIn; timed SQL drills and case write-ups." },
      ],
      milestones: [
        { phase: "foundation", title: "Sales dashboard in Excel/Sheets" },
        { phase: "practice", title: "Multi-table SQL analysis + first Python/BI report" },
        { phase: "performance", title: "3 portfolio projects published" },
      ],
      todos: [
        { title: "Excel/Sheets drills (pivots, lookups)", priority: "high", durationMin: Math.min(dailyMin, 40), frequency: "daily", phase: "foundation" },
        { title: "SQL practice set (JOINs, aggregates)", priority: "high", durationMin: Math.max(25, Math.floor(dailyMin * 0.6)), frequency: "daily", phase: "practice" },
        { title: "Python Pandas / Power BI lab", priority: "high", durationMin: Math.max(30, Math.floor(dailyMin * 0.7)), frequency: "thrice_weekly", phase: "practice" },
        { title: "Portfolio project work block", priority: "high", durationMin: Math.max(45, dailyMin), frequency: "twice_weekly", phase: "performance" },
        { title: "SQL interview questions review", priority: "medium", durationMin: 30, frequency: "weekly", phase: "performance" },
      ],
      setup: [
        { name: "Google Sheets or Excel", priceRange: "$0-10", category: "tools", rationale: "Fastest path to business-style analysis and dashboards." },
        { name: "SQLite / Mode / free SQL playground", priceRange: "$0", category: "sql", rationale: "Practice JOINs and aggregates on real-ish tables." },
        { name: "Kaggle datasets + GitHub", priceRange: "$0", category: "portfolio", rationale: "Public datasets and a repo to showcase end-to-end work." },
      ],
    },
    gaming: {
      path: "Aim + gamesense competitive track",
      assessment: level === "beginner"
        ? "Lock sensitivity, short aim warm-ups, crosshair placement, then deathmatch — not endless ranked grind."
        : level === "intermediate"
          ? "Structured aim blocks + VOD review of deaths; one focus mechanic per session."
          : "Advanced: tracking/flicks/micro-adjustments, map roles, and weekly VOD coaching loops.",
      feasibility: "15–20 min deliberate aim training daily plus focused in-game practice beats hours of unfocused ranked.",
      phases: [
        { key: "foundation", title: "Setup & fundamentals", weekStart: 1, weekEnd: w1, summary: "Lock DPI/sens for 30 days, ergonomics, crosshair at head height, basic movement/counter-strafe." },
        { key: "practice", title: "Aim drills + applied DM", weekStart: w1 + 1, weekEnd: w2, summary: "Aimlabs/KovaaK warm-up (tracking/flicks), range routines, then deathmatch applying one focus skill." },
        { key: "performance", title: "Ranked + VOD review", weekStart: w2 + 1, weekEnd: weeksTotal, summary: "Ranked with one focus per session; review deaths for positioning/decision mistakes weekly." },
      ],
      milestones: [
        { phase: "foundation", title: "Sens locked + 7-day warm-up streak" },
        { phase: "practice", title: "Measurable aim-trainer score uplift" },
        { phase: "performance", title: "VOD review habit + ranked focus sessions" },
      ],
      todos: [
        { title: "Aim trainer warm-up (same routine)", priority: "high", durationMin: Math.min(20, dailyMin), frequency: "daily", phase: "foundation" },
        { title: "Crosshair placement / range drill", priority: "high", durationMin: 15, frequency: "daily", phase: "practice" },
        { title: "Deathmatch — one focus mechanic", priority: "high", durationMin: Math.max(20, dailyMin - 20), frequency: "daily", phase: "practice" },
        { title: "Ranked session (deliberate focus)", priority: "medium", durationMin: Math.max(45, dailyMin), frequency: "thrice_weekly", phase: "performance" },
        { title: "VOD review 2–3 deaths", priority: "high", durationMin: 20, frequency: "weekly", phase: "performance" },
      ],
      setup: [
        { name: "Aimlabs (free) or KovaaK’s", priceRange: "$0-10", category: "training", rationale: "Repeatable aim scenarios to track accuracy over weeks." },
        { name: "Stable mouse + large pad", priceRange: "$20-60", category: "gear", rationale: "Consistent sens and space for controlled aim." },
        { name: "144Hz+ monitor (if possible)", priceRange: "$0-150", category: "display", rationale: "Clearer motion helps tracking; optional if already set up." },
      ],
    },
    generic: {
      path: "Custom skill track",
      assessment: `Custom plan for ${skill}: fundamentals → deliberate practice → measurable performance.`,
      feasibility: `Adapted to ${level} level, ${dailyMin} min/day, ~${months} month horizon.`,
      phases: [
        { key: "foundation", title: "Foundation", weekStart: 1, weekEnd: w1, summary: "Core concepts, tools setup, and a sustainable daily habit." },
        { key: "practice", title: "Deliberate practice", weekStart: w1 + 1, weekEnd: w2, summary: "Skill drills with feedback; increase difficulty weekly." },
        { key: "performance", title: "Performance outcomes", weekStart: w2 + 1, weekEnd: weeksTotal, summary: "Projects, mocks, or public practice that prove progress." },
      ],
      milestones: [
        { phase: "foundation", title: "Baseline skill check" },
        { phase: "practice", title: "Midpoint progress review" },
        { phase: "performance", title: "Final demonstration" },
      ],
      todos: [
        { title: `${dailyMin}-minute focused practice`, priority: "high", durationMin: dailyMin, frequency: "daily", phase: "foundation" },
        { title: "Weekly skill challenge", priority: "high", durationMin: 45, frequency: "weekly", phase: "practice" },
        { title: "Progress review & next-week plan", priority: "medium", durationMin: 20, frequency: "weekly", phase: "performance" },
      ],
      setup: [
        { name: "Notes app", priceRange: "$0", category: "workflow", rationale: "Log drills and weekly retrospectives." },
        { name: "Timer", priceRange: "$0", category: "focus", rationale: "Protect deep-work blocks." },
        { name: "One trusted course or book", priceRange: "$0-40", category: "content", rationale: "Avoid random tutorial hopping." },
      ],
    },
  };
  const bp = vocab[skillKey(skill)] || vocab.generic;
  return { weeksTotal, ...bp };
}

function planForMessage(message, profile = {}) {
  const skill = inferSkill(message);
  const planId = uid("plan");
  const base = isoToday();
  const level = profile.level || "beginner";
  const budget = profile.budget != null ? profile.budget : 100;
  const dailyMin = profile.dailyMin || 30;
  const months = profile.deadlineMonths || 3;
  const bp = skillBlueprint(skill, level, dailyMin, months);
  const weeksTotal = bp.weeksTotal;

  const phases = bp.phases;
  const milestones = bp.milestones.map((m, i) => ({
    ...m,
    targetDate: addDays(base, i === 0 ? 10 : (i === 1 ? Math.floor((weeksTotal * 7) / 2) : weeksTotal * 7 - 7)),
  }));
  const todos = bp.todos.map((td) => ({
    id: uid("todo"),
    title: td.title,
    priority: td.priority,
    durationMin: td.durationMin,
    frequency: td.frequency,
    phase: td.phase,
    status: "pending",
    plannedCount: 0,
    completedCount: 0,
  }));
  // Shop links are searches, never products; free items carry none.
  const shopSearch = (q) => [
    { provider: "uzum", label: "Uzum Market", kind: "search", url: "https://uzum.uz/ru/search?query=" + encodeURIComponent(q) },
    { provider: "yandex_market", label: "Yandex Market", kind: "search", url: "https://market.yandex.uz/search?text=" + encodeURIComponent(q) },
  ];
  const setupItems = bp.setup.map((s, i) => {
    const hi = Math.max(0, ...((String(s.priceRange || "").match(/\d+/g) || ["0"]).map(Number)));
    return { id: "kit" + i, owned: false, searchQuery: s.name, ...s, links: hi > 0 ? shopSearch(s.name) : [] };
  });
  // One resource kept as recommended, one swapped for a free stand-in when the budget is zero.
  const paid = setupItems.find((s) => s.links.length);
  const resources = setupItems.slice(0, 1).map((s) => ({
    id: "res0", need: s.category || "", kind: "material", recommended: s.name, selected: s.name,
    rejected: [], source: "blueprint", equivalent: true, note: "", links: s.links,
  }));
  if (paid && budget === 0) {
    resources.push({
      id: "res1", need: paid.category || "", kind: "material", recommended: paid.name,
      selected: "Free library / online edition", rejected: [], source: "budget", equivalent: false,
      note: "Covers most of it, but not everything the paid version does.", links: [],
    });
  }
  const feasibilityStatus = dailyMin <= 30 && months <= 2 ? "tight" : "feasible";

  const plan = {
    id: planId,
    skill,
    // `path` stays for backends that only speak the old shape; the header
    // reads the structured fields below and falls back to splitting it.
    path: `${bp.path} · ${level} · ${dailyMin}m/day`,
    track: bp.path,
    level,
    budget,
    dailyMin,
    months,
    timezone: browserTimezone(),
    assessment: bp.assessment,
    feasibility: bp.feasibility,
    phases,
    milestones,
    todos,
    setupItems,
    resources,
    feasibilityStatus,
    changeLog: [{ at: base, type: "created", summary: "Plan created from your answers." }],
    weeksTotal,
    startDate: null,
    finishDate: null,
    originalFinishDate: null,
  };
  DEMO_DB.plans[planId] = plan;
  DEMO_DB.calendars[planId] = [];
  return plan;
}
// Weekday offsets inside each plan week. A task that says "3× weekly" lands
// three times, every week, so the calendar matches what the plan promised.
const FREQ_OFFSETS = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  thrice_weekly: [0, 2, 4],
  twice_weekly: [1, 4],
  weekly: [2],
  once: [0],
};

// Pure: the schedule a plan implies, given a start date. Deterministic, so the
// same plan and start always rebuild byte-for-byte the same sessions.
function buildSchedule(plan, start) {
  const totalWeeks = plan.weeksTotal || 10;
  const todos = plan.todos || [];
  const events = [];

  // One fixed hour per task, so every week reads as the same routine.
  const hourFor = {};
  let evening = 18;
  let midday = 10;
  todos.forEach((td) => {
    hourFor[td.id] = td.frequency === "daily" ? Math.min(evening++, 21) : Math.min(midday++, 13);
  });

  // The whole span gets booked, not just the first week — the Week tab has to
  // reach every week the roadmap and the finish date talk about.
  todos.forEach((td) => {
    const offsets = FREQ_OFFSETS[td.frequency] || FREQ_OFFSETS.weekly;
    const weeks = td.frequency === "once" ? 1 : totalWeeks;
    for (let w = 0; w < weeks; w += 1) {
      offsets.forEach((off) => {
        events.push({
          id: uid("evt"),
          date: addDays(start, w * 7 + off),
          startTime: String(hourFor[td.id]).padStart(2, "0") + ":00",
          title: td.title,
          // Proposed until /api/schedule/confirm promotes it, like the server.
          status: "proposed",
          rolledOver: 0,
          durationMin: td.durationMin, priority: td.priority, todoId: td.id,
        });
      });
    }
  });
  events.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
  return events;
}

function scheduleForPlan(plan) {
  const start = addDays(isoToday(), 1);
  DEMO_DB.calendars[plan.id] = buildSchedule(plan, start);
  const evs = DEMO_DB.calendars[plan.id];
  plan.todos = (plan.todos || []).map((td) => ({
    ...td,
    plannedCount: evs.filter((e) => e.todoId === td.id).length,
    completedCount: evs.filter((e) => e.todoId === td.id && e.status === "done").length,
  }));
  plan.startDate = start;
  // The last booked day *is* the finish date: the plan spans what it schedules.
  plan.finishDate = addDays(start, (plan.weeksTotal || 10) * 7 - 1);
  if (!plan.originalFinishDate) plan.originalFinishDate = plan.finishDate;
  return { startDate: plan.startDate, finishDate: plan.finishDate };
}
function parseBody(opts) {
  if (!opts || !opts.body) return {};
  try { return JSON.parse(opts.body); } catch (_) { return {}; }
}
async function mockApi(path, opts = {}) {
  const body = parseBody(opts);

  if (path === "/api/session" && (opts.method || "GET") === "POST") {
    return {
      userId: DEMO_DB.session.userId,
      sessionId: DEMO_DB.session.sessionId,
      assistant: "Demo mode is on. Pick a suggested skill or type your own goal. I will ask about your condition before building the plan.",
      stage: "scope_check",
      timezone: browserTimezone(),
    };
  }

  if (path === "/api/chat" && (opts.method || "GET") === "POST") {
    const msg = String(body.message || "").trim();
    const st = DEMO_DB.intake;
    // The fixture speaks the same contract as the Go API: a named stage plus
    // {answered, max}. It is adaptive too — a goal that already names a level
    // skips that question, exactly as the backend would.
    const ask = (step, key, extra) => {
      DEMO_DB.intake.step = step;
      return Object.assign({
        assistant: intakeText()["ask" + key],
        options: intakeText(step),
        stage: "intake",
        progress: { answered: DEMO_DB.intake.answered, max: DEMO_INTAKE_MAX, adaptive: true },
      }, extra || {});
    };
    // Advance through any questions this goal has already answered.
    const next = () => {
      const i = DEMO_DB.intake;
      if (i.level == null) return ask("level", "Level");
      if (i.budget == null) return ask("budget", "Budget");
      if (i.dailyMin == null) return ask("time", "Time");
      if (i.months == null) return ask("deadline", "Deadline");
      if (!i.approved) {
        i.step = "confirm";
        const x = intakeText();
        return {
          assistant: x.recap.replace("{goal}", i.goal).replace("{level}", i.level)
            .replace("{budget}", i.budget ? "$" + i.budget : x.free).replace("{min}", i.dailyMin).replace("{months}", i.months),
          options: x.confirm,
          stage: "confirm_plan",
          progress: { answered: i.answered, max: DEMO_INTAKE_MAX, adaptive: true },
        };
      }
      const plan = planForMessage(i.goal, {
        level: i.level, budget: i.budget, dailyMin: i.dailyMin, deadlineMonths: i.months,
      });
      DEMO_DB.intake = null;
      return {
        assistant: `${intakeText().done} Open the Plan tab to review it.`,
        options: [],
        planId: plan.id,
        stage: "plan_ready",
        done: true,
      };
    };

    if (!st) {
      const choices = ambiguousOptions(msg);
      if (choices) {
        DEMO_DB.intake = { goal: msg, step: "disambiguation", answered: 0 };
        return {
          assistant: intakeText().askWhich,
          options: choices,
          stage: "disambiguation",
          progress: { answered: 0, max: DEMO_INTAKE_MAX, adaptive: true },
        };
      }
      DEMO_DB.intake = { goal: msg, answered: 0, ...presetFromGoal(msg) };
      return next();
    }
    if (st.step === "disambiguation") {
      st.goal = msg;
      Object.assign(st, presetFromGoal(msg));
      return next();
    }
    if (st.step === "confirm") {
      // "Change something" starts the questions over; anything else approves.
      if (msg === intakeText().confirm[1]) {
        Object.assign(st, { level: null, budget: null, dailyMin: null, months: null, answered: 0 });
      } else {
        st.approved = true;
      }
      return next();
    }
    if (st.step === "level") { st.level = parseLevel(msg); st.answered += 1; return next(); }
    if (st.step === "budget") { st.budget = parseBudget(msg); st.answered += 1; return next(); }
    if (st.step === "time") { st.dailyMin = parseDailyMinutes(msg); st.answered += 1; return next(); }
    st.months = parseMonths(msg);
    st.answered += 1;
    return next();
  }

  if (path.indexOf("/api/plan/") === 0 && (opts.method || "GET") === "GET") {
    const planId = path.split("/api/plan/")[1];
    const plan = DEMO_DB.plans[planId];
    if (!plan) throw demoErr("PLAN_NOT_FOUND");
    return JSON.parse(JSON.stringify(plan));
  }

  if (path === "/api/todo/complete" && (opts.method || "GET") === "POST") {
    const plan = DEMO_DB.plans[body.planId];
    if (!plan) throw demoErr("PLAN_NOT_FOUND");
    const cal = DEMO_DB.calendars[plan.id] || [];
    const mine = cal.filter((e) => e.todoId === body.todoId);
    if (!mine.length) throw demoErr("TODO_NOT_FOUND");
    // One session of the series, named by eventId when the caller knows it.
    const hit = (body.eventId && mine.find((e) => e.id === body.eventId && e.status !== "done"))
      || mine.find((e) => e.status !== "done");
    if (!hit) throw demoErr("EVENT_NOT_FOUND");
    hit.status = "done";
    const completedCount = mine.filter((e) => e.status === "done").length;
    const plannedCount = mine.length;
    const status = completedCount >= plannedCount ? "done" : "in_progress";
    plan.todos = (plan.todos || []).map((td) => (
      td.id === body.todoId ? { ...td, status, completedCount, plannedCount } : td));
    return { ok: true, todoId: body.todoId, status, completedCount, plannedCount, remaining: plannedCount - completedCount };
  }

  if (path === "/api/schedule" && (opts.method || "GET") === "POST") {
    const plan = DEMO_DB.plans[body.planId];
    if (!plan) throw demoErr("PLAN_NOT_FOUND");
    const r = scheduleForPlan(plan);
    const events = DEMO_DB.calendars[plan.id] || [];
    return {
      planId: plan.id, startDate: r.startDate, finishDate: r.finishDate,
      events, count: events.length,
      droppedSessions: 0, missesDeadline: false, deadlineSlipDays: 0, deadlineNote: "",
    };
  }

  if (path === "/api/schedule/confirm" && (opts.method || "GET") === "POST") {
    const plan = DEMO_DB.plans[body.planId];
    if (!plan) throw demoErr("PLAN_NOT_FOUND");
    const cal = DEMO_DB.calendars[plan.id] || [];
    cal.forEach((e) => { if (e.status === "proposed") e.status = "scheduled"; });
    return { planId: plan.id, confirmed: cal.length, total: cal.length, finishDate: plan.finishDate };
  }

  if (path.indexOf("/api/calendar") === 0 && (opts.method || "GET") === "GET") {
    const query = path.split("?")[1] || "";
    const qp = new URLSearchParams(query);
    const planId = qp.get("planId") || "";
    return DEMO_DB.calendars[planId] || [];
  }

  if (path === "/api/rollover" && (opts.method || "GET") === "POST") {
    const planIds = Object.keys(DEMO_DB.plans);
    if (!planIds.length) return { asOf: body.asOf, results: [] };
    const pid = planIds[0];
    const cal = DEMO_DB.calendars[pid] || [];
    const moved = cal.filter((ev) => ev.status === "scheduled").slice(0, 1);
    moved.forEach((ev) => {
      ev.status = "rolled_over";
      cal.push({ ...ev, date: addDays(ev.date, 1), status: "scheduled", movedFrom: ev.date });
    });
    const p = DEMO_DB.plans[pid];
    const oldFinish = p.finishDate;
    if (oldFinish) p.finishDate = addDays(oldFinish, moved.length ? 1 : 0);
    return {
      asOf: body.asOf,
      results: [{
        planId: pid, moved: moved.length, finishShiftDays: moved.length ? 1 : 0, oldFinish, newFinish: p.finishDate,
        missesDeadline: false, message: moved.length ? "1 missed session moved to the next free day." : "",
      }],
    };
  }

  if (path === "/api/meter" && (opts.method || "GET") === "GET") {
    return { enabled: false, callsTotal: 0, costUsd: 0 };
  }

  throw new Error("Demo endpoint not implemented: " + path);
}
