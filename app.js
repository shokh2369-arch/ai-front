// ═══ start.ai web client ═══════════════════════════════════════════════
const API = (window.START_AI_CONFIG && window.START_AI_CONFIG.apiBase) || "https://backend-0v74.onrender.com";
const DEMO_MODE = !!(window.START_AI_CONFIG && window.START_AI_CONFIG.demoMode);

const state = { userId: null, sessionId: null, planId: null, plan: null, started: false };

// ── i18n ───────────────────────────────────────────────────────────────
let LANG = localStorage.getItem("startai_lang") || "en";

const I18N = {
  en: {
    tab_plan: "Plan", tab_calendar: "Calendar", tab_setup: "Setup",
    composer: "What do you want to learn?",
    plan_empty_h: "Your plan takes shape here",
    plan_empty_p: "Tell start.ai what you want to learn and answer a few questions. A scheduled roadmap appears — phase by phase, with a finish date it keeps honest.",
    cal_empty_h: "Nothing scheduled yet",
    cal_empty_p: "Open your plan and choose Schedule it to place each task on a real date.",
    setup_empty_h: "Setup guidance arrives with your plan",
    setup_empty_p: "You'll see what to get — ordered by impact for your budget, with a free path first.",
    btn_schedule: "Schedule it", btn_confirm: "Confirm week", btn_export: "Export .ics",
    btn_missed: "Simulate a missed day", demo: "demo",
    your_plan: "Your plan", roadmap: "Roadmap", tasks: "Tasks", target_finish: "Target finish",
    finish_set: "set when you schedule", weeks_approx: "~{n} weeks",
    moved_from: "moved from {d}", originally: "originally {d}",
    meter_connecting: "connecting…", meter_mock: "mock mode · $0", meter_live: "live · {n} calls · ${c}",
    rollover_asof: "As of {date} —", rolled_fwd: "{n} session(s) rolled forward.",
    finish_moved: "Finish moved {old} → {new} (+{d} days).",
    nothing_roll: "nothing to roll forward. You're on track.",
    err_backend: "Can't reach the backend ({e}). Start it, then reload this page.",
    err_generic: "Something went wrong: {e}. Try again.",
    starters: ["IELTS 7.0 by October", "Learn guitar", "Get into data analytics", "I want to be a gamer"],
    min: "min",
    freq: { once: "once", weekly: "weekly", twice_weekly: "twice weekly", thrice_weekly: "3× weekly", daily: "daily" },
    status: { proposed: "proposed", scheduled: "scheduled", done: "done", rolled_over: "rolled" },
    prio: { high: "high", medium: "medium", low: "low" },
  },
  ru: {
    tab_plan: "План", tab_calendar: "Календарь", tab_setup: "Набор",
    composer: "Что вы хотите освоить?",
    plan_empty_h: "Здесь появится ваш план",
    plan_empty_p: "Скажите start.ai, что хотите освоить, и ответьте на пару вопросов. Появится план с расписанием — этап за этапом, с честной датой финиша.",
    cal_empty_h: "Пока ничего не запланировано",
    cal_empty_p: "Откройте план и нажмите «Запланировать», чтобы разложить задачи по датам.",
    setup_empty_h: "Рекомендации по набору появятся вместе с планом",
    setup_empty_p: "Вы увидите, что взять — по влиянию на результат в рамках бюджета, начиная с бесплатного варианта.",
    btn_schedule: "Запланировать", btn_confirm: "Подтвердить неделю", btn_export: "Экспорт .ics",
    btn_missed: "Смоделировать пропуск", demo: "демо",
    your_plan: "Ваш план", roadmap: "Дорожная карта", tasks: "Задачи", target_finish: "Целевой финиш",
    finish_set: "появится при планировании", weeks_approx: "~{n} нед.",
    moved_from: "сдвинуто с {d}", originally: "изначально {d}",
    meter_connecting: "подключение…", meter_mock: "демо-режим · $0", meter_live: "онлайн · {n} запр. · ${c}",
    rollover_asof: "На {date} —", rolled_fwd: "перенесено занятий: {n}.",
    finish_moved: "Финиш сдвинут {old} → {new} (+{d} дн.).",
    nothing_roll: "переносить нечего. Вы идёте по плану.",
    err_backend: "Не удаётся связаться с сервером ({e}). Запустите его и перезагрузите страницу.",
    err_generic: "Что-то пошло не так: {e}. Попробуйте снова.",
    starters: ["IELTS 7.0 к октябрю", "Научиться играть на гитаре", "Освоить аналитику данных", "Хочу стать геймером"],
    min: "мин",
    freq: { once: "разово", weekly: "еженедельно", twice_weekly: "2×/неделю", thrice_weekly: "3×/неделю", daily: "ежедневно" },
    status: { proposed: "предложено", scheduled: "в плане", done: "готово", rolled_over: "перенесено" },
    prio: { high: "важно", medium: "средне", low: "низко" },
  },
  uz: {
    tab_plan: "Reja", tab_calendar: "Kalendar", tab_setup: "Jihoz",
    composer: "Nimani o'rganmoqchisiz?",
    plan_empty_h: "Rejangiz shu yerda shakllanadi",
    plan_empty_p: "start.ai ga nimani o'rganmoqchi ekaningizni ayting va bir necha savolga javob bering. Jadvalli yo'l xaritasi paydo bo'ladi — bosqichma-bosqich, halol tugash sanasi bilan.",
    cal_empty_h: "Hali hech narsa rejalashtirilmagan",
    cal_empty_p: "Rejangizni oching va har bir vazifani real sanaga qo'yish uchun «Rejaga qo'yish» ni tanlang.",
    setup_empty_h: "Jihoz bo'yicha tavsiyalar reja bilan keladi",
    setup_empty_p: "Nima olish kerakligini ko'rasiz — byudjetingizga ta'siri bo'yicha, avval bepul yo'l bilan.",
    btn_schedule: "Rejaga qo'yish", btn_confirm: "Haftani tasdiqlash", btn_export: ".ics eksport",
    btn_missed: "O'tkazilgan kunni sinash", demo: "demo",
    your_plan: "Sizning rejangiz", roadmap: "Yo'l xaritasi", tasks: "Vazifalar", target_finish: "Maqsadli tugash",
    finish_set: "rejalashtirilganda belgilanadi", weeks_approx: "~{n} hafta",
    moved_from: "{d} dan surildi", originally: "dastlab {d}",
    meter_connecting: "ulanmoqda…", meter_mock: "demo rejim · $0", meter_live: "jonli · {n} so'rov · ${c}",
    rollover_asof: "{date} holatida —", rolled_fwd: "{n} ta mashg'ulot keyinga surildi.",
    finish_moved: "Tugash {old} → {new} (+{d} kun) ga o'zgardi.",
    nothing_roll: "surish uchun hech narsa yo'q. Rejadasiz.",
    err_backend: "Backend bilan bog'lanib bo'lmadi ({e}). Uni ishga tushiring va sahifani yangilang.",
    err_generic: "Xatolik yuz berdi: {e}. Qayta urinib ko'ring.",
    starters: ["Oktyabrga IELTS 7.0", "Gitara o'rganish", "Data tahlilini o'rganish", "Geymer bo'lmoqchiman"],
    min: "daq",
    freq: { once: "bir marta", weekly: "haftada", twice_weekly: "haftada 2×", thrice_weekly: "haftada 3×", daily: "har kuni" },
    status: { proposed: "taklif", scheduled: "rejada", done: "bajarildi", rolled_over: "surildi" },
    prio: { high: "yuqori", medium: "o'rta", low: "past" },
  },
};

function t(key) {
  const d = I18N[LANG] || I18N.en;
  return d[key] != null ? d[key] : (I18N.en[key] != null ? I18N.en[key] : key);
}
function tg(group, code) {
  const g = (I18N[LANG] || I18N.en)[group] || {};
  return g[code] != null ? g[code] : ((I18N.en[group] || {})[code] || code);
}
function fmt(tpl, map) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (map[k] != null ? map[k] : ""));
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.documentElement.lang = LANG;
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem("startai_lang", lang);
  document.querySelectorAll("#langSwitch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  applyI18n();
  if (!state.started) setChips(t("starters"));
  refreshMeter();
  if (state.plan) {
    renderPlan(state.plan);
    renderSetup(state.plan.setupItems || []);
    loadCalendar();
  }
}

// ── theme ──
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("startai_theme", next);
}

// ── DOM helpers ──
const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CHECK_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const WARN_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';

const DEMO_DB = {
  plans: {},
  calendars: {},
  session: { userId: "demo-user", sessionId: "demo-session" },
  intake: null,
};

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10);
}
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function lower(s) {
  return String(s || "").toLowerCase();
}
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
      askLevel: "Great goal. What is your current level?",
      askTime: "How much time can you invest per day?",
      askDeadline: "Choose your target timeline:",
      done: "Perfect. I adapted a real-world study roadmap to your level, daily time, and deadline.",
      level: ["Beginner", "Intermediate", "Advanced"],
      time: ["30 min/day", "60 min/day", "90 min/day"],
      deadline: ["2 months", "3 months", "6 months"],
    },
    ru: {
      askLevel: "Отличная цель. Какой у вас текущий уровень?",
      askTime: "Сколько времени в день вы готовы уделять?",
      askDeadline: "Выберите желаемый срок:",
      done: "Отлично. Я адаптировал реальный учебный план под ваш уровень, время и срок.",
      level: ["Начальный", "Средний", "Продвинутый"],
      time: ["30 мин/день", "60 мин/день", "90 мин/день"],
      deadline: ["2 месяца", "3 месяца", "6 месяцев"],
    },
    uz: {
      askLevel: "Zo'r maqsad. Hozirgi darajangiz qanday?",
      askTime: "Kuniga qancha vaqt ajrata olasiz?",
      askDeadline: "Maqsad muddatini tanlang:",
      done: "Ajoyib. Haqiqiy o'quv yo'l xaritasini daraja, vaqt va muddatingizga mosladim.",
      level: ["Boshlang'ich", "O'rta", "Yuqori"],
      time: ["30 daqiqa/kun", "60 daqiqa/kun", "90 daqiqa/kun"],
      deadline: ["2 oy", "3 oy", "6 oy"],
    },
  };
  const d = dict[LANG] || dict.en;
  if (kind === "level") return d.level;
  if (kind === "time") return d.time;
  if (kind === "deadline") return d.deadline;
  return d;
}
function parseLevel(msg) {
  const m = lower(msg);
  if (m.includes("begin") || m.includes("boshl") || m.includes("нач")) return "beginner";
  if (m.includes("inter") || m.includes("o'rta") || m.includes("сред")) return "intermediate";
  if (m.includes("adv") || m.includes("yuqori") || m.includes("прод")) return "advanced";
  return "beginner";
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
    status: "proposed",
  }));
  const setupItems = bp.setup;

  const plan = {
    id: planId,
    skill,
    path: `${bp.path} · ${level} · ${dailyMin}m/day`,
    assessment: bp.assessment,
    feasibility: bp.feasibility,
    phases,
    milestones,
    todos,
    setupItems,
    weeksTotal,
    startDate: null,
    finishDate: null,
    originalFinishDate: null,
  };
  DEMO_DB.plans[planId] = plan;
  DEMO_DB.calendars[planId] = [];
  return plan;
}
function scheduleForPlan(plan) {
  const start = addDays(isoToday(), 1);
  const totalWeeks = plan.weeksTotal || 10;
  const todos = plan.todos || [];
  const events = [];
  const daily = todos.filter((td) => td.frequency === "daily");
  const weekly = todos.filter((td) => td.frequency === "weekly" || td.frequency === "twice_weekly" || td.frequency === "thrice_weekly");

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    daily.forEach((td, idx) => {
      const hour = 18 + idx;
      events.push({
        date: day,
        startTime: String(Math.min(hour, 21)).padStart(2, "0") + ":00",
        title: td.title,
        status: i < 1 && idx === 0 ? "done" : "scheduled",
      });
    });
  }
  weekly.forEach((td, idx) => {
    events.push({
      date: addDays(start, Math.min(6, 1 + idx * 2)),
      startTime: "10:00",
      title: td.title,
      status: "scheduled",
    });
  });
  if (!events.length && todos.length) {
    events.push({ date: start, startTime: "19:00", title: todos[0].title, status: "scheduled" });
  }

  DEMO_DB.calendars[plan.id] = events;
  plan.startDate = start;
  plan.finishDate = addDays(start, totalWeeks * 7);
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
    };
  }

  if (path === "/api/chat" && (opts.method || "GET") === "POST") {
    const msg = String(body.message || "").trim();
    if (!DEMO_DB.intake) {
      DEMO_DB.intake = { goal: msg, step: "level" };
      return {
        assistant: intakeText().askLevel,
        options: intakeText("level"),
        stage: "intake_level",
      };
    }
    if (DEMO_DB.intake.step === "level") {
      DEMO_DB.intake.level = parseLevel(msg);
      DEMO_DB.intake.step = "time";
      return {
        assistant: intakeText().askTime,
        options: intakeText("time"),
        stage: "intake_time",
      };
    }
    if (DEMO_DB.intake.step === "time") {
      DEMO_DB.intake.dailyMin = parseDailyMinutes(msg);
      DEMO_DB.intake.step = "deadline";
      return {
        assistant: intakeText().askDeadline,
        options: intakeText("deadline"),
        stage: "intake_deadline",
      };
    }
    const months = parseMonths(msg);
    const plan = planForMessage(DEMO_DB.intake.goal, {
      level: DEMO_DB.intake.level,
      dailyMin: DEMO_DB.intake.dailyMin,
      deadlineMonths: months,
    });
    DEMO_DB.intake = null;
    return {
      assistant: `${intakeText().done} Open the Plan tab to review it.`,
      options: [],
      planId: plan.id,
      stage: "planning",
    };
  }

  if (path.indexOf("/api/plan/") === 0 && (opts.method || "GET") === "GET") {
    const planId = path.split("/api/plan/")[1];
    const plan = DEMO_DB.plans[planId];
    if (!plan) throw new Error("Plan not found");
    return JSON.parse(JSON.stringify(plan));
  }

  if (path === "/api/todo/complete" && (opts.method || "GET") === "POST") {
    const plan = DEMO_DB.plans[body.planId];
    if (!plan) throw new Error("Plan not found");
    plan.todos = (plan.todos || []).map((td) => (td.id === body.todoId ? { ...td, status: "done" } : td));
    return { ok: true };
  }

  if (path === "/api/schedule" && (opts.method || "GET") === "POST") {
    const plan = DEMO_DB.plans[body.planId];
    if (!plan) throw new Error("Plan not found");
    return scheduleForPlan(plan);
  }

  if (path === "/api/schedule/confirm" && (opts.method || "GET") === "POST") {
    return { ok: true };
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
      cal.push({ ...ev, date: addDays(ev.date, 1), status: "scheduled" });
    });
    const p = DEMO_DB.plans[pid];
    const oldFinish = p.finishDate;
    if (oldFinish) p.finishDate = addDays(oldFinish, moved.length ? 1 : 0);
    return {
      asOf: body.asOf,
      results: [{ moved: moved.length, finishShiftDays: moved.length ? 1 : 0, oldFinish, newFinish: p.finishDate }],
    };
  }

  if (path === "/api/meter" && (opts.method || "GET") === "GET") {
    return { enabled: false, callsTotal: 0, costUsd: 0 };
  }

  throw new Error("Demo endpoint not implemented: " + path);
}

async function api(path, opts = {}) {
  if (DEMO_MODE) return mockApi(path, opts);
  const headers = { "Content-Type": "application/json" };
  if (state.userId) headers["X-User-Id"] = state.userId;
  const res = await fetch(API + path, { headers, ...opts });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// ── Chat ──
function addMsg(text, who, extra = "") {
  const log = $("chatLog");
  const turn = el("div", `turn ${who} ${extra}`);
  if (who === "ai") turn.appendChild(el("div", "avatar", "s."));
  turn.appendChild(el("div", "bubble", esc(text)));
  log.appendChild(turn);
  log.scrollTop = log.scrollHeight;
  return turn;
}
function addTyping() {
  const log = $("chatLog");
  const turn = el("div", "turn ai");
  turn.appendChild(el("div", "avatar", "s."));
  turn.appendChild(el("div", "bubble typing", "<i></i><i></i><i></i>"));
  log.appendChild(turn);
  log.scrollTop = log.scrollHeight;
  return turn;
}
function setChips(options) {
  const box = $("chips");
  box.innerHTML = "";
  (options || []).forEach((opt) => {
    const c = el("button", "chip", esc(opt));
    c.type = "button";
    c.onclick = () => send(opt);
    box.appendChild(c);
  });
}

let busy = false;
function setBusy(b) {
  busy = b;
  $("input").disabled = b;
  $("sendBtn").disabled = b || !$("input").value.trim();
}

// ── Bootstrap ──
async function boot() {
  try {
    const saved = localStorage.getItem("startai_uid") || "";
    const r = await api("/api/session", { method: "POST", body: JSON.stringify({ userId: saved, lang: LANG }) });
    state.userId = r.userId;
    state.sessionId = r.sessionId;
    localStorage.setItem("startai_uid", r.userId);
    addMsg(r.assistant, "ai");
    setChips(t("starters"));
    refreshMeter();
  } catch (e) {
    addMsg(fmt(t("err_backend"), { e: e.message }), "ai", "declined");
  }
}

async function send(text) {
  const msg = (text != null ? text : $("input").value).trim();
  if (!msg || busy) return;
  state.started = true;
  $("input").value = "";
  $("sendBtn").disabled = true;
  setChips([]);
  addMsg(msg, "user");
  setBusy(true);
  const typing = addTyping();

  try {
    const turn = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ userId: state.userId, sessionId: state.sessionId, message: msg, lang: LANG }),
    });
    typing.remove();
    addMsg(turn.assistant, "ai", turn.stage === "out_of_scope" ? "declined" : "");
    setChips(turn.options);
    if (turn.planId) { await loadPlan(turn.planId); switchTab("plan"); }
    refreshMeter();
  } catch (e) {
    typing.remove();
    addMsg(fmt(t("err_generic"), { e: e.message }), "ai", "declined");
  } finally {
    setBusy(false);
    $("input").focus();
  }
}

// ── Plan ──
async function loadPlan(planId) {
  state.planId = planId;
  state.plan = await api("/api/plan/" + planId);
  renderPlan(state.plan);
  renderSetup(state.plan.setupItems || []);
  $("goalPill").hidden = false;
  $("goalPillText").textContent = state.plan.skill + (state.plan.path ? " · " + state.plan.path : "");
  $("scheduleBtn").disabled = false;
  if (DEMO_MODE) {
    $("icsBtn").hidden = true;
  } else {
    $("icsBtn").href = API + "/api/plan/" + planId + "/ics";
    $("icsBtn").hidden = false;
  }
  await loadCalendar();
}

function renderPlan(p) {
  $("planEmpty").hidden = true;
  const box = $("planContent");
  box.hidden = false;
  box.innerHTML = "";

  const head = el("div", "goal-head");
  head.innerHTML =
    `<div class="goal-eyebrow">${t("your_plan")}</div>
     <h2 class="goal-title">${esc(p.skill)}${p.path ? ` <span class="path">· ${esc(p.path)}</span>` : ""}</h2>
     <p class="assessment">${esc(p.assessment)}</p>
     ${p.feasibility ? `<div class="reality">${WARN_SVG}<span>${esc(p.feasibility)}</span></div>` : ""}`;
  box.appendChild(head);

  box.appendChild(el("div", "section-label", t("roadmap")));
  const spine = el("ol", "spine");
  const phases = p.phases || [];
  const msByPhase = {};
  (p.milestones || []).forEach((m) => { (msByPhase[m.phase] = msByPhase[m.phase] || []).push(m); });
  const usedKeys = new Set(phases.map((ph) => ph.key));

  phases.forEach((ph, idx) => {
    const li = el("li", "node phase");
    li.style.animationDelay = idx * 0.06 + "s";
    let msHtml = "";
    (msByPhase[ph.key] || []).forEach((m) => {
      msHtml += `<li class="ms"><span class="diam"></span><span>${esc(m.title)}</span><time>${esc(prettyDate(m.targetDate))}</time></li>`;
    });
    li.innerHTML =
      `<span class="node-dot"></span>
       <span class="wk">W${ph.weekStart}–${ph.weekEnd}</span>
       <h4>${esc(ph.title)}</h4>
       <div class="node-sum">${esc(ph.summary)}</div>
       ${msHtml ? `<ul class="ms-list">${msHtml}</ul>` : ""}`;
    spine.appendChild(li);
  });

  const orphans = (p.milestones || []).filter((m) => !usedKeys.has(m.phase));
  if (orphans.length) {
    const li = el("li", "node phase");
    let msHtml = "";
    orphans.forEach((m) => { msHtml += `<li class="ms"><span class="diam"></span><span>${esc(m.title)}</span><time>${esc(prettyDate(m.targetDate))}</time></li>`; });
    li.innerHTML = `<span class="node-dot"></span><span class="wk">${t("roadmap")}</span><ul class="ms-list">${msHtml}</ul>`;
    spine.appendChild(li);
  }

  const fin = el("li", "node finish");
  fin.innerHTML =
    `<span class="node-dot">🏁</span>
     <span class="wk">${t("target_finish")}</span>
     <h4 id="spineFinishDate"></h4>
     <div class="shift" id="spineShift"></div>`;
  spine.appendChild(fin);
  box.appendChild(spine);

  box.appendChild(el("div", "section-label", t("tasks")));
  (p.todos || []).forEach((td, i) => {
    const done = td.status === "done";
    const row = el("div", "todo" + (done ? " done" : ""));
    row.style.animationDelay = Math.min(i * 0.04, 0.4) + "s";
    const label = el("label", "check");
    label.innerHTML = `<input type="checkbox" ${done ? "checked disabled" : ""} aria-label="done"><span class="box">${CHECK_SVG}</span>`;
    label.querySelector("input").onchange = () => completeTodo(td.id);
    const body = el("div", "todo-body");
    body.innerHTML =
      `<div class="t">${esc(td.title)}</div>
       <div class="todo-meta"><span class="pill ${esc(td.priority)}">${esc(tg("prio", td.priority))}</span>
       <span>${td.durationMin} ${t("min")}</span><span>${esc(tg("freq", td.frequency))}</span>${td.phase ? `<span>${esc(td.phase)}</span>` : ""}</div>`;
    row.appendChild(label);
    row.appendChild(body);
    box.appendChild(row);
  });

  updateSpineFinish(p);
}

function updateSpineFinish(p) {
  const dateEl = $("spineFinishDate");
  const shiftEl = $("spineShift");
  if (!dateEl) return;
  if (p.finishDate) {
    dateEl.textContent = prettyDate(p.finishDate);
    shiftEl.textContent = (p.originalFinishDate && p.originalFinishDate !== p.finishDate)
      ? fmt(t("moved_from"), { d: prettyDate(p.originalFinishDate) }) : "";
  } else {
    dateEl.textContent = fmt(t("weeks_approx"), { n: p.weeksTotal });
    shiftEl.textContent = t("finish_set");
  }
}

function renderSetup(items) {
  const box = $("setupContent");
  box.innerHTML = "";
  if (!items.length) { $("setupEmpty").hidden = false; return; }
  $("setupEmpty").hidden = true;
  items.forEach((s, i) => {
    const c = el("div", "setup-card");
    c.style.animationDelay = i * 0.05 + "s";
    c.innerHTML =
      `<div class="setup-rank">${i + 1}</div>
       <div class="setup-main">
         <div class="setup-row"><span class="setup-name">${esc(s.name)}</span><span class="setup-price">${esc(s.priceRange)}</span></div>
         ${s.category ? `<div class="setup-cat">${esc(s.category)}</div>` : ""}
         <div class="setup-why">${esc(s.rationale)}</div>
       </div>`;
    box.appendChild(c);
  });
}

async function completeTodo(todoId) {
  try {
    await api("/api/todo/complete", { method: "POST", body: JSON.stringify({ planId: state.planId, todoId }) });
    await loadPlan(state.planId);
  } catch (e) { alert(e.message); }
}

// ── Calendar ──
async function schedule() {
  try {
    const r = await api("/api/schedule", { method: "POST", body: JSON.stringify({ planId: state.planId }) });
    state.plan.finishDate = r.finishDate;
    state.plan.startDate = r.startDate;
    if (!state.plan.originalFinishDate) state.plan.originalFinishDate = r.finishDate;
    $("confirmBtn").disabled = false;
    $("rolloverBtn").disabled = false;
    switchTab("calendar");
    await loadCalendar();
    updateSpineFinish(state.plan);
  } catch (e) { alert(e.message); }
}

async function confirmSchedule() {
  try {
    await api("/api/schedule/confirm", { method: "POST", body: JSON.stringify({ planId: state.planId }) });
    await loadCalendar();
  } catch (e) { alert(e.message); }
}

async function loadCalendar() {
  if (!state.planId) return;
  const events = (await api("/api/calendar?planId=" + state.planId)) || [];
  renderCalendar(events);
  if (state.plan) showFinish(state.plan.finishDate, false);
}

function renderCalendar(events) {
  events = events || [];
  const box = $("calContent");
  box.innerHTML = "";
  const todos = (state.plan && state.plan.todos) || [];

  if (todos.length) {
    const todoSection = el("div", "cal-todos");
    todoSection.appendChild(el("div", "section-label", t("tasks")));
    todos.forEach((td, i) => {
      const done = td.status === "done";
      const row = el("div", "todo" + (done ? " done" : ""));
      row.style.animationDelay = Math.min(i * 0.03, 0.24) + "s";
      const label = el("label", "check");
      label.innerHTML = `<input type="checkbox" ${done ? "checked disabled" : ""} aria-label="done"><span class="box">${CHECK_SVG}</span>`;
      label.querySelector("input").onchange = () => completeTodo(td.id);
      const body = el("div", "todo-body");
      body.innerHTML =
        `<div class="t">${esc(td.title)}</div>
         <div class="todo-meta"><span class="pill ${esc(td.priority)}">${esc(tg("prio", td.priority))}</span>
         <span>${td.durationMin} ${t("min")}</span><span>${esc(tg("freq", td.frequency))}</span>${td.phase ? `<span>${esc(td.phase)}</span>` : ""}</div>`;
      row.appendChild(label);
      row.appendChild(body);
      todoSection.appendChild(row);
    });
    box.appendChild(todoSection);
  }

  if (!events.length) { $("calEmpty").hidden = false; return; }
  $("calEmpty").hidden = true;

  const byDay = {};
  events.forEach((ev) => { (byDay[ev.date] = byDay[ev.date] || []).push(ev); });
  Object.keys(byDay).sort().forEach((date, di) => {
    const day = el("div", "cal-day");
    day.style.animationDelay = Math.min(di * 0.03, 0.3) + "s";
    day.appendChild(el("div", "cal-date", esc(prettyDateFull(date))));
    byDay[date].forEach((ev) => {
      const row = el("div", "cal-ev" + (ev.status === "done" ? " done" : "") + (ev.status === "rolled_over" ? " rolled" : ""));
      row.innerHTML =
        `<span class="time">${esc(ev.startTime)}</span>
         <span class="ttl">${esc(ev.title)}</span>
         <span class="st">${esc(tg("status", ev.status))}</span>`;
      day.appendChild(row);
    });
    box.appendChild(day);
  });
}

function showFinish(finishDate, shifted) {
  const p = state.plan;
  if (!p || !finishDate) return;
  const line = $("finishLine");
  line.hidden = false;
  line.classList.toggle("shifted", !!shifted);
  let html = `<span class="lbl">${t("target_finish")}</span><span class="date">${esc(prettyDate(finishDate))}</span>`;
  if (p.originalFinishDate && p.originalFinishDate !== finishDate) {
    html += `<span class="orig">${fmt(t("originally"), { d: prettyDate(p.originalFinishDate) })}</span>`;
  }
  line.innerHTML = html;
}

// ── Rollover ──
async function rollover() {
  try {
    const events = (await api("/api/calendar?planId=" + state.planId)) || [];
    if (!events.length) return;
    const firstDate = events.map((e) => e.date).sort()[0];
    const asOf = addDays(firstDate, 1);
    const r = await api("/api/rollover", { method: "POST", body: JSON.stringify({ userId: state.userId, asOf }) });

    state.plan = await api("/api/plan/" + state.planId);
    await loadCalendar();
    const res = (r.results || [])[0];
    showFinish(state.plan.finishDate, !!(res && res.finishShiftDays > 0));
    updateSpineFinish(state.plan);

    const note = $("rollMsg");
    note.hidden = false;
    let msg = fmt(t("rollover_asof"), { date: prettyDate(r.asOf) });
    if (res && res.moved > 0) {
      note.className = "roll-note";
      msg += " " + fmt(t("rolled_fwd"), { n: res.moved });
      if (res.finishShiftDays > 0) {
        msg += " " + fmt(t("finish_moved"), { old: prettyDate(res.oldFinish), new: prettyDate(res.newFinish), d: res.finishShiftDays });
      }
    } else {
      note.className = "roll-note flat";
      msg += " " + t("nothing_roll");
    }
    note.textContent = msg;
  } catch (e) { alert(e.message); }
}

// ── Dates ──
function prettyDate(d) {
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  const loc = { en: undefined, ru: "ru-RU", uz: "uz-UZ" }[LANG];
  return dt.toLocaleDateString(loc, { month: "short", day: "numeric" });
}
function prettyDateFull(d) {
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  const loc = { en: undefined, ru: "ru-RU", uz: "uz-UZ" }[LANG];
  return dt.toLocaleDateString(loc, { weekday: "long", month: "short", day: "numeric" });
}
function addDays(d, n) {
  const dt = new Date(d + "T00:00:00Z"); // UTC-safe
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// ── Meter ──
async function refreshMeter() {
  try {
    const m = await api("/api/meter");
    const dot = $("meterDot");
    if (m.enabled) {
      dot.className = "meter-dot live";
      $("meterText").textContent = fmt(t("meter_live"), { n: m.callsTotal, c: m.costUsd.toFixed(3) });
    } else {
      dot.className = "meter-dot mock";
      $("meterText").textContent = t("meter_mock");
    }
  } catch (_) {}
}

// ── Tabs ──
function switchTab(name) {
  const order = { plan: 0, calendar: 1, setup: 2 };
  $("seg").style.setProperty("--i", order[name]);
  document.querySelectorAll(".seg-btn").forEach((tb) => tb.classList.toggle("active", tb.dataset.tab === name));
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active", p.id === "pane-" + name));
}

// ── Wire up ──
document.querySelectorAll(".seg-btn").forEach((tb) => (tb.onclick = () => switchTab(tb.dataset.tab)));
document.querySelectorAll("#langSwitch button").forEach((b) => (b.onclick = () => setLang(b.dataset.lang)));
$("themeToggle").onclick = toggleTheme;
$("composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
$("input").addEventListener("input", () => { $("sendBtn").disabled = busy || !$("input").value.trim(); });
$("scheduleBtn").onclick = schedule;
$("confirmBtn").onclick = confirmSchedule;
$("rolloverBtn").onclick = rollover;

// init: reflect saved language, then boot (which mints the session)
document.querySelectorAll("#langSwitch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === LANG));
applyI18n();
boot();
