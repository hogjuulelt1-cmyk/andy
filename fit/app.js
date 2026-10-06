/* Тэнхээ · гэрийн фитнес. Static, no build. Data: Supabase docs table (fit/*) or localStorage. */
(function () {
"use strict";
const MOCK = location.search.includes("mock");
const CFG = MOCK ? {} : (window.APP_CONFIG || {});
const LKEY = MOCK ? "fit-state-mock" : "fit-state";
const E = window.FitEngine, LIB = window.FitLib, FOODS = window.FitFoods;
/* cloud docs → fields of S */
const DOCS = { profile: ["profile", "assessment", "tests"], program: ["program", "programs"], logs: ["logs"], body: ["weights", "steps"], settings: ["settings"] };

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => (n < 10 ? "0" : "") + n;
const isoOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const todayIso = () => isoOf(new Date());
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return isoOf(d); }
function dowOf(iso) { const d = new Date(iso + "T12:00:00").getDay(); return d === 0 ? 7 : d; }
function mondayOf(iso) { return addDays(iso, 1 - dowOf(iso)); }
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }
const DOW = ["", "Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const DOWL = ["", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
const MONTHS = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
function fmtD(iso) { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return MONTHS[d.getMonth()] + " сарын " + d.getDate(); }
function fmtShort(iso) { const d = new Date(iso + "T12:00:00"); return (d.getMonth() + 1) + "/" + d.getDate(); }
const ico = (n, cls) => '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
const sv = (id) => { const el = $(id); return el ? el.value : ""; };
const fmtN = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + pad(s % 60); }
function why(list, cls, max) { if (!list || !list.length) return ""; max = max || 3; const chip = (w) => "<span>" + ico("info") + esc(w) + "</span>"; const head = list.slice(0, max).map(chip).join(""); const tail = list.slice(max); return '<div class="why' + (cls ? " " + cls : "") + '">' + head + (tail.length ? '<button type="button" class="why-more" data-act="whymore" aria-expanded="false">+' + tail.length + ' шалтгаан</button><span class="why-rest" hidden>' + tail.map(chip).join("") + "</span>" : "") + "</div>"; }
function get(o, path) { return path.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function set(o, path, v) { const ks = path.split("."); let c = o; for (let i = 0; i < ks.length - 1; i++) { if (c[ks[i]] == null || typeof c[ks[i]] !== "object") c[ks[i]] = {}; c = c[ks[i]]; } c[ks[ks.length - 1]] = v; }

/* ---------- Supabase (plain REST, shares the diary's session) ---------- */
const SB = {
  url: (CFG.supabaseUrl || "").replace(/\/$/, ""), key: CFG.supabaseAnonKey || "", session: null,
  configured() { return !!(this.url && this.key); },
  loadSession() { try { this.session = JSON.parse(localStorage.getItem("cb-sb-session") || "null"); } catch (e) { this.session = null; } },
  storeSession(s) { this.session = s; try { s ? localStorage.setItem("cb-sb-session", JSON.stringify(s)) : localStorage.removeItem("cb-sb-session"); } catch (e) {} },
  async auth(body, grant) {
    const r = await fetch(this.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || "auth");
    this.storeSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email }); return this.session;
  },
  login(email, password) { return this.auth({ email, password }, "password"); },
  async token() {
    if (!this.session) throw new Error("noauth");
    if (Date.now() > this.session.exp - 60000) { try { await this.auth({ refresh_token: this.session.refresh }, "refresh_token"); } catch (e) { this.storeSession(null); throw new Error("noauth"); } }
    return this.session.access;
  },
  async req(path, opt) {
    opt = opt || {}; const t = await this.token();
    const r = await fetch(this.url + path, Object.assign({}, opt, { headers: Object.assign({ apikey: this.key, Authorization: "Bearer " + t }, opt.headers || {}) }));
    if (r.status === 401) { this.storeSession(null); throw new Error("noauth"); }
    if (!r.ok) throw new Error("http " + r.status); return r;
  },
  async list(prefix) { const r = await this.req("/rest/v1/docs?select=path,data&path=like." + encodeURIComponent(prefix + "*")); return r.json(); },
  set(path, data) { return this.req("/rest/v1/docs", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, data, updated_at: new Date().toISOString() }) }); },
};

/* ---------- state ---------- */
function blank() { return { profile: null, assessment: null, program: null, programs: [], logs: [], weights: [], steps: [], tests: [], settings: { theme: "system", saltTeaToday: null, obStep: 0, tab: "today" } }; }
function blankProfile() {
  return { v: 1, name: "", goals: [], womens: null, metabolic: [], sex: "f", age: null, heightCm: null, weightKg: null, waistCm: null, daysPerWeek: 3, minutes: 20,
    equipment: ["mat"], space: "floor", parq: [null, null, null, null, null, null, null], pain: [], sleepHours: 7, stress: 3, occupation: "desk",
    failedBefore: null, cue: "", diet: { mealsPerDay: 3, meatDaysPerWeek: 5, saltTeaCups: 2, vegServings: 1, sugaryDrinksPerDay: 0, snacksLate: false, budget: "mid" },
    tests: { pushups: null, pushupType: "knee", chairStand30: null, plankSec: null, balanceSec: null, toeTouch: null }, prefs: { dislikes: [], likes: [] }, createdAt: null };
}
let S = blank();
let mode = "local";
const UI = { tab: "today", ob: null, openDay: null, confirm: null, sheet: null, nutrition: null, testTimer: null, retest: false };
try { const t = localStorage.getItem("fit-tab"); if (t) UI.tab = t; } catch (e) {}

function normalize() {
  const b = blank();
  for (const k in b) if (S[k] === undefined) S[k] = b[k];
  if (!S.settings || typeof S.settings !== "object") S.settings = b.settings;
  for (const f in b.settings) if (S.settings[f] === undefined) S.settings[f] = b.settings[f];
  for (const k of ["programs", "logs", "weights", "steps", "tests"]) if (!Array.isArray(S[k])) S[k] = [];
  if (S.profile) { const bp = blankProfile(); for (const f in bp) if (S.profile[f] === undefined) S.profile[f] = bp[f]; for (const f in bp.diet) if (S.profile.diet[f] === undefined) S.profile.diet[f] = bp.diet[f]; for (const f in bp.tests) if (S.profile.tests[f] === undefined) S.profile.tests[f] = bp.tests[f]; }
}

/* ---------- persistence ---------- */
const dirty = {}, timers = {}, chains = {};
function setSync(k, msg) {
  const el = $("sync"); if (!el) return; el.className = "sync " + k;
  $("sync-t").textContent = msg || { ok: "Хадгалсан", saving: "Хадгалж байна…", local: "Зөвхөн энэ төхөөрөмж дээр", err: "Алдаа" }[k];
}
function docOf(field) { for (const d in DOCS) if (DOCS[d].includes(field)) return d; return "settings"; }
function save(field) {
  const key = docOf(field); dirty[key] = 1; setSync(mode === "cloud" ? "saving" : "local");
  clearTimeout(timers[key]); timers[key] = setTimeout(() => flush(key), 600);
}
function flush(key) {
  const run = async () => {
    try {
      if (mode === "cloud") { const d = {}; for (const f of DOCS[key]) d[f] = clone(S[f]); await SB.set("fit/" + key, d); }
      else localStorage.setItem(LKEY, JSON.stringify(S));
      delete dirty[key]; if (!Object.keys(dirty).length) setSync(mode === "cloud" ? "ok" : "local");
    } catch (e) { if (e.message === "noauth") showLogin("Дахин нэвтэрнэ үү."); else { setSync("err", "Хадгалж чадсангүй, дахин оролдоно"); setTimeout(() => flush(key), 5000); } }
  };
  chains[key] = (chains[key] || Promise.resolve()).then(run, run);
}
async function startCloud() {
  try {
    const rows = await SB.list("fit/");
    for (const r of rows) { const k = r.path.slice(4); if (DOCS[k] && r.data && typeof r.data === "object") for (const f of DOCS[k]) if (r.data[f] !== undefined) S[f] = r.data[f]; }
    normalize(); mode = "cloud"; applyTheme(); setSync("ok"); render();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !Object.keys(dirty).length) refresh(); });
  } catch (e) { if (e.message === "noauth") showLogin(); else { setSync("err", "Холбогдож чадсангүй"); console.error(e); startLocal(true); } }
}
async function refresh() {
  try { const rows = await SB.list("fit/"); let ch = false; for (const r of rows) { const k = r.path.slice(4); if (!DOCS[k] || dirty[k] || !r.data) continue; for (const f of DOCS[k]) if (r.data[f] !== undefined && JSON.stringify(S[f]) !== JSON.stringify(r.data[f])) { S[f] = r.data[f]; ch = true; } } if (ch) { normalize(); render(); } } catch (e) {}
}
function startLocal(keepSync) {
  try { const j = JSON.parse(localStorage.getItem(LKEY) || "null"); if (j) S = j; } catch (e) {}
  normalize(); mode = "local"; applyTheme(); if (!keepSync) setSync("local"); render();
}
function showLogin(msg) {
  UI.login = true; document.body.classList.add("bare");
  $("main").innerHTML = '<form class="login" id="login"><h1>Нэвтрэх</h1>' + (msg ? '<p class="muted">' + esc(msg) + "</p>" : '<p class="muted">Дэвтэртэйгээ нэг бүртгэлээр нэвтэрнэ.</p>') +
    '<div class="field"><label for="lg-e">Имэйл</label><input id="lg-e" type="email" autocomplete="username" required></div>' +
    '<div class="field"><label for="lg-p">Нууц үг</label><input id="lg-p" type="password" autocomplete="current-password" required></div>' +
    '<button class="btn lg" type="submit">Нэвтрэх</button><button class="link" type="button" data-act="login-skip">Нэвтрэхгүй, зөвхөн энэ төхөөрөмж дээр хадгалах</button></form>';
  setSync("local", "Нэвтрээгүй");
  $("login").addEventListener("submit", async (e) => { e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; try { await SB.login(sv("lg-e").trim(), sv("lg-p")); UI.login = false; document.body.classList.remove("bare"); startCloud(); } catch (err) { b.disabled = false; showLogin("Имэйл эсвэл нууц үг буруу байна."); } });
}

/* ---------- labels ---------- */
const GOALS = [["fatloss", "Жингээ хасах", "Бүсэлхий багасгаж, биеэ хөнгөрүүлэх"], ["muscle", "Булчин нэмэх, чангарах", "Хүчтэй болох"], ["posture_back", "Нуруу, биеийн байрлал", "Суугаа ажлын нурууны өвдөлт"], ["mobility", "Уян хатан байх", "Үе мөч чөлөөтэй хөдлөх"], ["stress_sleep", "Стресс, нойр", "Тайвшрах, сайн унтах"], ["fitness_energy", "Тэнхээ, эрч хүч", "Шатаар амьсгаадахгүй гарах"], ["womens", "Эмэгтэйчүүдийн эрүүл мэнд", "Жирэмслэлт, төрсний дараа, цэвэршилт"], ["metabolic", "Даралт, сахар, тулай", "Эмчийн хяналттай хамт"], ["older_balance", "Тэнцвэр, насжилт", "Унахаас сэргийлэх"], ["event_5k", "5 км гүйлтэд бэлдэх", "Марафоны богино зайд"], ["habit", "Хөдөлгөөнийг дадал болгох", "Жижгээс эхлэх"]];
const GOAL_N = Object.fromEntries(GOALS.map((g) => [g[0], g[1]]));
const METAB = [["htn", "Даралт ихсэлт"], ["t2d", "Чихрийн шижин (2-р хэлбэр)"], ["gout", "Тулай"], ["cholesterol", "Холестерин өндөр"]];
const STAGES = [["none", "Аль нь ч биш"], ["pregnancy", "Жирэмсэн"], ["postpartum", "Төрсний дараа"], ["menopause", "Цэвэршилтийн үе"]];
const EQUIP = [["none", "Юу ч байхгүй"], ["mat", "Дэвсгэр"], ["wall", "Хана"], ["chair", "Сандал"], ["band", "Резин"], ["db", "Гантель"], ["kb", "Гир"]];
const PAIN = [["knee", "Өвдөг"], ["lowback", "Бүсэлхий, нуруу"], ["neck", "Хүзүү"], ["shoulder", "Мөр"], ["wrist", "Бугуй"], ["hip", "Түнх"], ["ankle", "Шагай"]];
const PAIN_N = Object.fromEntries(PAIN);
const OCC = [["desk", "Суугаа ажил"], ["physical", "Биеийн ажил"], ["shift", "Ээлжийн ажил"], ["home", "Гэрийн ажил"], ["student", "Оюутан, сурагч"]];
const CUES = ["Өглөө цайны дараа", "Ажлаас ирээд", "Хүүхдээ унтуулсны дараа", "Үдийн завсарлагаанаар", "Унтахын өмнө"];
const PARQ = ["Эмч танд зүрхний өвчтэй гэж хэлж, зөвхөн эмчийн зөвшөөрсөн дасгал хийхийг зөвлөж байсан уу?", "Биеийн хөдөлгөөн хийх үед цээж өвддөг үү?", "Сүүлийн нэг сард хөдөлгөөн хийгээгүй байхдаа цээж өвдөж байсан уу?", "Толгой эргэж тэнцвэр алдах, ухаан алдах тохиолдол гарч байсан уу?", "Хөдөлгөөн хийвэл даамжирдаг яс, үе мөчний асуудал бий юү?", "Одоо даралт эсвэл зүрхний эм уудаг уу?", "Биеийн хөдөлгөөн хийж болохгүй өөр шалтгаан бий юү?"];
const TYPE_N = { strength: "Хүч", yoga: "Йога", pilates: "Пилатес", mobility: "Мобилити", walk: "Алхалт", breath: "Амьсгал", mix: "Холимог", cardio: "Кардио" };
const KIND_N = { session: "Хичээл", snack: "Зууш", walk: "Алхалт", rest: "Амралт" };
const FOCUS_N = { protein: ["Уураг", "Хоол бүрт нэг алганы хэмжээтэй уураг"], salt: ["Давс", "Давстай цай, даршилсан хоолыг багасгах"], veg: ["Ногоо", "Хоол бүрт нудрага ногоо"], sugar: ["Сахар", "Чихэрлэг ундааг усаар солих"], fiber: ["Ширхэг", "Хар талх, овъёос, ногоо"], water: ["Ус", "Өдөрт 30 мл/кг"], fat: ["Өөх", "Нөөцийн мах, өрөм хэмжээтэй"], timing: ["Цаг", "Орой хожуу идэхгүй"], alcohol: ["Архи", "Долоо хоногт 2-оос илүүгүй"], vitd: ["Витамин D", "Өвөл нэмэлтээр авах"] };
const GROUP_N = { protein: "Мах, өндөг, загас", dairy: "Цагаан идээ", grain: "Гурил, будаа", veg: "Ногоо", fruit: "Жимс", fat: "Тос, самар", drink: "Ундаа", dish: "Бэлэн хоол", snack: "Зууш, нэмэлт" };
const TEST_N = { pushups: "Түлхэлт", chairStand30: "Сандлаас босох (30 с)", plankSec: "Планк", balanceSec: "Нэг хөл дээр зогсох", toeTouch: "Хуруунд хүрэх" };
const TOE = [["floor", "Шаланд хүрнэ"], ["ankle", "Шагайд"], ["shin", "Шилбэнд"], ["knee", "Өвдөгт"]];
const rc = (type) => "--rc:var(--c-" + (TYPE_N[type] ? type : "mix") + ")";

/* ---------- derived ---------- */
const P = () => S.profile;
function nutrition() { if (!UI.nutrition && S.profile && S.assessment) { try { UI.nutrition = E.nutrition(S.profile, S.assessment); } catch (e) { console.error(e); UI.nutrition = null; } } return UI.nutrition; }
function reassess() { if (!S.profile) return; try { S.assessment = E.assess(S.profile); } catch (e) { console.error(e); } UI.nutrition = null; save("assessment"); }
function screenResult() { try { return E.screen(S.profile); } catch (e) { return { ok: true, stop: false, flags: [] }; } }
function logsFor(date) { return S.logs.filter((l) => l.date === date && l.done); }
function dayFor(iso) { const pr = S.program; if (!pr) return null; return pr.days.find((d) => d.dow === dowOf(iso)) || null; }
function progStart(program) { return (program.createdAt || (P() && P().createdAt) || todayIso()).slice(0, 10); }
function weekDone(program) { if (!program) return false; const start = mondayOf(progStart(program)); const ids = program.days.filter((d) => d.kind === "session" && d.session).map((d) => d.session.id); const logged = S.logs.filter((l) => l.done && daysBetween(start, l.date) >= 0 && ids.includes(l.sessionId)); return logged.length >= ids.length; }
function weekElapsed(program) { return program && daysBetween(progStart(program), todayIso()) >= 7; }
function stepsOn(iso) { const s = S.steps.find((x) => x.date === iso); return s ? s.n : null; }
function minutesOf(s) { let m = s.minutes; try { if (E.estimateMinutes) m = E.estimateMinutes(s) || m; } catch (e) {} return Math.max(1, Math.round(m || 0)); }
function descr(it) { try { return E.describeItem(it); } catch (e) { return it.seconds ? it.sets + " × " + it.seconds + " сек" : it.breaths ? it.sets + " × " + it.breaths + " амьсгал" : it.sets + " × " + it.reps + " давталт"; } }
function exName(id) { const e = LIB.byId(id); return e ? e.name : id; }

/* ======================= RENDER ======================= */
const TABS = [["today", "Өнөөдөр", "today"], ["program", "Хөтөлбөр", "program"], ["food", "Хоол", "food"], ["progress", "Ахиц", "progress"], ["me", "Би", "me"]];
function renderTabs() {
  $("tabs").innerHTML = TABS.map((t) => '<button data-act="tab" data-v="' + t[0] + '"' + (UI.tab === t[0] ? ' aria-current="page"' : "") + ">" + ico(t[2]) + t[1] + "</button>").join("");
}
function render(anim) {
  if (UI.login) return;
  const m = $("main"); const bare = !S.profile || !S.profile.createdAt || UI.ob;
  document.body.classList.toggle("bare", !!bare);
  if ((!S.profile || !S.profile.createdAt) && !UI.ob) m.innerHTML = viewStart();
  else if (UI.ob) m.innerHTML = viewOb();
  else { renderTabs(); m.innerHTML = (VIEWS[UI.tab] || VIEWS.today)(); }
  m.className = ""; if (anim) { void m.offsetWidth; m.className = anim; }
}
function go(anim) { render(anim); window.scrollTo(0, 0); }
let toastT; function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }

/* ---------- start ---------- */
function viewStart() {
  return '<div class="start"><h1>Тэнхээ</h1><p class="lead">Гэртээ, өөрт байгаа зүйлээрээ, өдөрт 10–30 минут хичээллэх хувийн хөтөлбөр. Хэдэн асуултад хариулахад таны долоо хоног бэлэн болно, дасгал бүрийн доор яагаад сонгосныг нь бичнэ.</p>' +
    '<button class="btn lg" data-act="ob-start">' + (S.profile ? "Үргэлжлүүлэх" : "Эхлэх") + "</button>"  + (SB.configured() && mode !== "cloud" ? '<button class="link" data-act="login">Нэвтрэх</button>' : "") +
    '<p class="muted small">Эмнэлгийн зөвлөгөө биш. Эрүүл мэндийн асуудалтай бол эмчтэйгээ зөвлөлдөөрэй.</p></div>';
}

/* ---------- onboarding ---------- */
function chipsM(field, opts, ordered) {
  const cur = get(P(), field) || [];
  return '<div class="chips" data-field="' + field + '">' + opts.map((o) => { const i = cur.indexOf(o[0]); return '<button type="button" class="chip' + (i >= 0 ? " on" : "") + '" data-act="toggle" data-f="' + field + '" data-v="' + o[0] + '" aria-pressed="' + (i >= 0) + '">' + (ordered && i >= 0 ? '<span class="ord">' + (i + 1) + "</span>" : "") + esc(o[1]) + "</button>"; }).join("") + "</div>";
}
const numAttr = (num) => (num === "bool" ? ' data-num="bool"' : num ? ' data-num="1"' : "");
function chips1(field, opts, num) {
  const cur = get(P(), field);
  return '<div class="chips">' + opts.map((o) => '<button type="button" class="chip' + (String(cur) === String(o[0]) ? " on" : "") + '" data-act="pick" data-f="' + field + '" data-v="' + o[0] + '"' + numAttr(num) + ' aria-pressed="' + (String(cur) === String(o[0])) + '">' + esc(o[1]) + "</button>").join("") + "</div>";
}
function seg(field, opts, num) {
  const cur = get(P(), field);
  return '<div class="seg" role="group">' + opts.map((o) => '<button type="button" data-act="pick" data-f="' + field + '" data-v="' + o[0] + '"' + numAttr(num) + ' aria-pressed="' + (String(cur) === String(o[0])) + '">' + esc(o[1]) + "</button>").join("") + "</div>";
}
function numField(field, label, unit, o) { o = o || {}; const v = get(P(), field); return '<div class="field"><label for="f-' + field.replace(/\./g, "-") + '">' + esc(label) + (unit ? ' <span class="muted">(' + unit + ")</span>" : "") + '</label><input id="f-' + field.replace(/\./g, "-") + '" type="number" inputmode="' + (o.dec ? "decimal" : "numeric") + '" data-f="' + field + '" data-num="1" value="' + (v == null ? "" : v) + '"' + (o.min != null ? ' min="' + o.min + '"' : "") + (o.max != null ? ' max="' + o.max + '"' : "") + (o.step ? ' step="' + o.step + '"' : "") + (o.ph ? ' placeholder="' + o.ph + '"' : "") + "></div>"; }
function scale(field, n) { const cur = get(P(), field); let h = '<div class="scale">'; for (let i = 1; i <= n; i++) h += '<button type="button" class="' + (cur === i ? "on" : "") + '" data-act="pick" data-f="' + field + '" data-v="' + i + '" data-num="1" aria-pressed="' + (cur === i) + '">' + i + "</button>"; return h + "</div>"; }

const OB = [
  { id: "goals", title: "Юуг хамгийн түрүүнд өөрчлөхийг хүсэж байна?", hint: "Гурав хүртэл сонгоно. Эхэлж сонгосон нь гол зорилго болно.",
    body: () => { const p = P(); return '<div class="opts">' + GOALS.map((g) => { const i = p.goals.indexOf(g[0]); return '<button type="button" class="opt' + (i >= 0 ? " on" : "") + '" data-act="toggle" data-f="goals" data-v="' + g[0] + '" data-max="3" aria-pressed="' + (i >= 0) + '"><span class="ord">' + (i >= 0 ? i + 1 : "") + '</span><span class="txt"><b>' + g[1] + "</b><small>" + g[2] + "</small></span></button>"; }).join("") + "</div>" +
      (p.goals.includes("metabolic") ? '<div class="field"><span class="lbl">Аль нь танд хамаатай вэ?</span>' + chipsM("metabolic", METAB) + "</div>" : ""); },
    valid: (p) => p.goals.length > 0 },
  { id: "about", title: "Таны тухай", hint: "Нас, хүйсээр норм, калорийн тооцоо өөр байдаг.",
    body: () => '<div class="field"><span class="lbl">Хүйс</span>' + seg("sex", [["f", "Эмэгтэй"], ["m", "Эрэгтэй"]]) + "</div>" + numField("age", "Нас", "", { min: 14, max: 90 }) + '<div class="field"><label for="f-name">Нэр <span class="muted">(заавал биш)</span></label><input id="f-name" type="text" data-f="name" value="' + esc(P().name) + '" autocomplete="given-name"></div>',
    valid: (p) => p.age >= 14 && p.age <= 90 },
  { id: "womens", title: "Одоо аль үе шатанд байна?", hint: "Жирэмсэн, төрсний дараах үед хөтөлбөр өөр байна.", when: (p) => p.sex === "f",
    body: () => { const w = P().womens || { stage: "none", trimester: null, weeksPostpartum: null }; return chips1("womens.stage", STAGES) +
      (w.stage === "pregnancy" ? '<div class="field"><span class="lbl">Хэд дэх гурван сар</span>' + seg("womens.trimester", [[1, "1-р"], [2, "2-р"], [3, "3-р"]], true) + "</div>" : "") +
      (w.stage === "postpartum" ? numField("womens.weeksPostpartum", "Төрснөөс хойш хэдэн долоо хоног", "", { min: 0, max: 104 }) : ""); },
    valid: (p) => !!(p.womens && p.womens.stage) && (p.womens.stage !== "pregnancy" || p.womens.trimester) && (p.womens.stage !== "postpartum" || p.womens.weeksPostpartum != null) },
  { id: "body", title: "Өндөр, жин, бүсэлхий", hint: "Бүсэлхийн тойрог нь жингээс илүү их зүйл хэлнэ.",
    body: () => '<div class="grid2">' + numField("heightCm", "Өндөр", "см", { min: 120, max: 220 }) + numField("weightKg", "Жин", "кг", { min: 30, max: 250, dec: true, step: "0.1" }) + "</div>" + numField("waistCm", "Бүсэлхий", "см", { min: 50, max: 200 }) +
      '<div class="waist"><svg viewBox="0 0 72 96" aria-hidden="true"><path d="M26 8c0-5 4-7 10-7s10 2 10 7-4 9-10 9-10-4-10-9z"/><path d="M14 30c4-8 12-10 22-10s18 2 22 10l3 22c0 10-4 16-6 22l-1 18H18l-1-18c-2-6-6-12-6-22z"/><path class="m" d="M16 50c6 3 14 4 20 4s14-1 20-4"/><path d="M12 36l-4 22M60 36l4 22"/></svg><p class="small muted">Хүйснээс дээш, хавирганы доод ирмэг ба түнхний ясны дундуур хэмжинэ. Амьсгалаа гаргаад, туузыг чангалахгүй.</p></div>',
    valid: (p) => p.heightCm >= 120 && p.weightKg >= 30 && p.waistCm >= 50 },
  { id: "schedule", title: "Долоо хоногт хэдэн өдөр, хэдэн минут?", hint: "Бодитой тоо сонго. Хоёр өдөр тогтмол хийх нь таван өдөр төлөвлөж орхихоос дээр.",
    body: () => '<div class="field"><span class="lbl">Өдөр</span>' + chips1("daysPerWeek", [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]], true) + '</div><div class="field"><span class="lbl">Нэг удаад, минут</span>' + chips1("minutes", [[10, "10"], [15, "15"], [20, "20"], [30, "30"], [45, "45"]], true) + "</div>",
    valid: (p) => p.daysPerWeek && p.minutes },
  { id: "equipment", title: "Гэрт юу байна?", hint: "Юу ч байхгүй бол биеийн жингээр л хийнэ.",
    body: () => '<div class="field">' + chipsM("equipment", EQUIP) + '</div><div class="field"><span class="lbl">Зай</span>' + chips1("space", [["floor", "Шалан дээр хэвтэх зай бий"], ["standing", "Зөвхөн зогсох зай"]]) + "</div>",
    valid: (p) => p.equipment.length > 0 && p.space },
  { id: "parq", title: "Эрүүл мэндийн 7 асуулт", hint: "PAR-Q+ олон улсын асуумж. Үнэнээр хариулаарай, таны аюулгүй байдлын төлөө.",
    body: () => '<div class="card">' + PARQ.map((q, i) => '<div class="yn"><span class="q">' + q + '</span><div class="seg" role="group" aria-label="' + (i + 1) + '-р асуулт"><button type="button" data-act="parq" data-i="' + i + '" data-v="0" aria-pressed="' + (P().parq[i] === false) + '">Үгүй</button><button type="button" data-act="parq" data-i="' + i + '" data-v="1" aria-pressed="' + (P().parq[i] === true) + '">Тийм</button></div></div>').join("") + "</div>",
    valid: (p) => p.parq.every((x) => x === true || x === false) },
  { id: "pain", title: "Одоо аль нь өвддөг вэ?", hint: "Тэр хэсэгт ачаалал өгөх дасгалыг хасна.",
    body: () => chipsM("pain", PAIN) + '<button type="button" class="chip' + (!P().pain.length ? " on" : "") + '" data-act="pain-none" aria-pressed="' + !P().pain.length + '" style="margin-top:8px">Өвддөггүй</button>',
    valid: () => true },
  { id: "life", title: "Нойр, стресс, ажил", hint: "Нойр бага бол эрчмийг бууруулна, суугаа ажилтай бол босох зууш нэмнэ.",
    body: () => '<div class="field"><span class="lbl">Шөнийн нойр, цаг</span>' + chips1("sleepHours", [[5, "5-аас бага"], [6, "6"], [7, "7"], [8, "8"], [9, "9-өөс их"]], true) + '</div><div class="field"><span class="lbl">Стресс, 1 тайван → 5 маш их</span>' + scale("stress", 5) + '</div><div class="field"><span class="lbl">Ажил</span>' + chips1("occupation", OCC) + "</div>",
    valid: (p) => p.sleepHours && p.stress && p.occupation },
  { id: "habit", title: "Өмнө нь дасгал эхлээд орхиж байсан уу?", hint: "Ихэнх хүн тийм. Тодорхой цагтай зангуу байвал орхих нь багасдаг.",
    body: () => seg("failedBefore", [["true", "Тийм, байсан"], ["false", "Үгүй"]], "bool") + '<div class="field"><span class="lbl">Хэзээ хийх вэ?</span>' + chips1("cue", CUES.map((c) => [c, c])) + '<input type="text" data-f="cue" value="' + esc(P().cue) + '" placeholder="Эсвэл өөрөө бич: Хүүхэд цэцэрлэгт явсны дараа"></div>',
    valid: (p) => p.failedBefore != null && p.cue },
  { id: "diet", title: "Хоолны зуршил", hint: "Хориг биш, хаанаас эхлэхийг л ойлгоход хэрэгтэй.",
    body: () => '<div class="field"><span class="lbl">Өдөрт хэдэн удаа хооллодог вэ</span>' + chips1("diet.mealsPerDay", [[2, "2"], [3, "3"], [4, "4 ба түүнээс олон"]], true) + '</div><div class="field"><span class="lbl">Долоо хоногт хэдэн өдөр мах иддэг вэ</span>' + chips1("diet.meatDaysPerWeek", [[0, "0"], [2, "1–2"], [4, "3–4"], [6, "5–6"], [7, "Өдөр бүр"]], true) +
      '</div><div class="field"><span class="lbl">Давстай сүүтэй цай, өдөрт аяга</span>' + chips1("diet.saltTeaCups", [[0, "0"], [1, "1"], [2, "2"], [3, "3"], [5, "4–5"], [7, "6-аас их"]], true) + '</div><div class="field"><span class="lbl">Ногоо, өдөрт порц</span>' + chips1("diet.vegServings", [[0, "Бараг үгүй"], [1, "1"], [2, "2"], [3, "3 ба түүнээс олон"]], true) +
      '</div><div class="field"><span class="lbl">Чихэрлэг ундаа, өдөрт</span>' + chips1("diet.sugaryDrinksPerDay", [[0, "0"], [1, "1"], [2, "2"], [3, "3 ба түүнээс олон"]], true) + '</div><div class="field"><span class="lbl">Орой хожуу зууш иддэг үү</span>' + seg("diet.snacksLate", [["true", "Тийм"], ["false", "Үгүй"]], "bool") +
      '</div><div class="field"><span class="lbl">Хоолны төсөв</span>' + seg("diet.budget", [["low", "Хэмнэлттэй"], ["mid", "Дундаж"], ["high", "Чөлөөтэй"]]) + "</div>",
    valid: () => true },
  { id: "tests", title: "Гэрийн тест", hint: "Заавал биш, гэхдээ түвшинг тань илүү нарийн тогтооно. 5 минут болно.", body: () => viewTests(false), valid: () => true, skip: true },
];
function obSteps() { return OB.filter((s) => !s.when || s.when(P())); }
function viewOb() {
  const steps = obSteps(); const i = Math.min(UI.ob.step, steps.length - 1); const st = steps[i]; const p = P();
  if (UI.ob.stop) return viewStop();
  if (UI.ob.step >= steps.length) return viewObDone();
  const edit = UI.ob.returnTo; const ok = st.valid(p);
  return '<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + steps.length + '" aria-valuenow="' + (i + 1) + '"><i style="width:' + Math.round(((i + 1) / steps.length) * 100) + '%"></i></div>' +
    '<div class="ob" data-step="' + st.id + '"><div><p class="muted small">' + (edit ? "Профайл засах" : (i + 1) + " / " + steps.length) + '</p><h1>' + st.title + '</h1>' + (st.hint ? '<p class="hint">' + st.hint + "</p>" : "") + "</div>" + st.body() +
    '<div class="ob-foot">' + (i > 0 || edit ? '<button type="button" class="btn ghost" data-act="ob-back">' + (edit ? "Болих" : "Буцах") + "</button>" : "") +
    (st.skip && !edit ? '<button type="button" class="btn quiet" data-act="ob-skip">Алгасах</button>' : "") +
    '<button type="button" class="btn" data-act="ob-next"' + (ok ? "" : " disabled") + ">" + (edit ? "Хадгалах" : i === steps.length - 1 ? "Дуусгах" : "Үргэлжлүүлэх") + "</button></div></div>";
}
function viewStop() {
  const r = screenResult();
  return '<div class="ob"><h1>Эхлэхээсээ өмнө эмчтэйгээ уулзаарай</h1>' + r.flags.map((f) => '<div class="note bad">' + esc(f.text) + "</div>").join("") +
    '<p>Эмчээс зөвшөөрөл аваад буцаж ирээрэй. Хариултууд тань хадгалагдсан тул дахин бөглөх шаардлагагүй, «Би» хэсгээс засаж болно.</p>' +
    '<div class="ob-foot"><button type="button" class="btn ghost" data-act="ob-goto" data-v="parq">Хариултаа харах</button><button type="button" class="btn" data-act="ob-save-stop">Профайлаа хадгалах</button></div></div>';
}
function viewObDone() {
  return '<div class="ob"><div class="prog"><i style="width:100%"></i></div><h1>Бэлэн боллоо</h1><p>Таны хариултаас долоо хоногийн хөтөлбөр, хоолны зорилт үүснэ. Дасгал бүрийн доор яагаад сонгосныг нь бичсэн байх болно.</p>' +
    '<div class="ob-foot"><button type="button" class="btn ghost" data-act="ob-back">Буцах</button><button type="button" class="btn lg" data-act="ob-finish">Хөтөлбөрөө харах</button></div></div>';
}
function obStart() { if (!S.profile) { S.profile = blankProfile(); save("profile"); } UI.ob = { step: S.settings.obStep || 0 }; go("enter-l"); }
function obSetStep(n) { UI.ob.step = n; if (!UI.ob.returnTo) { S.settings.obStep = n; save("settings"); } go(n > (UI.ob.prev || 0) ? "enter-l" : "enter-r"); UI.ob.prev = n; }
function obNext() {
  const steps = obSteps(); const st = steps[Math.min(UI.ob.step, steps.length - 1)];
  if (UI.ob.retest) { S.tests.push({ date: todayIso(), tests: clone(P().tests) }); save("tests"); finishEdit(); return; }
  if (st.id === "parq" && screenResult().stop) { UI.ob.stop = true; go("enter-l"); return; }
  if (UI.ob.returnTo) { finishEdit(); return; }
  obSetStep(UI.ob.step + 1);
}
function finishEdit() {
  const to = UI.ob.returnTo; UI.ob = null; UI.retest = false; stopTestTimer();
  if (S.profile.createdAt) { reassess(); save("profile"); toast("Хадгалсан"); }
  UI.tab = to; go("enter-r");
}
function buildAll() {
  const p = P();
  try {
    S.assessment = E.assess(p);
    S.program = E.buildProgram(p, S.assessment, { weekIndex: 0, prev: S.program || null, logs: S.logs, now: new Date().toISOString() });
    if (!S.program.createdAt) S.program.createdAt = new Date().toISOString();
    UI.nutrition = E.nutrition(p, S.assessment);
  } catch (e) { console.error(e); toast("Хөтөлбөр үүсгэхэд алдаа гарлаа"); return false; }
  save("assessment"); save("program"); return true;
}
function obFinish() {
  const p = P(); p.createdAt = p.createdAt || new Date().toISOString();
  if (screenResult().stop) { UI.ob.stop = true; go("enter-l"); return; }
  if (!buildAll()) return;
  if (p.tests && Object.values(p.tests).some((v) => v != null && v !== "knee" && v !== "full")) S.tests.push({ date: todayIso(), tests: clone(p.tests) });
  S.settings.obStep = 0; UI.ob = null; UI.tab = "today"; stopTestTimer();
  save("profile"); save("tests"); save("settings"); go("enter-l");
}

/* ---------- home tests ---------- */
const TESTS = [
  { id: "pushups", title: "Түлхэлт", how: "Өвдөг дээр эсвэл бүтэн. Цээж шаланд ойртох хүртэл буугаад бүрэн босно. Хэлбэр алдагдах хүртэл, аль болох олон.", timer: null, unit: "удаа" },
  { id: "chairStand30", title: "Сандлаас босох", how: "Гараа цээжин дээрээ зөрүүлж, 30 секундэд сандлаас хэдэн удаа бүрэн босож суухыг тоолно.", timer: { kind: "down", sec: 30 }, unit: "удаа" },
  { id: "plankSec", title: "Планк", how: "Тохой дээр, бие шулуун. Ташаа унах юм уу өргөгдөх хүртэл хэдэн секунд барихыг хэмжинэ.", timer: { kind: "up", max: 180 }, unit: "сек" },
  { id: "balanceSec", title: "Нэг хөл дээр зогсох", how: "Нүдээ нээлттэй, гараа ташаан дээр. Нөгөө хөл шаланд хүрэх хүртэл хэдэн секунд зогсохыг хэмжинэ (дээд тал нь 60).", timer: { kind: "up", max: 60 }, unit: "сек" },
  { id: "toeTouch", title: "Хуруунд хүрэх", how: "Хөлөө нийлүүлж зогсоод өвдгөө нугалалгүй доош бөхийнө. Гар хаана хүрч байна?", timer: null, unit: null },
];
function viewTests(standalone) {
  const t = P().tests; const T = UI.testTimer;
  const h = TESTS.map((ts) => {
    const run = T && T.id === ts.id;
    return '<div class="test"><div><h3>' + ts.title + '</h3><p class="small muted">' + ts.how + "</p></div>" +
      (ts.id === "pushups" ? seg("tests.pushupType", [["knee", "Өвдөг дээр"], ["full", "Бүтэн"]]) : "") +
      (ts.timer ? '<div class="tm"><span class="big num" id="tt-' + ts.id + '">' + (run ? mmss(T.show) : ts.timer.kind === "down" ? mmss(ts.timer.sec) : "0:00") + '</span><button type="button" class="btn quiet" data-act="test-timer" data-id="' + ts.id + '">' + ico("timer") + (run ? (T.running ? "Зогсоох" : "Дахин") : ts.timer.kind === "down" ? "30 с эхлүүлэх" : "Эхлүүлэх") + "</button></div>" : "") +
      (ts.id === "toeTouch" ? chips1("tests.toeTouch", TOE) : '<div class="field"><input type="number" inputmode="numeric" data-f="tests.' + ts.id + '" data-num="1" min="0" max="999" value="' + (t[ts.id] == null ? "" : t[ts.id]) + '" placeholder="' + ts.unit + '" aria-label="' + ts.title + ", " + ts.unit + '"></div>') + "</div>";
  }).join("");
  return '<div class="card">' + h + "</div>";
}
function testTimerToggle(id) {
  const ts = TESTS.find((x) => x.id === id); const T = UI.testTimer;
  if (T && T.id === id) { if (T.running) { stopTestTimer(false); if (ts.timer.kind === "up") { P().tests[id] = Math.round(T.show); save("profile"); } render(); return; } stopTestTimer(true); }
  const t0 = performance.now();
  UI.testTimer = { id, running: true, show: ts.timer.kind === "down" ? ts.timer.sec : 0, iv: setInterval(() => {
    const el = (performance.now() - t0) / 1000; const T2 = UI.testTimer; if (!T2) return;
    T2.show = ts.timer.kind === "down" ? Math.max(0, ts.timer.sec - el) : Math.min(ts.timer.max, el);
    const n = $("tt-" + id); if (n) n.textContent = mmss(T2.show);
    if ((ts.timer.kind === "down" && T2.show <= 0) || (ts.timer.kind === "up" && el >= ts.timer.max)) { stopTestTimer(false); if (ts.timer.kind === "up") { P().tests[id] = ts.timer.max; save("profile"); } try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} render(); }
  }, 250) };
  render();
}
function stopTestTimer(clear) { const T = UI.testTimer; if (!T) return; clearInterval(T.iv); if (clear === false) T.running = false; else UI.testTimer = null; }
/* ---------- today ---------- */
const VIEWS = {};
VIEWS.today = function () {
  const p = P(), pr = S.program, today = todayIso(); const r = screenResult();
  let h = '<p class="daylbl">' + DOWL[dowOf(today)] + ", " + fmtD(today) + (p.name ? " · " + esc(p.name) : "") + "</p>";
  if (r.stop) return h + '<div class="card"><h2>Эмчийн зөвшөөрөл хэрэгтэй</h2>' + r.flags.map((f) => '<div class="note bad">' + esc(f.text) + "</div>").join("") + '<button class="btn ghost" data-act="ob-edit" data-v="parq">Хариултаа засах</button></div>';
  if (!pr) return h + '<div class="card"><h2>Хөтөлбөр хараахан алга</h2><p class="muted">Хариултууд тань хадгалагдсан. Одоо хөтөлбөрөө үүсгэж болно.</p><button class="btn" data-act="build">Хөтөлбөр үүсгэх</button></div>';
  const d = dayFor(today); const logs = logsFor(today);
  if (d && d.session) {
    const s = d.session; const done = logs.some((l) => l.sessionId === s.id);
    h += '<div class="card rail hero" style="' + rc(s.type) + '"><div class="card-head"><div><p class="muted small">' + esc(KIND_N[d.kind] === (TYPE_N[s.type] || s.type) ? KIND_N[d.kind] : (KIND_N[d.kind] || "") + " · " + (TYPE_N[s.type] || s.type)) + '</p><h1>' + esc(s.title) + '</h1></div>' + (done ? '<span class="pill ok">Хийсэн</span>' : "") + "</div>" +
      '<div class="row"><span class="big">' + minutesOf(s) + '<small style="font-family:var(--body);font-size:.95rem;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:4px">мин</small></span></div>' +
      '<div class="blocks">' + s.blocks.map((b) => '<div class="bk"><b>' + esc(b.name) + "</b><span>" + b.items.map((it) => esc(exName(it.exId))).join(", ") + "</span></div>").join("") + "</div>" +
      '<button class="btn lg" data-act="play" data-id="' + s.id + '">' + ico("play") + (done ? "Дахин хийх" : "Эхлэх") + "</button>" + why((s.why || []).concat(d.why || [])) + "</div>";
  } else if (d && d.kind === "walk") {
    h += '<div class="card rail" style="--rc:var(--c-walk)"><p class="muted small">Алхалт</p><h1>Өнөөдөр алхана</h1><p>Урт хичээлгүй өдөр. Зорилтот алхамдаа хүрэх, эсвэл 10–20 минут ярьж чадах хурдтай алхах л хангалттай. Алхмаа доор бичээрэй.</p>' + why(d.why) + "</div>";
  } else if (d && d.kind === "snack") {
    h += '<div class="card rail" style="--rc:var(--c-mobility)"><p class="muted small">Зууш</p><h1>5 минутын зууш</h1><p>Өнөөдөр урт хичээлгүй. Нэг зууш хийгээд л болно.</p>' + why(d.why) + "</div>";
  } else if (d && d.kind === "rest") {
    h += '<div class="card rail" style="--rc:var(--c-breath)"><p class="muted small">Амралт</p><h1>Өнөөдөр амарна</h1><p>Булчин амрах үедээ хүчтэй болдог. Хүсвэл доорх зуушийн аль нэгийг хийж болно.</p>' + why(d.why) + "</div>";
  }
  /* steps */
  const st = stepsOn(today), tgt = pr.stepsTarget || 0;
  h += '<div class="card"><div class="card-head"><h2>Алхам</h2><span class="tag">зорилт ' + fmtN(tgt) + "</span></div>" +
    '<div class="row"><span class="big" style="font-size:1.8rem">' + (st == null ? "–" : fmtN(st)) + '</span><div class="grow"><div class="bar' + (st >= tgt ? " ok" : "") + '"><i style="width:' + (st ? Math.min(100, Math.round((st / tgt) * 100)) : 0) + '%"></i></div></div></div>' +
    '<form class="row" id="steps-form"><input type="number" inputmode="numeric" id="steps-n" min="0" max="100000" placeholder="Өнөөдрийн алхам" aria-label="Өнөөдрийн алхам" value="' + (st == null ? "" : st) + '"><button class="btn quiet" type="submit">Бичих</button></form></div>';
  /* snacks */
  if (pr.snacks && pr.snacks.length) h += '<div class="card"><h2>Өдөр бүрийн зууш</h2><div class="list">' + pr.snacks.map((s) => '<button class="li" data-act="play" data-id="' + s.id + '"><span class="dot-c" style="' + rc(s.type) + '"></span><span class="txt"><b>' + esc(s.title) + "</b><small>" + minutesOf(s) + " мин · " + s.blocks.reduce((n, b) => n + b.items.length, 0) + " дасгал</small></span>" + ico("play") + "</button>").join("") + "</div>" + why((pr.snacks[0] || {}).why) + "</div>";
  if (logs.length) h += '<div class="card"><h2>Өнөөдрийн тэмдэглэл</h2><div class="list">' + logs.map((l) => '<div class="li"><span class="txt"><b>' + esc(sessTitle(l.sessionId)) + "</b><small>RPE " + l.rpe + " · " + l.minutes + " мин" + (l.pain && l.pain.length ? " · өвдсөн: " + l.pain.map((x) => PAIN_N[x] || x).join(", ") : "") + "</small></span></div>").join("") + "</div></div>";
  return h;
};
function sessTitle(id) { const s = findSession(id); return s ? s.title : "Хичээл"; }
function findSession(id) { const pr = S.program; if (!pr) return null; for (const d of pr.days) if (d.session && d.session.id === id) return d.session; for (const s of pr.snacks || []) if (s.id === id) return s; for (const old of S.programs) for (const d of old.days || []) if (d.session && d.session.id === id) return d.session; return null; }

/* ---------- program ---------- */
VIEWS.program = function () {
  const pr = S.program, p = P(); if (!pr) return '<div class="empty">Хөтөлбөр алга.</div>';
  const today = todayIso(), start = mondayOf(progStart(pr));
  let h = "";
  let due = false; try { due = E.retestDue(p, S.logs, new Date()); } catch (e) {}
  if (due) h += '<div class="note warn row between"><span>4 долоо хоног өнгөрлөө, гэрийн тестээ дахин хийх цаг.</span><button class="btn quiet" data-act="retest">Дахин тест</button></div>';
  h += '<div class="card"><div class="card-head"><div><p class="muted small">' + ({ base: "Суурь үе", build: "Ачааллын үе", deload: "Амраах үе" }[pr.phase] || "") + '</p><h1>' + esc(pr.title) + "</h1></div></div>" +
    '<div class="stats"><div class="stat"><span class="big">' + pr.days.filter((d) => d.kind === "session").length + '</span><span>хичээл</span></div><div class="stat"><span class="big">' + fmtN(pr.stepsTarget || 0) + '</span><span>алхам / өдөр</span></div><div class="stat"><span class="big">' + p.minutes + '</span><span>мин / хичээл</span></div></div>' +
    (pr.notes && pr.notes.length ? '<p class="small muted">' + esc(pr.notes[0]) + "</p>" : "") + why((S.assessment || {}).why) + "</div>";
  h += '<div class="card"><div class="list">' + pr.days.map((d) => {
    const iso = addDays(start, d.dow - 1); const s = d.session; const open = UI.openDay === d.dow;
    const done = s ? logsFor(iso).some((l) => l.sessionId === s.id) : false;
    let row = '<button class="li" data-act="day" data-v="' + d.dow + '" aria-expanded="' + open + '"><span class="dw' + (done ? " done" : s ? " on" : "") + (iso === today ? " today" : "") + '">' + DOW[d.dow] + '</span><span class="txt"><b>' + esc(s ? s.title : d.kind === "rest" ? "Амралт" : d.kind === "snack" ? "Зууш" : "Алхалт") + "</b><small>" + (s ? esc(TYPE_N[s.type] || s.type) + " · " + minutesOf(s) + " мин" : d.kind === "rest" ? "Бүрэн амралт" : d.kind === "snack" ? "5 минутын зууш л хангалттай" : d.kind === "walk" ? "Хичээлгүй, зорилт " + fmtN(pr.stepsTarget || 0) + " алхам" : KIND_N[d.kind]) + (done ? " · хийсэн" : "") + "</small></span>" + (s || (d.why || []).length ? ico("chevron", "chev") : "") + "</button>";
    if (open) {
      row += '<div class="items">' + why(d.why) + (s ? s.blocks.map((b) => '<div class="blk"><h3>' + esc(b.name) + "</h3>" + b.items.map((it) => { const ex = LIB.byId(it.exId); return '<div class="it"><span class="nm">' + esc(ex ? ex.name : it.exId) + (it.sides === "each" ? ' <span class="muted small">зүүн/баруун</span>' : "") + '</span><span class="ds">' + esc(descr(it)) + (it.rest ? " · амралт " + it.rest + " с" : "") + (it.tempo ? " · темп " + esc(it.tempo) : "") + "</span>" + why(it.why) + "</div>"; }).join("") + "</div>").join("") + why(s.why) + '<button class="btn quiet" data-act="play" data-id="' + s.id + '">' + ico("play") + "Эхлэх</button>" : "") + "</div>";
    }
    return row;
  }).join("") + "</div></div>";
  const ready = weekDone(pr) || weekElapsed(pr);
  if (ready) h += '<button class="btn lg wide" data-act="next-week">Дараагийн долоо хоног</button>';
  else h += '<p class="muted small" style="text-align:center">Долоо хоногийн хичээлүүдээ дуусгасны дараа дараагийн долоо хоног нээгдэнэ.</p>';
  if (S.programs.length) h += '<p class="muted small" style="text-align:center">Өмнөх долоо хоног: ' + S.programs.length + "</p>";
  return h;
};
function nextWeek() {
  const pr = S.program, p = P(); let res;
  try { res = E.adapt(pr, p, S.logs); } catch (e) { console.error(e); res = { changes: [], nextOpts: {} }; }
  let np; try { np = E.buildProgram(p, S.assessment, Object.assign({ weekIndex: (pr.weekIndex || 0) + 1, prev: pr, logs: S.logs, now: new Date().toISOString() }, res.nextOpts || {})); if (!np.createdAt) np.createdAt = new Date().toISOString(); } catch (e) { console.error(e); toast("Хөтөлбөр үүсгэхэд алдаа гарлаа"); return; }
  S.programs.push(pr); if (S.programs.length > 12) S.programs.shift(); S.program = np; UI.openDay = null; save("program");
  openSheet("Юу өөрчлөгдөв", '<p class="muted">' + esc(np.title) + "</p>" + (res.changes && res.changes.length ? '<ul class="changes">' + res.changes.map((c) => "<li>" + esc(c.text) + "</li>").join("") + "</ul>" : "<p>Том өөрчлөлт алга, ижил бүтцээр үргэлжилнэ.</p>") + why((np.notes || []).filter((n) => !(res.changes || []).some((c) => c.text === n))), { ok: "Ойлголоо" });
  render();
}

/* ---------- food ---------- */
const HANDS = { protein: ["Алга", "уураг", '<path d="M10 30V15a2 2 0 0 1 4 0v8V9a2 2 0 0 1 4 0v14V8a2 2 0 0 1 4 0v15V11a2 2 0 0 1 4 0v12c0 5-3 8-8 8h-2c-4 0-6-3-6-6z"/>'], veg: ["Нудрага", "ногоо", '<path d="M8 20v-5c0-2 1.5-3 3-3h11c3 0 5 2 5 5v5c0 4-3 7-7 7h-5c-4 0-7-3-7-7z"/><path d="M11 12v-1a2 2 0 0 1 4 0v1M15 11a2 2 0 0 1 4 0v1M19 11a2 2 0 0 1 4 0v1"/>'], carb: ["Атга", "гурил, будаа", '<path d="M6 17c2 6 6 10 11 10s9-4 11-10"/><path d="M6 17c0-3 2-5 4-5h14c2 0 4 2 4 5"/><path d="M10 12v-2a2 2 0 0 1 4 0v2M14 10a2 2 0 0 1 4 0v2M18 10a2 2 0 0 1 4 0v2"/>'], fat: ["Эрхий", "өөх, тос", '<path d="M14 30V12a3 3 0 0 1 6 0v18"/><path d="M14 18c-3 0-5 2-5 5v7M20 18c3 0 5 2 5 5v7"/>'] };
VIEWS.food = function () {
  const p = P(), N = nutrition(); if (!N) return '<div class="empty">Хоолны тооцоо алга.</div>';
  const today = todayIso(); const salt = S.settings.saltTeaToday && S.settings.saltTeaToday.date === today ? S.settings.saltTeaToday.n : 0;
  const m = new Date().getMonth() + 1;
  let h = '<div class="card"><div class="card-head"><h2>Өдрийн зорилт</h2>' + (N.deficit ? '<span class="tag">' + (N.deficit > 0 ? "+" : "") + N.deficit + " ккал</span>" : "") + "</div>" +
    '<div class="stats"><div class="stat"><span class="big">' + N.targetKcal + '</span><span>ккал</span></div><div class="stat"><span class="big mid">' + N.proteinG[0] + "–" + N.proteinG[1] + '</span><span>г уураг</span></div><div class="stat"><span class="big">' + N.waterL + '</span><span>л ус</span></div></div>' +
    (N.refuse ? '<div class="note warn">' + esc(N.refuse) + "</div>" : "") +
    '<p class="small muted">Хоол бүрт, гарын хэмжээгээр:</p><div class="hands">' + Object.keys(HANDS).map((k) => '<div class="hand"><svg viewBox="0 0 34 34" aria-hidden="true">' + HANDS[k][2] + "</svg><b>×" + (N.hands[k] || 0) + "</b><small>" + HANDS[k][0] + "<br>" + HANDS[k][1] + "</small></div>").join("") + "</div>" + why(N.why) + "</div>";
  /* focus */
  h += '<div class="card"><h2>Гурван зүйлд анхаар</h2><div class="list">' + (N.focus || []).slice(0, 3).map((f, i) => { const fn = FOCUS_N[f] || [f, ""]; return '<div class="li"><span class="dw on">' + (i + 1) + '</span><span class="txt"><b>' + fn[0] + "</b><small>" + fn[1] + "</small></span></div>"; }).join("") + "</div></div>";
  /* salt tea */
  if (N.saltTeaCups) h += '<div class="card"><div class="card-head"><h2>Давстай цай өнөөдөр</h2><span class="tag">зорилт ' + N.saltTeaCups.target + " аяга</span></div>" +
    '<div class="row between"><div class="stepper"><button type="button" data-act="salt" data-v="-1" aria-label="Нэг аяга хасах">' + ico("minus") + '</button><span class="big">' + salt + '</span><button type="button" data-act="salt" data-v="1" aria-label="Нэг аяга нэмэх">' + ico("plus") + "</button></div>" + (salt > N.saltTeaCups.target ? '<span class="pill warn">зорилтоос ' + (salt - N.saltTeaCups.target) + " аягаар их</span>" : salt ? '<span class="pill ok">зорилтод багтаж байна</span>' : "") + "</div>" + why([N.saltTeaCups.text]) + "</div>";
  /* meals */
  h += '<div class="card"><h2>Өнөөдрийн хоол</h2><div class="list">' + (N.meals || []).map((ml) => '<div class="meal"><div class="mh"><h3>' + esc(ml.name) + '</h3><span class="tag">' + ml.kcal + " ккал · " + ml.protein + " г уураг</span></div><ul>" + ml.items.map((it) => { const f = FOODS.byId(it.foodId); return "<li><span>" + esc(f ? f.name : it.foodId) + (f && f.estimate ? '<span class="est" title="Тооцоолсон">≈</span>' : "") + "</span><span>" + esc(it.amount) + "</span></li>"; }).join("") + "</ul>" + why(ml.why) + "</div>").join("") + '</div><p class="small muted">≈ тэмдэгтэй хүнсний найрлага тооцоолсон тоо. Монгол хүнсний албан ёсны хүснэгт байхгүй.</p></div>';
  /* shopping */
  const groups = {}; for (const s of N.shopping || []) { const f = FOODS.byId(s.foodId); const g = f ? f.group : "snack"; (groups[g] = groups[g] || []).push({ f, s }); }
  h += '<div class="card"><h2>Дэлгүүрийн жагсаалт</h2><div class="shop">' + Object.keys(groups).map((g) => "<h3>" + (GROUP_N[g] || g) + "</h3>" + groups[g].map(({ f, s }) => '<div class="si"><b>' + esc(f ? f.name : s.foodId) + (f && f.estimate ? '<span class="est">≈</span>' : "") + "</b><small>" + esc(shopNote(s, f)) + "</small></div>").join("")).join("") + "</div></div>";
  /* season */
  const tips = []; const T = FOODS.tips || {};
  if (N.vitD && N.vitD.show) tips.push(N.vitD.text);
  if (m >= 11 || m <= 3) tips.push(...(T.winter || []).slice(0, 1));
  if (m === 1 || m === 2) tips.push(...(T.tsagaansar || []).slice(0, 1));
  if (m === 6 || m === 7) tips.push(...(T.naadam || []).slice(0, 1));
  if ((p.diet || {}).saltTeaCups >= 2) tips.push(...(T.salt || []).slice(0, 1));
  if ((p.diet || {}).budget === "low") tips.push(...(T.budget || []).slice(0, 1));
  if (tips.length) h += '<div class="card"><h2>Энэ улиралд</h2><ul class="tips">' + tips.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul></div>";
  return h;
};

function shopNote(s, f) {
  const note = s.note || ""; const parts = [note];
  for (const x of (f && f.brands || []).concat(f && f.where || [])) if (!note.includes(x) && !parts.includes(x)) parts.push(x);
  if (f && f.price) parts.push(fmtN(f.price.mnt) + " ₮/" + f.price.unit + (f.price.estimate ? " орчим" : ""));
  return parts.filter(Boolean).join(" · ");
}

/* ---------- progress ---------- */
VIEWS.progress = function () {
  const p = P(), today = todayIso(); const ws = S.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const last = ws[ws.length - 1]; const first = ws[0];
  let h = '<div class="card"><div class="card-head"><h2>Жин, бүсэлхий</h2>' + (last ? '<span class="tag">сүүлд ' + fmtD(last.date) + "</span>" : "") + "</div>" +
    '<div class="stats"><div class="stat"><span class="big">' + (last ? last.kg : p.weightKg || "–") + '<small>кг</small></span><span>' + (first && last && ws.length > 1 ? (last.kg - first.kg > 0 ? "+" : "") + (last.kg - first.kg).toFixed(1).replace("-", "\u2212") + " кг эхнээс" : "жин") + '</span></div><div class="stat"><span class="big">' + (last && last.waist ? last.waist : p.waistCm || "–") + '<small>см</small></span><span>бүсэлхий</span></div>' + (S.assessment ? '<div class="stat"><span class="big">' + S.assessment.whtr + '</span><span>бүсэлхий/өндөр ' + ({ ok: "хэвийн", watch: "анхаарах", high: "өндөр" }[S.assessment.whtrBand] || "") + "</span></div>" : "") + "</div>" +
    (ws.length >= 2 ? chart(ws) + '<div class="legend"><span><i></i>Дундаж (EMA)</span><span><i class="raw"></i>Хэмжилт</span></div>' : '<p class="muted small">Хоёроос олон хэмжилт орвол график гарна. Долоо хоногт нэг удаа, өглөө хоосон гэдсэн дээр хэмжвэл хамгийн зөв.</p>') +
    '<form id="w-form" class="stack"><div class="grid3"><div class="field"><label for="w-d">Огноо</label><input id="w-d" type="date" value="' + today + '" max="' + today + '"></div><div class="field"><label for="w-kg">Жин, кг</label><input id="w-kg" type="number" inputmode="decimal" step="0.1" min="30" max="250" required></div><div class="field"><label for="w-w">Бүсэлхий, см</label><input id="w-w" type="number" inputmode="numeric" min="50" max="200"></div></div><button class="btn quiet" type="submit">Бичих</button></form></div>';
  /* steps */
  const st = stepsOn(today), tgt = S.program ? S.program.stepsTarget : 0; const week = []; for (let i = 6; i >= 0; i--) { const d = addDays(today, -i); week.push({ d, n: stepsOn(d) }); }
  h += '<div class="card"><div class="card-head"><h2>Алхам</h2><span class="tag">зорилт ' + fmtN(tgt) + '</span></div><div class="row"><span class="big" style="font-size:1.8rem">' + (st == null ? "–" : fmtN(st)) + '</span><div class="grow"><div class="bar' + (st >= tgt && tgt ? " ok" : "") + '"><i style="width:' + (st && tgt ? Math.min(100, Math.round((st / tgt) * 100)) : 0) + '%"></i></div></div></div>' +
    '<div class="weeks" aria-label="Сүүлийн 7 өдөр">' + week.map((w) => '<i class="' + (w.n != null && tgt && w.n >= tgt ? "hit" : "") + (w.d === today ? " cur" : "") + '" title="' + fmtShort(w.d) + '"></i>').join("") + "</div>" +
    '<form class="row" id="steps-form"><input type="number" inputmode="numeric" id="steps-n" min="0" max="100000" placeholder="Өнөөдрийн алхам" aria-label="Өнөөдрийн алхам" value="' + (st == null ? "" : st) + '"><button class="btn quiet" type="submit">Бичих</button></form></div>';
  /* streak */
  const sk = streak(); h += '<div class="card"><div class="card-head"><h2>Долоо хоногийн стрик</h2><span class="tag">' + p.daysPerWeek + " хичээл / 7 хоног</span></div>" +
    '<div class="stats"><div class="stat"><span class="big">' + sk.streak + '</span><span>дараалсан долоо хоног</span></div><div class="stat"><span class="big">' + sk.thisWeek + "/" + p.daysPerWeek + '</span><span>энэ долоо хоногт</span></div><div class="stat"><span class="big">' + S.logs.filter((l) => l.done).length + '</span><span>нийт хичээл</span></div></div>' +
    '<div class="weeks" aria-label="Сүүлийн 8 долоо хоног">' + sk.weeks.map((w, i) => '<i class="' + (w.hit ? "hit" : "") + (i === sk.weeks.length - 1 ? " cur" : "") + '"></i>').join("") + "</div>" +
    '<p class="small muted">Стрик өдрөөр биш, долоо хоногоор тоологдоно. Нэг өдөр алгассан ч долоо хоногийн зорилтоо биелүүлбэл хэвээр.</p></div>';
  /* tests */
  const hist = S.tests.slice().sort((a, b) => b.date.localeCompare(a.date));
  h += '<div class="card"><div class="card-head"><h2>Гэрийн тест</h2><button class="btn quiet" data-act="retest">Дахин тест</button></div>' +
    (hist.length ? '<div class="list">' + hist.map((t) => '<div class="li"><span class="txt"><b>' + fmtD(t.date) + "</b><small>" + Object.keys(TEST_N).filter((k) => t.tests[k] != null).map((k) => TEST_N[k] + ": " + (k === "toeTouch" ? (Object.fromEntries(TOE)[t.tests[k]] || t.tests[k]) : t.tests[k] + (k === "pushups" ? (t.tests.pushupType === "full" ? " бүтэн" : " өвдөг") : k.endsWith("Sec") ? " с" : ""))).join(" · ") + "</small></span></div>").join("") + "</div>" : '<p class="muted small">Тест хийгээгүй байна. 5 минут зарцуулбал түвшин тань тодорхой болно.</p>') +
    (S.assessment && S.assessment.tests ? why(Object.values(S.assessment.tests).filter((t) => t && t.value != null && t.text).map((t) => t.text)) : "") + "</div>";
  return h;
};
function streak() {
  const p = P(), need = p.daysPerWeek || 1; const cur = mondayOf(todayIso()); const weeks = [];
  for (let i = 7; i >= 0; i--) { const mon = addDays(cur, -7 * i); const n = S.logs.filter((l) => l.done && daysBetween(mon, l.date) >= 0 && daysBetween(mon, l.date) < 7).length; weeks.push({ mon, n, hit: n >= need }); }
  let streak = 0; for (let i = weeks.length - 1; i >= 0; i--) { if (weeks[i].hit) streak++; else if (i === weeks.length - 1) continue; else break; }
  return { streak, thisWeek: weeks[weeks.length - 1].n, weeks };
}
function chart(ws) {
  const W = 600, H = 190, L = 36, R = 10, T = 12, B = 26; const pts = ws.slice(-26);
  const ema = []; let e = null; for (const w of pts) { e = e == null ? w.kg : 0.3 * w.kg + 0.7 * e; ema.push(+e.toFixed(2)); }
  const all = pts.map((w) => w.kg).concat(ema); let lo = Math.min(...all), hi = Math.max(...all); const pad = Math.max(0.5, (hi - lo) * 0.15); lo -= pad; hi += pad;
  const x0 = new Date(pts[0].date + "T12:00:00").getTime(), x1 = new Date(pts[pts.length - 1].date + "T12:00:00").getTime(); const span = Math.max(1, x1 - x0);
  const X = (d) => L + ((new Date(d + "T12:00:00").getTime() - x0) / span) * (W - L - R);
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = 4; let g = "";
  for (let i = 0; i <= ticks; i++) { const v = lo + ((hi - lo) * i) / ticks; const y = Y(v); g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + v.toFixed(1) + "</text>"; }
  const labelIdx = pts.length > 6 ? [0, Math.floor(pts.length / 2), pts.length - 1] : pts.map((_, i) => i);
  for (const i of labelIdx) g += '<text x="' + X(pts[i].date).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle") + '">' + fmtShort(pts[i].date) + "</text>";
  const raw = pts.map((w) => X(w.date).toFixed(1) + "," + Y(w.kg).toFixed(1)).join(" ");
  const em = pts.map((w, i) => X(w.date).toFixed(1) + "," + Y(ema[i]).toFixed(1)).join(" ");
  const dots = pts.map((w) => '<circle class="pt" cx="' + X(w.date).toFixed(1) + '" cy="' + Y(w.kg).toFixed(1) + '" r="3"/>').join("");
  return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Жингийн график, кг">' + g + '<polyline class="raw" points="' + raw + '"/><polyline class="ema" points="' + em + '"/>' + dots + "</svg>";
}

/* ---------- me ---------- */
VIEWS.me = function () {
  const p = P(); const a = S.assessment || {};
  let h = '<div class="card"><div class="card-head"><div><p class="muted small">' + (p.name ? esc(p.name) + " · " : "") + (p.sex === "f" ? "Эмэгтэй" : "Эрэгтэй") + ", " + p.age + '</p><h2>' + p.goals.map((g) => GOAL_N[g] || g).join(", ") + "</h2></div></div>" +
    '<div class="stats"><div class="stat"><span class="big">' + p.heightCm + '<small>см</small></span><span>өндөр</span></div><div class="stat"><span class="big">' + p.weightKg + '<small>кг</small></span><span>жин</span></div><div class="stat"><span class="big">' + (a.level || "–") + '<small>/5</small></span><span>түвшин</span></div></div>' +
    '<div class="list">' + obSteps().map((s) => '<button class="li" data-act="ob-edit" data-v="' + s.id + '"><span class="txt"><b>' + s.title + "</b><small>" + obSummary(s.id, p) + "</small></span>" + ico("chevron", "chev") + "</button>").join("") + "</div>" +
    (S.program ? '<button class="btn quiet" data-act="rebuild">Хөтөлбөрөө шинээр үүсгэх</button>' : "") + "</div>";
  h += '<div class="card"><h2>Сэдэв</h2><div class="seg" role="group">' + [["system", "Төхөөрөмж"], ["light", "Цайвар"], ["dark", "Бараан"]].map((t) => '<button type="button" data-act="theme" data-v="' + t[0] + '" aria-pressed="' + ((S.settings.theme || "system") === t[0]) + '">' + t[1] + "</button>").join("") + "</div></div>";
  h += '<div class="card"><h2>Өгөгдөл</h2><p class="small muted">' + (mode === "cloud" ? "Нэвтэрсэн: " + esc((SB.session || {}).email || "") + ". Өгөгдөл Дэвтэртэй нэг санд хадгалагдана." : "Зөвхөн энэ төхөөрөмж дээр хадгалагдаж байна." + (SB.configured() ? " Нэвтэрвэл төхөөрөмж хооронд зөөгдөнө." : "")) + "</p>" +
    '<div class="actions"><button class="btn ghost" data-act="export">JSON татах</button><label class="btn ghost">JSON-оос сэргээх<input id="imp-file" type="file" accept="application/json" hidden></label></div>' +
    (SB.configured() ? (mode === "cloud" ? '<button class="btn ghost" data-act="logout">' + (UI.confirm === "logout" ? "Гарах уу?" : "Гарах") + "</button>" : '<button class="btn ghost" data-act="login">Нэвтрэх</button>') : "") +
    '<button class="btn danger" data-act="wipe">' + (UI.confirm === "wipe" ? "Үнэхээр устгах уу? Буцаахгүй" : "Бүх өгөгдлийг устгах") + "</button></div>";
  h += '<div class="card sunk"><h3>Эмнэлгийн зөвлөгөө биш</h3><p class="small">Энэ апп эрүүл насанд хүрэгчдэд зориулсан ерөнхий хөдөлгөөн, хоолны зөвлөмж өгнө. Өвчин, жирэмслэлт, эм хэрэглэж байгаа бол эмчтэйгээ зөвлөлдөөрэй. Хичээлийн үед хурц өвдөлт, толгой эргэх, цээж өвдөх мэдрэмж төрвөл шууд зогсооно.</p>' + (E && E.VERSION ? '<p class="small muted">Хөдөлгүүр v' + E.VERSION + "</p>" : "") + "</div>";
  return h;
};
function obSummary(id, p) {
  switch (id) {
    case "goals": return p.goals.map((g) => GOAL_N[g] || g).join(", ") || "—";
    case "about": return (p.sex === "f" ? "Эмэгтэй" : "Эрэгтэй") + ", " + p.age;
    case "womens": return (Object.fromEntries(STAGES)[(p.womens || {}).stage] || "—");
    case "body": return p.heightCm + " см · " + p.weightKg + " кг · бүсэлхий " + p.waistCm;
    case "schedule": return p.daysPerWeek + " өдөр × " + p.minutes + " мин";
    case "equipment": return p.equipment.map((e) => Object.fromEntries(EQUIP)[e] || e).join(", ");
    case "parq": return p.parq.some(Boolean) ? "«Тийм» хариулт бий" : "Бүгд үгүй";
    case "pain": return p.pain.length ? p.pain.map((x) => PAIN_N[x] || x).join(", ") : "Өвддөггүй";
    case "life": return "Нойр " + p.sleepHours + " ц · стресс " + p.stress + " · " + (Object.fromEntries(OCC)[p.occupation] || "");
    case "habit": return p.cue || "—";
    case "diet": return "Давстай цай " + p.diet.saltTeaCups + " · ногоо " + p.diet.vegServings + " · " + p.diet.mealsPerDay + " удаа";
    case "tests": return Object.values(p.tests).some((v) => v != null && v !== "knee" && v !== "full") ? "Хийсэн" : "Хийгээгүй";
  }
  return "";
}
function applyTheme() { const t = S.settings.theme || "system"; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; try { localStorage.setItem("fit-theme", t); } catch (e) {} }
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
async function importBackup(file) {
  try { const o = JSON.parse(await file.text()); if (!o || !o.profile || !("logs" in o)) throw 0; for (const k in blank()) if (o[k] !== undefined) S[k] = o[k]; normalize(); UI.nutrition = null; for (const d in DOCS) save(DOCS[d][0]); applyTheme(); render(); toast("Сэргээлээ"); } catch (e) { toast("Энэ файл таарахгүй байна"); }
}

/* ======================= SHEET ======================= */
function openSheet(title, body, opt) {
  opt = opt || {}; UI.sheet = { onSave: opt.onSave || null };
  $("sheet-body").innerHTML = '<h2 id="sheet-title">' + esc(title) + "</h2>" + body +
    '<div class="foot">' + (opt.onSave ? '<button class="btn ghost" data-act="sheet-close">Болих</button><button class="btn" data-act="sheet-save">' + esc(opt.save || "Хадгалах") + "</button>" : '<button class="btn" data-act="sheet-close">' + esc(opt.ok || "Хаах") + "</button>") + "</div>";
  $("sheet").classList.add("open"); $("backdrop").classList.add("open");
  const f = $("sheet").querySelector("input,button.btn"); if (f && opt.focus) f.focus();
}
function closeSheet() { $("sheet").classList.remove("open"); $("backdrop").classList.remove("open"); UI.sheet = null; setTimeout(() => { if (!UI.sheet) $("sheet-body").innerHTML = ""; }, 380); }

/* ======================= PLAYER ======================= */
const PL = { on: false, s: null, steps: [], i: 0, phase: "work", left: 0, total: 0, endAt: 0, running: false, iv: null, lock: null, swapped: {}, skipped: [], startedAt: 0 };
function buildSteps(s) {
  const steps = []; s.blocks.forEach((b, bi) => b.items.forEach((it, ii) => { for (let k = 1; k <= (it.sets || 1); k++) steps.push({ bi, ii, set: k, sets: it.sets || 1, item: it, block: b.name }); }));
  return steps;
}
function play(id) {
  const s = findSession(id); if (!s) { toast("Хичээл олдсонгүй"); return; }
  PL.s = clone(s); PL.steps = buildSteps(PL.s); PL.i = 0; PL.phase = "work"; PL.swapped = {}; PL.skipped = []; PL.startedAt = Date.now(); PL.on = true; PL.running = false;
  $("player").hidden = false; document.body.style.overflow = "hidden"; wake(true);
  enterStep();
}
function curItem() { const st = PL.steps[PL.i]; return st ? st.item : null; }
function stepSeconds(it) { return it.seconds ? it.seconds * (it.reps > 1 ? it.reps : 1) : it.breaths ? it.breaths * 5 : 0; }
function enterStep() {
  const it = curItem(); if (!it) { finish(); return; }
  PL.phase = "work"; const sec = stepSeconds(it); PL.left = sec; PL.total = sec; PL.running = false; clearInterval(PL.iv);
  renderPlayer(); if (sec) startTimer();
}
function startTimer() { PL.running = true; PL.endAt = performance.now() + PL.left * 1000; clearInterval(PL.iv); PL.iv = setInterval(tick, 250); updateClock(); renderCtl(); }
function pauseTimer() { PL.running = false; PL.left = Math.max(0, (PL.endAt - performance.now()) / 1000); clearInterval(PL.iv); renderCtl(); }
function tick() { PL.left = Math.max(0, (PL.endAt - performance.now()) / 1000); updateClock(); if (PL.left <= 0) { clearInterval(PL.iv); PL.running = false; try { navigator.vibrate && navigator.vibrate(150); } catch (e) {} if (PL.phase === "work") afterWork(); else enterStep(); } }
function afterWork() {
  const st = PL.steps[PL.i]; const it = st.item; const next = PL.steps[PL.i + 1];
  if (!next) { finish(); return; }
  PL.i++;
  const rest = it.rest || 0;
  if (rest > 0) { PL.phase = "rest"; PL.left = rest; PL.total = rest; renderPlayer(); startTimer(); } else enterStep();
}
function prevStep() { clearInterval(PL.iv); if (PL.phase === "rest") { PL.i--; } else if (PL.i > 0) PL.i--; enterStep(); }
function nextStep() { clearInterval(PL.iv); if (PL.phase === "rest") { enterStep(); return; } afterWork(); }
function swapStep() {
  const st = PL.steps[PL.i]; const ex = LIB.byId(st.item.exId); const reg = ex && ex.regress && LIB.byId(ex.regress);
  if (!reg) { toast("Хялбар хувилбар алга"); return; }
  const oldId = st.item.exId; PL.swapped[oldId] = reg.id;
  for (const s of PL.steps) if (s.item.exId === oldId) { s.item.exId = reg.id; if (reg.unit !== (st.item.seconds ? "seconds" : st.item.breaths ? "breaths" : "reps")) { s.item.reps = reg.defaults.reps; s.item.seconds = reg.defaults.seconds; s.item.breaths = reg.defaults.breaths; } s.item.sides = reg.sides; }
  toast(reg.name + " руу сольсон"); enterStep();
}
function skipItem() { const st = PL.steps[PL.i]; if (!PL.skipped.includes(st.item.exId)) PL.skipped.push(st.item.exId); clearInterval(PL.iv); let j = PL.i; while (PL.steps[j] && PL.steps[j].ii === st.ii && PL.steps[j].bi === st.bi) j++; if (!PL.steps[j]) { finish(); return; } PL.i = j; enterStep(); }
function finish() { clearInterval(PL.iv); PL.phase = "done"; PL.running = false; renderPlayer(); }
function closePlayer() { clearInterval(PL.iv); PL.on = false; $("player").hidden = true; $("player").innerHTML = ""; document.body.style.overflow = ""; wake(false); }
async function wake(on) { try { if (on && "wakeLock" in navigator) PL.lock = await navigator.wakeLock.request("screen"); else if (!on && PL.lock) { await PL.lock.release(); PL.lock = null; } } catch (e) {} }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && PL.on && PL.phase !== "done") wake(true); });

function renderPlayer() {
  const el = $("player"); const s = PL.s; if (!s) return;
  if (PL.phase === "done") {
    const mins = Math.max(1, Math.round((Date.now() - PL.startedAt) / 60000));
    el.innerHTML = '<div class="in"><div class="ph"><span class="blk-lbl" style="' + rc(s.type) + '">' + esc(s.title) + '</span><button type="button" class="x" data-act="pl-close" aria-label="Хаах">' + ico("x") + '</button></div><div class="end"><h1>Боллоо</h1><span class="big">' + mins + '<small style="font-family:var(--body);font-size:1rem;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:6px">мин</small></span><p class="muted">' + PL.steps.length + " сет, " + new Set(PL.steps.map((x) => x.item.exId)).size + " дасгал" + (PL.skipped.length ? ", " + PL.skipped.length + " алгассан" : "") + '</p><button type="button" class="btn lg" data-act="pl-feedback">Хэр байсан бэ?</button><button type="button" class="link" data-act="pl-close">Тэмдэглэхгүй хаах</button></div></div>';
    return;
  }
  const st = PL.steps[PL.i]; const it = st.item; const ex = LIB.byId(it.exId) || { name: it.exId, cues: [] };
  const rest = PL.phase === "rest"; const sec = rest ? it.rest : stepSeconds(it);
  const nextEx = rest ? ex : (PL.steps[PL.i + 1] ? LIB.byId(PL.steps[PL.i + 1].item.exId) : null);
  const dots = []; let lastKey = "", curDot = 0; PL.steps.forEach((x, k) => { const key = x.bi + ":" + x.ii; if (key !== lastKey) { dots.push(key); lastKey = key; } if (k === PL.i) curDot = dots.length - 1; });
  el.innerHTML = '<div class="in" style="' + rc(s.type) + '"><div class="ph"><button type="button" class="x" data-act="pl-close" aria-label="Хичээлийг хаах">' + ico("x") + '</button><div class="dots" aria-hidden="true">' + dots.map((d, k) => '<i class="' + (k === curDot ? "cur" : k < curDot ? "done" : "") + '"></i>').join("") + '</div><span class="tag num">' + (PL.i + 1) + "/" + PL.steps.length + "</span></div>" +
    '<div><span class="blk-lbl">' + esc(st.block) + (rest ? " · амралт" : "") + '</span><h1>' + (rest ? "Амралт" : esc(ex.name)) + '</h1><p class="side">' + (rest ? "Дараа: " + esc(ex.name) + " · " + st.set + "/" + st.sets + " сет" : st.set + "/" + st.sets + " сет" + (it.sides === "each" ? " · зүүн / баруун" : "") + (it.tempo ? " · темп " + esc(it.tempo) : "")) + "</p></div>" +
    '<div class="clock">' + (sec ? '<div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46"/><circle class="fg' + (rest ? " rest" : "") + '" id="pl-ring" cx="50" cy="50" r="46" stroke-dasharray="289" stroke-dashoffset="0"/></svg><span class="big' + (rest ? " rest" : "") + '" id="pl-clock">' + mmss(PL.left) + "</span></div>" + (it.breaths && !rest ? '<span class="sub">' + it.breaths + " амьсгал, удаан</span>" : it.seconds && it.reps > 1 && !rest ? '<span class="sub">' + it.reps + " × " + it.seconds + " сек барих</span>" : "") : '<span class="big">' + (it.reps || 0) + '</span><span class="sub">давталт' + (it.sides === "each" ? ", тал бүрд" : "") + "</span>") + "</div>" +
    (!rest && ex.cues && ex.cues.length ? '<ul class="cues">' + ex.cues.slice(0, 3).map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>" : "") +
    (!rest ? why(it.why) : "") +
    '<div class="ctl2">' + (!rest ? '<button type="button" data-act="pl-swap">' + ico("swap") + "Солих</button>" : "") + '<button type="button" data-act="pl-skip">Алгасах</button></div>' +
    '<div class="ctl"><button type="button" data-act="pl-prev" aria-label="Өмнөх">' + ico("prev") + '</button><button type="button" class="main" id="pl-main" data-act="pl-main"></button><button type="button" data-act="pl-next" aria-label="Дараах">' + ico("next") + "</button></div></div>";
  renderCtl(); updateClock();
}
function renderCtl() {
  const b = $("pl-main"); if (!b) return;
  if (!PL.total) b.innerHTML = ico("check") + "Болсон";
  else if (PL.running) b.innerHTML = ico("pause") + "Түр зогсоох";
  else b.innerHTML = ico("play") + (PL.left > 0 && PL.left < PL.total ? "Үргэлжлүүлэх" : "Эхлэх");
}
function updateClock() {
  const c = $("pl-clock"); if (!c) return; c.textContent = mmss(PL.left);
  const r = $("pl-ring"); if (r && PL.total) r.style.strokeDashoffset = (289 * (1 - PL.left / PL.total)).toFixed(1);
}
function mainBtn() { if (!PL.total) { afterWork(); return; } if (PL.running) pauseTimer(); else startTimer(); }

/* ---------- feedback ---------- */
function feedbackSheet() {
  const s = PL.s; const mins = Math.max(1, Math.round((Date.now() - PL.startedAt) / 60000));
  const fb = { rpe: 6, pain: [], enjoy: 4 };
  const body = '<div class="field"><span class="lbl">Хэр хүнд байв? RPE <b id="fb-rpe-v">6</b></span><input type="range" id="fb-rpe" min="1" max="10" value="6" aria-label="Ачаалал 1-ээс 10"><div class="anchors"><span>1 маш амархан</span><span>6 амархан</span><span>8 хүнд</span><span>10 дээд хязгаар</span></div></div>' +
    '<div class="field"><span class="lbl">Хаа нэгтээ өвдсөн үү?</span><div class="chips" id="fb-pain">' + PAIN.map((p) => '<button type="button" class="chip" data-fb-pain="' + p[0] + '" aria-pressed="false">' + p[1] + "</button>").join("") + "</div></div>" +
    '<div class="field"><span class="lbl">Таалагдсан уу?</span><div class="scale" id="fb-enjoy">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" class="' + (n === 4 ? "on" : "") + '" data-fb-enjoy="' + n + '" aria-pressed="' + (n === 4) + '">' + n + "</button>").join("") + '</div><div class="anchors"><span>огт үгүй</span><span>маш их</span></div></div>';
  UI.fb = fb;
  openSheet("Хэр байсан бэ?", body, { onSave: () => {
    const log = { date: todayIso(), sessionId: s.id, done: true, rpe: fb.rpe, pain: fb.pain, enjoy: fb.enjoy, minutes: mins, skippedExIds: PL.skipped.slice() };
    S.logs.push(log); save("logs"); closePlayer(); toast("Тэмдэглэлээ"); render(); return true;
  } });
}

/* ======================= EVENTS ======================= */
function setField(f, v) { set(P(), f, v); if (f.startsWith("womens.") && P().womens) { const w = P().womens; if (w.stage !== "pregnancy") w.trimester = null; if (w.stage !== "postpartum") w.weeksPostpartum = null; } save("profile"); }
function coerce(el, v) { if (el.dataset.num === "bool") return v === "true"; if (el.dataset.num) return v === "" ? null : +v; return v; }
document.addEventListener("click", (e) => {
  const pb = e.target.closest("[data-fb-pain]"); if (pb && UI.fb) { const v = pb.dataset.fbPain; const i = UI.fb.pain.indexOf(v); if (i >= 0) UI.fb.pain.splice(i, 1); else UI.fb.pain.push(v); pb.classList.toggle("on", i < 0); pb.setAttribute("aria-pressed", i < 0); return; }
  const eb = e.target.closest("[data-fb-enjoy]"); if (eb && UI.fb) { UI.fb.enjoy = +eb.dataset.fbEnjoy; document.querySelectorAll("[data-fb-enjoy]").forEach((b) => { b.classList.toggle("on", b === eb); b.setAttribute("aria-pressed", b === eb); }); return; }
  const el = e.target.closest("[data-act]"); if (!el) return; const act = el.dataset.act, ds = el.dataset;
  switch (act) {
    case "sheet-close": closeSheet(); break;
    case "sheet-save": if (UI.sheet && UI.sheet.onSave && UI.sheet.onSave() !== false) closeSheet(); break;
    case "tab": { const order = TABS.map((t) => t[0]); const anim = order.indexOf(ds.v) > order.indexOf(UI.tab) ? "enter-l" : "enter-r"; UI.tab = ds.v; UI.confirm = null; try { localStorage.setItem("fit-tab", ds.v); } catch (x) {} go(anim); break; }
    case "ob-start": obStart(); break;
    case "login": showLogin(); break;
    case "login-skip": UI.login = false; document.body.classList.remove("bare"); startLocal(); break;
    case "ob-back": if (UI.ob.returnTo) { const to = UI.ob.returnTo; UI.ob = null; UI.tab = to; stopTestTimer(); go("enter-r"); } else if (UI.ob.step > 0) obSetStep(UI.ob.step - 1); else { UI.ob = null; go("enter-r"); } break;
    case "ob-next": obNext(); break;
    case "ob-skip": obSetStep(UI.ob.step + 1); break;
    case "ob-goto": { UI.ob.stop = false; const i = obSteps().findIndex((s) => s.id === ds.v); obSetStep(i < 0 ? 0 : i); break; }
    case "ob-save-stop": { P().createdAt = P().createdAt || new Date().toISOString(); S.settings.obStep = 0; UI.ob = null; UI.tab = "today"; save("profile"); save("settings"); go("enter-l"); break; }
    case "ob-finish": obFinish(); break;
    case "ob-edit": { const i = obSteps().findIndex((s) => s.id === ds.v); UI.ob = { step: i < 0 ? 0 : i, returnTo: UI.tab }; go("enter-l"); break; }
    case "toggle": { const f = ds.f; const arr = (get(P(), f) || []).slice(); const i = arr.indexOf(ds.v); if (i >= 0) arr.splice(i, 1); else { if (ds.max && arr.length >= +ds.max) { toast("Хамгийн ихдээ " + ds.max); return; } arr.push(ds.v); } setField(f, arr); if (f === "equipment" && arr.includes("none") && arr.length > 1) setField(f, ds.v === "none" ? ["none"] : arr.filter((x) => x !== "none")); if (f === "goals" && !arr.includes("metabolic")) setField("metabolic", []); render(); break; }
    case "pick": { setField(ds.f, coerce(el, ds.v)); render(); break; }
    case "pain-none": setField("pain", []); render(); break;
    case "parq": { const arr = P().parq.slice(); arr[+ds.i] = ds.v === "1"; setField("parq", arr); render(); break; }
    case "test-timer": testTimerToggle(ds.id); break;
    case "retest": UI.retest = true; UI.ob = { step: obSteps().findIndex((s) => s.id === "tests"), returnTo: UI.tab, retest: true }; go("enter-l"); break;
    case "whymore": { const b = e.target.closest(".why-more"); const r = b && b.nextElementSibling; if (r) { r.hidden = false; r.style.display = "contents"; b.remove(); } break; }
    case "day": UI.openDay = UI.openDay === +ds.v ? null : +ds.v; render(); break;
    case "play": play(ds.id); break;
    case "next-week": nextWeek(); break;
    case "salt": { const t = todayIso(); const cur = S.settings.saltTeaToday && S.settings.saltTeaToday.date === t ? S.settings.saltTeaToday.n : 0; S.settings.saltTeaToday = { date: t, n: Math.max(0, Math.min(20, cur + +ds.v)) }; save("settings"); render(); break; }
    case "theme": S.settings.theme = ds.v; applyTheme(); save("settings"); render(); break;
    case "export": download("tenkhee-" + todayIso() + ".json", JSON.stringify(S, null, 2)); break;
    case "rebuild": case "build": if (buildAll()) { UI.tab = act === "build" ? "today" : "program"; UI.openDay = null; toast("Шинэ хөтөлбөр үүслээ"); go("enter-l"); } break;
    case "logout": if (UI.confirm === "logout") { SB.storeSession(null); location.reload(); } else { UI.confirm = "logout"; render(); setTimeout(() => { if (UI.confirm === "logout") { UI.confirm = null; render(); } }, 3500); } break;
    case "wipe": if (UI.confirm === "wipe") { UI.confirm = null; S = blank(); UI.nutrition = null; UI.ob = null; for (const d in DOCS) save(DOCS[d][0]); try { localStorage.removeItem(LKEY); localStorage.removeItem("fit-tab"); } catch (x) {} UI.tab = "today"; render(); toast("Устгалаа"); } else { UI.confirm = "wipe"; render(); setTimeout(() => { if (UI.confirm === "wipe") { UI.confirm = null; render(); } }, 3500); } break;
    case "pl-close": closePlayer(); break;
    case "pl-main": mainBtn(); break;
    case "pl-next": nextStep(); break;
    case "pl-prev": prevStep(); break;
    case "pl-swap": swapStep(); break;
    case "pl-skip": skipItem(); break;
    case "pl-feedback": feedbackSheet(); break;
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "fb-rpe" && UI.fb) { UI.fb.rpe = +t.value; $("fb-rpe-v").textContent = UI.fb.rpe; return; }
  if (!t.dataset.f || !UI.ob) return;
  const v = coerce(t, t.value); setField(t.dataset.f, v);
  const nb = document.querySelector("[data-act=ob-next]"); if (nb) { const steps = obSteps(); const st = steps[Math.min(UI.ob.step, steps.length - 1)]; nb.disabled = !st.valid(P()); }
  if (t.dataset.f === "cue") document.querySelectorAll("[data-f=cue][data-act=pick]").forEach((b) => { b.classList.toggle("on", b.dataset.v === v); b.setAttribute("aria-pressed", b.dataset.v === v); });
});
document.addEventListener("change", (e) => { if (e.target.id === "imp-file" && e.target.files[0]) importBackup(e.target.files[0]); });
document.addEventListener("submit", (e) => {
  if (e.target.id === "steps-form") { e.preventDefault(); const n = +sv("steps-n"); if (!(n >= 0)) return; const t = todayIso(); const ex = S.steps.find((x) => x.date === t); if (ex) ex.n = n; else S.steps.push({ date: t, n }); save("steps"); toast("Алхам бичлээ"); render(); }
  if (e.target.id === "w-form") { e.preventDefault(); const kg = +sv("w-kg"), waist = +sv("w-w") || null, d = sv("w-d") || todayIso(); if (!(kg >= 30)) { $("w-kg").focus(); return; } const ex = S.weights.find((x) => x.date === d); if (ex) { ex.kg = kg; if (waist) ex.waist = waist; } else S.weights.push({ date: d, kg, waist }); P().weightKg = kg; if (waist) P().waistCm = waist; reassess(); save("weights"); save("profile"); toast("Жин бичлээ"); render(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (UI.sheet) closeSheet(); else if (PL.on) closePlayer(); } });

/* ---------- boot ---------- */
try { const t = localStorage.getItem("fit-theme"); if (t && t !== "system") document.documentElement.dataset.theme = t; } catch (e) {}
if (!E || !LIB || !FOODS) { $("main").innerHTML = '<div class="note bad">Хөдөлгүүрийн файлууд ачаалагдсангүй (lib.js, foods.js, engine.js). Хуудсыг дахин ачаалаарай.</div>'; setSync("err", "Ачаалж чадсангүй"); }
else if (SB.configured()) { SB.loadSession(); if (SB.session) { setSync("saving", "Ачаалж байна…"); startCloud(); } else { startLocal(); } }
else startLocal();
})();
