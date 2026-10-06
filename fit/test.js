/* Тэнхээ — хөдөлгүүрийн шалгалт (Node, хамааралгүй).
   node fit/test.js                                  → бодит сан (fit/lib.js)
   FIT_LIB=./test-stub-lib.js node fit/test.js       → туршилтын жижиг сан */
"use strict";
var path = require("path");
var Lib = require(process.env.FIT_LIB ? path.resolve(__dirname, process.env.FIT_LIB) : "./lib.js");
process.env.FIT_LIB = process.env.FIT_LIB || "./lib.js";
var E = require("./engine.js");
var Foods = require("./foods.js");

var pass = 0, fail = 0, failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, msg + " (" + JSON.stringify(a) + " ≠ " + JSON.stringify(b) + ")"); }
var NOW = new Date("2026-10-06T08:00:00Z");

function base(over) {
  var p = {
    v: 1, name: "", goals: ["fatloss"], womens: null, metabolic: [], sex: "f", age: 34, heightCm: 165, weightKg: 68, waistCm: 84,
    daysPerWeek: 3, minutes: 20, equipment: ["mat", "wall", "chair"], space: "floor", parq: [false, false, false, false, false, false, false],
    pain: [], sleepHours: 7, stress: 3, occupation: "desk", failedBefore: false, cue: "Өглөө цайны дараа",
    diet: { mealsPerDay: 3, meatDaysPerWeek: 6, saltTeaCups: 3, vegServings: 1, sugaryDrinksPerDay: 1, snacksLate: true, budget: "mid" },
    tests: { pushups: null, pushupType: null, chairStand30: null, plankSec: null, balanceSec: null, toeTouch: null },
    prefs: { dislikes: [], likes: [] }, createdAt: "2026-09-01T00:00:00Z"
  };
  Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
  return p;
}

var PROFILES = {
  beginner_noeq: base({ goals: ["habit", "fitness_energy"], equipment: ["none"], minutes: 15, daysPerWeek: 3, failedBefore: true, weightKg: 80, waistCm: 95 }),
  desk_lowback_fatloss: base({ goals: ["fatloss", "posture_back"], pain: ["lowback"], sex: "m", age: 38, heightCm: 175, weightKg: 92, waistCm: 102, minutes: 30, daysPerWeek: 4, tests: { pushups: 10, pushupType: "full", chairStand30: 15, plankSec: 25, balanceSec: 20, toeTouch: "knee" } }),
  older_woman_htn: base({ goals: ["older_balance", "metabolic"], metabolic: ["htn"], age: 62, heightCm: 158, weightKg: 70, waistCm: 92, minutes: 20, daysPerWeek: 3, occupation: "home", tests: { pushups: null, chairStand30: 11, plankSec: null, balanceSec: 6, toeTouch: "shin" }, diet: { mealsPerDay: 3, meatDaysPerWeek: 7, saltTeaCups: 4, vegServings: 1, sugaryDrinksPerDay: 0, snacksLate: false, budget: "low" } }),
  pregnant_t2: base({ goals: ["womens", "fitness_energy"], womens: { stage: "pregnancy", trimester: 2, weeksPostpartum: null }, age: 29, weightKg: 66, waistCm: 90, minutes: 20, daysPerWeek: 3 }),
  postpartum_6w: base({ goals: ["womens", "fatloss"], womens: { stage: "postpartum", trimester: null, weeksPostpartum: 6 }, age: 31, weightKg: 72, waistCm: 92, minutes: 15, daysPerWeek: 3, sleepHours: 5 }),
  menopause_strength: base({ goals: ["womens", "muscle"], womens: { stage: "menopause", trimester: null, weeksPostpartum: null }, age: 52, weightKg: 66, waistCm: 86, minutes: 30, daysPerWeek: 3, equipment: ["mat", "chair", "band", "db"], tests: { pushups: 6, pushupType: "knee", chairStand30: 16, plankSec: 40, balanceSec: 25, toeTouch: "ankle" } }),
  male_muscle_db: base({ goals: ["muscle"], sex: "m", age: 27, heightCm: 178, weightKg: 74, waistCm: 82, minutes: 45, daysPerWeek: 4, equipment: ["mat", "db", "band", "chair", "wall"], occupation: "student", diet: { mealsPerDay: 3, meatDaysPerWeek: 5, saltTeaCups: 0, vegServings: 2, sugaryDrinksPerDay: 2, snacksLate: true, budget: "mid" }, tests: { pushups: 30, pushupType: "full", chairStand30: 22, plankSec: 90, balanceSec: 40, toeTouch: "floor" } }),
  student_stress: base({ goals: ["stress_sleep", "habit"], age: 21, weightKg: 55, heightCm: 162, waistCm: 70, sleepHours: 5, stress: 5, occupation: "student", minutes: 15, daysPerWeek: 4, equipment: ["mat"], diet: { mealsPerDay: 2, meatDaysPerWeek: 4, saltTeaCups: 1, vegServings: 1, sugaryDrinksPerDay: 2, snacksLate: true, budget: "low" } }),
  t2d_gout: base({ goals: ["metabolic", "fatloss"], metabolic: ["t2d", "gout"], sex: "m", age: 48, heightCm: 172, weightKg: 98, waistCm: 110, minutes: 20, daysPerWeek: 3, occupation: "shift" }),
  standing_only: base({ goals: ["fatloss"], space: "standing", equipment: ["wall", "chair"], minutes: 20, daysPerWeek: 3, occupation: "physical" }),
  busy_45_5: base({ goals: ["fitness_energy", "muscle"], sex: "m", age: 35, heightCm: 180, weightKg: 85, waistCm: 90, minutes: 45, daysPerWeek: 5, equipment: ["mat", "kb", "db", "band", "wall", "chair"], prefs: { dislikes: ["yoga"], likes: ["strength"] } }),
  parq_positive: base({ parq: [true, false, false, false, false, false, false], age: 45 }),
  teen: base({ goals: ["fatloss"], age: 16, weightKg: 70, heightCm: 168, waistCm: 85, minutes: 20, daysPerWeek: 3, occupation: "student" }),
  bmi17: base({ goals: ["fatloss", "mobility"], age: 24, weightKg: 46, heightCm: 165, waistCm: 64, minutes: 20, daysPerWeek: 3 }),
  mobility_yoga: base({ goals: ["mobility", "stress_sleep"], age: 40, minutes: 30, daysPerWeek: 3, pain: ["wrist", "neck"] }),
  event_5k: base({ goals: ["event_5k", "fitness_energy"], sex: "m", age: 33, heightCm: 176, weightKg: 78, waistCm: 86, minutes: 30, daysPerWeek: 4 })
};

// ───────── туслах шалгалтууд ─────────
function allItems(program) {
  var out = [];
  program.days.forEach(function (d) { if (d.session) d.session.blocks.forEach(function (b) { b.items.forEach(function (it) { out.push({ it: it, session: d.session, block: b.name, dow: d.dow }); }); }); });
  (program.snacks || []).forEach(function (s) { s.blocks.forEach(function (b) { b.items.forEach(function (it) { out.push({ it: it, session: s, block: b.name, dow: 0 }); }); }); });
  return out;
}
function totalSets(program) { return allItems(program).reduce(function (a, x) { return a + (x.it.sets || 1); }, 0); }
function flagsOf(p) { return E.contraFlags(p); }
function hasMongolian(s) { return /[А-Яа-яӨөҮүЁё]/.test(s || ""); }

Object.keys(PROFILES).forEach(function (name) {
  var p = PROFILES[name];
  var scr = E.screen(p);
  var a = E.assess(p, NOW);
  ok(a.level >= 1 && a.level <= 5, name + ": level муж");
  ok(a.why.length >= 2 && a.why.every(hasMongolian), name + ": assess.why монгол");
  ok(["ok", "watch", "high"].indexOf(a.whtrBand) >= 0, name + ": whtrBand");

  var flags = flagsOf(p);
  var programs = [];
  for (var w = 0; w < 4; w++) {
    var prog = E.buildProgram(p, a, { weekIndex: w, prev: programs[w - 1] || null, logs: [], now: NOW });
    programs.push(prog);
    eq(prog.weekIndex, w, name + ": weekIndex");
    eq(prog.days.length, 7, name + ": 7 өдөр");
    ok(hasMongolian(prog.title), name + ": title монгол");
    var items = allItems(prog);
    if (!scr.stop) ok(items.length > 0, name + " w" + w + ": дасгалтай");
    items.forEach(function (x) {
      var ex = Lib.byId(x.it.exId);
      ok(!!ex, name + " w" + w + ": id санд байна " + x.it.exId);
      if (!ex) return;
      var bad = ex.contra.filter(function (c) { return flags.indexOf(c) >= 0; });
      ok(bad.length === 0, name + " w" + w + ": contra зөрчил " + ex.id + " " + bad.join(","));
      ok(ex.equipment.every(function (e) { return p.equipment.indexOf(e) >= 0; }), name + ": хэрэгсэл " + ex.id + " [" + ex.equipment + "]");
      if (p.space === "standing") ok(["supine", "prone", "side"].indexOf(ex.position) < 0, name + ": зогсоо зайд хэвтээ дасгал " + ex.id);
      if (p.womens && p.womens.stage === "pregnancy" && p.womens.trimester >= 2) ok(["supine", "prone"].indexOf(ex.position) < 0, name + ": жирэмсэн хэвтээ " + ex.id);
      if (p.womens && p.womens.stage === "pregnancy") { ok(ex.impact === 0, name + ": жирэмсэн impact " + ex.id); ok(ex.level <= 2, name + ": жирэмсэн level " + ex.id); }
      if (p.womens && p.womens.stage === "postpartum" && p.womens.weeksPostpartum < 12) ok(ex.impact === 0, name + ": төрсний дараа impact " + ex.id);
      if (p.age >= 60) ok(ex.impact === 0, name + ": 60+ impact " + ex.id);
      ok(x.it.sets >= 1, name + ": sets ≥1 " + ex.id);
      ok(x.it.reps != null || x.it.seconds != null || x.it.breaths != null, name + ": давталт/сек/амьсгал " + ex.id);
      ok(Array.isArray(x.it.why) && x.it.why.length > 0 && x.it.why.every(hasMongolian), name + ": item.why монгол " + ex.id);
      ok(hasMongolian(E.describeItem(x.it)), name + ": describeItem " + ex.id);
    });
    prog.days.forEach(function (d) {
      ok(d.why.length > 0 && d.why.every(hasMongolian), name + ": day.why монгол");
      if (d.session) {
        ok(d.session.why.length > 0 && d.session.why.every(hasMongolian), name + ": session.why");
        var est = E.estimateMinutes(d.session);
        var target = d.session.minutes;
        if (d.kind === "session" && !scr.stop) {
          if (prog.phase === "deload") ok(est >= target * 0.5 && est <= target * 1.2, name + " w" + w + " deload " + d.session.title + ": " + est + " мин vs " + target);
          else ok(Math.abs(est - target) <= target * 0.2 + 0.05, name + " w" + w + " " + d.session.title + ": " + est + " мин vs " + target);
        }
      }
    });
    if (!scr.stop) {
      eq(prog.days.filter(function (d) { return d.kind === "session"; }).length, p.daysPerWeek, name + " w" + w + ": daysPerWeek хичээл");
      ok(prog.snacks.length === 2, name + ": 2 зууш");
      prog.snacks.forEach(function (s) { ok(E.estimateMinutes(s) <= 5.5, name + ": зууш ≤5 мин (" + E.estimateMinutes(s) + ")"); });
    }
  }
  // Детерминизм
  var again = E.buildProgram(p, a, { weekIndex: 1, prev: programs[0], logs: [], now: NOW });
  eq(JSON.stringify(again), JSON.stringify(programs[1]), name + ": детерминистик");
  // Deload: 4 дэх долоо хоног сет багасна
  if (!scr.stop) {
    eq(programs[3].phase, "deload", name + ": 4 дэх долоо хоног deload");
    ok(totalSets(programs[3]) < totalSets(programs[2]), name + ": deload сет бага (" + totalSets(programs[3]) + " < " + totalSets(programs[2]) + ")");
    ok(programs[0].stepsTarget <= programs[2].stepsTarget, name + ": алхам өсдөг");
    ok(programs[3].stepsTarget === programs[2].stepsTarget, name + ": deload-д алхам нэмэгдэхгүй");
  }

  // Хоол
  var n = E.nutrition(p, a, NOW);
  ok(n.bmr > 900 && n.tdee > n.bmr, name + ": bmr/tdee");
  ok(n.proteinG[0] >= Math.round(1.6 * p.weightKg) - 1 && n.proteinG[1] <= Math.round(2.2 * p.weightKg) + 1, name + ": уураг 1.6–2.2 г/кг " + n.proteinG);
  ok(n.targetKcal >= n.bmr, name + ": зорилт суурь солилцооноос доош биш");
  ok(n.meals.length === 4 && n.shopping.length >= 10 && n.shopping.length <= 15, name + ": 4 хоол, 10–15 дэлгүүр (" + n.shopping.length + ")");
  n.shopping.forEach(function (s) { ok(!!Foods.byId(s.foodId), name + ": shopping food " + s.foodId); ok(hasMongolian(s.note), name + ": shopping note"); });
  n.meals.forEach(function (m) { m.items.forEach(function (it) { ok(!!Foods.byId(it.foodId), name + ": meal food " + it.foodId); }); });
  ok(n.focus[n.focus.length - 1] !== undefined && n.focus.indexOf("protein") >= 0, name + ": focus protein");
  ok(n.why.every(hasMongolian), name + ": nutrition.why монгол");
  eq(JSON.stringify(E.nutrition(p, a, NOW)), JSON.stringify(n), name + ": nutrition детерминистик");
  var hs = n.hands; ok(hs.protein >= 1 && hs.veg >= 1 && hs.carb >= 1 && hs.fat >= 1, name + ": гарын порц");
});

// ───────── Тусгай шалгалтууд ─────────
(function () {
  var p = PROFILES.parq_positive, s = E.screen(p);
  ok(s.stop === true && s.ok === false, "PAR-Q: stop");
  ok(s.flags[0].code === "parq" && /эмч/i.test(s.flags[0].text), "PAR-Q: эмчийн текст");
  var prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 0, now: NOW });
  ok(prog.days.every(function (d) { return d.kind !== "session"; }), "PAR-Q: бүрэн хичээлгүй, зөвхөн алхалт");
  ok(prog.notes.some(function (t) { return /эмч/i.test(t); }), "PAR-Q: notes эмч");
})();
(function () {
  var n = E.nutrition(PROFILES.teen, E.assess(PROFILES.teen, NOW), NOW);
  eq(n.deficit, 0, "Өсвөр: дутагдалгүй"); ok(/18/.test(n.refuse || ""), "Өсвөр: refuse текст");
  n = E.nutrition(PROFILES.bmi17, E.assess(PROFILES.bmi17, NOW), NOW);
  eq(n.deficit, 0, "BMI 17: дутагдалгүй"); ok(/BMI/.test(n.refuse || ""), "BMI 17: refuse");
  n = E.nutrition(PROFILES.pregnant_t2, E.assess(PROFILES.pregnant_t2, NOW), NOW);
  eq(n.deficit, 0, "Жирэмсэн: дутагдалгүй"); ok(/Жирэмсэн/.test(n.refuse || ""), "Жирэмсэн: refuse");
  var pp5 = base({ goals: ["fatloss"], womens: { stage: "postpartum", trimester: null, weeksPostpartum: 5 } });
  n = E.nutrition(pp5, E.assess(pp5, NOW), NOW);
  eq(n.deficit, 0, "Төрсний дараа 5 д/х: дутагдалгүй");
  n = E.nutrition(PROFILES.postpartum_6w, E.assess(PROFILES.postpartum_6w, NOW), NOW);
  ok(n.refuse === null && n.deficit < 0, "Төрсний дараа 6 д/х: дутагдал зөвшөөрнө (" + n.deficit + ")");
  n = E.nutrition(PROFILES.desk_lowback_fatloss, E.assess(PROFILES.desk_lowback_fatloss, NOW), NOW);
  eq(n.deficit, -400, "Өөх хасах: −400"); eq(n.focus[0], "salt", "Давстай цай 3 аяга → салт эхэнд");
  eq(n.saltTeaCups.target, 1, "давс зорилт 1"); eq(n.saltTeaCups.weeks, 2, "давс 2 долоо хоног");
  ok(n.vitD.show === true, "10-р сар витамин D");
  ok(E.nutrition(PROFILES.desk_lowback_fatloss, null, new Date("2026-07-01")).vitD.show === false, "7-р сар витамин D үгүй");
  n = E.nutrition(PROFILES.t2d_gout, E.assess(PROFILES.t2d_gout, NOW), NOW);
  eq(n.deficit, -500, "WHtR high → −500");
  n = E.nutrition(PROFILES.male_muscle_db, E.assess(PROFILES.male_muscle_db, NOW), NOW);
  eq(n.deficit, 250, "Булчин: +250"); eq(n.focus[0], "sugar", "Чихэрлэг ундаа 2 → sugar эхэнд (давсгүй)");
  ok(n.focus.indexOf("salt") < 0, "давстай цай 0 → salt үгүй");
  n = E.nutrition(PROFILES.older_woman_htn, E.assess(PROFILES.older_woman_htn, NOW), NOW);
  eq(n.saltTeaCups.target, 0, "Даралт → давстай цай 0");
  ok(n.shopping.some(function (s) { return s.foodId === "nootsiin_makh"; }), "бага төсөв → нөөцийн мах");
  ok(n.shopping.some(function (s) { return /Сүү ХК|АПУ|Түмэн Шувуут|CU|Номин/.test(s.note); }), "дэлгүүрийн нэр, брэнд");
  var m = E.nutrition(PROFILES.male_muscle_db, null, NOW);
  ok(m.hands.protein >= 2, "эрэгтэй булчин → уураг ≥2 алга");
})();
(function () {
  var p = PROFILES.older_woman_htn, a = E.assess(p, NOW), prog = E.buildProgram(p, a, { weekIndex: 0, now: NOW });
  eq(a.level, 1, "62 нас тэнцвэр 6 сек → түвшин 1");
  ok(a.tests.balanceSec.band === "low", "тэнцвэр 6 сек low");
  ok(a.tests.chairStand30.band === "low", "сандлаас 11 удаа 60–64 эмэгтэй → low");
  var hasBalanceEveryDay = prog.days.every(function (d) {
    if (d.kind === "snack") return true;
    if (!d.session) return d.kind === "rest";
    return allItems({ days: [d], snacks: [] }).some(function (x) { var ex = Lib.byId(x.it.exId); return ex && ex.pattern === "balance"; }) || d.session.type === "yoga" || d.session.type === "walk";
  });
  ok(hasBalanceEveryDay, "60+: өдөр бүр тэнцвэр (хичээлд эсвэл зууш)");
  ok(prog.snacks.some(function (s) { return /Тэнцвэр/.test(s.title); }), "60+: тэнцвэрийн зууш");
  var strengthSess = prog.days.filter(function (d) { return d.session && (d.session.type === "mix" || d.session.type === "strength"); });
  ok(strengthSess.length >= 1, "60+ htn: хүчний хичээлтэй");
  var hasIso = strengthSess.some(function (d) { return d.session.blocks.some(function (b) { return b.items.some(function (it) { var ex = Lib.byId(it.exId); return ex && ex.unit === "seconds" && ex.type === "strength"; }); }); });
  ok(hasIso, "Даралт → изометрик дасгал (сек)");
  ok(allItems(prog).every(function (x) { return x.it.rest >= 0; }), "rest");
})();
(function () {
  var p = PROFILES.pregnant_t2, a = E.assess(p, NOW), prog = E.buildProgram(p, a, { weekIndex: 0, now: NOW });
  ok(a.level <= 2, "жирэмсэн түвшин ≤2");
  ok(prog.notes.some(function (t) { return /Жирэмсэн/.test(t); }), "жирэмсэн note");
  ok(allItems(prog).every(function (x) { var ex = Lib.byId(x.it.exId); return ex.contra.indexOf("pregnancy") < 0; }), "жирэмсэн contra");
  var pp = PROFILES.postpartum_6w, ap = E.assess(pp, NOW), pr = E.buildProgram(pp, ap, { weekIndex: 0, now: NOW });
  var titles = pr.days.filter(function (d) { return d.session; }).map(function (d) { return d.session.title; });
  ok(titles.some(function (t) { return /сэргээлт/i.test(t); }), "төрсний дараа: сэргээлтийн хичээл " + titles.join(","));
  ok(allItems(pr).some(function (x) { return /pelvic|kegel|аарцаг/i.test(x.it.exId + (Lib.byId(x.it.exId) || {}).name); }), "төрсний дараа: аарцагны ёроол");
  ok(pr.notes.some(function (t) { return /Нойр 5/.test(t); }), "нойр 5 цаг → сет −1 тэмдэглэл");
})();
(function () {
  var p = PROFILES.t2d_gout, prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 0, now: NOW });
  var walkDays = prog.days.filter(function (d) { return d.kind === "walk" && d.session; });
  ok(walkDays.length >= 1 && walkDays.every(function (d) { return d.session.minutes === 10 && /Хоолны дараа/.test(d.session.title); }), "T2D: хичээлгүй өдөр хоолны дараах 10 мин алхалт");
  ok(prog.notes.some(function (t) { return /Тулай/.test(t); }), "тулай тэмдэглэл");
  ok(allItems(prog).every(function (x) { return Lib.byId(x.it.exId).impact === 0; }), "тулай/BMI 33 → impact 0");
})();
(function () {
  var p = PROFILES.desk_lowback_fatloss, prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 0, now: NOW });
  var strength = prog.days.filter(function (d) { return d.session && d.session.type === "strength"; });
  ok(strength.length >= 1, "нуруу: хүчний хичээл");
  var warmIds = [];
  strength.forEach(function (d) { d.session.blocks.filter(function (b) { return b.name === "Халаалт"; }).forEach(function (b) { b.items.forEach(function (it) { warmIds.push(it.exId); }); }); });
  ok(warmIds.some(function (id) { return /curl|bird|side_plank/.test(id); }), "нуруу: МакГилл халаалтад " + warmIds.join(","));
  ok(allItems(prog).some(function (x) { return x.it.why.some(function (w) { return /Бүсэлхий өвддөг/.test(w); }); }), "нуруу: «Бүсэлхий өвддөг → ...» why");
  var mv = PROFILES.mobility_yoga, pm = E.buildProgram(mv, E.assess(mv, NOW), { weekIndex: 0, now: NOW });
  var yoga = pm.days.filter(function (d) { return d.session && d.session.type === "yoga"; });
  ok(yoga.length >= 1, "уян хатан: йога");
  yoga.forEach(function (d) { ok(d.session.blocks.length >= 3, "йога блокууд"); ok(d.session.blocks[d.session.blocks.length - 1].name === "Тайвшрал", "йога тайвшралаар дуусна"); });
  var sess0 = prog.days.filter(function (d) { return d.session; })[0].session;
  ok(sess0.why.some(function (w) { return /Өдөрт 30 минут → халаалт/.test(w); }), "session.why минутын хуваарилалт");
})();
(function () {
  var p = PROFILES.male_muscle_db, prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 1, now: NOW });
  var st = prog.days.filter(function (d) { return d.session && d.session.type === "strength"; });
  eq(st.length, 3, "булчин: 3 хүчний хичээл");
  ok(allItems(prog).some(function (x) { return Lib.byId(x.it.exId).equipment.indexOf("db") >= 0; }), "булчин: гантель хэрэглэнэ");
  ok(st.every(function (d) { var main = d.session.blocks.filter(function (b) { return b.name === "Үндсэн"; })[0]; return main && main.items.length >= 4 && main.items.every(function (it) { return it.sets >= 3; }); }), "булчин: үндсэн ≥4 дасгал, ≥3 сет");
  var pats = {};
  st.forEach(function (d) { d.session.blocks.filter(function (b) { return b.name === "Үндсэн"; })[0].items.forEach(function (it) { pats[Lib.byId(it.exId).pattern] = 1; }); });
  ["squat", "push", "pull", "hinge"].forEach(function (pt) { ok(pats[pt], "булчин: хэв маяг " + pt); });
})();
(function () {
  var p = PROFILES.busy_45_5, prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 0, now: NOW });
  eq(prog.days.filter(function (d) { return d.kind === "session"; }).length, 5, "45 мин × 5");
  ok(prog.days.every(function (d) { return !d.session || d.session.type !== "yoga"; }), "дургүй йога хасагдсан");
  prog.days.forEach(function (d) { if (d.kind === "session") ok(Math.abs(E.estimateMinutes(d.session) - 45) <= 9, "45 мин " + d.session.title + " " + E.estimateMinutes(d.session)); });
})();
(function () {
  var p = PROFILES.standing_only, prog = E.buildProgram(p, E.assess(p, NOW), { weekIndex: 0, now: NOW });
  ok(allItems(prog).every(function (x) { return ["standing", "seated", "kneeling"].indexOf(Lib.byId(x.it.exId).position) >= 0; }), "зогсоо зай: позиц");
  ok(allItems(prog).some(function (x) { return x.it.why.some(function (w) { return /зогсоо/.test(w); }); }), "зогсоо why");
})();

// ───────── adapt ─────────
(function () {
  var p = PROFILES.desk_lowback_fatloss, a = E.assess(p, NOW);
  var prog = E.buildProgram(p, a, { weekIndex: 0, now: NOW });
  var sess = prog.days.filter(function (d) { return d.kind === "session" && d.session.type === "strength"; }).map(function (d) { return d.session; });
  ok(sess.length >= 2, "adapt: 2 хүчний хичээл");
  var mainIds = function (s) { return s.blocks.filter(function (b) { return b.name === "Үндсэн"; })[0].items.map(function (it) { return it.exId; }); };
  // Хялбар: RPE 5, 6
  var easy = [{ date: "2026-10-06", sessionId: sess[0].id, done: true, rpe: 5, pain: [], enjoy: 4, minutes: 30, skippedExIds: [] },
    { date: "2026-10-08", sessionId: sess[1].id, done: true, rpe: 6, pain: [], enjoy: 4, minutes: 30, skippedExIds: [] }];
  var r = E.adapt(prog, p, easy);
  ok(r.nextOpts.progressIds.length > 0, "adapt: RPE ≤6 ×2 → progressIds");
  ok(r.changes.some(function (c) { return /RPE 5, 6/.test(c.text); }), "adapt: текст RPE 5, 6");
  ok(r.changes.every(function (c) { return hasMongolian(c.text); }), "adapt: монгол");
  var next = E.buildProgram(p, a, { weekIndex: 1, prev: prog, logs: easy, now: NOW });
  var sess1 = next.days.filter(function (d) { return d.kind === "session" && d.session.type === "strength"; }).map(function (d) { return d.session; });
  var progressedSeen = false;
  sess1.forEach(function (s) { s.blocks.forEach(function (b) { b.items.forEach(function (it) { if (it.why.some(function (w) { return /RPE ≤6|хүнд хувилбар/.test(w); })) progressedSeen = true; }); }); });
  ok(progressedSeen, "adapt→build: ахих тайлбар дараагийн долоо хоногт");
  // Хүнд + өвдөлт
  var squatId = mainIds(sess[0]).filter(function (id) { return Lib.byId(id).pattern === "squat"; })[0];
  var hard = [{ date: "2026-10-06", sessionId: sess[0].id, done: true, rpe: 9, pain: ["knee"], enjoy: 2, minutes: 30, skippedExIds: [] }];
  var r2 = E.adapt(prog, p, hard);
  ok(r2.nextOpts.regressIds.length > 0, "adapt: RPE 9 → regressIds");
  eq(r2.nextOpts.loadMul.knee, 0.8, "adapt: өвдөг → −20%");
  ok(r2.changes.some(function (c) { return /Өвдөг өвдсөн/.test(c.text); }), "adapt: өвдөг текст");
  var next2 = E.buildProgram(p, a, { weekIndex: 1, prev: prog, logs: hard, now: NOW });
  var ids2 = [];
  next2.days.forEach(function (d) { if (d.session) d.session.blocks.forEach(function (b) { b.items.forEach(function (it) { ids2.push(it.exId); }); }); });
  if (squatId) {
    var ex = Lib.byId(squatId);
    ok(ids2.indexOf(squatId) < 0 || (ex.regress == null), "adapt→build: хүнд суулт солигдсон (" + squatId + ")");
  }
  ok(allItems(next2).some(function (x) { return x.it.why.some(function (w) { return /Өвдөг өвдсөн → ачаалал −20%|хялбар хувилбар/.test(w); }); }), "adapt→build: −20% why");
  // Алгасалт
  var skipId = mainIds(sess[0])[1];
  var skips = [{ date: "2026-10-06", sessionId: sess[0].id, done: true, rpe: 7, pain: [], enjoy: 3, minutes: 20, skippedExIds: [skipId, mainIds(sess[0])[2]] },
    { date: "2026-10-08", sessionId: sess[1].id, done: true, rpe: 7, pain: [], enjoy: 3, minutes: 20, skippedExIds: [skipId] }];
  var r3 = E.adapt(prog, p, skips);
  eq(r3.nextOpts.minutesDelta, -5, "adapt: 2+ алгасалт → −5 мин");
  ok(r3.nextOpts.avoidIds.indexOf(skipId) >= 0, "adapt: 2 удаа алгассан → avoid");
  var next3 = E.buildProgram(p, a, { weekIndex: 1, prev: prog, logs: skips, now: NOW });
  var s3 = next3.days.filter(function (d) { return d.kind === "session" && d.session.type === "strength"; })[0].session;
  eq(s3.minutes, 25, "adapt→build: 30 → 25 мин");
  ok(allItems(next3).every(function (x) { return x.it.exId !== skipId; }), "adapt→build: алгассан дасгал байхгүй");
  // Хийгээгүй
  var r4 = E.adapt(prog, p, [{ date: "2026-10-06", sessionId: sess[0].id, done: true, rpe: 7, pain: [], enjoy: 3, minutes: 30, skippedExIds: [] }]);
  eq(r4.nextOpts.daysDelta, -1, "adapt: 4-өөс 1 → −1 өдөр");
  var r5 = E.adapt(prog, p, []);
  ok(r5.changes.length === 1 && /бүртгэл алга/.test(r5.changes[0].text), "adapt: лог хоосон");
})();

// ───────── бусад API ─────────
(function () {
  var p = PROFILES.beginner_noeq;
  ok(E.retestDue(p, [], NOW) === true, "retestDue 35 хоног → true");
  ok(E.retestDue(p, [], new Date("2026-09-10")) === false, "retestDue 9 хоног → false");
  var a = E.assess(p, NOW);
  eq(E.stepsTarget(p, a, 0), 5000, "алхам эхлэл 5000");
  ok(E.stepsTarget(p, a, 8) <= 10000, "алхам дээд 10000");
  eq(E.describeItem({ exId: "x", sets: 3, reps: 10 }), "3 × 10 давталт", "describeItem reps");
  eq(E.describeItem({ exId: "x", sets: 3, seconds: 30 }), "3 × 30 сек", "describeItem seconds");
  eq(E.describeItem({ exId: "x", sets: 1, seconds: 1200 }), "20 мин", "describeItem walk");
  eq(E.describeItem({ exId: "x", sets: 2, reps: 8, sides: "each" }), "2 × 8 давталт (тал бүр)", "describeItem each");
  eq(E.describeItem({ exId: "x", sets: 1, breaths: 6 }), "6 амьсгал", "describeItem breaths");
  eq(E.estimateItemSeconds({ exId: "x", sets: 1, seconds: 1200 }), 1210, "estimate walk");
  eq(E.estimateItemSeconds({ exId: "x", sets: 2, breaths: 6 }), 70, "estimate breaths 5 с + 10 с шилжилт");
  eq(E.VERSION, 1, "VERSION");
  ok(Foods.foods.length >= 70, "≥70 хүнс (" + Foods.foods.length + ")");
  ok(Foods.foods.every(function (f) { return hasMongolian(f.name) && hasMongolian(f.tip) && typeof f.estimate === "boolean"; }), "хүнс: нэр, tip монгол, estimate");
  ["default", "fatloss", "muscle", "metabolic", "womens", "stress_sleep"].forEach(function (k) { ok(Foods.meals[k] && Foods.meals[k].length === 4, "meals." + k); });
  ok(Foods.foods.filter(function (f) { return f.price; }).every(function (f) { return f.price.year >= 2025 && f.price.estimate === true; }), "үнэ 2025+, estimate");
  ["salt", "winter", "budget", "tsagaansar", "naadam"].forEach(function (k) { ok(Foods.tips[k] && Foods.tips[k].length >= 3, "tips." + k); });
  ok(typeof Foods.byGroup === "function" && Foods.byGroup("veg").length >= 10, "byGroup veg");
})();

console.log("FIT_LIB=" + process.env.FIT_LIB + " (" + Lib.exercises.length + " дасгал): " + pass + " амжилттай, " + fail + " алдаатай");
if (fail) {
  var shown = {};
  failures.forEach(function (f) { var k = f.replace(/\d+(\.\d+)?/g, "#").slice(0, 80); if (!shown[k]) { shown[k] = 1; console.log("  ✗ " + f); } });
  process.exit(1);
}
