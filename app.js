// ═══ start.ai web client ═══════════════════════════════════════════════
const API = (window.START_AI_CONFIG && window.START_AI_CONFIG.apiBase) || "https://backend-0v74.onrender.com";

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

async function api(path, opts = {}) {
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
  $("icsBtn").href = API + "/api/plan/" + planId + "/ics";
  $("icsBtn").hidden = false;
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
