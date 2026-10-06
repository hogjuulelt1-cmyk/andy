/* Console for app admins and club coaches. Same Supabase project as the app. App admins (config.js → admins,
   or app/config.admins) see every club; a coach (listed in a club's profile.admins) sees their own club. */
(function () {
"use strict";
const CFG = window.APP_CONFIG || {}; const SEED = window.BJJ_SEED || { belts: { kids: [], adult: [] } };
const MEMBER_DOMAIN = CFG.memberDomain || "member.bjjclub.mn";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const todayIso = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const thisMonth = () => todayIso().slice(0, 7);
const money = (v) => (+v || 0).toLocaleString("en-US") + "₮";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const monthsSince = (iso) => { if (!iso) return 0; const a = new Date(iso + "T12:00:00"), b = new Date(); return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()); };
const MIN_MONTHS = { white: 12, blue: 24, purple: 18, brown: 12, black: 0 }; // adult IBJJF minimums (white: common club practice)
const BELT_COLOR = { white: "#f4f4f6", blue: "#1f5fd6", purple: "#7a3fc4", brown: "#7a4a1f", black: "#111114" };
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400); }
function emailOf(login) { login = String(login || "").trim().toLowerCase(); return login.includes("@") ? login : login.replace(/[^a-z0-9._-]/g, "") + "@" + MEMBER_DOMAIN; }
function beltDef(track, id) { return (SEED.belts[track] || []).find((b) => b.id === id) || (SEED.belts.adult || []).find((b) => b.id === id) || { n: id, c: BELT_COLOR[id] || "#999" }; }

const SB = {
  url: (CFG.supabaseUrl || "").replace(/\/$/, ""), key: CFG.supabaseAnonKey || "", session: null,
  load() { try { this.session = JSON.parse(localStorage.getItem("cb-sb-session") || "null"); } catch (e) { this.session = null; } },
  store(s) { this.session = s; try { s ? localStorage.setItem("cb-sb-session", JSON.stringify(s)) : localStorage.removeItem("cb-sb-session"); } catch (e) {} },
  async auth(body, grant) { const r = await fetch(this.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || "auth"); this.store({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id }); return this.session; },
  uid() { const s = this.session; if (s && !s.uid && s.access) { try { s.uid = JSON.parse(atob(s.access.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) {} } return s ? s.uid || "" : ""; },
  async token() { if (!this.session) throw new Error("noauth"); if (Date.now() > this.session.exp - 60000) { try { await this.auth({ refresh_token: this.session.refresh }, "refresh_token"); } catch (e) { this.store(null); throw new Error("noauth"); } } return this.session.access; },
  async req(path, opt) { opt = opt || {}; const t = await this.token(); const r = await fetch(this.url + path, Object.assign({}, opt, { headers: Object.assign({ apikey: this.key, Authorization: "Bearer " + t }, opt.headers || {}) })); if (r.status === 401) { this.store(null); throw new Error("noauth"); } if (!r.ok) throw new Error("http " + r.status); return r; },
  async get(path) { const r = await this.req("/rest/v1/docs?select=data&path=eq." + encodeURIComponent(path)); const rows = await r.json(); return rows.length ? rows[0].data : null; },
  async list(prefix) { const r = await this.req("/rest/v1/docs?select=path,data,updated_at&path=like." + encodeURIComponent(prefix + "*")); return r.json(); },
  set(path, data) { return this.req("/rest/v1/docs", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, data, updated_at: new Date().toISOString() }) }); },
  // creates a login for someone else; the returned session is ignored so the admin stays signed in
  async createUser(email, password, name) { const r = await fetch(this.url + "/auth/v1/signup", { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { name } }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "signup"); const id = (j.user && j.user.id) || j.id; if (!id) throw new Error("no user id"); return { id, confirmed: !!j.access_token }; },
};

const D = { clubs: [], members: {}, pay: {}, att: {}, results: {}, events: {}, index: null, app: null, pro: null, upgrades: null };
const UI = { page: "overview", q: "", club: "", role: "", memF: "all" };
/* Mongolian by default; translated in the DOM like the app. */
const I18N = { lang: "mn", obs: null,
  pack() { return (window.BJJ_LANG || {})[this.lang]; },
  one(k) { const p = this.pack(); const d = p.dict[k]; if (d != null) return d; for (const r of p.rules) if (r[0].test(k)) { const o = k.replace(r[0], r[1]); if (o !== k) return o; } return null; },
  tr(t) { if (!this.pack()) return t; const k = t.trim(); if (!k) return t; let o = this.one(k); if (o == null && k.includes(" · ")) { const parts = k.split(" · ").map((x) => { const y = this.one(x); return y == null ? x : y; }); o = parts.join(" · "); if (o === k) o = null; } return o == null ? t : t.replace(k, o); },
  node(n) { if (n.nodeType === 3) { const v = n.nodeValue; if (n.__i === v) return; const o = this.tr(v); if (o !== v) { n.nodeValue = o; n.__i = o; } else n.__i = v; return; } if (n.nodeType !== 1 || n.tagName === "SCRIPT" || n.tagName === "STYLE") return; const els = [n, ...n.querySelectorAll("[placeholder],[title]")]; for (const e of els) for (const at of ["placeholder", "title"]) { const v = e.getAttribute && e.getAttribute(at); if (v) { const o = this.tr(v); if (o !== v) e.setAttribute(at, o); } } const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) this.node(t); },
  start() { if (this.obs) return; this.node(document.body); document.documentElement.lang = "mn"; this.obs = new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") this.node(m.target); else for (const x of m.addedNodes) this.node(x); } }); this.obs.observe(document.body, { childList: true, subtree: true, characterData: true }); },
  stop() { if (this.obs) { this.obs.disconnect(); this.obs = null; } document.documentElement.lang = "en"; },
  set(l) { this.lang = l; try { localStorage.setItem("bjj-lang", l); } catch (e) {} if (l === "mn") this.start(); else this.stop(); },
};
try { I18N.lang = localStorage.getItem("bjj-lang") === "en" ? "en" : "mn"; } catch (e) {}
if (I18N.lang === "mn") I18N.start();

function isSuper() { const em = (SB.session && SB.session.email || "").toLowerCase(); return (CFG.admins || []).concat((D.app && D.app.admins) || []).map((x) => String(x).toLowerCase()).includes(em); }
function myClubs() { return D.clubs.filter((c) => (c.admins || []).includes(SB.uid())); }
function visibleClubs() { return UI.role === "super" ? D.clubs.filter((c) => c.status !== "rejected") : myClubs(); }
function clubsInScope() { const v = visibleClubs(); return UI.club ? v.filter((c) => c.id === UI.club) : v; }
async function loadAll() {
  D.app = (await SB.get("app/config")) || { admins: [], pay: {}, pro: {} };
  const rows = await SB.list("club/"); D.clubs = []; D.members = {}; D.pay = {}; D.att = {}; D.results = {}; D.events = {};
  for (const r of rows) { const [, id, kind, rest] = r.path.split("/"); if (kind === "profile") D.clubs.push(r.data); else if (kind === "members") D.members[id] = r.data; else if (kind === "pay") (D.pay[id] = D.pay[id] || {})[rest] = r.data; else if (kind === "att" && rest === thisMonth()) D.att[id] = r.data; else if (kind === "results") D.results[id] = r.data; else if (kind === "events") D.events[id] = r.data; }
  D.clubs.sort((a, b) => String(a.n).localeCompare(String(b.n)));
  UI.role = isSuper() ? "super" : myClubs().length ? "coach" : "";
  if (UI.role === "coach") { UI.club = UI.club || myClubs()[0].id; if (!["overview", "members", "payments", "results"].includes(UI.page)) UI.page = "overview"; }
  if (UI.role === "super") { D.index = (await SB.get("clubs/index")) || { list: [] }; D.pro = (await SB.get("app/pro")) || { u: {} }; D.upgrades = (await SB.get("app/upgrades")) || { list: [] }; }
  return !!UI.role;
}
function membership(clubId, key) { const p = (D.pay[clubId] || {})[key]; const ok = p ? p.items.filter((x) => x.status !== "pending").map((x) => x.per).sort() : []; const last = ok[ok.length - 1]; if (!last) return { state: "none", text: "never paid" }; const y = +last.slice(0, 4), m = +last.slice(5); const end = new Date(y, m, 0); const days = Math.round((end - new Date(todayIso() + "T12:00:00")) / 86400000); return days >= 0 ? { state: "active", text: "paid until " + last, days } : { state: "expired", text: "expired after " + last, days }; }
function pendingOf(clubId, key) { const p = (D.pay[clubId] || {})[key]; return p ? p.items.filter((x) => x.status === "pending") : []; }
function pendingPays(clubId) { const out = []; for (const k in D.pay[clubId] || {}) for (const x of D.pay[clubId][k].items) if (x.status === "pending") out.push(Object.assign({ who: k }, x)); return out; }
function memberName(clubId, key) { const m = ((D.members[clubId] || {}).list || []).find((x) => x.uid === key || x.id === key); return m ? m.n || m.email || key : key; }
function attCount(clubId, key) { const doc = D.att[clubId]; if (!doc) return 0; let n = 0; for (const d in doc.days) if (doc.days[d].includes(key)) n++; return n; }
function medalsOf(clubId, m) { return ((D.results[clubId] || {}).list || []).filter((r) => (r.uid && r.uid === m.uid) || r.mid === m.id); }
function progress(m) { const b = (m.belt || "white").split("-")[0]; const need = m.track === "kids" ? 12 : MIN_MONTHS[b] || 0; const have = monthsSince(m.beltSince); return { have, need, pct: need ? Math.min(100, Math.round((have / need) * 100)) : 0 }; }

function render() {
  const root = $("root");
  if (!SB.session) { root.innerHTML = '<form id="login" class="card"><h1>Coach & admin console</h1><p class="muted small">Sign in with your app account. Coaches see their club, app admins see everything.</p><label class="field">Email or username<input id="e" type="text" autocomplete="username" required></label><label class="field">Password<input id="p" type="password" autocomplete="current-password" required></label><button class="btn" type="submit">Sign in</button><p id="err" class="small" style="color:var(--bad)"></p></form>'; $("login").addEventListener("submit", async (e) => { e.preventDefault(); try { await SB.auth({ email: emailOf($("e").value), password: $("p").value }, "password"); boot(); } catch (err) { $("err").textContent = "Wrong email or password."; } }); return; }
  if (!UI.role) { root.innerHTML = '<div id="login" class="card"><h1>No console for this account</h1><p class="small">' + esc(SB.session.email) + ' is not an app admin and is not a coach of any club. Coaches claim their club in the app with the coach code.</p><button class="btn ghost" id="out">Sign out</button></div>'; $("out").onclick = () => { SB.store(null); render(); }; return; }
  const pages = UI.role === "super" ? [["overview", "Overview"], ["clubs", "Clubs"], ["members", "Members"], ["payments", "Payments"], ["results", "Competitions"], ["upgrades", "Upgrades"], ["settings", "Settings"]] : [["overview", "My club"], ["members", "Members"], ["payments", "Payments"], ["results", "Competitions"]];
  let h = '<div class="app"><aside><h1>' + (UI.role === "super" ? "Admin" : "Coach") + "</h1>" + pages.map((p) => '<button data-page="' + p[0] + '"' + (UI.page === p[0] ? ' aria-current="page"' : "") + ">" + p[1] + "</button>").join("") + '<div class="who">' + esc(SB.session.email) + (UI.role === "coach" ? "<br>" + esc(myClubs().map((c) => c.n).join(", ")) : "") + '<br><button class="btn ghost" id="reload" style="margin-top:8px">Refresh</button> <button class="btn ghost" id="out">Sign out</button> <button class="btn ghost" id="lang" style="margin-top:8px">' + (I18N.lang === "mn" ? "English" : "Монгол") + "</button></div></aside><main>";
  h += { overview: vOverview, clubs: vClubs, members: vMembers, payments: vPayments, results: vResults, upgrades: vUpgrades, settings: vSettings }[UI.page]();
  h += "</main></div>";
  root.innerHTML = h;
  root.querySelectorAll("[data-page]").forEach((b) => (b.onclick = () => { UI.page = b.dataset.page; render(); }));
  $("out").onclick = () => { SB.store(null); render(); }; $("reload").onclick = () => boot(); $("lang").onclick = () => { I18N.set(I18N.lang === "mn" ? "en" : "mn"); render(); };
  const q = $("q"); if (q) q.oninput = () => { UI.q = q.value; render(); const q2 = $("q"); q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); };
  const cs = $("club-sel"); if (cs) cs.onchange = () => { UI.club = cs.value; render(); };
  const sf = $("settings-form"); if (sf) sf.addEventListener("submit", saveSettings);
  root.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => act(b.dataset)));
}
function clubSelect(all) { const v = visibleClubs(); if (v.length < 2) return ""; return '<select id="club-sel">' + (all ? '<option value="">All clubs</option>' : "") + v.map((c) => '<option value="' + c.id + '"' + (UI.club === c.id ? " selected" : "") + ">" + esc(c.n) + "</option>").join("") + "</select>"; }
function vOverview() {
  const clubs = clubsInScope(); let members = 0, active = 0, pend = 0, linked = 0, comp = 0, att = 0;
  for (const c of clubs) { const ms = ((D.members[c.id] || {}).list || []); members += ms.length; linked += ms.filter((m) => m.uid).length; comp += ms.filter((m) => m.comp).length; for (const m of ms) if (membership(c.id, m.uid || m.id).state === "active") active++; pend += pendingPays(c.id).length; if (D.att[c.id]) att += Object.keys(D.att[c.id].days).length; }
  let h = '<div class="head"><h2>' + (UI.role === "super" ? "Overview" : esc(clubs[0] ? clubs[0].n : "My club")) + " · " + thisMonth() + "</h2>" + clubSelect(UI.role === "super") + "</div>";
  const stats = [["Members", members], ["With a login", linked], ["Active memberships", active], ["Payments to confirm", pend], ["Training days this month", att], ["Competition team", comp]];
  if (UI.role === "super") stats.unshift(["Clubs", clubs.length]), stats.push(["Clubs to approve", D.clubs.filter((c) => c.status === "pending").length], ["Upgrade requests", (D.upgrades.list || []).filter((u) => u.status === "pending").length]);
  h += '<div class="cards">' + stats.map((s) => '<div class="stat"><b>' + s[1] + "</b><span>" + s[0] + "</span></div>").join("") + "</div>";
  const todo = [];
  for (const c of clubs) for (const x of pendingPays(c.id)) todo.push('<tr><td><span class="pill warn">payment</span></td><td>' + esc(memberName(c.id, x.who)) + " · " + esc(x.per) + " · " + money(x.amt) + (x.note ? " · " + esc(x.note) : "") + (UI.role === "super" ? " · " + esc(c.n) : "") + '</td><td><button class="btn" data-act="pay-ok" data-club="' + c.id + '" data-who="' + x.who + '" data-id="' + x.id + '">Confirm</button></td></tr>');
  for (const c of clubs) for (const r of ((D.results[c.id] || {}).list || []).filter((x) => x.status !== "ok")) todo.push('<tr><td><span class="pill warn">medal</span></td><td>' + esc(r.n) + " · " + esc(r.medal) + " · " + esc(r.event) + '</td><td><button class="btn" data-act="res-ok" data-club="' + c.id + '" data-id="' + r.id + '">Approve</button> <button class="btn danger" data-act="res-no" data-club="' + c.id + '" data-id="' + r.id + '">Reject</button></td></tr>');
  if (UI.role === "super") { for (const c of D.clubs.filter((x) => x.status === "pending")) todo.push('<tr><td><span class="pill warn">club</span></td><td>' + esc(c.n) + " · " + esc(c.city || "") + '</td><td><button class="btn" data-act="club-approve" data-id="' + c.id + '">Approve</button> <button class="btn danger" data-act="club-reject" data-id="' + c.id + '">Reject</button></td></tr>'); for (const u of (D.upgrades.list || []).filter((x) => x.status === "pending")) todo.push('<tr><td><span class="pill warn">upgrade</span></td><td>' + esc(u.n || u.email) + " · " + esc(u.d) + '</td><td><button class="btn" data-act="up-ok" data-id="' + u.id + '" data-m="1">1 month</button> <button class="btn ghost" data-act="up-ok" data-id="' + u.id + '" data-m="12">1 year</button> <button class="btn danger" data-act="up-no" data-id="' + u.id + '">Reject</button></td></tr>'); }
  h += '<div class="card"><div class="head"><h3>Needs you</h3><span class="muted small">' + todo.length + "</span></div>" + (todo.length ? "<table><tbody>" + todo.join("") + "</tbody></table>" : '<p class="empty">Nothing waiting.</p>') + "</div>";
  if (UI.role === "super") h += '<div class="card"><div class="head"><h3>Clubs at a glance</h3></div><table><thead><tr><th>Club</th><th>Status</th><th>Members</th><th>Active</th><th>Days this month</th><th>To confirm</th><th>Coach</th></tr></thead><tbody>' + clubs.map((c) => { const ms = ((D.members[c.id] || {}).list || []); const act = ms.filter((m) => membership(c.id, m.uid || m.id).state === "active").length; const a = D.att[c.id] ? Object.keys(D.att[c.id].days).length : 0; return "<tr><td><b>" + esc(c.n) + "</b><br><span class='muted small'>" + esc(c.city || "") + '</span></td><td><span class="pill ' + (c.status === "pending" ? "warn" : "ok") + '">' + esc(c.status || "approved") + (c.open ? " · open" : "") + "</span></td><td>" + ms.length + "</td><td>" + act + "</td><td>" + a + "</td><td>" + pendingPays(c.id).length + "</td><td>" + esc(c.coach || "—") + ((c.admins || []).length ? "" : ' <span class="pill bad">unclaimed</span>') + "</td></tr>"; }).join("") + "</tbody></table></div>";
  else { const c = clubs[0]; const evs = ((D.events[c.id] || {}).list || []).filter((e) => e.d >= todayIso()).sort((a, b) => (a.d < b.d ? -1 : 1)); h += '<div class="card"><div class="head"><h3>Club</h3></div><p class="small">Member code <code>' + esc(c.code || "—") + "</code> · coach code <code>" + esc(c.coachCode || "—") + "</code><br><span class='muted'>Fee " + money(c.fee && c.fee.month) + " · " + (c.schedule || []).length + " classes a week · " + (c.schedule || []).filter((x) => x.kind === "open").length + " open mats</span></p>" + (evs.length ? "<h3>Next competitions</h3><table><tbody>" + evs.map((e) => "<tr><td>" + esc(e.d) + "</td><td><b>" + esc(e.n) + "</b> " + esc(e.place || "") + "</td><td class='muted small'>" + ((D.members[c.id] || {}).list || []).filter((m) => m.comp).length + " on the team</td></tr>").join("") + "</tbody></table>" : "") + "</div>"; }
  return h;
}
function vClubs() {
  let h = '<div class="head"><h2>Clubs</h2><input id="q" type="search" placeholder="Search clubs…" value="' + esc(UI.q) + '"></div>';
  const q = UI.q.toLowerCase(); const clubs = D.clubs.filter((c) => !q || (c.n + " " + (c.city || "") + " " + (c.coach || "")).toLowerCase().includes(q));
  h += '<div class="card"><table><thead><tr><th>Club</th><th>Status</th><th>Codes</th><th>Fees</th><th>Classes</th><th>Payment details</th><th></th></tr></thead><tbody>' + clubs.map((c) => "<tr><td><b>" + esc(c.n) + "</b><br><span class='muted small'>" + esc([c.city, c.addr, c.phone].filter(Boolean).join(" · ")) + '</span></td><td><span class="pill ' + (c.status === "pending" ? "warn" : c.status === "rejected" ? "bad" : "ok") + '">' + esc(c.status || "approved") + "</span>" + (c.open ? '<br><span class="pill">open to join</span>' : "") + "</td><td>member <code>" + esc(c.code || "—") + "</code><br>coach <code>" + esc(c.coachCode || "—") + "</code></td><td>" + money(c.fee && c.fee.month) + "<br><span class='muted small'>drop-in " + money(c.fee && c.fee.drop) + "</span></td><td>" + ((c.schedule || []).length) + "<br><span class='muted small'>" + (c.schedule || []).filter((x) => x.kind === "open").length + " open mats</span></td><td class='small'>" + esc([(c.pay || {}).bank, (c.pay || {}).account, (c.pay || {}).qpay].filter(Boolean).join(" · ") || "—") + "</td><td>" + (c.status === "pending" ? '<button class="btn" data-act="club-approve" data-id="' + c.id + '">Approve</button> ' : "") + (c.status !== "rejected" ? '<button class="btn danger" data-act="club-reject" data-id="' + c.id + '">' + (c.status === "pending" ? "Reject" : "Remove") + "</button>" : '<button class="btn ghost" data-act="club-approve" data-id="' + c.id + '">Restore</button>') + "</td></tr>").join("") + "</tbody></table></div>";
  return h;
}
function vMembers() {
  const clubs = clubsInScope(); const f = UI.memF;
  let h = '<div class="head"><h2>Members</h2><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + clubSelect(UI.role === "super") + '<input id="q" type="search" placeholder="Name, email or username…" value="' + esc(UI.q) + '">' + (clubs.length === 1 || UI.club ? '<button class="btn" data-act="member-add" data-club="' + (UI.club || clubs[0].id) + '">+ Add a member</button>' : "") + "</div></div>";
  h += '<div class="tabs">' + [["all", "All"], ["active", "Paid"], ["due", "Fee due"], ["pending", "To confirm"], ["kids", "Kids"], ["adult", "Adults"], ["comp", "Competition team"], ["nologin", "No login"], ["ready", "Ready to promote"]].map((t) => '<button class="' + (f === t[0] ? "on" : "") + '" data-act="memf" data-v="' + t[0] + '">' + t[1] + "</button>").join("") + "</div>";
  const q = UI.q.toLowerCase(); const rows = [];
  for (const c of clubs) for (const m of ((D.members[c.id] || {}).list || [])) {
    if (q && !((m.n || "") + " " + (m.email || "")).toLowerCase().includes(q)) continue; const key = m.uid || m.id; const ms = membership(c.id, key); const pend = pendingOf(c.id, key); const pr = progress(m);
    if (f === "active" && ms.state !== "active") continue; if (f === "due" && ms.state === "active") continue; if (f === "pending" && !pend.length) continue; if (f === "kids" && m.track !== "kids") continue; if (f === "adult" && m.track === "kids") continue; if (f === "comp" && !m.comp) continue; if (f === "nologin" && m.uid) continue; if (f === "ready" && !(pr.need && pr.have >= pr.need)) continue;
    const medals = medalsOf(c.id, m).filter((r) => r.status === "ok"); const bd = beltDef(m.track || "adult", m.belt || "white");
    rows.push("<tr><td><b>" + esc(m.n || m.email || "Member") + "</b>" + (m.comp ? ' <span class="pill ok">comp team</span>' : "") + ((c.admins || []).includes(m.uid) ? ' <span class="pill">coach</span>' : "") + "<br><span class='muted small'>" + esc((m.email || "").replace("@" + MEMBER_DOMAIN, "")) + (m.phone ? " · " + esc(m.phone) : "") + "</span></td>" + (UI.role === "super" && !UI.club ? "<td>" + esc(c.n) + "</td>" : "") +
      '<td><span class="sw" style="background:' + esc(bd.c || "#999") + '"></span>' + esc(bd.n) + (m.stripes ? " · " + m.stripes + " str" : "") + "<br><span class='muted small'>" + (m.track === "kids" ? "kids" : "adult") + (m.beltSince ? " · " + pr.have + " mo" : "") + "</span></td>" +
      "<td>" + (pr.need ? '<div class="bar' + (pr.have >= pr.need ? " full" : "") + '"><i style="width:' + pr.pct + '%"></i></div><span class="muted small">' + pr.have + " / " + pr.need + " months</span>" : '<span class="muted small">—</span>') + "</td>" +
      '<td><span class="pill ' + (ms.state === "active" ? "ok" : ms.state === "expired" ? "bad" : "") + '">' + esc(ms.text) + "</span>" + (pend.length ? '<br><button class="btn" style="margin-top:4px" data-act="pay-ok" data-club="' + c.id + '" data-who="' + key + '" data-id="' + pend[0].id + '">Confirm ' + esc(pend[0].per) + "</button>" : "") + "</td>" +
      "<td>" + attCount(c.id, key) + "</td><td>" + (medals.length ? medals.map((r) => '<span title="' + esc(r.event) + '">' + (r.medal === "gold" ? "🥇" : r.medal === "silver" ? "🥈" : "🥉") + "</span>").join("") : "") + "</td>" +
      "<td>" + (m.uid ? '<span class="pill ok">login</span>' : '<span class="pill warn">no login</span>') + '</td><td><div class="row-actions"><button class="btn ghost" data-act="member-edit" data-club="' + c.id + '" data-id="' + m.id + '">Edit</button><button class="btn ghost" data-act="pay-log" data-club="' + c.id + '" data-who="' + key + '">Log fee</button><button class="btn ghost" data-act="result-add" data-club="' + c.id + '" data-id="' + m.id + '">Result</button><button class="btn ghost" data-act="comp-toggle" data-club="' + c.id + '" data-id="' + m.id + '">' + (m.comp ? "Off team" : "Comp team") + "</button></div></td></tr>");
  }
  h += '<div class="card"><table><thead><tr><th>Member</th>' + (UI.role === "super" && !UI.club ? "<th>Club</th>" : "") + '<th>Belt</th><th>Time at belt</th><th>Membership</th><th>Days this month</th><th>Medals</th><th>Login</th><th></th></tr></thead><tbody>' + (rows.join("") || '<tr><td colspan="9" class="empty">No members match.</td></tr>') + "</tbody></table><p class='muted small'>" + rows.length + " members</p></div>";
  return h;
}
function vPayments() {
  const clubs = clubsInScope(); let h = '<div class="head"><h2>Payments</h2>' + clubSelect(UI.role === "super") + "</div>";
  const pend = [], recent = [];
  for (const c of clubs) for (const k in D.pay[c.id] || {}) for (const x of D.pay[c.id][k].items) (x.status === "pending" ? pend : recent).push(Object.assign({ club: c, who: k }, x));
  recent.sort((a, b) => (a.d < b.d ? 1 : -1));
  const row = (x, a) => "<tr><td>" + esc(x.d) + "</td><td><b>" + esc(memberName(x.club.id, x.who)) + "</b></td>" + (UI.role === "super" ? "<td>" + esc(x.club.n) + "</td>" : "") + "<td>" + esc(x.per) + "</td><td>" + money(x.amt) + "</td><td class='muted small'>" + esc(x.note || "") + "</td><td>" + (a ? '<button class="btn" data-act="pay-ok" data-club="' + x.club.id + '" data-who="' + x.who + '" data-id="' + x.id + '">Confirm</button>' : '<span class="pill ok">confirmed</span>') + "</td></tr>";
  const th = '<thead><tr><th>Date</th><th>Member</th>' + (UI.role === "super" ? "<th>Club</th>" : "") + "<th>Month</th><th>Amount</th><th>Note</th><th></th></tr></thead>";
  h += '<div class="card"><div class="head"><h3>Waiting for confirmation</h3><span class="muted small">' + pend.length + "</span></div>" + (pend.length ? "<table>" + th + "<tbody>" + pend.map((x) => row(x, true)).join("") + "</tbody></table>" : '<p class="empty">Nothing pending.</p>') + "</div>";
  const sum = recent.filter((x) => x.per === thisMonth()).reduce((a, x) => a + (+x.amt || 0), 0);
  h += '<div class="card"><div class="head"><h3>Confirmed</h3><span class="muted small">' + money(sum) + " for " + thisMonth() + "</span></div>" + (recent.length ? "<table>" + th + "<tbody>" + recent.slice(0, 150).map((x) => row(x, false)).join("") + "</tbody></table>" : '<p class="empty">No confirmed payments yet.</p>') + "</div>";
  return h;
}
function vResults() {
  const clubs = clubsInScope(); let h = '<div class="head"><h2>Competitions</h2><div style="display:flex;gap:8px;flex-wrap:wrap">' + clubSelect(UI.role === "super") + (clubs.length === 1 || UI.club ? '<button class="btn" data-act="result-add" data-club="' + (UI.club || clubs[0].id) + '">+ Record a result</button><button class="btn ghost" data-act="event-add" data-club="' + (UI.club || clubs[0].id) + '">+ Upcoming competition</button>' : "") + "</div></div>";
  const list = []; for (const c of clubs) for (const r of ((D.results[c.id] || {}).list || [])) list.push(Object.assign({ club: c }, r)); list.sort((a, b) => (a.d < b.d ? 1 : -1));
  const evs = []; for (const c of clubs) for (const e of ((D.events[c.id] || {}).list || [])) evs.push(Object.assign({ club: c }, e)); evs.sort((a, b) => (a.d < b.d ? -1 : 1));
  const team = []; for (const c of clubs) for (const m of ((D.members[c.id] || {}).list || [])) if (m.comp) team.push(Object.assign({ club: c }, m));
  h += '<div class="card"><div class="head"><h3>Competition team</h3><span class="muted small">' + team.length + "</span></div>" + (team.length ? '<table><thead><tr><th>Athlete</th><th>Belt</th><th>Days this month</th><th>Medals</th><th></th></tr></thead><tbody>' + team.map((m) => "<tr><td><b>" + esc(m.n) + "</b>" + (UI.role === "super" ? " <span class='muted small'>" + esc(m.club.n) + "</span>" : "") + "</td><td>" + esc(m.belt || "white") + "</td><td>" + attCount(m.club.id, m.uid || m.id) + "</td><td>" + medalsOf(m.club.id, m).filter((r) => r.status === "ok").length + '</td><td><button class="btn ghost" data-act="comp-toggle" data-club="' + m.club.id + '" data-id="' + m.id + '">Off team</button></td></tr>').join("") + "</tbody></table>" : '<p class="empty">Mark athletes as “Comp team” on the Members page.</p>') + "</div>";
  h += '<div class="card"><div class="head"><h3>Upcoming</h3></div>' + (evs.filter((e) => e.d >= todayIso()).length ? '<table><thead><tr><th>Date</th><th>Competition</th><th>Where</th><th>Register by</th></tr></thead><tbody>' + evs.filter((e) => e.d >= todayIso()).map((e) => "<tr><td>" + esc(e.d) + "</td><td><b>" + esc(e.n) + "</b>" + (e.url ? ' <a href="' + esc(e.url) + '" target="_blank" rel="noopener">info</a>' : "") + "</td><td>" + esc(e.place || "") + "</td><td>" + esc(e.deadline || "") + "</td></tr>").join("") + "</tbody></table>" : '<p class="empty">No competition announced.</p>') + "</div>";
  h += '<div class="card"><div class="head"><h3>Results</h3><span class="muted small">' + list.filter((r) => r.status === "ok").length + " approved</span></div>" + (list.length ? '<table><thead><tr><th>Date</th><th>Athlete</th><th>Competition</th><th>Division</th><th>Medal</th><th>Status</th><th></th></tr></thead><tbody>' + list.map((r) => "<tr><td>" + esc(r.d) + "</td><td><b>" + esc(r.n) + "</b></td><td>" + esc(r.event) + "</td><td class='muted small'>" + esc(r.div || "") + "</td><td>" + (r.medal === "gold" ? "🥇 Gold" : r.medal === "silver" ? "🥈 Silver" : r.medal === "bronze" ? "🥉 Bronze" : esc(r.medal || "took part")) + '</td><td><span class="pill ' + (r.status === "ok" ? "ok" : "warn") + '">' + (r.status === "ok" ? "approved" : "waiting") + "</span></td><td>" + (r.status !== "ok" ? '<button class="btn" data-act="res-ok" data-club="' + r.club.id + '" data-id="' + r.id + '">Approve</button> ' : "") + '<button class="btn danger" data-act="res-no" data-club="' + r.club.id + '" data-id="' + r.id + '">Delete</button></td></tr>').join("") + "</tbody></table>" : '<p class="empty">No results yet.</p>') + "</div>";
  return h;
}
function vUpgrades() {
  const list = (D.upgrades.list || []).slice().sort((a, b) => (a.d < b.d ? 1 : -1)); const pro = Object.keys(D.pro.u || {}).map((k) => Object.assign({ uid: k }, D.pro.u[k])).sort((a, b) => (a.until < b.until ? 1 : -1));
  let h = '<div class="head"><h2>Upgrades</h2><span class="muted small">price ' + money(D.app.pro && D.app.pro.price) + " / month</span></div>";
  h += '<div class="card"><div class="head"><h3>Requests</h3></div>' + (list.length ? '<table><thead><tr><th>Date</th><th>Who</th><th>Note</th><th>Status</th><th></th></tr></thead><tbody>' + list.map((u) => "<tr><td>" + esc(u.d) + "</td><td><b>" + esc(u.n || "") + "</b><br><span class='muted small'>" + esc(u.email || u.uid) + "</span></td><td class='small'>" + esc(u.note || "") + '</td><td><span class="pill ' + (u.status === "ok" ? "ok" : u.status === "no" ? "bad" : "warn") + '">' + esc(u.status === "ok" ? "until " + u.until : u.status === "no" ? "rejected" : "pending") + "</span></td><td>" + (u.status === "pending" ? '<button class="btn" data-act="up-ok" data-id="' + u.id + '" data-m="1">1 month</button> <button class="btn ghost" data-act="up-ok" data-id="' + u.id + '" data-m="12">1 year</button> <button class="btn danger" data-act="up-no" data-id="' + u.id + '">Reject</button>' : "") + "</td></tr>").join("") + "</tbody></table>" : '<p class="empty">No requests yet.</p>') + "</div>";
  h += '<div class="card"><div class="head"><h3>Upgraded users</h3><span class="muted small">' + pro.filter((p) => p.until >= thisMonth()).length + " active</span></div>" + (pro.length ? '<table><thead><tr><th>Who</th><th>Until</th><th>Via</th></tr></thead><tbody>' + pro.map((p) => "<tr><td>" + esc(p.n || p.uid) + '</td><td><span class="pill ' + (p.until >= thisMonth() ? "ok" : "bad") + '">' + esc(p.until) + "</span></td><td class='muted small'>" + esc(p.via || "transfer") + "</td></tr>").join("") + "</tbody></table>" : '<p class="empty">Nobody upgraded yet.</p>') + "</div>";
  return h;
}
function vSettings() {
  const A = D.app || {}; const p = A.pay || {};
  return '<div class="head"><h2>Settings</h2></div><form class="card" id="settings-form"><div class="grid"><label class="field">Upgrade price / month (₮)<input name="price" type="number" value="' + esc((A.pro && A.pro.price) || "") + '"></label><label class="field">Store product id<input name="product" type="text" value="' + esc((A.pro && A.pro.product) || "bjj.pro.month") + '"></label></div><h3>How people pay for the upgrade</h3><div class="grid"><label class="field">Bank<input name="bank" type="text" value="' + esc(p.bank || "") + '"></label><label class="field">Account<input name="account" type="text" value="' + esc(p.account || "") + '"></label><label class="field">Name<input name="holder" type="text" value="' + esc(p.holder || "") + '"></label><label class="field">QPay<input name="qpay" type="text" value="' + esc(p.qpay || "") + '"></label></div><label class="field">Note<textarea name="note" rows="2">' + esc(p.note || "") + '</textarea></label><label class="field">Admin emails (one per line, in addition to config.js)<textarea name="admins" rows="3">' + esc((A.admins || []).join("\n")) + '</textarea></label><div><button class="btn" type="submit">Save</button></div></form>' +
    '<div class="card"><h3>Logins created here</h3><p class="small">A member added with a username gets the login <code>' + esc("username@" + MEMBER_DOMAIN) + '</code>; in the app they type just the username. Supabase must allow sign-ups and have “Confirm email” off for these accounts.</p></div>';
}

/* ---- modals ---- */
function modal(title, body, onSave, saveLabel) {
  const m = document.createElement("div"); m.className = "modal"; m.innerHTML = '<form><h2>' + esc(title) + "</h2>" + body + '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn" type="submit">' + esc(saveLabel || "Save") + "</button></div></form>";
  document.body.appendChild(m); const close = () => m.remove(); m.querySelector("[data-x]").onclick = close; m.addEventListener("click", (e) => { if (e.target === m) close(); });
  m.querySelector("form").addEventListener("submit", async (e) => { e.preventDefault(); const f = new FormData(e.target); const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; try { await onSave(f, e.target); close(); await loadAll(); render(); } catch (err) { btn.disabled = false; toast(err.message || "Failed"); } });
  const first = m.querySelector("input,select,textarea"); if (first) first.focus();
}
const beltOptions = (track, cur) => (SEED.belts[track] || []).map((b) => '<option value="' + b.id + '"' + (b.id === cur ? " selected" : "") + ">" + esc(b.n) + "</option>").join("");
function memberModal(clubId, id) {
  const c = D.clubs.find((x) => x.id === clubId); const doc = D.members[clubId] || { list: [] }; const m = id ? doc.list.find((x) => x.id === id) : null; const track = m ? m.track || "adult" : "adult";
  const body = '<div class="grid"><label class="field">Name<input name="n" required value="' + esc(m ? m.n : "") + '"></label><label class="field">Phone<input name="phone" value="' + esc(m ? m.phone || "" : "") + '"></label></div>' +
    (m && m.uid ? '<p class="small muted">Login: ' + esc((m.email || "").replace("@" + MEMBER_DOMAIN, "")) + "</p>" : '<div class="grid"><label class="field">Username or email' + (m ? "" : " (for their login)") + '<input name="login" value="' + esc(m ? (m.email || "").replace("@" + MEMBER_DOMAIN, "") : "") + '" placeholder="bat or bat@mail.com"></label><label class="field">Password (6+ · creates the login)<input name="pw" type="text" autocomplete="new-password" minlength="6" placeholder="leave empty: no login yet"></label></div>') +
    '<div class="grid"><label class="field">Age group<select name="track" id="m-track"><option value="adult"' + (track === "adult" ? " selected" : "") + '>Adult 16+</option><option value="kids"' + (track === "kids" ? " selected" : "") + '>Kids 4–15</option></select></label><label class="field">Belt<select name="belt" id="m-belt">' + beltOptions(track, m ? m.belt : "white") + '</select></label><label class="field">Stripes<select name="stripes">' + [0, 1, 2, 3, 4].map((s) => '<option value="' + s + '"' + (m && +m.stripes === s ? " selected" : "") + ">" + s + "</option>").join("") + "</select></label></div>" +
    '<div class="grid"><label class="field">Belt since<input name="beltSince" type="date" value="' + esc(m ? m.beltSince || "" : "") + '"></label><label class="field">Member since<input name="since" type="date" value="' + esc(m ? m.since || todayIso() : todayIso()) + '"></label><label class="field">Competition team<select name="comp"><option value="">No</option><option value="1"' + (m && m.comp ? " selected" : "") + ">Yes</option></select></label></div>";
  modal(m ? "Edit member · " + c.n : "Add a member · " + c.n, body, async (f) => {
    const rec = m || { id: uid(), uid: null }; rec.n = f.get("n").trim(); rec.phone = f.get("phone").trim(); rec.track = f.get("track"); rec.belt = f.get("belt"); rec.stripes = +f.get("stripes"); rec.beltSince = f.get("beltSince"); rec.since = f.get("since") || todayIso(); rec.comp = !!f.get("comp"); rec.coachSet = true; rec.setBy = SB.uid();
    if (!(m && m.uid)) { const login = (f.get("login") || "").trim(); const pw = f.get("pw") || ""; if (login) rec.email = emailOf(login); if (login && pw) { const u = await SB.createUser(rec.email, pw, rec.n); rec.uid = u.id; if (!u.confirmed) toast("Login created, but Supabase wants the email confirmed first"); } }
    if (!m) doc.list.push(rec); await SB.set("club/" + clubId + "/members", doc); toast(m ? "Saved" : rec.uid ? "Member added with a login" : "Member added");
  });
  setTimeout(() => { const t = document.getElementById("m-track"); if (t) t.onchange = () => { document.getElementById("m-belt").innerHTML = beltOptions(t.value, "white"); }; }, 0);
}
function payModal(clubId, who) {
  const c = D.clubs.find((x) => x.id === clubId);
  modal("Log a fee · " + memberName(clubId, who), '<div class="grid"><label class="field">Paid on<input name="d" type="date" value="' + todayIso() + '" required></label><label class="field">For month<input name="per" type="month" value="' + thisMonth() + '" required></label><label class="field">Amount (₮)<input name="amt" type="number" value="' + esc((c.fee && c.fee.month) || "") + '"></label></div><label class="field">Note<input name="note" placeholder="cash / transfer"></label>', async (f) => {
    const path = "club/" + clubId + "/pay/" + who; const doc = (await SB.get(path)) || { items: [] }; doc.items.push({ id: uid(), d: f.get("d"), per: f.get("per"), amt: +f.get("amt") || 0, note: f.get("note").trim(), by: SB.uid(), status: "ok", okBy: SB.uid(), okAt: todayIso() }); await SB.set(path, doc); toast("Logged");
  });
}
function resultModal(clubId, memberId) {
  const list = ((D.members[clubId] || {}).list || []);
  modal("Record a competition result", '<label class="field">Athlete<select name="mid" required>' + list.map((m) => '<option value="' + m.id + '"' + (m.id === memberId ? " selected" : "") + ">" + esc(m.n || m.email) + "</option>").join("") + '</select></label><div class="grid"><label class="field">Competition<input name="event" required placeholder="UB Open 2026"></label><label class="field">Date<input name="d" type="date" value="' + todayIso() + '" required></label></div><div class="grid"><label class="field">Division<input name="div" placeholder="Adult, blue, 70 kg"></label><label class="field">Result<select name="medal"><option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option><option value="">Took part</option></select></label></div>', async (f) => {
    const m = list.find((x) => x.id === f.get("mid")); const doc = (await SB.get("club/" + clubId + "/results")) || { list: [] }; doc.list.push({ id: uid(), uid: m.uid || null, mid: m.id, n: m.n || m.email, event: f.get("event").trim(), d: f.get("d"), div: f.get("div").trim(), medal: f.get("medal"), status: "ok", okBy: SB.uid() }); await SB.set("club/" + clubId + "/results", doc); toast("Recorded");
  });
}
function eventModal(clubId) {
  modal("Upcoming competition", '<label class="field">Competition<input name="n" required></label><div class="grid"><label class="field">Date<input name="d" type="date" required></label><label class="field">Register by<input name="deadline" type="date"></label></div><label class="field">Where<input name="place"></label><label class="field">Link<input name="url" type="url" placeholder="https://"></label>', async (f) => {
    const doc = (await SB.get("club/" + clubId + "/events")) || { list: [] }; doc.list.push({ id: uid(), n: f.get("n").trim(), d: f.get("d"), deadline: f.get("deadline"), place: f.get("place").trim(), url: f.get("url").trim() }); await SB.set("club/" + clubId + "/events", doc); toast("Added");
  });
}
async function saveSettings(e) {
  e.preventDefault(); const f = new FormData(e.target); const rec = { admins: String(f.get("admins") || "").split("\n").map((x) => x.trim()).filter(Boolean), pay: { bank: f.get("bank"), account: f.get("account"), holder: f.get("holder"), qpay: f.get("qpay"), note: f.get("note") }, pro: { price: +f.get("price") || 0, product: f.get("product") || "bjj.pro.month" } };
  try { await SB.set("app/config", rec); D.app = rec; toast("Saved"); } catch (err) { toast("Could not save"); }
}
async function act(ds) {
  try {
    if (ds.act === "memf") { UI.memF = ds.v; render(); return; }
    if (ds.act === "member-add") return memberModal(ds.club, null);
    if (ds.act === "member-edit") return memberModal(ds.club, ds.id);
    if (ds.act === "pay-log") return payModal(ds.club, ds.who);
    if (ds.act === "result-add") return resultModal(ds.club, ds.id || null);
    if (ds.act === "event-add") return eventModal(ds.club);
    if (ds.act === "comp-toggle") { const doc = D.members[ds.club]; const m = doc.list.find((x) => x.id === ds.id); if (m) { m.comp = !m.comp; await SB.set("club/" + ds.club + "/members", doc); toast(m.comp ? m.n + " is on the competition team" : "Off the team"); } }
    if (ds.act === "club-approve" || ds.act === "club-reject") { const p = D.clubs.find((c) => c.id === ds.id); const idx = (await SB.get("clubs/index")) || { list: [] }; if (ds.act === "club-approve") { if (p) { p.status = "approved"; await SB.set("club/" + p.id + "/profile", p); } const r = idx.list.find((x) => x.id === ds.id); if (r) r.status = "approved"; else if (p) idx.list.push({ id: p.id, n: p.n, city: p.city, status: "approved", open: !!p.open }); } else { idx.list = idx.list.filter((x) => x.id !== ds.id); if (p) { p.status = "rejected"; await SB.set("club/" + p.id + "/profile", p); } } await SB.set("clubs/index", idx); toast(ds.act === "club-approve" ? "Approved" : "Removed"); }
    if (ds.act === "up-ok" || ds.act === "up-no") { const doc = (await SB.get("app/upgrades")) || { list: [] }; const u = doc.list.find((x) => x.id === ds.id); if (!u) return; if (ds.act === "up-ok") { const pro = (await SB.get("app/pro")) || { u: {} }; const cur = pro.u[u.uid] && pro.u[u.uid].until >= thisMonth() ? pro.u[u.uid].until : thisMonth(); const y = +cur.slice(0, 4), m = +cur.slice(5) + (+ds.m || 1); const until = (y + Math.floor((m - 1) / 12)) + "-" + pad(((m - 1) % 12) + 1); pro.u[u.uid] = { until, n: u.n }; await SB.set("app/pro", pro); u.status = "ok"; u.until = until; } else u.status = "no"; await SB.set("app/upgrades", doc); toast(ds.act === "up-ok" ? "Upgraded" : "Rejected"); }
    if (ds.act === "pay-ok") { const path = "club/" + ds.club + "/pay/" + ds.who; const doc = await SB.get(path); const x = doc && doc.items.find((y) => y.id === ds.id); if (x) { x.status = "ok"; x.okBy = SB.uid(); x.okAt = todayIso(); await SB.set(path, doc); toast("Confirmed"); } }
    if (ds.act === "res-ok" || ds.act === "res-no") { const path = "club/" + ds.club + "/results"; const doc = (await SB.get(path)) || { list: [] }; const r = doc.list.find((x) => x.id === ds.id); if (r) { if (ds.act === "res-ok") { r.status = "ok"; r.okBy = SB.uid(); } else doc.list = doc.list.filter((x) => x !== r); await SB.set(path, doc); toast(ds.act === "res-ok" ? "Approved" : "Removed"); } }
    await loadAll(); render();
  } catch (err) { toast("Something failed: " + err.message); }
}
async function boot() {
  if (!SB.session) { render(); return; }
  $("root").innerHTML = '<p class="empty">Loading…</p>';
  try { await loadAll(); } catch (e) { if (e.message === "noauth") { SB.store(null); } else { $("root").innerHTML = '<div id="login" class="card"><h1>Could not load</h1><p class="small">' + esc(e.message) + '</p><button class="btn" onclick="location.reload()">Retry</button></div>'; return; } }
  render();
}
if (!SB.url || !SB.key) { $("root").innerHTML = '<div id="login" class="card"><h1>Not configured</h1><p class="small">config.js has no Supabase project. The console only works with the cloud setup.</p></div>'; }
else { SB.load(); boot(); }
})();
