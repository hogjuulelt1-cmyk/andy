/* Chinbilig · Jiu-jitsu. Static, no build. Data: Supabase docs table (paths bjj/*) or localStorage. */
(function () {
"use strict";
const SEED = window.BJJ_SEED;
const CFG = window.APP_CONFIG || {};
const LKEY = "bjj-v1";
const KEYS = ["tree", "plans", "log", "body", "belt", "weight", "comp", "settings"];

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => (n < 10 ? "0" : "") + n;
function todayIso() { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function mondayOf(iso) { const d = new Date(iso + "T12:00:00"); const w = (d.getDay() + 6) % 7; return addDays(iso, -w); }
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function fmtD(iso) { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return (d.getMonth() + 1) + "/" + d.getDate() + " " + WD[d.getDay()]; }
function fmtLong(iso) { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function monthsSince(iso) { if (!iso) return 0; const a = new Date(iso + "T12:00:00"), b = new Date(); return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() - (b.getDate() < a.getDate() ? 1 : 0)); }
function sv(id) { const el = $(id); return el ? el.value : ""; }
function lines(s) { return String(s || "").split("\n").map((x) => x.trim()).filter(Boolean); }
const CHEV = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L19 7"/></svg>';

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
  async get(path) { const r = await this.req("/rest/v1/docs?select=data&path=eq." + encodeURIComponent(path)); const rows = await r.json(); return rows.length ? rows[0].data : null; },
  async list(prefix) { const r = await this.req("/rest/v1/docs?select=path,data&path=like." + encodeURIComponent(prefix + "*")); return r.json(); },
  set(path, data) { return this.req("/rest/v1/docs", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, data, updated_at: new Date().toISOString() }) }); },
};

/* ---------- state ---------- */
function blank() {
  return {
    tree: { nodes: [] },
    plans: { items: [] },
    log: { items: [] },
    body: { routines: [], items: [] },
    belt: { track: "kids", belt: "white", stripes: 0, since: "", history: [], goals: {} },
    weight: { items: [], cls: "adult_m", target: "" },
    comp: { events: [] },
    settings: { theme: "system", timer: { work: 5, rest: 1, rounds: 5 }, seeded: false },
  };
}
let S = blank();
let mode = "local";
const UI = { tab: "tech", tech: { id: null, q: "", view: "pos", map: true }, body: { cat: "warm", open: null }, comp: { id: null }, confirm: null, sheet: null, anim: "" };
try { const t = localStorage.getItem("bjj-tab"); if (t) UI.tab = t; if (localStorage.getItem("bjj-map") === "0") UI.tech.map = false; } catch (e) {}

function seedAll(force) {
  if (force || !S.tree.nodes.length) S.tree.nodes = SEED.nodes();
  if (force || !S.plans.items.length) S.plans.items = SEED.plans.map((p) => Object.assign({ id: uid() }, clone(p)));
  if (force || !S.body.routines.length) S.body.routines = SEED.routines.map((r) => Object.assign({ id: uid() }, clone(r)));
  S.settings.seeded = true;
}
function normalize() {
  const b = blank();
  for (const k of KEYS) { if (!S[k] || typeof S[k] !== "object") S[k] = b[k]; for (const f in b[k]) if (S[k][f] == null) S[k][f] = b[k][f]; }
  if (!S.settings.timer) S.settings.timer = b.settings.timer;
}

/* ---------- persistence ---------- */
const dirty = {}, timers = {}, chains = {};
function setSync(k, msg) {
  const el = $("sync"); if (!el) return;
  el.className = "sync " + (k === "local" ? "saving" : k);
  $("sync-t").textContent = msg || { ok: "All changes saved", saving: "Saving…", local: "Saved on this device only", err: "Error" }[k];
}
function save(key) {
  dirty[key] = 1; setSync(mode === "cloud" ? "saving" : "local");
  clearTimeout(timers[key]); timers[key] = setTimeout(() => flush(key), 600);
}
function flush(key) {
  const run = async () => {
    try {
      if (mode === "cloud") await SB.set("bjj/" + key, clone(S[key]));
      else localStorage.setItem(LKEY, JSON.stringify(S));
      delete dirty[key]; if (!Object.keys(dirty).length) setSync(mode === "cloud" ? "ok" : "local");
    } catch (e) { if (e.message === "noauth") showLogin("Please sign in again."); else setSync("err", "Could not save, retrying"); setTimeout(() => flush(key), 5000); }
  };
  chains[key] = (chains[key] || Promise.resolve()).then(run, run);
}

async function startCloud() {
  try {
    const rows = await SB.list("bjj/");
    for (const r of rows) { const k = r.path.slice(4); if (KEYS.includes(k)) S[k] = r.data; }
    normalize();
    if (!S.settings.seeded) { seedAll(false); await initFromDiary(); for (const k of ["tree", "plans", "body", "belt", "settings"]) await SB.set("bjj/" + k, clone(S[k])); }
    mode = "cloud"; applyTheme(); setSync("ok"); document.body.classList.remove("locked"); render();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !Object.keys(dirty).length) refresh(); });
  } catch (e) { if (e.message === "noauth") showLogin(); else { setSync("err", "Could not connect"); console.error(e); } }
}
async function refresh() {
  try { const rows = await SB.list("bjj/"); let ch = false; for (const r of rows) { const k = r.path.slice(4); if (KEYS.includes(k) && !dirty[k] && JSON.stringify(S[k]) !== JSON.stringify(r.data)) { S[k] = r.data; ch = true; } } if (ch) { normalize(); render(); } } catch (e) {}
}
async function initFromDiary() {
  // Belt and age: initial values from the diary app profile.
  try { const st = await SB.get("app/settings"); const p = st && st.profile; if (p) { S.belt.belt = p.belt || "white"; S.belt.stripes = +p.stripes || 0; S.belt.since = p.beltSince || ""; S.belt.track = (+p.age && +p.age >= 16) ? "adult" : "kids"; } } catch (e) {}
}
function startLocal() {
  try { const j = JSON.parse(localStorage.getItem(LKEY) || "null"); if (j) S = j; } catch (e) {}
  normalize(); if (!S.settings.seeded) { seedAll(false); localStorage.setItem(LKEY, JSON.stringify(S)); }
  mode = "local"; applyTheme(); setSync("local"); render();
}
function showLogin(msg) {
  document.body.classList.add("locked"); $("tabs").innerHTML = ""; $("belt").innerHTML = "";
  $("main").innerHTML = '<form class="card" id="login"><h2>Sign in</h2>' + (msg ? '<p class="muted small">' + esc(msg) + "</p>" : "") +
    '<div class="field"><label for="lg-e">Email</label><input id="lg-e" type="email" autocomplete="username" required></div>' +
    '<div class="field"><label for="lg-p">Password</label><input id="lg-p" type="password" autocomplete="current-password" required></div>' +
    '<button class="btn" type="submit">Sign in</button><p class="muted small">Same account as the diary app.</p></form>';
  setSync("local", "Not signed in");
  $("login").addEventListener("submit", async (e) => { e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; try { await SB.login(sv("lg-e").trim(), sv("lg-p")); startCloud(); } catch (err) { b.disabled = false; showLogin("Wrong email or password."); } });
}

/* Mirror into the diary app: sessions into day docs, belt into the profile. Cloud only. */
const TYPE2DIARY = { gi: "gi", nogi: "nogi", open: "open", priv: "gi", drill: "gi", comp: "comp" };
async function mirrorSession(it, oldDate) {
  if (mode !== "cloud") return;
  try {
    if (oldDate && oldDate !== it.d) await unmirrorSession(it.id, oldDate);
    const path = "days/" + it.d; let d = await SB.get(path);
    if (!d) d = { date: it.d, habits: {}, sched: {}, sleep: "", srec: "", sstudy: "", energy: 0, mood: 0, soreness: 0, pain: "", weight: "", meals: {}, journal: { win: "", learned: "", focus: "", thanks: "" }, sessions: [] };
    d.sessions = d.sessions || [];
    const rec = { type: TYPE2DIARY[it.type] || "gi", min: +it.min || 0, rpe: +it.rpe || 0, enj: 0, tech: (it.tech || []).map((t) => t.n).join("\n"), work: it.good || "", q: it.bad || "", res: it.note || "", bjj: it.id };
    const i = d.sessions.findIndex((s) => s.bjj === it.id); if (i >= 0) d.sessions[i] = rec; else d.sessions.push(rec);
    await SB.set(path, d);
  } catch (e) { console.warn("mirror", e); }
}
async function unmirrorSession(id, date) {
  if (mode !== "cloud") return;
  try { const path = "days/" + date; const d = await SB.get(path); if (!d || !d.sessions) return; const n = d.sessions.filter((s) => s.bjj !== id); if (n.length !== d.sessions.length) { d.sessions = n; await SB.set(path, d); } } catch (e) { console.warn("unmirror", e); }
}
async function mirrorBelt() {
  if (mode !== "cloud") return;
  try { const st = await SB.get("app/settings"); if (!st) return; st.profile = st.profile || {}; st.profile.belt = S.belt.belt.split("-")[0]; st.profile.stripes = S.belt.stripes; st.profile.beltSince = S.belt.since; await SB.set("app/settings", st); } catch (e) { console.warn("belt", e); }
}

/* ---------- tree helpers ---------- */
const CATS = [["stand", "Standing"], ["guard", "Guard, bottom"], ["pass", "Passing, top"], ["top", "Dominant, top"], ["escape", "Escapes, bottom"]];
const CAT_COLOR = { stand: "var(--t-td)", guard: "var(--t-sweep)", pass: "var(--t-pass)", top: "var(--t-sub)", escape: "var(--t-esc)" };
const TYPES = [["sub", "Submission"], ["sweep", "Sweep"], ["pass", "Pass"], ["td", "Takedown"], ["esc", "Escape"], ["trans", "Transition"], ["grip", "Grip"], ["ctl", "Control"]];
const TNAME = Object.fromEntries(TYPES);
const nodes = () => S.tree.nodes;
const node = (id) => nodes().find((n) => n.id === id);
const kids = (id) => nodes().filter((n) => n.p === id);
const positions = () => nodes().filter((n) => n.k === "pos");
function ancestors(id) { const out = []; let n = node(id); while (n) { out.unshift(n); n = n.p ? node(n.p) : null; } return out; }
function subtreeIds(id) { const out = [id]; for (const c of kids(id)) out.push(...subtreeIds(c.id)); return out; }
function posOf(id) { return ancestors(id)[0]; }
function countDesc(id) { return subtreeIds(id).length - 1; }
function tbadge(n) { if (n.k === "df") return '<span class="tbadge df">Defense</span>'; return n.t ? '<span class="tbadge ' + n.t + '">' + TNAME[n.t] + "</span>" : ""; }
function kindLabel(n) { return n.k === "pos" ? "Position" : n.k === "df" ? "Opponent" : "Me"; }
function childHeading(n) { return n.k === "pos" ? "What can I do from here" : n.k === "mv" ? "How does the opponent defend" : "Then what do I do"; }
function logStats(id) {
  let given = 0, got = 0, drilled = 0;
  for (const s of S.log.items) { for (const x of s.subs || []) if (x.id === id) given += +x.c || 1; for (const x of s.taps || []) if (x.id === id) got += +x.c || 1; for (const x of s.tech || []) if (x.id === id) drilled++; }
  return { given, got, drilled };
}

/* ---------- belt helpers ---------- */
function beltDef(track, id) { return (SEED.belts[track] || []).find((b) => b.id === id) || SEED.belts.kids.find((b) => b.id === id) || SEED.belts.adult.find((b) => b.id === id) || SEED.belts.adult[0]; }
function beltSwatch(b) {
  const parts = b.id.split("-"); const base = b.c;
  const secondary = parts[1] === "white" ? "#f4f4f6" : parts[1] === "black" ? "#111114" : null;
  return secondary ? '<i style="background:' + base + '"></i><i style="background:' + secondary + '"></i><i style="background:' + base + '"></i>' : '<i style="background:' + base + '"></i>';
}
function beltHtml(big) {
  const b = beltDef(S.belt.track, S.belt.belt); const st = Math.max(0, Math.min(4, +S.belt.stripes || 0));
  const bar = b.id === "black" ? "#c62828" : "#111114";
  return '<span class="b-main">' + beltSwatch(b) + '</span><span class="b-bar" style="background:' + bar + '">' + "<i></i>".repeat(st) + "</span>";
}
function renderBelt() { const el = $("belt"); if (!el) return; const b = beltDef(S.belt.track, S.belt.belt); el.innerHTML = beltHtml(); el.setAttribute("aria-label", b.n + " belt, " + (S.belt.stripes || 0) + " stripes"); }

/* ---------- tabs & render ---------- */
const TABS = [
  ["tech", "Technique", '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9"/>'],
  ["log", "Training", '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M8 15h3M13 15h3"/>'],
  ["body", "Body", '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'],
  ["belt", "Rank", '<path d="M3 9h18v6H3zM14 9v6M17 9v6"/>'],
  ["weight", "Weight", '<path d="M3 20h18M12 4v16M6 8h12"/><path d="M4 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>'],
  ["comp", "Compete", '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/>'],
];
function renderTabs() {
  $("tabs").innerHTML = TABS.map((t) => '<button data-act="tab" data-v="' + t[0] + '"' + (UI.tab === t[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24">' + t[2] + "</svg>" + t[1] + "</button>").join("");
}
const VIEWS = {};
function render(anim) {
  renderBelt(); renderTabs();
  const m = $("main"); const fn = VIEWS[UI.tab] || VIEWS.tech;
  m.className = ""; m.innerHTML = fn(); if (anim) { void m.offsetWidth; m.className = anim; }
  renderTimer();
}
function go(anim) { render(anim); window.scrollTo({ top: 0, behavior: "instant" }); }
let toastT;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
function armConfirm(key) { if (UI.confirm === key) { UI.confirm = null; return true; } UI.confirm = key; render(); setTimeout(() => { if (UI.confirm === key) { UI.confirm = null; render(); } }, 3500); return false; }
function delBtn(key, act, attrs) { const on = UI.confirm === key; return '<button class="x' + (on ? " confirm" : "") + '" data-act="' + act + '" data-key="' + esc(key) + '" ' + (attrs || "") + ' aria-label="Delete">' + (on ? "Delete?" : "✕") + "</button>"; }
function seg(items, cur, act) { return '<div class="seg" role="tablist">' + items.map((i) => '<button role="tab" data-act="' + act + '" data-v="' + i[0] + '" aria-selected="' + (cur === i[0]) + '">' + i[1] + "</button>").join("") + "</div>"; }
function chips(group, items, cur) { return '<div class="chips" data-group="' + group + '">' + items.map((i) => '<button type="button" class="chip' + (cur === i[0] ? " on" : "") + '" data-act="pick" data-group="' + group + '" data-v="' + esc(i[0]) + '">' + esc(i[1]) + "</button>").join("") + "</div>"; }
function scale(group, cur, lo, hi) { let h = '<div class="scale" data-group="' + group + '">'; for (let i = lo; i <= hi; i++) h += '<button type="button" data-act="pick" data-group="' + group + '" data-v="' + i + '" class="' + (cur === i ? "on" : "") + '">' + i + "</button>"; return h + "</div>"; }
function field(id, label, input) { return '<div class="field"><label for="' + id + '">' + label + "</label>" + input + "</div>"; }
function inp(id, val, type, extra) { return '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + ">"; }
function ta(id, val, ph) { return '<textarea id="' + id + '" placeholder="' + esc(ph || "") + '">' + esc(val || "") + "</textarea>"; }

/* ---------- bottom sheet ---------- */
function openSheet(title, body, opt) {
  opt = opt || {}; UI.sheet = Object.assign({ picks: {}, pk: {} }, opt.state || {}); UI.sheetSave = opt.onSave; UI.sheetDel = opt.onDelete;
  const html = typeof body === "function" ? body() : body;
  $("sheet-body").innerHTML = "<h2>" + esc(title) + "</h2>" + html +
    '<div class="foot">' + (opt.onDelete ? '<button class="btn ghost danger" data-act="sheet-del">' + (opt.delLabel || "Delete") + "</button>" : "") + '<button class="btn ghost" data-act="sheet-close">Cancel</button>' + (opt.onSave ? '<button class="btn" data-act="sheet-save">' + (opt.saveLabel || "Save") + "</button>" : "") + "</div>";
  $("sheet").classList.add("open"); $("backdrop").classList.add("open"); $("sheet").scrollTop = 0;
  const f = $("sheet-body").querySelector("input[autofocus]"); if (f) setTimeout(() => f.focus(), 350);
}
function closeSheet() { $("sheet").classList.remove("open"); $("backdrop").classList.remove("open"); UI.sheet = null; UI.sheetSave = null; UI.sheetDel = null; setTimeout(() => { if (!UI.sheet) $("sheet-body").innerHTML = ""; }, 400); }
function pickVal(group, def) { return UI.sheet && UI.sheet.picks[group] != null ? UI.sheet.picks[group] : def; }

/* picker: multi-select with counts (armbar ×2) */
function picker(key, label, source, opt) {
  opt = opt || {}; const list = (UI.sheet.pk[key] = UI.sheet.pk[key] || []);
  return '<div class="field" id="pk-' + key + '"><label for="pki-' + key + '">' + label + '</label><input id="pki-' + key + '" type="text" placeholder="' + esc(opt.ph || "Search by name…") + '" data-pk="' + key + '" data-src="' + source + '" data-counts="' + (opt.counts ? 1 : 0) + '" autocomplete="off"><div class="sugg" id="pks-' + key + '" hidden></div><div class="picked" id="pkp-' + key + '">' + pickedHtml(key, !!opt.counts) + "</div></div>";
}
function pickedHtml(key, counts) {
  const list = UI.sheet.pk[key] || [];
  return list.map((x, i) => '<span class="chip on">' + esc(x.n) + (counts ? ' <button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-dec" data-pk="' + key + '" data-i="' + i + '" aria-label="Remove">−</button><b>' + (x.c || 1) + '</b><button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-inc" data-pk="' + key + '" data-i="' + i + '" aria-label="Add">+</button>' : "") + '<button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-rm" data-pk="' + key + '" data-i="' + i + '" aria-label="Delete">×</button></span>').join("") || '<span class="muted small">None selected</span>';
}
function pkSource(src) {
  if (src === "mv") return nodes().filter((n) => n.k === "mv").map((n) => ({ id: n.id, n: n.n, sub: (posOf(n.id) || {}).n || "" }));
  if (src === "sub") return nodes().filter((n) => n.k === "mv" && n.t === "sub").map((n) => ({ id: n.id, n: n.n, sub: (posOf(n.id) || {}).n || "" }));
  if (src === "pos") return positions().map((n) => ({ id: n.id, n: n.n, sub: n.en }));
  return [];
}
function pkSuggest(input) {
  const key = input.dataset.pk, q = input.value.trim().toLowerCase(); const box = $("pks-" + key); if (!box) return;
  if (!q) { box.hidden = true; return; }
  const seen = new Set(); const items = pkSource(input.dataset.src).filter((x) => { const hit = x.n.toLowerCase().includes(q) || (x.sub || "").toLowerCase().includes(q); if (!hit || seen.has(x.n)) return false; seen.add(x.n); return true; }).slice(0, 8);
  let h = items.map((x) => '<button type="button" data-act="pk-add" data-pk="' + key + '" data-id="' + esc(x.id) + '" data-n="' + esc(x.n) + '">' + esc(x.n) + (x.sub ? " <small>· " + esc(x.sub) + "</small>" : "") + "</button>").join("");
  if (!items.some((x) => x.n.toLowerCase() === q)) h += '<button type="button" data-act="pk-add" data-pk="' + key + '" data-id="" data-n="' + esc(input.value.trim()) + '">“' + esc(input.value.trim()) + '” add as new</button>';
  box.innerHTML = h; box.hidden = false;
}
function pkAdd(key, id, n) {
  const list = (UI.sheet.pk[key] = UI.sheet.pk[key] || []); const ex = list.find((x) => (id && x.id === id) || x.n === n);
  if (ex) ex.c = (ex.c || 1) + 1; else list.push({ id: id || "", n, c: 1 });
  const input = $("pki-" + key); if (input) { input.value = ""; $("pks-" + key).hidden = true; }
  $("pkp-" + key).innerHTML = pickedHtml(key, input && input.dataset.counts === "1");
}
function pkChange(key, i, d) {
  const list = UI.sheet.pk[key] || []; if (!list[i]) return;
  if (d === 0) list.splice(i, 1); else { list[i].c = Math.max(1, (list[i].c || 1) + d); }
  const input = $("pki-" + key); $("pkp-" + key).innerHTML = pickedHtml(key, input && input.dataset.counts === "1");
}

/* ======================= TECHNIQUE ======================= */
VIEWS.tech = function () {
  if (UI.tech.id && node(UI.tech.id)) return vNode(node(UI.tech.id));
  let h = '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="tq" type="search" placeholder="Search positions, techniques…" value="' + esc(UI.tech.q) + '" autocomplete="off"></div>';
  if (UI.tech.q.trim().length >= 2) return h + vSearch(UI.tech.q.trim().toLowerCase());
  h += seg([["pos", "Position"], ["plans", "Game plans"]], UI.tech.view, "techview");
  if (UI.tech.view === "plans") return h + vPlans();
  const all = positions();
  for (const [cat, label] of CATS) {
    const ps = all.filter((p) => p.cat === cat); if (!ps.length) continue;
    h += '<div class="card"><div class="cat-head"><span class="sw" style="background:' + CAT_COLOR[cat] + '"></span><h3>' + label + '</h3></div><div class="list">' +
      ps.map((p) => '<button class="node-row" data-act="open" data-id="' + p.id + '"><div class="txt"><b>' + esc(p.n) + "</b>" + (p.en ? "<small>" + esc(p.en) + "</small>" : "") + '</div><span class="cnt">' + kids(p.id).length + " options</span>" + CHEV + "</button>").join("") + "</div></div>";
  }
  h += '<button class="btn ghost wide" data-act="add-node" data-p="">+ Add position</button>';
  h += '<p class="muted small" style="text-align:center">Position → what I do → how they defend → what I do next. Open any row and add your own options.</p>';
  return h;
};
function vSearch(q) {
  const res = nodes().filter((n) => n.n.toLowerCase().includes(q) || (n.en || "").toLowerCase().includes(q)).slice(0, 40);
  if (!res.length) return '<div class="card"><p class="empty">Nothing found. Try another word.</p></div>';
  return '<div class="card"><div class="list">' + res.map((n) => { const a = ancestors(n.id); const crumb = a.slice(0, -1).map((x) => x.n).join(" › "); return '<button class="node-row' + (n.k === "df" ? " df" : "") + '" data-act="open" data-id="' + n.id + '"><div class="txt"><b>' + esc(n.n) + "</b><small>" + esc(crumb || n.en || kindLabel(n)) + "</small></div>" + tbadge(n) + CHEV + "</button>"; }).join("") + "</div></div>";
}
function vNode(n) {
  const path = ancestors(n.id); const ch = kids(n.id); const back = n.p ? n.p : "";
  let h = '<button class="back" data-act="back" data-id="' + back + '"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' + (n.p ? esc(node(n.p).n) : "Positions") + "</button>";
  h += '<div class="card"><div class="path">' + path.map((x, i) => '<button class="pn ' + x.k + (i === path.length - 1 ? " cur" : "") + '" data-act="open" data-id="' + x.id + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + kindLabel(x) + '</span><span class="nm">' + esc(x.n) + "</span></span></button>").join("") + "</div>";
  h += '<div class="actions" style="align-items:center">' + tbadge(n) + (n.en ? '<span class="muted small" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.en) + "</span>" : '<span style="flex:1"></span>') + '<button class="btn ghost" style="flex:none" data-act="edit-node" data-id="' + n.id + '">Edit</button>' + delBtn("n:" + n.id, "del-node", 'data-id="' + n.id + '"') + "</div>";
  if (n.s && n.s.length) h += '<ol class="steps">' + n.s.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>";
  if (n.x) h += '<p class="small">' + esc(n.x) + "</p>";
  if (n.to && node(n.to)) h += '<div><button class="to-link" data-act="open" data-id="' + n.to + '">→ Next: ' + esc(node(n.to).n) + "</button></div>";
  if (n.k === "mv") { const st = logStats(n.id); const bits = []; if (st.drilled) bits.push(st.drilled + " sessions drilled"); if (st.given) bits.push(st.given + " times finished"); if (st.got) bits.push(st.got + " times caught"); if (bits.length) h += '<p class="muted small">' + bits.join(" · ") + "</p>"; }
  h += "</div>";
  h += '<div class="card"><div class="card-head"><h3>' + childHeading(n) + "</h3>" + seg([["map", "Map"], ["list", "List"]], UI.tech.map ? "map" : "list", "techmap") + "</div>";
  if (UI.tech.map && ch.length) h += mapSvg(n) + '<div class="legend"><span><i style="background:var(--ink)"></i>Position</span><span><i style="background:var(--accent)"></i>Me</span><span><i style="background:var(--df-ink)"></i>Opponent</span></div><p class="muted small">Tap a box to open it and see the next step.</p>';
  else if (ch.length) h += '<div class="list">' + ch.map((c) => '<button class="node-row' + (c.k === "df" ? " df" : "") + '" data-act="open" data-id="' + c.id + '"><div class="txt"><b>' + esc(c.n) + "</b>" + (c.en ? "<small>" + esc(c.en) + "</small>" : "") + "</div>" + (c.k === "df" ? '<span class="cnt">' + kids(c.id).length + " answers</span>" : tbadge(c)) + (c.k !== "df" && kids(c.id).length ? '<span class="cnt">' + kids(c.id).length + "</span>" : "") + CHEV + "</button>").join("") + "</div>";
  else h += '<p class="empty">' + (n.k === "mv" ? "Write how the opponent defends, then add your answer." : "Nothing here yet. Add your first option.") + "</p>";
  h += '<button class="btn ghost wide" data-act="add-node" data-p="' + n.id + '">+ ' + (n.k === "mv" ? "Add a defense" : "Add an option") + "</button></div>";
  if (n.k === "pos") {
    const subs = nodes().filter((x) => x.k === "mv" && x.t === "sub" && posOf(x.id).id === n.id);
    const plans = S.plans.items.filter((p) => (p.tags || []).includes(n.id));
    if (plans.length) h += '<div class="card"><h3>In game plans</h3><div class="list">' + plans.map((p) => '<div class="row"><div class="txt"><b>' + esc(p.n) + "</b></div></div>").join("") + "</div></div>";
    if (subs.length > 1) h += '<p class="muted small" style="text-align:center">This position has ' + subs.length + " submissions.</p>";
  }
  return h;
}
/* mindmap: root as a vertical bar on the left, then two columns (my options → their defenses). Fits the phone width. */
function mapSvg(root) {
  const avail = Math.min(760, window.innerWidth) - 48, PAD = 4, ROOTW = 30, GAPX = 18, ROWH = 40, BOXH = 32, DEPTH = 2;
  const COLW = Math.floor((avail - PAD * 2 - ROOTW - GAPX * 2) / 2), MAXC = Math.max(10, Math.floor((COLW - 18) / 6.6));
  const items = [], edges = []; let leaf = 0;
  function layout(n, depth) {
    const ch = depth < DEPTH ? kids(n.id) : []; let y;
    if (!ch.length) { y = leaf * ROWH + ROWH / 2; leaf++; }
    else { const ys = ch.map((c) => layout(c, depth + 1)); y = (ys[0] + ys[ys.length - 1]) / 2; ch.forEach((c, i) => edges.push([depth, y, depth + 1, ys[i]])); }
    if (depth) items.push({ n, depth, y }); return y;
  }
  layout(root, 0);
  const W = PAD * 2 + ROOTW + GAPX * 2 + COLW * 2, H = Math.max(leaf * ROWH, 60) + PAD * 2;
  const x = (d) => (d === 0 ? PAD : PAD + ROOTW + GAPX + (d - 1) * (COLW + GAPX));
  const xr = (d) => (d === 0 ? PAD + ROOTW : x(d) + COLW);
  const trunc = (t, m) => (t.length > m ? t.slice(0, m - 1) + "…" : t);
  const wrap = (t, m) => { if (t.length <= m) return [t]; const i = t.lastIndexOf(" ", m); const a = i > 3 ? t.slice(0, i) : t.slice(0, m); return [a, trunc(t.slice(a.length).trim(), m)]; };
  let h = '<div class="map"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Technique map">';
  for (const e of edges) { const x1 = xr(e[0]), x2 = x(e[2]), y1 = (e[0] === 0 ? H / 2 : e[1] + PAD), y2 = e[3] + PAD; h += '<path class="e" d="M' + x1 + " " + y1 + " C" + (x1 + GAPX / 2) + " " + y1 + "," + (x2 - GAPX / 2) + " " + y2 + "," + x2 + " " + y2 + '"/>'; }
  h += '<g class="' + root.k + ' root" data-act="open" data-id="' + root.id + '"><rect class="b" x="' + PAD + '" y="' + PAD + '" width="' + ROOTW + '" height="' + (H - PAD * 2) + '" rx="8"/><text transform="translate(' + (PAD + ROOTW / 2 + 4) + " " + (H / 2) + ') rotate(-90)" text-anchor="middle">' + esc(trunc(root.n, Math.floor((H - 20) / 6.6))) + "</text></g>";
  for (const it of items) {
    const n = it.n, bx = x(it.depth), by = it.y + PAD - BOXH / 2; const col = n.k === "mv" && n.t ? "var(--t-" + n.t + ")" : ""; const more = it.depth >= DEPTH ? kids(n.id).length : 0;
    h += '<g class="' + n.k + '" data-act="open" data-id="' + n.id + '" tabindex="0"><rect class="b" x="' + bx + '" y="' + by + '" width="' + COLW + '" height="' + BOXH + '" rx="8"/>' +
      (col ? '<rect x="' + bx + '" y="' + by + '" width="4" height="' + BOXH + '" rx="2" fill="' + col + '"/>' : "") +
      (function () { const ls = wrap(n.n, more ? MAXC - 3 : MAXC); return ls.length === 1 ? '<text x="' + (bx + 10) + '" y="' + (by + BOXH / 2 + 4) + '">' + esc(ls[0]) + "</text>" : '<text class="two" x="' + (bx + 10) + '" y="' + (by + BOXH / 2 - 2) + '">' + esc(ls[0]) + '</text><text class="two" x="' + (bx + 10) + '" y="' + (by + BOXH / 2 + 10) + '">' + esc(ls[1]) + "</text>"; })() + (more ? '<text class="more" x="' + (bx + COLW - 6) + '" y="' + (by + BOXH / 2 + 4) + '" text-anchor="end">+' + more + "</text>" : "") + "</g>";
  }
  return h + "</svg></div>";
}
function nodeSheet(id, parentId) {
  const n = id ? node(id) : null; const parent = parentId ? node(parentId) : null;
  const kind = n ? n.k : parent ? (parent.k === "mv" ? "df" : "mv") : "pos";
  const title = n ? "Edit" : kind === "pos" ? "New position" : kind === "df" ? "How does the opponent defend" : parent && parent.k === "df" ? "Then what do I do" : "New option";
  let b = field("f-n", "Name", inp("f-n", n ? n.n : "", "text", 'autofocus placeholder="' + (kind === "df" ? "e.g. They post a hand" : "e.g. Armbar") + '"'));
  b += field("f-en", "Mongolian name (optional)", inp("f-en", n ? n.en : "", "text", 'placeholder="armbar"'));
  if (kind === "pos") b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", CATS, n ? n.cat : "guard") + "</div>";
  if (kind === "mv") b += '<div class="field"><span class="lbl">Type</span>' + chips("t", TYPES, n ? n.t : "sub") + "</div>";
  if (kind !== "df") b += field("f-s", "Steps (one per line)", ta("f-s", (n ? n.s : []).join("\n"), "Step 1\nStep 2"));
  b += field("f-x", kind === "df" ? "Note" : "Notes, tips", ta("f-x", n ? n.x : "", ""));
  if (kind === "mv") b += field("f-to", "Which position does it lead to", '<select id="f-to"><option value="">—</option>' + positions().map((p) => '<option value="' + p.id + '"' + (n && n.to === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>");
  openSheet(title, b, {
    state: { picks: { cat: n ? n.cat : "guard", t: n ? n.t : "sub" } },
    onSave() {
      const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
      const rec = n || { id: uid(), k: kind, p: parentId || null };
      rec.n = name; rec.en = sv("f-en").trim(); rec.x = sv("f-x").trim();
      if (kind === "pos") rec.cat = pickVal("cat", "guard");
      if (kind === "mv") { rec.t = pickVal("t", "sub"); rec.to = sv("f-to"); }
      if (kind !== "df") rec.s = lines(sv("f-s"));
      if (!n) { nodes().push(rec); if (kind === "pos") UI.tech.id = null; else UI.tech.id = parentId; }
      save("tree"); toast(n ? "Saved" : "Added"); render(); return true;
    },
  });
}
function vPlans() {
  let h = '<div class="card"><div class="card-head"><h3>Game plans by opponent</h3></div>';
  if (!S.plans.items.length) h += '<p class="empty">No game plans yet. Add one per type of opponent.</p>';
  else h += S.plans.items.map((p) => '<div class="plan"><div class="actions" style="align-items:center"><b style="flex:1">' + esc(p.n) + '</b><button class="x" data-act="edit-plan" data-id="' + p.id + '">Edit</button>' + delBtn("p:" + p.id, "del-plan", 'data-id="' + p.id + '"') + '</div><p class="small">' + esc(p.x) + '</p><div class="refs">' + (p.tags || []).filter((t) => node(t)).map((t) => '<button class="chip" data-act="open" data-id="' + t + '">' + esc(node(t).n) + "</button>").join("") + "</div></div>").join("");
  h += '<button class="btn ghost wide" data-act="add-plan">+ Add game plan</button></div>';
  return h;
}
function planSheet(id) {
  const p = id ? S.plans.items.find((x) => x.id === id) : null;
  let b = field("f-n", "Against whom", inp("f-n", p ? p.n : "", "text", 'autofocus placeholder="e.g. Against a big, strong opponent"'));
  b += field("f-x", "How to fight", ta("f-x", p ? p.x : "", "Never flat on the bottom, half guard…"));
  openSheet(p ? "Edit game plan" : "New game plan", () => b + picker("pos", "Related positions", "pos", { ph: "Search positions…" }), {
    state: { pk: { pos: (p ? p.tags : []).filter((t) => node(t)).map((t) => ({ id: t, n: node(t).n, c: 1 })) } },
    onSave() {
      const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
      const rec = p || { id: uid() }; rec.n = name; rec.x = sv("f-x").trim(); rec.tags = (UI.sheet.pk.pos || []).map((x) => x.id).filter(Boolean);
      if (!p) S.plans.items.push(rec); save("plans"); render(); return true;
    },
  });
}

/* ======================= TRAINING ======================= */
const STYPES = [["gi", "Gi"], ["nogi", "No-gi"], ["open", "Open mat"], ["priv", "Private"], ["drill", "Drilling"], ["comp", "Compete"]];
const SNAME = Object.fromEntries(STYPES);
function sessionsSorted() { return S.log.items.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)); }
VIEWS.log = function () {
  const today = todayIso(), items = sessionsSorted();
  const wk = mondayOf(today); const thisWk = items.filter((s) => s.d >= wk); const mo = today.slice(0, 7); const thisMo = items.filter((s) => s.d.startsWith(mo));
  const totalMin = items.reduce((a, s) => a + (+s.min || 0), 0);
  let h = '<div class="card"><div class="summary"><div class="stat"><b>' + thisWk.length + '</b><span>this week</span></div><div class="stat"><b>' + thisMo.length + '</b><span>this month</span></div><div class="stat"><b>' + (totalMin / 60).toFixed(totalMin >= 600 ? 0 : 1) + '</b><span>total hours</span></div></div>';
  // minutes per week, 8 weeks
  const bars = []; let maxM = 1;
  for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7 * i); const we = addDays(ws, 7); const m = items.filter((s) => s.d >= ws && s.d < we).reduce((a, s) => a + (+s.min || 0), 0); maxM = Math.max(maxM, m); bars.push([ws, m]); }
  h += '<div class="bars">' + bars.map((b) => '<div class="b"><i style="height:' + Math.round((b[1] / maxM) * 100) + '%" title="' + b[1] + ' min"></i><span>' + b[0].slice(5).replace("-", "/") + "</span></div>").join("") + '</div><p class="muted small">Minutes per week</p></div>';
  h += '<button class="btn big wide" data-act="add-sess">+ Log training</button>';
  h += timerCard();
  // submission stats
  const given = {}, got = {};
  for (const s of items) { for (const x of s.subs || []) given[x.n] = (given[x.n] || 0) + (+x.c || 1); for (const x of s.taps || []) got[x.n] = (got[x.n] || 0) + (+x.c || 1); }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tg = top(given), tt = top(got);
  if (tg.length || tt.length) {
    const mx = Math.max(1, ...tg.map((x) => x[1]), ...tt.map((x) => x[1]));
    const rows = (arr, cls) => arr.map((x) => '<div class="row"><div class="txt"><b>' + esc(x[0]) + '</b><div class="bar"><i style="width:' + Math.round((x[1] / mx) * 100) + "%;background:var(--" + cls + ')"></i></div></div><span class="num">' + x[1] + "</span></div>").join("");
    h += '<div class="card"><div class="grid2"><div><h3>I finished</h3><div class="list">' + (rows(tg, "ok") || '<p class="empty">—</p>') + '</div></div><div><h3>Caught me</h3><div class="list">' + (rows(tt, "bad") || '<p class="empty">—</p>') + "</div></div></div></div>";
  }
  // history
  h += '<div class="card"><h3>Log</h3>';
  if (!items.length) h += '<p class="empty">No sessions yet. Start by logging today’s training.</p>';
  else {
    let lastMo = ""; h += '<div class="list">';
    for (const s of items.slice(0, 60)) {
      const m = s.d.slice(0, 7); if (m !== lastMo) { lastMo = m; h += '<div class="group-label">' + MON[+m.slice(5) - 1] + " " + m.slice(0, 4) + "</div>"; }
      const bits = [s.min + " min"]; if (s.rolls) bits.push(s.rolls + " rounds"); const sg = (s.subs || []).reduce((a, x) => a + (+x.c || 1), 0), st = (s.taps || []).reduce((a, x) => a + (+x.c || 1), 0); if (sg || st) bits.push(sg + " / " + st);
      h += '<button class="row" data-act="edit-sess" data-id="' + s.id + '"><div class="txt"><b>' + fmtD(s.d) + ' <span class="pill na">' + (SNAME[s.type] || s.type) + "</span></b><small>" + bits.join(" · ") + ((s.tech || []).length ? " · " + esc(s.tech.map((t) => t.n).join(", ")) : "") + "</small></div>" + CHEV + "</button>";
    }
    h += "</div>";
  }
  return h + "</div>";
};
function sessSheet(id) {
  const s = id ? S.log.items.find((x) => x.id === id) : null;
  const body = () => {
  let b = '<div class="grid2">' + field("f-d", "Date", inp("f-d", s ? s.d : todayIso(), "date", 'max="' + todayIso() + '"')) + field("f-min", "Minutes", inp("f-min", s ? s.min : 60, "number", 'inputmode="numeric" min="0" step="5"')) + "</div>";
  b += '<div class="field"><span class="lbl">Type</span>' + chips("type", STYPES, s ? s.type : "gi") + "</div>";
  b += '<div class="grid2">' + field("f-rolls", "Rounds (sparring)", inp("f-rolls", s ? s.rolls : "", "number", 'inputmode="numeric" min="0"')) + '<div class="field"><span class="lbl">How hard was it (1–5)</span>' + scale("rpe", s ? +s.rpe : 0, 1, 5) + "</div></div>";
  b += picker("tech", "Techniques drilled", "mv", { ph: "Search techniques…" });
  b += picker("subs", "I finished", "sub", { ph: "Add a submission…", counts: true });
  b += picker("taps", "Caught me", "sub", { ph: "What caught you…", counts: true });
  b += field("f-good", "What went well", ta("f-good", s ? s.good : "", ""));
  b += field("f-bad", "What did not work, what to fix", ta("f-bad", s ? s.bad : "", ""));
  b += field("f-note", "Notes", ta("f-note", s ? s.note : "", ""));
  return b; };
  openSheet(s ? "Edit training" : "Log training", body, {
    state: { picks: { type: s ? s.type : "gi", rpe: s ? +s.rpe : 0 }, pk: { tech: clone(s ? s.tech || [] : []), subs: clone(s ? s.subs || [] : []), taps: clone(s ? s.taps || [] : []) } },
    onSave() {
      const d = sv("f-d"); if (!d || d > todayIso()) { toast("Check the date"); return false; }
      const min = +sv("f-min"); if (!min) { $("f-min").focus(); return false; }
      const rec = s || { id: uid() }; const old = s ? s.d : "";
      rec.d = d; rec.min = min; rec.type = pickVal("type", "gi"); rec.rolls = +sv("f-rolls") || 0; rec.rpe = pickVal("rpe", 0);
      rec.tech = UI.sheet.pk.tech || []; rec.subs = UI.sheet.pk.subs || []; rec.taps = UI.sheet.pk.taps || [];
      rec.good = sv("f-good").trim(); rec.bad = sv("f-bad").trim(); rec.note = sv("f-note").trim();
      if (!s) S.log.items.push(rec); save("log"); mirrorSession(rec, old); toast("Training saved"); render(); return true;
    },
    onDelete: s ? () => { S.log.items = S.log.items.filter((x) => x.id !== s.id); save("log"); unmirrorSession(s.id, s.d); toast("Deleted"); render(); return true; } : null,
  });
}

/* ---------- round timer ---------- */
const T = { on: false, phase: "work", round: 1, end: 0, left: 0, tick: null, ctx: null, lock: null };
function timerCard() {
  const c = S.settings.timer;
  return '<div class="card timer" id="timer"><div class="ph" id="t-ph"></div><div class="big" id="t-big"></div><div class="actions" style="width:100%"><button class="btn" data-act="t-start" id="t-start">Start</button><button class="btn ghost" data-act="t-reset">Reset</button></div>' +
    '<div class="cfg">' + field("t-work", "Round, min", inp("t-work", c.work, "number", 'inputmode="numeric" min="1" max="60" data-tcfg="work"')) + field("t-rest", "Rest, min", inp("t-rest", c.rest, "number", 'inputmode="numeric" min="0" max="30" data-tcfg="rest"')) + field("t-rounds", "Rounds", inp("t-rounds", c.rounds, "number", 'inputmode="numeric" min="1" max="30" data-tcfg="rounds"')) + "</div></div>";
}
function fmtT(sec) { sec = Math.max(0, Math.ceil(sec)); return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
function renderTimer() {
  const el = $("timer"); if (!el) return; const c = S.settings.timer;
  const left = T.on ? Math.max(0, (T.end - Date.now()) / 1000) : T.left || c.work * 60;
  $("t-big").textContent = fmtT(left); $("t-big").className = "big" + (T.phase === "rest" ? " rest" : "");
  $("t-ph").textContent = (T.phase === "rest" ? "Rest" : "Round") + " " + T.round + " / " + c.rounds + (T.on ? "" : T.left ? " · paused" : "");
  $("t-start").textContent = T.on ? "Pause" : T.left ? "Resume" : "Start";
}
function beep(n) {
  try { T.ctx = T.ctx || new (window.AudioContext || window.webkitAudioContext)(); const ctx = T.ctx; for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); const t = ctx.currentTime + i * 0.35; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.start(t); o.stop(t + 0.3); } } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(n === 1 ? 200 : [300, 150, 300, 150, 300]);
}
function tStart() {
  const c = S.settings.timer;
  if (T.on) { T.on = false; T.left = Math.max(0, (T.end - Date.now()) / 1000); clearInterval(T.tick); if (T.lock) { T.lock.release().catch(() => {}); T.lock = null; } renderTimer(); return; }
  if (!T.left) { T.phase = "work"; T.round = 1; T.left = c.work * 60; }
  T.end = Date.now() + T.left * 1000; T.on = true; beep(1);
  if (navigator.wakeLock) navigator.wakeLock.request("screen").then((l) => (T.lock = l)).catch(() => {});
  clearInterval(T.tick); T.tick = setInterval(tTick, 250); renderTimer();
}
function tTick() {
  const c = S.settings.timer; if (!T.on) return;
  if (Date.now() < T.end) { renderTimer(); return; }
  if (T.phase === "work") { if (T.round >= c.rounds) { beep(3); tReset(); toast("Done. Well done!"); return; } if (c.rest > 0) { T.phase = "rest"; T.end = Date.now() + c.rest * 60000; beep(2); } else { T.round++; T.end = Date.now() + c.work * 60000; beep(2); } }
  else { T.phase = "work"; T.round++; T.end = Date.now() + c.work * 60000; beep(1); }
  renderTimer();
}
function tReset() { T.on = false; T.left = 0; T.phase = "work"; T.round = 1; clearInterval(T.tick); if (T.lock) { T.lock.release().catch(() => {}); T.lock = null; } renderTimer(); }

/* ======================= BODY ======================= */
const BCATS = [["warm", "Warm-up"], ["str", "Stretch"], ["sc", "Strength"], ["cardio", "Cardio"]];
const BNAME = Object.fromEntries(BCATS);
VIEWS.body = function () {
  const cat = UI.body.cat; const today = todayIso(), wk = mondayOf(today);
  const rs = S.body.routines.filter((r) => r.cat === cat); const logs = S.body.items.filter((x) => x.cat === cat).sort((a, b) => (a.d < b.d ? 1 : -1));
  const wkN = logs.filter((x) => x.d >= wk).length, moN = logs.filter((x) => x.d.startsWith(today.slice(0, 7))).length, moMin = logs.filter((x) => x.d.startsWith(today.slice(0, 7))).reduce((a, x) => a + (+x.min || 0), 0);
  let h = seg(BCATS, cat, "bodycat");
  h += '<div class="card"><div class="summary"><div class="stat"><b>' + wkN + '</b><span>this week</span></div><div class="stat"><b>' + moN + '</b><span>this month</span></div><div class="stat"><b>' + moMin + '</b><span>min this month</span></div></div>' + bodyTip(cat) + "</div>";
  for (const r of rs) {
    const open = UI.body.open === r.id;
    h += '<div class="card"><button class="row" data-act="body-open" data-id="' + r.id + '" aria-expanded="' + open + '"><div class="txt"><b>' + esc(r.n) + "</b><small>" + (r.min ? r.min + " min · " : "") + (r.items || []).length + " exercises</small></div>" + CHEV + "</button>";
    if (open) {
      h += '<div class="list">' + (r.items || []).map((it, i) => { const on = (UI.body.done[r.id] || {})[i]; return '<div class="row' + (on ? " done" : "") + '"><button class="check' + (on ? " on" : "") + '" data-act="body-check" data-id="' + r.id + '" data-i="' + i + '" aria-pressed="' + !!on + '">' + CHECK + '</button><div class="txt">' + esc(it) + "</div></div>"; }).join("") + "</div>";
      h += '<div class="actions"><button class="btn" data-act="body-log" data-id="' + r.id + '">Done, log it</button><button class="btn ghost" data-act="edit-routine" data-id="' + r.id + '">Edit</button>' + delBtn("r:" + r.id, "del-routine", 'data-id="' + r.id + '"') + "</div>";
    }
    h += "</div>";
  }
  h += '<button class="btn ghost wide" data-act="add-routine">+ Add routine</button>';
  if (cat === "cardio") h += timerCard();
  h += '<div class="card"><h3>' + BNAME[cat] + " log</h3>";
  if (!logs.length) h += '<p class="empty">No entries yet. Open a routine and tap “Done, log it”.</p>';
  else h += '<div class="list">' + logs.slice(0, 20).map((x) => '<button class="row" data-act="edit-blog" data-id="' + x.id + '"><div class="txt"><b>' + fmtD(x.d) + " · " + esc(x.n) + "</b><small>" + (x.min ? x.min + " min" : "") + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>";
  h += '<button class="btn ghost wide" data-act="body-log" data-id="">+ Log something else</button></div>';
  return h;
};
UI.body.done = {};
function bodyTip(cat) {
  return '<p class="muted small">' + { warm: "5–10 min before every session. Shrimps, bridges and stand-ups are the base of technique.", str: "After training or before bed. No pain, just a stretch you can feel.", sc: "Twice a week is enough. Keep a day between lifting and jiu-jitsu.", cardio: "1–2 times a week. Round intervals before competitions, long easy runs otherwise." }[cat] + "</p>";
}
function routineSheet(id) {
  const r = id ? S.body.routines.find((x) => x.id === id) : null;
  let b = field("f-n", "Name", inp("f-n", r ? r.n : "", "text", "autofocus"));
  b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", BCATS, r ? r.cat : UI.body.cat) + "</div>";
  b += field("f-min", "Duration, min", inp("f-min", r ? r.min : 10, "number", 'inputmode="numeric" min="0"'));
  b += field("f-items", "Exercises (one per line)", ta("f-items", (r ? r.items : []).join("\n"), "Shrimps · 2×20\nBridges · 15"));
  openSheet(r ? "Edit routine" : "New routine", b, {
    state: { picks: { cat: r ? r.cat : UI.body.cat } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = r || { id: uid() }; rec.n = n; rec.cat = pickVal("cat", UI.body.cat); rec.min = +sv("f-min") || 0; rec.items = lines(sv("f-items")); if (!r) S.body.routines.push(rec); UI.body.cat = rec.cat; UI.body.open = rec.id; save("body"); render(); return true; },
  });
}
function blogSheet(id, rid) {
  const x = id ? S.body.items.find((i) => i.id === id) : null; const r = rid ? S.body.routines.find((i) => i.id === rid) : null;
  let b = '<div class="grid2">' + field("f-d", "Date", inp("f-d", x ? x.d : todayIso(), "date", 'max="' + todayIso() + '"')) + field("f-min", "Minutes", inp("f-min", x ? x.min : r ? r.min : 20, "number", 'inputmode="numeric" min="0"')) + "</div>";
  b += field("f-n", "What did you do", inp("f-n", x ? x.n : r ? r.n : "", "text", r ? "" : "autofocus"));
  b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", BCATS, x ? x.cat : r ? r.cat : UI.body.cat) + "</div>";
  b += field("f-note", "Notes", ta("f-note", x ? x.note : "", "Weight, reps, how it felt…"));
  openSheet(x ? "Edit entry" : "Log it", b, {
    state: { picks: { cat: x ? x.cat : r ? r.cat : UI.body.cat } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = x || { id: uid(), rid: rid || "" }; rec.d = sv("f-d") || todayIso(); rec.min = +sv("f-min") || 0; rec.n = n; rec.cat = pickVal("cat", UI.body.cat); rec.note = sv("f-note").trim(); if (!x) S.body.items.push(rec); if (r) UI.body.done[r.id] = {}; UI.body.cat = rec.cat; save("body"); toast("Logged"); render(); return true; },
    onDelete: x ? () => { S.body.items = S.body.items.filter((i) => i.id !== x.id); save("body"); render(); return true; } : null,
  });
}

/* ======================= RANK ======================= */
VIEWS.belt = function () {
  const track = S.belt.track; const ladder = SEED.belts[track]; const cur = beltDef(track, S.belt.belt);
  const idx = ladder.findIndex((b) => b.id === S.belt.belt);
  let h = '<div class="card"><div class="belt big" role="img" aria-label="' + esc(cur.n) + ' belt">' + beltHtml(true) + "</div>";
  h += '<div><h2>' + esc(cur.n) + " belt" + (S.belt.stripes ? ", " + S.belt.stripes + " stripes" : "") + "</h2>" + (S.belt.since ? '<p class="muted small">' + fmtLong(S.belt.since) + " · " + monthsSince(S.belt.since) + " months</p>" : '<p class="muted small">Log when you got it.</p>') + "</div>";
  if (cur.min) h += '<p class="small">' + esc(cur.min) + " (IBJJF).</p>";
  h += '<div class="actions"><button class="btn" data-act="add-promo">Log a promotion</button><button class="btn ghost" data-act="edit-belt">Edit current belt</button></div></div>';
  h += seg([["kids", "Kids 4–15"], ["adult", "Adult 16+"]], track, "belttrack");
  h += '<div class="card"><h3>Ladder</h3><div class="ladder">' + ladder.map((b, i) => '<div class="rung' + (i === idx ? " cur" : i < idx ? " past" : "") + '"><span class="sw">' + beltSwatch(b) + '</span><span style="flex:1">' + esc(b.n) + (i === idx ? ' <span class="pill ok">now</span>' : "") + '</span><span class="muted small">' + esc(b.age) + " yrs</span></div>").join("") + "</div>" +
    '<p class="muted small">' + (track === "kids" ? "Kids belts go up to age 15. From 16 you move to the adult ladder (usually blue after green)." : "0–4 stripes per belt. Times are minimums, the coach decides.") + "</p></div>";
  // goals
  const goals = S.belt.goals[S.belt.belt] || [];
  const done = goals.filter((g) => g.done).length;
  h += '<div class="card"><div class="card-head"><h3>Things to learn at this belt</h3><span class="muted small num">' + done + " / " + goals.length + "</span></div>";
  if (goals.length) h += '<div class="bar"><i style="width:' + Math.round((done / goals.length) * 100) + '%"></i></div>';
  h += '<div class="list">' + goals.map((g) => '<div class="row' + (g.done ? " done" : "") + '"><button class="check' + (g.done ? " on" : "") + '" data-act="goal-toggle" data-id="' + g.id + '" aria-pressed="' + !!g.done + '">' + CHECK + '</button><div class="txt">' + esc(g.t) + "</div>" + delBtn("g:" + g.id, "del-goal", 'data-id="' + g.id + '"') + "</div>").join("") + "</div>";
  h += '<form class="actions" id="goal-form" style="align-items:stretch"><input id="goal-t" type="text" placeholder="New goal…" style="flex:1" aria-label="New goal"><button class="btn" type="submit" style="flex:none">Add</button></form>';
  if (!goals.length && SEED.beltGoals[S.belt.belt.split("-")[0]]) h += '<button class="btn ghost wide" data-act="seed-goals">Add example goals</button>';
  h += "</div>";
  // history
  const hist = S.belt.history.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  h += '<div class="card"><h3>Promotion history</h3>' + (hist.length ? '<div class="list">' + hist.map((x) => '<div class="row"><span class="sw ladder" style="display:flex;width:40px;height:12px;border:1px solid var(--line);border-radius:2px;overflow:hidden">' + beltSwatch(beltDef(x.track || track, x.belt)) + '</span><div class="txt"><b>' + esc(beltDef(x.track || track, x.belt).n) + (x.stripes ? ", " + x.stripes + " stripes" : "") + "</b><small>" + fmtLong(x.d) + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + delBtn("h:" + x.id, "del-promo", 'data-id="' + x.id + '"') + "</div>").join("") + "</div>" : '<p class="empty">No promotions logged.</p>') + "</div>";
  return h;
};
function beltSheet(promo) {
  const track = S.belt.track; const ladder = SEED.belts[track];
  const b = () => '<div class="field"><span class="lbl">Ladder</span>' + chips("track", [["kids", "Kids"], ["adult", "Adult"]], pickVal("track", track)) + "</div>" +
    field("f-belt", "Belt", '<select id="f-belt">' + SEED.belts[pickVal("track", track)].map((x) => '<option value="' + x.id + '"' + (x.id === S.belt.belt ? " selected" : "") + ">" + esc(x.n) + "</option>").join("") + "</select>") +
    '<div class="field"><span class="lbl">Stripes</span>' + scale("stripes", promo ? Math.min(4, (+S.belt.stripes || 0) + 1) : +S.belt.stripes || 0, 0, 4) + "</div>" +
    field("f-d", promo ? "When" : "Date you got the belt", inp("f-d", promo ? todayIso() : S.belt.since, "date", 'max="' + todayIso() + '"')) +
    (promo ? field("f-note", "Note (coach, club)", inp("f-note", "", "text")) : "");
  openSheet(promo ? "Log a promotion" : "Current belt", b, {
    state: { picks: { track, stripes: promo ? Math.min(4, (+S.belt.stripes || 0) + 1) : +S.belt.stripes || 0 }, rerender: "belt" },
    onSave() {
      const t = pickVal("track", track); const belt = sv("f-belt"); const stripes = pickVal("stripes", 0); const d = sv("f-d");
      const beltChanged = belt !== S.belt.belt;
      S.belt.track = t; S.belt.belt = belt; S.belt.stripes = stripes;
      if (promo) { if (beltChanged || !S.belt.since) S.belt.since = d || todayIso(); S.belt.history.push({ id: uid(), d: d || todayIso(), track: t, belt, stripes, note: sv("f-note").trim() }); toast("Congratulations!"); }
      else S.belt.since = d;
      save("belt"); mirrorBelt(); render(); return true;
    },
  });
}

/* ======================= WEIGHT ======================= */
VIEWS.weight = function () {
  const items = S.weight.items.slice().sort((a, b) => (a.d < b.d ? -1 : 1)); const last = items[items.length - 1];
  const cls = SEED.weightClasses[S.weight.cls] || SEED.weightClasses.adult_m; const tgt = cls.c.find((c) => c[0] === S.weight.target); const lim = tgt ? tgt[1] : null;
  let h = '<div class="card"><form class="grid2" id="w-form" style="align-items:end">' + field("w-kg", "Today’s weight, kg", inp("w-kg", "", "number", 'inputmode="decimal" step="0.1" min="10" max="200" placeholder="' + (last ? last.kg : "45.0") + '"')) + field("w-d", "Date", inp("w-d", todayIso(), "date", 'max="' + todayIso() + '"')) + '<button class="btn" type="submit" style="grid-column:1/-1">Log it</button></form></div>';
  if (last) {
    const wkAgo = items.filter((x) => x.d <= addDays(last.d, -7)).pop(); const diff = wkAgo ? (last.kg - wkAgo.kg) : null;
    h += '<div class="card"><div class="summary"><div class="stat"><b>' + last.kg + '</b><span>latest, kg</span></div><div class="stat"><b>' + (diff == null ? "—" : (diff > 0 ? "+" : "") + diff.toFixed(1)) + '</b><span>7 days</span></div><div class="stat"><b>' + (lim == null ? "—" : (lim - last.kg).toFixed(1)) + '</b><span>' + (lim == null ? "no limit set" : "to the limit") + "</span></div></div>" + weightChart(items.slice(-30), lim) + "</div>";
  }
  h += '<div class="card"><h3>Competition weight class</h3>' + field("w-cls", "Category", '<select id="w-cls" data-act-change="w-cls">' + Object.entries(SEED.weightClasses).map(([k, v]) => '<option value="' + k + '"' + (k === S.weight.cls ? " selected" : "") + ">" + esc(v.n) + "</option>").join("") + "</select>") +
    '<div class="list">' + cls.c.map((c) => '<button class="row" data-act="w-target" data-v="' + esc(c[0]) + '"><span class="check' + (S.weight.target === c[0] ? " on" : "") + '">' + CHECK + '</span><div class="txt"><b>' + esc(c[0]) + "</b></div><span class=\"num\">" + (c[1] == null ? "no limit" : c[1] + " kg limit") + "</span></button>").join("") + "</div>" +
    '<p class="muted small">IBJJF weighs you in the gi, which adds about 1–1.5 kg. No-gi divisions weigh in shorts and rashguard. Kids divisions differ per event, ask your coach.</p></div>';
  if (items.length) h += '<div class="card"><h3>Log</h3><div class="list">' + items.slice().reverse().slice(0, 30).map((x) => '<div class="row"><div class="txt"><b>' + x.kg + ' kg</b><small>' + fmtLong(x.d) + "</small></div>" + delBtn("w:" + x.id, "del-weight", 'data-id="' + x.id + '"') + "</div>").join("") + "</div></div>";
  return h;
};
function weightChart(items, lim) {
  if (items.length < 2) return '<p class="muted small">The chart appears after two or more entries.</p>';
  const W = 320, H = 160, px = 28, py = 14; const vals = items.map((x) => +x.kg); let lo = Math.min(...vals, lim == null ? Infinity : lim), hi = Math.max(...vals, lim == null ? -Infinity : lim); if (hi - lo < 2) { lo -= 1; hi += 1; } lo = Math.floor(lo - 0.5); hi = Math.ceil(hi + 0.5);
  const x = (i) => px + (i / (items.length - 1)) * (W - px - 6), y = (v) => py + (1 - (v - lo) / (hi - lo)) * (H - py * 2);
  const d = items.map((it, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(it.kg).toFixed(1)).join(" ");
  let h = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Weight chart">';
  h += '<text x="2" y="' + (py + 4) + '">' + hi + '</text><text x="2" y="' + (H - py + 4) + '">' + lo + "</text>";
  if (lim != null) h += '<line class="lim" x1="' + px + '" x2="' + W + '" y1="' + y(lim).toFixed(1) + '" y2="' + y(lim).toFixed(1) + '"/>';
  h += '<path class="l" d="' + d + '"/>' + items.map((it, i) => '<circle class="d" r="3" cx="' + x(i).toFixed(1) + '" cy="' + y(it.kg).toFixed(1) + '"/>').join("");
  h += '<text x="' + px + '" y="' + (H - 2) + '">' + fmtD(items[0].d) + '</text><text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end">' + fmtD(items[items.length - 1].d) + "</text></svg>";
  return h;
}

/* ======================= COMPETITION ======================= */
const RES = [["w", "Win"], ["l", "Loss"], ["d", "Draw"]];
const HOW = [["sub", "Submission"], ["pts", "Points"], ["adv", "Advantage"], ["ref", "Referee decision"], ["dq", "DQ"], ["wo", "Walkover"]];
const HNAME = Object.fromEntries(HOW);
const MEDALS = [["", "No medal"], ["gold", "Gold"], ["silver", "Silver"], ["bronze", "Bronze"]];
const MNAME = { gold: "🥇 Gold", silver: "🥈 Silver", bronze: "🥉 Bronze" };
VIEWS.comp = function () {
  if (UI.comp.id) { const ev = S.comp.events.find((e) => e.id === UI.comp.id); if (ev) return vEvent(ev); UI.comp.id = null; }
  const today = todayIso(); const evs = S.comp.events.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  const all = evs.flatMap((e) => e.matches || []); const w = all.filter((m) => m.res === "w").length, l = all.filter((m) => m.res === "l").length, subs = all.filter((m) => m.res === "w" && m.how === "sub").length;
  const medals = evs.filter((e) => e.medal).length;
  let h = '<div class="card"><div class="summary four"><div class="stat"><b>' + w + '</b><span>wins</span></div><div class="stat"><b>' + l + '</b><span>losses</span></div><div class="stat"><b>' + subs + '</b><span>by submission</span></div><div class="stat"><b>' + medals + '</b><span>medals</span></div></div></div>';
  h += '<button class="btn big wide" data-act="add-event">+ Add competition</button>';
  const up = evs.filter((e) => e.d >= today).reverse(), past = evs.filter((e) => e.d < today);
  const row = (e) => { const ms = e.matches || []; const ww = ms.filter((m) => m.res === "w").length; const dd = daysBetween(today, e.d); return '<button class="row" data-act="open-event" data-id="' + e.id + '"><div class="txt"><b>' + esc(e.n) + (e.medal ? " " + MNAME[e.medal] : "") + "</b><small>" + fmtLong(e.d) + (e.div ? " · " + esc(e.div) : "") + (e.d >= today ? ' · <span class="pill ok">' + (dd === 0 ? "today" : dd + " days left") + "</span>" : ms.length ? " · " + ww + "–" + (ms.length - ww) : "") + "</small></div>" + CHEV + "</button>"; };
  if (up.length) h += '<div class="card"><h3>Upcoming</h3><div class="list">' + up.map(row).join("") + "</div></div>";
  h += '<div class="card"><h3>Past competitions</h3>' + (past.length ? '<div class="list">' + past.map(row).join("") + "</div>" : '<p class="empty">No competitions logged.</p>') + "</div>";
  return h;
};
function vEvent(e) {
  const today = todayIso(); const ms = e.matches || []; const ww = ms.filter((m) => m.res === "w").length;
  let h = '<button class="back" data-act="close-event"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Compete</button>';
  h += '<div class="card"><h2>' + esc(e.n) + '</h2><p class="muted small">' + fmtLong(e.d) + (e.org ? " · " + esc(e.org) : "") + (e.place ? " · " + esc(e.place) : "") + "</p>";
  const bits = []; if (e.div) bits.push(e.div); bits.push(e.gi === false ? "No-gi" : "Gi"); if (e.target) bits.push("Weight " + e.target + " kg limit"); h += '<p class="small">' + esc(bits.join(" · ")) + "</p>";
  if (e.d >= today) { const dd = daysBetween(today, e.d); const lw = S.weight.items.slice().sort((a, b) => (a.d < b.d ? 1 : -1))[0]; h += '<div class="tip">' + (dd === 0 ? "Today!" : dd + " days to go.") + (e.target && lw ? " Last weight " + lw.kg + " kg, " + (e.target - lw.kg).toFixed(1) + " kg to the limit." : "") + "</div>"; }
  if (e.plan && S.plans.items.find((p) => p.id === e.plan)) { const p = S.plans.items.find((x) => x.id === e.plan); h += '<p class="small"><b>Game plan:</b> ' + esc(p.n) + " — " + esc(p.x) + "</p>"; }
  h += '<div class="field"><span class="lbl">Result</span>' + chips("medal", MEDALS, e.medal || "") + "</div>";
  h += '<div class="actions"><button class="btn ghost" data-act="edit-event" data-id="' + e.id + '">Edit</button>' + delBtn("e:" + e.id, "del-event", 'data-id="' + e.id + '"') + "</div></div>";
  h += '<div class="card"><div class="card-head"><h3>Matches</h3>' + (ms.length ? '<span class="muted small">' + ww + " wins · " + (ms.length - ww) + " losses</span>" : "") + "</div>";
  h += ms.length ? '<div class="list">' + ms.map((m, i) => '<button class="row" data-act="edit-match" data-id="' + e.id + '" data-i="' + i + '"><span class="pill ' + (m.res === "w" ? "ok" : m.res === "l" ? "bad" : "na") + '">' + (m.res === "w" ? "Win" : m.res === "l" ? "Loss" : "Draw") + '</span><div class="txt"><b>' + (i + 1) + ". " + esc(m.opp || "Opponent") + "</b><small>" + [HNAME[m.how], m.tech, m.score].filter(Boolean).map(esc).join(" · ") + (m.note ? " · " + esc(m.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>" : '<p class="empty">One row per match. Write what won and what lost.</p>';
  h += '<button class="btn ghost wide" data-act="add-match" data-id="' + e.id + '">+ Add match</button></div>';
  return h;
}
function eventSheet(id) {
  const e = id ? S.comp.events.find((x) => x.id === id) : null;
  const b = () => field("f-n", "Competition name", inp("f-n", e ? e.n : "", "text", "autofocus")) + '<div class="grid2">' + field("f-d", "Date", inp("f-d", e ? e.d : todayIso(), "date")) + field("f-org", "Organizer", inp("f-org", e ? e.org : "", "text", 'placeholder="IBJJF, federation, club"')) + "</div>" +
    '<div class="grid2">' + field("f-place", "Where", inp("f-place", e ? e.place : "", "text")) + field("f-div", "Division (age, belt, weight)", inp("f-div", e ? e.div : "", "text", 'placeholder="Kids 12, grey, 45 kg"')) + "</div>" +
    '<div class="grid2"><div class="field"><span class="lbl">Uniform</span>' + chips("gi", [["1", "Gi"], ["0", "No-gi"]], e && e.gi === false ? "0" : "1") + "</div>" + field("f-target", "Weight limit, kg", inp("f-target", e ? e.target : "", "number", 'inputmode="decimal" step="0.1"')) + "</div>" +
    field("f-plan", "Game plan", '<select id="f-plan"><option value="">—</option>' + S.plans.items.map((p) => '<option value="' + p.id + '"' + (e && e.plan === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>");
  openSheet(e ? "Edit competition" : "New competition", b, {
    state: { picks: { gi: e && e.gi === false ? "0" : "1" } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = e || { id: uid(), matches: [], medal: "" }; rec.n = n; rec.d = sv("f-d") || todayIso(); rec.org = sv("f-org").trim(); rec.place = sv("f-place").trim(); rec.div = sv("f-div").trim(); rec.gi = pickVal("gi", "1") === "1"; rec.target = +sv("f-target") || ""; rec.plan = sv("f-plan"); if (!e) { S.comp.events.push(rec); UI.comp.id = rec.id; } save("comp"); render(); return true; },
  });
}
function matchSheet(eid, i) {
  const e = S.comp.events.find((x) => x.id === eid); if (!e) return; e.matches = e.matches || []; const m = i != null ? e.matches[i] : null;
  const b = () => field("f-opp", "Opponent", inp("f-opp", m ? m.opp : "", "text", 'autofocus placeholder="Name, club"')) +
    '<div class="field"><span class="lbl">Result</span>' + chips("res", RES, m ? m.res : "w") + '</div><div class="field"><span class="lbl">How</span>' + chips("how", HOW, m ? m.how : "sub") + "</div>" +
    picker("tech", "Which technique", "sub", { ph: "Submission, sweep…" }) +
    '<div class="grid2">' + field("f-score", "Points", inp("f-score", m ? m.score : "", "text", 'placeholder="4–2"')) + field("f-note", "Notes", inp("f-note", m ? m.note : "", "text")) + "</div>";
  openSheet(m ? "Edit match" : "Add match", b, {
    state: { picks: { res: m ? m.res : "w", how: m ? m.how : "sub" }, pk: { tech: m && m.tech ? [{ id: m.techId || "", n: m.tech, c: 1 }] : [] } },
    onSave() { const rec = m || {}; rec.opp = sv("f-opp").trim(); rec.res = pickVal("res", "w"); rec.how = pickVal("how", "sub"); const t = (UI.sheet.pk.tech || [])[0]; rec.tech = t ? t.n : ""; rec.techId = t ? t.id : ""; rec.score = sv("f-score").trim(); rec.note = sv("f-note").trim(); if (!m) e.matches.push(rec); save("comp"); render(); return true; },
    onDelete: m ? () => { e.matches.splice(i, 1); save("comp"); render(); return true; } : null,
  });
}

/* ======================= SETTINGS ======================= */
function settingsSheet() {
  const b = '<div class="field"><span class="lbl">Theme</span>' + chips("theme", [["system", "Device"], ["light", "Light"], ["dark", "Dark"]], S.settings.theme || "system") + "</div>" +
    '<div class="field"><span class="lbl">Data</span><div class="actions"><button class="btn ghost" data-act="backup">Download backup (JSON)</button><label class="btn ghost" style="display:flex;align-items:center;justify-content:center">Restore from backup<input id="imp-file" type="file" accept="application/json" hidden></label></div></div>' +
    '<div class="field"><span class="lbl">Technique library</span><button class="btn ghost' + (UI.confirm === "reset" ? " danger" : "") + '" data-act="reset-seed">' + (UI.confirm === "reset" ? "Really reset? Everything you added will be lost" : "Reload the starter library") + "</button></div>" +
    '<p class="muted small">' + (mode === "cloud" ? "Signed in: " + esc((SB.session || {}).email || "") : "Local mode: data stays on this device only.") + "</p>" +
    (mode === "cloud" ? '<button class="btn ghost danger" data-act="logout">' + (UI.confirm === "logout" ? "Sign out?" : "Sign out") + "</button>" : "");
  openSheet("Settings", b, { state: { picks: { theme: S.settings.theme || "system" } } });
}
function applyTheme() { const t = S.settings.theme || "system"; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; try { localStorage.setItem("bjj-theme", t); } catch (e) {} }
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
async function importBackup(file) {
  try { const o = JSON.parse(await file.text()); if (!o || !o.tree || !o.log) throw 0; for (const k of KEYS) if (o[k]) S[k] = o[k]; normalize(); for (const k of KEYS) save(k); applyTheme(); closeSheet(); render(); toast("Restored"); } catch (e) { toast("That file does not match"); }
}

/* ======================= ACTIONS ======================= */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return; const act = el.dataset.act, ds = el.dataset;
  if (act === "sheet-close") { closeSheet(); return; }
  if (act === "sheet-save") { if (UI.sheetSave && UI.sheetSave() !== false) closeSheet(); return; }
  if (act === "sheet-del") { if (armConfirmSheet(el)) { if (UI.sheetDel && UI.sheetDel() !== false) closeSheet(); } return; }
  if (act === "pick") { if (UI.sheet) UI.sheet.picks[ds.group] = ds.group === "rpe" || ds.group === "stripes" ? +ds.v : ds.v; const g = el.closest("[data-group]"); if (g) g.querySelectorAll("[data-act=pick]").forEach((b) => b.classList.toggle("on", b === el)); if (ds.group === "theme") { S.settings.theme = ds.v; applyTheme(); save("settings"); } if (ds.group === "medal" && UI.comp.id) { const ev = S.comp.events.find((x) => x.id === UI.comp.id); if (ev) { ev.medal = ds.v; save("comp"); } } if (ds.group === "track" && UI.sheet) { const sel = $("f-belt"); if (sel) sel.innerHTML = SEED.belts[ds.v].map((x) => '<option value="' + x.id + '">' + esc(x.n) + "</option>").join(""); } return; }
  if (act === "pk-add") { pkAdd(ds.pk, ds.id, ds.n); return; }
  if (act === "pk-inc") { pkChange(ds.pk, +ds.i, 1); return; }
  if (act === "pk-dec") { pkChange(ds.pk, +ds.i, -1); return; }
  if (act === "pk-rm") { pkChange(ds.pk, +ds.i, 0); return; }
  switch (act) {
    case "tab": { const order = TABS.map((t) => t[0]); const anim = order.indexOf(ds.v) > order.indexOf(UI.tab) ? "enter-l" : "enter-r"; UI.tab = ds.v; try { localStorage.setItem("bjj-tab", ds.v); } catch (x) {} go(anim); break; }
    case "settings": settingsSheet(); break;
    case "techview": UI.tech.view = ds.v; render(); break;
    case "techmap": UI.tech.map = ds.v === "map"; try { localStorage.setItem("bjj-map", UI.tech.map ? "1" : "0"); } catch (x) {} render(); break;
    case "open": UI.tab = "tech"; UI.tech.id = ds.id; UI.tech.q = ""; go("enter-l"); break;
    case "back": UI.tech.id = ds.id || null; go("enter-r"); break;
    case "add-node": nodeSheet(null, ds.p || null); break;
    case "edit-node": nodeSheet(ds.id); break;
    case "del-node": if (armConfirm(ds.key)) { const ids = subtreeIds(ds.id); const n = node(ds.id); S.tree.nodes = nodes().filter((x) => !ids.includes(x.id)); UI.tech.id = n && n.p ? n.p : null; save("tree"); toast("Deleted"); go("enter-r"); } break;
    case "add-plan": planSheet(); break;
    case "edit-plan": planSheet(ds.id); break;
    case "del-plan": if (armConfirm(ds.key)) { S.plans.items = S.plans.items.filter((p) => p.id !== ds.id); save("plans"); render(); } break;
    case "add-sess": sessSheet(); break;
    case "edit-sess": sessSheet(ds.id); break;
    case "t-start": tStart(); break;
    case "t-reset": tReset(); break;
    case "bodycat": UI.body.cat = ds.v; UI.body.open = null; render(); break;
    case "body-open": UI.body.open = UI.body.open === ds.id ? null : ds.id; render(); break;
    case "body-check": { const d = (UI.body.done[ds.id] = UI.body.done[ds.id] || {}); d[ds.i] = !d[ds.i]; render(); break; }
    case "body-log": blogSheet(null, ds.id); break;
    case "edit-blog": blogSheet(ds.id); break;
    case "add-routine": routineSheet(); break;
    case "edit-routine": routineSheet(ds.id); break;
    case "del-routine": if (armConfirm(ds.key)) { S.body.routines = S.body.routines.filter((r) => r.id !== ds.id); save("body"); render(); } break;
    case "belttrack": S.belt.track = ds.v; if (!SEED.belts[ds.v].some((b) => b.id === S.belt.belt)) S.belt.belt = "white"; save("belt"); render(); break;
    case "add-promo": beltSheet(true); break;
    case "edit-belt": beltSheet(false); break;
    case "del-promo": if (armConfirm(ds.key)) { S.belt.history = S.belt.history.filter((x) => x.id !== ds.id); save("belt"); render(); } break;
    case "goal-toggle": { const g = (S.belt.goals[S.belt.belt] || []).find((x) => x.id === ds.id); if (g) { g.done = !g.done; save("belt"); render(); } break; }
    case "del-goal": if (armConfirm(ds.key)) { S.belt.goals[S.belt.belt] = (S.belt.goals[S.belt.belt] || []).filter((x) => x.id !== ds.id); save("belt"); render(); } break;
    case "seed-goals": S.belt.goals[S.belt.belt] = (SEED.beltGoals[S.belt.belt.split("-")[0]] || []).map((t) => ({ id: uid(), t, done: false })); save("belt"); render(); break;
    case "w-target": S.weight.target = S.weight.target === ds.v ? "" : ds.v; save("weight"); render(); break;
    case "del-weight": if (armConfirm(ds.key)) { S.weight.items = S.weight.items.filter((x) => x.id !== ds.id); save("weight"); render(); } break;
    case "add-event": eventSheet(); break;
    case "edit-event": eventSheet(ds.id); break;
    case "open-event": UI.comp.id = ds.id; go("enter-l"); break;
    case "close-event": UI.comp.id = null; go("enter-r"); break;
    case "del-event": if (armConfirm(ds.key)) { S.comp.events = S.comp.events.filter((x) => x.id !== ds.id); UI.comp.id = null; save("comp"); go("enter-r"); } break;
    case "add-match": matchSheet(ds.id, null); break;
    case "edit-match": matchSheet(ds.id, +ds.i); break;
    case "backup": download("bjj-backup-" + todayIso() + ".json", JSON.stringify(S, null, 2)); break;
    case "reset-seed": if (UI.confirm === "reset") { UI.confirm = null; seedAll(true); save("tree"); save("plans"); save("body"); UI.tech.id = null; closeSheet(); render(); toast("Starter library loaded"); } else { UI.confirm = "reset"; settingsSheet(); setTimeout(() => { if (UI.confirm === "reset") { UI.confirm = null; if (UI.sheet) settingsSheet(); } }, 3500); } break;
    case "logout": if (UI.confirm === "logout") { SB.storeSession(null); location.reload(); } else { UI.confirm = "logout"; settingsSheet(); setTimeout(() => { if (UI.confirm === "logout") { UI.confirm = null; if (UI.sheet) settingsSheet(); } }, 3500); } break;
  }
});
function armConfirmSheet(btn) { if (btn.dataset.armed) return true; btn.dataset.armed = "1"; btn.textContent = "Delete?"; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = "Delete"; } }, 3500); return false; }
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "tq") { UI.tech.q = t.value; const m = $("main"); const h = VIEWS.tech(); m.innerHTML = h; const q = $("tq"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
  if (t.dataset.pk) { pkSuggest(t); return; }
  if (t.dataset.tcfg) { const v = +t.value; if (v >= 0) { S.settings.timer[t.dataset.tcfg] = v; save("settings"); if (!T.on && !T.left) renderTimer(); } return; }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "w-cls") { S.weight.cls = t.value; S.weight.target = ""; save("weight"); render(); }
  if (t.id === "imp-file" && t.files[0]) importBackup(t.files[0]);
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "goal-form") { e.preventDefault(); const v = sv("goal-t").trim(); if (!v) return; (S.belt.goals[S.belt.belt] = S.belt.goals[S.belt.belt] || []).push({ id: uid(), t: v, done: false }); save("belt"); render(); }
  if (e.target.id === "w-form") { e.preventDefault(); const kg = +sv("w-kg"); const d = sv("w-d") || todayIso(); if (!kg) { $("w-kg").focus(); return; } const ex = S.weight.items.find((x) => x.d === d); if (ex) ex.kg = kg; else S.weight.items.push({ id: uid(), d, kg }); save("weight"); toast("Weight logged"); render(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && UI.sheet) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && UI.sheet && e.target.tagName === "INPUT" && !e.target.dataset.pk && e.target.type !== "textarea") { e.preventDefault(); if (UI.sheetSave && UI.sheetSave() !== false) closeSheet(); } });

/* ---------- boot ---------- */
try { const t = localStorage.getItem("bjj-theme"); if (t && t !== "system") document.documentElement.dataset.theme = t; } catch (e) {}
if (SB.configured()) { SB.loadSession(); if (SB.session) { setSync("saving", "Loading…"); startCloud(); } else showLogin(); } else startLocal();
})();
