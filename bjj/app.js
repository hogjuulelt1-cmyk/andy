/* Chinbilig · Jiu-jitsu. Static, no build. Data: Supabase docs table (paths bjj/*) or localStorage. */
(function () {
"use strict";
const SEED = window.BJJ_SEED;
const CFG = window.APP_CONFIG || {};
const LKEY = "bjj-v1";
const KEYS = ["tree", "plans", "log", "body", "belt", "weight", "comp", "rolls", "settings"];
const NS = () => "bjj/u/" + SB.uid() + "/";
const TAB_ALIAS = { log: "train", body: "train", belt: "me", weight: "me", comp: "me" };

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

/* ---------- Supabase (plain REST) ---------- */
const SB = {
  url: (CFG.supabaseUrl || "").replace(/\/$/, ""), key: CFG.supabaseAnonKey || "", session: null,
  configured() { return !!(this.url && this.key); },
  loadSession() { try { this.session = JSON.parse(localStorage.getItem("cb-sb-session") || "null"); } catch (e) { this.session = null; } },
  storeSession(s) { this.session = s; try { s ? localStorage.setItem("cb-sb-session", JSON.stringify(s)) : localStorage.removeItem("cb-sb-session"); } catch (e) {} },
  async auth(body, grant) {
    const r = await fetch(this.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || "auth");
    this.storeSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id, name: j.user && j.user.user_metadata && j.user.user_metadata.name || "" }); return this.session;
  },
  login(email, password) { return this.auth({ email, password }, "password"); },
  async signup(email, password, name) {
    const r = await fetch(this.url + "/auth/v1/signup", { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { name } }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "signup");
    if (j.access_token) { this.storeSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id, name }); return true; }
    return false;
  },
  uid() { const s = this.session; if (!s) return ""; if (!s.uid && s.access) { try { s.uid = JSON.parse(atob(s.access.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) {} } return s.uid || ""; },
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
    plans: { items: [], setups: [] },
    log: { items: [] },
    body: { routines: [], items: [] },
    belt: { track: "kids", belt: "white", stripes: 0, since: "", history: [], goals: {} },
    weight: { items: [], cls: "adult_m", target: "" },
    comp: { events: [] },
    rolls: { items: [] },
    settings: { theme: "system", timer: { work: 5, rest: 1, rounds: 5 }, seeded: false },
  };
}
let S = blank();
let mode = "local";
const UI = { tab: "tech", tech: { id: null, q: "", view: "pos", map: false }, body: { cat: "warm", open: null }, comp: { id: null }, confirm: null, sheet: null, anim: "" };
UI.seg = { train: "log", me: "belt" }; UI.clubSeg = "sched";
try { const t = localStorage.getItem("bjj-tab"); if (t) { if (TAB_ALIAS[t]) { UI.tab = TAB_ALIAS[t]; UI.seg[UI.tab] = t; } else UI.tab = t; } if (localStorage.getItem("bjj-map") === "1") UI.tech.map = true; } catch (e) {}

function seedAll(force) {
  if (force || !S.tree.nodes.length) S.tree.nodes = SEED.nodes();
  if (force || !S.plans.items.length) S.plans.items = SEED.plans.map((p) => Object.assign({ id: uid() }, clone(p)));
  if (force || !S.body.routines.length) S.body.routines = SEED.routines.map((r) => Object.assign({ id: uid() }, clone(r)));
  S.settings.seeded = true; S.settings.seedVer = SEED.version || 1;
}
function mergeSeed() {
  const ver = SEED.version || 1; if ((S.settings.seedVer || 1) >= ver) return false;
  const have = new Map(nodes().map((n) => [n.id, n])); let added = 0; const FIELDS = ["gi", "belt", "pts", "energy", "when", "oc", "bait", "kids", "legal", "f", "rank", "them"];
  for (const n of SEED.nodes()) { const ex = have.get(n.id); if (!ex) { if (!n.p || have.has(n.p)) { nodes().push(n); have.set(n.id, n); added++; } } else for (const k of FIELDS) if (ex[k] === undefined && n[k] !== undefined) ex[k] = n[k]; }
  S.settings.seedVer = ver; return added;
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
  $("sync-t").textContent = msg || { ok: "Synced", saving: "Saving…", local: "On this device", err: "Not saved" }[k];
}
function save(key) {
  dirty[key] = 1; setSync(mode === "cloud" ? "saving" : "local");
  clearTimeout(timers[key]); timers[key] = setTimeout(() => flush(key), 600);
}
function flush(key) {
  const run = async () => {
    try {
      if (mode === "cloud") await SB.set(NS() + key, clone(S[key]));
      else localStorage.setItem(LKEY, JSON.stringify(S));
      delete dirty[key]; if (!Object.keys(dirty).length) setSync(mode === "cloud" ? "ok" : "local");
    } catch (e) { if (e.message === "noauth") showLogin("Please sign in again."); else setSync("err", "Could not save, retrying"); setTimeout(() => flush(key), 5000); }
  };
  chains[key] = (chains[key] || Promise.resolve()).then(run, run);
}

async function startCloud() {
  try {
    let rows = await SB.list(NS()); let legacy = false;
    if (!rows.length) { const old = await SB.list("bjj/"); rows = old.filter((r) => KEYS.includes(r.path.slice(4))).map((r) => ({ path: NS() + r.path.slice(4), data: r.data })); legacy = rows.length > 0; }
    for (const r of rows) { const k = r.path.slice(NS().length); if (KEYS.includes(k)) S[k] = r.data; }
    normalize();
    if (legacy) for (const k of KEYS) await SB.set(NS() + k, clone(S[k]));
    if (!S.settings.seeded) { seedAll(false); for (const k of ["tree", "plans", "body", "belt", "settings"]) await SB.set(NS() + k, clone(S[k])); }
    { const added = mergeSeed(); if (added) { await SB.set(NS() + "tree", clone(S.tree)); await SB.set(NS() + "settings", clone(S.settings)); } }
    mode = "cloud"; applyTheme(); setSync("ok"); document.body.classList.remove("locked"); render();
    if (S.settings.lastAdded) { toast(S.settings.lastAdded + " new moves added to the library"); delete S.settings.lastAdded; }
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !Object.keys(dirty).length) refresh(); });
  } catch (e) { if (e.message === "noauth") showLogin(); else { setSync("err", "Could not connect"); console.error(e); } }
}
async function refresh() {
  try { const rows = await SB.list(NS()); let ch = false; for (const r of rows) { const k = r.path.slice(NS().length); if (KEYS.includes(k) && !dirty[k] && JSON.stringify(S[k]) !== JSON.stringify(r.data)) { S[k] = r.data; ch = true; } } if (ch) { normalize(); render(); } } catch (e) {}
}
function startLocal() {
  try { const j = JSON.parse(localStorage.getItem(LKEY) || "null"); if (j) S = j; } catch (e) {}
  normalize(); if (!S.settings.seeded) { seedAll(false); localStorage.setItem(LKEY, JSON.stringify(S)); } else if (mergeSeed()) localStorage.setItem(LKEY, JSON.stringify(S));
  mode = "local"; applyTheme(); setSync("local"); render();
}
function showLogin(msg, signup) {
  document.body.classList.add("locked"); $("tabs").innerHTML = ""; $("belt").innerHTML = "";
  $("main").innerHTML = '<form class="card" id="login"><h2>' + (signup ? "Create your account" : "Sign in") + "</h2>" + (msg ? '<p class="small" style="color:var(--bad)">' + esc(msg) + "</p>" : signup ? '<p class="muted small">Your own account: your techniques, rolls and training log stay private. Join your club after.</p>' : "") +
    (signup ? '<div class="field"><label for="lg-n">Name</label><input id="lg-n" type="text" autocomplete="name" required placeholder="Shown to your club"></div>' : "") +
    '<div class="field"><label for="lg-e">Email</label><input id="lg-e" type="email" autocomplete="username" required></div>' +
    '<div class="field"><label for="lg-p">Password</label><input id="lg-p" type="password" autocomplete="' + (signup ? "new-password" : "current-password") + '" required minlength="6"></div>' +
    '<button class="btn" type="submit">' + (signup ? "Create account" : "Sign in") + '</button><button class="btn ghost" type="button" data-act="auth-mode" data-v="' + (signup ? "in" : "up") + '">' + (signup ? "I already have an account" : "New here? Create an account") + "</button></form>";
  setSync("local", "Not signed in");
  if (signup) { $("login").addEventListener("submit", async (e) => { e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; try { const ok = await SB.signup(sv("lg-e").trim(), sv("lg-p"), sv("lg-n").trim()); if (ok) { S.settings.name = sv("lg-n").trim(); startCloud(); } else showLogin("Account created. Confirm the email we sent you, then sign in."); } catch (err) { showLogin(String(err.message || err).replace(/^Error: /, ""), true); } }); return; }
  $("login").addEventListener("submit", async (e) => { e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; try { await SB.login(sv("lg-e").trim(), sv("lg-p")); startCloud(); } catch (err) { b.disabled = false; showLogin("Wrong email or password."); } });
}

/* ---------- tree helpers ---------- */
const CATS = [["stand", "Standing"], ["guard", "Guard, bottom"], ["pass", "Passing, top"], ["top", "Dominant, top"], ["escape", "Escapes, bottom"]];
const CAT_COLOR = { stand: "var(--t-td)", guard: "var(--t-sweep)", pass: "var(--t-pass)", top: "var(--t-sub)", escape: "var(--t-esc)" };
const TYPES = [["sub", "Submission"], ["sweep", "Sweep"], ["pass", "Pass"], ["td", "Takedown"], ["esc", "Escape"], ["trans", "Transition"], ["grip", "Grip"], ["ctl", "Control"]];
const TNAME = Object.fromEntries(TYPES);
const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];
const BELT_COLOR = { white: "#9a9aa2", blue: "#1f5fd6", purple: "#7a3fc4", brown: "#7a4a1f", black: "#111114" };
const RANK = { "-2": ["Hard", "bad"], "-1": ["Tough", "warn"], "0": ["Neutral", "na"], "1": ["Good", "ok"], "2": ["Dominant", "ok"] };
const GI_NAME = { gi: "Gi", nogi: "No-gi", both: "Gi · No-gi" };
function myBeltIdx() { const b = (S.belt.belt || "white").split("-")[0]; const i = BELT_ORDER.indexOf(b); return i < 0 ? 0 : i; }
function allowed(n) {
  if (!n || n.k !== "mv") return true; const st = S.settings;
  if (st.rules === "gi" && n.gi === "nogi") return false; if (st.rules === "nogi" && n.gi === "gi") return false;
  if (st.beltFilter && BELT_ORDER.indexOf(n.belt || "white") > myBeltIdx()) return false;
  return true;
}
function kidsWarn(n) { return n && n.kids === false && S.belt.track === "kids"; }
function bolts(e) { let h = ""; for (let i = 1; i <= 3; i++) h += '<i class="' + (i <= (e || 2) ? "on" : "") + '"></i>'; return '<span class="bolts" title="Energy">' + h + "</span>"; }
function metaBadges(n, full) {
  if (!n) return ""; let h = "";
  if (n.k === "pos") { const r = RANK[String(n.rank || 0)]; h += '<span class="pill ' + r[1] + '">' + r[0] + "</span>"; return h; }
  if (n.k === "df") { if (n.f === "rare") h += '<span class="pill na">rare</span>'; else if (full) h += '<span class="pill na">common</span>'; if (n.bait) h += '<span class="pill warn">their trap</span>'; return h; }
  if (n.gi && n.gi !== "both") h += '<span class="pill na">' + GI_NAME[n.gi] + "</span>";
  if (n.belt && n.belt !== "white") h += '<span class="pill belt" style="background:' + BELT_COLOR[n.belt] + '">' + n.belt + "+</span>";
  if (n.pts) h += '<span class="pill ok">+' + n.pts + "</span>";
  if (n.bait) h += '<span class="pill warn">trap</span>';
  if (kidsWarn(n)) h += '<span class="pill bad">not for kids</span>';
  if (full) h += bolts(n.energy);
  return h;
}
const nodes = () => S.tree.nodes;
const node = (id) => nodes().find((n) => n.id === id);
const kids = (id) => nodes().filter((n) => n.p === id);
const positions = () => nodes().filter((n) => n.k === "pos");
function ancestors(id) { const out = []; let n = node(id); while (n) { out.unshift(n); n = n.p ? node(n.p) : null; } return out; }
function subtreeIds(id) { const out = [id]; for (const c of kids(id)) out.push(...subtreeIds(c.id)); return out; }
function posOf(id) { return ancestors(id)[0]; }
/* Setups: every move elsewhere whose result is this position, grouped by the position it starts from. */
function entriesTo(posId) {
  const out = []; for (const m of nodes()) { if (m.k !== "mv") continue; const from = posOf(m.id); if (!from || from.id === posId) continue;
    const oc = m.oc && m.oc.length ? m.oc : m.to ? [{ to: m.to, f: "common" }] : []; const o = oc.find((x) => x.to === posId); if (o) out.push({ m, from, f: o.f || "common" }); }
  const groups = {}; for (const e of out) (groups[e.from.id] = groups[e.from.id] || []).push(e);
  return Object.keys(groups).sort((a, b) => CATS.findIndex((c) => c[0] === node(a).cat) - CATS.findIndex((c) => c[0] === node(b).cat)).map((k) => ({ from: node(k), items: groups[k].sort((a, b) => (a.f === b.f ? 0 : a.f === "rare" ? 1 : -1)) }));
}
function themLine(p) { return p && p.them ? '<span class="them"><svg viewBox="0 0 24 24">' + TICON.df + "</svg>" + esc(p.them) + "</span>" : ""; }
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
  ["train", "Train", '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M8 15h3M13 15h3"/>'],
  ["club", "Club", '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/>'],
  ["me", "Me", '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
];
const SEGS = { train: [["log", "Log"], ["body", "Body"]], me: [["belt", "Rank"], ["weight", "Weight"], ["comp", "Compete"]] };
function renderTabs() {
  $("tabs").innerHTML = TABS.map((t) => '<button data-act="tab" data-v="' + t[0] + '"' + (UI.tab === t[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24">' + t[2] + "</svg>" + t[1] + "</button>").join("");
}
const VIEWS = {};
function render(anim) {
  renderBelt(); renderTabs();
  if (TAB_ALIAS[UI.tab]) { UI.seg[TAB_ALIAS[UI.tab]] = UI.tab; UI.tab = TAB_ALIAS[UI.tab]; }
  const m = $("main"); const fn = VIEWS[UI.tab] || VIEWS.tech;
  m.className = ""; m.innerHTML = fn(); if (anim) { void m.offsetWidth; m.className = anim; }
  renderTimer(); initGraphs(); const hw = $("hist"); if (hw && hw.parentElement) hw.parentElement.scrollLeft = hw.scrollWidth;
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
  return list.map((x, i) => '<span class="chip on">' + esc(x.n) + (counts ? ' <button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-dec" data-pk="' + key + '" data-i="' + i + '" aria-label="Remove">−</button><b>' + (key === "oc" ? (x.c >= 2 ? "rare" : "common") : (x.c || 1)) + '</b><button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-inc" data-pk="' + key + '" data-i="' + i + '" aria-label="Add">+</button>' : "") + '<button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-rm" data-pk="' + key + '" data-i="' + i + '" aria-label="Delete">×</button></span>').join("") || '<span class="muted small">None selected</span>';
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
  if (UI.setupEd) return vSetupEdit();
  if (!["pos", "setups", "learn", "plans", "rolls"].includes(UI.tech.view)) UI.tech.view = "pos";
  h += seg([["pos", "Roll"], ["setups", "Setups"], ["learn", "Learn"], ["plans", "Plans"], ["rolls", "History"]], UI.tech.view, "techview");
  if (UI.tech.view === "setups") return h + vSetups();
  if (UI.tech.view === "learn") return h + vLearn();
  if (UI.tech.view === "plans") return h + vPlans();
  if (UI.tech.view === "rolls") return h + vRolls();
  const R = UI.roll;
  h += '<div class="card rollcard">';
  if (R) {
    const trail = R.steps.map((st, i) => '<button type="button" class="crumb ' + st.k + (i === R.steps.length - 1 ? " last" : "") + '" data-act="roll-rewind" data-i="' + i + '">' + esc(st.n) + "</button>").join('<span class="sep">›</span>');
    h += '<div class="histwrap"><div class="hist" id="hist">' + trail + "</div></div>";
    if (UI.walkCat) h += '<div class="jump"><p class="muted small">I ended up in…</p><div class="chips">' + positions().filter((p) => p.cat === UI.walkCat).map((p) => '<button class="chip pchip" data-act="walk-pos" data-id="' + p.id + '" style="color:' + CAT_COLOR[p.cat] + '">' + iconFor(p) + "<span>" + esc(p.n) + "</span></button>").join("") + "</div></div>";
  } else h += '<div class="start-head"><h3>Where are you?</h3><span class="muted small">tap a position to start</span></div>';
  h += rollGraphSvg();
  if (R) { const cur = R.cur === "finish" ? FINISH : node(R.cur); const q = cur.k === "pos" ? "What do you do?" : cur.k === "mv" ? "What does the opponent do?" : "What do you do now?"; h += '<div class="now"><span class="pict" style="color:' + nodeColor(cur) + '">' + iconFor(cur) + '</span><div class="txt"><b>' + esc(cur.n) + "</b><span>" + q + "</span></div>" + (cur.k === "pos" && metaBadges(cur) ? '<div class="meta">' + metaBadges(cur) + "</div>" : "") + "</div>" + (cur.k === "pos" ? themLine(cur) : "");
    if (R.plan) { const sp = setupById(R.plan); if (sp) { const on = R.steps.every((s, i) => sp.steps[i] && sp.steps[i].id === s.id); const nx = on && sp.steps[R.steps.length]; h += '<p class="small plan-line">★ <b>' + esc(sp.n) + "</b> · " + (nx ? "next: " + esc(nx.n) : on ? "done, finish it" : "off the setup, improvise") + "</p>"; } } }
  else h += '<div class="legend">' + CATS.map((c) => '<span><i style="background:' + CAT_COLOR[c[0]] + '"></i>' + c[1] + "</span>").join("") + '</div><p class="muted small">Jump node to node. It only ends with a submission or points.</p>';
  h += "</div>";
  const all = positions();
  h += '<details class="card fold"><summary><h3>All positions</h3><span class="muted small">' + all.length + " · browse & edit</span></summary><div class=\"list\">" + CATS.map(([cat, label]) => { const ps = all.filter((p) => p.cat === cat); return ps.length ? '<div class="group-label" style="color:' + CAT_COLOR[cat] + '">' + label + "</div>" + ps.map((p) => '<button class="node-row" data-act="open" data-id="' + p.id + '"><span class="pict" style="color:' + CAT_COLOR[cat] + '">' + iconFor(p) + '</span><div class="txt"><b>' + esc(p.n) + "</b>" + (p.en ? "<small>" + esc(p.en) + "</small>" : "") + '</div><span class="cnt">' + kids(p.id).length + "</span>" + CHEV + "</button>").join("") : ""; }).join("") + '</div><button class="btn ghost wide" data-act="add-node" data-p="">+ Add position</button></details>';
  return h;
};
function vSearch(q) {
  const res = nodes().filter((n) => n.n.toLowerCase().includes(q) || (n.en || "").toLowerCase().includes(q)).slice(0, 40);
  if (!res.length) return '<div class="card"><p class="empty">Nothing found. Try another word.</p></div>';
  return '<div class="card"><div class="list">' + res.map((n) => { const a = ancestors(n.id); const crumb = a.slice(0, -1).map((x) => x.n).join(" › "); return '<button class="node-row' + (n.k === "df" ? " df" : "") + '" data-act="open" data-id="' + n.id + '"><span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + '</span><div class="txt"><b>' + esc(n.n) + "</b><small>" + esc(crumb || n.en || kindLabel(n)) + "</small></div>" + tbadge(n) + CHEV + "</button>"; }).join("") + "</div></div>";
}
function vNode(n) {
  const path = ancestors(n.id); const ch = kids(n.id); const back = n.p ? n.p : "";
  let h = '<button class="back" data-act="back" data-id="' + back + '"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' + (n.p ? esc(node(n.p).n) : "Positions") + "</button>";
  h += '<div class="card"><div class="path">' + path.map((x, i) => '<button class="pn ' + x.k + (i === path.length - 1 ? " cur" : "") + '" data-act="open" data-id="' + x.id + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + kindLabel(x) + '</span><span class="nm">' + esc(x.n) + "</span></span></button>").join("") + "</div>";
  h += '<div class="actions" style="align-items:center">' + tbadge(n) + (n.en ? '<span class="muted small" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.en) + "</span>" : '<span style="flex:1"></span>') + '<button class="btn ghost" style="flex:none" data-act="edit-node" data-id="' + n.id + '">Edit</button></div>';
  { const mb = metaBadges(n, true); if (mb) h += '<div class="meta">' + mb + "</div>"; }
  if (n.k === "pos" && n.them) h += '<p class="small"><span class="muted">Them:</span> ' + esc(n.them) + "</p>";
  if (n.k === "mv" && n.when) h += '<p class="small"><span class="muted">Opens when:</span> ' + esc(n.when) + "</p>";
  if (n.k === "df" && n.to && node(n.to)) h += '<p class="small"><span class="muted">They end up in:</span> <button class="to-link sm" data-act="open" data-id="' + n.to + '">' + esc(node(n.to).n) + "</button></p>";
  if (n.bait) h += '<div class="tip"><b>' + (n.k === "df" ? "Their trap" : "Trap") + ":</b> " + esc(n.bait) + "</div>";
  if (n.k === "mv" && n.oc && n.oc.length) h += '<p class="small"><span class="muted">Lands in:</span> ' + n.oc.filter((o) => node(o.to)).map((o) => '<button class="to-link sm" data-act="open" data-id="' + o.to + '">' + esc(node(o.to).n) + (o.f === "rare" ? " · rare" : "") + "</button>").join(" ") + "</p>";
  if (n.legal) h += '<p class="muted small">Rules: ' + esc(n.legal) + "</p>";
  if (n.s && n.s.length) h += '<ol class="steps">' + n.s.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>";
  if (n.x) h += '<p class="small">' + esc(n.x) + "</p>";
  if (n.to && node(n.to) && !(n.oc && n.oc.length)) h += '<div><button class="to-link" data-act="open" data-id="' + n.to + '">→ Next: ' + esc(node(n.to).n) + "</button></div>";
  if (n.k === "mv") { const st = logStats(n.id); const bits = []; if (st.drilled) bits.push(st.drilled + " sessions drilled"); if (st.given) bits.push(st.given + " times finished"); if (st.got) bits.push(st.got + " times caught"); const rs = rollStatsFor(n.id); if (rs.used) bits.push("used in " + rs.used + " roll" + (rs.used > 1 ? "s" : "")); if (bits.length) h += '<p class="muted small">' + bits.join(" · ") + "</p>"; }
  if (n.k === "pos") h += '<div class="actions"><button class="btn" data-act="roll-start" data-pos="' + n.id + '">Roll from here</button></div>';
  h += "</div>";
  if (n.k === "pos") {
    const en = entriesTo(n.id); const cnt = en.reduce((a, g) => a + g.items.length, 0);
    const sps = S.plans.setups.filter((x) => x.steps[0] && x.steps[0].id === n.id);
    h += '<div class="card"><div class="card-head"><h3>Setups from here</h3><span class="muted small">my paths to a submission</span></div>' + (sps.length ? '<div class="list">' + sps.map(setupRow).join("") + "</div>" : '<p class="empty">No setup yet. Build the chain you want to land from here.</p>') + '<button class="btn ghost wide" data-act="add-setup" data-pos="' + n.id + '">+ New setup</button></div>';
    h += '<div class="card"><div class="card-head"><h3>Ways in · how you get here</h3><span class="muted small">' + (cnt ? cnt + " entr" + (cnt > 1 ? "ies" : "y") : "none yet") + "</span></div>";
    if (cnt) h += '<div class="list">' + en.map((g) => '<div class="group-label" style="color:' + CAT_COLOR[g.from.cat] + '">from ' + esc(g.from.n) + "</div>" + g.items.map((e) => '<button class="node-row" data-act="open" data-id="' + e.m.id + '"><span class="pict" style="color:' + nodeColor(e.m) + '">' + iconFor(e.m) + '</span><div class="txt"><b>' + esc(e.m.n) + "</b>" + (e.m.when ? "<small>" + esc(e.m.when) + "</small>" : "") + "</div>" + (e.f === "rare" ? '<span class="pill na">rare</span>' : "") + tbadge(e.m) + CHEV + "</button>").join("")).join("") + "</div>";
    else h += '<p class="empty">No move leads here yet. Add how you pull, sweep or pass into it.</p>';
    h += '<button class="btn ghost wide" data-act="add-entry" data-id="' + n.id + '">+ Add an entry</button></div>';
  }
  h += '<div class="card"><div class="card-head"><h3>' + childHeading(n) + "</h3>" + seg([["map", "Map"], ["list", "List"]], UI.tech.map ? "map" : "list", "techmap") + "</div>";
  if (UI.tech.map && ch.length) h += mindMapSvg(n) + '<p class="muted small">Tap a branch for its next step. Dashed amber = their defense.</p>';
  else if (ch.length) { const rowOf = (c) => '<button class="node-row' + (c.k === "df" ? " df" : "") + '" data-act="open" data-id="' + c.id + '"><span class="pict" style="color:' + nodeColor(c) + '">' + iconFor(c) + '</span><div class="txt"><b>' + esc(c.n) + "</b>" + (c.en ? "<small>" + esc(c.en) + "</small>" : "") + "</div>" + (c.k === "df" ? (c.f === "rare" ? '<span class="pill na">rare</span>' : "") + '<span class="cnt">' + kids(c.id).length + " answers</span>" : metaBadges(c) + tbadge(c)) + (c.k !== "df" && kids(c.id).length ? '<span class="cnt">' + kids(c.id).length + "</span>" : "") + CHEV + "</button>";
    if (n.k === "pos" && ch.length > 6) h += '<div class="list">' + TYPES.map(([t, label]) => { const g = ch.filter((c) => (c.t || "trans") === t); return g.length ? '<div class="group-label" style="color:' + typeColor(t) + '">' + label + (g.length > 1 ? "s" : "") + " · " + g.length + "</div>" + g.map(rowOf).join("") : ""; }).join("") + "</div>";
    else h += '<div class="list">' + ch.map(rowOf).join("") + "</div>"; }
  else h += '<p class="empty">' + (n.k === "mv" ? "Write how the opponent defends, then add your answer." : "Nothing here yet. Add your first option.") + "</p>";
  h += '<button class="btn ghost wide" data-act="add-node" data-p="' + n.id + '">+ ' + (n.k === "mv" ? "Add a defense" : "Add an option") + "</button></div>";
  if (n.k === "pos") {
    const plans = S.plans.items.filter((p) => (p.tags || []).includes(n.id));
    if (plans.length) h += '<div class="card"><h3>In game plans</h3><div class="list">' + plans.map((p) => '<div class="row"><div class="txt"><b>' + esc(p.n) + "</b></div></div>").join("") + "</div></div>";
  }
  return h;
}

/* ======================= ICONS ======================= */
/* Category pictograms (two stick figures) and move-type glyphs. 24×24, stroke = currentColor. */
const PICT = {
  stand: '<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7M12 14l-3.5 6M12 14l3.5 6M8 10.5l4-1.5 4 1.5"/>',
  guard: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  pass: '<path d="M4 17c3-9 13-9 16 0M20 17l-1-4M20 17l-4-1M3 20h18"/>',
  top: '<path d="M4 18h16M5 15l2-8 5 4 5-4 2 8z"/>',
  escape: '<path d="M14 4h5v16h-5M4 12h11M11 8l4 4-4 4"/>',
  finish: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/>',
};
const TICON = {
  sit: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bait: '<path d="M12 3v9a4 4 0 0 0 8 0M12 3h-3M12 3h3"/><circle cx="12" cy="18" r="2"/>',
  sub: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sweep: '<path d="M20 12a8 8 0 1 1-3-6.3M20 4v4h-4"/>',
  pass: '<path d="M4 16c3-9 13-9 16 0M20 16l-1-4M20 16l-4-1"/>',
  td: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  esc: '<path d="M14 4h5v16h-5M4 12h11M11 8l4 4-4 4"/>',
  trans: '<path d="M4 12h14M13 7l5 5-5 5"/>',
  grip: '<path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5.5a1.5 1.5 0 0 1 3 0V11M14 11V7.5a1.5 1.5 0 0 1 3 0V13c0 4-2 7-6 7s-6-3-6-7v-2a1.5 1.5 0 0 1 3 0"/>',
  ctl: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  df: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 9l6 6M15 9l-6 6"/>',
  pos: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
};
const svgIcon = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
function pictSvg(cat) { return svgIcon(PICT[cat] || PICT.guard); }
function iconFor(n) { return svgIcon(n.k === "fin" ? PICT.finish : n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : TICON[n.t] || TICON.trans); }
function nodeColor(n) { return n.k === "pos" ? CAT_COLOR[n.cat] || "var(--ink)" : n.k === "df" ? "var(--df-ink)" : typeColor(n.t); }

/* ======================= GRAPHS ======================= */
/* Shared pan / pinch-zoom canvas. State per graph id lives in UI.graph[id] = {tx,ty,s,sel,open}. */
UI.graph = {};
const TW = (t, fs) => t.length * (fs || 11) * 0.56;
function gState(id) { return (UI.graph[id] = UI.graph[id] || { tx: 0, ty: 0, s: 0, sel: null, open: {} }); }
function typeColor(t) { return t ? "var(--t-" + t + ")" : "var(--t-trans)"; }
function wrapText(t, max) { if (t.length <= max) return [t]; const i = t.lastIndexOf(" ", max); const a = i > 3 ? t.slice(0, i) : t.slice(0, max); let b = t.slice(a.length).trim(); if (b.length > max) b = b.slice(0, max - 1) + "…"; return [a, b]; }
/* icon node: circle with a glyph, label outside (below or to the right) */
function iconNode(n, cx, cy, r, opt) {
  opt = opt || {}; const col = opt.color || nodeColor(n); const cls = "g-node " + n.k + (opt.cls ? " " + opt.cls : ""); const inner = n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : TICON[n.t] || TICON.trans;
  const ir = r * 1.15; let h = '<g class="' + cls + '" data-id="' + n.id + '" style="color:' + col + '">' +
    '<circle class="hit" cx="' + cx + '" cy="' + cy + '" r="' + (r + 10) + '"/>' +
    '<circle class="b" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
    '<svg class="ic" x="' + (cx - ir / 2) + '" y="' + (cy - ir / 2) + '" width="' + ir + '" height="' + ir + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  if (opt.label !== false) {
    const fs = opt.fs || 11, ls = wrapText(n.n, opt.max || 16);
    if (opt.side) h += ls.map((l, i) => '<text class="lb" x="' + (cx + r + 7) + '" y="' + (cy + (ls.length === 1 ? fs * 0.36 : i ? fs + 1 : -2)) + '">' + esc(l) + "</text>").join("");
    else h += ls.map((l, i) => '<text class="lb" x="' + cx + '" y="' + (cy + r + 13 + i * (fs + 2)) + '" text-anchor="middle">' + esc(l) + "</text>").join("");
  }
  if (opt.badge) h += '<g class="g-badge"><circle cx="' + (cx + r * 0.75) + '" cy="' + (cy - r * 0.75) + '" r="8.5"/><text x="' + (cx + r * 0.75) + '" y="' + (cy - r * 0.75 + 3.3) + '" text-anchor="middle">+' + opt.badge + "</text></g>";
  return h + "</g>";
}
function canvasHtml(id, svgInner, bounds, legend, roll) {
  const sid = id.replace(/[^a-z0-9]/gi, "_"); const R = UI.roll;
  const bar = roll && R ? '<div class="fbar"><button type="button" class="pillb" data-act="roll-undo"' + (R.steps.length < 2 ? " disabled" : "") + '>↶ Undo</button><button type="button" class="pillb" data-act="roll-other">Elsewhere…</button><button type="button" class="pillb strong" data-act="roll-end">End roll</button></div>' : "";
  return '<div class="canvas' + (roll ? " rollcv" : "") + '" data-graph="' + id + '" data-x0="' + bounds.x + '" data-y0="' + bounds.y + '" data-w="' + bounds.w + '" data-h="' + bounds.h + '"><svg class="g" aria-label="Technique graph"><defs><pattern id="dots-' + sid + '" width="22" height="22" patternUnits="userSpaceOnUse"><circle class="g-dots" cx="1" cy="1" r="1"/></pattern><marker id="arr-' + sid + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L9 5L0 9z" fill="context-stroke"/></marker></defs><rect class="bgp" x="-5000" y="-5000" width="10000" height="10000" fill="url(#dots-' + sid + ')"/><g class="vp">' + svgInner + "</g></svg>" +
    '<div class="ctl"><button type="button" data-g="in" aria-label="Zoom in">+</button><button type="button" data-g="out" aria-label="Zoom out">−</button><button type="button" data-g="fit" aria-label="Fit to screen"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>' +
    '<div class="hint">' + (roll ? (R ? "tap the next step" : "tap a position") : "drag · pinch · tap") + "</div>" + (roll && R && node(R.cur) && node(R.cur).k === "pos" ? '<div class="gtog" role="tablist"><button type="button" class="' + (R.by === "when" ? "" : "on") + '" data-act="roll-by" data-v="type">My moves</button><button type="button" class="' + (R.by === "when" ? "on" : "") + '" data-act="roll-by" data-v="when">Their situation</button></div>' : "") + '<div class="gchip"></div>' + bar + "</div>" + (legend || "");
}

/* --- roll graph ("second brain" view): the node you are in sits in the middle, every legal next step
   orbits it, what lies behind those is faded further out, the way you came trails off to the left.
   Tap a node to jump there. --- */
const FINISH = { id: "finish", k: "fin", n: "Tap!", t: "", cat: "" };
function nextOf(n) {
  if (!n || n.k === "fin") return [];
  const out = kids(n.id).filter(allowed).map((c) => ({ n: c, how: c.k === "df" ? "they" : "me", f: c.f || "" }));
  if (n.k === "mv") {
    const oc = (n.oc && n.oc.length ? n.oc : n.to ? [{ to: n.to, f: "common" }] : []).filter((o) => node(o.to));
    for (const o of oc) out.push({ n: node(o.to), how: "works", f: o.f || "common", label: o.n || "" });
    if (n.t === "sub") out.push({ n: FINISH, how: "tap" });
  }
  if (n.k === "df" && n.to && node(n.to)) out.push({ n: node(n.to), how: "lands", f: n.f || "common" });
  return out;
}
function gNode(n, x, y, r, role, attrs, badge, sub) {
  const col = n.k === "fin" ? "var(--ok)" : n.k === "grp" ? (n.t ? typeColor(n.t) : "var(--accent)") : nodeColor(n); const inner = n.k === "fin" ? PICT.finish : n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : n.k === "grp" && !n.t ? TICON.sit : TICON[n.t] || TICON.trans;
  const ir = Math.round(r * 1.2); const fs = role === "cur" ? 12 : 10.5; const r2 = role.indexOf("ring2") === 0, ans = role.indexOf("ans") > 0; const ls = r2 && !ans ? [n.n.length > 14 ? n.n.slice(0, 13).trim() + "…" : n.n] : wrapText(n.n, role === "cur" ? 20 : ans ? 13 : 15);
  const trap = n.bait && role !== "cur" ? '<g class="g-trap"><circle cx="' + (-r * 0.8) + '" cy="' + (-r * 0.8) + '" r="8"/><svg x="' + (-r * 0.8 - 5) + '" y="' + (-r * 0.8 - 5) + '" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + TICON.bait + "</svg></g>" : "";
  const star = role.indexOf("planned") > 0 ? '<text class="star" y="' + (-r - 6) + '" text-anchor="middle">★</text>' : "";
  return '<g class="g-node rn ' + n.k + " " + role + '" data-id="' + n.id + '" data-role="' + role + '" ' + (attrs || "") + ' data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" style="transform:translate(' + x.toFixed(1) + "px," + y.toFixed(1) + 'px);color:' + col + '">' +
    '<circle class="hit" r="' + (r + 12) + '"/><circle class="b" r="' + r + '"/>' +
    '<svg class="ic" x="' + (-ir / 2) + '" y="' + (-ir / 2) + '" width="' + ir + '" height="' + ir + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>" +
    ls.map((l, i) => '<text class="lb" y="' + (r + 12 + i * (fs + 2)) + '" text-anchor="middle" style="font-size:' + (r2 ? (ans ? 9.5 : 9) : fs) + 'px">' + esc(l) + "</text>").join("") + (sub ? '<text class="lb sub" y="' + (r + 12 + ls.length * (fs + 2)) + '" text-anchor="middle">' + esc(sub.length > 24 ? sub.slice(0, 23).trim() + "…" : sub) + "</text>" : "") + (badge ? '<g class="g-badge"><circle cx="' + (r * 0.75) + '" cy="' + (-r * 0.75) + '" r="9"/><text x="' + (r * 0.75) + '" y="' + (-r * 0.75 + 3.3) + '" text-anchor="middle">' + badge + "</text></g>" : "") + trap + star + "</g>";
}
function gEdge(ka, a, kb, b, cls, color) { return '<line class="g-edge ' + cls + '" data-a="' + ka + '" data-b="' + kb + '" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"' + (color ? ' style="stroke:' + color + '"' : "") + "/>"; }
function rollGraphSvg() {
  const R = UI.roll; let nodesOut = "", edges = ""; const P = {}; const groupItems = {}; let planned = null; let minX = -40, maxX = 40, minY = -40, maxY = 40;
  const put = (key, n, x, y, r, role, attrs, badge, sub) => { P[key] = [x, y]; if (R && R.plan) { const pid = R.plan && planned; if (pid && (n.id === pid || (n.k === "grp" && (groupItems[key] || []).some((it) => it.n.id === pid)))) role += " planned"; } nodesOut += gNode(n, x, y, r, role, 'data-k="' + key + '" ' + (attrs || ""), badge, sub); minX = Math.min(minX, x - 60); maxX = Math.max(maxX, x + 60); minY = Math.min(minY, y - 40); maxY = Math.max(maxY, y + 40); };
  if (!R) {
    const CR = 150; CATS.forEach(([cat], i) => { const a = (-90 + i * 72) * Math.PI / 180; const cx = Math.cos(a) * CR, cy = Math.sin(a) * CR; const ps = positions().filter((p) => p.cat === cat); const rr = ps.length > 1 ? 30 + ps.length * 7 : 0; ps.forEach((p, j) => { const b = a + (j / ps.length) * 2 * Math.PI; put("s:" + p.id, p, cx + Math.cos(b) * rr, cy + Math.sin(b) * rr, 15, "start"); }); });
    const seen = {}; for (const m of nodes()) if (m.k === "mv" && m.to && P["s:" + m.to]) { const from = posOf(m.id).id; const k = from + ">" + m.to; if (from === m.to || !P["s:" + from] || seen[k]) continue; seen[k] = 1; edges += gEdge("s:" + from, P["s:" + from], "s:" + m.to, P["s:" + m.to], "faint", CAT_COLOR[node(from).cat]); }
    return canvasHtml("roll", edges + nodesOut, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, "", true);
  }
  const cur = R.cur === "finish" ? FINISH : node(R.cur) || node(R.pos);
  // trail (the way you came), to the left
  const prev = R.steps.slice(0, -1); let lastKey = "c";
  for (let i = 0; i < Math.min(4, prev.length); i++) { const st = prev[prev.length - 1 - i]; const n = node(st.id); if (!n) break; const key = "t" + i; const x = -(i + 1) * 78, y = i % 2 ? 18 : -18; put(key, n, x, y, 11, "trail", 'data-i="' + (prev.length - 1 - i) + '"'); edges += gEdge(key, [x, y], lastKey, lastKey === "c" ? [0, 0] : P[lastKey], "trail"); lastKey = key; }
  // next steps on the right; many options are bundled by type into hubs
  const all = nextOf(cur); let next = all, hubs = null;
  const whens = cur.k === "pos" ? [...new Set(all.map((e) => e.n.when || ""))] : [];
  const plan = R.plan ? setupById(R.plan) : null; planned = plan && plan.steps.length > R.steps.length && R.steps.every((s, i) => plan.steps[i] && plan.steps[i].id === s.id) ? plan.steps[R.steps.length].id : null;
  if (cur.k === "pos" && R.by === "when" && whens.length > 1 && all.length > 5) { hubs = {}; for (const e of all) (hubs[e.n.when || ""] = hubs[e.n.when || ""] || []).push(e);
    { const ks = Object.keys(hubs).filter((k) => k).sort((a, b) => hubs[b].length - hubs[a].length); if (ks.length > 7) { const rest = ks.slice(6); hubs["Other situations"] = hubs["Other situations"] || []; for (const k of rest) { hubs["Other situations"].push(...hubs[k]); delete hubs[k]; } } }
    next = Object.keys(hubs).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0)).map((w) => ({ n: { id: "g:" + (w || "any"), k: "grp", n: w || "Any time", t: "", cat: "", when: w }, how: "group", items: hubs[w] })); }
  else if (cur.k === "pos" && all.length > 6) { hubs = {}; for (const e of all) (hubs[e.n.t || "trans"] = hubs[e.n.t || "trans"] || []).push(e); const order = TYPES.map((t) => t[0]); next = Object.keys(hubs).sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((t) => ({ n: { id: "g:" + t, k: "grp", n: TNAME[t] + (hubs[t].length > 1 ? "s" : ""), t, cat: "" }, how: "group", items: hubs[t] })); }
  const n1 = next.length; const r1 = Math.min(170, Math.max(112, 96 + n1 * 9)); const span = n1 > 1 ? Math.min(200, 60 + n1 * 28) : 0;
  next.forEach((e, k) => {
    if (e.how === "group") {
      const deg = n1 > 1 ? -span / 2 + (span / (n1 - 1)) * k : 0; const a = deg * Math.PI / 180; const x = Math.cos(a) * r1, y = Math.sin(a) * r1; const gk = e.n.t || e.n.id; const key = "h:" + gk; const open = R.grp === gk; groupItems[key] = e.items;
      put(key, e.n, x, y, open ? 19 : 16, "group" + (open ? " open" : ""), 'data-t="' + esc(gk) + '"', e.items.length);
      edges += gEdge("c", [0, 0], key, [x, y], "step" + (open ? "" : " faint"), e.n.t ? typeColor(e.n.t) : "var(--accent)");
      if (open) { const m = e.items.length; const sector = Math.min(170, 30 + m * 22); const two = m > 6; e.items.forEach((it, j) => { const d2 = deg + (m > 1 ? -sector / 2 + (sector / (m - 1)) * j : 0); const a2 = d2 * Math.PI / 180; const rr = r1 + 96 + (two && j % 2 ? 78 : 0); const x2 = Math.cos(a2) * rr, y2 = Math.sin(a2) * rr; const k2 = "n:" + it.n.id; put(k2, it.n, x2, y2, 16, "next" + (it.f === "rare" ? " rare" : ""), 'data-how="' + it.how + '"', "", it.n.when); edges += gEdge(key, [x, y], k2, [x2, y2], "step", nodeColor(it.n));
          const n2 = two ? [] : nextOf(it.n).filter((z) => z.n.k === "df").slice(0, 2); const sec2 = m > 1 ? Math.min(24, sector / (m - 1) * 0.8) : 30;
          n2.forEach((e2, q) => { const d3 = d2 + (n2.length > 1 ? -sec2 / 2 + sec2 * q : 0); const a3 = d3 * Math.PI / 180; const x3 = Math.cos(a3) * (r1 + 170), y3 = Math.sin(a3) * (r1 + 170); const k3 = "n2:" + it.n.id + ":" + e2.n.id; put(k3, e2.n, x3, y3, 9, "ring2", 'data-p="' + it.n.id + '"'); edges += gEdge(k2, [x2, y2], k3, [x3, y3], "faint df", nodeColor(e2.n)); }); }); }
      return;
    }
    const deg = n1 > 1 ? -span / 2 + (span / (n1 - 1)) * k : 0; const a = deg * Math.PI / 180; const x = Math.cos(a) * r1, y = Math.sin(a) * r1; const key = "n:" + e.n.id;
    put(key, e.n, x, y, e.f === "rare" ? 14 : 17, "next" + (e.f === "rare" ? " rare" : "") + (e.how === "works" ? " works" : ""), 'data-how="' + e.how + '"');
    edges += gEdge("c", [0, 0], key, [x, y], "step " + e.how + (e.n.k === "df" || e.how === "lands" ? " df" : ""), e.n.k === "fin" ? "var(--ok)" : e.how === "works" ? "var(--ok)" : e.how === "lands" ? "var(--df-ink)" : nodeColor(e.n));
    const isDf = e.n.k === "df"; const next2 = nextOf(e.n).slice(0, isDf ? 4 : 3); const sector = n1 > 1 ? Math.min(isDf ? 56 : 44, span / (n1 - 1) * 0.9) : 60;
    next2.forEach((e2, j) => { const d2 = deg + (next2.length > 1 ? -sector / 2 + (sector / (next2.length - 1)) * j : 0); const a2 = d2 * Math.PI / 180; const rr = r1 + (isDf ? 98 : 92); const x2 = Math.cos(a2) * rr, y2 = Math.sin(a2) * rr; const key2 = "n2:" + e.n.id + ":" + e2.n.id; put(key2, e2.n, x2, y2, isDf ? 12 : 10, isDf ? "ring2 ans" : "ring2", 'data-p="' + e.n.id + '"'); edges += gEdge(key, [x, y], key2, [x2, y2], "faint" + (e2.n.k === "df" ? " df" : e2.how === "works" ? " works" : ""), e2.n.k === "fin" || e2.how === "works" ? "var(--ok)" : nodeColor(e2.n)); });
    if (nextOf(e.n).length > next2.length) { const a3 = (deg + sector / 2 + 10) * Math.PI / 180; nodesOut += '<text class="more" x="' + (Math.cos(a3) * (r1 + 92)).toFixed(1) + '" y="' + (Math.sin(a3) * (r1 + 92) + 4).toFixed(1) + '" text-anchor="middle">+' + (nextOf(e.n).length - next2.length) + "</text>"; }
  });
  put("c", cur, 0, 0, 26, "cur");
  if (hubs && !R.grp) nodesOut += '<text class="more" x="0" y="52" text-anchor="middle">tap a group to see the moves</text>';
  if (!n1) nodesOut += '<text class="more" x="70" y="4">no next step written · add one or tap “Elsewhere”</text>';
  return canvasHtml("roll", edges + nodesOut, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, "", true);
}
/* animate nodes from where they were in the previous frame */
function animateRoll(el) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; const prev = UI.graph.rollPrev || {}; const now = {}; const items = [];
  el.querySelectorAll(".rn").forEach((g) => { const key = g.dataset.k, id = g.dataset.id, to = [+g.dataset.x, +g.dataset.y]; const from = prev[key] || prev["id:" + id] || null; now[key] = to; now["id:" + id] = to; items.push({ g, key, from, to }); });
  UI.graph.rollPrev = now; if (reduced) return;
  const lines = [...el.querySelectorAll("line.g-edge")]; const cur = {}; const t0 = performance.now(), D = 460;
  for (const it of items) if (!it.from) { it.g.style.opacity = "0"; }
  const frame = (t) => {
    const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
    for (const it of items) { const p = it.from ? [it.from[0] + (it.to[0] - it.from[0]) * e, it.from[1] + (it.to[1] - it.from[1]) * e] : it.to; cur[it.key] = p; it.g.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px)"; if (!it.from) it.g.style.opacity = String(Math.max(0, (k - 0.3) / 0.7)); }
    for (const l of lines) { const a = cur[l.dataset.a], b = cur[l.dataset.b]; if (a) { l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]); } if (b) { l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]); } }
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function rollTap(g) {
  const role = g.dataset.role, id = g.dataset.id;
  if (role === "start") { rollStart(id); return; }
  const R = UI.roll; if (!R) return;
  if (role === "trail") { rollRewind(+g.dataset.i); return; }
  if (role === "cur") { quickSheet(id); return; }
  if (role.indexOf("group") === 0) { R.grp = R.grp === g.dataset.t ? null : g.dataset.t; render(); return; }
  if (role.indexOf("next") === 0 && g.dataset.how === "works" && R.cur !== id) { /* an outcome: the move worked and we landed here */ }
  if (role.indexOf("ring2") === 0) { rollStepTo(g.dataset.p); if (UI.roll && UI.roll.cur === g.dataset.p) rollStepTo(id); return; }
  rollStepTo(id);
}
function rollStepTo(id) {
  const R = UI.roll; if (!R) return;
  if (id === "finish") { R.finished = true; rollEndSheet(true); return; }
  const n = node(id); if (!n) return;
  if (n.k === "pos") rollGoto(id, "worked"); else rollPick(id);
}
function rollRewind(i) { const R = UI.roll; if (!R || i >= R.steps.length - 1) return; R.steps = R.steps.slice(0, i + 1); const last = R.steps[i]; R.cur = last.id; const lp = R.steps.slice().reverse().find((x) => x.k === "pos"); R.pos = lp ? lp.id : R.pos; R.finished = false; render(); toast("Back to " + last.n); }
function quickSheet(id) {
  const n = node(id); if (!n) return;
  const b = '<div class="actions" style="align-items:center"><span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + "</span>" + tbadge(n) + metaBadges(n, true) + "</div>" + (n.k === "pos" && n.them ? '<p class="small"><span class="muted">Them:</span> ' + esc(n.them) + "</p>" : "") + (n.when ? '<p class="small"><span class="muted">Opens when:</span> ' + esc(n.when) + "</p>" : "") + (n.bait ? '<div class="tip"><b>Trap:</b> ' + esc(n.bait) + "</div>" : "") + (n.s && n.s.length ? '<ol class="steps">' + n.s.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol>" : "") + (n.x ? '<p class="small">' + esc(n.x) + "</p>" : "") + (!n.s.length && !n.x ? '<p class="muted small">No steps written yet.</p>' : "") + '<button class="btn ghost wide" data-act="open" data-id="' + n.id + '">Open & edit</button>';
  openSheet(n.n, b, {});
}
/* --- technique mind map: root on the left, branches to the right (2 levels, tap +N for more) --- */
function mindMapSvg(root) {
  const gid = "n:" + root.id, st = gState(gid); const R = 15, RR = 24, GAPX = 44, ROW = 40, DEPTH = 2;
  function build(n, depth) { const all = kids(n.id); const ch = depth < DEPTH || st.open[n.id] ? all : []; const node = { n, w: R * 2 + 8 + TW(wrapText(n.n, 22)[0], 11) + 8, ch: ch.map((c) => build(c, depth + 1)), hidden: ch.length ? 0 : all.length }; node.inner = node.ch.reduce((a, c) => a + c.height, 0); node.height = Math.max(ROW, node.inner); return node; }
  const top = kids(root.id).map((c) => build(c, 1)); const total = top.reduce((a, c) => a + c.height, 0);
  let edges = "", nodesOut = "", minX = -RR - 10, maxX = RR, minY = -RR - 10, maxY = RR + 24;
  function place(list, x0, yTop, color, px, py) {
    let y = yTop;
    for (const nd of list) {
      const cy = y + nd.height / 2, cx = x0 + R; const col = nd.n.k === "df" ? "var(--df-ink)" : color || typeColor(nd.n.t);
      edges += '<path class="g-edge' + (nd.n.k === "df" ? " df" : "") + '" style="stroke:' + col + '" d="M' + px + " " + py + " C" + (px + GAPX * 0.55) + " " + py + "," + (cx - R - GAPX * 0.55) + " " + cy + "," + (cx - R) + " " + cy + '"/>';
      nodesOut += iconNode(nd.n, cx, cy, R, { color: col, side: true, max: 22, cls: st.sel === nd.n.id ? "sel" : "", badge: nd.hidden || 0 });
      maxX = Math.max(maxX, x0 + nd.w + 10); minY = Math.min(minY, cy - ROW / 2); maxY = Math.max(maxY, cy + ROW / 2);
      if (nd.ch.length) place(nd.ch, x0 + nd.w + GAPX, cy - nd.inner / 2, col, x0 + nd.w - 6, cy);
      y += nd.height;
    }
  }
  place(top, RR + GAPX, -total / 2, null, RR, 0);
  const rootSvg = iconNode(root, 0, 0, RR, { color: nodeColor(root), cls: "root" + (st.sel === root.id ? " sel" : ""), max: 18, fs: 12 });
  const legend = '<div class="legend" style="padding-top:10px"><span><i style="background:var(--t-sub)"></i>Submission</span><span><i style="background:var(--t-sweep)"></i>Sweep</span><span><i style="background:var(--t-pass)"></i>Pass</span><span><i style="background:var(--t-td)"></i>Takedown</span><span><i style="background:var(--t-esc)"></i>Escape</span><span><i style="background:var(--t-trans)"></i>Transition · grip · control</span><span><i class="dash"></i>Their defense</span></div>';
  return canvasHtml(gid, edges + nodesOut + rootSvg, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, legend);
}

/* --- canvas behaviour: pan, pinch, wheel, tap, momentum --- */
function initGraphs() {
  document.querySelectorAll(".canvas[data-graph]").forEach((el) => {
    if (el.dataset.ready) return; el.dataset.ready = "1";
    const id = el.dataset.graph, st = gState(id), vp = el.querySelector(".vp"), bgp = el.querySelector(".bgp");
    const bx = +el.dataset.x0, by = +el.dataset.y0, bw = +el.dataset.w, bh = +el.dataset.h; const S0 = 1;
    if (id !== "roll") el.style.height = Math.min(460, Math.max(220, Math.round(bh * S0 + 70))) + "px";
    const W = el.clientWidth || 358, H = el.clientHeight || 440;
    const apply = () => { vp.setAttribute("transform", "translate(" + st.tx + " " + st.ty + ") scale(" + st.s + ")"); bgp.setAttribute("transform", "translate(" + (st.tx % (22 * st.s)) + " " + (st.ty % (22 * st.s)) + ") scale(" + st.s + ")"); };
    const fit = () => { const s = Math.min(1.2, Math.max(0.5, Math.min((W - 24) / bw, (H - 24) / bh))); st.s = s; st.tx = (W - bw * s) / 2 - bx * s; st.ty = bh * s > H - 24 ? 12 - by * s : (H - bh * s) / 2 - by * s; apply(); };
    const zoomAt = (f, cx, cy) => { const ns = Math.min(3, Math.max(0.35, st.s * f)); const k = ns / st.s; st.tx = cx - (cx - st.tx) * k; st.ty = cy - (cy - st.ty) * k; st.s = ns; apply(); };
    const home = () => { const s = Math.min(S0, Math.max(0.8, (W - 16) / bw)); st.s = s; st.tx = bw * s <= W - 16 ? (W - bw * s) / 2 - bx * s : 8 - bx * s; st.ty = bh * s <= H - 24 ? (H - bh * s) / 2 - by * s : H / 2; apply(); };
    const centerOn = (nid) => { const g = el.querySelector('.g-node[data-id="' + nid + '"] circle.b'); if (!g) return; const cx = +g.getAttribute("cx"), cy = +g.getAttribute("cy"); st.tx = W / 2 - cx * st.s; st.ty = H / 2 - cy * st.s; apply(); };
    if (id === "roll") { el.style.height = (UI.roll ? 420 : 400) + "px"; const W2 = el.clientWidth || 358, H2 = el.clientHeight || 420; if (!st.s || !UI.roll) st.s = UI.roll ? 1 : Math.min(1, (W2 - 16) / bw); st.tx = UI.roll ? W2 * 0.42 : W2 / 2; st.ty = H2 / 2 - (UI.roll ? 14 : 0); apply(); if (UI.roll) el.querySelector(".ctl").hidden = true; animateRoll(el); }
    else { if (!st.s) home(); else apply(); updateChip(id, el.querySelector(".gchip")); }
    if (st.focus) { centerOn(st.focus); st.focus = null; }
    const ptrs = new Map(); let moved = false, down = null, lastT = 0, vx = 0, vy = 0, raf = 0, pinch0 = null;
    el.addEventListener("pointerdown", (e) => { if (e.target.closest(".ctl,.gchip,.fbar,.gtog")) return; cancelAnimationFrame(raf); el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) { down = { x: e.clientX, y: e.clientY, t: Date.now(), target: e.target }; moved = false; vx = vy = 0; lastT = performance.now(); } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: st.s }; } });
    el.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) moved = true; if (moved) { st.tx += dx; st.ty += dy; const now = performance.now(), dt = Math.max(1, now - lastT); vx = dx / dt; vy = dy / dt; lastT = now; apply(); } }
      else if (ptrs.size === 2 && pinch0) { moved = true; const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = el.getBoundingClientRect(); zoomAt((pinch0.s * d / pinch0.d) / st.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); }
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null;
      if (ptrs.size === 0 && down) {
        if (!moved && Date.now() - down.t < 600) { const g = down.target.closest ? down.target.closest(".g-node") : null; if (id === "roll") { if (g) rollTap(g); } else tapNode(id, g ? g.dataset.id : null, el); }
        else if (moved && Math.hypot(vx, vy) > 0.08 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { let last = performance.now(); const step = (t) => { const dt = Math.min(40, t - last); last = t; st.tx += vx * dt; st.ty += vy * dt; const k = Math.pow(0.93, dt / 16); vx *= k; vy *= k; apply(); if (Math.hypot(vx, vy) > 0.01) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
        down = null;
      }
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    el.querySelectorAll(".ctl button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.g === "fit") fit(); else zoomAt(b.dataset.g === "in" ? 1.25 : 0.8, W / 2, H / 2); }));
  });
}
function tapNode(gid, nid, el) {
  const st = gState(gid);
  if (!nid) { if (st.sel) { st.sel = null; refreshGraph(gid, el); } return; }
  { const g = el.querySelector('.g-node[data-id="' + nid + '"] .g-badge'); if (g) st.open[nid] = true; else if (st.sel === nid && kids(nid).length) st.open[nid] = !st.open[nid]; }
  st.sel = nid; refreshGraph(gid, el);
}
function refreshGraph(gid, el) {
  const html = mindMapSvg(node(gid.slice(2)));
  const tmp = document.createElement("div"); tmp.innerHTML = html; const fresh = tmp.querySelector(".canvas");
  el.replaceWith(fresh); initGraphs();
}
function updateChip(gid, chip) {
  const st = gState(gid); const n = st.sel ? node(st.sel) : null;
  if (!n) { chip.classList.remove("on"); chip.innerHTML = ""; return; }
  let sub = (n.k === "df" ? "Their defense" : n.k === "pos" ? "Position" : TNAME[n.t] || "Option") + (kids(n.id).length ? " · " + kids(n.id).length + (n.k === "mv" ? " defenses" : " answers") : "") + (n.to && node(n.to) ? " · → " + node(n.to).n : ""); const btns = '<button class="btn" data-act="open" data-id="' + n.id + '">Open</button>';
  chip.innerHTML = '<span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + '</span><div class="txt"><b>' + esc(n.n) + "</b><small>" + esc(sub) + "</small></div>" + btns;
  chip.classList.add("on");
}

/* ======================= ROLL (step through a live roll) ======================= */
/* UI.roll = { pos, cur, steps:[{id,k,n,t,how}], t0 } · cur is the node whose options are shown */
function rollStart(posId) {
  const p = node(posId) || positions()[0]; if (!p) return;
  UI.roll = { pos: p.id, cur: p.id, steps: [{ id: p.id, k: "pos", n: p.n, t: "" }], t0: Date.now() };
  UI.tech.id = null; UI.tech.view = "pos"; UI.tech.q = ""; UI.walkCat = null; { const pv = UI.graph.rollPrev && UI.graph.rollPrev["id:" + p.id]; const np = {}; np["id:" + p.id] = pv || [0, 0]; UI.graph.rollPrev = np; } render();
}
function rollGoto(posId, how) {
  const R = UI.roll, p = node(posId); if (!R || !p) return;
  const times = R.steps.filter((x) => x.k === "pos" && x.id === p.id).length;
  R.pos = p.id; R.cur = p.id; R.grp = null; R.steps.push({ id: p.id, k: "pos", n: p.n, t: "", how: how || "" }); UI.walkCat = null; render();
  if (times) toast("Back in " + p.n + " (" + (times + 1) + (times === 1 ? "nd" : times === 2 ? "rd" : "th") + " time)");
}
function rollPick(nid) {
  const R = UI.roll, n = node(nid); if (!R || !n) return;
  R.steps.push({ id: n.id, k: n.k, n: n.n, t: n.t || "" }); R.cur = n.id; R.grp = null;
  if (n.k === "mv" && !kids(n.id).length) { if (n.to && node(n.to)) { rollGoto(n.to, "auto"); return; } if (n.t === "sub") { R.cur = n.id; } }
  if (n.k === "df" && !kids(n.id).length && n.to && node(n.to)) { rollGoto(n.to, "they"); return; }
  render();
}
function rollOtherSheet() {
  const b = '<p class="small muted">Pick the position you ended up in. The step is marked as a gap so you can add what happened to your tree later.</p>' + field("f-pos", "Now I’m in", '<select id="f-pos">' + positions().map((p) => '<option value="' + p.id + '">' + esc(p.n) + "</option>").join("") + "</select>");
  openSheet("Something else happened", b, { saveLabel: "Continue", onSave() { rollGoto(sv("f-pos"), "gap"); return true; } });
}
function rollEndSheet(finished) {
  const R = UI.roll; if (!R) return;
  const b = '<div class="field"><span class="lbl">How did it end?</span>' + chips("res", [["sub", "I finished a sub"], ["points", "Won on points"], ["tapped", "I got tapped"], ["time", "Time ran out"], ["drill", "Just drilling"]], finished ? "sub" : "time") + "</div>" + field("f-note", "Note", ta("f-note", "", "What worked, what to fix…")) + '<div class="field"><span class="lbl">Date</span>' + inp("f-d", todayIso(), "date", 'max="' + todayIso() + '"') + "</div>" + (R.steps.length >= 2 ? '<div class="field"><span class="lbl">Keep this path as a setup</span>' + chips("mk", [["no", "No"], ["yes", "Yes"]], "no") + "</div>" : "");
  openSheet("End roll", b, { state: { picks: { res: finished ? "sub" : "time", mk: "no" } }, saveLabel: "Save roll", delLabel: "Discard", onDelete() { UI.roll = null; render(); return true; }, onSave() { const rec = { id: uid(), d: sv("f-d") || todayIso(), res: pickVal("res", "time"), note: sv("f-note").trim(), steps: R.steps, sec: Math.round((Date.now() - R.t0) / 1000) }; S.rolls.items.push(rec); save("rolls"); if (pickVal("mk", "no") === "yes") { const st = R.steps.filter((s) => s.id !== "finish"); S.plans.setups.push({ id: uid(), n: setupName(st), steps: st.map((s) => ({ id: s.id, k: s.k, n: s.n, t: s.t || "" })), x: "" }); save("plans"); } UI.roll = null; UI.tech.view = "rolls"; UI.rollId = rec.id; render(); toast("Roll saved"); return true; } });
}
function rollStatsFor(nid) { let used = 0; for (const r of S.rolls.items) if (r.steps.some((s) => s.id === nid)) used++; return { used }; }
const RES_NAME = { sub: "Finished with a submission", points: "Won on points", tapped: "Got tapped", time: "Time ran out", drill: "Drilling" };
function rollSummary(r) {
  const ps = r.steps.filter((s) => s.k === "pos"), mv = r.steps.filter((s) => s.k === "mv"), df = r.steps.filter((s) => s.k === "df"), gaps = r.steps.filter((s) => s.how === "gap");
  const subs = mv.filter((s) => s.t === "sub").length; const counts = {}; for (const s of ps) counts[s.n] = (counts[s.n] || 0) + 1; const most = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { ps, mv, df, gaps, subs, most, uniq: new Set(ps.map((s) => s.id)).size };
}
function vRolls() {
  const items = S.rolls.items.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
  if (UI.rollId) { const r = items.find((x) => x.id === UI.rollId); if (r) return vRoll(r); UI.rollId = null; }
  let h = "";
  if (!items.length) return '<div class="card"><p class="empty">No rolls yet. Go to Positions, tap “Start a roll” and walk through a round step by step. Every roll is saved here for analysis.</p><button class="btn wide" data-act="roll-start" data-pos="st">Start a roll</button></div>';
  // aggregate
  const posC = {}, mvC = {}, gapC = {}, endC = {}; let subs = 0;
  for (const r of items) { endC[r.res] = (endC[r.res] || 0) + 1; for (const s of r.steps) { if (s.k === "pos") posC[s.n] = (posC[s.n] || 0) + 1; if (s.k === "mv") mvC[s.n] = (mvC[s.n] || 0) + 1; if (s.how === "gap") { const prev = r.steps[r.steps.indexOf(s) - 1]; if (prev) gapC[prev.n] = (gapC[prev.n] || 0) + 1; } } subs += rollSummary(r).subs; }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n || 5);
  const bars = (arr, color) => { const mx = Math.max(1, ...arr.map((x) => x[1])); return arr.map((x) => '<div class="row"><div class="txt"><b>' + esc(x[0]) + '</b><div class="bar"><i style="width:' + Math.round((x[1] / mx) * 100) + "%;background:" + color + '"></i></div></div><span class="num">' + x[1] + "</span></div>").join(""); };
  h += '<div class="card"><div class="summary four"><div class="stat"><b>' + items.length + '</b><span>rolls</span></div><div class="stat"><b>' + (endC.sub || 0) + '</b><span>finished</span></div><div class="stat"><b>' + (endC.tapped || 0) + '</b><span>tapped</span></div><div class="stat"><b>' + Object.keys(gapC).length + '</b><span>gaps</span></div></div></div>';
  h += '<div class="card"><h3>Where you spend your rolls</h3><div class="list">' + bars(top(posC), "var(--accent)") + "</div></div>";
  h += '<div class="card"><h3>Moves you reach for</h3><div class="list">' + bars(top(mvC), "var(--t-sweep)") + "</div></div>";
  if (Object.keys(gapC).length) h += '<div class="card"><h3>Gaps in your tree</h3><p class="muted small">Places where “something else happened”. Add what the opponent did and your answer.</p><div class="list">' + bars(top(gapC), "var(--warn)") + "</div></div>";
  h += '<div class="card"><div class="card-head"><h3>Rolls</h3><button class="btn" data-act="roll-start" data-pos="st">Start a roll</button></div><div class="list">' + items.slice(0, 40).map((r) => { const s = rollSummary(r); return '<button class="row" data-act="roll-open" data-id="' + r.id + '"><span class="pill ' + (r.res === "sub" ? "ok" : r.res === "tapped" ? "bad" : "na") + '">' + (r.res === "sub" ? "Sub" : r.res === "tapped" ? "Tapped" : r.res === "drill" ? "Drill" : "Time") + '</span><div class="txt"><b>' + fmtD(r.d) + " · " + s.uniq + (s.uniq === 1 ? " position, " : " positions, ") + s.mv.length + (s.mv.length === 1 ? " move</b><small>" : " moves</b><small>") + esc(s.ps.map((p) => p.n).slice(0, 4).join(" → ")) + (s.ps.length > 4 ? " → …" : "") + "</small></div>" + CHEV + "</button>"; }).join("") + "</div></div>";
  return h;
}
function vRoll(r) {
  const s = rollSummary(r);
  let h = '<button class="back" data-act="roll-close"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Rolls</button>';
  h += '<div class="card"><h2>' + fmtLong(r.d) + '</h2><p class="muted small">' + RES_NAME[r.res] + (r.sec ? " · " + (r.sec < 90 ? r.sec + " s" : Math.round(r.sec / 60) + " min") : "") + "</p>" + (r.note ? '<p class="small">' + esc(r.note) + "</p>" : "") +
    '<div class="summary four"><div class="stat"><b>' + s.uniq + '</b><span>positions</span></div><div class="stat"><b>' + s.mv.length + '</b><span>moves</span></div><div class="stat"><b>' + s.df.length + '</b><span>defended</span></div><div class="stat"><b>' + s.gaps.length + '</b><span>gaps</span></div></div>' +
    (s.most && s.most[1] > 1 ? '<p class="small">You kept coming back to <b>' + esc(s.most[0]) + "</b> (" + s.most[1] + " times).</p>" : "") + "</div>";
  h += '<div class="card"><h3>Step by step</h3><div class="path">' + r.steps.map((st, i) => { const n = node(st.id); const gap = st.how === "gap"; return '<button class="pn ' + st.k + (i === r.steps.length - 1 ? " cur" : "") + '" data-act="open" data-id="' + st.id + '"' + (n ? "" : " disabled") + '><span class="rail"><i></i></span><span class="pt"><span class="k">' + (st.k === "pos" ? (gap ? "ended up in (gap)" : i ? "now in" : "start") : st.k === "df" ? "they" : TNAME[st.t] || "me") + '</span><span class="nm">' + esc(st.n) + "</span></span></button>"; }).join("") + "</div></div>";
  if (s.gaps.length) h += '<div class="card"><h3>Fill the gaps</h3><p class="muted small">At these steps the tree had no answer. Add the defense or the follow-up so the next roll has one.</p><div class="list">' + s.gaps.map((g) => { const i = r.steps.indexOf(g); const prev = r.steps[i - 1]; return prev && node(prev.id) ? '<button class="row" data-act="open" data-id="' + prev.id + '"><div class="txt"><b>' + esc(prev.n) + "</b><small>then you ended up in " + esc(g.n) + "</small></div>" + CHEV + "</button>" : ""; }).join("") + "</div></div>";
  h += '<div class="actions"><button class="btn" data-act="roll-start" data-pos="' + (r.steps[0] ? r.steps[0].id : "st") + '">Roll again from the start</button>' + delBtn("roll:" + r.id, "roll-del", 'data-id="' + r.id + '"') + "</div>";
  return h;
}
/* Setup entry: a new move under another position whose result is this one. */
function entrySheet(posId) {
  const target = node(posId); if (!target) return;
  const srcs = positions().filter((p) => p.id !== posId);
  const b = field("f-n", "Move", inp("f-n", "", "text", 'autofocus placeholder="e.g. Pull guard from collar grip"')) +
    field("f-from", "Starting position", '<select id="f-from">' + srcs.map((p) => '<option value="' + p.id + '">' + esc(p.n) + "</option>").join("") + "</select>") +
    '<div class="field"><span class="lbl">Type</span>' + chips("t", TYPES.filter((t) => ["td", "sweep", "pass", "esc", "trans"].includes(t[0])), "trans") + "</div>" +
    field("f-when", "Opens when (situation)", inp("f-when", "", "text", 'placeholder="They push / they stand up"')) +
    field("f-s", "Steps (one per line)", ta("f-s", "", "Step 1\nStep 2"));
  openSheet("Entry into " + target.n, b, { state: { picks: { t: "trans" } }, onSave() {
    const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
    const from = sv("f-from"); if (!node(from)) return false;
    const t = pickVal("t", "trans");
    nodes().push({ id: uid(), k: "mv", p: from, n: name, en: "", t, s: lines(sv("f-s")), x: "", to: posId, cat: "", gi: "both", belt: "white", pts: t === "td" || t === "sweep" ? 2 : t === "pass" ? 3 : 0, energy: 2, when: sv("f-when").trim(), bait: "", kids: true, oc: [{ to: posId, f: "common" }] });
    save("tree"); toast("Entry added"); render(); return true;
  } });
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
  if (kind === "mv") b += field("f-to", "Usual result (position)", '<select id="f-to"><option value="">—</option>' + positions().map((p) => '<option value="' + p.id + '"' + (n && n.to === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>");
  if (kind === "mv") b += field("f-when", "Opens when (situation)", inp("f-when", n ? n.when : "", "text", 'placeholder="They push / they extend an arm / they stand up"')) +
    '<div class="grid2"><div class="field"><span class="lbl">Gi / no-gi</span>' + chips("gi", [["both", "Both"], ["gi", "Gi"], ["nogi", "No-gi"]], n ? n.gi || "both" : "both") + '</div><div class="field"><span class="lbl">From belt</span>' + chips("belt", [["white", "White"], ["blue", "Blue"], ["purple", "Purple"], ["brown", "Brown"]], n ? n.belt || "white" : "white") + "</div></div>" +
    '<div class="grid2">' + field("f-pts", "IBJJF points", inp("f-pts", n ? n.pts || 0 : 0, "number", 'inputmode="numeric" min="0" max="4"')) + '<div class="field"><span class="lbl">Energy (1–3)</span>' + scale("energy", n ? n.energy || 2 : 2, 1, 3) + "</div></div>" +
    field("f-bait", "Trap (what you offer, what you want them to do)", inp("f-bait", n ? n.bait : "", "text", 'placeholder="Leave the arm loose so they reach…"')) +
    '<div class="field"><span class="lbl">Kids rules</span>' + chips("kids", [["ok", "Allowed"], ["no", "Not for kids"]], n && n.kids === false ? "no" : "ok") + "</div>";
  if (kind === "df") b += field("f-dto", "They end up in (position, optional)", '<select id="f-dto"><option value="">— I answer from here</option>' + positions().map((p) => '<option value="' + p.id + '"' + (n && n.to === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>") + '<div class="field"><span class="lbl">How common</span>' + chips("f", [["common", "Common"], ["rare", "Rare"]], n ? n.f || "common" : "common") + "</div>" + field("f-bait", "Their trap (what they bait with)", inp("f-bait", n ? n.bait : "", "text", 'placeholder="They offer the underhook to…"'));
  if (kind === "pos") b += field("f-them", "Them (where the opponent is)", inp("f-them", n ? n.them || "" : "", "text", 'placeholder="On top, inside your locked legs…"'));
  if (kind === "pos") b += '<div class="field"><span class="lbl">Position quality</span>' + chips("rank", [["-2", "Hard"], ["-1", "Tough"], ["0", "Neutral"], ["1", "Good"], ["2", "Dominant"]], n ? String(n.rank || 0) : "0") + "</div>";
  openSheet(title, () => b + (kind === "mv" ? picker("oc", "Can also land in (tap + to mark rare)", "pos", { ph: "Position…", counts: true }) : ""), {
    state: { picks: { cat: n ? n.cat : "guard", t: n ? n.t : "sub", gi: n ? n.gi || "both" : "both", belt: n ? n.belt || "white" : "white", energy: n ? n.energy || 2 : 2, kids: n && n.kids === false ? "no" : "ok", f: n ? n.f || "common" : "common", rank: n ? String(n.rank || 0) : "0" }, pk: { oc: kind === "mv" && n && n.oc ? n.oc.filter((o) => node(o.to)).map((o) => ({ id: o.to, n: node(o.to).n, c: o.f === "rare" ? 2 : 1 })) : [] } },
    onSave() {
      const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
      const rec = n || { id: uid(), k: kind, p: parentId || null };
      rec.n = name; rec.en = sv("f-en").trim(); rec.x = sv("f-x").trim();
      if (kind === "pos") { rec.cat = pickVal("cat", "guard"); rec.rank = +pickVal("rank", "0"); rec.them = sv("f-them").trim(); }
      if (kind === "mv") { rec.t = pickVal("t", "sub"); rec.to = sv("f-to"); rec.when = sv("f-when").trim(); rec.gi = pickVal("gi", "both"); rec.belt = pickVal("belt", "white"); rec.pts = +sv("f-pts") || 0; rec.energy = pickVal("energy", 2); rec.bait = sv("f-bait").trim(); rec.kids = pickVal("kids", "ok") === "no" ? false : true; rec.oc = (UI.sheet.pk.oc || []).filter((x) => x.id).map((x) => ({ to: x.id, f: x.c >= 2 ? "rare" : "common" })); if (!rec.to && rec.oc.length) rec.to = rec.oc[0].to; }
      if (kind === "df") { rec.f = pickVal("f", "common"); rec.bait = sv("f-bait").trim(); rec.to = sv("f-dto"); }
      if (kind !== "df") rec.s = lines(sv("f-s"));
      if (!n) { nodes().push(rec); if (kind === "pos") UI.tech.id = null; else UI.tech.id = parentId; }
      save("tree"); toast(n ? "Saved" : "Added"); render(); return true;
    },
    onDelete: n ? () => { const ids = subtreeIds(n.id); S.tree.nodes = nodes().filter((x) => !ids.includes(x.id)); UI.tech.id = n.p || null; save("tree"); toast("Deleted"); go("enter-r"); return true; } : null,
  });
}
/* ======================= SETUPS (my own chain to a submission) ======================= */
function setupById(id) { return S.plans.setups.find((x) => x.id === id); }
function setupName(steps) { const last = steps[steps.length - 1]; const first = steps[0]; return (first ? first.n : "Setup") + " → " + (last ? last.n : "…"); }
function setupHasTrap(sp) { return sp.steps.some((s) => { const n = node(s.id); return n && n.bait; }); }
function setupEnds(sp) { const last = sp.steps[sp.steps.length - 1]; return last && last.k === "mv" && last.t === "sub"; }
function setupPath(sp) { return sp.steps.map((s, i) => '<span class="sp ' + s.k + '">' + (s.k === "df" ? "they: " : "") + esc(s.n) + "</span>").join('<span class="sep">›</span>'); }
function setupRow(sp) {
  return '<div class="plan"><button class="row" data-act="edit-setup" data-id="' + sp.id + '"><div class="txt"><b>' + esc(sp.n) + '</b><small class="spath">' + setupPath(sp) + "</small></div>" + CHEV + '</button><div class="refs">' +
    (setupEnds(sp) ? '<span class="pill ok">ends in a sub</span>' : '<span class="pill warn">no finish yet</span>') + (setupHasTrap(sp) ? '<span class="pill na">trap</span>' : "") + '<button class="chip" data-act="setup-roll" data-id="' + sp.id + '">Roll it</button></div></div>';
}
function vSetups() {
  let h = vRoute();
  h += '<div class="card"><div class="card-head"><h3>Setups</h3><span class="muted small">my paths to a submission</span></div>';
  if (!S.plans.setups.length) h += '<p class="empty">A setup is the chain you choose yourself: position → my move → their likely reaction → my answer … → submission. Build one, then roll it and the next planned step is starred on the graph.</p>';
  else h += '<div class="list">' + S.plans.setups.map(setupRow).join("") + "</div>";
  h += '<button class="btn ghost wide" data-act="add-setup">+ New setup</button></div>';
  return h;
}
function setupEdit(id, posId) {
  const sp = id ? setupById(id) : null;
  UI.setupEd = sp ? { id: sp.id, n: sp.n, x: sp.x || "", steps: sp.steps.slice() } : { id: null, n: "", x: "", steps: posId && node(posId) ? [{ id: posId, k: "pos", n: node(posId).n, t: "" }] : [] };
  UI.tech.id = null; UI.tech.q = ""; render();
}
function vSetupEdit() {
  const E = UI.setupEd; const last = E.steps[E.steps.length - 1]; const lastN = last ? node(last.id) : null;
  let h = '<button class="back" data-act="setup-cancel"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Setups</button>';
  h += '<div class="card"><h2>' + (E.id ? "Edit setup" : "New setup") + '</h2>' + field("f-sn", "Name", inp("f-sn", E.n, "text", 'placeholder="' + esc(setupName(E.steps)) + '"'));
  h += '<div class="path">' + E.steps.map((s, i) => '<div class="pn ' + s.k + (i === E.steps.length - 1 ? " cur" : "") + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + (s.k === "pos" ? (i ? "now in" : "start") : s.k === "df" ? "they" : TNAME[s.t] || "me") + '</span><span class="nm">' + esc(s.n) + "</span>" + (keyOf(node(s.id)) ? '<span class="key">' + esc(keyOf(node(s.id))) + "</span>" : "") + "</span></div>").join("") + "</div>";
  if (!E.steps.length) h += '<p class="muted small">Where does it start?</p><div class="chips">' + positions().map((p) => '<button class="chip pchip" data-act="setup-step" data-id="' + p.id + '" style="color:' + CAT_COLOR[p.cat] + '">' + iconFor(p) + "<span>" + esc(p.n) + "</span></button>").join("") + "</div>";
  else {
    const opts = nextOf(lastN).filter((e) => e.n.k !== "fin"); const me = opts.filter((e) => e.n.k === "mv"), they = opts.filter((e) => e.n.k === "df"), land = opts.filter((e) => e.n.k === "pos");
    const chip = (e) => '<button class="chip pchip' + (e.f === "rare" ? " rare" : "") + '" data-act="setup-step" data-id="' + e.n.id + '" style="color:' + nodeColor(e.n) + '">' + iconFor(e.n) + "<span>" + esc(e.n.n) + "</span>" + (e.n.bait ? ' <span class="pill na">trap</span>' : "") + "</button>";
    if (setupEnds(E)) h += '<div class="tip"><b>Ends in ' + esc(last.n) + '.</b> Save it, or keep going with how they defend it.</div>';
    if (me.length) h += '<p class="muted small">' + (lastN.k === "df" ? "My answer" : "My move") + '</p><div class="chips">' + me.map(chip).join("") + "</div>";
    if (they.length) h += '<p class="muted small">Their likely reaction</p><div class="chips">' + they.map(chip).join("") + "</div>";
    if (land.length) h += '<p class="muted small">Lands in</p><div class="chips">' + land.map(chip).join("") + "</div>";
    if (!opts.length) h += '<p class="empty">Nothing written after this step yet. Add it on the technique page first.</p>';
  }
  h += field("f-sx", "Note (why this works, the trap)", ta("f-sx", E.x, ""));
  h += '<div class="actions">' + (E.id ? delBtn("setup:" + E.id, "setup-del") : "") + '<button class="btn ghost" data-act="setup-undo"' + (E.steps.length ? "" : " disabled") + '>↶ Undo</button><button class="btn" data-act="setup-save" style="flex:1">Save setup</button></div></div>';
  return h;
}
/* ======================= ROUTES (from one position to another) ======================= */
function keyOf(n) { if (!n) return ""; if (n.bait) return "Trap: " + n.bait; if (n.s && n.s.length) return n.s[0]; return n.x || n.when || ""; }
function posEdges() {
  const E = {};
  for (const m of nodes()) { if (m.k !== "mv" || !allowed(m)) continue; const from = posOf(m.id); if (!from) continue;
    const oc = m.oc && m.oc.length ? m.oc : m.to ? [{ to: m.to, f: "common" }] : [];
    for (const o of oc) { if (!node(o.to) || o.to === from.id) continue; (E[from.id] = E[from.id] || []).push({ to: o.to, m, rare: o.f === "rare" }); } }
  return E;
}
function findRoutes(from, to, max) {
  const E = posEdges(); const out = [];
  const walk = (pos, path, cost, seen) => { if (path.length > 9 || out.length > 400) return; for (const e of E[pos] || []) { if (seen.has(e.to)) continue; const p = path.concat([{ id: e.m.id, k: "mv", n: e.m.n, t: e.m.t }, { id: e.to, k: "pos", n: node(e.to).n, t: "" }]); const c = cost + 1 + (e.rare ? 1.5 : 0); if (e.to === to) { out.push({ p, c }); continue; } const s2 = new Set(seen); s2.add(e.to); walk(e.to, p, c, s2); } };
  walk(from, [{ id: from, k: "pos", n: node(from).n, t: "" }], 0, new Set([from]));
  out.sort((a, b) => a.c - b.c || a.p.length - b.p.length);
  const seen = new Set(), res = []; for (const r of out) { const k = r.p.map((s) => s.id).join(">"); if (seen.has(k)) continue; seen.add(k); res.push(r.p); if (res.length >= (max || 3)) break; }
  return res;
}
function vRoute() {
  const ps = positions(); const r = UI.route || { from: "cg_b", to: "mt_t" };
  const sel = (id, cur) => '<select id="' + id + '">' + ps.map((p) => '<option value="' + p.id + '"' + (p.id === cur ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>";
  let h = '<div class="card"><div class="card-head"><h3>Find a route</h3><span class="muted small">from here to there</span></div><div class="grid2">' + field("f-rfrom", "From", sel("f-rfrom", r.from)) + field("f-rto", "To", sel("f-rto", r.to)) + '</div><button class="btn wide" data-act="route-find">Show the ways</button>';
  if (UI.route) {
    const routes = UI.route.from === UI.route.to ? [] : findRoutes(UI.route.from, UI.route.to, 3); UI.routeList = routes;
    if (!routes.length) h += '<p class="empty">' + (UI.route.from === UI.route.to ? "Pick two different positions." : "No written path yet. Add a move whose result is that position, or go through another position.") + "</p>";
    else h += routes.map((p, i) => '<div class="route"><div class="path">' + p.map((s, j) => '<div class="pn ' + s.k + (j === p.length - 1 ? " cur" : "") + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + (s.k === "pos" ? (j ? "then in" : "start") : TNAME[s.t] || "me") + '</span><span class="nm">' + esc(s.n) + "</span>" + (s.k === "mv" && keyOf(node(s.id)) ? '<span class="key">' + esc(keyOf(node(s.id))) + "</span>" : "") + "</span></div>").join("") + '</div><div class="actions"><span class="muted small" style="flex:1">' + ((p.length - 1) / 2) + " move" + (p.length > 3 ? "s" : "") + '</span><button class="btn ghost" data-act="route-save" data-i="' + i + '">Make it a setup</button></div></div>').join("");
  }
  return h + "</div>";
}

/* ======================= LEARN (quiz with spaced repetition) ======================= */
function learnDb() { S.settings.learn = S.settings.learn || { cards: {} }; return S.settings.learn; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickN(arr, n, not) { return shuffle(arr.filter((x) => !not.has(x.id))).slice(0, n); }
function learnCards() {
  const out = []; const today = todayIso();
  for (const n of nodes()) { if (n.k !== "mv" || !allowed(n)) continue; const pos = posOf(n.id); if (!pos) continue; const par = node(n.p);
    if (n.when && par.k === "pos") out.push({ id: "when:" + n.id, type: "when", n, pos });
    if (par && par.k === "df") out.push({ id: "ans:" + n.id, type: "ans", n, pos, df: par, mv: node(par.p) });
    if (n.to && node(n.to) && par.k === "pos") out.push({ id: "land:" + n.id, type: "land", n, pos });
    if (n.s && n.s.length > 1 && par.k === "pos") out.push({ id: "key:" + n.id, type: "key", n, pos }); }
  const db = learnDb().cards; for (const c of out) { const d = db[c.id]; c.due = !d || d.due <= today; c.new = !d; c.f = d ? d.f || 0 : 0; }
  return out;
}
function learnQ(card) {
  const n = card.n, pos = card.pos; const sib = nodes().filter((m) => m.k === "mv" && m.id !== n.id && posOf(m.id) && posOf(m.id).id === pos.id && node(m.p).k === "pos");
  const opt = (x) => ({ id: x.id, n: x.n });
  if (card.type === "when") { const others = pickN(sib.filter((m) => m.when !== n.when), 3, new Set([n.id])); if (others.length < 2) return null; return { prompt: "In <b>" + esc(pos.n) + "</b>: " + esc(n.when) + ". What do you go for?", options: shuffle([opt(n)].concat(others.map(opt))), correct: n.id, tag: "Situation" }; }
  if (card.type === "ans") { const others = pickN(sib, 3, new Set([n.id, ...kids(card.df.id).map((k) => k.id)])); if (others.length < 2) return null; return { prompt: "<b>" + esc(pos.n) + "</b>: you go for <b>" + esc(card.mv.n) + "</b>, they <b>" + esc(card.df.n.replace(/^They /, "")) + "</b>. Your answer?", options: shuffle([opt(n)].concat(others.map(opt))), correct: n.id, tag: "Counter" }; }
  if (card.type === "land") { const others = pickN(positions().filter((p) => p.id !== n.to && p.id !== pos.id), 3, new Set()); return { prompt: "<b>" + esc(pos.n) + "</b> · <b>" + esc(n.n) + "</b> usually lands you in…", options: shuffle([opt(node(n.to))].concat(others.map(opt))), correct: n.to, tag: "Where it lands" }; }
  if (card.type === "key") { const others = pickN(sib.filter((m) => m.s && m.s.length && m.s[0] !== n.s[0]), 3, new Set([n.id])); if (others.length < 2) return null; return { prompt: "<b>" + esc(pos.n) + "</b> · <b>" + esc(n.n) + "</b>. The first thing to do?", options: shuffle([{ id: n.id, n: n.s[0] }].concat(others.map((m) => ({ id: m.id, n: m.s[0] })))), correct: n.id, tag: "Key point" }; }
  return null;
}
function learnStart() {
  const cards = learnCards(); const due = shuffle(cards.filter((c) => c.due && !c.new)), fresh = shuffle(cards.filter((c) => c.new)), rest = shuffle(cards.filter((c) => !c.due));
  const deck = due.concat(fresh, rest).slice(0, 40); const qs = []; const used = new Set();
  for (const c of deck) { if (qs.length >= 10 || used.has(c.n.id)) continue; const q = learnQ(c); if (q) { q.card = c; qs.push(q); used.add(c.n.id); } }
  if (!qs.length) { toast("Not enough written moves to quiz yet"); return; }
  UI.learn = { qs, i: 0, picked: null, right: 0, wrong: [] }; render(); window.scrollTo({ top: 0, behavior: "instant" });
}
function learnPick(i) {
  const L = UI.learn; if (!L || L.picked != null) return; const q = L.qs[L.i]; L.picked = i; const ok = q.options[i].id === q.correct;
  const db = learnDb().cards; const d = db[q.card.id] || { iv: 0, due: todayIso(), n: 0, f: 0 };
  if (ok) { L.right++; d.iv = d.iv ? Math.round(d.iv * 2.2) : 1; d.n++; d.due = addDays(todayIso(), d.iv); } else { L.wrong.push(q); d.iv = 0; d.f = (d.f || 0) + 1; d.due = todayIso(); }
  db[q.card.id] = d; save("settings"); render();
}
function learnNext() { const L = UI.learn; if (!L) return; L.i++; L.picked = null; render(); window.scrollTo({ top: 0, behavior: "instant" }); }
function vLearn() {
  const L = UI.learn;
  if (!L) {
    const cards = learnCards(); const due = cards.filter((c) => c.due && !c.new).length, seen = cards.filter((c) => !c.new).length; const weak = cards.filter((c) => c.f >= 2).sort((a, b) => b.f - a.f).slice(0, 6);
    let h = '<div class="card"><div class="card-head"><h3>Learn</h3><span class="muted small">quiz yourself on your own tree</span></div><p class="small">Ten questions from your positions: which move fits the situation, what you answer when they defend, where a move lands, and the first thing to do. Right answers come back later, wrong ones tomorrow.</p>' +
      '<div class="summary"><div class="stat"><b>' + due + '</b><span>due today</span></div><div class="stat"><b>' + seen + '</b><span>seen</span></div><div class="stat"><b>' + cards.length + '</b><span>cards</span></div></div><button class="btn wide" data-act="learn-start">Start · 10 questions</button></div>';
    if (weak.length) h += '<div class="card"><h3>Weak spots</h3><div class="list">' + weak.map((c) => '<button class="node-row" data-act="open" data-id="' + c.n.id + '"><span class="pict" style="color:' + nodeColor(c.n) + '">' + iconFor(c.n) + '</span><div class="txt"><b>' + esc(c.n.n) + "</b><small>" + esc(c.pos.n) + " · missed " + c.f + "×</small></div>" + CHEV + "</button>").join("") + "</div></div>";
    return h;
  }
  if (L.i >= L.qs.length) {
    return '<div class="card"><h2>' + L.right + " / " + L.qs.length + '</h2><p class="small">' + (L.right === L.qs.length ? "Clean sweep." : L.right >= 7 ? "Solid. The misses come back tomorrow." : "Open the misses and read the steps once.") + "</p>" + (L.wrong.length ? '<div class="list">' + L.wrong.map((q) => '<button class="node-row" data-act="open" data-id="' + q.card.n.id + '"><span class="pict" style="color:' + nodeColor(q.card.n) + '">' + iconFor(q.card.n) + '</span><div class="txt"><b>' + esc(q.card.n.n) + "</b><small>" + esc(q.card.pos.n) + "</small></div>" + CHEV + "</button>").join("") + "</div>" : "") + '<div class="actions"><button class="btn ghost" data-act="learn-stop">Done</button><button class="btn" style="flex:1" data-act="learn-start">Again</button></div></div>';
  }
  const q = L.qs[L.i]; const n = q.card.n; const done = L.picked != null;
  let h = '<div class="card"><div class="card-head"><span class="pill na">' + q.tag + '</span><span class="muted small">' + (L.i + 1) + " / " + L.qs.length + '</span></div><p class="qprompt">' + q.prompt + '</p><div class="opts">' + q.options.map((o, i) => '<button class="opt' + (done ? (o.id === q.correct ? " ok" : i === L.picked ? " bad" : " off") : "") + '" data-act="learn-pick" data-i="' + i + '"' + (done ? " disabled" : "") + ">" + esc(o.n) + "</button>").join("") + "</div>";
  if (done) h += '<div class="tip' + (q.options[L.picked].id === q.correct ? " good" : "") + '"><b>' + (q.options[L.picked].id === q.correct ? "Yes." : "Not quite.") + "</b> " + esc(n.n) + (n.when ? " · " + esc(n.when) : "") + (n.s && n.s.length ? '<ol class="steps">' + n.s.slice(0, 3).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol>" : "") + (n.bait ? '<p class="small"><b>Trap:</b> ' + esc(n.bait) + "</p>" : "") + '</div><div class="actions"><button class="btn ghost" data-act="open" data-id="' + n.id + '">Open</button><button class="btn" style="flex:1" data-act="learn-next">' + (L.i + 1 < L.qs.length ? "Next" : "Finish") + "</button></div>";
  else h += '<div class="actions"><button class="btn ghost" data-act="learn-stop">Stop</button></div>';
  return h + "</div>";
}
function vPlans() {
  let h = '<div class="card"><div class="card-head"><h3>Game plans by opponent</h3></div>';
  if (!S.plans.items.length) h += '<p class="empty">No game plans yet. Add one per type of opponent.</p>';
  else h += S.plans.items.map((p) => '<div class="plan"><button class="row" data-act="edit-plan" data-id="' + p.id + '"><div class="txt"><b>' + esc(p.n) + '</b><small>' + esc(p.x) + "</small></div>" + CHEV + '</button><div class="refs">' + (p.tags || []).filter((t) => node(t)).map((t) => '<button class="chip" data-act="open" data-id="' + t + '">' + esc(node(t).n) + "</button>").join("") + "</div></div>").join("");
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
    onDelete: p ? () => { S.plans.items = S.plans.items.filter((x) => x.id !== p.id); save("plans"); render(); return true; } : null,
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
      if (!s) S.log.items.push(rec); save("log"); toast("Training saved"); render(); return true;
    },
    onDelete: s ? () => { S.log.items = S.log.items.filter((x) => x.id !== s.id); save("log"); toast("Deleted"); render(); return true; } : null,
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
      h += '<div class="actions"><button class="btn" data-act="body-log" data-id="' + r.id + '">Done, log it</button><button class="btn ghost" data-act="edit-routine" data-id="' + r.id + '">Edit</button></div>';
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
    onDelete: r ? () => { S.body.routines = S.body.routines.filter((x) => x.id !== r.id); save("body"); render(); return true; } : null,
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
    '<p class="muted small">' + (track === "kids" ? "Kids belts run to age 15, then the adult ladder." : "0–4 stripes per belt. Times are minimums.") + "</p></div>";
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
  h += '<div class="card"><h3>Promotion history</h3>' + (hist.length ? '<div class="list">' + hist.map((x) => '<button class="row" data-act="edit-promo" data-id="' + x.id + '"><span class="sw ladder" style="display:flex;width:40px;height:12px;border:1px solid var(--line);border-radius:2px;overflow:hidden">' + beltSwatch(beltDef(x.track || track, x.belt)) + '</span><div class="txt"><b>' + esc(beltDef(x.track || track, x.belt).n) + (x.stripes ? ", " + x.stripes + " stripes" : "") + "</b><small>" + fmtLong(x.d) + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>" : '<p class="empty">No promotions logged.</p>') + "</div>";
  return h;
};
function promoSheet(id) {
  const x = S.belt.history.find((h) => h.id === id); if (!x) return;
  openSheet("Promotion", field("f-d", "Date", inp("f-d", x.d, "date", 'max="' + todayIso() + '"')) + field("f-note", "Note", inp("f-note", x.note || "", "text")), {
    onSave() { x.d = sv("f-d") || x.d; x.note = sv("f-note").trim(); save("belt"); render(); return true; },
    onDelete() { S.belt.history = S.belt.history.filter((h) => h.id !== x.id); save("belt"); render(); return true; },
  });
}
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
      save("belt"); render(); return true;
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
    '<p class="muted small">IBJJF weighs you in the gi (about 1–1.5 kg extra). Kids divisions differ per event.</p></div>';
  if (items.length) h += '<div class="card"><h3>Log</h3><div class="list">' + items.slice().reverse().slice(0, 30).map((x) => '<button class="row" data-act="edit-weight" data-id="' + x.id + '"><div class="txt"><b>' + x.kg + ' kg</b><small>' + fmtLong(x.d) + "</small></div>" + CHEV + "</button>").join("") + "</div></div>";
  return h;
};
function weightSheet(id) {
  const x = S.weight.items.find((w) => w.id === id); if (!x) return;
  openSheet("Weight entry", '<div class="grid2">' + field("f-kg", "Weight, kg", inp("f-kg", x.kg, "number", 'inputmode="decimal" step="0.1"')) + field("f-d", "Date", inp("f-d", x.d, "date", 'max="' + todayIso() + '"')) + "</div>", {
    onSave() { const kg = +sv("f-kg"); if (!kg) return false; x.kg = kg; x.d = sv("f-d") || x.d; save("weight"); render(); return true; },
    onDelete() { S.weight.items = S.weight.items.filter((w) => w.id !== x.id); save("weight"); render(); return true; },
  });
}
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
const MNAME = { gold: "Gold", silver: "Silver", bronze: "Bronze" };
VIEWS.comp = function () {
  if (UI.comp.id) { const ev = S.comp.events.find((e) => e.id === UI.comp.id); if (ev) return vEvent(ev); UI.comp.id = null; }
  const today = todayIso(); const evs = S.comp.events.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  const all = evs.flatMap((e) => e.matches || []); const w = all.filter((m) => m.res === "w").length, l = all.filter((m) => m.res === "l").length, subs = all.filter((m) => m.res === "w" && m.how === "sub").length;
  const medals = evs.filter((e) => e.medal).length;
  let h = '<div class="card"><div class="summary four"><div class="stat"><b>' + w + '</b><span>wins</span></div><div class="stat"><b>' + l + '</b><span>losses</span></div><div class="stat"><b>' + subs + '</b><span>by sub</span></div><div class="stat"><b>' + medals + '</b><span>medals</span></div></div></div>';
  h += '<button class="btn big wide" data-act="add-event">+ Add competition</button>';
  const up = evs.filter((e) => e.d >= today).reverse(), past = evs.filter((e) => e.d < today);
  const row = (e) => { const ms = e.matches || []; const ww = ms.filter((m) => m.res === "w").length; const dd = daysBetween(today, e.d); return '<button class="row" data-act="open-event" data-id="' + e.id + '"><div class="txt"><b>' + esc(e.n) + (e.medal ? ' <span class="pill ' + (e.medal === "gold" ? "warn" : "na") + '">' + MNAME[e.medal] + "</span>" : "") + "</b><small>" + fmtLong(e.d) + (e.div ? " · " + esc(e.div) : "") + (e.d >= today ? ' · <span class="pill ok">' + (dd === 0 ? "today" : dd + " days left") + "</span>" : ms.length ? " · " + ww + "–" + (ms.length - ww) : "") + "</small></div>" + CHEV + "</button>"; };
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
  h += '<div class="actions"><button class="btn ghost" data-act="edit-event" data-id="' + e.id + '">Edit</button></div></div>';
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
    onDelete: e ? () => { S.comp.events = S.comp.events.filter((x) => x.id !== e.id); UI.comp.id = null; save("comp"); go("enter-r"); return true; } : null,
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
  const b = field("f-name", "Your name (shown to your club)", inp("f-name", S.settings.name || "", "text", 'placeholder="Name"')) + '<div class="field"><span class="lbl">Theme</span>' + chips("theme", [["system", "Device"], ["light", "Light"], ["dark", "Dark"]], S.settings.theme || "system") + "</div>" +
    '<div class="field"><span class="lbl">Data</span><div class="actions"><button class="btn ghost" data-act="backup">Download backup (JSON)</button><label class="btn ghost" style="display:flex;align-items:center;justify-content:center">Restore from backup<input id="imp-file" type="file" accept="application/json" hidden></label></div></div>' +
    '<div class="field"><span class="lbl">Ruleset</span>' + chips("rules", [["both", "Gi & no-gi"], ["gi", "Gi only"], ["nogi", "No-gi only"]], S.settings.rules || "both") + '</div><div class="field"><span class="lbl">Belt filter</span>' + chips("beltf", [["0", "Show all"], ["1", "Only up to my belt"]], S.settings.beltFilter ? "1" : "0") + "</div>" +
    '<div class="field"><span class="lbl">Technique library</span><button class="btn ghost' + (UI.confirm === "reset" ? " danger" : "") + '" data-act="reset-seed">' + (UI.confirm === "reset" ? "Really reset? Everything you added will be lost" : "Reload the starter library") + "</button></div>" +
    '<p class="muted small">' + (mode === "cloud" ? "Signed in: " + esc((SB.session || {}).email || "") : "Local mode: data stays on this device only.") + "</p>" +
    (mode === "cloud" ? '<button class="btn ghost danger" data-act="logout">' + (UI.confirm === "logout" ? "Sign out?" : "Sign out") + "</button>" : "");
  openSheet("Settings", b, { state: { picks: { theme: S.settings.theme || "system", rules: S.settings.rules || "both", beltf: S.settings.beltFilter ? "1" : "0" } }, onSave() { S.settings.name = sv("f-name").trim(); save("settings"); if (CLUB.id) clubUpdateMe(); render(); return true; } });
}
function applyTheme() { const t = S.settings.theme || "system"; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; try { localStorage.setItem("bjj-theme", t); } catch (e) {} }
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
async function importBackup(file) {
  try { const o = JSON.parse(await file.text()); if (!o || !o.tree || !o.log) throw 0; for (const k of KEYS) if (o[k]) S[k] = o[k]; normalize(); for (const k of KEYS) save(k); applyTheme(); closeSheet(); render(); toast("Restored"); } catch (e) { toast("That file does not match"); }
}


/* ======================= TRAIN / ME (grouped tabs) ======================= */
VIEWS.train = function () { const v = UI.seg.train || "log"; return seg(SEGS.train, v, "segview") + (v === "body" ? VIEWS.body() : VIEWS.log()); };
VIEWS.me = function () { const v = UI.seg.me || "belt"; return seg(SEGS.me, v, "segview") + (v === "weight" ? VIEWS.weight() : v === "comp" ? VIEWS.comp() : VIEWS.belt()); };

/* ======================= CLUB ======================= */
/* Shared docs: clubs/index, club/<id>/profile, club/<id>/members, club/<id>/pay/<uid>. Local mode keeps them in localStorage. */
const CLUB = { id: null, profile: null, members: null, pay: {}, index: null, busy: false, err: "" };
const CLKEY = "bjj-club-local";
function clocal() { try { return JSON.parse(localStorage.getItem(CLKEY) || "{}"); } catch (e) { return {}; } }
async function cget(path) { if (mode === "cloud") return SB.get(path); return clocal()[path] || null; }
async function cset(path, data) { if (mode === "cloud") return SB.set(path, data); const m = clocal(); m[path] = data; localStorage.setItem(CLKEY, JSON.stringify(m)); }
async function clist(prefix) { if (mode === "cloud") return SB.list(prefix); const m = clocal(); return Object.keys(m).filter((k) => k.startsWith(prefix)).map((k) => ({ path: k, data: m[k] })); }
function myUid() { return mode === "cloud" ? SB.uid() : "local"; }
function myName() { return S.settings.name || (SB.session && (SB.session.name || SB.session.email)) || "Me"; }
function isAdmin() { return !!(CLUB.profile && (CLUB.profile.admins || []).includes(myUid())); }
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND = { gi: "Gi", nogi: "No-gi", open: "Open mat", kids: "Kids", comp: "Comp class", sc: "S&C" };
function thisMonth() { return todayIso().slice(0, 7); }
async function clubLoad() {
  const id = S.settings.clubId; CLUB.busy = true; CLUB.err = "";
  try {
    if (!id) { CLUB.id = null; CLUB.profile = null; CLUB.members = null; CLUB.pay = {}; CLUB.index = (await cget("clubs/index")) || { list: [] }; }
    else {
      CLUB.profile = await cget("club/" + id + "/profile");
      if (!CLUB.profile) { S.settings.clubId = ""; save("settings"); CLUB.id = null; CLUB.index = (await cget("clubs/index")) || { list: [] }; }
      else { CLUB.id = id; CLUB.members = (await cget("club/" + id + "/members")) || { list: [] }; CLUB.pay = {}; const rows = await clist("club/" + id + "/pay/"); for (const r of rows) CLUB.pay[r.path.split("/").pop()] = r.data; }
    }
  } catch (e) { CLUB.err = "Could not load the club"; console.warn(e); }
  CLUB.busy = false; CLUB.loadedFor = S.settings.clubId || "-"; if (UI.tab === "club") render();
}
function clubNeeds() { return CLUB.loadedFor !== (S.settings.clubId || "-"); }
async function clubUpdateMe() {
  if (!CLUB.id || !CLUB.members) return; const me = myUid(); let m = CLUB.members.list.find((x) => x.uid === me);
  if (!m) { m = { uid: me, since: todayIso() }; CLUB.members.list.push(m); }
  m.n = myName(); m.email = SB.session ? SB.session.email : ""; m.belt = S.belt.belt; m.stripes = S.belt.stripes;
  await cset("club/" + CLUB.id + "/members", CLUB.members);
}
async function clubJoin(id) {
  S.settings.clubId = id; save("settings"); CLUB.loadedFor = null; await clubLoad(); await clubUpdateMe(); toast("Welcome to " + CLUB.profile.n); render();
}
async function clubLeave() {
  if (CLUB.id && CLUB.members) { CLUB.members.list = CLUB.members.list.filter((x) => x.uid !== myUid()); await cset("club/" + CLUB.id + "/members", CLUB.members); }
  S.settings.clubId = ""; save("settings"); CLUB.loadedFor = null; await clubLoad(); render();
}
function fmtMoney(v) { v = +v || 0; return v.toLocaleString("en-US") + "₮"; }
function lastPaid(uid) { const p = CLUB.pay[uid]; if (!p || !p.items.length) return null; return p.items.slice().sort((a, b) => (a.per < b.per ? 1 : -1))[0]; }
function paidThisMonth(uid) { const p = CLUB.pay[uid]; return !!(p && p.items.some((x) => x.per === thisMonth())); }
function nextOpenMat(sched) {
  const d = new Date(); const dow = (d.getDay() + 6) % 7; const open = (sched || []).filter((x) => x.kind === "open");
  if (!open.length) return null; let best = null; for (const x of open) { let diff = (x.d - dow + 7) % 7; if (diff === 0 && x.t < d.toTimeString().slice(0, 5)) diff = 7; if (!best || diff < best.diff) best = { diff, x }; }
  return best ? (best.diff === 0 ? "Today " : best.diff === 1 ? "Tomorrow " : DAYS[best.x.d] + " ") + best.x.t : null;
}
VIEWS.club = function () {
  if (clubNeeds()) { if (!CLUB.busy) clubLoad(); return '<div class="card"><p class="empty">Loading your club…</p></div>'; }
  if (CLUB.err) return '<div class="card"><p class="empty">' + esc(CLUB.err) + '</p><button class="btn ghost wide" data-act="club-reload">Try again</button></div>';
  if (!CLUB.id) {
    const list = (CLUB.index && CLUB.index.list) || [];
    let h = '<div class="card"><h2>Your club</h2><p class="small">Join your academy to see its schedule and open mats, keep your membership payments in one place, and let the coach see who is on the mat.</p>';
    if (list.length) h += '<div class="list">' + list.map((c) => '<div class="row"><div class="txt"><b>' + esc(c.n) + "</b>" + (c.city ? "<small>" + esc(c.city) + "</small>" : "") + '</div><button class="btn ghost" style="flex:none" data-act="club-join" data-id="' + c.id + '">Join</button></div>').join("") + "</div>";
    else h += '<p class="empty">No club registered yet. Create yours and your training partners can join.</p>';
    h += '<button class="btn wide" data-act="club-new">+ Register a club</button></div>';
    return h;
  }
  const P = CLUB.profile; const adm = isAdmin(); const nom = nextOpenMat(P.schedule);
  let h = '<div class="card clubhead"><div class="card-head"><h2>' + esc(P.n) + "</h2>" + (adm ? '<button class="btn ghost" data-act="club-edit">Edit</button>' : "") + "</div>" +
    '<p class="muted small">' + [P.city, P.coach ? "Coach " + P.coach : ""].filter(Boolean).map(esc).join(" · ") + "</p>" + (P.about ? '<p class="small">' + esc(P.about) + "</p>" : "") +
    '<div class="facts">' + (P.addr ? '<span>' + esc(P.addr) + "</span>" : "") + (P.phone ? '<a href="tel:' + esc(P.phone) + '">' + esc(P.phone) + "</a>" : "") + (P.ig ? '<a href="https://instagram.com/' + esc(P.ig.replace(/^@/, "")) + '" target="_blank" rel="noopener">@' + esc(P.ig.replace(/^@/, "")) + "</a>" : "") + "</div>" +
    '<div class="summary"><div class="stat"><b>' + fmtMoney(P.fee && P.fee.month) + '</b><span>per month</span></div><div class="stat"><b>' + fmtMoney(P.fee && P.fee.drop) + '</b><span>drop-in</span></div><div class="stat"><b>' + (nom || "—") + '</b><span>next open mat</span></div></div></div>';
  h += seg([["sched", "Schedule"], ["pay", "Payments"], ["members", "Members"]], UI.clubSeg, "clubseg");
  if (UI.clubSeg === "sched") h += vClubSched(P, adm);
  else if (UI.clubSeg === "pay") h += vClubPay(P, adm);
  else h += vClubMembers(P, adm);
  return h;
};
function vClubSched(P, adm) {
  const sched = (P.schedule || []).slice().sort((a, b) => a.d - b.d || (a.t < b.t ? -1 : 1)); const today = (new Date().getDay() + 6) % 7;
  let h = '<div class="card"><div class="card-head"><h3>Weekly schedule</h3><span class="muted small">' + sched.length + " classes</span></div>";
  if (!sched.length) h += '<p class="empty">' + (adm ? "Add the week’s classes and open mats." : "The coach has not added the schedule yet.") + "</p>";
  else h += '<div class="week">' + DAYS.map((dn, d) => { const xs = sched.filter((x) => x.d === d); if (!xs.length) return ""; return '<div class="day' + (d === today ? " today" : "") + '"><div class="dn">' + dn + (d === today ? " · today" : "") + '</div>' + xs.map((x, i) => '<button class="sess ' + x.kind + '" data-act="' + (adm ? "club-sess" : "none") + '" data-i="' + sched.indexOf(x) + '"><span class="t">' + esc(x.t) + '</span><span class="nm">' + esc(x.n || KIND[x.kind] || "Class") + '</span><span class="pill ' + (x.kind === "open" ? "ok" : "na") + '">' + (KIND[x.kind] || x.kind) + "</span></button>").join("") + "</div>"; }).join("") + "</div>";
  if (adm) h += '<button class="btn ghost wide" data-act="club-sess">+ Add a class or open mat</button>';
  return h + "</div>";
}
function vClubPay(P, adm) {
  const me = myUid(); const mine = (CLUB.pay[me] && CLUB.pay[me].items || []).slice().sort((a, b) => (a.d < b.d ? 1 : -1)); const ok = paidThisMonth(me);
  let h = '<div class="card"><div class="card-head"><h3>My membership</h3><span class="pill ' + (ok ? "ok" : "warn") + '">' + (ok ? "Paid for " + thisMonth() : "Not paid for " + thisMonth()) + "</span></div>";
  if (!mine.length) h += '<p class="empty">No payments logged. Add one when you pay the monthly fee.</p>';
  else h += '<div class="list">' + mine.map((x) => '<button class="row" data-act="club-pay" data-id="' + x.id + '"><div class="txt"><b>' + fmtMoney(x.amt) + " · " + esc(x.per) + "</b><small>" + fmtD(x.d) + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>";
  h += '<button class="btn wide" data-act="club-pay">+ Log a payment</button></div>';
  if (adm) {
    const ms = (CLUB.members.list || []).slice().sort((a, b) => (paidThisMonth(a.uid) === paidThisMonth(b.uid) ? 0 : paidThisMonth(a.uid) ? 1 : -1));
    h += '<div class="card"><div class="card-head"><h3>Who has paid · ' + thisMonth() + '</h3><span class="muted small">' + ms.filter((m) => paidThisMonth(m.uid)).length + " / " + ms.length + "</span></div><div class=\"list\">" + ms.map((m) => { const lp = lastPaid(m.uid); const ok = paidThisMonth(m.uid); return '<div class="row"><span class="pill ' + (ok ? "ok" : "bad") + '">' + (ok ? "paid" : "due") + '</span><div class="txt"><b>' + esc(m.n || m.email || "Member") + "</b><small>" + (lp ? "last: " + esc(lp.per) + " · " + fmtMoney(lp.amt) : "never") + '</small></div><button class="btn ghost" style="flex:none" data-act="club-pay" data-uid="' + m.uid + '">Log</button></div>'; }).join("") + "</div></div>";
  }
  return h;
}
function vClubMembers(P, adm) {
  const ms = (CLUB.members.list || []).slice().sort((a, b) => BELT_ORDER.indexOf((b.belt || "white").split("-")[0]) - BELT_ORDER.indexOf((a.belt || "white").split("-")[0]));
  let h = '<div class="card"><div class="card-head"><h3>Members</h3><span class="muted small">' + ms.length + "</span></div><div class=\"list\">" + ms.map((m) => { const b = (m.belt || "white").split("-")[0]; const isA = (P.admins || []).includes(m.uid); return '<div class="row"><span class="bdot" style="background:' + (BELT_COLOR[b] || "#999") + '"></span><div class="txt"><b>' + esc(m.n || m.email || "Member") + (isA ? ' <span class="pill na">coach</span>' : "") + "</b><small>" + b + " belt" + (m.stripes ? " · " + m.stripes + " stripes" : "") + (m.since ? " · since " + fmtD(m.since) : "") + "</small></div>" + (adm && m.uid !== myUid() ? '<button class="x" data-act="club-admin" data-uid="' + m.uid + '">' + (isA ? "Remove coach" : "Make coach") + "</button>" : "") + "</div>"; }).join("") + "</div>";
  h += '<div class="actions"><button class="btn ghost danger" data-act="club-leave">' + (UI.confirm === "leave" ? "Leave " + esc(P.n) + "?" : "Leave club") + "</button></div></div>";
  return h;
}
function clubSheet(edit) {
  const P = edit ? CLUB.profile : {}; const fee = P.fee || {};
  const b = field("c-n", "Club name", inp("c-n", P.n || "", "text", 'autofocus placeholder="e.g. Ulaanbaatar BJJ"')) + '<div class="grid2">' + field("c-city", "City", inp("c-city", P.city || "", "text")) + field("c-coach", "Head coach", inp("c-coach", P.coach || "", "text")) + "</div>" +
    field("c-addr", "Address", inp("c-addr", P.addr || "", "text")) + '<div class="grid2">' + field("c-phone", "Phone", inp("c-phone", P.phone || "", "tel")) + field("c-ig", "Instagram", inp("c-ig", P.ig || "", "text", 'placeholder="@club"')) + "</div>" +
    '<div class="grid2">' + field("c-fm", "Monthly fee (₮)", inp("c-fm", fee.month || "", "number", 'inputmode="numeric"')) + field("c-fd", "Drop-in fee (₮)", inp("c-fd", fee.drop || "", "number", 'inputmode="numeric"')) + "</div>" + field("c-about", "About", ta("c-about", P.about || "", "Style, who trains here, what to bring…"));
  openSheet(edit ? "Edit club" : "Register a club", b, { saveLabel: edit ? "Save" : "Create club", async onSave() {
    const n = sv("c-n").trim(); if (!n) { $("c-n").focus(); return false; }
    const rec = Object.assign(edit ? CLUB.profile : { id: uid(), admins: [myUid()], schedule: [], created: todayIso() }, { n, city: sv("c-city").trim(), coach: sv("c-coach").trim(), addr: sv("c-addr").trim(), phone: sv("c-phone").trim(), ig: sv("c-ig").trim(), about: sv("c-about").trim(), fee: { month: +sv("c-fm") || 0, drop: +sv("c-fd") || 0 } });
    try {
      await cset("club/" + rec.id + "/profile", rec);
      const idx = (await cget("clubs/index")) || { list: [] }; const i = idx.list.findIndex((x) => x.id === rec.id); const row = { id: rec.id, n: rec.n, city: rec.city }; if (i >= 0) idx.list[i] = row; else idx.list.push(row); await cset("clubs/index", idx);
      if (!edit) { S.settings.clubId = rec.id; save("settings"); CLUB.loadedFor = null; await clubLoad(); await clubUpdateMe(); } else CLUB.profile = rec;
      toast(edit ? "Saved" : "Club created"); render();
    } catch (e) { toast("Could not save the club"); }
    return true;
  } });
}
function sessSheet(i) {
  const P = CLUB.profile; const sched = (P.schedule || []).slice().sort((a, b) => a.d - b.d || (a.t < b.t ? -1 : 1)); const x = i != null ? sched[i] : null;
  const b = '<div class="field"><span class="lbl">Day</span>' + chips("d", DAYS.map((d, j) => [String(j), d]), x ? String(x.d) : "0") + "</div>" + '<div class="grid2">' + field("s-t", "Starts", inp("s-t", x ? x.t : "18:00", "time")) + field("s-n", "Name", inp("s-n", x ? x.n : "", "text", 'placeholder="Fundamentals"')) + "</div>" +
    '<div class="field"><span class="lbl">Kind</span>' + chips("kind", Object.entries(KIND), x ? x.kind : "gi") + "</div>";
  openSheet(x ? "Edit class" : "Add a class", b, { state: { picks: { d: x ? String(x.d) : "0", kind: x ? x.kind : "gi" } }, onDelete: x ? async () => { P.schedule = P.schedule.filter((y) => y !== x); await cset("club/" + P.id + "/profile", P); render(); return true; } : null, async onSave() {
    const rec = x || {}; rec.d = +pickVal("d", "0"); rec.t = sv("s-t") || "18:00"; rec.n = sv("s-n").trim(); rec.kind = pickVal("kind", "gi");
    if (!x) (P.schedule = P.schedule || []).push(rec); await cset("club/" + P.id + "/profile", P); toast("Saved"); render(); return true;
  } });
}
function paySheet(id, forUid) {
  const me = myUid(); const uidFor = forUid || me; const doc = CLUB.pay[uidFor] || { items: [] }; const x = id ? doc.items.find((y) => y.id === id) : null; const P = CLUB.profile;
  const who = forUid && forUid !== me ? (CLUB.members.list.find((m) => m.uid === forUid) || {}).n : "";
  const b = (who ? '<p class="small muted">For ' + esc(who) + "</p>" : "") + '<div class="grid2">' + field("p-d", "Paid on", inp("p-d", x ? x.d : todayIso(), "date", 'max="' + todayIso() + '"')) + field("p-per", "For month", inp("p-per", x ? x.per : thisMonth(), "month")) + "</div>" +
    '<div class="grid2">' + field("p-amt", "Amount (₮)", inp("p-amt", x ? x.amt : (P.fee && P.fee.month) || "", "number", 'inputmode="numeric"')) + field("p-note", "Note", inp("p-note", x ? x.note : "", "text", 'placeholder="cash / transfer"')) + "</div>";
  openSheet(x ? "Edit payment" : "Log a payment", b, { onDelete: x ? async () => { doc.items = doc.items.filter((y) => y.id !== id); CLUB.pay[uidFor] = doc; await cset("club/" + P.id + "/pay/" + uidFor, doc); render(); return true; } : null, async onSave() {
    const rec = x || { id: uid() }; rec.d = sv("p-d") || todayIso(); rec.per = sv("p-per") || thisMonth(); rec.amt = +sv("p-amt") || 0; rec.note = sv("p-note").trim(); rec.by = me;
    if (!x) doc.items.push(rec); CLUB.pay[uidFor] = doc; await cset("club/" + P.id + "/pay/" + uidFor, doc); toast("Payment logged"); render(); return true;
  } });
}
/* ======================= ACTIONS ======================= */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return; const act = el.dataset.act, ds = el.dataset;
  if (act === "sheet-close") { closeSheet(); return; }
  if (act === "sheet-save") { if (UI.sheetSave && UI.sheetSave() !== false) closeSheet(); return; }
  if (act === "sheet-del") { if (armConfirmSheet(el)) { if (UI.sheetDel && UI.sheetDel() !== false) closeSheet(); } return; }
  if (act === "pick") { if (UI.sheet) UI.sheet.picks[ds.group] = ds.group === "rpe" || ds.group === "stripes" ? +ds.v : ds.v; const g = el.closest("[data-group]"); if (g) g.querySelectorAll("[data-act=pick]").forEach((b) => b.classList.toggle("on", b === el)); if (ds.group === "theme") { S.settings.theme = ds.v; applyTheme(); save("settings"); } if (ds.group === "rules") { S.settings.rules = ds.v; save("settings"); } if (ds.group === "beltf") { S.settings.beltFilter = ds.v === "1"; save("settings"); } if (ds.group === "medal" && UI.comp.id) { const ev = S.comp.events.find((x) => x.id === UI.comp.id); if (ev) { ev.medal = ds.v; save("comp"); } } if (ds.group === "track" && UI.sheet) { const sel = $("f-belt"); if (sel) sel.innerHTML = SEED.belts[ds.v].map((x) => '<option value="' + x.id + '">' + esc(x.n) + "</option>").join(""); } return; }
  if (act === "pk-add") { pkAdd(ds.pk, ds.id, ds.n); return; }
  if (act === "pk-inc") { pkChange(ds.pk, +ds.i, 1); return; }
  if (act === "pk-dec") { pkChange(ds.pk, +ds.i, -1); return; }
  if (act === "pk-rm") { pkChange(ds.pk, +ds.i, 0); return; }
  switch (act) {
    case "tab": { const order = TABS.map((t) => t[0]); const anim = order.indexOf(ds.v) > order.indexOf(UI.tab) ? "enter-l" : "enter-r"; UI.tab = ds.v; try { localStorage.setItem("bjj-tab", ds.v); } catch (x) {} go(anim); break; }
    case "settings": settingsSheet(); break;
    case "auth-mode": showLogin("", ds.v === "up"); break;
    case "club-reload": CLUB.loadedFor = null; render(); break;
    case "club-new": clubSheet(false); break;
    case "club-edit": clubSheet(true); break;
    case "club-join": clubJoin(ds.id); break;
    case "club-sess": if (isAdmin()) sessSheet(ds.i != null && ds.i !== "" ? +ds.i : null); break;
    case "club-pay": paySheet(ds.id || null, ds.uid || null); break;
    case "club-admin": if (isAdmin()) { const P = CLUB.profile; P.admins = P.admins || []; const i = P.admins.indexOf(ds.uid); if (i >= 0) P.admins.splice(i, 1); else P.admins.push(ds.uid); cset("club/" + P.id + "/profile", P).then(render); } break;
    case "club-leave": if (UI.confirm === "leave") { UI.confirm = null; clubLeave(); } else { UI.confirm = "leave"; render(); setTimeout(() => { if (UI.confirm === "leave") { UI.confirm = null; render(); } }, 3000); } break;
    case "techview": UI.tech.view = ds.v; UI.rollId = null; render(); break;
    case "segview": UI.seg[UI.tab] = ds.v; render(); break;
    case "clubseg": UI.clubSeg = ds.v; render(); break;
    case "roll-start": rollStart(ds.pos); break;
    case "roll-by": if (UI.roll) { UI.roll.by = ds.v; UI.roll.grp = null; render(); } break;
    case "add-setup": setupEdit(null, ds.pos || null); break;
    case "route-find": UI.route = { from: sv("f-rfrom"), to: sv("f-rto") }; render(); break;
    case "route-save": { const r = (UI.routeList || [])[+ds.i]; if (!r) break; UI.setupEd = { id: null, n: node(r[0].id).n + " → " + node(r[r.length - 1].id).n, x: "", steps: r.map((s) => ({ id: s.id, k: s.k, n: s.n, t: s.t || "" })) }; UI.tech.id = null; render(); break; }
    case "learn-start": learnStart(); break;
    case "learn-pick": learnPick(+ds.i); break;
    case "learn-next": learnNext(); break;
    case "learn-stop": UI.learn = null; render(); break;
    case "edit-setup": setupEdit(ds.id); break;
    case "setup-roll": { const sp = setupById(ds.id); if (sp && sp.steps[0]) { rollStart(sp.steps[0].id); UI.roll.plan = sp.id; render(); } break; }
    case "setup-step": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn"); E.x = sv("f-sx"); const n = node(ds.id); if (n) E.steps.push({ id: n.id, k: n.k, n: n.n, t: n.t || "" }); render(); break; }
    case "setup-undo": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn"); E.x = sv("f-sx"); E.steps.pop(); render(); break; }
    case "setup-cancel": UI.setupEd = null; render(); break;
    case "setup-del": { const E = UI.setupEd; if (E && E.id && armConfirm("setup:" + E.id)) { S.plans.setups = S.plans.setups.filter((x) => x.id !== E.id); save("plans"); UI.setupEd = null; toast("Deleted"); } render(); break; }
    case "setup-save": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn").trim(); E.x = sv("f-sx").trim(); if (E.steps.length < 2) { toast("Add at least one move"); break; } const rec = { id: E.id || uid(), n: E.n || setupName(E.steps), steps: E.steps, x: E.x }; const i = S.plans.setups.findIndex((x) => x.id === rec.id); if (i >= 0) S.plans.setups[i] = rec; else S.plans.setups.push(rec); save("plans"); UI.setupEd = null; UI.tech.view = "setups"; toast("Setup saved"); render(); break; }
    case "walk-phase": UI.walkCat = UI.walkCat === ds.cat && !UI.roll ? null : ds.cat; render(); break;
    case "walk-pos": if (UI.roll) rollGoto(ds.id, "gap"); else rollStart(ds.id); break;
    case "roll-pick": rollPick(ds.id); break;
    case "roll-goto": rollGoto(ds.pos, "worked"); break;
    case "roll-other": rollOtherSheet(); break;
    case "roll-rewind": rollRewind(+ds.i); break;
    case "roll-undo": if (UI.roll && UI.roll.steps.length > 1) { UI.roll.steps.pop(); const last = UI.roll.steps[UI.roll.steps.length - 1]; UI.roll.cur = last.id; const lp = UI.roll.steps.slice().reverse().find((x) => x.k === "pos"); UI.roll.pos = lp ? lp.id : UI.roll.pos; render(); } break;
    case "roll-finish": UI.roll.finished = true; rollEndSheet(true); break;
    case "roll-end": rollEndSheet(false); break;
    case "roll-cancel": if (armConfirm("roll-cancel")) { UI.roll = null; render(); } break;
    case "roll-open": UI.rollId = ds.id; go("enter-l"); break;
    case "roll-close": UI.rollId = null; go("enter-r"); break;
    case "roll-del": if (armConfirm(ds.key)) { S.rolls.items = S.rolls.items.filter((x) => x.id !== ds.id); UI.rollId = null; save("rolls"); go("enter-r"); } break;
    case "techmap": UI.tech.map = ds.v === "map"; try { localStorage.setItem("bjj-map", UI.tech.map ? "1" : "0"); } catch (x) {} render(); break;
    case "open": UI.tab = "tech"; UI.tech.id = ds.id; UI.tech.q = ""; UI.rollId = null; { const g = UI.graph["n:" + ds.id]; if (g) g.sel = null; } go("enter-l"); break;
    case "back": UI.tech.id = ds.id || null; go("enter-r"); break;
    case "add-node": nodeSheet(null, ds.p || null); break;
    case "add-entry": entrySheet(ds.id); break;
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
    case "edit-promo": promoSheet(ds.id); break;
    case "edit-weight": weightSheet(ds.id); break;
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
  if (t.id === "tq") { UI.tech.q = t.value; const m = $("main"); const h = VIEWS.tech(); m.innerHTML = h; initGraphs(); const q = $("tq"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
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
