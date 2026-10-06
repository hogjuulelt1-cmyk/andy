#!/usr/bin/env tsx
/**
 * Builds a single-file, client-side mock of the whole demo app so it can be
 * shared as a static page (claude.ai artifact, any static host) without a
 * server. Uses the same messages/*.json and seed/*.json as the Next.js app,
 * bundles src/lib/art.ts and src/lib/matching.ts with esbuild so the
 * illustrations, route maps and matching logic are the real ones, and keeps
 * state (login, bookings, profile, chat, checklist) in localStorage.
 *
 *   pnpm preview            → out/preview.html
 *   tsx tools/build-preview.ts path/to/file.html
 */
import { buildSync } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { POOL } from "../src/server/members";

const root = resolve(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const messages = { ko: read("messages/ko.json"), en: read("messages/en.json") };
const packages = read("seed/packages.json").packages;
const departures = read("seed/departures.json").departures;
const places = read("seed/places.json").places;

const out = process.argv[2] ?? "out/preview.html";

function bundle(entry: string, globalName: string): string {
  const r = buildSync({
    entryPoints: [resolve(root, entry)],
    bundle: true,
    format: "iife",
    globalName,
    write: false,
    minify: true,
    target: "es2020",
  });
  return r.outputFiles[0].text;
}

const artJs = bundle("src/lib/art.ts", "ART");
const matchJs = bundle("src/lib/matching.ts", "MATCH");

const css = `
/* Layout: one phone-width column; mirrors the travel-bnpl Tailwind pages */
:root{--bg:#fff;--fg:#18181b;--muted:#71717a;--muted-2:#52525b;--line:#e4e4e7;--soft:#f4f4f5;--pill:#18181b;--pill-fg:#fff;--toss:#3182F6;--ok-bg:#d1fae5;--ok-fg:#065f46;--warn-bg:#fef3c7;--warn-fg:#92400e;--info-bg:#e0f2fe;--info-fg:#075985;--bad-bg:#ffe4e6;--bad-fg:#9f1239;--font:ui-sans-serif,system-ui,-apple-system,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",Roboto,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#09090b;--fg:#fafafa;--muted:#a1a1aa;--muted-2:#d4d4d8;--line:#27272a;--soft:#18181b;--pill:#fafafa;--pill-fg:#18181b;--ok-bg:#052e16;--ok-fg:#86efac;--warn-bg:#451a03;--warn-fg:#fcd34d;--info-bg:#082f49;--info-fg:#7dd3fc;--bad-bg:#4c0519;--bad-fg:#fda4af;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#09090b;--fg:#fafafa;--muted:#a1a1aa;--muted-2:#d4d4d8;--line:#27272a;--soft:#18181b;--pill:#fafafa;--pill-fg:#18181b;--ok-bg:#052e16;--ok-fg:#86efac;--warn-bg:#451a03;--warn-fg:#fcd34d;--info-bg:#082f49;--info-fg:#7dd3fc;--bad-bg:#4c0519;--bad-fg:#fda4af;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font);-webkit-font-smoothing:antialiased;font-size:16px}
main{max-width:28rem;margin:0 auto;padding-block:2rem 4rem;padding-inline:16px;display:flex;flex-direction:column;gap:2rem;min-height:100dvh}
a{color:inherit}button{font:inherit;cursor:pointer}svg{display:block}
h1{margin:0;font-size:1.75rem;line-height:1.2;font-weight:700;text-wrap:balance}h2{margin:0;font-size:1.25rem;font-weight:700}h3{margin:0;font-size:.875rem;color:var(--muted);font-weight:600}
p{margin:0}.muted{color:var(--muted)}.small{font-size:.875rem}.xs{font-size:.75rem}.num{font-variant-numeric:tabular-nums}.b{font-weight:600}
.row{display:flex;align-items:center;gap:.75rem}.between{justify-content:space-between}.col{display:flex;flex-direction:column;gap:.75rem}.wrap{flex-wrap:wrap;gap:.5rem}
.top{display:flex;flex-direction:column;gap:.75rem}.brand{display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:500;color:var(--muted);text-decoration:none}
.demo{border:1px solid #f59e0b;color:#b45309;border-radius:999px;padding:0 .4rem;font-size:10px;font-weight:600;letter-spacing:.04em}
.pill{border:0;background:none;color:var(--muted);padding:.25rem .75rem;border-radius:999px;font-size:.875rem;text-decoration:none}.pill.on{background:var(--pill);color:var(--pill-fg);font-weight:600}
.card{border:1px solid var(--line);border-radius:1rem;padding:1rem;display:flex;flex-direction:column;gap:.75rem;overflow:hidden}a.card{text-decoration:none}.card .hero{margin:-1rem -1rem 0}
.art{border-radius:1rem;overflow:hidden;line-height:0}.art.thumb{width:5rem;flex:none;border-radius:.75rem}.map{border:1px solid var(--line);border-radius:1rem;padding:.5rem}
.soft{background:var(--soft);border-radius:1rem;padding:1rem;display:flex;flex-direction:column;gap:.5rem}
.tag{border-radius:999px;padding:.125rem .625rem;font-size:.75rem;font-weight:500;white-space:nowrap}.badge{background:var(--warn-bg);color:var(--warn-fg);border-radius:999px;padding:.125rem .5rem;font-size:11px;font-weight:600;width:fit-content}
.ok{background:var(--ok-bg);color:var(--ok-fg)}.warn{background:var(--warn-bg);color:var(--warn-fg)}.info{background:var(--info-bg);color:var(--info-fg)}.bad{background:var(--bad-bg);color:var(--bad-fg)}.grey{background:var(--soft);color:var(--muted-2)}
.btn{display:flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:var(--pill);color:var(--pill-fg);padding:.75rem 1.25rem;font-weight:600;text-decoration:none;font-size:1rem}.btn.sm{padding:.5rem 1rem;font-size:.875rem}.btn.ghost{background:none;border:1px solid var(--line);color:var(--fg)}.btn:disabled{opacity:.4;cursor:not-allowed}.btn.fit{width:fit-content}
.btn.toss{background:var(--toss);color:#fff}.btn.kakao{background:#FEE500;color:#191919}.btn.naver{background:#03C75A;color:#fff}
dl{margin:0;display:flex;flex-direction:column;gap:.375rem;font-size:.875rem}dl div{display:flex;justify-content:space-between;gap:.75rem}dt{color:var(--muted)}dd{margin:0}
.dots{display:flex;gap:.25rem}.dot{width:10px;height:10px;border-radius:999px;background:var(--line)}.dot.f{background:var(--pill)}
.steps{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.75rem}.steps li{display:flex;align-items:center;gap:1rem;border:1px solid var(--line);border-radius:1rem;padding:.75rem 1rem}.n{flex:none;width:2rem;height:2rem;border-radius:999px;background:var(--pill);color:var(--pill-fg);display:grid;place-items:center;font-size:.875rem;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:0}.chips li{border:1px solid var(--line);border-radius:999px;padding:.25rem .75rem;font-size:.75rem}
.itin{list-style:none;margin:0;padding:0}.itin li{display:flex;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--line)}.itin li:last-child{border:0}
.inc{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.375rem;font-size:.875rem}.inc li::before{content:"✓ ";color:var(--muted)}
input,select{font:inherit;font-size:16px;width:100%;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:.75rem;padding:.75rem 1rem}
label.f{display:flex;flex-direction:column;gap:.375rem;font-size:.875rem;font-weight:500}fieldset{border:0;padding:0;margin:0}legend{font-size:.875rem;font-weight:600;margin-bottom:.5rem;padding:0}
.opts{display:flex;flex-wrap:wrap;gap:.5rem}.opts label{border:1px solid var(--line);border-radius:999px;padding:.5rem 1rem;font-size:.875rem;cursor:pointer}.opts label:has(input:checked){background:var(--pill);color:var(--pill-fg);border-color:var(--pill)}.opts input{position:absolute;opacity:0;width:0;height:0}
.methods{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.methods label{display:flex;justify-content:center;border:1px solid var(--line);border-radius:.75rem;padding:.75rem;font-size:.875rem;font-weight:500;cursor:pointer}.methods label.on{border-color:var(--toss);background:color-mix(in srgb,var(--toss) 10%,transparent);color:var(--toss)}.methods input{position:absolute;opacity:0;width:0;height:0}
.tossbox{border:1px solid color-mix(in srgb,var(--toss) 30%,transparent);background:color-mix(in srgb,var(--toss) 5%,transparent);border-radius:1rem;padding:1rem}
.note{background:var(--warn-bg);color:var(--warn-fg);border-radius:.75rem;padding:.5rem .75rem;font-size:.75rem}
.banner{border-radius:1rem;padding:1rem;font-size:.875rem}
.member{display:flex;align-items:center;gap:.75rem;border:1px solid var(--line);border-radius:1rem;padding:.75rem 1rem}.av{flex:none;width:2.25rem;height:2.25rem;border-radius:999px;background:var(--line);display:grid;place-items:center;font-size:.875rem;font-weight:600}.av.me{background:var(--pill);color:var(--pill-fg)}.empty{border:1px dashed var(--line);border-radius:1rem;padding:.75rem 1rem;color:var(--muted);font-size:.875rem}
.chat{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.5rem}.chat li{display:flex;flex-direction:column;align-items:flex-start}.chat li.me{align-items:flex-end}.bub{max-width:85%;border-radius:1rem;padding:.5rem .75rem;font-size:.875rem;background:var(--soft)}.me .bub{background:var(--pill);color:var(--pill-fg)}.who{font-size:.75rem;color:var(--muted);padding:0 .25rem}.at{font-size:10px;color:var(--muted);padding:0 .25rem}
.chk{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.5rem}.chk label{display:flex;align-items:center;gap:.75rem;border:1px solid var(--line);border-radius:.75rem;padding:.75rem 1rem;font-size:.875rem;cursor:pointer}.chk input{width:1.25rem;height:1.25rem;accent-color:var(--pill)}.chk .done{color:var(--muted);text-decoration:line-through}
.sendrow{display:flex;gap:.5rem}.sendrow input{border-radius:999px;min-width:0;flex:1}
.mchip{display:inline-flex;gap:.25rem;border:1px solid var(--line);border-radius:999px;padding:.125rem .5rem;font-size:.75rem}
hr{border:0;border-top:1px solid var(--line);margin:0}
`;

const js = `
${artJs}
${matchJs}
const M=${JSON.stringify(messages)};
const PK=${JSON.stringify(packages)};
const DP=${JSON.stringify(departures)};
const PL=${JSON.stringify(places)};
const POOL=${JSON.stringify(POOL)};
const CHAT={ko:["안녕하세요! 잘 부탁드려요 🙌","혹시 유심 어디서 사세요? 공항에서 사면 되나요?","저는 eSIM 미리 샀어요. 체크리스트에 링크 있어요","별 보려면 삼각대 챙기는 게 좋대요"],en:["Hi everyone! Looking forward to it 🙌","Where do you buy a SIM? At the airport?","I got an eSIM in advance, link is in the checklist","Bring a tripod for the stars, apparently"]};

// ---- storage (per viewer, may be unavailable) ----
const S={get(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}},del(k){try{localStorage.removeItem(k)}catch{}}};
let locale=S.get("locale","ko"); if(!(locale in M)) locale="ko";
const m=()=>M[locale];
const t=(s,v)=>s.replace(/\\{(\\w+)\\}/g,(_,k)=>k in v?String(v[k]):"{"+k+"}");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const krw=n=>new Intl.NumberFormat("ko-KR").format(n)+"원";
const TZ="Asia/Seoul", LT={ko:"ko-KR",en:"en-US"};
const pd=iso=>{const[y,mo,d]=iso.split("-").map(Number);return new Date(Date.UTC(y,mo-1,d,12))};
const fDay=iso=>new Intl.DateTimeFormat(LT[locale],{month:"short",day:"numeric",weekday:"short",timeZone:TZ}).format(pd(iso));
const fMonth=iso=>new Intl.DateTimeFormat(LT[locale],{year:"numeric",month:"long",timeZone:TZ}).format(pd(iso));
const addDays=(iso,n)=>{const[y,mo,d]=iso.split("-").map(Number);return new Date(Date.UTC(y,mo-1,d+n)).toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:TZ}).format(new Date());

// ---- data helpers (mirror src/server/catalog.ts, members.ts, session.ts) ----
const pkgOf=slug=>PK.find(p=>p.slug===slug);
const depOf=id=>DP.find(d=>d.id===id);
const placeOf=k=>PL[k];
const user=()=>S.get("demo_user",null);
const profile=()=>S.get("demo_profile",null);
const bookings=()=>S.get("demo_bookings",[]);
const bookingFor=depId=>bookings().find(b=>b.departureId===depId);
const isMemberOf=depId=>{const b=bookingFor(depId);return !!user()&&!!b&&b.status!=="pending_deposit"};
const others=d=>d.members.filter(i=>i>=0&&i<POOL.length).map(i=>({...POOL[i],index:i,intro:POOL[i].intro[locale]}));
const booked=d=>others(d).length+(isMemberOf(d.id)?1:0);
const left=d=>Math.max(0,d.capacity-booked(d));
const joinable=d=>(d.status==="open"||d.status==="confirmed")&&left(d)>0;
const remainderDue=(bk,dep)=>{const due=addDays(dep,-7);return daysBetween(bk,due)<0?{dueDate:bk,payWithDeposit:true}:{dueDate:due,payWithDeposit:false}};
const title=p=>locale==="ko"?p.title.ko:p.title.en;
const mapOpts=()=>{const cs=getComputedStyle(document.documentElement);return{fg:cs.getPropertyValue("--fg").trim()||"#18181b",muted:"rgba(128,128,128,.6)",accent:"#c2452a",land:"rgba(128,128,128,.15)"}};
const art=(scene,seed,t,cls="")=>\`<div class="art \${cls}">\${ART.sceneSvg(scene,seed,t)}</div>\`;
const routeOf=p=>p.itinerary.map(d=>{const pl=placeOf(d.place);return{lat:pl.lat,lon:pl.lon,label:pl[locale],day:d.day}});

// ---- routing: #home #packages #p-<slug> #login #join-<id> #pay-<bk> #my #group-<id> #match ----
const go=h=>{location.hash=h};
function route(){const h=(location.hash||"#home").slice(1);const [k,...rest]=h.split("-");const arg=rest.join("-");
  const views={home,packages,p:pkg,login,join,pay,my,group,match};
  const v=views[k]||home; document.getElementById("app").innerHTML=v(arg); document.documentElement.lang=locale; window.scrollTo(0,0); bind();}
window.addEventListener("hashchange",route);

// ---- shared pieces ----
function header(){const x=m(),u=user();return \`<div class="top">
 <div class="row between"><a class="brand" href="#home">\${esc(x.app.name)}<span class="demo">\${esc(x.nav.demo)}</span></a>
  <nav class="row" style="gap:.25rem" aria-label="\${esc(x.nav.language)}">\${Object.keys(M).map(l=>\`<button class="pill\${l===locale?" on":""}" data-locale="\${l}">\${esc(x.nav.locales[l])}</button>\`).join("")}</nav></div>
 <nav class="row" style="gap:.25rem;flex-wrap:wrap"><a class="pill" href="#packages">\${esc(x.nav.packages)}</a><a class="pill" href="#match">\${esc(x.nav.match)}</a><a class="pill" href="#my">\${esc(x.nav.my)}</a><span style="flex:1"></span>
  \${u?\`<span class="small">\${esc(u.name)}</span><button class="pill" data-logout>\${esc(x.nav.logout)}</button>\`:\`<a class="pill" href="#login">\${esc(x.nav.login)}</a>\`}</nav></div>\`}
const matchTag=(score,label)=>\`<span class="tag num \${score>=80?"ok":score>=60?"info":"grey"}" style="font-weight:600">\${esc(label)}</span>\`;
function pkgCard(p){const x=m();return \`<a class="card" href="#p-\${p.slug}">
 <div class="hero">\${art(p.hero,p.slug.length,title(p))}</div>
 <div class="row between" style="align-items:flex-start"><div class="col" style="gap:.25rem"><span class="badge">\${esc(p.badge[locale])}</span><h2 style="font-size:1.125rem">\${esc(title(p))}</h2></div><span class="tag grey">\${esc(t(x.packages.daysNights,{days:p.days,nights:p.nights}))}</span></div>
 <p class="small muted">\${esc(p.summary[locale])}</p>
 <dl><div><dt>\${esc(x.packages.perPerson)}</dt><dd class="b num">\${krw(p.priceRangeKrw[0])} – \${krw(p.priceRangeKrw[1])}</dd></div>
 <div><dt>\${esc(x.packages.deposit)}</dt><dd class="num">\${krw(p.flightPortionKrw[0])} – \${krw(p.flightPortionKrw[1])}</dd></div>
 <div><dt>\${esc(x.packages.season)}</dt><dd>\${esc(p.seasonLabel[locale])}</dd></div></dl>
 <span class="small b">\${esc(x.packages.viewDepartures)} →</span></a>\`}

// ---- views ----
function home(){const x=m();const steps=[x.home.steps.browse,x.home.steps.join,x.home.steps.deposit,x.home.steps.installments];
 return \`<main>\${header()}<section class="col">\${art("stars",7,x.home.title)}<h1>\${esc(x.home.title)}</h1><p class="muted">\${esc(x.app.tagline)}</p><div class="row wrap"><a class="btn sm" href="#match">\${esc(x.home.matchCta)}</a><a class="btn sm ghost" href="#packages">\${esc(x.home.cta)}</a></div></section>
 <ol class="steps">\${steps.map((s,i)=>\`<li><span class="n">\${i+1}</span><span>\${esc(s)}</span></li>\`).join("")}</ol>
 <section class="col"><h2>\${esc(x.packages.heading)}</h2>\${PK.map(pkgCard).join("")}</section></main>\`}
function packages(){const x=m();return \`<main>\${header()}<section class="col" style="gap:.5rem"><h1>\${esc(x.packages.heading)}</h1><p class="small muted">\${esc(x.packages.lead)}</p></section><div class="col">\${PK.map(pkgCard).join("")}</div></main>\`}
function depCard(d){const x=m();const b=booked(d),l=left(d),j=joinable(d);const st=b>=d.capacity?"full":d.status;const cls={open:"ok",confirmed:"info",full:"grey",cancelled:"bad",completed:"grey"}[st];
 const end=addDays(d.startDate,pkgOf(d.packageSlug).days-1);
 return \`<li class="card"><div class="row between" style="align-items:flex-start"><p class="b">\${fDay(d.startDate)} – \${fDay(end)}</p><span class="tag \${cls}">\${esc(x.departure.status[st])}</span></div>
 <div class="row small"><span class="dots" aria-hidden="true">\${Array.from({length:d.capacity},(_,i)=>\`<span class="dot\${i<b?" f":""}"></span>\`).join("")}</span><span class="num">\${esc(t(x.departure.seats,{booked:b,capacity:d.capacity}))}</span>\${j?\`<span class="muted">· \${esc(t(x.departure.seatsLeft,{n:l}))}</span>\`:""}</div>
 \${st==="open"?\`<p class="xs muted">\${esc(t(x.departure.minToConfirm,{n:d.minToConfirm}))}</p>\`:""}
 <dl><div><dt>\${esc(x.departure.totalLabel)}</dt><dd class="b num">\${krw(d.priceKrw)}</dd></div><div><dt>\${esc(x.departure.depositLabel)}</dt><dd class="num">\${krw(d.depositKrw)}</dd></div></dl>
 <a class="small muted" href="#group-\${d.id}">\${esc(x.departure.group)} →</a>
 \${j?\`<a class="btn sm" href="#join-\${d.id}">\${esc(x.departure.join)}</a>\`:\`<span class="btn sm ghost" style="opacity:.6">\${esc(x.departure.status[st])}</span>\`}</li>\`}
function pkg(slug){const x=m(),p=pkgOf(slug);if(!p)return home();const deps=DP.filter(d=>d.packageSlug===slug).sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const groups={};for(const d of deps){(groups[d.startDate.slice(0,7)]??=[]).push(d)}
 return \`<main>\${header()}<nav class="small"><a class="muted" href="#packages">← \${esc(x.nav.packages)}</a></nav>
 \${art(p.hero,p.slug.length,title(p))}
 <section class="col"><span class="badge">\${esc(p.badge[locale])}</span><div class="row between" style="align-items:flex-start"><h1>\${esc(title(p))}</h1><span class="tag grey">\${esc(t(x.packages.daysNights,{days:p.days,nights:p.nights}))}</span></div>
 <p class="muted">\${esc(p.summary[locale])}</p><ul class="chips">\${p.highlights[locale].map(h=>\`<li>\${esc(h)}</li>\`).join("")}</ul></section>
 <section class="soft"><div class="row between"><span class="small muted">\${esc(x.detail.price)} · \${esc(x.packages.perPerson)}</span><span class="b num" style="font-size:1.125rem">\${krw(p.priceRangeKrw[0])} – \${krw(p.priceRangeKrw[1])}</span></div>
 <div class="row between"><span class="small muted">\${esc(x.packages.deposit)}</span><span class="b num">\${krw(p.flightPortionKrw[0])} – \${krw(p.flightPortionKrw[1])}</span></div>
 <p class="xs muted">\${esc(x.packages.depositHint)}</p><p class="xs muted">\${esc(x.detail.remaining)}</p><p class="xs muted">\${esc(x.detail.priceNote)}</p></section>
 <section class="col"><h2>\${esc(x.detail.route)}</h2><div class="map">\${ART.routeMapSvg(routeOf(p),mapOpts())}</div><p class="xs muted">\${esc(x.detail.routeNote)}</p></section>
 <section class="col"><h2>\${esc(x.detail.itinerary)}</h2><ol class="itin">\${p.itinerary.map(d=>{const pl=placeOf(d.place);return\`<li>\${art(pl.scene,d.day*13+p.slug.length,pl[locale],"thumb")}<div class="col" style="gap:.125rem;min-width:0"><span class="xs muted b">\${esc(t(x.detail.day,{n:d.day}))} · \${esc(pl[locale])}</span><p class="small">\${esc(locale==="ko"?d.titleKo:d.title)}</p>\${(locale==="ko"?d.stayKo:d.stay)?\`<p class="xs muted">\${esc(x.detail.stay)}: \${esc(locale==="ko"?d.stayKo:d.stay)}</p>\`:""}</div></li>\`}).join("")}</ol></section>
 <section class="col"><h2>\${esc(x.detail.included)}</h2><ul class="inc">\${p.included[locale].map(i=>\`<li>\${esc(i)}</li>\`).join("")}</ul></section>
 <section class="col" id="departures"><h2>\${esc(x.detail.departures)}</h2>\${Object.entries(groups).map(([k,list])=>\`<section class="col"><h3>\${fMonth(list[0].startDate)}</h3><ul class="col" style="list-style:none;padding:0;margin:0">\${list.map(depCard).join("")}</ul></section>\`).join("")}</section></main>\`}
function login(){const x=m();const next=S.get("next","#my");
 return \`<main>\${header()}<section class="col" style="gap:.5rem"><h1>\${esc(x.login.heading)}</h1><p class="small muted">\${esc(x.login.lead)}</p></section>
 <form class="col" style="gap:1rem" data-login data-next="\${esc(next)}"><label class="f"><span>\${esc(x.login.name)}</span><input id="login-name" name="name" required maxlength="40" autocomplete="nickname" placeholder="\${esc(x.login.namePlaceholder)}"></label>
 <button class="btn kakao" name="provider" value="kakao">\${esc(x.login.kakao)}</button><button class="btn naver" name="provider" value="naver">\${esc(x.login.naver)}</button></form></main>\`}
function join(id){const x=m(),d=depOf(id);if(!d)return home();const p=pkgOf(d.packageSlug),u=user(),ex=bookingFor(id),j=joinable(d);
 const rem=d.priceKrw-d.depositKrw,{dueDate,payWithDeposit}=remainderDue(today(),d.startDate),payToday=d.depositKrw+(payWithDeposit?rem:0);
 const end=addDays(d.startDate,p.days-1);
 let cta;
 if(ex&&ex.status!=="pending_deposit")cta=\`<p class="small muted" style="text-align:center">\${esc(x.join.alreadyJoined)}</p><a class="btn" href="#my">\${esc(x.join.goMy)}</a>\`;
 else if(!u)cta=\`<p class="small muted" style="text-align:center">\${esc(x.join.loginFirst)}</p><button class="btn" data-login-next="#join-\${d.id}">\${esc(x.join.login)}</button>\`;
 else cta=\`<button class="btn" data-start="\${d.id}" \${j?"":"disabled"}>\${esc(payWithDeposit?x.join.ctaFull:x.join.cta)} · \${krw(payToday)}</button>\`;
 return \`<main>\${header()}<nav class="small"><a class="muted" href="#p-\${p.slug}">← \${esc(x.join.back)}</a></nav>
 <section class="col" style="gap:.5rem"><h1>\${esc(x.join.heading)}</h1><p class="b">\${esc(title(p))}</p><p class="small muted">\${fDay(d.startDate)} – \${fDay(end)}</p></section>
 \${j?"":\`<p role="status" class="banner bad">\${esc(x.join.notJoinable)}</p>\`}
 <section class="soft"><h2 class="small muted" style="font-size:.875rem">\${esc(x.join.summary)}</h2><dl><div><dt>\${esc(x.join.total)}</dt><dd class="num">\${krw(d.priceKrw)}</dd></div><div><dt>\${esc(x.join.deposit)}</dt><dd class="num">\${krw(d.depositKrw)}</dd></div><div><dt>\${esc(x.join.remainder)}</dt><dd class="num">\${krw(rem)}</dd></div></dl><hr><div class="row between"><span class="b">\${esc(x.join.today)}</span><span class="b num" style="font-size:1.125rem">\${krw(payToday)}</span></div><p class="xs muted">\${esc(x.join.seatHold)}</p></section>
 \${rem>0?\`<section class="col"><h2>\${esc(x.join.schedule)}</h2>\${payWithDeposit?\`<p class="small muted">\${esc(x.join.payInFull)}</p>\`:\`<div class="card" style="flex-direction:row;align-items:center;justify-content:space-between"><div class="col" style="gap:.125rem"><span class="small b">\${esc(x.join.remainderDue)}</span><span class="xs muted">\${fDay(dueDate)}</span></div><span class="b num">\${krw(rem)}</span></div>\`}<p class="small muted">\${esc(x.join.remainderHow)}</p><p class="xs muted">\${esc(x.join.scheduleHint)}</p></section>\`:""}
 <div class="col" style="gap:.5rem">\${cta}</div></main>\`}
function pay(bkId){const x=m(),u=user();if(!u)return login();const b=bookings().find(b=>b.id===bkId);if(!b)return my();const d=depOf(b.departureId),p=pkgOf(d.packageSlug);
 let type,amount;if(b.status==="pending_deposit"){type=b.payFull||b.remainderKrw===0?"full":"deposit";amount=type==="full"?b.totalKrw:b.depositKrw}else if(b.status==="seat_held"){type="remainder";amount=b.remainderKrw}else return my();
 const end=addDays(d.startDate,p.days-1);const methods=["card","tosspay","kakaopay","naverpay"];const inst=type!=="deposit";
 return \`<main>\${header()}<section class="col" style="gap:.5rem"><h1>\${esc(x.pay.heading)}</h1><p class="note">\${esc(x.pay.demoNote)}</p></section>
 <form class="col" style="gap:1.5rem" data-pay="\${b.id}" data-type="\${type}">
 <section class="tossbox"><div class="row between"><span class="small b" style="color:var(--toss)">toss payments</span><span class="xs muted">\${esc({deposit:x.pay.deposit,remainder:x.pay.remainder,full:x.pay.full}[type])}</span></div><p class="small" style="margin-top:.5rem">\${esc(t(x.pay.orderName,{pkg:title(p),date:fDay(d.startDate)+" – "+fDay(end)}))}</p><p class="b num" style="font-size:1.5rem;margin-top:.25rem">\${krw(amount)}</p></section>
 <fieldset><legend>\${esc(x.pay.method)}</legend><div class="methods">\${methods.map((k,i)=>\`<label class="\${i===0?"on":""}"><input type="radio" name="method" value="\${k}" \${i===0?"checked":""}>\${esc(x.pay[k])}</label>\`).join("")}</div></fieldset>
 \${inst?\`<fieldset data-inst><legend>\${esc(x.pay.installment)}</legend><select id="installment-months" name="months" aria-label="\${esc(x.pay.installment)}">\${[0,2,3,4,5,6].map(n=>\`<option value="\${n}">\${esc(n===0?x.pay.lump:t(x.pay.months,{n}))}</option>\`).join("")}</select><p class="xs muted" style="margin-top:.5rem">\${esc(x.pay.installmentNote)}</p></fieldset>\`:""}
 <div class="col" style="gap:.5rem"><button class="btn toss">\${esc(t(x.pay.pay,{amount:krw(amount)}))}</button><button type="button" class="pill" data-cancel="\${b.id}" style="align-self:center">\${esc(x.pay.cancel)}</button></div></form></main>\`}
function my(){const x=m(),u=user();const paid=S.get("paid_flash",null);S.del("paid_flash");const list=u?bookings():[];
 const via=(method,months)=>months>1?t(x.my.installmentVia,{n:months}):method?t(x.my.paidVia,{method:x.pay[method]}):"";
 return \`<main>\${header()}<h1>\${esc(x.my.heading)}</h1>\${paid?\`<p role="status" class="banner ok">\${esc(x.my.paidBanner)}</p>\`:""}
 \${!u||!list.length?\`<section class="col"><p class="small muted">\${esc(x.my.empty)}</p>\${u?"":\`<button class="btn sm fit" data-login-next="#my">\${esc(x.nav.login)}</button>\`}<a class="btn sm ghost fit" href="#packages">\${esc(x.my.browse)}</a></section>\`:
 \`<ul class="col" style="list-style:none;padding:0;margin:0;gap:1rem">\${list.map(b=>{const d=depOf(b.departureId),p=pkgOf(d.packageSlug),end=addDays(d.startDate,p.days-1);const cls={pending_deposit:"warn",seat_held:"info",paid_in_full:"ok"}[b.status];
  return \`<li class="card"><div class="row between" style="align-items:flex-start"><div class="col" style="gap:.125rem"><p class="b">\${esc(title(p))}</p><p class="small muted">\${fDay(d.startDate)} – \${fDay(end)}</p></div><span class="tag \${cls}">\${esc(x.my.status[b.status])}</span></div>
  <dl><div><dt>\${esc(x.join.total)}</dt><dd class="num">\${krw(b.totalKrw)}</dd></div><div><dt>\${esc(x.join.deposit)}</dt><dd class="num" style="text-align:right">\${krw(b.depositKrw)}\${b.status!=="pending_deposit"&&b.depositMethod?\`<span class="xs muted" style="display:block">\${esc(via(b.depositMethod,0))}</span>\`:""}</dd></div><div><dt>\${esc(x.join.remainder)}</dt><dd class="num" style="text-align:right">\${krw(b.remainderKrw)}\${b.status==="paid_in_full"&&b.remainderKrw>0?\`<span class="xs muted" style="display:block">\${esc(via(b.remainderMethod,b.remainderInstallmentMonths))}</span>\`:""}</dd></div></dl>
  \${b.status==="seat_held"?\`<p class="small">\${esc(t(x.my.remainderDue,{amount:krw(b.remainderKrw),date:fDay(b.remainderDue)}))}</p>\`:""}
  <div class="row wrap">\${b.status==="pending_deposit"?\`<a class="btn sm" href="#pay-\${b.id}">\${esc(x.my.continueDeposit)}</a><button class="btn sm ghost" data-cancel="\${b.id}">\${esc(x.my.cancel)}</button>\`:""}\${b.status==="seat_held"?\`<a class="btn sm" href="#pay-\${b.id}">\${esc(x.my.payRemainder)}</a>\`:""}\${b.status!=="pending_deposit"?\`<a class="btn sm ghost" href="#group-\${d.id}">\${esc(x.my.group)}</a>\`:""}</div></li>\`}).join("")}</ul>\`}</main>\`}
function group(id){const x=m(),d=depOf(id);if(!d)return home();const p=pkgOf(d.packageSlug),u=user(),pr=profile(),isMember=isMemberOf(id);
 const os=others(d);const bk=os.length+(isMember?1:0),l=Math.max(0,d.capacity-bk),confirmed=d.status==="confirmed"||bk>=d.minToConfirm,dday=daysBetween(today(),d.startDate);
 const end=addDays(d.startDate,p.days-1);const chatSeed=os.length?CHAT[locale].slice(0,Math.min(4,os.length+1)).map((body,i)=>({author:os[i%os.length].name,body,at:(9+i)+":"+String((i*17)%60).padStart(2,"0")})):[];
 const mine=S.get("chat:"+id,[]),done=S.get("checklist:"+id,{});const items=Object.entries(x.group.items);const cnt=items.filter(([k])=>done[k]).length;
 return \`<main>\${header()}\${art(p.hero,d.startDate.length+d.id.length,title(p))}<section class="col" style="gap:.5rem"><h1>\${esc(x.group.heading)}</h1><p class="b">\${esc(title(p))}</p><p class="small muted">\${fDay(d.startDate)} – \${fDay(end)}</p>
 <div class="row wrap" style="margin-top:.25rem"><span class="tag \${confirmed?"ok":"warn"}" style="padding:.25rem .75rem;font-size:.875rem">\${esc(confirmed?x.group.confirmed:t(x.group.needMore,{n:d.minToConfirm-bk}))}</span><span class="tag grey num" style="padding:.25rem .75rem;font-size:.875rem">\${esc(dday>0?t(x.group.countdown,{n:dday}):x.group.today)}</span></div></section>
 <section class="col"><div class="row between" style="align-items:baseline"><h2>\${esc(x.group.members)}</h2><span class="small muted num">\${esc(t(x.group.seats,{booked:bk,capacity:d.capacity,left:l}))}</span></div>
 \${pr?"":\`<p class="xs muted">\${esc(x.group.matchHint)} <a href="#match">\${esc(x.group.setProfile)}</a></p>\`}
 <ul class="col" style="list-style:none;padding:0;margin:0;gap:.5rem">\${os.map(q=>{const sc=pr?MATCH.pairMatch(pr,q.profile).score:null;return\`<li class="member"><span class="av">\${esc(q.name.slice(0,1))}</span><div class="col" style="gap:.125rem;min-width:0;flex:1"><span class="small b">\${esc(q.name)} <span class="xs muted" style="font-weight:400">\${esc(q.age)}\${q.profile.mbti?" · "+q.profile.mbti:""}</span></span><span class="xs muted">\${esc(q.intro)}</span></div>\${sc!==null?matchTag(sc,t(x.group.match,{n:sc})):""}</li>\`}).join("")}
 \${isMember?\`<li class="member"><span class="av me">\${esc(u.name.slice(0,1))}</span><span class="small b">\${esc(u.name)} <span class="xs muted" style="font-weight:400">(\${esc(x.group.you)})\${pr&&pr.mbti?" · "+pr.mbti:""}</span></span></li>\`:""}
 \${Array.from({length:l},()=>\`<li class="empty">·</li>\`).join("")}</ul></section>
 \${isMember?\`<section class="col"><h2>\${esc(x.group.chat)}</h2><ol class="chat">\${[...chatSeed,...mine].map(c=>\`<li class="\${c.author===u.name?"me":""}">\${c.author===u.name?"":\`<span class="who">\${esc(c.author)}</span>\`}<div class="bub">\${esc(c.body)}</div><span class="at">\${esc(c.at)}</span></li>\`).join("")}</ol>
  <form class="sendrow" data-chat="\${id}"><input id="chat-input" aria-label="\${esc(x.group.chatPlaceholder)}" placeholder="\${esc(x.group.chatPlaceholder)}"><button class="btn sm">\${esc(x.group.send)}</button></form><p class="xs muted">\${esc(x.group.chatNote)}</p></section>
  <section class="col"><div class="row between" style="align-items:baseline"><h2>\${esc(x.group.checklist)}</h2><span class="small muted num">\${cnt}/\${items.length}</span></div><ul class="chk">\${items.map(([k,label])=>\`<li><label><input type="checkbox" data-check="\${id}" data-key="\${k}" \${done[k]?"checked":""}><span class="\${done[k]?"done":""}">\${esc(label)}</span></label></li>\`).join("")}</ul><p class="xs muted">\${esc(x.group.checklistNote)}</p></section>\`
 :\`<section class="soft"><p class="small">\${esc(x.group.notMember)}</p><a class="btn sm fit" href="#join-\${id}">\${esc(x.group.join)}</a></section>\`}</main>\`}
function match(){const x=m(),pr=profile();const saved=S.get("profile_flash",null);S.del("profile_flash");const edit=S.get("profile_edit",false);
 const optLabel=(k,v)=>(x.match.a[k]||{})[v]||v;
 if(!pr||edit){S.del("profile_edit");const cur=pr;
  return \`<main>\${header()}<section class="col" style="gap:.5rem"><h1>\${esc(x.match.heading)}</h1><p class="small muted">\${esc(x.match.lead)}</p></section>
  <form class="col" style="gap:1.5rem" data-profile>
  \${MATCH.QUESTION_KEYS.map(k=>\`<fieldset><legend>\${esc(x.match.q[k])}</legend><div class="opts">\${MATCH.OPTIONS[k].map((v,i)=>\`<label><input type="radio" name="\${k}" value="\${v}" \${cur?(cur[k]===v?"checked":""):(i===0?"checked":"")}>\${esc(optLabel(k,v))}</label>\`).join("")}</div></fieldset>\`).join("")}
  <fieldset><legend>\${esc(x.match.gender)}</legend><div class="opts">\${[["f",x.match.genderF],["m",x.match.genderM],["other",x.match.genderO]].map(([g,l],i)=>\`<label><input type="radio" name="gender" value="\${g}" \${cur?(cur.gender===g?"checked":""):(i===0?"checked":"")}>\${esc(l)}</label>\`).join("")}</div></fieldset>
  <label class="f"><span>\${esc(x.match.mbti)}</span><input id="mbti" name="mbti" maxlength="4" value="\${esc(cur?cur.mbti:"")}" placeholder="\${esc(x.match.mbtiPlaceholder)}" autocapitalize="characters" style="text-transform:uppercase"><span class="xs muted" style="font-weight:400">\${esc(x.match.mbtiHint)}</span></label>
  <button class="btn">\${esc(x.match.submit)}</button></form></main>\`}
 const rows=DP.filter(joinable).map(d=>{const p=pkgOf(d.packageSlug),os=others(d);const g=MATCH.groupMatch(pr,os.map(o=>o.profile));return{d,p,os,g}}).sort((a,b)=>((b.g?b.g.score:-1)-(a.g?a.g.score:-1)));
 return \`<main>\${header()}<section class="col" style="gap:.5rem"><h1>\${esc(x.match.results)}</h1><p class="small muted">\${esc(x.match.resultsLead)}</p>\${saved?\`<p role="status" class="banner ok" style="padding:.75rem">\${esc(x.match.saved)}</p>\`:""}
 <div class="row wrap xs" style="align-items:center">\${pr.mbti?\`<span class="tag grey b">\${esc(pr.mbti)}</span>\`:""}\${MATCH.QUESTION_KEYS.map(k=>\`<span class="tag grey">\${esc(optLabel(k,pr[k]))}</span>\`).join("")}<button class="pill" data-edit-profile style="padding:0;text-decoration:underline">\${esc(x.match.edit)}</button></div></section>
 <ol class="col" style="list-style:none;padding:0;margin:0;gap:1rem">\${rows.map(({d,p,os,g})=>{const end=addDays(d.startDate,p.days-1);
  return \`<li class="card"><div class="row between" style="align-items:flex-start"><div class="col" style="gap:.125rem"><p class="b">\${esc(title(p))}</p><p class="small muted">\${fDay(d.startDate)} – \${fDay(end)}</p></div>\${g?matchTag(g.score,t(x.match.score,{n:g.score})):\`<span class="tag grey">\${esc(x.match.empty)}</span>\`}</div>
  \${os.length?\`<div class="row wrap" style="gap:.375rem">\${os.map((o,i)=>{const s=g?g.perMember.find(q=>q.index===i):null;return\`<span class="mchip"><span class="b">\${esc(o.name)}</span>\${o.profile.mbti?\`<span class="muted">\${o.profile.mbti}</span>\`:""}\${s?\`<span class="muted num">\${s.score}%</span>\`:""}</span>\`}).join("")}</div>\`:""}
  \${g&&g.topReasons.length?\`<p class="xs muted">\${esc(x.match.reasons)}: \${g.topReasons.map(r=>esc(x.match.reason[r])).join(" · ")}</p>\`:""}
  \${g&&!g.mixOk?\`<p class="xs" style="color:var(--warn-fg)">\${esc(x.match.mixWarn)}</p>\`:""}
  <p class="small muted num">\${esc(t(x.departure.seats,{booked:booked(d),capacity:d.capacity}))} · \${esc(t(x.departure.seatsLeft,{n:left(d)}))} · \${krw(d.priceKrw)}</p>
  <div class="row" style="gap:.5rem"><a class="btn sm" href="#join-\${d.id}">\${esc(x.match.join)}</a><a class="btn sm ghost" href="#group-\${d.id}">\${esc(x.match.viewGroup)}</a></div></li>\`}).join("")}</ol></main>\`}

// ---- behaviour ----
function bind(){const app=document.getElementById("app");
 app.querySelectorAll("[data-locale]").forEach(b=>b.onclick=()=>{locale=b.dataset.locale;S.set("locale",locale);document.title=m().app.name;route()});
 const lo=app.querySelector("[data-logout]");if(lo)lo.onclick=()=>{S.del("demo_user");go("#home");route()};
 app.querySelectorAll("[data-login-next]").forEach(b=>b.onclick=()=>{S.set("next",b.dataset.loginNext);go("#login")});
 const lf=app.querySelector("[data-login]");if(lf){let prov="kakao";lf.querySelectorAll("button[name=provider]").forEach(b=>b.onclick=()=>{prov=b.value});lf.onsubmit=e=>{e.preventDefault();const name=lf.name.value.trim();if(!name)return;S.set("demo_user",{id:"u_"+Math.random().toString(36).slice(2,8),name:name.slice(0,40),provider:prov});const next=lf.dataset.next||"#my";S.del("next");go(next);if(location.hash===next)route()}}
 const st=app.querySelector("[data-start]");if(st)st.onclick=()=>{const d=depOf(st.dataset.start);const ex=bookingFor(d.id);if(ex){go(ex.status==="pending_deposit"?"#pay-"+ex.id:"#my");return}
  const bk=today(),{dueDate,payWithDeposit}=remainderDue(bk,d.startDate);const b={id:"bk_"+Math.random().toString(36).slice(2,10),departureId:d.id,status:"pending_deposit",totalKrw:d.priceKrw,depositKrw:d.depositKrw,remainderKrw:d.priceKrw-d.depositKrw,remainderDue:dueDate,bookedOn:bk,payFull:payWithDeposit};S.set("demo_bookings",[...bookings(),b]);go("#pay-"+b.id)};
 app.querySelectorAll("[data-cancel]").forEach(b=>b.onclick=()=>{const id=b.dataset.cancel;const bk=bookings().find(x=>x.id===id);if(bk&&bk.status==="pending_deposit")S.set("demo_bookings",bookings().filter(x=>x.id!==id));go(bk?"#join-"+bk.departureId:"#my");route()});
 const pf=app.querySelector("[data-pay]");if(pf){pf.querySelectorAll(".methods input").forEach(r=>r.onchange=()=>{pf.querySelectorAll(".methods label").forEach(l=>l.classList.toggle("on",l.querySelector("input").checked));const inst=pf.querySelector("[data-inst]");if(inst)inst.style.display=pf.method.value==="card"?"":"none"});
  pf.onsubmit=e=>{e.preventDefault();const id=pf.dataset.pay,type=pf.dataset.type,method=pf.method.value,months=pf.months&&method==="card"?Number(pf.months.value):0;const list=bookings();const i=list.findIndex(x=>x.id===id);if(i<0)return;const b=list[i];
   if(type==="remainder")list[i]={...b,status:"paid_in_full",remainderMethod:method,remainderInstallmentMonths:months};else{const full=type==="full";list[i]={...b,status:full?"paid_in_full":"seat_held",depositMethod:method,...(full?{remainderMethod:method,remainderInstallmentMonths:months}:{})}}
   S.set("demo_bookings",list);S.set("paid_flash",id);go("#my")}}
 const cf=app.querySelector("[data-chat]");if(cf)cf.onsubmit=e=>{e.preventDefault();const body=cf.querySelector("input").value.trim();if(!body)return;const n=new Date();S.set("chat:"+cf.dataset.chat,[...S.get("chat:"+cf.dataset.chat,[]),{author:user().name,body,at:n.getHours()+":"+String(n.getMinutes()).padStart(2,"0")}]);route()};
 app.querySelectorAll("[data-check]").forEach(c=>c.onchange=()=>{const k="checklist:"+c.dataset.check;const d=S.get(k,{});d[c.dataset.key]=c.checked;S.set(k,d);route()});
 const prf=app.querySelector("[data-profile]");if(prf)prf.onsubmit=e=>{e.preventDefault();const fd=new FormData(prf);const pick=k=>{const v=String(fd.get(k)||"");return MATCH.OPTIONS[k].includes(v)?v:MATCH.OPTIONS[k][0]};const mb=String(fd.get("mbti")||"").trim().toUpperCase();const g=String(fd.get("gender")||"f");
  S.set("demo_profile",{mbti:MATCH.isValidMbti(mb)?mb:"",pace:pick("pace"),food:pick("food"),drink:pick("drink"),wake:pick("wake"),photo:pick("photo"),budget:pick("budget"),mix:pick("mix"),gender:g==="m"?"m":g==="other"?"other":"f"});S.set("profile_flash",1);route()};
 const ep=app.querySelector("[data-edit-profile]");if(ep)ep.onclick=()=>{S.set("profile_edit",true);route()};
}
document.title=m().app.name;route();
`;

const html = `<title>${messages.ko.app.name}</title>
<style>${css}</style>
<div id="app"></div>
<script>${js}</script>
`;

mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
