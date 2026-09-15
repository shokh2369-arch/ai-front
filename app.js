// ═══ start.ai web client ═══════════════════════════════════════════════
// Loaded after storage.js, i18n.js and demo-api.js (see index.html).
const CFG = window.START_AI_CONFIG || {};
// An empty apiBase is a real answer ("same origin"), not a missing one — so it
// must not fall through to the hosted fallback.
const API = typeof CFG.apiBase === "string" ? CFG.apiBase : "https://backend-0v74.onrender.com";
const DEMO_MODE = !!CFG.demoMode;
// Developer instrumentation stays out of the product unless asked for.
const DEBUG = new URLSearchParams(location.search).has("debug");

const state = {
  userId: null, sessionId: null, token: null, timezone: null, planId: null, plan: null,
  started: false, events: [], weekStart: null, scheduled: false,
};

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  // Controls that show only an icon carry their label in the current language.
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.documentElement.lang = LANG;
  syncThemeButton();
  syncComposer();
  syncGreeting();
  syncDock();
  syncDemoBadge();
  syncSettings();   // no-op while the dialog is closed
}

// The opening question uses your name when it knows it.
function syncGreeting() {
  const h = document.querySelector("#intakeHead h1");
  if (!h) return;
  const name = lsGet("startai_name");
  h.textContent = name ? fmt(t("intake_h_named"), { name }) : t("intake_h");
}

// The composer asks for a goal during intake, and for questions afterwards.
function syncComposer() {
  const input = $("input");
  if (input) input.placeholder = t(document.body.dataset.stage === "plan" ? "composer_plan" : "composer");
}

function setLang(lang) {
  LANG = lang;
  lsSet("startai_lang", lang);
  syncLangButtons();
  applyI18n();
  syncAccount();
  if (!state.started) setChips(t("starters"));
  refreshMeter();
  if (state.plan) {
    renderGoalBand(state.plan);
    renderPlan(state.plan);
    renderKit(state.plan.setupItems || [], state.plan.budget);
    renderWeek();
  }
}

// ── theme ──
// The stored preference is light, dark, or system; "system" keeps following
// the OS after the choice is made, instead of freezing at whatever it was.
function themePref() { return lsGet("startai_theme") || "system"; }
function applyTheme(pref) {
  lsSet("startai_theme", pref);
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  syncThemeButton();
  syncSettings();
}
function toggleTheme() {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

// A toggle should say which state it is in, not only look like it.
function syncThemeButton() {
  const b = $("themeToggle");
  if (!b) return;
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  b.setAttribute("aria-pressed", String(dark));
  b.setAttribute("aria-label", t(dark ? "aria_theme_light" : "aria_theme_dark"));
}
function syncLangButtons() {
  document.querySelectorAll("#langSwitch button").forEach((b) => {
    const on = b.dataset.lang === LANG;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

// ── DOM helpers ──
const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const CHECK_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const WARN_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
// Drawn on the same 24-unit stroke grid as every other icon here.
const FLAG_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V4M6 4h11l-2.2 3.5L17 11H6"/></svg>';
// A plus, not a tick: this adds one completed session to a series, it does
// not mark the whole thing done.
const PLUS_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const DOTS_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>';

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10);
}
// ── Timezone ──
// Scheduling happens in the plan's timezone, which the backend owns. The
// browser's zone is only a fallback for when nothing has said otherwise.
function browserTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (_) { return "UTC"; }
}
function planTimezone() {
  return (state.plan && state.plan.timezone) || state.timezone || browserTimezone();
}
// The calendar date a given instant falls on, in a named zone.
function isoInZone(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const get = (k) => (parts.find((p) => p.type === k) || {}).value;
    const y = get("year"); const m = get("month"); const d = get("day");
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch (_) { /* unknown zone: fall through to the device */ }
  const d2 = date;
  return d2.getFullYear() + "-" + String(d2.getMonth() + 1).padStart(2, "0") + "-" + String(d2.getDate()).padStart(2, "0");
}
function isoToday() {
  return isoInZone(new Date(), planTimezone());
}
function lower(s) {
  return String(s || "").toLowerCase();
}
// ── Errors ─────────────────────────────────────────────────────────────
// The client understands stable codes, not prose. Server text is shown only
// when it arrives in the agreed {error:{code,message}} shape AND survives the
// guard below — never a raw body, HTML page, stack trace or provider payload.
// Codes are the contract; status alone and message text are not. An unknown
// code deliberately falls through to the generic message rather than being
// guessed at from its HTTP status.
const ERR_TEXT = {
  NETWORK: "err_network",
  AI_UNAVAILABLE: "err_ai_unavailable",
  AI_RATE_LIMITED: "err_rate_limited",
  DAILY_QUOTA_EXCEEDED: "err_quota",
  SPEND_CAP_REACHED: "err_spend_cap",
  UNAUTHORIZED: "err_unauthorized",
  SESSION_NOT_FOUND: "err_unauthorized",
  PLAN_NOT_FOUND: "err_plan_gone",
  TODO_NOT_FOUND: "err_stale",
  EVENT_NOT_FOUND: "err_stale",
  SCHEDULE_CONFLICT: "err_stale",
  INVALID_REQUEST: "err_generic_safe",
  INTERNAL_ERROR: "err_server",
  SERVER_ERROR: "err_server",
};
// Worth offering a retry button for; the rest are either automatic or final.
const RETRYABLE = { NETWORK: 1, AI_UNAVAILABLE: 1, AI_RATE_LIMITED: 1, INTERNAL_ERROR: 1, SERVER_ERROR: 1 };

function apiErr(code, safeMessage, status) {
  const e = new Error(code);
  e.code = code;
  if (safeMessage) e.safeMessage = safeMessage;
  if (status) e.status = status;
  return e;
}

// A message is only forwarded to the user if it reads like one sentence of
// product copy. Markup, JSON, keys, tokens and provider/billing talk are out.
function isSafeMessage(s) {
  if (typeof s !== "string") return false;
  const v = s.trim();
  if (!v || v.length > 200 || v.split("\n").length > 2) return false;
  if (/[<>{}[\]]/.test(v)) return false;
  if (/\b(sk-[A-Za-z0-9]|bearer\s|eyJ[A-Za-z0-9_-]{6})/i.test(v)) return false;
  if (/\b(openai|anthropic|api[ _-]?key|token|quota|credit balance|billing|stack trace|goroutine|panic:)\b/i.test(v)) return false;
  if (/\bat\s+[\w.$]+\s*\(/.test(v)) return false;
  return true;
}

// `error` is an object: {code, message, ref?}. A bare string is the old shape
// and is ignored rather than displayed. Status is only a last resort when no
// code arrives at all.
async function readError(res) {
  let code = res.status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED";
  let safe = null;
  let ref = null;
  try {
    const body = await res.json();
    const err = body && body.error;
    if (err && typeof err === "object" && !Array.isArray(err)) {
      if (typeof err.code === "string" && /^[A-Z][A-Z0-9_]{1,39}$/.test(err.code)) code = err.code;
      if (isSafeMessage(err.message)) safe = err.message.trim();
      if (typeof err.ref === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(err.ref)) ref = err.ref;
    }
  } catch (_) { /* non-JSON body (HTML page, empty, truncated): discarded on purpose */ }
  const e = apiErr(code, safe, res.status);
  if (ref) e.ref = ref;
  return e;
}

// What the user actually reads. Localized copy wins over server prose so the
// UI stays translated; server prose is the fallback for codes we don't know.
function errText(e) {
  const key = e && e.code && ERR_TEXT[e.code];
  if (key) return t(key);
  // Unknown code: treat as a generic failure rather than guessing a meaning.
  return t("err_generic_safe");
}

// Some failures mean local state has gone stale rather than something broke.
// Repair what we can before telling the user anything.
async function handleApiError(e) {
  if (!e) return;
  if (e.code === "PLAN_NOT_FOUND") {
    // The plan this device remembers no longer exists on the server.
    const c = activeChat();
    if (c) { c.planId = null; c.plan = null; c.cal = null; saveHistory(); renderChatList(); }
    state.planId = null; state.plan = null; state.events = [];
    resetWorkspace();
  } else if ((e.code === "TODO_NOT_FOUND" || e.code === "EVENT_NOT_FOUND" || e.code === "SCHEDULE_CONFLICT") && state.planId) {
    try { await loadPlan(state.planId, { animate: false }); } catch (_) { /* reported below */ }
  }
  toast(errText(e), undefined, undefined, e.ref);
}

// The server keeps sessions on disk and its filesystem does not survive a
// deploy or a free-tier spin-down. A restart must be invisible: when the
// session it is holding has evaporated, get a new one and replay the call.
const RECOVERABLE = { SESSION_NOT_FOUND: 1, UNAUTHORIZED: 1 };
// Two codes mean "stop asking". Retrying them wastes the user's time and,
// for the spend cap, somebody's money.
const NEVER_RETRY = { DAILY_QUOTA_EXCEEDED: 1, SPEND_CAP_REACHED: 1 };

async function rawApi(path, opts) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers.Authorization = "Bearer " + state.token;
  let res;
  try {
    res = await fetch(API + path, { headers, ...opts });
  } catch (_) {
    // A live request that fails stays failed. It never falls back to the mock.
    throw apiErr("NETWORK");
  }
  if (!res.ok) throw await readError(res);
  try {
    return await res.json();
  } catch (_) {
    throw apiErr("BAD_RESPONSE");
  }
}

async function api(path, opts = {}) {
  if (DEMO_MODE) return mockApi(path, opts);
  try {
    return await rawApi(path, opts);
  } catch (e) {
    if (!RECOVERABLE[e.code] || NEVER_RETRY[e.code] || path === "/api/session") throw e;
    // One attempt only — a second failure is a real error, not a stale session.
    await newSession();
    return rawApi(path, withSession(opts));
  }
}

// The replayed call has to carry the *new* sessionId, not the dead one.
function withSession(opts) {
  if (!opts || !opts.body || !state.sessionId) return opts;
  try {
    const body = JSON.parse(opts.body);
    if (!Object.prototype.hasOwnProperty.call(body, "sessionId")) return opts;
    body.sessionId = state.sessionId;
    return { ...opts, body: JSON.stringify(body) };
  } catch (_) { return opts; }
}

// ── Stage ──
// Two stages, one surface. During intake the conversation owns a centred
// column; once a plan exists it collapses to a dock and the plan takes over.
function setStage(name) {
  document.body.dataset.stage = name;
  syncComposer();
  syncDock();
  $("intakeHead").hidden = name !== "intake";
  $("goalBand").hidden = name !== "plan";
  $("surface").hidden = name !== "plan";
  $("dockToggle").hidden = name !== "plan";
  $("planState").hidden = name !== "plan";
}
function setDock(open) {
  document.body.classList.toggle("dock-closed", !open);
  $("dockToggle").setAttribute("aria-expanded", String(open));
  syncDock();
  if (open) { scrollChat(); $("input").focus(); }
}
// On the plan stage the conversation takes over the working area, so the
// toggle has to say which way it goes.
function syncDock() {
  const lbl = document.querySelector("#dockToggle .dt-label");
  if (!lbl) return;
  lbl.textContent = t(dockIsOpen() && document.body.dataset.stage === "plan" ? "dock_plan" : "dock_label");
}
function dockIsOpen() {
  return !document.body.classList.contains("dock-closed");
}

// ── Toasts ──
// Errors belong inside the design, not in an OS dialog.
function toast(message, kind, action, ref) {
  const box = $("toasts");
  const node = el("div", "toast" + (kind === "ok" ? " ok" : ""));
  node.innerHTML = `<b>${esc(kind === "ok" ? "" : t("err_title"))}</b><span class="toast-msg">${esc(message)}</span>`;
  if (kind === "ok") node.querySelector("b").remove();
  // A support reference is for correlation, not for reading. It stays folded
  // away unless someone goes looking for it.
  if (ref) {
    const d = el("details", "toast-ref");
    d.innerHTML = `<summary>${esc(t("err_details"))}</summary><code>${esc(fmt(t("err_ref"), { ref }))}</code>`;
    node.appendChild(d);
  }
  // Something destructive should offer the way back, in the same breath.
  if (action) {
    const b = el("button", "toast-act", esc(action.label));
    b.type = "button";
    b.onclick = () => { node.remove(); action.onClick(); };
    node.appendChild(b);
  }
  box.appendChild(node);
  setTimeout(() => node.remove(), action ? 9000 : 6000);
}

// ── Chat ──
function scrollChat() {
  const log = $("chatLog");
  log.scrollTop = log.scrollHeight;
}
function addMsg(text, who, extra = "") {
  const log = $("chatLog");
  const turn = el("div", `turn ${who} ${extra}`);
  if (who === "ai") turn.appendChild(el("div", "avatar", "s."));
  turn.appendChild(el("div", "bubble", esc(text)));
  log.appendChild(turn);
  scrollChat();
  return turn;
}
function addTyping() {
  const log = $("chatLog");
  const turn = el("div", "turn ai");
  turn.appendChild(el("div", "avatar", "s."));
  turn.appendChild(el("div", "bubble typing", "<i></i><i></i><i></i>"));
  log.appendChild(turn);
  scrollChat();
  return turn;
}
// A chip is either a suggested reply (a string) or an action ({label, onClick}).
function setChips(options) {
  const box = $("chips");
  box.innerHTML = "";
  (options || []).forEach((opt) => {
    const action = opt && typeof opt === "object";
    const label = action ? opt.label : opt;
    const c = el("button", "chip" + (action ? " chip-action" : ""), esc(label));
    c.type = "button";
    c.onclick = action ? opt.onClick : () => send(label);
    box.appendChild(c);
  });
}

// Where the user is inside the three intake questions.
// ── Interview state ──
// The backend owns the flow: scope_check → optional disambiguation → adaptive
// intake → plan_ready. Questions are skipped when it already knows the answer,
// so the count is never fixed and is never inferred from assistant text. The
// UI reports only what the response carries.
const STAGE_LABEL = { scope_check: "stage_scope", disambiguation: "stage_disambig" };

function turnState(turn) {
  if (!turn || typeof turn !== "object") return null;
  const p = turn.progress;
  // `progress` is absent outside intake, and absent means "not applicable" —
  // not zero. `max` is a ceiling the adaptive interview usually stops short of,
  // so it is never rendered as a total or a percentage.
  const answered = p && Number.isFinite(p.answered) && p.answered >= 0 ? Math.floor(p.answered) : null;
  const stage = typeof turn.stage === "string" ? turn.stage : null;
  // The interview is over once a plan exists; progress stops being news.
  if (stage === "plan_ready") return null;
  if (answered == null && !STAGE_LABEL[stage]) return null;
  return { stage, answered, question: typeof turn.question === "string" ? turn.question : null };
}

function renderTurnState(st) {
  const note = $("trayNote");
  const text = $("trayNoteText");
  const bar = $("trayBar");
  if (!st) { note.hidden = true; bar.hidden = true; return; }
  note.hidden = false;

  // Before the interview proper, the named stage says more than a count of
  // zero would, so it wins when the backend sends both.
  if (STAGE_LABEL[st.stage]) {
    text.textContent = t(STAGE_LABEL[st.stage]);
    bar.hidden = true;
    return;
  }
  if (st.answered != null) {
    // You are ON question N+1, having answered N. The bar is indeterminate:
    // the interview stops when it has enough, which is usually early.
    const n = st.answered + 1;
    text.textContent = fmt(t("intake_question_n"), { n });
    bar.hidden = false;
    bar.classList.add("indeterminate");
    bar.removeAttribute("aria-valuenow");
    bar.removeAttribute("aria-valuemax");
    bar.setAttribute("aria-label", t("aria_progress"));
    bar.setAttribute("aria-valuetext", fmt(t("intake_question_n"), { n }));
    return;
  }
}

// A quiet channel for the things a sighted user simply sees happen.
function announce(msg) {
  const n = $("live");
  n.textContent = "";
  setTimeout(() => { n.textContent = msg; }, 60);
}

let busy = false;
function setBusy(b) {
  busy = b;
  $("input").disabled = b;
  $("sendBtn").disabled = b || !$("input").value.trim();
}

// ── Chat history ───────────────────────────────────────────────────────
// Every goal you start is its own chat, kept in localStorage so the list
// survives a reload. A plan is stored as its plan object plus the start date
// and which sessions are done — the schedule itself is regenerated, because
// keeping hundreds of session rows per chat would not fit in the quota.
const HISTORY_KEY = "startai_chats_v1";
const MAX_CHATS = 50;
const MAX_MSGS = 200;

let chats = [];
let activeChatId = null;

// Browser-only state. Server-owned truth (plans, calendars, completion) is
// re-fetched; what is kept here is this device's history plus preferences.
// No secrets: the session token lives in memory for the life of the tab only.
const SCHEMA = 2;
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

// Anything stored by an older build, hand-edited, or half-written by a crash
// has to be survivable. Unknown shapes are dropped, never trusted.
function sanitizeChat(c) {
  if (!isObj(c) || typeof c.id !== "string" || !c.id) return null;
  const now = Date.now();
  const msgs = Array.isArray(c.messages) ? c.messages : [];
  return {
    id: c.id,
    title: typeof c.title === "string" ? c.title.slice(0, 200) : "",
    createdAt: Number.isFinite(c.createdAt) ? c.createdAt : now,
    updatedAt: Number.isFinite(c.updatedAt) ? c.updatedAt : now,
    messages: msgs
      .filter((m) => isObj(m) && typeof m.t === "string" && (m.w === "ai" || m.w === "user"))
      .slice(-MAX_MSGS)
      .map((m) => ({ w: m.w, t: m.t, x: typeof m.x === "string" ? m.x : "" })),
    chips: Array.isArray(c.chips) ? c.chips.filter((x) => typeof x === "string").slice(0, 12) : [],
    planId: typeof c.planId === "string" ? c.planId : null,
    plan: isObj(c.plan) ? c.plan : null,
    cal: isObj(c.cal) ? c.cal : null,
    intake: isObj(c.intake) ? c.intake : null,
    turnState: isObj(c.turnState) ? c.turnState : null,
    scheduled: !!c.scheduled,
    stage: c.stage === "plan" ? "plan" : "intake",
  };
}

function migrateChats(list, from) {
  if (from < 2) {
    // v1 stored a fixed-flow step name (intake_level, …). The backend owns the
    // interview now, so the old marker is dropped rather than reinterpreted.
    return list.map((c) => {
      if (!isObj(c)) return c;
      const next = { ...c, turnState: null };
      delete next.trayStage;
      delete next.doneKeys;
      return next;
    });
  }
  return list;
}

function loadHistory() {
  chats = [];
  activeChatId = null;
  let raw = null;
  try { raw = JSON.parse(lsGet(HISTORY_KEY) || "null"); }
  catch (_) { return; }            // unreadable or unparseable: start clean
  if (!isObj(raw)) return;
  const version = Number.isFinite(raw.v) ? raw.v : 1;
  let list = Array.isArray(raw.chats) ? raw.chats : [];
  if (version < SCHEMA) list = migrateChats(list, version);
  chats = list.map(sanitizeChat).filter(Boolean);
  activeChatId = (typeof raw.activeId === "string" && chats.some((c) => c.id === raw.activeId))
    ? raw.activeId : null;
}
function saveHistory() {
  // lsSet reports failure rather than throwing, so quota is a false return.
  const write = () => lsSet(HISTORY_KEY, JSON.stringify({ v: SCHEMA, activeId: activeChatId, chats }));
  if (write()) return;
  // Out of room: shed the oldest chats until it fits, rather than losing everything.
  const oldestFirst = chats.slice().sort((a, b) => a.updatedAt - b.updatedAt);
  while (oldestFirst.length > 1) {
    const victim = oldestFirst.shift();
    if (victim.id === activeChatId) continue;
    chats = chats.filter((c) => c.id !== victim.id);
    if (write()) return;
  }
}
function activeChat() { return chats.find((c) => c.id === activeChatId) || null; }

function chatTitle(c) {
  if (!c) return t("chat_untitled");
  if (c.title) return c.title;
  if (c.plan && c.plan.skill) return c.plan.skill;
  const first = (c.messages || []).find((m) => m.w === "user");
  if (first && first.t) return first.t.length > 52 ? first.t.slice(0, 52).trim() + "…" : first.t;
  return t("chat_untitled");
}

function logMsg(text, who, extra) {
  const c = activeChat();
  if (!c) return;
  c.messages.push({ w: who, t: text, x: extra || "" });
  if (c.messages.length > MAX_MSGS) c.messages.splice(0, c.messages.length - MAX_MSGS);
  c.updatedAt = Date.now();
  saveHistory();
  renderChatList();
}
function persistChips(options) {
  const c = activeChat();
  if (!c) return;
  // Action chips (Retry) belong to a moment, not to the transcript.
  c.chips = (options || []).filter((o) => typeof o === "string");
  saveHistory();
}
// Snapshot whatever the workspace is currently showing onto the active chat.
function syncActiveChat() {
  const c = activeChat();
  if (!c) return;
  c.planId = state.planId;
  c.plan = state.plan ? JSON.parse(JSON.stringify(state.plan)) : null;
  c.cal = (DEMO_MODE && c.plan && c.plan.startDate) ? diffSchedule(c.plan, state.events || []) : null;
  c.scheduled = state.scheduled;
  c.stage = document.body.dataset.stage;
  if (DEMO_MODE) c.intake = DEMO_DB.intake ? { ...DEMO_DB.intake } : null;
  c.updatedAt = Date.now();
  saveHistory();
  renderChatList();
}

// The schedule is a pure function of (plan, start date), so only what differs
// from that baseline has to be stored: completed sessions, and anything a
// rollover moved. That is a handful of rows instead of several hundred.
function diffSchedule(plan, events) {
  const base = buildSchedule(plan, plan.startDate);
  const o = {};
  const n = Math.min(base.length, events.length);
  for (let i = 0; i < n; i += 1) {
    const b = base[i];
    const e = events[i];
    if (e.status !== b.status || e.date !== b.date || e.movedFrom) {
      o[i] = [e.status, e.date, e.movedFrom || ""];
    }
  }
  // A rollover appends rows; there are few, so they are kept verbatim.
  return { o, x: events.slice(base.length) };
}
function rebuildSchedule(plan, cal) {
  const events = buildSchedule(plan, plan.startDate);
  if (cal && cal.o) {
    Object.keys(cal.o).forEach((i) => {
      const e = events[i];
      if (!e) return;
      const [status, date, movedFrom] = cal.o[i];
      e.status = status;
      e.date = date;
      if (movedFrom) e.movedFrom = movedFrom;
    });
  }
  if (cal && cal.x) cal.x.forEach((e) => events.push(e));
  DEMO_DB.calendars[plan.id] = events;
  return events;
}

// Back to a blank slate, without a page reload.
function resetWorkspace() {
  animateRows = true;
  state.planId = null; state.plan = null; state.events = [];
  state.weekStart = null; state.scheduled = false; state.started = false;
  $("chatLog").innerHTML = "";
  $("planContent").innerHTML = ""; $("planContent").hidden = true; $("planEmpty").hidden = false;
  $("kitContent").innerHTML = ""; $("kitEmpty").hidden = false;
  $("weekContent").hidden = true; $("weekEmpty").hidden = false;
  $("rollMsg").hidden = true;
  $("goalBand").classList.remove("shifted");
  $("scheduleBtn").disabled = true; $("emptyScheduleBtn").disabled = true;
  $("confirmBtn").disabled = true; $("icsBtn").hidden = true;
  state.scheduled = false; syncToolbar();
  setChips([]); renderTurnState(null);
  setStage("intake");
  setDock(true);
  switchTab("plan");
}

async function startNewChat() {
  chats.unshift({
    id: uid("chat"), title: "", createdAt: Date.now(), updatedAt: Date.now(),
    messages: [], chips: [], stage: "intake", turnState: null,
    planId: null, plan: null, cal: null, intake: null, scheduled: false,
  });
  if (chats.length > MAX_CHATS) chats.length = MAX_CHATS;
  activeChatId = chats[0].id;
  if (DEMO_MODE) DEMO_DB.intake = null;
  resetWorkspace();
  saveHistory();
  renderChatList();
  closeSidebarOnMobile();
  await ensureSession(true);
  $("input").focus();
}

async function openChat(id) {
  const c = chats.find((x) => x.id === id);
  if (!c) return;
  closeSidebarOnMobile();
  // Already open and already drawn — re-opening would only lose your place.
  if (id === activeChatId && $("chatLog").children.length) return;
  activeChatId = id;
  saveHistory();
  resetWorkspace();
  renderChatList();

  (c.messages || []).forEach((m) => addMsg(m.t, m.w, m.x));
  setChips(c.chips || []);
  renderTurnState(c.turnState || null);
  state.started = (c.messages || []).some((m) => m.w === "user");

  if (DEMO_MODE) {
    DEMO_DB.intake = c.intake ? { ...c.intake } : null;
    if (c.plan && c.plan.id) {
      DEMO_DB.plans[c.plan.id] = JSON.parse(JSON.stringify(c.plan));
      DEMO_DB.calendars[c.plan.id] = c.plan.startDate
        ? rebuildSchedule(DEMO_DB.plans[c.plan.id], c.cal)
        : [];
    }
  }
  if (c.planId) {
    try {
      await loadPlan(c.planId);
      setStage("plan");
      setDock(false);
      switchTab("plan");
    } catch (e) {
      handleApiError(e);
    }
  }
  scrollChat();
}

function deleteChat(id) {
  const idx = chats.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const removed = chats[idx];
  const wasActive = activeChatId === id;
  chats.splice(idx, 1);
  saveHistory();
  renderChatList();
  if (wasActive) {
    if (chats.length) openChat(chats[0].id);
    else startNewChat();
  }
  toast(fmt(t("chat_deleted"), { title: chatTitle(removed) }), "ok", {
    label: t("undo"),
    onClick: () => {
      chats.splice(Math.min(idx, chats.length), 0, removed);
      saveHistory();
      renderChatList();
    },
  });
}

// ── Sidebar ──
function chatGroup(c) {
  const days = Math.floor((Date.now() - (c.updatedAt || 0)) / 86400000);
  if (days <= 0) return "grp_today";
  if (days === 1) return "grp_yesterday";
  if (days <= 7) return "grp_week";
  if (days <= 30) return "grp_month";
  return "grp_older";
}

let renaming = null;
function renderChatList() {
  const box = $("sbList");
  if (!box) return;
  const q = lower(($("sbSearch").value || "").trim());
  // A chat you have not said anything in yet is not history — it is the blank
  // page you are looking at. It joins the list on your first message.
  const list = chats
    .filter((c) => c.planId || (c.messages || []).some((m) => m.w === "user"))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const shown = q ? list.filter((c) => lower(chatTitle(c)).includes(q)) : list;

  box.innerHTML = "";
  if (!shown.length) {
    box.appendChild(el("div", "sb-none", esc(t(q ? "chats_no_match" : "chats_none"))));
    return;
  }

  let group = null;
  shown.forEach((c) => {
    // Grouping is a way to read a long list; a search result is already short.
    if (!q) {
      const g = chatGroup(c);
      if (g !== group) { group = g; box.appendChild(el("div", "sb-group", esc(t(g)))); }
    }
    const title = chatTitle(c);
    const row = el("div", "sb-item" + (c.id === activeChatId ? " active" : ""));
    row.dataset.id = c.id;

    if (renaming === c.id) {
      const input = el("input", "sb-rename");
      input.value = title;
      input.setAttribute("aria-label", t("act_rename"));
      const commit = (save) => {
        if (renaming !== c.id) return;
        renaming = null;
        if (save) {
          const v = input.value.trim();
          c.title = v && v !== (c.plan && c.plan.skill) ? v : "";
          c.updatedAt = Date.now();
          saveHistory();
        }
        renderChatList();
      };
      input.onkeydown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(true); }
        else if (e.key === "Escape") { e.preventDefault(); commit(false); }
      };
      input.onblur = () => commit(true);
      row.appendChild(input);
      box.appendChild(row);
      setTimeout(() => { input.focus(); input.select(); }, 0);
      return;
    }

    const main = el("button", "sb-item-main", esc(title));
    main.type = "button";
    main.title = title;
    if (c.id === activeChatId) main.setAttribute("aria-current", "true");
    main.onclick = () => openChat(c.id);

    const menu = el("button", "sb-item-menu", DOTS_SVG);
    menu.type = "button";
    menu.setAttribute("aria-haspopup", "menu");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", fmt(t("aria_chat_menu"), { title }));
    menu.onclick = (e) => { e.stopPropagation(); openChatMenu(c.id, menu); };

    row.appendChild(main);
    row.appendChild(menu);
    box.appendChild(row);
  });
}

let menuFor = null;
function openChatMenu(id, anchor) {
  const menu = $("sbMenu");
  if (menuFor === id && !menu.hidden) { closeChatMenu(); return; }
  closeChatMenu();
  menuFor = id;
  menu.hidden = false;
  anchor.setAttribute("aria-expanded", "true");
  anchor.closest(".sb-item").classList.add("menu-open");
  const r = anchor.getBoundingClientRect();
  const w = menu.offsetWidth || 170;
  const h = menu.offsetHeight || 90;
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
  menu.style.top = (r.bottom + h + 8 > window.innerHeight ? r.top - h - 6 : r.bottom + 6) + "px";
  menu.querySelector("[data-act=rename]").focus();
}
function closeChatMenu() {
  const menu = $("sbMenu");
  menu.hidden = true;
  menuFor = null;
  document.querySelectorAll(".sb-item.menu-open").forEach((n) => n.classList.remove("menu-open"));
  document.querySelectorAll(".sb-item-menu[aria-expanded=true]").forEach((n) => n.setAttribute("aria-expanded", "false"));
}

let sidebarOpen = document.documentElement.getAttribute("data-sb") !== "closed";
function setSidebar(open) {
  sidebarOpen = open;
  document.body.classList.toggle("sb-closed", !open);
  document.body.classList.toggle("sb-open", open);
  document.documentElement.setAttribute("data-sb", open ? "open" : "closed");
  if (window.innerWidth > 940) lsSet("startai_sidebar", open ? "1" : "0");
  if (!open) closeChatMenu();
}
function closeSidebarOnMobile() {
  if (window.innerWidth <= 940) setSidebar(false);
}

// ── Account + settings ─────────────────────────────────────────────────
// There are no accounts here: the name is a local label, and the subtitle
// says what the app is actually talking to rather than inventing a plan tier.
function displayName() { return lsGet("startai_name") || t("acct_guest"); }
function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}
function syncAccount() {
  const name = displayName();
  const plan = DEMO_MODE ? t("acct_demo") : t("acct_live");
  [["acctAv", "amAv"], ["acctName", "amName"], ["acctPlan", "amPlan"]].forEach(([a, b], i) => {
    const v = i === 0 ? initials(name) : i === 1 ? name : plan;
    $(a).textContent = v;
    $(b).textContent = v;
  });
  $("acctName").title = name;
  syncGreeting();
}

let acctOpen = false;
function setAcctMenu(open) {
  const menu = $("acctMenu");
  acctOpen = open;
  menu.hidden = !open;
  $("acctBtn").setAttribute("aria-expanded", String(open));
  if (!open) return;
  const r = $("acctBtn").getBoundingClientRect();
  const w = menu.offsetWidth || 246;
  const h = menu.offsetHeight || 300;
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
  menu.style.top = Math.max(8, r.top - h - 8) + "px";
  menu.querySelector("[data-act]").focus();
}

const SHORTCUTS = [
  { k: "sc_new", c: ["Ctrl", "Shift", "O"] },
  { k: "sc_search", c: ["Ctrl", "K"] },
  { k: "sc_sidebar", c: ["Ctrl", "B"] },
  { k: "sc_send", c: ["Enter"] },
  { k: "sc_esc", c: ["Esc"] },
];
function bytesText(n) {
  return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB";
}
// Demo is a deliberate build-time choice, shown plainly. Nothing in the app
// ever sets it — a live request that fails stays failed.
function syncDemoBadge() {
  const b = $("demoBadge");
  if (!b) return;
  b.hidden = !DEMO_MODE;
  b.textContent = t("demo_badge");
  b.title = t("demo_badge_title");
  b.setAttribute("aria-label", t("demo_badge_title"));
}

function syncSettings() {
  if ($("settings").hidden) return;
  const tz = planTimezone();
  const device = browserTimezone();
  $("setTz").textContent = tz;
  $("setTzNote").textContent = tz === device ? t("tz_same") : fmt(t("tz_differs"), { device });
  $("setName").value = lsGet("startai_name") || "";
  const pref = themePref();
  $("themePick").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themePref === pref)));
  $("langPick").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));

  const mac = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent || "");
  const list = $("kbdList");
  list.innerHTML = "";
  SHORTCUTS.forEach((s) => {
    const keys = s.c.map((c) => (mac && c === "Ctrl" ? "⌘" : c));
    const li = el("li", "", `<span>${esc(t(s.k))}</span>${keys.map((k) => `<kbd>${esc(k)}</kbd>`).join("")}`);
    list.appendChild(li);
  });

  const bytes = (lsGet(HISTORY_KEY) || "").length;
  $("setStorage").textContent = fmt(t("set_storage"), { n: bytesText(bytes), c: chats.length });
}

let lastFocus = null;
function openSettings(section) {
  lastFocus = document.activeElement;
  $("settings").hidden = false;
  hideConfirm();
  syncSettings();
  if (section) {
    const el2 = $("set-" + section);
    if (el2) el2.scrollIntoView({ block: "start" });
  } else {
    $("setBody").scrollTop = 0;
  }
  (section === "profile" ? $("setName") : $("setClose")).focus();
}
function closeSettings() {
  $("settings").hidden = true;
  hideConfirm();
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  lastFocus = null;
}

// Destructive choices are confirmed inside the design, not in an OS dialog.
let confirmAction = null;
function askConfirm(textKey, onYes) {
  confirmAction = onYes;
  $("setConfirmText").textContent = t(textKey);
  $("setConfirm").hidden = false;
  $("setConfirmYes").focus();
}
function hideConfirm() { confirmAction = null; $("setConfirm").hidden = true; }

async function clearAllChats() {
  chats = [];
  activeChatId = null;
  saveHistory();
  if (DEMO_MODE) { DEMO_DB.plans = {}; DEMO_DB.calendars = {}; DEMO_DB.intake = null; }
  await startNewChat();
  syncSettings();
  toast(t("done_clear"), "ok");
}
async function resetAppData() {
  ["startai_name", "startai_sidebar", "startai_uid", "startai_lang"].forEach((k) => lsDel(k));
  lsSet("startai_theme", "system");
  applyTheme("system");
  setLang("en");
  await clearAllChats();
  syncAccount();
  toast(t("done_reset"), "ok");
}

// ── Bootstrap ──
// Creating a session is the one call that needs no auth, and the only one that
// ever hands back a token. The token cannot be re-fetched, so it is persisted:
// it is the sole handle on this user's plans, and losing it orphans them.
async function newSession() {
  // Through api(), so demo mode is served by the fixture. The recovery path
  // in api() skips /api/session, so this cannot recurse.
  const r = await api("/api/session", {
    method: "POST",
    body: JSON.stringify({ timezone: browserTimezone(), lang: LANG, name: lsGet("startai_name") || undefined }),
  });
  state.userId = r.userId;
  state.sessionId = r.sessionId;
  if (r.token) { state.token = r.token; lsSet("startai_token", r.token); }
  if (typeof r.timezone === "string" && r.timezone) state.timezone = r.timezone;
  lsSet("startai_uid", r.userId);
  lsSet("startai_session", r.sessionId);
  return r;
}

async function ensureSession(greet) {
  try {
    // A stored token keeps the same user across reloads; the server refreshes
    // its timezone from this call.
    state.token = lsGet("startai_token") || null;
    const r = await newSession();
    if (greet) {
      if (r.assistant) { addMsg(r.assistant, "ai"); logMsg(r.assistant, "ai", ""); }
      setChips(t("starters"));
      persistChips(t("starters"));
    }
    refreshMeter();
  } catch (e) {
    // At boot, "is the server up?" is the more actionable version of offline.
    addMsg(e.code === "NETWORK" ? t("err_backend") : errText(e), "ai", "declined");
    // A dead end needs a way out, not just an explanation of itself.
    setChips([{ label: t("btn_retry"), onClick: () => { $("chatLog").innerHTML = ""; setChips([]); ensureSession(greet); } }]);
  }
}

async function boot() {
  loadHistory();
  setSidebar(sidebarOpen);
  renderChatList();
  const c = activeChat();
  if (c && ((c.messages && c.messages.length) || c.planId)) {
    // The session has to exist before anything fetches a plan: an
    // unauthenticated read would 401, recover into a *new* user, and then
    // look like the plan had vanished.
    await ensureSession(false);
    await openChat(c.id);
    return;
  }
  if (c) {
    // An empty chat is already waiting — use it rather than stacking another.
    resetWorkspace();
    renderChatList();
    await ensureSession(true);
    $("input").focus();
    return;
  }
  await startNewChat();
}

async function send(text) {
  const msg = (text != null ? text : $("input").value).trim();
  if (!msg || busy) return;
  state.started = true;
  $("input").value = "";
  $("sendBtn").disabled = true;
  setChips([]);
  if (!dockIsOpen()) setDock(true); // never answer into a closed drawer
  addMsg(msg, "user");
  logMsg(msg, "user", "");
  setBusy(true);
  const typing = addTyping();

  try {
    const turn = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ userId: state.userId, sessionId: state.sessionId, message: msg, lang: LANG }),
    });
    typing.remove();
    // out_of_scope is a normal conversational turn — a redirect back to
    // learning goals — not a failure, so it is never styled as one.
    addMsg(turn.assistant, "ai");
    logMsg(turn.assistant, "ai", "");
    setChips(turn.options);
    persistChips(turn.options);
    const st = turnState(turn);
    renderTurnState(st);
    const c = activeChat();
    if (c) c.turnState = st;
    if (turn.stage === "plan_ready" && turn.planId) {
      await loadPlan(turn.planId);
      setStage("plan");
      setDock(false);
      switchTab("plan");
      // The page just changed underneath the user. Say so, and land focus on
      // the new content instead of dropping it on <body> with the composer.
      announce(t("plan_ready_sr"));
      $("gbTitle").focus();
    }
    syncActiveChat();
    refreshMeter();
  } catch (e) {
    typing.remove();
    addMsg(errText(e), "ai", "declined");
  } finally {
    setBusy(false);
    if (dockIsOpen()) $("input").focus();
  }
}

// ── Plan ──
// `animate: false` is used for in-place refreshes, so ticking one checkbox
// does not replay every entrance animation on the page.
let animateRows = true;
async function loadPlan(planId, opts = {}) {
  animateRows = opts.animate !== false;
  state.planId = planId;
  state.plan = await api("/api/plan/" + planId);
  // Sessions first: the task list and the progress numbers are read from them.
  await loadCalendar();
  renderGoalBand(state.plan);
  renderPlan(state.plan);
  renderKit(state.plan.setupItems || [], state.plan.budget);
  $("scheduleBtn").disabled = false;
  $("emptyScheduleBtn").disabled = false;
  refreshIcs();
  syncActiveChat();
}

// ── Sessions ──
// One pass over the calendar answers everything the Plan tab asks: what is on
// today, how far along each task is, and how much of the plan is behind you.
function sessionStats() {
  const today = isoToday();
  const by = {};
  (state.events || []).forEach((e) => {
    const key = e.todoId || e.title;
    const s = by[key] || (by[key] = { total: 0, done: 0, today: null, next: null });
    s.total += 1;
    if (e.status === "done") s.done += 1;
    if (e.date === today && e.status !== "done" && !s.today) s.today = e;
    if (e.date > today && (!s.next || e.date < s.next)) s.next = e.date;
    // The next session still open, so "log one" always has a target.
    if (e.status !== "done" && (!s.nextEvent || e.date < s.nextEvent.date)) s.nextEvent = e;
  });
  return by;
}
function planProgress() {
  const evs = state.events || [];
  return { done: evs.filter((e) => e.status === "done").length, total: evs.length };
}

// ── Calendar export ──
// Demo mode has no backend to render .ics, so the browser builds it. The
// button behaves the same either way instead of vanishing.
let icsUrl = null;
function refreshIcs() {
  const btn = $("icsBtn");
  if (!DEMO_MODE) {
    btn.href = API + "/api/plan/" + state.planId + "/ics";
    btn.removeAttribute("download");
    btn.hidden = false;
    return;
  }
  const evs = state.events || [];
  if (!evs.length || !state.plan) { btn.hidden = true; return; }
  if (icsUrl) URL.revokeObjectURL(icsUrl);
  icsUrl = URL.createObjectURL(new Blob([buildIcs(state.plan, evs)], { type: "text/calendar;charset=utf-8" }));
  btn.href = icsUrl;
  btn.download = (String(state.plan.skill || "plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plan") + ".ics";
  btn.hidden = false;
}
function buildIcs(plan, events) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const ics = (s) => String(s == null ? "" : s).replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
  const at = (date, time, addMin) => {
    const [h, m] = String(time || "18:00").split(":").map(Number);
    const dt = new Date(date + "T00:00:00");
    dt.setHours(h || 0, (m || 0) + (addMin || 0), 0, 0);
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  };
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//start.ai//plan//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:" + ics(plan.skill)];
  events.forEach((e, i) => {
    out.push(
      "BEGIN:VEVENT",
      `UID:${plan.id}-${i}@start.ai`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${at(e.date, e.startTime, 0)}`,
      `DTEND:${at(e.date, e.startTime, e.durationMin || 30)}`,
      `SUMMARY:${ics(e.title)}`,
      `DESCRIPTION:${ics(plan.skill)}`,
      "END:VEVENT",
    );
  });
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}

// The plan's own metadata, split back out of the headline it was welded into.
// Read from what the API actually sends. `path` is empty on real plans, so the
// old habit of splitting it out of a headline yields nothing.
function planFacts(p) {
  const tail = String(p.path || "").split(" · ");
  const days = Array.isArray(p.days) ? p.days : null;
  return {
    track: p.track || (p.path ? tail[0] : "") || "",
    level: p.level || "",
    budget: p.budget != null ? p.budget : null,
    dailyMin: p.dailyMin || 0,
    hoursPerWeek: Number.isFinite(p.hoursPerWeek) ? p.hoursPerWeek : null,
    days,
    weeks: p.weeksTotal || 0,
    timezone: p.timezone || null,
  };
}
function sessionsPerWeek(p) {
  const per = { daily: 7, thrice_weekly: 3, twice_weekly: 2, weekly: 1, once: 0 };
  return (p.todos || []).reduce((n, td) => n + (per[td.frequency] != null ? per[td.frequency] : 1), 0);
}

// ── Goal band: the promise, on every tab ──
function renderGoalBand(p) {
  const f = planFacts(p);
  $("gbTitle").textContent = p.skill;
  $("gbTrack").textContent = f.track;

  const chips = $("gbChips");
  chips.innerHTML = "";
  const chip = (label, value, mono) => {
    const c = el("span", "gb-chip");
    c.innerHTML = `<u>${esc(label)}</u><span class="${mono ? "v" : ""}">${esc(value)}</span>`;
    chips.appendChild(c);
  };
  if (f.level) chip(t("chip_level"), tg("lvl", f.level), false);
  if (f.budget != null) chip(t("chip_budget"), f.budget === 0 ? t("budget_free") : "≤$" + f.budget, f.budget !== 0);
  if (f.dailyMin) chip(t("chip_daily"), fmt(t("per_day"), { n: f.dailyMin }), true);
  if (f.hoursPerWeek) chip(t("chip_weekly"), fmt(t("hours_n"), { n: f.hoursPerWeek }), true);
  if (f.days && f.days.length) chip(t("chip_days"), f.days.join(" "), false);
  if (f.weeks) chip(t("chip_span"), fmt(t("weeks_n"), { n: f.weeks }), true);
  // Sessions come from the server's calendar once it exists; the todo
  // frequencies are only a stand-in before scheduling.
  const perWeek = (state.events && state.events.length && f.weeks)
    ? Math.round(state.events.length / f.weeks) : sessionsPerWeek(p);
  chip(t("chip_load"), fmt(t("per_week"), { n: perWeek }), true);

  updateGoalRail(p, false);
}

function updateGoalRail(p, shifted) {
  const band = $("goalBand");
  band.classList.toggle("shifted", !!shifted);

  const start = p.startDate;
  const finish = p.finishDate;
  const today = isoToday();

  $("lblStart").innerHTML = `${esc(t("lbl_started"))}<b>${esc(start ? prettyDate(start) : "—")}</b>`;
  $("lblNow").innerHTML = `${esc(t("lbl_today"))}<b>${esc(prettyDate(today))}</b>`;
  $("lblEnd").innerHTML = finish
    ? `${esc(t("lbl_finish"))}<b>${esc(prettyDate(finish))}</b>`
    : `${esc(t("lbl_finish"))}<b>${esc(fmt(t("weeks_approx"), { n: p.weeksTotal }))}</b>`;

  const pct = (start && finish) ? clamp(daysBetween(start, today) / Math.max(1, daysBetween(start, finish)), 0, 1) : 0;
  const left = (pct * 100).toFixed(1) + "%";
  $("railFill").style.width = left;
  $("tickNow").style.left = left;
  $("lblNow").style.left = left;
  // Only mark "today" while today is actually on the rail, and only label it
  // where the label won't sit on top of Started or Finish.
  const onRail = !!(start && finish && today >= start && today <= finish);
  $("tickNow").hidden = !onRail;
  $("lblNow").hidden = !onRail || pct < 0.09 || pct > 0.91;

  // Progress counts real sessions on the calendar, not recurring task rows.
  const prog = planProgress();
  $("gbProgress").textContent = start
    ? fmt(t("gb_progress"), { w: weekIndex(p), t: p.weeksTotal, d: prog.done, n: prog.total })
    : t("gb_unscheduled");

  const slipDays = (p.originalFinishDate && finish && p.originalFinishDate !== finish)
    ? daysBetween(p.originalFinishDate, finish) : 0;
  const slip = $("gbSlip");
  slip.classList.toggle("moved", slipDays > 0);
  slip.textContent = start ? (slipDays > 0 ? fmt(t("gb_moved"), { d: slipDays }) : t("gb_ontrack")) : "";

  updatePlanState(p, slipDays);
}

function weekIndex(p) {
  if (!p.startDate) return 1;
  return clamp(Math.floor(daysBetween(p.startDate, isoToday()) / 7) + 1, 1, p.weeksTotal || 1);
}

// The header shows the user's state, not the gateway's.
function updatePlanState(p, slipDays) {
  const wrap = $("planState");
  const dot = $("psDot");
  wrap.hidden = false;
  if (!p || !p.startDate) {
    dot.className = "ps-dot slipped";
    $("psText").textContent = t("ps_planning");
    return;
  }
  const behind = slipDays > 0;
  dot.className = "ps-dot" + (behind ? " slipped" : "");
  $("psText").textContent = behind
    ? fmt(t("ps_week_slip"), { w: weekIndex(p), t: p.weeksTotal, d: slipDays })
    : fmt(t("ps_week"), { w: weekIndex(p), t: p.weeksTotal });
}

// ── Plan tab: assessment, the spine, and the one task list ──
function renderPlan(p) {
  $("planEmpty").hidden = true;
  const box = $("planContent");
  box.hidden = false;
  box.innerHTML = "";

  const head = el("div", "plan-intro");
  head.innerHTML =
    `<p class="assessment">${esc(p.assessment)}</p>
     ${p.feasibility ? `<div class="reality">${WARN_SVG}<span>${esc(p.feasibility)}</span></div>` : ""}`;
  box.appendChild(head);

  // Roadmap and tasks sit side by side wherever there is room for both.
  const grid = el("div", "plan-grid");
  const colRoad = el("section");
  const colTasks = el("section");
  grid.appendChild(colRoad);
  grid.appendChild(colTasks);
  box.appendChild(grid);

  colRoad.appendChild(el("div", "section-label", t("roadmap")));
  const spine = el("ol", "spine");
  const phases = p.phases || [];
  const msByPhase = {};
  (p.milestones || []).forEach((m) => { (msByPhase[m.phase] = msByPhase[m.phase] || []).push(m); });
  const usedKeys = new Set(phases.map((ph) => ph.key));

  const msRow = (m) =>
    `<li class="ms"><span class="diam"></span><span>${esc(m.title)}</span><time>${esc(prettyDate(m.targetDate))}</time></li>`;

  phases.forEach((ph, idx) => {
    const li = el("li", "node phase");
    if (animateRows) li.style.animationDelay = idx * 0.06 + "s";
    const msHtml = (msByPhase[ph.key] || []).map(msRow).join("");
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
    li.innerHTML = `<span class="node-dot"></span><span class="wk">${esc(t("roadmap"))}</span><ul class="ms-list">${orphans.map(msRow).join("")}</ul>`;
    spine.appendChild(li);
  }

  const fin = el("li", "node finish");
  fin.innerHTML =
    `<span class="node-dot">${FLAG_SVG}</span>
     <span class="wk">${esc(t("target_finish"))}</span>
     <h4 id="spineFinishDate"></h4>
     <div class="shift" id="spineShift"></div>`;
  spine.appendChild(fin);
  colRoad.appendChild(spine);

  colTasks.appendChild(el("div", "section-label", t("tasks")));
  const stats = sessionStats();
  (p.todos || []).forEach((td, i) => {
    colTasks.appendChild(todoRow(td, i, stats[td.id] || stats[td.title] || null));
  });

  updateSpineFinish(p);
}

// One task row. These tasks recur, so the checkbox means "today's session is
// done" — it appears only on days the task is actually on, and it can be
// unticked. A running count keeps the long game visible.
// A todo is a recurring SERIES, not a checkbox. The server tracks how many of
// its sessions are done; completing marks exactly one of them and cannot be
// undone, so this offers "log the next session", never a toggle that would
// appear to cancel the whole series.
function todoRow(td, i, st) {
  const planned = Number.isFinite(td.plannedCount) && td.plannedCount > 0
    ? td.plannedCount : (st ? st.total : 0);
  const completed = Number.isFinite(td.completedCount) ? td.completedCount : (st ? st.done : 0);
  const status = td.status || (completed >= planned && planned > 0 ? "done" : "pending");
  const allDone = planned > 0 && completed >= planned;
  // Only a session that is actually on the calendar can be logged.
  const target = st && (st.today || st.nextEvent);
  const canLog = !!target && !allDone;

  const row = el("div", "todo series" + (allDone ? " done" : "") + (st && st.today ? " is-today" : ""));
  if (animateRows) row.style.animationDelay = Math.min(i * 0.04, 0.4) + "s";

  const check = el("span", "check" + (canLog ? "" : " idle"));
  if (canLog) {
    const btn = el("button", "log-btn", PLUS_SVG);
    btn.type = "button";
    btn.title = t("log_session");
    btn.setAttribute("aria-label", fmt(t("aria_log_session"), { title: td.title }));
    btn.onclick = () => completeSession(td.id, target.id, target.date);
    check.appendChild(btn);
  } else {
    check.innerHTML = `<span class="box">${allDone ? CHECK_SVG : ""}</span>`;
  }

  const pct = planned ? Math.round((completed / planned) * 100) : 0;
  const sched = planned
    ? `<div class="todo-sched">
         ${st && st.today
           ? `<span class="tag-today">${esc(t("today_tag"))}</span>`
           : st && st.next ? `<span>${esc(fmt(t("next_on"), { d: prettyDate(st.next) }))}</span>` : "<span></span>"}
         <span class="series-bar" role="img" aria-label="${esc(fmt(t("sess_done_of"), { d: completed, n: planned }))}">
           <i style="width:${pct}%"></i>
         </span>
         <span class="todo-prog">${esc(fmt(t("sess_done_of"), { d: completed, n: planned }))}</span>
       </div>`
    : "";

  const body = el("div", "todo-body");
  body.innerHTML =
    `<span class="t">${esc(td.title)}</span>
     <div class="todo-meta">
       <span class="weight" role="img" data-w="${esc(td.priority)}" aria-label="${esc(tg("prio", td.priority))}"><i></i><i></i><i></i></span>
       <span>${td.durationMin} ${esc(t("min"))}</span>
       <span>${esc(tg("freq", td.frequency))}</span>
       <span class="td-state" data-s="${esc(status)}">${esc(tg("tstatus", status))}</span>
       ${td.phase ? `<span class="ph">${esc(td.phase)}</span>` : ""}
     </div>
     ${sched}`;

  row.appendChild(check);
  row.appendChild(body);
  return row;
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
    shiftEl.textContent = t("finish_pending");
  }
}

function renderKit(items, budget) {
  const box = $("kitContent");
  box.innerHTML = "";
  if (!items.length) { $("kitEmpty").hidden = false; return; }
  $("kitEmpty").hidden = true;

  const priced = items.map((s) => {
    const n = String(s.priceRange || "").match(/\d+/g) || ["0"];
    return { ...s, lo: parseInt(n[0], 10) || 0, hi: parseInt(n[n.length - 1], 10) || 0 };
  });
  // With nothing to spend, "free path first" has to mean the order too.
  const ordered = budget === 0 ? priced.slice().sort((a, b) => a.lo - b.lo || a.hi - b.hi) : priced;

  // Walk the list cheapest-cost-first and mark where the budget runs out, so
  // the answer to "what can I actually get?" is on the page.
  let spent = 0;
  ordered.forEach((s, i) => {
    const affordable = budget == null || spent + s.lo <= budget;
    if (affordable) spent += s.lo;
    const c = el("div", "setup-card" + (affordable ? "" : " over"));
    if (animateRows) c.style.animationDelay = i * 0.05 + "s";
    c.innerHTML =
      `<div class="setup-rank">${i + 1}</div>
       <div class="setup-main">
         <div class="setup-row">
           <span class="setup-name">${esc(s.name)}</span>
           ${affordable ? "" : `<span class="setup-over">${esc(t("kit_item_over"))}</span>`}
           <span class="setup-price">${esc(s.priceRange)}</span>
         </div>
         ${s.category ? `<div class="setup-cat">${esc(s.category)}</div>` : ""}
         <div class="setup-why">${esc(s.rationale)}</div>
       </div>`;
    box.appendChild(c);
  });

  const lo = priced.reduce((n, s) => n + s.lo, 0);
  const hi = priced.reduce((n, s) => n + s.hi, 0);
  const freeCount = priced.filter((s) => s.hi === 0).length;

  const foot = el("div", "kit-foot");
  foot.innerHTML =
    `<span>${fmt(esc(t("kit_free")), { n: `<b>${freeCount}</b>`, m: `<b>${priced.length}</b>` })}</span>
     <span>${fmt(esc(t("kit_total")), { lo: `<b>${lo}</b>`, hi: `<b>${hi}</b>` })}</span>`;
  if (budget != null) {
    const verdict = budget === 0 ? "free" : hi <= budget ? "fits" : lo <= budget ? "tight" : "over";
    const v = el("span", "kit-verdict " + (verdict === "free" ? "tight" : verdict));
    v.textContent = budget === 0
      ? t("kit_v_free")
      : fmt(t(verdict === "fits" ? "kit_v_fits" : verdict === "tight" ? "kit_v_tight" : "kit_v_over"), { n: budget });
    foot.appendChild(v);
  }
  box.appendChild(foot);
}

// Completes exactly ONE session of a series. `eventId` says which; without it
// the server picks. There is no un-complete — the API does not offer one — so
// the UI does not pretend otherwise.
async function completeSession(todoId, eventId, date) {
  const keepScroll = $("paneScroll").scrollTop;
  try {
    const r = await api("/api/todo/complete", {
      method: "POST",
      body: JSON.stringify({ planId: state.planId, todoId, eventId }),
    });
    await loadPlan(state.planId, { animate: false });
    $("paneScroll").scrollTop = keepScroll;
    // Report the server's own count, not an assumption about it.
    if (r && Number.isFinite(r.completedCount) && Number.isFinite(r.plannedCount)) {
      toast(fmt(t("toast_session_done"), { d: r.completedCount, n: r.plannedCount, r: r.remaining }), "ok");
    } else {
      toast(t("toast_logged"), "ok");
    }
  } catch (e) {
    await handleApiError(e);
    if (state.planId) {
      try { await loadPlan(state.planId, { animate: false }); } catch (_) {}
      $("paneScroll").scrollTop = keepScroll;
    }
  }
}

// ── Schedule ──
// missesDeadline / deadlineSlipDays / deadlineNote / droppedSessions are the
// server telling the user the truth about their own timeline. Surfaced in the
// week view, styled as at-risk rather than as a failure.
function showScheduleNote(r) {
  const note = $("rollMsg");
  if (!r) { note.hidden = true; return; }
  const parts = [];
  if (r.deadlineNote) parts.push(String(r.deadlineNote));
  if (r.missesDeadline && Number.isFinite(r.deadlineSlipDays) && r.deadlineSlipDays > 0) {
    parts.push(fmt(t("gb_moved"), { d: r.deadlineSlipDays }));
  }
  if (Number.isFinite(r.droppedSessions) && r.droppedSessions > 0) {
    parts.push(fmt(t("sched_dropped"), { n: r.droppedSessions }));
  }
  if (!parts.length) { note.hidden = true; note.textContent = ""; return; }
  note.hidden = false;
  note.className = "roll-note";
  note.textContent = parts.join(" ");
}

async function schedule() {
  try {
    const r = await api("/api/schedule", { method: "POST", body: JSON.stringify({ planId: state.planId }) });
    state.weekStart = null;
    state.scheduled = true;
    await loadPlan(state.planId, { animate: false });
    // Backends that do not echo the dates back on GET still get them here.
    if (!state.plan.startDate) state.plan.startDate = r.startDate;
    if (!state.plan.finishDate) state.plan.finishDate = r.finishDate;
    if (!state.plan.originalFinishDate) state.plan.originalFinishDate = state.plan.finishDate;
    syncToolbar();
    updateSpineFinish(state.plan);
    updateGoalRail(state.plan, false);
    switchTab("week");
    renderWeek();
    // Honest feedback, not errors: the server says plainly when the timeline
    // does not fit, and that belongs in front of the user, not in a toast.
    showScheduleNote(r);
    toast(fmt(t("toast_scheduled"), { n: (state.events || []).length, d: prettyDate(state.plan.finishDate) }), "ok");
  } catch (e) { handleApiError(e); }
}

async function confirmSchedule() {
  try {
    await api("/api/schedule/confirm", { method: "POST", body: JSON.stringify({ planId: state.planId }) });
    await loadCalendar();
    toast(t("toast_confirmed"), "ok");
  } catch (e) { handleApiError(e); }
}

// Once it is scheduled, "Schedule it" stops being the primary thing to do.
function syncToolbar() {
  const done = state.scheduled;
  const btn = $("scheduleBtn");
  btn.classList.toggle("primary", !done);
  btn.textContent = t(done ? "btn_reschedule" : "btn_schedule");
  btn.dataset.i18n = done ? "btn_reschedule" : "btn_schedule";
  $("confirmBtn").disabled = !done;
  $("confirmBtn").classList.toggle("primary", done);
  $("rolloverBtn").disabled = !done;
  $("emptyScheduleBtn").disabled = !state.planId;
}

async function loadCalendar() {
  if (!state.planId) return;
  const raw = (await api("/api/calendar?planId=" + state.planId)) || [];
  // Backends that return bare events still get a real week grid: borrow the
  // duration and weight from the task the session came from.
  const byTitle = {};
  ((state.plan && state.plan.todos) || []).forEach((td) => { byTitle[td.title] = td; });
  state.events = raw.map((e) => {
    const td = byTitle[e.title];
    return {
      ...e,
      todoId: e.todoId || (td ? td.id : null),
      durationMin: e.durationMin != null ? e.durationMin : (td ? td.durationMin : null),
      priority: e.priority || (td ? td.priority : null),
    };
  });
  if (state.events.length) state.scheduled = true;
  syncToolbar();
  renderWeek();
  if (state.plan) updateGoalRail(state.plan, $("goalBand").classList.contains("shifted"));
}

// ── Week grid ──
// A week reads as a week: seven columns, real times, free days visible.
function mondayOf(iso) {
  const dt = new Date(iso + "T00:00:00Z");
  const shift = (dt.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(iso, -shift);
}
function renderWeek() {
  const events = state.events || [];
  $("weekEmpty").hidden = !!events.length;
  $("weekContent").hidden = !events.length;
  if (!events.length) return;

  const dates = events.map((e) => e.date).sort();
  const today = isoToday();
  if (!state.weekStart) {
    const thisWeek = mondayOf(today);
    const hasThisWeek = dates.some((d) => d >= thisWeek && d < addDays(thisWeek, 7));
    state.weekStart = hasThisWeek ? thisWeek : mondayOf(dates[0]);
  }
  const weekStart = state.weekStart;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const inWeek = events.filter((e) => e.date >= days[0] && e.date <= days[6]);

  // Days before the plan starts (or after it ends) aren't free time — they
  // aren't part of the plan at all, and shouldn't be offered as buffer.
  const planStart = (state.plan && state.plan.startDate) || dates[0];
  const planEnd = (state.plan && state.plan.finishDate) || dates[dates.length - 1];
  const outOfPlan = (d) => d < planStart || d > planEnd;

  const firstWeek = mondayOf(planStart);
  const lastWeek = mondayOf(dates[dates.length - 1]);
  $("wkPrev").disabled = firstWeek >= weekStart;
  $("wkNext").disabled = lastWeek <= weekStart;
  // "Today" is a shortcut back, so it is dead weight when you are already there.
  $("wkToday").disabled = clampWeek(mondayOf(today), firstWeek, lastWeek) === weekStart;
  $("wkRange").textContent = prettyDate(days[0]) + " – " + prettyDate(days[6]);

  // rows: only the hours this week actually uses
  const hours = [...new Set(inWeek.map((e) => String(e.startTime || "").slice(0, 2)))].sort();
  const byCell = {};
  inWeek.forEach((e) => {
    const key = e.date + "@" + String(e.startTime || "").slice(0, 2);
    (byCell[key] = byCell[key] || []).push(e);
  });
  const busyDays = new Set(inWeek.map((e) => e.date));

  const grid = $("wkGrid");
  grid.innerHTML = "";
  grid.appendChild(el("div", "wk-corner"));
  const dowNames = t("dow");
  const dayClass = (d) => (outOfPlan(d) ? " out" : busyDays.has(d) ? "" : " free");
  days.forEach((d, i) => {
    const h = el("div", "wk-h" + (d === today ? " today" : "") + dayClass(d));
    h.innerHTML = `<div class="dow">${esc(dowNames[i])}</div><div class="dnum">${esc(dayNum(d))}</div>`;
    grid.appendChild(h);
  });

  hours.forEach((hh) => {
    grid.appendChild(el("div", "wk-hr", esc(hh + ":00")));
    days.forEach((d, di) => {
      const cell = el("div", "wk-cell" + dayClass(d));
      (byCell[d + "@" + hh] || []).forEach((e) => {
        // proposed = not yet confirmed; shown provisionally, not as settled.
        const cls = e.status === "done" ? " done"
          : e.status === "rolled_over" ? " missed"
          : e.status === "proposed" ? " proposed"
          : (e.movedFrom ? " moved" : "");
        const s = el("div", "sess" + cls);
        // The grid is visual; spell the same facts out for anyone not seeing it.
        const parts = [e.title, dowNames[di] + " " + prettyDate(d), e.startTime];
        if (e.durationMin) parts.push(durText(e.durationMin));
        parts.push(tg("status", e.status));
        if (e.movedFrom) parts.push(fmt(t("moved_from"), { d: prettyDate(e.movedFrom) }));
        if (Number.isFinite(e.rolledOver) && e.rolledOver > 0) parts.push(fmt(t("rolled_n"), { n: e.rolledOver }));
        const label = parts.join(", ");
        s.title = label;
        s.setAttribute("role", "img");
        s.setAttribute("aria-label", label);
        s.innerHTML = `<b>${esc(e.title)}</b><span class="dur">${esc(e.startTime)} · ${e.durationMin ? esc(durText(e.durationMin)) : esc(tg("status", e.status))}</span>`;
        cell.appendChild(s);
      });
      grid.appendChild(cell);
    });
  });

  const mins = (s) => inWeek.filter(s).reduce((n, e) => n + (e.durationMin || 0), 0);
  $("wkLoad").innerHTML = fmt(esc(t("wk_load")), {
    s: `<b>${esc(durText(mins(() => true)))}</b>`,
    d: `<b>${esc(durText(mins((e) => e.status === "done")))}</b>`,
  });

  const freeDays = days.map((d, i) => (busyDays.has(d) || outOfPlan(d) ? null : dowNames[i])).filter(Boolean);
  const startsHere = planStart > days[0] && planStart <= days[6];
  $("wkHint").textContent = freeDays.length
    ? fmt(t(freeDays.length === 1 ? "wk_free_one" : "wk_free_many"), { days: freeDays.join(", ") })
    : startsHere ? fmt(t("wk_starts"), { d: prettyDate(planStart) })
    : days.every((d) => !outOfPlan(d)) ? t("wk_full") : "";
}

function durText(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return fmt(t("dur_m"), { m });
  return m ? fmt(t("dur_hm"), { h, m }) : fmt(t("dur_h"), { h });
}
function stepWeek(n) {
  if (!state.weekStart) return;
  state.weekStart = addDays(state.weekStart, n * 7);
  renderWeek();
}
function clampWeek(w, lo, hi) {
  return w < lo ? lo : w > hi ? hi : w;
}
// Jump back to the current week — or the nearest one the plan actually covers.
function goToday() {
  const dates = (state.events || []).map((e) => e.date).sort();
  if (!dates.length) return;
  const lo = mondayOf((state.plan && state.plan.startDate) || dates[0]);
  const hi = mondayOf(dates[dates.length - 1]);
  state.weekStart = clampWeek(mondayOf(isoToday()), lo, hi);
  renderWeek();
}

// ── Rollover (debug) ──
async function rollover() {
  try {
    const events = (await api("/api/calendar?planId=" + state.planId)) || [];
    if (!events.length) return;
    const firstDate = events.map((e) => e.date).sort()[0];
    const asOf = addDays(firstDate, 1);
    const r = await api("/api/rollover", { method: "POST", body: JSON.stringify({ userId: state.userId, asOf }) });

    await loadPlan(state.planId, { animate: false });
    const res = (r.results || [])[0];
    const shifted = !!(res && res.finishShiftDays > 0);
    updateSpineFinish(state.plan);
    updateGoalRail(state.plan, shifted);

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
  } catch (e) { handleApiError(e); }
}

// ── Dates ──
// Schedule dates are date-only calendar values. They are rendered from their
// own parts through a UTC-pinned formatter, so the day shown is the day the
// backend sent no matter where the device is — `new Date("2026-09-15")` would
// shift it west of UTC.
function ymd(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ""));
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}
function prettyDate(d) {
  const p = ymd(d);
  if (!p) return d;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const loc = { en: undefined, ru: "ru-RU", uz: "uz-UZ" }[LANG];
  return dt.toLocaleDateString(loc, { month: "short", day: "numeric", timeZone: "UTC" });
}
function dayNum(d) {
  const p = ymd(d);
  return p ? String(p.d) : d;
}
function addDays(d, n) {
  const dt = new Date(d + "T00:00:00Z"); // UTC-safe
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ── Meter (debug) ──
async function refreshMeter() {
  if (!DEBUG) return;
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
const TABS = ["plan", "week", "kit"];
function switchTab(name) {
  const i = TABS.indexOf(name);
  if (i < 0) return;
  $("seg").style.setProperty("--i", i);
  document.querySelectorAll(".seg-btn").forEach((tb) => {
    const on = tb.dataset.tab === name;
    tb.classList.toggle("active", on);
    tb.setAttribute("aria-selected", String(on));
    tb.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active", p.id === "pane-" + name));
  if (name === "week") renderWeek();
}
function focusTab(name) {
  switchTab(name);
  const btn = document.querySelector(`.seg-btn[data-tab="${name}"]`);
  if (btn) btn.focus();
}

// ── Wire up ──
document.querySelectorAll(".seg-btn").forEach((tb) => (tb.onclick = () => switchTab(tb.dataset.tab)));
$("seg").addEventListener("keydown", (e) => {
  const cur = TABS.indexOf(document.querySelector(".seg-btn.active").dataset.tab);
  if (e.key === "ArrowRight") focusTab(TABS[(cur + 1) % TABS.length]);
  else if (e.key === "ArrowLeft") focusTab(TABS[(cur - 1 + TABS.length) % TABS.length]);
  else if (e.key === "Home") focusTab(TABS[0]);
  else if (e.key === "End") focusTab(TABS[TABS.length - 1]);
  else return;
  e.preventDefault();
});

document.querySelectorAll("#langSwitch button").forEach((b) => (b.onclick = () => setLang(b.dataset.lang)));
$("themeToggle").onclick = toggleTheme;
$("dockToggle").onclick = () => setDock(!dockIsOpen());
$("composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
$("input").addEventListener("input", () => { $("sendBtn").disabled = busy || !$("input").value.trim(); });
$("scheduleBtn").onclick = schedule;
$("emptyScheduleBtn").onclick = schedule;
$("confirmBtn").onclick = confirmSchedule;
$("rolloverBtn").onclick = rollover;
$("wkPrev").onclick = () => stepWeek(-1);
$("wkNext").onclick = () => stepWeek(1);
$("wkToday").onclick = goToday;

// ── Sidebar wiring ──
$("newChatBtn").onclick = startNewChat;
$("sbCollapse").onclick = () => { setSidebar(false); $("sbOpen").focus(); };
$("sbOpen").onclick = () => { setSidebar(true); $("sbSearch").focus(); };
$("sbScrim").onclick = () => setSidebar(false);
$("sbSearch").addEventListener("input", renderChatList);
$("sbSearch").addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("sbSearch").value) { e.stopPropagation(); $("sbSearch").value = ""; renderChatList(); }
});
$("sbMenu").querySelectorAll("[data-act]").forEach((b) => {
  b.onclick = () => {
    const id = menuFor;
    closeChatMenu();
    if (!id) return;
    if (b.dataset.act === "rename") { renaming = id; renderChatList(); }
    else deleteChat(id);
  };
});
// ── Account + settings wiring ──
$("acctBtn").onclick = () => setAcctMenu(!acctOpen);
$("acctMenu").querySelectorAll("[data-act]").forEach((b) => {
  b.onclick = () => {
    const act = b.dataset.act;
    setAcctMenu(false);
    if (act === "reset") { openSettings("data"); askConfirm("ask_reset", resetAppData); }
    else openSettings(act === "settings" ? null : act === "shortcuts" ? "shortcuts" : act);
  };
});
$("setClose").onclick = closeSettings;
$("settings").addEventListener("pointerdown", (e) => { if (e.target === $("settings")) closeSettings(); });
$("setName").addEventListener("change", () => {
  const v = $("setName").value.trim();
  if (v) lsSet("startai_name", v); else lsDel("startai_name");
  syncAccount();
  toast(t("done_saved"), "ok");
});
$("themePick").querySelectorAll("button").forEach((b) => (b.onclick = () => applyTheme(b.dataset.themePref)));
$("langPick").querySelectorAll("button").forEach((b) => (b.onclick = () => { setLang(b.dataset.lang); syncSettings(); syncAccount(); }));
$("clearChatsBtn").onclick = () => askConfirm("ask_clear", clearAllChats);
$("resetBtn").onclick = () => askConfirm("ask_reset", resetAppData);
$("setConfirmNo").onclick = hideConfirm;
$("setConfirmYes").onclick = () => { const go = confirmAction; hideConfirm(); if (go) go(); };

// Keep focus inside the dialog while it owns the screen.
$("settings").addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const f = [...$("settings").querySelectorAll("button,input,[tabindex]:not([tabindex='-1'])")]
    .filter((n) => !n.disabled && n.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// A popover closes when you look away from it.
document.addEventListener("pointerdown", (e) => {
  if (!$("sbMenu").hidden && !e.target.closest("#sbMenu") && !e.target.closest(".sb-item-menu")) closeChatMenu();
  if (acctOpen && !e.target.closest("#acctMenu") && !e.target.closest("#acctBtn")) setAcctMenu(false);
});

// ── Keyboard shortcuts ──
document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "k") { e.preventDefault(); if (!sidebarOpen) setSidebar(true); $("sbSearch").focus(); $("sbSearch").select(); }
  else if (k === "b") { e.preventDefault(); setSidebar(!sidebarOpen); }
  else if (k === "o" && e.shiftKey) { e.preventDefault(); startNewChat(); }
});
window.addEventListener("resize", () => {
  // Coming back to a wide window should not leave the drawer state stranded.
  if (window.innerWidth > 940) setSidebar(lsGet("startai_sidebar") !== "0");
  closeChatMenu();
});

// Escape steps back out of whatever is layered on top: menu, then drawer, then
// the conversation dock.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("settings").hidden) { if (confirmAction) hideConfirm(); else closeSettings(); return; }
  if (acctOpen) { setAcctMenu(false); $("acctBtn").focus(); return; }
  if (!$("sbMenu").hidden) { closeChatMenu(); return; }
  if (window.innerWidth <= 940 && sidebarOpen) { setSidebar(false); $("sbOpen").focus(); return; }
  if (document.body.dataset.stage !== "plan" || !dockIsOpen()) return;
  setDock(false);
  $("dockToggle").focus();
});

// init: reflect saved language, reveal debug tooling only when asked, then boot
syncLangButtons();
if (DEBUG) { $("meter").hidden = false; $("rolloverBtn").hidden = false; }
setStage("intake");
applyI18n();
syncAccount();
// "System" keeps following the OS after the choice, so listen for the switch.
(function () {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => { if (themePref() === "system") applyTheme("system"); };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
boot();
