/* Admin console for the Jiu-jitsu club app. Signs in with the same Supabase project; only emails in
   APP_CONFIG.admins (or app/config.admins) get past the door. Everything here reads the shared club docs. */
(function () {
"use strict";
const CFG = window.APP_CONFIG || {};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const todayIso = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const thisMonth = () => todayIso().slice(0, 7);
const money = (v) => (+v || 0).toLocaleString("en-US") + "₮";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

const SB = {
  url: (CFG.supabaseUrl || "").replace(/\/$/, ""), key: CFG.supabaseAnonKey || "", session: null,
  load() { try { this.session = JSON.parse(localStorage.getItem("cb-sb-session") || "null"); } catch (e) { this.session = null; } },
  store(s) { this.session = s; try { s ? localStorage.setItem("cb-sb-session", JSON.stringify(s)) : localStorage.removeItem("cb-sb-session"); } catch (e) {} },
  async auth(body, grant) { const r = await fetch(this.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || "auth"); this.store({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id }); return this.session; },
  async token() { if (!this.session) throw new Error("noauth"); if (Date.now() > this.session.exp - 60000) { try { await this.auth({ refresh_token: this.session.refresh }, "refresh_token"); } catch (e) { this.store(null); throw new Error("noauth"); } } return this.session.access; },
  async req(path, opt) { opt = opt || {}; const t = await this.token(); const r = await fetch(this.url + path, Object.assign({}, opt, { headers: Object.assign({ apikey: this.key, Authorization: "Bearer " + t }, opt.headers || {}) })); if (r.status === 401) { this.store(null); throw new Error("noauth"); } if (!r.ok) throw new Error("http " + r.status); return r; },
  async get(path) { const r = await this.req("/rest/v1/docs?select=data&path=eq." + encodeURIComponent(path)); const rows = await r.json(); return rows.length ? rows[0].data : null; },
  async list(prefix) { const r = await this.req("/rest/v1/docs?select=path,data,updated_at&path=like." + encodeURIComponent(prefix + "*")); return r.json(); },
  set(path, data) { return this.req("/rest/v1/docs", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, data, updated_at: new Date().toISOString() }) }); },
};

const D = { clubs: [], members: {}, pay: {}, att: {}, results: {}, index: null, app: null, pro: null, upgrades: null, users: {} };
const UI = { page: "overview", q: "", club: null };

function isAdmin() { const em = (SB.session && SB.session.email || "").toLowerCase(); return (CFG.admins || []).concat((D.app && D.app.admins) || []).map((x) => String(x).toLowerCase()).includes(em); }
async function loadAll() {
  D.app = (await SB.get("app/config")) || { admins: [], pay: {}, pro: {} };
  if (!isAdmin()) return false;
  D.index = (await SB.get("clubs/index")) || { list: [] }; D.pro = (await SB.get("app/pro")) || { u: {} }; D.upgrades = (await SB.get("app/upgrades")) || { list: [] };
  const rows = await SB.list("club/"); D.clubs = []; D.members = {}; D.pay = {}; D.att = {}; D.results = {};
  for (const r of rows) { const [, id, kind, rest] = r.path.split("/"); if (kind === "profile") { r.data.updated = r.updated_at; D.clubs.push(r.data); } else if (kind === "members") D.members[id] = r.data; else if (kind === "pay") (D.pay[id] = D.pay[id] || {})[rest] = r.data; else if (kind === "att" && rest === thisMonth()) D.att[id] = r.data; else if (kind === "results") D.results[id] = r.data; }
  D.clubs.sort((a, b) => String(a.n).localeCompare(String(b.n)));
  // who is on the app: every personal settings doc we are allowed to see is our own only, so count members by club instead
  return true;
}
function membership(clubId, key) { const p = (D.pay[clubId] || {})[key]; const ok = p ? p.items.filter((x) => x.status !== "pending").map((x) => x.per).sort() : []; const last = ok[ok.length - 1]; if (!last) return { state: "none", text: "never paid" }; const y = +last.slice(0, 4), m = +last.slice(5); const end = new Date(y, m, 0); const days = Math.round((end - new Date(todayIso() + "T12:00:00")) / 86400000); return days >= 0 ? { state: "active", text: "until " + last, days } : { state: "expired", text: "expired " + last, days }; }
function pendingPays(clubId) { const out = []; for (const k in D.pay[clubId] || {}) for (const x of D.pay[clubId][k].items) if (x.status === "pending") out.push(Object.assign({ who: k }, x)); return out; }
function memberName(clubId, key) { const m = ((D.members[clubId] || {}).list || []).find((x) => x.uid === key || x.id === key); return m ? m.n || m.email || key : key; }
function attCount(clubId, key) { const doc = D.att[clubId]; if (!doc) return 0; let n = 0; for (const d in doc.days) if (doc.days[d].includes(key)) n++; return n; }

function render() {
  const root = $("root");
  if (!SB.session) { root.innerHTML = '<form id="login" class="card"><h1>Admin console</h1><p class="muted small">Sign in with an admin account.</p><label class="field">Email<input id="e" type="email" autocomplete="username" required></label><label class="field">Password<input id="p" type="password" autocomplete="current-password" required></label><button class="btn" type="submit">Sign in</button><p id="err" class="small" style="color:var(--bad)"></p></form>'; $("login").addEventListener("submit", async (e) => { e.preventDefault(); try { await SB.auth({ email: $("e").value.trim(), password: $("p").value }, "password"); boot(); } catch (err) { $("err").textContent = "Wrong email or password."; } }); return; }
  if (UI.denied) { root.innerHTML = '<div id="login" class="card"><h1>Not an admin</h1><p class="small">' + esc(SB.session.email) + ' is signed in but is not in the admin list (config.js → admins, or app/config).</p><button class="btn ghost" id="out">Sign out</button></div>'; $("out").onclick = () => { SB.store(null); render(); }; return; }
  const pages = [["overview", "Overview"], ["clubs", "Clubs"], ["members", "Members"], ["payments", "Payments"], ["upgrades", "Upgrades"], ["settings", "Settings"]];
  let h = '<div class="app"><aside><h1>Admin</h1>' + pages.map((p) => '<button data-page="' + p[0] + '"' + (UI.page === p[0] ? ' aria-current="page"' : "") + ">" + p[1] + "</button>").join("") + '<div class="who">' + esc(SB.session.email) + '<br><button class="btn ghost" id="reload" style="margin-top:8px">Refresh</button> <button class="btn ghost" id="out">Sign out</button></div></aside><main>';
  h += UI.page === "overview" ? vOverview() : UI.page === "clubs" ? vClubs() : UI.page === "members" ? vMembers() : UI.page === "payments" ? vPayments() : UI.page === "upgrades" ? vUpgrades() : vSettings();
  h += "</main></div>";
  root.innerHTML = h;
  root.querySelectorAll("[data-page]").forEach((b) => (b.onclick = () => { UI.page = b.dataset.page; render(); }));
  $("out").onclick = () => { SB.store(null); render(); }; $("reload").onclick = () => boot();
  const q = $("q"); if (q) q.oninput = () => { UI.q = q.value; render(); const q2 = $("q"); q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); };
  const cs = $("club-sel"); if (cs) cs.onchange = () => { UI.club = cs.value; render(); };
  const sf = $("settings-form"); if (sf) sf.addEventListener("submit", saveSettings);
}
function vOverview() {
  const clubs = D.clubs.filter((c) => c.status !== "rejected"); let members = 0, active = 0, pend = 0, linked = 0;
  for (const c of clubs) { const ms = ((D.members[c.id] || {}).list || []); members += ms.length; linked += ms.filter((m) => m.uid).length; for (const m of ms) if (membership(c.id, m.uid || m.id).state === "active") active++; pend += pendingPays(c.id).length; }
  const ups = (D.upgrades.list || []).filter((u) => u.status === "pending").length; const pro = Object.keys(D.pro.u || {}).filter((k) => D.pro.u[k].until >= thisMonth()).length; const pendClubs = D.clubs.filter((c) => c.status === "pending").length;
  let h = '<div class="head"><h2>Overview · ' + thisMonth() + '</h2><span class="muted small">data as of now</span></div><div class="cards">' + [["Clubs", clubs.length], ["Members", members], ["With an account", linked], ["Active memberships", active], ["Payments to confirm", pend], ["Clubs to approve", pendClubs], ["Upgrade requests", ups], ["Upgraded users", pro]].map((s) => '<div class="stat"><b>' + s[1] + "</b><span>" + s[0] + "</span></div>").join("") + "</div>";
  const todo = [];
  for (const c of D.clubs.filter((x) => x.status === "pending")) todo.push('<tr><td><span class="pill warn">club</span></td><td>' + esc(c.n) + " · " + esc(c.city || "") + '</td><td><button class="btn" data-act="club-approve" data-id="' + c.id + '">Approve</button> <button class="btn danger" data-act="club-reject" data-id="' + c.id + '">Reject</button></td></tr>');
  for (const u of (D.upgrades.list || []).filter((x) => x.status === "pending")) todo.push('<tr><td><span class="pill warn">upgrade</span></td><td>' + esc(u.n || u.email) + " · " + esc(u.d) + (u.note ? " · " + esc(u.note) : "") + '</td><td><button class="btn" data-act="up-ok" data-id="' + u.id + '" data-m="1">1 month</button> <button class="btn ghost" data-act="up-ok" data-id="' + u.id + '" data-m="12">1 year</button> <button class="btn danger" data-act="up-no" data-id="' + u.id + '">Reject</button></td></tr>');
  h += '<div class="card"><div class="head"><h3>Needs you</h3><span class="muted small">' + todo.length + "</span></div>" + (todo.length ? "<table><tbody>" + todo.join("") + "</tbody></table>" : '<p class="empty">Nothing waiting.</p>') + "</div>";
  h += '<div class="card"><div class="head"><h3>Clubs at a glance</h3></div><table><thead><tr><th>Club</th><th>Status</th><th>Members</th><th>Active</th><th>On the mat this month</th><th>To confirm</th><th>Coach</th></tr></thead><tbody>' + clubs.map((c) => { const ms = ((D.members[c.id] || {}).list || []); const act = ms.filter((m) => membership(c.id, m.uid || m.id).state === "active").length; const att = D.att[c.id] ? Object.keys(D.att[c.id].days).length : 0; return "<tr><td><b>" + esc(c.n) + "</b><br><span class='muted small'>" + esc(c.city || "") + '</span></td><td><span class="pill ' + (c.status === "pending" ? "warn" : "ok") + '">' + esc(c.status || "approved") + (c.open ? " · open" : "") + "</span></td><td>" + ms.length + "</td><td>" + act + "</td><td>" + att + " days</td><td>" + pendingPays(c.id).length + "</td><td>" + esc(c.coach || "—") + (c.admins && c.admins.length ? '<br><span class="muted small">' + c.admins.length + " coach account" + (c.admins.length > 1 ? "s" : "") + "</span>" : '<br><span class="pill bad">unclaimed</span>') + "</td></tr>"; }).join("") + "</tbody></table></div>";
  return h + bindLater();
}
function vClubs() {
  let h = '<div class="head"><h2>Clubs</h2><input id="q" type="search" placeholder="Search clubs…" value="' + esc(UI.q) + '"></div>';
  const q = UI.q.toLowerCase(); const clubs = D.clubs.filter((c) => !q || (c.n + " " + (c.city || "") + " " + (c.coach || "")).toLowerCase().includes(q));
  h += '<div class="card"><table><thead><tr><th>Club</th><th>Status</th><th>Codes</th><th>Fees</th><th>Classes</th><th>Payment details</th><th></th></tr></thead><tbody>' + clubs.map((c) => "<tr><td><b>" + esc(c.n) + "</b><br><span class='muted small'>" + esc([c.city, c.addr, c.phone].filter(Boolean).join(" · ")) + '</span></td><td><span class="pill ' + (c.status === "pending" ? "warn" : c.status === "rejected" ? "bad" : "ok") + '">' + esc(c.status || "approved") + "</span>" + (c.open ? '<br><span class="pill">open to join</span>' : "") + "</td><td>member <code>" + esc(c.code || "—") + "</code><br>coach <code>" + esc(c.coachCode || "—") + "</code></td><td>" + money(c.fee && c.fee.month) + "<br><span class='muted small'>drop-in " + money(c.fee && c.fee.drop) + "</span></td><td>" + ((c.schedule || []).length) + "<br><span class='muted small'>" + (c.schedule || []).filter((x) => x.kind === "open").length + " open mats</span></td><td class='small'>" + esc([(c.pay || {}).bank, (c.pay || {}).account, (c.pay || {}).qpay].filter(Boolean).join(" · ") || "—") + "</td><td>" + (c.status === "pending" ? '<button class="btn" data-act="club-approve" data-id="' + c.id + '">Approve</button> ' : "") + (c.status !== "rejected" ? '<button class="btn danger" data-act="club-reject" data-id="' + c.id + '">' + (c.status === "pending" ? "Reject" : "Remove") + "</button>" : '<button class="btn ghost" data-act="club-approve" data-id="' + c.id + '">Restore</button>') + "</td></tr>").join("") + "</tbody></table></div>";
  return h + bindLater();
}
function clubSelect() { return '<select id="club-sel"><option value="">All clubs</option>' + D.clubs.map((c) => '<option value="' + c.id + '"' + (UI.club === c.id ? " selected" : "") + ">" + esc(c.n) + "</option>").join("") + "</select>"; }
function vMembers() {
  let h = '<div class="head"><h2>Members</h2><div style="display:flex;gap:8px;flex-wrap:wrap">' + clubSelect() + '<input id="q" type="search" placeholder="Name or email…" value="' + esc(UI.q) + '"></div></div>';
  const q = UI.q.toLowerCase(); const rows = [];
  for (const c of D.clubs) { if (UI.club && c.id !== UI.club) continue; for (const m of ((D.members[c.id] || {}).list || [])) { if (q && !((m.n || "") + " " + (m.email || "")).toLowerCase().includes(q)) continue; const key = m.uid || m.id; const ms = membership(c.id, key); const medals = ((D.results[c.id] || {}).list || []).filter((r) => r.uid === m.uid && r.status === "ok").length; const pro = m.uid && D.pro.u[m.uid] && D.pro.u[m.uid].until >= thisMonth(); rows.push("<tr><td><b>" + esc(m.n || m.email || "Member") + "</b><br><span class='muted small'>" + esc(m.email || "") + "</span></td><td>" + esc(c.n) + "</td><td>" + esc((m.belt || "white") + (m.stripes ? " · " + m.stripes : "")) + "<br><span class='muted small'>" + (m.track === "kids" ? "kids" : "adult") + "</span></td><td>" + (m.uid ? '<span class="pill ok">account</span>' : '<span class="pill warn">no account</span>') + ((c.admins || []).includes(m.uid) ? ' <span class="pill">coach</span>' : "") + (pro ? ' <span class="pill ok">pro</span>' : "") + '</td><td><span class="pill ' + (ms.state === "active" ? "ok" : ms.state === "expired" ? "bad" : "") + '">' + esc(ms.text) + "</span></td><td>" + attCount(c.id, key) + "</td><td>" + (medals || "") + "</td><td class='muted small'>" + esc(m.since || "") + "</td></tr>"); } }
  h += '<div class="card"><table><thead><tr><th>Member</th><th>Club</th><th>Belt</th><th>Account</th><th>Membership</th><th>Days this month</th><th>Medals</th><th>Since</th></tr></thead><tbody>' + (rows.join("") || '<tr><td colspan="8" class="empty">No members match.</td></tr>') + "</tbody></table><p class='muted small'>" + rows.length + " members</p></div>";
  return h;
}
function vPayments() {
  let h = '<div class="head"><h2>Payments</h2>' + clubSelect() + "</div>";
  const pend = [], recent = [];
  for (const c of D.clubs) { if (UI.club && c.id !== UI.club) continue; for (const k in D.pay[c.id] || {}) for (const x of D.pay[c.id][k].items) (x.status === "pending" ? pend : recent).push(Object.assign({ club: c, who: k }, x)); }
  recent.sort((a, b) => (a.d < b.d ? 1 : -1));
  const row = (x, act) => "<tr><td>" + esc(x.d) + "</td><td><b>" + esc(memberName(x.club.id, x.who)) + "</b></td><td>" + esc(x.club.n) + "</td><td>" + esc(x.per) + "</td><td>" + money(x.amt) + "</td><td class='muted small'>" + esc(x.note || "") + "</td><td>" + (act ? '<button class="btn" data-act="pay-ok" data-club="' + x.club.id + '" data-who="' + x.who + '" data-id="' + x.id + '">Confirm</button>' : '<span class="pill ok">confirmed</span>') + "</td></tr>";
  h += '<div class="card"><div class="head"><h3>Waiting for confirmation</h3><span class="muted small">' + pend.length + " · normally the coach confirms, you can too</span></div>" + (pend.length ? '<table><thead><tr><th>Sent</th><th>Member</th><th>Club</th><th>Month</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>' + pend.map((x) => row(x, true)).join("") + "</tbody></table>" : '<p class="empty">Nothing pending.</p>') + "</div>";
  const sum = recent.filter((x) => x.per === thisMonth()).reduce((a, x) => a + (+x.amt || 0), 0);
  h += '<div class="card"><div class="head"><h3>Confirmed</h3><span class="muted small">' + money(sum) + " for " + thisMonth() + "</span></div>" + (recent.length ? '<table><thead><tr><th>Date</th><th>Member</th><th>Club</th><th>Month</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>' + recent.slice(0, 100).map((x) => row(x, false)).join("") + "</tbody></table>" : '<p class="empty">No confirmed payments yet.</p>') + "</div>";
  return h + bindLater();
}
function vUpgrades() {
  const list = (D.upgrades.list || []).slice().sort((a, b) => (a.d < b.d ? 1 : -1)); const pro = Object.keys(D.pro.u || {}).map((k) => Object.assign({ uid: k }, D.pro.u[k])).sort((a, b) => (a.until < b.until ? 1 : -1));
  let h = '<div class="head"><h2>Upgrades</h2><span class="muted small">price ' + money(D.app.pro && D.app.pro.price) + " / month</span></div>";
  h += '<div class="card"><div class="head"><h3>Requests</h3></div>' + (list.length ? '<table><thead><tr><th>Date</th><th>Who</th><th>Note</th><th>Status</th><th></th></tr></thead><tbody>' + list.map((u) => "<tr><td>" + esc(u.d) + "</td><td><b>" + esc(u.n || "") + "</b><br><span class='muted small'>" + esc(u.email || u.uid) + "</span></td><td class='small'>" + esc(u.note || "") + '</td><td><span class="pill ' + (u.status === "ok" ? "ok" : u.status === "no" ? "bad" : "warn") + '">' + esc(u.status === "ok" ? "upgraded until " + u.until : u.status === "no" ? "rejected" : "pending") + "</span></td><td>" + (u.status === "pending" ? '<button class="btn" data-act="up-ok" data-id="' + u.id + '" data-m="1">1 month</button> <button class="btn ghost" data-act="up-ok" data-id="' + u.id + '" data-m="12">1 year</button> <button class="btn danger" data-act="up-no" data-id="' + u.id + '">Reject</button>' : "") + "</td></tr>").join("") + "</tbody></table>" : '<p class="empty">No requests yet.</p>') + "</div>";
  h += '<div class="card"><div class="head"><h3>Upgraded users</h3><span class="muted small">' + pro.filter((p) => p.until >= thisMonth()).length + " active</span></div>" + (pro.length ? '<table><thead><tr><th>Who</th><th>Until</th><th>Via</th></tr></thead><tbody>' + pro.map((p) => "<tr><td>" + esc(p.n || p.uid) + '</td><td><span class="pill ' + (p.until >= thisMonth() ? "ok" : "bad") + '">' + esc(p.until) + "</span></td><td class='muted small'>" + esc(p.via || "transfer") + "</td></tr>").join("") + "</tbody></table>" : '<p class="empty">Nobody upgraded yet.</p>') + "</div>";
  return h + bindLater();
}
function vSettings() {
  const A = D.app || {}; const p = A.pay || {};
  return '<div class="head"><h2>Settings</h2></div><form class="card" id="settings-form"><div class="grid"><label class="field">Upgrade price / month (₮)<input name="price" type="number" value="' + esc((A.pro && A.pro.price) || "") + '"></label><label class="field">Store product id<input name="product" type="text" value="' + esc((A.pro && A.pro.product) || "bjj.pro.month") + '"></label></div><h3>How people pay for the upgrade</h3><div class="grid"><label class="field">Bank<input name="bank" type="text" value="' + esc(p.bank || "") + '"></label><label class="field">Account<input name="account" type="text" value="' + esc(p.account || "") + '"></label><label class="field">Name<input name="holder" type="text" value="' + esc(p.holder || "") + '"></label><label class="field">QPay<input name="qpay" type="text" value="' + esc(p.qpay || "") + '"></label></div><label class="field">Note<textarea name="note" rows="2">' + esc(p.note || "") + '</textarea></label><label class="field">Admin emails (one per line, in addition to config.js)<textarea name="admins" rows="3">' + esc((A.admins || []).join("\n")) + '</textarea></label><div><button class="btn" type="submit">Save</button></div></form>' +
    '<div class="card"><h3>Links</h3><p class="small">App for members and coaches: <a href="./">' + esc(location.origin + location.pathname.replace(/admin\.html$/, "")) + '</a><br>This console: <a href="admin.html">' + esc(location.origin + location.pathname.replace(/[^/]*$/, "") + "admin.html") + "</a></p><p class='muted small'>Only emails in the admin list can open it. Everyone else sees “Not an admin”.</p></div>";
}
function bindLater() { setTimeout(() => { document.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => act(b.dataset))); }, 0); return ""; }
async function saveSettings(e) {
  e.preventDefault(); const f = new FormData(e.target); const rec = { admins: String(f.get("admins") || "").split("\n").map((x) => x.trim()).filter(Boolean), pay: { bank: f.get("bank"), account: f.get("account"), holder: f.get("holder"), qpay: f.get("qpay"), note: f.get("note") }, pro: { price: +f.get("price") || 0, product: f.get("product") || "bjj.pro.month" } };
  try { await SB.set("app/config", rec); D.app = rec; toast("Saved"); } catch (err) { toast("Could not save"); }
}
async function act(ds) {
  try {
    if (ds.act === "club-approve" || ds.act === "club-reject") { const p = D.clubs.find((c) => c.id === ds.id); const idx = (await SB.get("clubs/index")) || { list: [] }; if (ds.act === "club-approve") { if (p) { p.status = "approved"; await SB.set("club/" + p.id + "/profile", p); } const r = idx.list.find((x) => x.id === ds.id); if (r) r.status = "approved"; else if (p) idx.list.push({ id: p.id, n: p.n, city: p.city, status: "approved", open: !!p.open }); } else { idx.list = idx.list.filter((x) => x.id !== ds.id); if (p) { p.status = "rejected"; await SB.set("club/" + p.id + "/profile", p); } } await SB.set("clubs/index", idx); toast(ds.act === "club-approve" ? "Approved" : "Removed"); }
    if (ds.act === "up-ok" || ds.act === "up-no") { const doc = (await SB.get("app/upgrades")) || { list: [] }; const u = doc.list.find((x) => x.id === ds.id); if (!u) return; if (ds.act === "up-ok") { const pro = (await SB.get("app/pro")) || { u: {} }; const cur = pro.u[u.uid] && pro.u[u.uid].until >= thisMonth() ? pro.u[u.uid].until : thisMonth(); const y = +cur.slice(0, 4), m = +cur.slice(5) + (+ds.m || 1); const until = (y + Math.floor((m - 1) / 12)) + "-" + pad(((m - 1) % 12) + 1); pro.u[u.uid] = { until, n: u.n }; await SB.set("app/pro", pro); u.status = "ok"; u.until = until; } else u.status = "no"; await SB.set("app/upgrades", doc); toast(ds.act === "up-ok" ? "Upgraded" : "Rejected"); }
    if (ds.act === "pay-ok") { const path = "club/" + ds.club + "/pay/" + ds.who; const doc = await SB.get(path); const x = doc && doc.items.find((y) => y.id === ds.id); if (x) { x.status = "ok"; x.okBy = SB.session.uid; x.okAt = todayIso(); await SB.set(path, doc); toast("Confirmed"); } }
    await loadAll(); render();
  } catch (err) { toast("Something failed: " + err.message); }
}
async function boot() {
  if (!SB.session) { render(); return; }
  $("root").innerHTML = '<p class="empty">Loading…</p>';
  try { UI.denied = !(await loadAll()); } catch (e) { if (e.message === "noauth") { SB.store(null); } else { $("root").innerHTML = '<div id="login" class="card"><h1>Could not load</h1><p class="small">' + esc(e.message) + '</p><button class="btn" onclick="location.reload()">Retry</button></div>'; return; } }
  render();
}
if (!SB.url || !SB.key) { $("root").innerHTML = '<div id="login" class="card"><h1>Not configured</h1><p class="small">config.js has no Supabase project. The admin console only works with the cloud setup.</p></div>'; }
else { SB.load(); boot(); }
})();
