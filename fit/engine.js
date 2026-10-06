/* Тэнхээ — хөдөлгүүр. window.FitEngine (SPEC.md "Хөдөлгүүр").
   Цэвэр логик: шүүлт (PAR-Q+), үнэлгээ, хөтөлбөр бүтээгч (детерминистик greedy слот дүүргэлт),
   дасан зохицол, хоол тооцоо. DOM, fetch, Date.now() хэрэглэхгүй: `now` параметрээр авна.
   Node: FIT_LIB=./test-stub-lib.js node fit/test.js */
(function (root) {
  "use strict";

  var Lib = typeof window !== "undefined" ? window.FitLib : require(process.env.FIT_LIB || "./lib.js");
  var Foods = typeof window !== "undefined" ? window.FitFoods : require(process.env.FIT_FOODS || "./foods.js");

  var VERSION = 1;

  // ───────────────────────── Туслах ─────────────────────────
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round(x, d) { var m = Math.pow(10, d || 0); return Math.round(x * m) / m; }
  function uniq(arr) { var s = {}, out = []; arr.forEach(function (x) { if (!s[x]) { s[x] = 1; out.push(x); } }); return out; }
  function inter(a, b) { return a.filter(function (x) { return b.indexOf(x) >= 0; }); }
  function has(arr, x) { return Array.isArray(arr) && arr.indexOf(x) >= 0; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function fmt(n) { return String(n).replace(".", ","); }
  // FNV-1a → [0,1). Долоо хоног, зорилго, дасгалаар санамсаргүй мэт боловч давтагддаг.
  function rnd(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return (h >>> 0) / 4294967296;
  }
  function byId(id) { return Lib.byId ? Lib.byId(id) : Lib.exercises.filter(function (e) { return e.id === id; })[0]; }
  function monthOf(now) { return (now instanceof Date ? now : new Date(now || Date.now())).getMonth() + 1; }

  var PAIN_MN = { knee: "өвдөг", lowback: "бүсэлхий", neck: "хүзүү", shoulder: "мөр", wrist: "бугуй", hip: "түнх", ankle: "шагай",
    pregnancy: "жирэмслэлт", postpartum: "төрсний дараах үе", hypertension: "даралт ихсэлт", inversion: "урвуу поз" };
  var GOAL_MN = { fatloss: "өөх хасах", muscle: "булчин нэмэх", posture_back: "байрлал, нуруу", mobility: "уян хатан",
    stress_sleep: "стресс, нойр", fitness_energy: "эрч хүч", womens: "эмэгтэйчүүдийн эрүүл мэнд", metabolic: "даралт, сахар, тулай",
    older_balance: "тэнцвэр, хүч", event_5k: "5 км гүйлт", habit: "дадал суулгах" };
  var PATTERN_MN = { squat: "суулт", hinge: "түнхний нугалалт", lunge: "алхсан суулт", push: "түлхэлт", pull: "татлага",
    core: "гол булчин", carry: "зөөлт", rotation: "эргэлт", balance: "тэнцвэр", gait: "алхалт" };
  var TYPE_MN = { strength: "Хүч", yoga: "Йога", pilates: "Пилатес", mix: "Хүч + тэнцвэр", mobility: "Мобилити", walk: "Алхалт", breath: "Амьсгал", cardio: "Кардио" };
  var PHASE_MN = { base: "суурь тавих", build: "ачаалал нэмэх", deload: "амрааж сэргээх" };
  var DOW_MN = ["", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
  var OCC_MN = { desk: "суугаа ажил", physical: "биеийн хүчний ажил", shift: "ээлжийн ажил", home: "гэрийн ажил", student: "оюутан" };

  // Профайлын дэд төлөвүүд
  function womensStage(p) { return (p.womens && p.womens.stage) || "none"; }
  function isPregnant(p) { return womensStage(p) === "pregnancy"; }
  function trimester(p) { return isPregnant(p) ? (p.womens.trimester || 1) : 0; }
  function weeksPP(p) { return womensStage(p) === "postpartum" ? (p.womens.weeksPostpartum == null ? 0 : p.womens.weeksPostpartum) : null; }
  function isEarlyPP(p) { var w = weeksPP(p); return w != null && w < 12; }
  function isMenopause(p) { return womensStage(p) === "menopause"; }
  function hasMet(p, k) { return has(p.metabolic, k); }
  function isOlder(p) { return p.age >= 60; }
  function bmiOf(p) { var h = p.heightCm / 100; return h > 0 ? p.weightKg / (h * h) : 0; }
  function primaryGoal(p) { return (p.goals && p.goals[0]) || "habit"; }
  function hasGoal(p, g) { return has(p.goals, g); }

  // Дасгалаас ХАСАХ шалтгаанууд (contra флагууд): өвдөлт ∪ эмэгтэйчүүдийн үе ∪ метаболик
  function contraFlags(p) {
    var f = (p.pain || []).slice();
    if (isPregnant(p)) f.push("pregnancy", "inversion");
    if (isEarlyPP(p)) f.push("postpartum");
    if (hasMet(p, "htn") || hasGoal(p, "metabolic") && hasMet(p, "htn")) f.push("hypertension", "inversion");
    if (isOlder(p)) f.push("inversion");
    return uniq(f);
  }

  // ───────────────────────── 1. Шүүлт (PAR-Q+) ─────────────────────────
  function screen(profile) {
    var p = profile || {}, flags = [], stop = false;
    var parq = p.parq || [];
    var yes = parq.filter(Boolean).length;
    if (yes > 0) {
      stop = true;
      flags.push({ code: "parq", text: "PAR-Q+ асуултын " + yes + "-д «Тийм» гэж хариулсан байна. Хөтөлбөр эхлэхээс өмнө эмчээс зөвшөөрөл аваарай. Хүлээх хооронд өдөрт 10–15 минут хөнгөн алхалт хийж болно." });
    }
    if (isPregnant(p)) {
      flags.push({ code: "pregnancy", text: "Жирэмсэн (" + trimester(p) + "-р гурван сар): хичээл ярьж чадахаар эрчимтэй, цус алдалт, базлалт, толгой эргэх, цээж өвдөх үед шууд зогсоож эмчид хандана." });
      if (yes > 0) flags.push({ code: "pregnancy_parq", text: "Жирэмсэн дээр PAR-Q+ «Тийм» → эмчийн зөвшөөрөлгүй дасгал эхлэхгүй." });
    }
    var wpp = weeksPP(p);
    if (wpp != null && wpp < 6) flags.push({ code: "postpartum_early", text: "Төрснөөс хойш " + wpp + " долоо хоног: 6 долоо хоног хүртэл зөвхөн аарцагны ёроол, амьсгал, алхалт. Кесар бол эмчийн зөвшөөрөл." });
    if (hasMet(p, "htn")) {
      flags.push({ code: "htn", text: "Даралт ихсэлттэй: 160/100-аас дээш үед хичээл хийхгүй, амьсгалаа барих (Valsalva) хөдөлгөөн, толгой доош позгүй." });
      if (parq[0]) flags.push({ code: "htn_parq", text: "Эмч зүрх, даралтын тухай хэлсэн → эмчийн зөвшөөрөл заавал." });
    }
    if (hasMet(p, "t2d")) flags.push({ code: "t2d", text: "Чихрийн шижин: инсулин хэрэглэдэг бол хичээлийн өмнө сахараа шалгана, 13,9 ммоль/л-ээс дээш бол хийхгүй." });
    var bmi = bmiOf(p);
    if (bmi >= 40) flags.push({ code: "bmi40", text: "BMI " + fmt(round(bmi, 1)) + " → үсрэлтгүй, сандал, ханын дасгалаар эхэлнэ. Эмчтэйгээ зөвлөлдвөл сайн." });
    if (p.age >= 70) flags.push({ code: "age70", text: p.age + " настай → тэнцвэрийн дасгалыг сандал, ханын дэргэд хийнэ." });
    if (p.age && p.age < 18) flags.push({ code: "teen", text: "18 хүрээгүй → жин хасах, калорийн дутагдлын зөвлөмж өгөхгүй, эцэг эхийн зөвшөөрөлтэй." });
    return { ok: !stop, stop: stop, flags: flags };
  }

  // ───────────────────────── 2. Үнэлгээ ─────────────────────────
  // Нормын хүснэгтүүд (судалгааны тайлан: ACSM push-up, Rikli & Jones 30 с сандлаас босох, Springer SLS)
  var PUSHUP_NORM = { // [дунджийн доод, дунджийн дээд, маш сайн] насны арав жилээр
    m_full: { 20: [17, 29, 47], 30: [13, 24, 41], 40: [11, 20, 34], 50: [9, 17, 31], 60: [6, 16, 30] },
    f_full: { 20: [9, 13, 30], 30: [7, 12, 27], 40: [5, 9, 24], 50: [4, 8, 21], 60: [3, 5, 17] },
    f_knee: { 20: [12, 22, 36], 30: [10, 21, 33], 40: [8, 17, 28], 50: [7, 14, 25], 60: [5, 12, 20] },
    m_knee: { 20: [20, 32, 50], 30: [16, 28, 45], 40: [14, 24, 40], 50: [12, 20, 35], 60: [8, 18, 30] }
  };
  var CHAIR_NORM = { // Rikli & Jones (60+): [доод, дээд]; 60-аас доош тэгш бүс (plateau)
    m: { 60: [14, 19], 65: [12, 18], 70: [12, 17], 75: [11, 17], 80: [10, 15], 85: [8, 14] },
    f: { 60: [12, 17], 65: [11, 16], 70: [10, 15], 75: [10, 15], 80: [9, 14], 85: [8, 13] },
    plateau: { m: [16, 22], f: [14, 20] }
  };
  function decade(age) { return clamp(Math.floor(age / 10) * 10, 20, 60); }
  function bandByRange(v, lo, hi, excellent) {
    // 1..5 түвшин, band
    var lvl = v < lo * 0.5 ? 1 : v < lo ? 2 : v <= hi ? 3 : (excellent && v > excellent) ? 5 : 4;
    return { level: lvl, band: lvl <= 2 ? "low" : lvl === 3 ? "mid" : "high" };
  }
  function testPushups(p) {
    var v = p.tests && p.tests.pushups;
    if (v == null) return null;
    var type = (p.tests.pushupType || (p.sex === "f" ? "knee" : "full"));
    var tbl = PUSHUP_NORM[p.sex + "_" + type] || PUSHUP_NORM.f_knee;
    var n = tbl[decade(p.age)];
    var b = bandByRange(v, n[0], n[1], n[2]);
    var typeMn = type === "knee" ? "өвдөгнөөс" : "бүтэн";
    b.value = v;
    b.text = v + " " + typeMn + " түлхэлт: " + p.age + " настай " + (p.sex === "f" ? "эмэгтэйн" : "эрэгтэйн") + " дундаж " + n[0] + "–" + n[1] +
      (b.band === "low" ? " → дунджаас доош, түлхэлтийг ханын хувилбараас эхэлнэ" : b.band === "mid" ? " → дундаж" : " → дунджаас дээш");
    return b;
  }
  function testChair(p) {
    var v = p.tests && p.tests.chairStand30;
    if (v == null) return null;
    var n;
    if (p.age >= 60) { var k = clamp(Math.floor(p.age / 5) * 5, 60, 85); n = CHAIR_NORM[p.sex === "f" ? "f" : "m"][k]; }
    else n = CHAIR_NORM.plateau[p.sex === "f" ? "f" : "m"];
    var b = bandByRange(v, n[0], n[1], n[1] + 6);
    b.value = v;
    b.text = "30 секундэд " + v + " удаа босов: " + (p.age >= 60 ? p.age + " насны норм " : "насанд хүрэгчдийн муж ") + n[0] + "–" + n[1] +
      (b.band === "low" ? " → хөлний хүч сул, суулт сандлаас эхэлнэ" : b.band === "mid" ? " → хэвийн" : " → сайн");
    return b;
  }
  function testPlank(p) {
    var v = p.tests && p.tests.plankSec;
    if (v == null) return null;
    var b = bandByRange(v, 30, 60, 90);
    b.value = v;
    b.text = "Планк " + v + " сек: " + (b.band === "low" ? "30 секундээс бага → гол булчинг өвдөгний планк, шувуу нохойгоор эхэлнэ" : b.band === "mid" ? "30–60 сек → дундаж" : "60 секундээс дээш → сайн, хажуугийн планк нэмнэ");
    return b;
  }
  function testBalance(p) {
    var v = p.tests && p.tests.balanceSec;
    if (v == null) return null;
    var lo = 10, hi = 30, ex = 45;
    if (p.age >= 70) { lo = 5; hi = 15; ex = 22; } else if (p.age >= 60) { lo = 8; hi = 25; ex = 32; }
    var b = bandByRange(v, lo, hi, ex);
    b.value = v;
    b.text = "Нэг хөл дээр " + v + " сек: " + (b.band === "low" ? "→ тэнцвэр сул, өдөр бүр сандлын дэргэд тэнцвэрийн дасгал" : b.band === "mid" ? "→ дундаж (" + lo + "–" + hi + " сек)" : "→ сайн");
    return b;
  }
  function testToe(p) {
    var v = p.tests && p.tests.toeTouch;
    if (!v) return null;
    var lvl = { floor: 4, ankle: 3, shin: 2, knee: 1 }[v] || 3;
    var mn = { floor: "шал", ankle: "шагай", shin: "шилбэ", knee: "өвдөг" }[v];
    return { value: v, level: lvl, band: lvl <= 2 ? "low" : lvl === 3 ? "mid" : "high",
      text: "Урагш бөхийхөд гар " + mn + "д хүрэв: " + (lvl <= 2 ? "хамстринг, бүсэлхий чанга → халаалт бүрт суналт" : lvl === 3 ? "дундаж" : "уян хатан сайн") };
  }

  function assess(profile, now) {
    var p = profile || {};
    var bmi = round(bmiOf(p), 1);
    var whtr = p.waistCm && p.heightCm ? round(p.waistCm / p.heightCm, 2) : null;
    var whtrBand = whtr == null ? "ok" : whtr < 0.5 ? "ok" : whtr < 0.6 ? "watch" : "high";
    var tests = {};
    var t;
    if ((t = testPushups(p))) tests.pushups = t;
    if ((t = testChair(p))) tests.chairStand30 = t;
    if ((t = testPlank(p))) tests.plankSec = t;
    if ((t = testBalance(p))) tests.balanceSec = t;
    if ((t = testToe(p))) tests.toeTouch = t;

    var defLevel = (isOlder(p) || bmi >= 35) ? 1 : 2;
    function avg(keys) {
      var vals = keys.map(function (k) { return tests[k] && tests[k].level; }).filter(function (x) { return x != null; });
      if (!vals.length) return null;
      return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    }
    var sL = avg(["pushups", "chairStand30"]), cL = avg(["plankSec"]), bL = avg(["balanceSec"]), mL = avg(["toeTouch"]);
    var any = sL != null || cL != null || bL != null || mL != null;
    var strengthLevel = clamp(Math.round(sL == null ? defLevel : sL), 1, 5);
    var coreLevel = clamp(Math.round(cL == null ? defLevel : cL), 1, 5);
    var balanceLevel = clamp(Math.round(bL == null ? defLevel : bL), 1, 5);
    var mobilityLevel = clamp(Math.round(mL == null ? defLevel : mL), 1, 5);
    var level;
    if (!any) level = defLevel;
    else {
      var w = 0, s = 0;
      [[sL, 0.4], [cL, 0.25], [bL, 0.15], [mL, 0.2]].forEach(function (x) { if (x[0] != null) { s += x[0] * x[1]; w += x[1]; } });
      level = clamp(Math.round(s / w), 1, 5);
    }
    if (isOlder(p)) level = Math.min(level, 3);
    if (isOlder(p) && ((tests.balanceSec && tests.balanceSec.band === "low") || (tests.chairStand30 && tests.chairStand30.band === "low"))) level = 1; // уналтын эрсдэл
    if (isPregnant(p) || isEarlyPP(p)) level = Math.min(level, 2);
    if (bmi >= 35) level = Math.min(level, 2);

    var flags = [];
    var d = p.diet || {};
    var month = monthOf(now);
    if (p.occupation === "desk") flags.push("desk");
    if (has(p.pain, "lowback")) flags.push("lowback");
    if (p.sleepHours != null && p.sleepHours < 6) flags.push("short_sleep");
    if ((d.saltTeaCups || 0) >= 2) flags.push("high_salt");
    if (d.vegServings != null && d.vegServings < 3) flags.push("low_veg");
    if (month >= 10 || month <= 4) flags.push("winter_vitd");
    if ((p.stress || 0) >= 4) flags.push("high_stress");
    if (level <= 2) flags.push("beginner");
    if (isOlder(p)) flags.push("older");
    if ((d.sugaryDrinksPerDay || 0) >= 1) flags.push("sugar");
    if (whtrBand !== "ok") flags.push("whtr_" + whtrBand);

    var why = [];
    if (whtr != null) why.push("Бүсэлхий/өндөр " + fmt(whtr) + (whtrBand === "ok" ? " → 0,5-аас бага, хэвлийн өөх хэвийн" : whtrBand === "watch" ? " → 0,5-аас дээш, хэвлийн өөх анхаарах: алхалт, хоолны фокус нэмсэн" : " → 0,6-аас дээш, эрсдэл өндөр: алхалт өдөр бүр, дутагдал −500 ккал"));
    why.push("BMI " + fmt(bmi) + (bmi >= 30 ? " → үсрэлтгүй, үе хамгаалсан дасгал" : bmi >= 25 ? " → илүүдэл жин, хүч + алхалт" : bmi < 18.5 ? " → жин багатай, калорийн дутагдал өгөхгүй" : " → хэвийн"));
    if (!any) why.push("Тест алгассан → түвшин " + level + "-ээс эхэлнэ" + (defLevel === 1 ? " (нас " + p.age + " / BMI " + fmt(bmi) + ")" : "") + ", 4 долоо хоногийн дараа тест хийж тохируулна");
    else why.push("Тестүүдээр түвшин " + level + ": хүч " + strengthLevel + ", гол булчин " + coreLevel + ", тэнцвэр " + balanceLevel + ", уян хатан " + mobilityLevel);
    if (isOlder(p)) why.push(p.age + " настай → түвшин дээд тал нь 3, тэнцвэрийн дасгал өдөр бүр, амралт урт");
    if (isPregnant(p)) why.push("Жирэмсэн " + trimester(p) + "-р гурван сар → түвшин ≤2, үсрэлтгүй" + (trimester(p) >= 2 ? ", нуруугаар хэвтэх дасгалгүй" : ""));
    if (isEarlyPP(p)) why.push("Төрснөөс хойш " + weeksPP(p) + " долоо хоног → гол булчин, аарцагны ёроолын сэргээлт, үсрэлтгүй");
    if (has(flags, "short_sleep")) why.push("Нойр " + p.sleepHours + " цаг → эрчим −1 (сет −1), тэсвэр рүү хазайна");
    if (has(flags, "high_stress")) why.push("Стресс " + p.stress + "/5 → амьсгал, тайвшрал нэмсэн, сет −1");
    if (has(flags, "desk")) why.push("Суугаа ажил → хүзүү, мөр, түнхний мобилити халаалтад");
    if (has(flags, "high_salt")) why.push("Давстай цай өдөрт " + d.saltTeaCups + " аяга → давсны фокус");
    if (has(flags, "low_veg")) why.push("Ногоо өдөрт " + d.vegServings + " порц → 3 порц руу");
    if (has(flags, "winter_vitd")) why.push(month + "-р сар → витамин D-гийн сануулга (10–4 сар)");

    return { bmi: bmi, whtr: whtr, whtrBand: whtrBand, level: level, strengthLevel: strengthLevel, coreLevel: coreLevel,
      balanceLevel: balanceLevel, mobilityLevel: mobilityLevel, tests: tests, flags: flags, why: why };
  }

  // ───────────────────────── 3. Хугацааны тооцоо, тайлбар ─────────────────────────
  function estimateItemSeconds(item) {
    var ex = byId(item.exId);
    var sides = item.sides || (ex && ex.sides) || "both";
    var sets = item.sets || 1;
    var perRep = item.tempo ? 5 : (item.reps >= 50 ? 1 : 3); // «Зуу» маягийн хурдан тоололт 1 сек
    var work = item.seconds != null && item.reps != null ? item.reps * item.seconds // 6 × 8 сек барилт
      : item.seconds != null ? item.seconds : item.reps != null ? item.reps * perRep : item.breaths != null ? item.breaths * 5 : 30;
    if (sides === "each") work *= 2;
    return sets * work + Math.max(0, sets - 1) * (item.rest || 0) + 10;
  }
  function estimateMinutes(session) {
    if (!session || !session.blocks) return 0;
    var s = 0;
    session.blocks.forEach(function (b) { (b.items || []).forEach(function (it) { s += estimateItemSeconds(it); }); });
    return round(s / 60, 1);
  }
  function describeItem(item) {
    var ex = byId(item.exId);
    var sides = item.sides || (ex && ex.sides) || "both";
    var each = sides === "each" ? " (тал бүр)" : "";
    var sets = item.sets || 1;
    var s;
    if (item.seconds != null && item.reps != null) s = sets + " × " + item.reps + " × " + item.seconds + " сек" + each;
    else if (item.seconds != null) {
      if (item.seconds >= 120 && sets === 1) s = round(item.seconds / 60) + " мин";
      else s = sets + " × " + item.seconds + " сек" + each;
    } else if (item.reps != null) s = sets + " × " + item.reps + " давталт" + each;
    else if (item.breaths != null) s = (sets > 1 ? sets + " × " : "") + item.breaths + " амьсгал" + each;
    else s = sets + " сет";
    if (item.tempo) s += ", темп " + item.tempo;
    return s;
  }

  // ───────────────────────── 4. Хөтөлбөр бүтээгч ─────────────────────────
  var DOW_SLOTS = { 1: [3], 2: [2, 5], 3: [1, 3, 5], 4: [1, 2, 4, 6], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [1, 2, 3, 4, 5, 6, 7] };
  var GOAL_MUSCLES = {
    fatloss: ["quads", "glutes", "back", "chest", "fullbody"], muscle: ["quads", "glutes", "chest", "back", "shoulders", "hams"],
    posture_back: ["core", "back", "spine", "glutes", "neck"], mobility: ["hipflex", "hams", "spine", "adductors"],
    stress_sleep: ["spine", "core", "fullbody"], fitness_energy: ["fullbody", "quads", "glutes"], womens: ["glutes", "core", "back"],
    metabolic: ["quads", "glutes", "fullbody"], older_balance: ["quads", "glutes", "calves", "core"], event_5k: ["quads", "glutes", "calves", "core"], habit: ["fullbody"]
  };
  // Долоо хоногийн хичээлийн төрлүүд (эрэмбэтэй), эхний daysPerWeek-ийг авна
  function typePlan(p) {
    var g = primaryGoal(p);
    if (g === "womens" || isPregnant(p) || isEarlyPP(p) || isMenopause(p)) {
      if (isPregnant(p)) return ["mix", "walk", "yoga", "mix", "walk", "yoga", "breath"];
      if (isEarlyPP(p)) return ["recovery", "walk", "recovery", "breath", "recovery", "walk", "yoga"];
      if (isMenopause(p)) return ["strength", "strength", "mix", "yoga", "strength", "walk", "mobility"];
      if (g === "womens") g = (p.goals && p.goals[1]) || "fitness_energy";
    }
    if (g === "metabolic") {
      if (hasMet(p, "htn")) return ["strength", "walk", "yoga", "strength", "walk", "mobility", "walk"];
      if (hasMet(p, "t2d")) return ["strength", "walk", "strength", "walk", "pilates", "walk", "yoga"];
      if (hasMet(p, "gout")) return ["walk", "mobility", "strength", "walk", "yoga", "strength", "walk"];
      return ["strength", "walk", "yoga", "strength", "walk", "mobility", "walk"];
    }
    var plans = {
      fatloss: ["strength", "strength", "walk", "pilates", "strength", "yoga", "walk"],
      muscle: ["strength", "strength", "strength", "mobility", "strength", "walk", "yoga"],
      posture_back: ["pilates", "strength", "mobility", "pilates", "yoga", "strength", "walk"],
      mobility: ["yoga", "mobility", "yoga", "strength", "mobility", "yoga", "walk"],
      stress_sleep: ["yoga", "breath", "walk", "yoga", "strength", "breath", "walk"],
      fitness_energy: ["strength", "walk", "strength", "walk", "pilates", "walk", "yoga"],
      older_balance: ["mix", "mix", "yoga", "walk", "mix", "walk", "mobility"],
      event_5k: ["walk", "strength", "walk", "walk", "strength", "mobility", "walk"],
      habit: ["mix", "yoga", "walk", "strength", "breath", "walk", "mobility"]
    };
    var plan = (plans[g] || plans.habit).slice();
    if (isOlder(p)) plan = plan.map(function (t) { return t === "strength" ? "mix" : t; });
    // дургүй төрлийг солино
    var dis = (p.prefs && p.prefs.dislikes) || [];
    if (dis.length) plan = plan.map(function (t) {
      if (dis.indexOf(t) < 0) return t;
      var alt = ["strength", "pilates", "yoga", "mobility", "walk", "mix"].filter(function (x) { return dis.indexOf(x) < 0 && x !== t; });
      return alt[0] || t;
    });
    return plan;
  }
  function typeReason(p, type) {
    var g = primaryGoal(p), gm = GOAL_MN[g] || g;
    if (isPregnant(p)) return "Жирэмсэн → хөнгөн хүч, алхалт, йога ээлжилнэ";
    if (isEarlyPP(p)) return "Төрснөөс хойш " + weeksPP(p) + " долоо хоног → гол булчин, аарцагны сэргээлт";
    if (isMenopause(p)) return "Цэвэршилт → хүчний дасгал долоо хоногт 2–3, ясны нягтад";
    if (hasMet(p, "htn") && type === "strength") return "Даралт ихсэлт → изометрик блок (ханын суулт, планк) нэмсэн, амьсгал барихгүй";
    if (hasMet(p, "t2d") && type === "walk") return "Чихрийн шижин → хоолны дараах алхалт сахарыг бууруулна";
    var r = {
      strength: "Зорилго «" + gm + "» → хүчний дасгал долоо хоногт " + (g === "muscle" ? "3" : "2"),
      walk: g === "fatloss" ? "Өөх хасах → алхалт хэвлийн өөхөнд хамгийн сайн" : "Алхалт зүрх, нойр, сахарт",
      pilates: g === "posture_back" ? "Нурууны өвдөлт → пилатес гол булчингийн хяналт" : "Пилатес гол булчин, байрлалд",
      yoga: g === "stress_sleep" ? "Стресс, нойр → йога, амьсгал" : g === "mobility" ? "Уян хатан → йога долоо хоногт 2" : "Йога суналт, амралтад",
      mobility: "Мобилити — долоо хоногт нийт 5 минут/булчин суналт хэрэгтэй",
      breath: "Стресс " + (p.stress || "") + "/5 → удаан амьсгал (минутад 6) түгшүүрийг бууруулна",
      mix: isOlder(p) ? p.age + " настай → хүч + тэнцвэр хамт (уналтын эрсдэл −34%)" : "Хүч + тэнцвэр хослол",
      recovery: "Төрсний дараах сэргээлт"
    };
    return r[type] || "";
  }

  // Контекст: шүүлтүүр, оноонд хэрэгтэй бүх зүйл
  function makeCtx(p, a, opts) {
    var weekIndex = opts.weekIndex || 0;
    var phases = cyclePhases(a.level);
    var phase = phases[weekIndex % phases.length];
    var flags = contraFlags(p);
    var excl = [];
    if (p.space === "standing") excl.push("supine", "prone", "side");
    if (isPregnant(p) && trimester(p) >= 2) excl.push("supine", "prone");
    if (isEarlyPP(p)) excl.push("prone");
    var maxImpact = 2;
    if (isPregnant(p) || isEarlyPP(p) || isOlder(p) || has(p.pain, "knee") || has(p.pain, "ankle") || a.bmi >= 30 || hasMet(p, "gout")) maxImpact = 0;
    else if (isMenopause(p) || a.bmi >= 27 || a.level <= 1) maxImpact = Math.min(maxImpact, 1);
    var maxLevel = a.level + 1;
    if (isPregnant(p) || isEarlyPP(p)) maxLevel = 2;
    if (isOlder(p)) maxLevel = Math.min(maxLevel, 3);
    if (hasMet(p, "gout")) maxLevel = Math.min(maxLevel, a.level);
    var eq = (p.equipment || []).filter(function (e) { return e !== "none"; });
    var ad = opts.adapt || {};
    var prevIds = {};
    var streak = {};
    if (opts.prev && opts.prev.days) {
      opts.prev.days.forEach(function (d) { if (d.session) d.session.blocks.forEach(function (b) { b.items.forEach(function (it) { prevIds[it.exId] = 1; }); }); });
      var h = opts.prev.history || {};
      Object.keys(h).forEach(function (k) { streak[k] = h[k]; });
    }
    var setsDelta = 0, setsWhy = [];
    if (p.sleepHours != null && p.sleepHours < 6) { setsDelta -= 1; setsWhy.push("Нойр " + p.sleepHours + " цаг → сет −1"); }
    if ((p.stress || 0) >= 4 && setsDelta === 0) { setsDelta -= 1; setsWhy.push("Стресс " + p.stress + "/5 → сет −1"); }
    setsDelta += ad.setsDelta || 0;
    return {
      p: p, a: a, weekIndex: weekIndex, phase: phase, deload: phase === "deload", flags: flags, excl: excl, maxImpact: maxImpact,
      maxLevel: maxLevel, eq: eq, goal: primaryGoal(p), goalMuscles: GOAL_MUSCLES[primaryGoal(p)] || [], prevIds: prevIds, streak: streak,
      avoid: ad.avoidIds || [], progressIds: ad.progressIds || [], regressIds: ad.regressIds || [], loadMul: ad.loadMul || {},
      dislikes: (p.prefs && p.prefs.dislikes) || [], likes: (p.prefs && p.prefs.likes) || [],
      setsDelta: setsDelta, setsWhy: setsWhy, minutes: Math.max(10, (p.minutes || 20) + (ad.minutesDelta || 0)),
      seed: weekIndex + "|" + (p.goals || []).join(","), used: {}
    };
  }
  function cyclePhases(level) { return level <= 1 ? ["base", "base", "build", "deload"] : ["base", "build", "build", "deload"]; }

  // Хатуу шүүлтүүр. ignoreFlags=true бол contra-г үл тоон (тайлбар гаргахад)
  function allowed(ex, ctx, ignoreFlags) {
    if (!ex) return false;
    if (ex.equipment.some(function (e) { return ctx.eq.indexOf(e) < 0; })) return false;
    if (ex.level > ctx.maxLevel) return false;
    if (ex.impact > ctx.maxImpact) return false;
    if (ctx.excl.indexOf(ex.position) >= 0) return false;
    if (ctx.avoid.indexOf(ex.id) >= 0) return false;
    if (!ignoreFlags && inter(ex.contra, ctx.flags).length) return false;
    return true;
  }
  function blockedBy(ex, ctx) { return inter(ex.contra, ctx.flags); }
  function targetLevelFor(ex, ctx) {
    var a = ctx.a;
    if (ex.pattern === "core") return a.coreLevel;
    if (ex.pattern === "balance") return a.balanceLevel;
    if (ex.type === "mobility" || ex.type === "yoga") return a.mobilityLevel;
    return a.strengthLevel;
  }
  function score(ex, ctx, prev) {
    var s = 1 - 0.35 * Math.abs(ex.level - Math.min(targetLevelFor(ex, ctx), ctx.maxLevel));
    if (inter(ex.muscles, ctx.goalMuscles).length) s += 0.4;
    if (ctx.prevIds[ex.id]) s += 0.2;
    if ((ctx.streak[ex.id] || 0) >= 3) s -= 0.3;
    if (ctx.dislikes.indexOf(ex.type) >= 0) s -= 1;
    if (ctx.likes.indexOf(ex.type) >= 0) s += 0.3;
    if (isOlder(ctx.p) && ex.equipment.indexOf("chair") >= 0) s += 0.3;
    if (has(ctx.p.pain, "knee") && ex.equipment.indexOf("chair") >= 0) s += 0.2;
    if (ctx.used[ex.id]) s -= 2; // нэг хичээлд давтахгүй
    if (prev && prev.yoga && prev.yoga.next && prev.yoga.next.indexOf(ex.id) >= 0) s += 0.6;
    if (ex.snack && ctx.wantSnack) s += 0.5;
    s += rnd(ctx.seed + "|" + ex.id) * 0.3;
    return s;
  }
  function pick(cands, ctx, prev) {
    var ok = cands.filter(function (e) { return allowed(e, ctx); });
    if (!ok.length) return null;
    ok.sort(function (x, y) { var d = score(y, ctx, prev) - score(x, ctx, prev); return d !== 0 ? d : (x.id < y.id ? -1 : 1); });
    return ok[0];
  }
  function cands(q) {
    return Lib.exercises.filter(function (e) {
      if (q.type && (Array.isArray(q.type) ? q.type.indexOf(e.type) < 0 : e.type !== q.type)) return false;
      if (q.pattern && (Array.isArray(q.pattern) ? q.pattern.indexOf(e.pattern) < 0 : e.pattern !== q.pattern)) return false;
      if (q.unit && e.unit !== q.unit) return false;
      if (q.family && !(e.yoga && (Array.isArray(q.family) ? q.family.indexOf(e.yoga.family) >= 0 : e.yoga.family === q.family))) return false;
      if (q.muscle && !inter(e.muscles, Array.isArray(q.muscle) ? q.muscle : [q.muscle]).length) return false;
      if (q.snack && !e.snack) return false;
      if (q.maxLevel && e.level > q.maxLevel) return false;
      if (q.re && !(q.re.test(e.id) || q.re.test(e.en || ""))) return false;
      return true;
    });
  }
  function findLike(re, ctx) { return pick(cands({ re: re }), ctx); }

  // Сет, давталт (NSCA): эхлэгч 2–3×8–12 / хүч 3–4×6–10 / тэсвэр 2×12–20
  function prescribe(ex, ctx, slot) {
    var d = ex.defaults, p = ctx.p, a = ctx.a;
    var sets = d.sets, reps = d.reps, seconds = d.seconds, breaths = d.breaths, rest = d.rest || 0;
    var why = [];
    var lvlWhy = null;
    if (ex.type === "strength" && slot === "main") {
      if (a.level <= 1) { sets = 2; if (reps) reps = clamp(reps, 8, 10); rest = Math.max(rest, 60); lvlWhy = "Түвшин 1 → 2 сет × 8–10, 60 сек амралт"; }
      else if (a.level === 2) { sets = Math.min(3, Math.max(2, sets)); if (reps) reps = clamp(reps, 8, 12); rest = clamp(rest, 45, 60); lvlWhy = "Түвшин 2 → 2–3 сет × 8–12, 45–60 сек амралт"; }
      else if (ctx.goal === "muscle") { sets = Math.max(3, sets); if (reps) reps = ex.equipment.length ? clamp(reps, 6, 10) : clamp(reps, 8, 12); rest = clamp(rest, 60, 90); lvlWhy = "Булчин нэмэх, түвшин " + a.level + " → 3–4 сет × " + (ex.equipment.length ? "6–10" : "8–12") + ", 60–90 сек амралт, RIR 2"; }
      else if (ctx.goal === "fatloss" || ctx.goal === "fitness_energy") { sets = Math.max(2, Math.min(3, sets)); if (reps) reps = clamp(Math.round(reps * 1.3), 12, 15); rest = clamp(rest, 30, 45); lvlWhy = "Өөх хасах, түвшин " + a.level + " → 2–3 сет × 12–15, богино амралт"; }
      else lvlWhy = "Түвшин " + a.level + " → " + (reps ? "8–12 давталт" : "30–45 сек барилт") + ", RIR 2–3";
      if (seconds != null) seconds = Math.round(seconds * (a.level <= 1 ? 0.8 : a.level >= 4 ? 1.3 : 1));
    }
    if (ex.type === "strength" && (ctx.goal === "posture_back" || ctx.goal === "muscle") && ex.unit === "reps" && ex.pattern !== "core" && !ctx.deload) {
      var tempo = "3-1-1";
    }
    if (isOlder(p) && ex.type !== "yoga" && ex.type !== "breath") rest += 15;
    if (isPregnant(p)) { sets = Math.min(sets, 2); rest += 15; }
    if (ctx.setsDelta < 0 && sets > 1 && slot === "main") { sets = Math.max(1, sets + ctx.setsDelta); why = why.concat(ctx.setsWhy); }
    if (ctx.deload && slot !== "warm" && slot !== "cool") { var ns = Math.max(1, Math.round(sets * 0.6)); if (ns < sets) { sets = ns; rest += 20; why.push("Deload долоо хоног → сет −40%"); } }
    // дасан зохицол: хувь хүний ачаалал
    var mul = 1;
    Object.keys(ctx.loadMul).forEach(function (area) {
      if (ex.contra.indexOf(area) >= 0 || (area === "lowback" && has(ex.muscles, "back")) || (area === "knee" && (ex.pattern === "squat" || ex.pattern === "lunge")) || (area === "shoulder" && ex.pattern === "push")) {
        mul = Math.min(mul, ctx.loadMul[area]); why.push(cap(PAIN_MN[area] || area) + " өвдсөн → ачаалал −" + Math.round((1 - ctx.loadMul[area]) * 100) + "%");
      }
    });
    if (ctx.progressIds.indexOf(ex.id) >= 0) { mul *= 1.15; why.push("RPE ≤6 хоёр удаа → давталт +15%"); }
    if (ctx.regressIds.indexOf(ex.id) >= 0 && mul === 1) { mul *= 0.8; why.push("RPE ≥9 → давталт −20%"); }
    if (mul !== 1) { if (reps) reps = Math.max(4, Math.round(reps * mul)); if (seconds != null) seconds = Math.max(10, Math.round(seconds * mul)); if (breaths) breaths = Math.max(3, Math.round(breaths * mul)); }
    if (lvlWhy) why.unshift(lvlWhy);
    var item = { exId: ex.id, sets: sets, rest: rest, sides: ex.sides, why: why, tempo: typeof tempo !== "undefined" ? tempo : null };
    if (ex.unit === "seconds" && seconds != null) { item.seconds = seconds; if (reps != null) item.reps = reps; }
    else if (ex.unit === "breaths" && breaths != null) item.breaths = breaths;
    else if (reps != null) item.reps = reps; else if (seconds != null) item.seconds = seconds; else item.breaths = breaths || 5;
    return item;
  }

  // Слот дүүргэх: хэв маягийн жагсаалтаар нэг нэгийг сонгож, өвдөлтөөр солигдсон бол тайлбарлана
  function chooseFor(q, ctx, slot, prev) {
    var all = cands(q);
    var ex = pick(all, ctx, prev);
    if (!ex) return null;
    var why = [];
    // хасагдсан дээд сонголт (өвдөлт, жирэмслэлт г.м.)
    var ctx2 = Object.create(ctx); ctx2.used = ctx.used;
    var top = (function () {
      var ok = all.filter(function (e) { return allowed(e, ctx2, true) && !ctx.used[e.id]; });
      ok.sort(function (x, y) { var d = score(y, ctx2, prev) - score(x, ctx2, prev); return d !== 0 ? d : (x.id < y.id ? -1 : 1); });
      return ok[0];
    })();
    if (top && top.id !== ex.id && slot !== "cool") {
      var b = blockedBy(top, ctx);
      if (b.length) {
        var r = b[0];
        var reason = r === "pregnancy" ? "Жирэмсэн" : r === "postpartum" ? "Төрсний дараах үе" : r === "hypertension" ? "Даралт ихсэлт" : r === "inversion" ? "Урвуу поз хориотой" : cap(PAIN_MN[r]) + " өвддөг";
        why.push(reason + " → «" + top.name + "» хасаж, «" + ex.name + "»-ээр сольсон");
      }
    }
    // дасан зохицлоор progress/regress id руу шилжих
    if (ctx.progressIds.indexOf(ex.id) >= 0 && ex.progress) {
      var pr = byId(ex.progress);
      if (pr && allowed(pr, ctx) && !ctx.used[pr.id]) { why.push("Өнгөрсөн долоо хоногт «" + ex.name + "» RPE ≤6 → хүнд хувилбар «" + pr.name + "»"); ex = pr; }
    } else if (ctx.regressIds.indexOf(ex.id) >= 0 && ex.regress) {
      var rg = byId(ex.regress);
      if (rg && allowed(rg, ctx) && !ctx.used[rg.id]) { why.push("«" + ex.name + "» хэт хүнд (RPE ≥9 эсвэл өвдөлт) → хялбар хувилбар «" + rg.name + "»"); ex = rg; }
    }
    ctx.used[ex.id] = 1;
    var item = prescribe(ex, ctx, slot);
    if (slot === "main" && ex.type === "strength" && ex.pattern && PATTERN_MN[ex.pattern]) why.unshift(cap(PATTERN_MN[ex.pattern]) + " — " + ex.muscles.slice(0, 2).map(muscleMn).join(", "));
    if (ex.equipment.length) why.push("Хэрэгсэл: " + ex.equipment.map(eqMn).join(", "));
    if (ctx.p.space === "standing" && ex.position === "standing" && slot === "main") why.push("Зай: зөвхөн зогсоо → хэвтээ дасгалгүй");
    item.why = why.concat(item.why);
    if (!item.why.length) item.why.push((TYPE_MN[ex.type] || cap(ex.type)) + " — " + ex.muscles.slice(0, 2).map(muscleMn).join(", "));
    return item;
  }
  var MUSCLE_MN = { quads: "гуяны урд", hams: "гуяны ар", glutes: "өгзөг", calves: "тугал", chest: "цээж", back: "нуруу", shoulders: "мөр", biceps: "бицепс", triceps: "трицепс", core: "гол булчин", hipflex: "түнхний нугалагч", adductors: "гуяны дотор", spine: "нугалам", neck: "хүзүү", fullbody: "бүх бие" };
  function muscleMn(m) { return MUSCLE_MN[m] || m; }
  var EQ_MN = { mat: "дэвсгэр", wall: "хана", chair: "сандал", band: "резин", db: "гантель", kb: "гир" };
  function eqMn(e) { return EQ_MN[e] || e; }

  // Блокийн хугацааг тохируулах: сет нэмэх/хасах, амралт
  function fitItems(items, budget, ctx, opts) {
    opts = opts || {};
    var minSets = opts.minSets || 1, maxSets = opts.maxSets || (ctx.a.level <= 2 ? 3 : 4);
    if (ctx.deload) { budget = budget * 0.7; maxSets = Math.min(maxSets, 2); } // deload: 30% богино, сет ≤2
    var total = function () { return items.reduce(function (s, it) { return s + estimateItemSeconds(it); }, 0); };
    var guard = 0;
    while (total() > budget * 1.1 && guard++ < 40) {
      var big = null;
      items.forEach(function (it) { if (it.sets > minSets && (!big || it.sets > big.sets)) big = it; });
      if (big) { big.sets -= 1; continue; }
      var r = null;
      items.forEach(function (it) { if (it.rest > 20 && (!r || it.rest > r.rest)) r = it; });
      if (r) { r.rest = Math.max(20, r.rest - 15); continue; }
      if (items.length > (opts.minItems || 1)) { items.pop(); continue; }
      break;
    }
    guard = 0;
    while (!opts.noGrow && total() < budget * 0.85 && guard++ < 40) {
      var small = null;
      items.forEach(function (it) { if (it.sets < maxSets && (!small || it.sets < small.sets)) small = it; });
      if (small) { small.sets += 1; continue; }
      var grown = false, before = total();
      items.forEach(function (it) {
        if (grown) return;
        var ex = byId(it.exId), d = ex ? ex.defaults : {};
        var hold = it.reps != null && it.seconds != null; // 6 × 8 сек маягийн барилт: зөвхөн давталтаар өснө
        if (it.reps != null && (d.reps || 10) < 50 && it.reps < (d.reps || 10) * 1.5) { it.reps += 2; grown = "reps"; }
        else if (!hold && it.seconds != null && it.seconds < (d.seconds || 30) * 1.5) { it.seconds += 10; grown = "seconds"; }
        else if (it.breaths != null && it.breaths < 15) { it.breaths += 2; grown = "breaths"; }
        if (grown && total() > budget * 1.1) { it[grown] -= grown === "seconds" ? 10 : 2; grown = "stop"; } // хэтэрвэл буцаана
      });
      if (grown === "stop") break;
      if (!grown) items.forEach(function (it) { if (!grown && it.sets > 1 && it.rest < 90 && !opts.noRestGrow) { it.rest += 15; grown = true; } });
      if (!grown || total() === before) break;
    }
    return items;
  }

  function sessionBudget(ctx) {
    var T = ctx.minutes * 60;
    return { total: T, warm: Math.round(T * 0.125), main: Math.round(T * 0.65), extra: Math.round(T * 0.125), cool: Math.round(T * 0.1) };
  }
  function block(name, items) { return { name: name, items: items.filter(Boolean) }; }

  // Халаалт: мобилити, профайлаас хамаарч
  function warmItems(ctx, n, budget) {
    var p = ctx.p, items = [];
    ctx.wantSnack = false;
    var prefs = [];
    if (p.occupation === "desk" || has(p.pain, "neck")) prefs.push({ type: "mobility", muscle: ["neck", "shoulders", "chest"] });
    if (has(p.pain, "lowback") || ctx.goal === "posture_back") prefs.push({ type: "mobility", muscle: ["spine", "hipflex", "back"] });
    prefs.push({ type: "mobility", muscle: ["hipflex", "glutes", "hams"] }, { type: "mobility" }, { type: ["yoga"], family: "core" });
    for (var i = 0; items.length < n && i < prefs.length; i++) {
      var it = chooseFor(prefs[i], ctx, "warm");
      if (it) { it.sets = 1; it.why.push("Халаалт " + Math.round(budget / 60) + " мин" + (p.occupation === "desk" && i === 0 ? " — суугаа ажил → хүзүү, мөр" : "")); items.push(it); }
    }
    return fitItems(items, budget, ctx, { maxSets: 1, noGrow: true });
  }
  function coolItems(ctx, budget) {
    var items = [];
    var st = chooseFor({ type: ["mobility", "yoga"], family: ["forward", "restorative", "hipopen"] }, ctx, "cool") || chooseFor({ type: "mobility" }, ctx, "cool");
    if (st) { st.sets = 1; st.why.push("Тайвшрал — суналт"); items.push(st); }
    var br = chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "cool") || chooseFor({ type: "breath", unit: "breaths" }, ctx, "cool");
    if (br) { br.sets = 1; br.why.push((ctx.p.stress || 0) >= 4 ? "Стресс " + ctx.p.stress + "/5 → удаан амьсгалаар дуусгана" : "Амьсгалаар тайвшруулж дуусгана"); items.push(br); }
    return fitItems(items, budget, ctx, { maxSets: 1, noGrow: true });
  }
  function mainPatterns(ctx, count) {
    var g = ctx.goal, p = ctx.p;
    var order;
    if (g === "muscle") order = ["squat", "push", "pull", "hinge", "core", "lunge"];
    else if (g === "posture_back") order = ["hinge", "pull", "squat", "push", "rotation", "core"];
    else if (isOlder(p) || g === "older_balance") order = ["squat", "push", "pull", "hinge", "balance", "core"];
    else if (isPregnant(p)) order = ["squat", "pull", "push", "hinge", "balance", "core"];
    else if (g === "event_5k") order = ["squat", "hinge", "lunge", "core", "push", "pull"];
    else order = ["squat", "push", "hinge", "pull", "core", "lunge"];
    if (ctx.weekIndex % 2 === 1 && order.indexOf("lunge") > 4 && count >= 5) { // хувьсал: сондгой долоо хоногт lunge орж hinge-тэй ээлжилнэ
      order = order.map(function (x) { return x === "hinge" ? "lunge" : x === "lunge" ? "hinge" : x; });
    }
    return order.slice(0, count);
  }
  function strengthMain(ctx, budget, patterns) {
    var items = [];
    patterns.forEach(function (pt) {
      var it = chooseFor({ type: "strength", pattern: pt }, ctx, "main");
      if (!it && pt !== "core") it = chooseFor({ type: ["strength", "pilates"], pattern: pt }, ctx, "main");
      if (it) items.push(it);
    });
    return fitItems(items, budget, ctx, { minSets: ctx.deload ? 1 : 2, minItems: Math.min(2, items.length) });
  }
  function extraItems(ctx, budget) {
    var p = ctx.p, g = ctx.goal, items = [], it;
    if (hasMet(p, "htn")) {
      it = findLike(/wall.?sit/i, ctx) ? chooseFor({ re: /wall.?sit/i }, ctx, "extra") : chooseFor({ type: "strength", unit: "seconds", pattern: "squat" }, ctx, "extra");
      if (it) { it.sets = 2; it.why.push("Даралт ихсэлт → изометрик (ханын суулт) систолын даралтыг хамгийн их бууруулдаг, амьсгалаа барихгүй"); items.push(it); }
      var pl = chooseFor({ type: "strength", unit: "seconds", pattern: "core" }, ctx, "extra");
      if (pl && budget > 120) { pl.sets = 2; pl.why.push("Изометрик планк — тэвчих хэмжээнд, 60 секундээс хэтрүүлэхгүй"); items.push(pl); }
    } else if (isOlder(p) || g === "older_balance") {
      it = chooseFor({ pattern: "balance" }, ctx, "extra");
      if (it) { it.why.push(p.age + " настай → тэнцвэрийн дасгал өдөр бүр, сандлын дэргэд"); items.push(it); }
    } else if (isPregnant(p) || isEarlyPP(p)) {
      it = chooseFor({ re: /pelvic.?floor|kegel/i }, ctx, "extra") || chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "extra");
      if (it) { it.why.push(isPregnant(p) ? "Жирэмсэн → аарцагны ёроол" : "Төрсний дараа → аарцагны ёроол (шээс задгайрах эрсдэл −41%)"); items.push(it); }
    } else if (g === "fatloss" || g === "fitness_energy") {
      it = chooseFor({ type: "cardio", pattern: "gait", unit: "seconds" }, ctx, "extra") || chooseFor({ type: "strength", pattern: "carry" }, ctx, "extra");
      if (it && it.seconds > 300) it.seconds = 60;
      if (it) { it.why.push("Өөх хасах → хичээлийн төгсгөлд 2–3 минут кардио"); items.push(it); }
    } else if (g === "posture_back") {
      it = chooseFor({ type: ["strength", "mobility"], pattern: "rotation" }, ctx, "extra");
      if (it) { it.why.push("Нуруу → эргэлтийн хөдөлгөөн, цээжний нугаламд"); items.push(it); }
    } else if (g === "muscle") {
      it = chooseFor({ type: "strength", pattern: ["lunge", "carry"] }, ctx, "extra");
      if (it) { it.why.push("Булчин нэмэх → нэг талын дасгал нэмэлт эзлэхүүн"); items.push(it); }
    } else if (g === "mobility") {
      it = chooseFor({ type: "mobility", unit: "seconds" }, ctx, "extra");
      if (it) { it.why.push("Уян хатан → суналт 30–60 сек × 2"); it.sets = 2; items.push(it); }
    } else if (g === "stress_sleep") {
      it = chooseFor({ type: "breath", unit: "breaths" }, ctx, "extra");
      if (it) { it.why.push("Стресс, нойр → амьсгал"); items.push(it); }
    } else {
      it = chooseFor({ type: ["strength", "pilates"], pattern: "core" }, ctx, "extra");
      if (it) { it.why.push("Гол булчин"); items.push(it); }
    }
    return fitItems(items, budget, ctx, { maxSets: 2, minItems: 0 });
  }
  function mcgill(ctx) {
    var out = [];
    [[/curl.?up/i, "МакГиллийн атирах"], [/side.?plank/i, "хажуугийн планк"], [/bird.?dog/i, "шувуу нохой"]].forEach(function (x) {
      var it = chooseFor({ re: x[0], type: ["strength", "pilates"] }, ctx, "warm");
      if (it) { it.sets = 1; it.why.push("Нурууны өвдөлт → МакГиллийн 3 (" + x[1] + ") халаалт бүрт"); out.push(it); }
    });
    return out;
  }

  function sessionId(ctx, dow, type) { return "w" + ctx.weekIndex + "-d" + dow + "-" + type; }
  function finishSession(s, ctx, bud, fitOpts) {
    // ерөнхий хугацааны баталгаа: үндсэн блок дээр
    var p = ctx.p;
    var est = estimateMinutes(s) * 60;
    var main = s.blocks.filter(function (b) { return b.name === "Үндсэн"; })[0];
    if (main && main.items.length) {
      var target = (ctx.deload ? bud.total * 0.7 : bud.total) - (est - main.items.reduce(function (a, it) { return a + estimateItemSeconds(it); }, 0));
      var save = ctx.deload; ctx.deload = false; // хуваарилалтыг дээр нь аль хэдийн 70% болгосон
      var fo = { minSets: 1, minItems: Math.min(2, main.items.length), maxSets: save ? 2 : (ctx.a.level <= 2 ? 3 : 4) };
      if (fitOpts) Object.keys(fitOpts).forEach(function (k) { fo[k] = fitOpts[k]; });
      if (save && fo.maxSets > 2) fo.maxSets = 2;
      fitItems(main.items, Math.max(60, target), ctx, fo);
      ctx.deload = save;
    }
    s.minutes = ctx.minutes;
    s.why.unshift("Өдөрт " + ctx.minutes + " минут → халаалт " + Math.round(bud.warm / 60) + " мин, үндсэн " + Math.round(bud.main / 60) + " мин, тайвшрал " + Math.round(bud.cool / 60) + " мин");
    var hasTempo = false, hasLoad = false;
    s.blocks.forEach(function (b) { b.items.forEach(function (it) { if (it.tempo) hasTempo = true; var e = byId(it.exId); if (e && (e.type === "strength" || e.type === "pilates")) hasLoad = true; }); });
    if (hasTempo) s.why.push("Темп 3-1-1: 3 сек буулгаж, 1 сек зогсоод, 1 сек өргөнө — хяналт, булчингийн ачаалал");
    if (isOlder(p) && hasLoad) s.why.push(p.age + " настай → дасгал бүрт амралт +15 сек, сандлын дэмжлэгтэй хувилбар эхэнд");
    if (hasMet(p, "htn") && hasLoad) s.why.push("Даралт ихсэлт → амьсгалаа барихгүй, хүч гаргах мөчид гаргаж амьсгална, толгой доош позгүй");
    if (isPregnant(p) && hasLoad) s.why.push("Жирэмсэн → 2 сетээс ихгүй, ярьж чадах эрчим, амьсгалаа барихгүй");
    if (ctx.deload) s.why.push("Deload долоо хоног → сет 40% бага, хичээл богино байж болно");
    return s;
  }

  function buildStrength(ctx, dow, withBalance) {
    var bud = sessionBudget(ctx);
    var warm = ctx.goal === "posture_back" || has(ctx.p.pain, "lowback") ? fitItems(mcgill(ctx).concat(warmItems(ctx, 1, bud.warm / 2)), bud.warm, ctx, { maxSets: 1, noGrow: true }) : warmItems(ctx, bud.warm >= 150 ? 2 : 1, bud.warm);
    var count = clamp(Math.round(bud.main / 110), 2, 6);
    var pats = mainPatterns(ctx, count);
    var main = strengthMain(ctx, bud.main, pats);
    var extra;
    if (withBalance) {
      extra = [];
      var b1 = chooseFor({ pattern: "balance" }, ctx, "extra");
      var balWhy = isOlder(ctx.p) ? ctx.p.age + " настай → тэнцвэрийн дасгал хичээл бүрт (уналтаас сэргийлнэ)" : isMenopause(ctx.p) ? "Цэвэршилт → тэнцвэр, ясны эрүүл мэндэд" : isPregnant(ctx.p) ? "Жирэмсэн → хүндийн төв өөрчлөгддөг тул тэнцвэр хичээл бүрт" : "Тэнцвэрийн дасгал хичээл бүрт";
      if (b1) { b1.why.push(balWhy); extra.push(b1); }
      if (bud.extra > 120) { var b2 = chooseFor({ pattern: "balance" }, ctx, "extra"); if (b2) { b2.why.push("Тэнцвэр — хоёр дахь дасгал, сандал/ханын дэргэд"); extra.push(b2); } }
      fitItems(extra, bud.extra, ctx, { maxSets: 2, minItems: 0 });
    } else extra = extraItems(ctx, bud.extra);
    var cool = coolItems(ctx, bud.cool);
    var title = withBalance ? "Хүч + тэнцвэр" : ctx.goal === "posture_back" ? "Хүч + нуруу" : "Хүч + сунгалт";
    var s = { id: sessionId(ctx, dow, withBalance ? "mix" : "strength"), title: title, type: withBalance ? "mix" : "strength", minutes: ctx.minutes,
      blocks: [block("Халаалт", warm), block("Үндсэн", main), block("Нэмэлт", extra), block("Тайвшрал", cool)].filter(function (b) { return b.items.length; }),
      why: [typeReason(ctx.p, withBalance ? "mix" : "strength"), "Хэв маяг: " + pats.map(function (x) { return PATTERN_MN[x]; }).join(", ") + " — тус бүрээс нэг дасгал"] };
    return finishSession(s, ctx, bud);
  }

  // Йога: Ирэх → Халаалт → Зогсоо → Оргил → Эсрэг → Шал → Тайвшрал, yoga.next графаар
  function buildYoga(ctx, dow) {
    var bud = sessionBudget(ctx), p = ctx.p, g = ctx.goal;
    var arrive = [], warm = [], standing = [], floor = [], rest = [];
    var br = chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "warm");
    if (br) { br.why.push("Ирэх — нэг минут амьсгалаар эхэлнэ"); arrive.push(br); }
    var w = chooseFor({ type: "yoga", re: /cat_cow|cat|cow|child|sun_salut|pelvic/i, maxLevel: 2 }, ctx, "warm") || chooseFor({ type: "mobility", muscle: ["spine", "hipflex"] }, ctx, "warm") || chooseFor({ type: "yoga", family: "core", maxLevel: 2 }, ctx, "warm");
    if (w) { w.why.push("Халаалт — нуруу, түнх"); warm.push(w); }
    var prev = w ? byId(w.exId) : null;
    var nStand = clamp(Math.round(bud.main / 280), 2, 5); // 20 мин → 3 зогсоо поз, 30 мин → 4, 45 мин → 5
    for (var i = 0; i < nStand; i++) {
      var st = chooseFor({ type: "yoga", family: "standing" }, ctx, "main", prev);
      if (st) { st.why.push("Зогсоо поз — оргилд бэлтгэнэ"); standing.push(st); prev = byId(st.exId); }
    }
    var peakFamily = g === "mobility" ? ["hipopen", "forward"] : g === "stress_sleep" ? ["forward", "restorative"] : g === "posture_back" ? ["back"] : (isOlder(p) || g === "older_balance") ? ["balance"] : isPregnant(p) ? ["standing", "balance"] : ["balance", "back"];
    var peak = chooseFor({ type: "yoga", family: peakFamily }, ctx, "main", prev);
    if (peak) { peak.why.push("Оргил поз — зорилго «" + (GOAL_MN[g] || g) + "» → " + famMn(byId(peak.exId).yoga.family)); standing.push(peak); prev = byId(peak.exId); }
    var pe = peak ? byId(peak.exId) : null;
    var counter = null;
    if (pe && pe.yoga && pe.yoga.counter && pe.yoga.counter.length) {
      var cEx = byId(pe.yoga.counter[0]);
      if (cEx && allowed(cEx, ctx) && !ctx.used[cEx.id]) { ctx.used[cEx.id] = 1; counter = prescribe(cEx, ctx, "main"); counter.why.unshift("Эсрэг поз — «" + pe.name + "»-ийн дараа"); }
    }
    if (!counter && pe) {
      var opp = { back: ["forward", "restorative"], forward: ["twist", "restorative"], twist: ["forward"], hipopen: ["forward"], balance: ["forward"], standing: ["forward"], inversion: ["restorative"], restorative: ["twist"], core: ["back"] }[pe.yoga.family] || ["forward"];
      counter = chooseFor({ type: "yoga", family: opp }, ctx, "main", pe);
      if (counter) counter.why.push("Эсрэг поз");
    }
    if (counter) floor.push(counter);
    prev = counter ? byId(counter.exId) : pe;
    var nFloor = clamp(Math.round(bud.main / 450), 1, 4);
    for (var j = 0; j < nFloor; j++) {
      var fl = chooseFor({ type: "yoga", family: ["forward", "twist", "hipopen"] }, ctx, "main", prev);
      if (fl) { fl.why.push("Шалан дээр — идэвхтэйгээс идэвхгүй рүү"); floor.push(fl); prev = byId(fl.exId); }
    }
    var rs = chooseFor({ type: "yoga", family: "restorative" }, ctx, "cool", prev) || chooseFor({ type: "breath", unit: "breaths" }, ctx, "cool");
    if (rs) { rs.why.push(isPregnant(p) && trimester(p) >= 2 ? "Жирэмсэн 2–3-р гурван сар → нуруугаар хэвтэхгүй, хажуугаар амарна" : "Тайвшрал — «" + byId(rs.exId).name + "», 1–2 минут амрах"); rest.push(rs); }
    if (g === "stress_sleep" && bud.cool >= 180) { var nd = chooseFor({ type: "breath", unit: "seconds" }, ctx, "cool"); if (nd) { nd.seconds = Math.min(nd.seconds, 300); nd.why.push("Стресс, нойр → богино нидра/биеэ ажиглах"); rest.push(nd); } }
    // амьсгалын тоогоор хугацааг дүүргэнэ
    var mainItems = standing.concat(floor);
    var each = mainItems.reduce(function (a, it) { return a + (it.sides === "each" ? 2 : 1); }, 0) || 1;
    var per = clamp(Math.round((bud.main * (ctx.deload ? 0.7 : 1) - mainItems.length * 10) / 5 / each), 3, 15);
    mainItems.forEach(function (it) { if (it.breaths != null) it.breaths = per; it.sets = 1; it.rest = 0; it.why.push(per + " амьсгал ≈ " + Math.round(per * 5 * (it.sides === "each" ? 2 : 1) / 10) * 10 + " сек" + (it.sides === "each" ? " (тал бүр)" : "")); });
    fitItems(arrive.concat(warm), bud.warm, ctx, { maxSets: 1 });
    fitItems(rest, bud.cool, ctx, { maxSets: 1 });
    var s = { id: sessionId(ctx, dow, "yoga"), title: g === "stress_sleep" ? "Йога + амьсгал" : "Йога", type: "yoga", minutes: ctx.minutes,
      blocks: [block("Халаалт", arrive.concat(warm)), block("Үндсэн", standing), block("Нэмэлт", floor), block("Тайвшрал", rest)].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "yoga"), "Дараалал: амьсгал → халаалт → зогсоо → оргил → эсрэг поз → шал → тайвшрал"] };
    return finishSession(s, ctx, bud, { maxSets: 2, noRestGrow: true }); // поз дутвал зөвхөн 2 дахь тойрог нэмнэ
  }
  function famMn(f) { return { standing: "зогсоо", forward: "урагш бөхийлт", back: "ар нугалалт", twist: "мушгилт", inversion: "урвуу", restorative: "амралт", balance: "тэнцвэр", hipopen: "түнх нээх", core: "гол булчин" }[f] || f; }

  // Пилатес: tier ≤ coreLevel, сонгодог дараалал, Hundred эхэнд
  function buildPilates(ctx, dow) {
    var bud = sessionBudget(ctx), a = ctx.a, p = ctx.p;
    var tier = a.coreLevel <= 2 ? 1 : a.coreLevel === 3 ? 2 : 3;
    if (isPregnant(p) || isEarlyPP(p)) tier = 1;
    var warm = [];
    var br = chooseFor({ type: ["pilates", "breath"], re: /breath|амьсгал/i, unit: "breaths", maxLevel: 1 }, ctx, "warm") || chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "warm");
    if (br) { br.why.push("Пилатес амьсгал, төвлөрлөөр эхэлнэ"); warm.push(br); }
    var pt = chooseFor({ type: ["pilates", "yoga"], re: /pelvic|tilt|cat/i, maxLevel: 1 }, ctx, "warm");
    if (pt) { pt.why.push("Аарцаг, нуруу халаана"); warm.push(pt); }
    var pool = cands({ type: "pilates" }).filter(function (e) { return e.pilates && e.pilates.tier <= tier && allowed(e, ctx) && !ctx.used[e.id]; });
    pool.sort(function (x, y) {
      var cx = x.pilates.classical == null ? 99 : x.pilates.classical, cy = y.pilates.classical == null ? 99 : y.pilates.classical;
      return cx - cy || (x.id < y.id ? -1 : 1);
    });
    var n = clamp(Math.round(bud.main / 75), 4, 10);
    // хувьсал: сондгой долоо хоногт сонгодог дарааллын дунд хэсгийг илүү авна
    var start = pool.length > n && ctx.weekIndex % 2 === 1 ? Math.min(2, pool.length - n) : 0;
    var chosen = pool.slice(start, start + n);
    if (pool[0] && pool[0].pilates.classical === 1 && chosen.indexOf(pool[0]) < 0) chosen.unshift(pool[0]);
    var main = chosen.map(function (e) {
      ctx.used[e.id] = 1;
      var it = prescribe(e, ctx, "main");
      it.why.unshift(e.pilates.classical ? "Сонгодог дарааллын " + e.pilates.classical + "-р дасгал, tier " + e.pilates.tier + " ≤ гол булчингийн түвшин " + a.coreLevel : "Пилатес, tier " + e.pilates.tier);
      if (e.pilates.classical === 1) it.why.push("«Зуу» дарааллын эхэнд");
      return it;
    });
    fitItems(main, bud.main + bud.extra, ctx, { minSets: 1, maxSets: 2, minItems: Math.min(4, main.length) });
    var cool = coolItems(ctx, bud.cool);
    var s = { id: sessionId(ctx, dow, "pilates"), title: "Пилатес", type: "pilates", minutes: ctx.minutes,
      blocks: [block("Халаалт", fitItems(warm, bud.warm, ctx, { maxSets: 1 })), block("Үндсэн", main), block("Тайвшрал", cool)].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "pilates"), "Tier " + tier + " — гол булчингийн түвшин " + a.coreLevel + ", сонгодог дарааллаар " + main.length + " дасгал"] };
    if (has(p.pain, "lowback") || isPregnant(p)) s.why.push((isPregnant(p) ? "Жирэмсэн" : "Бүсэлхий өвддөг") + " → roll-up, нурууны ачаалалтай нугалалтын дасгалууд хасагдсан");
    return finishSession(s, ctx, bud, { maxSets: 2 });
  }

  // Төрсний дараах сэргээлт (<12 долоо хоног): аарцагны ёроол, амьсгал, гүүр
  function buildRecovery(ctx, dow) {
    var bud = sessionBudget(ctx), p = ctx.p, w = weeksPP(p);
    var warm = [], main = [], cool = [];
    var br = chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "warm");
    if (br) { br.why.push("Хэвлийн амьсгал — өрц, аарцагны ёроол хамт ажиллана"); warm.push(br); }
    var pf = chooseFor({ re: /pelvic.?floor|kegel/i }, ctx, "main");
    if (pf) { pf.why.push("Төрснөөс хойш " + w + " долоо хоног → аарцагны ёроол (PFMT) өдөр бүр"); main.push(pf); }
    if (w >= 6) {
      [{ re: /pelvic.?tilt|tilt/i }, { re: /bridge|гүүр/i, type: ["strength", "pilates", "yoga"] }, { re: /bird.?dog/i }, { re: /side.?kick|clam/i }, { type: "strength", pattern: "squat" }].forEach(function (q) {
        if (main.length >= 5) return;
        var it = chooseFor(q, ctx, "main");
        if (it) { it.why.push("6–12 долоо хоног → гол булчин, өгзөг, үсрэлтгүй"); main.push(it); }
      });
    } else {
      var wk = chooseFor({ type: "cardio", pattern: "gait" }, ctx, "main");
      if (wk) { wk.seconds = Math.min(wk.seconds || 600, 600); wk.why.push("6 долоо хоног хүртэл зөвхөн алхалт, амьсгал, аарцаг"); main.push(wk); }
    }
    var st = chooseFor({ type: ["yoga", "mobility"], family: ["restorative"] }, ctx, "cool") || chooseFor({ type: "mobility" }, ctx, "cool");
    if (st) cool.push(st);
    fitItems(main, bud.main + bud.extra, ctx, { minSets: 1, maxSets: 3, minItems: Math.min(2, main.length) });
    var s = { id: sessionId(ctx, dow, "pilates"), title: "Төрсний дараах сэргээлт", type: "pilates", minutes: ctx.minutes,
      blocks: [block("Халаалт", fitItems(warm, bud.warm, ctx, { maxSets: 1 })), block("Үндсэн", main), block("Тайвшрал", fitItems(cool, bud.cool, ctx, { maxSets: 1 }))].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "recovery"), "Задгайрал, хүндрэл байвал эмч/эх барихтай зөвлөнө; хэвлий «гүвдрүүлж» байвал дасгалыг хөнгөлнө"] };
    return finishSession(s, ctx, bud);
  }

  function buildWalk(ctx, dow, postMeal) {
    var bud = sessionBudget(ctx), p = ctx.p, g = ctx.goal;
    var mins = postMeal ? 10 : ctx.minutes;
    var warm = [], main = [], cool = [];
    var wk;
    if (g === "event_5k") wk = chooseFor({ re: /run|interval/i, type: "cardio" }, ctx, "main");
    if (postMeal) wk = chooseFor({ re: /post.?meal/i, type: "cardio", unit: "seconds" }, ctx, "main");
    else if (!wk) wk = chooseFor({ type: "cardio", pattern: "gait", unit: "seconds", re: /easy|brisk|interval/i }, ctx, "main");
    if (!wk) wk = chooseFor({ type: "cardio", pattern: "gait", unit: "seconds", re: /walk/i }, ctx, "main");
    if (!wk) { var relaxed = Object.create(ctx); relaxed.maxImpact = Math.max(ctx.maxImpact, 1); wk = chooseFor({ type: "cardio", pattern: "gait", unit: "seconds", re: /walk/i }, relaxed, "main") || chooseFor({ type: "cardio", pattern: "gait" }, relaxed, "main"); }
    if (!wk) wk = { exId: "cardio_walk", sets: 1, seconds: 0, rest: 0, sides: "both", why: [], tempo: null };
    wk.sets = 1; wk.rest = 0;
    var walkSec = (mins - (postMeal ? 0 : 3)) * 60;
    wk.seconds = Math.max(300, walkSec);
    wk.why.push(postMeal ? "Чихрийн шижин → хоолны дараа 10–15 минут алхахад сахар буурна" : hasMet(p, "htn") ? "Даралт → аэробик долоо хоногт 150 мин, ярьж чадах хурдаар" : g === "event_5k" ? "5 км → интервал алхалт/гүй-алх, долоо хоногт эзлэхүүн +10%-иас ихгүй" : "Алхамын зорилт " + stepsTarget(p, ctx.a, ctx.weekIndex) + " → " + mins + " мин алхалт ≈ " + Math.round(mins * 100 / 500) * 500 + " алхам");
    if (monthOf(ctx.now) >= 11 || monthOf(ctx.now) <= 3) wk.why.push("Өвөл утаатай өдөр → гэртээ газар дээрээ алхах, шатаар өгсөх ижил минут");
    main.push(wk);
    if (!postMeal) {
      var c1 = chooseFor({ type: "mobility", muscle: ["calves", "hams", "hipflex"] }, ctx, "warm");
      if (c1) { c1.sets = 1; c1.why.push("Тугал, түнх халаана"); warm.push(c1); }
      var c2 = chooseFor({ type: "mobility", muscle: ["calves", "hams"] }, ctx, "cool");
      if (c2) { c2.sets = 1; cool.push(c2); }
    }
    var s = { id: sessionId(ctx, dow, "walk"), title: postMeal ? "Хоолны дараах алхалт" : g === "event_5k" ? "Интервал алхалт" : "Алхалт", type: "walk", minutes: mins,
      blocks: [block("Халаалт", warm), block("Үндсэн", main), block("Тайвшрал", cool)].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "walk")] };
    if (!postMeal) { s.why.unshift("Өдөрт " + mins + " минут → " + Math.round(wk.seconds / 60) + " мин алхалт + халаалт, суналт"); }
    s.minutes = mins;
    return s;
  }
  function buildMobility(ctx, dow) {
    var bud = sessionBudget(ctx), p = ctx.p;
    var items = [], prefs = [];
    if (p.occupation === "desk" || has(p.pain, "neck")) prefs.push({ type: "mobility", muscle: ["neck", "shoulders"] }, { type: "mobility", muscle: ["chest"] });
    prefs.push({ type: "mobility", muscle: ["spine", "back"] }, { type: "mobility", muscle: ["hipflex"] }, { type: "mobility", muscle: ["hams"] }, { type: "mobility", muscle: ["calves"] }, { type: ["mobility", "yoga"], family: ["hipopen", "forward"] }, { type: "mobility" });
    var n = clamp(Math.round((bud.main + bud.extra) / 70), 3, 8);
    for (var i = 0; items.length < n && i < prefs.length; i++) {
      var it = chooseFor(prefs[i], ctx, "main");
      if (it) { if (it.seconds != null && it.reps == null) it.seconds = Math.max(it.seconds, 30); it.sets = 2; it.why.push(it.seconds != null && it.reps == null ? "Суналт 30–60 сек × 2 — долоо хоногт нийт 5 мин/булчин хэрэгтэй" : "Хөдөлгөөнт мобилити — үений бүрэн далайцаар, удаан"); items.push(it); }
    }
    fitItems(items, bud.main + bud.extra, ctx, { minSets: 1, maxSets: 3, minItems: 3 });
    var warm = warmItems(ctx, 1, bud.warm);
    var cool = [];
    var br = chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "cool");
    if (br) cool.push(br);
    var s = { id: sessionId(ctx, dow, "mobility"), title: "Мобилити", type: "mobility", minutes: ctx.minutes,
      blocks: [block("Халаалт", warm), block("Үндсэн", items), block("Тайвшрал", fitItems(cool, bud.cool, ctx, { maxSets: 1 }))].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "mobility")] };
    return finishSession(s, ctx, bud, { maxSets: 3 });
  }
  function buildBreath(ctx, dow) {
    var bud = sessionBudget(ctx), p = ctx.p;
    var items = [], warm = [], cool = [];
    var bs = chooseFor({ type: "breath", unit: "seconds" }, ctx, "warm");
    if (bs) { bs.seconds = Math.min(bs.seconds, 180); bs.why.push("Биеэ ажиглаж эхэлнэ"); warm.push(bs); }
    var co = chooseFor({ type: "breath", unit: "breaths", maxLevel: 1 }, ctx, "main");
    if (co) { co.breaths = clamp(Math.round(bud.main * 0.6 / 10), 10, 40); co.why.push("Минутад 6 амьсгал (5 сек орох, 5 сек гарах) — түгшүүр, даралтад нотлогдсон"); items.push(co); }
    var b2 = chooseFor({ type: "breath", unit: "breaths" }, ctx, "main");
    if (b2) { b2.why.push(hasMet(p, "htn") || isPregnant(p) ? "Амьсгал барихгүй хувилбар" : "Хоёр дахь техник"); items.push(b2); }
    var rs = chooseFor({ type: "yoga", family: "restorative" }, ctx, "main");
    if (rs) { rs.breaths = 10; rs.why.push("Амралтын поз"); items.push(rs); }
    var nd = chooseFor({ type: "breath", unit: "seconds" }, ctx, "cool");
    if (nd) { nd.seconds = Math.min(nd.seconds, Math.max(120, bud.cool + bud.extra)); nd.why.push("Унтахын өмнө 10–20 мин нидра 3+ шөнө → нойр"); cool.push(nd); }
    fitItems(items, bud.main, ctx, { minSets: 1, maxSets: 2 });
    var s = { id: sessionId(ctx, dow, "breath"), title: "Амьсгал, тайвшрал", type: "breath", minutes: ctx.minutes,
      blocks: [block("Халаалт", warm), block("Үндсэн", items), block("Тайвшрал", cool)].filter(function (b) { return b.items.length; }),
      why: [typeReason(p, "breath"), "Эрчимтэй дасгалыг унтахаас 1–2 цагийн өмнө дуусгана, амьсгал хэзээ ч болно"] };
    return finishSession(s, ctx, bud);
  }
  function buildSession(type, ctx, dow) {
    ctx.used = {};
    switch (type) {
      case "strength": return buildStrength(ctx, dow, false);
      case "mix": return buildStrength(ctx, dow, true);
      case "yoga": return buildYoga(ctx, dow);
      case "pilates": return buildPilates(ctx, dow);
      case "recovery": return buildRecovery(ctx, dow);
      case "walk": return buildWalk(ctx, dow, false);
      case "mobility": return buildMobility(ctx, dow);
      case "breath": return buildBreath(ctx, dow);
      default: return buildStrength(ctx, dow, false);
    }
  }
  // Зууш (≤5 мин)
  function buildSnacks(ctx) {
    var p = ctx.p, out = [];
    function snack(id, title, qs, why) {
      ctx.used = {}; ctx.wantSnack = true;
      var items = [];
      qs.forEach(function (q) { q.snack = true; var it = chooseFor(q, ctx, "main"); if (!it) { delete q.snack; it = chooseFor(q, ctx, "main"); } if (it) { it.sets = 1; it.rest = 0; items.push(it); } });
      ctx.wantSnack = false;
      fitItems(items, 280, ctx, { minSets: 1, maxSets: 2, minItems: 1, noGrow: true });
      if (!items.length) return;
      out.push({ id: "w" + ctx.weekIndex + "-snack-" + id, title: title, type: "mobility", minutes: Math.max(1, Math.round(estimateMinutes({ blocks: [{ items: items }] }))), blocks: [{ name: "Үндсэн", items: items }], why: why });
    }
    if (isPregnant(p) || isEarlyPP(p)) snack("a", "Аарцаг + амьсгал", [{ re: /pelvic.?floor|kegel/i }, { type: "breath", unit: "breaths", maxLevel: 1 }], ["Өдөр бүр аарцагны ёроол, амьсгал — 5 минут"]);
    else if (p.occupation === "desk" || has(p.pain, "neck")) snack("a", "Хүзүү, мөрний завсарлага", [{ type: "mobility", muscle: ["neck"] }, { type: "mobility", muscle: ["shoulders", "chest"] }, { type: "strength", pattern: "pull", maxLevel: 2 }], ["Суугаа ажил → цаг тутамд босож 3–5 минут хүзүү, мөр"]);
    else snack("a", "Мобилити зууш", [{ type: "mobility", muscle: ["hipflex", "glutes"] }, { type: "mobility", muscle: ["spine"] }, { type: "mobility", muscle: ["calves"] }], ["Өдөр бүр 5 минут мобилити — долоо хоногийн суналтын тунг гүйцээнэ"]);
    if (isOlder(p) || primaryGoal(p) === "older_balance") snack("b", "Тэнцвэрийн зууш", [{ pattern: "balance" }, { type: "strength", pattern: "squat", maxLevel: 2 }], [p.age + " настай → тэнцвэр өдөр бүр, сандлын дэргэд"]);
    else if (hasMet(p, "htn")) snack("b", "Изометрик зууш", [{ type: "strength", unit: "seconds", pattern: "squat" }, { type: "breath", unit: "breaths", maxLevel: 1 }], ["Даралт → ханын суулт 2 × 1 мин, дараа нь удаан амьсгал"]);
    else if (primaryGoal(p) === "stress_sleep") snack("b", "Амьсгалын зууш", [{ type: "breath", unit: "breaths", maxLevel: 1 }, { type: "yoga", family: "restorative" }], ["Стресс → өдөрт 5 минут удаан амьсгал"]);
    else snack("b", "Хүчний зууш", [{ type: "strength", pattern: "squat", maxLevel: 2 }, { type: "strength", pattern: "push", maxLevel: 2 }], ["Суулт + түлхэлт 1 сет — хичээлгүй өдөр ч булчин сэрнэ"]);
    return out;
  }

  function buildProgram(profile, assessment, opts) {
    var p = profile, a = assessment || assess(profile, opts && opts.now);
    opts = opts || {};
    var weekIndex = opts.weekIndex || 0;
    var adaptOpts = opts.adapt || null;
    if (!adaptOpts && opts.prev && opts.logs && opts.logs.length) adaptOpts = adapt(opts.prev, p, opts.logs).nextOpts;
    var ctx = makeCtx(p, a, { weekIndex: weekIndex, prev: opts.prev, adapt: adaptOpts });
    ctx.now = opts.now;
    var scr = screen(p);
    var days = [], notes = [], history = {};
    var steps = stepsTarget(p, a, weekIndex);
    var dpw = clamp((p.daysPerWeek || 3) + ((adaptOpts && adaptOpts.daysDelta) || 0), 1, 7);
    var title = (weekIndex + 1) + "-р долоо хоног: " + PHASE_MN[ctx.phase];

    if (scr.stop) {
      // Эмчийн зөвшөөрөл хүлээх: зөвхөн хөнгөн алхалт
      for (var d0 = 1; d0 <= 7; d0++) {
        var isW = d0 !== 7;
        var ws = null;
        if (isW) { ctx.used = {}; ws = buildWalk(ctx, d0, true); ws.title = "Хөнгөн алхалт"; ws.why = ["PAR-Q+ «Тийм» → эмчийн зөвшөөрөл хүртэл зөвхөн хөнгөн алхалт"]; }
        days.push({ dow: d0, kind: isW ? "walk" : "rest", session: ws, why: [isW ? "Эмчийн зөвшөөрөл хүлээж байна → 10 минут ярьж чадах хурдтай алхалт" : "Амралт"] });
      }
      notes.push(scr.flags[0].text, "Эмчийн зөвшөөрөл авсны дараа «Би» хэсгээс PAR-Q+ хариултаа шинэчилбэл бүрэн хөтөлбөр үүснэ.");
      return { id: "p" + weekIndex + "-" + rnd(ctx.seed).toString(36).slice(2, 8), version: VERSION, weekIndex: weekIndex, createdAt: opts.now ? new Date(opts.now).toISOString() : null,
        goals: p.goals || [], title: title + " (хүлээлт)", phase: ctx.phase, stepsTarget: Math.min(steps, 6000), days: days, snacks: [], notes: notes, history: {}, screen: scr };
    }

    var plan = typePlan(p).slice(0, dpw);
    var slots = DOW_SLOTS[dpw];
    var sessionsByDow = {};
    slots.forEach(function (dow, i) { sessionsByDow[dow] = plan[i]; });
    var altWalk = true;
    for (var dow = 1; dow <= 7; dow++) {
      var type = sessionsByDow[dow];
      var day = { dow: dow, kind: "rest", session: null, why: [] };
      if (type) {
        day.kind = "session";
        day.session = buildSession(type, ctx, dow);
        day.why.push(DOW_MN[dow] + ": " + (TYPE_MN[day.session.type] || day.session.type) + " " + day.session.minutes + " мин — " + typeReason(p, type));
        if (hasMet(p, "t2d")) day.why.push("Чихрийн шижин → 2 өдрөөс илүү завсарлахгүй");
      } else if (hasMet(p, "t2d")) {
        day.kind = "walk"; ctx.used = {};
        day.session = buildWalk(ctx, dow, true);
        day.why.push("Чихрийн шижин → хичээлгүй өдөр хоолны дараа 10 минут алхалт");
      } else if (isOlder(p) || primaryGoal(p) === "older_balance") {
        day.kind = "snack";
        day.why.push(p.age + " настай → хичээлгүй өдөр тэнцвэрийн зууш (5 мин) + алхалт");
      } else if (dow === 7 && dpw < 7) {
        day.kind = "rest";
        day.why.push("Амралтын өдөр — булчин 48 цагт сэргэдэг" + (steps ? ", алхамаа л хийгээрэй" : ""));
      } else {
        day.kind = altWalk ? "walk" : "snack";
        altWalk = !altWalk;
        if (day.kind === "walk") day.why.push("Алхамын зорилт " + steps + (a.whtrBand !== "ok" ? " — бүсэлхий/өндөр " + fmt(a.whtr) + " → алхалт хэвлийн өөхөнд" : ""));
        else day.why.push("Зууш 5 мин × 2 — хичээлгүй өдөр ч дадал тасрахгүй");
      }
      if (day.session) day.session.blocks.forEach(function (b) { b.items.forEach(function (it) { history[it.exId] = (ctx.streak[it.exId] || 0) + 1; }); });
      days.push(day);
    }
    var snacks = buildSnacks(ctx);

    // Тэмдэглэл
    if (p.cue) notes.push("Таны зангуу: «" + p.cue + "» → хичээлийг тэр мөчид л хий, дэвсгэрээ харагдах газар тавь.");
    if (p.failedBefore) notes.push("Өмнө нь завсардсан → эхний 2–3 долоо хоног давтамж чухал, тун биш. Хоёр удаа дараалан алгасахгүй байх л дүрэм.");
    if (ctx.deload) notes.push("Энэ долоо хоног deload: сет 40% бага, ижил дасгал. Дараагийн циклд бэлтгэнэ.");
    if (weekIndex % 4 === 3) notes.push("4 долоо хоног дүүрч байна → «Ахиц» хэсгээс гэрийн тестээ дахин хийгээрэй, түвшин шинэчлэгдэнэ.");
    if (has(a.flags, "winter_vitd")) notes.push("Өвлийн улиралд алхамын зорилтыг гадаа биш минутаар тоол: 10 минут газар дээрээ алхах ≈ 1 000 алхам.");
    if (hasMet(p, "gout")) notes.push("Тулай → хурцдалын үед хичээл хийхгүй, өдөрт 2,5–3 литр ус, пиво, дотор мах хасна.");
    if (isPregnant(p)) notes.push("Жирэмсэн → халуун өрөөнд хийхгүй, ярьж чадах эрчим (RPE 12–14), цус алдалт/базлалт/толгой эргэвэл зогсооно.");
    if (ctx.setsWhy.length) notes.push(ctx.setsWhy.join(", ") + " — нойр, стресс засрахад сет буцаж нэмэгдэнэ.");
    if (adaptOpts && adaptOpts.changes) adaptOpts.changes.forEach(function (c) { notes.push(c.text); });

    return { id: "p" + weekIndex + "-" + rnd(ctx.seed + "|" + dpw).toString(36).slice(2, 8), version: VERSION, weekIndex: weekIndex,
      createdAt: opts.now ? new Date(opts.now).toISOString() : null, goals: p.goals || [], title: title, phase: ctx.phase,
      stepsTarget: steps, days: days, snacks: snacks, notes: notes, history: history };
  }

  // ───────────────────────── 5. Алхамын зорилт, дахин тест ─────────────────────────
  function stepsTarget(profile, assessment, weekIndex) {
    var p = profile, a = assessment || assess(profile);
    var start = p.stepsNow ? Math.round(p.stepsNow / 500) * 500 : 5000;
    var slow = isOlder(p) || a.level <= 1 || a.bmi >= 35 || isPregnant(p) || isEarlyPP(p) || hasMet(p, "gout");
    var inc = slow ? 500 : (primaryGoal(p) === "fatloss" || primaryGoal(p) === "fitness_energy" || a.whtrBand !== "ok") ? 1000 : 750;
    var max = isPregnant(p) ? 8000 : 10000;
    var phases = cyclePhases(a.level);
    var w = weekIndex || 0;
    var eff = 0;
    for (var i = 1; i <= w; i++) if (phases[i % phases.length] !== "deload") eff++; // deload долоо хоногт нэмэхгүй
    return Math.min(max, Math.round((start + inc * eff) / 500) * 500);
  }
  function retestDue(profile, logs, now) {
    var base = profile.testedAt || profile.createdAt;
    if (!base) return false;
    var t0 = new Date(base).getTime(), t1 = now instanceof Date ? now.getTime() : new Date(now || Date.now()).getTime();
    return (t1 - t0) / 86400000 >= 28;
  }

  // ───────────────────────── 6. Дасан зохицол ─────────────────────────
  function adapt(program, profile, logs) {
    var p = profile, changes = [];
    var next = { progressIds: [], regressIds: [], avoidIds: [], loadMul: {}, minutesDelta: 0, daysDelta: 0, setsDelta: 0, deloadNext: false, painAreas: [], dislikeTypes: [] };
    if (!program || !program.days) return { changes: changes, nextOpts: next };
    var sessions = {};
    program.days.forEach(function (d) { if (d.session) sessions[d.session.id] = d.session; });
    (program.snacks || []).forEach(function (s) { sessions[s.id] = s; });
    var ls = (logs || []).filter(function (l) { return l && sessions[l.sessionId]; }).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var done = ls.filter(function (l) { return l.done; });
    if (!ls.length) { changes.push({ text: "Энэ долоо хоногт бүртгэл алга → хөтөлбөр хэвээр" }); next.changes = changes; return { changes: changes, nextOpts: next }; }
    function itemsOf(sid) { var out = []; (sessions[sid].blocks || []).forEach(function (b) { b.items.forEach(function (it) { out.push(it); }); }); return out; }
    function nameOf(id) { var e = byId(id); return e ? e.name : id; }
    function loadItem(it) { var e = byId(it.exId); return e && (e.type === "strength" || e.type === "pilates" || e.type === "cardio"); }
    var planned = program.days.filter(function (d) { return d.kind === "session"; }).length;

    // Ахих: RPE ≤6 хоёр удаа дараалан
    var progressed = {};
    for (var i = 1; i < done.length; i++) {
      if (done[i - 1].rpe != null && done[i].rpe != null && done[i - 1].rpe <= 6 && done[i].rpe <= 6) {
        [done[i - 1], done[i]].forEach(function (l) {
          itemsOf(l.sessionId).forEach(function (it) {
            if (!loadItem(it) || progressed[it.exId] || has(l.skippedExIds, it.exId)) return;
            progressed[it.exId] = 1;
            var e = byId(it.exId);
            var to = e && e.progress && byId(e.progress);
            changes.push({ text: "«" + nameOf(it.exId) + "» RPE " + done[i - 1].rpe + ", " + done[i].rpe + " → " + (to ? "хүнд хувилбар «" + to.name + "»" : it.reps != null ? it.reps + " → " + Math.round(it.reps * 1.15) + " давталт" : it.seconds != null ? it.seconds + " → " + Math.round(it.seconds * 1.15) + " сек" : "ачаалал +15%") });
          });
        });
      }
    }
    next.progressIds = Object.keys(progressed);

    // Буух: RPE ≥9 эсвэл өвдөлт
    var regressed = {};
    done.forEach(function (l) {
      var hard = l.rpe != null && l.rpe >= 9;
      var pains = l.pain || [];
      if (!hard && !pains.length) return;
      pains.forEach(function (ar) { if (next.painAreas.indexOf(ar) < 0) { next.painAreas.push(ar); next.loadMul[ar] = 0.8; } });
      itemsOf(l.sessionId).forEach(function (it) {
        var e = byId(it.exId);
        if (!e || !loadItem(it)) return;
        var hits = pains.filter(function (ar) { return e.contra.indexOf(ar) >= 0 || (ar === "knee" && (e.pattern === "squat" || e.pattern === "lunge")) || (ar === "lowback" && (e.pattern === "hinge" || has(e.muscles, "back") || has(e.muscles, "spine"))) || (ar === "shoulder" && e.pattern === "push") || (ar === "wrist" && (e.position === "prone" || e.position === "kneeling")); });
        if (!hard && !hits.length) return;
        if (regressed[it.exId]) return;
        regressed[it.exId] = 1;
        delete progressed[it.exId];
        var rg = e.regress && byId(e.regress);
        var reason = hits.length ? cap(PAIN_MN[hits[0]]) + " өвдсөн" : "RPE " + l.rpe;
        changes.push({ text: reason + " → «" + e.name + "»" + (rg ? " хасаж, «" + rg.name + "»-ээр сольсон" : " ачаалал −20%") + (hits.length ? ", " + PAIN_MN[hits[0]] + "ний бүсийн ачаалал дараагийн долоо хоногт −20%" : "") });
      });
    });
    next.progressIds = Object.keys(progressed);
    next.regressIds = Object.keys(regressed);
    if (next.painAreas.length) changes.push({ text: "Өвдөлт: " + next.painAreas.map(function (a) { return PAIN_MN[a]; }).join(", ") + " → 3 хичээл дараалан ≥3/10 өвдвөл тэр хэв маягийг хасаж эмчид хандаарай" });

    // Алгасалт
    var skips = {}, sessSkip = {};
    ls.forEach(function (l) { (l.skippedExIds || []).forEach(function (id) { skips[id] = (skips[id] || 0) + 1; }); if ((l.skippedExIds || []).length >= 2) sessSkip[l.sessionId] = 1; });
    Object.keys(skips).forEach(function (id) { if (skips[id] >= 2) { next.avoidIds.push(id); changes.push({ text: "«" + nameOf(id) + "» " + skips[id] + " удаа алгассан → дараагийн долоо хоногт өөр дасгалаар сольсон" }); } });
    if (Object.keys(sessSkip).length) { next.minutesDelta = -5; changes.push({ text: "Нэг хичээлд 2+ дасгал алгассан → хичээл " + (p.minutes || 20) + " → " + Math.max(10, (p.minutes || 20) - 5) + " минут" }); }

    // Хийгдээгүй хичээл
    if (planned >= 2 && done.length <= planned / 2) { next.daysDelta = -1; changes.push({ text: "7 хоногт " + planned + " хичээлээс " + done.length + "-ийг хийсэн → дараагийн долоо хоног " + (planned - 1) + " хичээл, богино; хоёр удаа дараалан алгасахгүй байх л зорилт" }); }
    else if (planned && done.length >= planned && done.length) changes.push({ text: planned + "/" + planned + " хичээл хийсэн — тогтвортой" });

    // Таашаал
    var enjoy = {};
    done.forEach(function (l) { if (l.enjoy != null) { var t = sessions[l.sessionId].type; enjoy[t] = enjoy[t] || []; enjoy[t].push(l.enjoy); } });
    Object.keys(enjoy).forEach(function (t) { var avg = enjoy[t].reduce(function (a, b) { return a + b; }, 0) / enjoy[t].length; if (avg <= 2) { next.dislikeTypes.push(t); changes.push({ text: (TYPE_MN[t] || t) + " таалагдсангүй (" + fmt(round(avg, 1)) + "/5) → төрлийг нь солихыг «Би» хэсгээс сонгож болно" }); } });

    // Дундаж RPE өндөр → дараагийн deload
    var rpes = done.map(function (l) { return l.rpe; }).filter(function (x) { return x != null; });
    if (rpes.length >= 2) { var avgR = rpes.reduce(function (a, b) { return a + b; }, 0) / rpes.length; if (avgR >= 8.5) { next.deloadNext = true; next.setsDelta = -1; changes.push({ text: "Дундаж RPE " + fmt(round(avgR, 1)) + " → дараагийн долоо хоног сет −1, RIR 3" }); } }
    if (!changes.length) changes.push({ text: done.length ? "Өөрчлөлтгүй — ижил ачаалал үргэлжилнэ" : "Энэ долоо хоногт бүртгэл алга → хөтөлбөр хэвээр" });
    next.changes = changes;
    return { changes: changes, nextOpts: next };
  }

  // ───────────────────────── 7. Хоол ─────────────────────────
  var AF = { desk: 1.3, home: 1.4, shift: 1.4, student: 1.4, physical: 1.6 };
  function nutrition(profile, assessment, now) {
    var p = profile, a = assessment || assess(profile, now);
    var d = p.diet || {};
    var kg = p.weightKg, sex = p.sex === "m" ? "m" : "f";
    var bmr = Math.round(10 * kg + 6.25 * p.heightCm - 5 * p.age + (sex === "m" ? 5 : -161));
    var dailyMin = ((p.minutes || 0) * (p.daysPerWeek || 0)) / 7;
    var af = (AF[p.occupation] || 1.3) + (dailyMin / 10) * 0.05;
    var tdee = Math.round(bmr * af);
    var why = [];
    why.push("Mifflin-St Jeor: " + kg + " кг, " + p.heightCm + " см, " + p.age + " нас → суурь солилцоо " + bmr + " ккал");
    why.push(cap(OCC_MN[p.occupation] || "суугаа ажил") + " (×" + fmt(AF[p.occupation] || 1.3) + ") + долоо хоногт " + (p.daysPerWeek || 0) + " × " + (p.minutes || 0) + " мин (+" + fmt(round((dailyMin / 10) * 0.05, 2)) + ") → өдрийн зарцуулалт " + tdee + " ккал");

    var deficit = 0, g = primaryGoal(p);
    var wantsLoss = hasGoal(p, "fatloss") && (!hasGoal(p, "muscle") || p.goals.indexOf("fatloss") < p.goals.indexOf("muscle"));
    var wantsGain = hasGoal(p, "muscle") && !wantsLoss;
    if (wantsLoss) { deficit = a.whtrBand === "high" ? -500 : -400; deficit = -Math.min(-deficit, Math.round(tdee * 0.2)); }
    else if (wantsGain) deficit = 250;
    var refuse = null;
    if (p.age < 18) refuse = "18 хүрээгүй → калорийн дутагдал санал болгохгүй, өсөлтөд хангалттай хоол + хөдөлгөөн";
    else if (isPregnant(p)) refuse = "Жирэмсэн үед дутагдал санал болгохгүй" + (trimester(p) >= 2 ? ", 2–3-р гурван сард +300 ккал орчим хэрэгтэй" : "");
    else if (weeksPP(p) != null && weeksPP(p) < 6) refuse = "Төрснөөс хойш 6 долоо хоног болоогүй → дутагдалгүй, хөхүүл бол +400–500 ккал";
    else if (a.bmi < 18.5) refuse = "BMI " + fmt(a.bmi) + " → жин багатай, дутагдал өгөхгүй; уураг, тогтмол хоол";
    if (refuse && deficit < 0) deficit = 0;
    if (refuse) why.push(refuse);
    else if (deficit < 0) why.push("Өөх хасах" + (a.whtrBand === "high" ? ", бүсэлхий/өндөр " + fmt(a.whtr) : "") + " → " + deficit + " ккал (долоо хоногт ≈0,4 кг, булчин хадгална)");
    else if (deficit > 0) why.push("Булчин нэмэх → +250 ккал, уураг хоол бүрт 25–30 г");
    else why.push("Зорилго «" + (GOAL_MN[g] || g) + "» → калори хадгална, чанар дээр төвлөрнө");
    var targetKcal = Math.max(tdee + deficit, bmr);
    if (targetKcal === bmr && deficit < 0) why.push("Зорилт суурь солилцооноос доош буухгүй → " + bmr + " ккал");

    var pr = wantsLoss ? [1.8, 2.2] : wantsGain ? [1.6, 2.2] : isOlder(p) ? [1.6, 1.8] : isPregnant(p) || weeksPP(p) != null ? [1.6, 1.8] : [1.6, 2.0];
    var proteinG = [Math.round(pr[0] * kg), Math.round(pr[1] * kg)];
    why.push("Уураг " + fmt(pr[0]) + "–" + fmt(pr[1]) + " г/кг × " + kg + " кг → " + proteinG[0] + "–" + proteinG[1] + " г" + (wantsLoss ? " (дутагдалд дээд тал нь булчин хамгаална)" : ""));
    var fatMinG = Math.round(0.7 * kg);
    var fiberG = clamp(Math.round(targetKcal / 1000 * 14), 25, 35);
    var waterL = Math.max(1.5, round(kg * 0.03, 1));

    // Гарын порц (хоол тутамд, 3 үндсэн хоол)
    var palm = sex === "m" ? 25 : 20;
    var mid = (proteinG[0] + proteinG[1]) / 2;
    var protHands = clamp(Math.round(mid / palm / 3), 1, 3);
    var carbG = Math.max(50, (targetKcal - mid * 4 - Math.max(fatMinG, targetKcal * 0.28 / 9) * 9) / 4);
    var carbHands = clamp(Math.round(carbG / 25 / 3), 1, 3);
    if (wantsLoss) carbHands = Math.min(carbHands, 1);
    var fatHands = clamp(Math.round(Math.max(fatMinG, targetKcal * 0.28 / 9) / 12 / 3), 1, 2);
    var vegHands = (d.vegServings != null && d.vegServings < 3) || wantsLoss ? 2 : 1;
    var hands = { protein: protHands, veg: vegHands, carb: carbHands, fat: fatHands };
    why.push("Гарын порц хоол тутамд: уураг " + protHands + " алга (≈" + palm + " г/алга), ногоо " + vegHands + " нударга, нүүрс ус " + carbHands + " атга, тос " + fatHands + " эрхий");

    // Давстай цай
    var cupsNow = d.saltTeaCups || 0;
    var cupsTarget = cupsNow === 0 ? 0 : hasMet(p, "htn") ? 0 : 1;
    var weeks = Math.max(0, cupsNow - cupsTarget);
    var saltText = cupsNow === 0 ? "Давстай цай уудаггүй — давсны гол эх үүсвэр хиам, шөл, талх руу анхаараарай." :
      "Одоо өдөрт " + cupsNow + " аяга (≈" + cupsNow + " г давс, нормын " + Math.round(cupsNow / 5 * 100) + "%) → " + (cupsTarget === 0 ? "бүгдийг давсгүй болгоно" : cupsTarget + " аяга") + ": долоо хоног бүр нэг аягаа давсгүй болгож, " + weeks + " долоо хоногт хүрнэ." + (hasMet(p, "htn") ? " Даралттай тул зорилт 0." : "");
    var saltTeaCups = { now: cupsNow, target: cupsTarget, weeks: weeks, text: saltText };

    var month = monthOf(now);
    var vitShow = month >= 10 || month <= 4;
    var vitD = { show: vitShow, text: vitShow ? month + "-р сар: Улаанбаатарт өвөл насанд хүрэгчдийн 80% витамин D-гийн хүнд дутагдалтай. Үдийн 10–15 минутын гадаа алхалт, нэмэлтийн тунгийн талаар эмчтэйгээ ярилцаарай." : "Зун нар хангалттай — үдийн алхалтаа гадаа хий, өвөл (10–4 сар) нэмэлтийн сануулга гарна." };

    // Фокус
    var fs = [];
    fs.push(["protein", 10 + (wantsLoss || wantsGain || isOlder(p) ? 5 : 0)]);
    if (cupsNow >= 1) fs.push(["salt", cupsNow * 10 + (hasMet(p, "htn") ? 20 : 0) + (cupsNow >= 2 ? 5 : 0)]);
    if (d.vegServings != null && d.vegServings < 3) fs.push(["veg", (3 - d.vegServings) * 8 + 1]);
    if ((d.sugaryDrinksPerDay || 0) >= 1) fs.push(["sugar", d.sugaryDrinksPerDay * 10 + (hasMet(p, "t2d") ? 20 : 0)]);
    fs.sort(function (x, y) { return y[1] - x[1] || (x[0] < y[0] ? -1 : 1); });
    var focus = fs.map(function (x) { return x[0]; });
    var FOCUS_WHY = { protein: "Уураг → хоол бүрт алганы хэмжээ, өндөг/ааруул/тараг", salt: "Давстай цай " + cupsNow + " аяга → хамгийн их нөлөөтэй ганц өөрчлөлт", veg: "Ногоо " + (d.vegServings || 0) + " порц → 3 порц, байцаа/лууван/хөлдөөсөн", sugar: "Чихэрлэг ундаа өдөрт " + (d.sugaryDrinksPerDay || 0) + " → 500 мл = 50 г сахар" };
    why.push("Фокус: " + focus.map(function (f) { return FOCUS_WHY[f]; }).join("; "));
    if (d.snacksLate) why.push("Орой оройтож зуушилдаг → оройн хоолоо 20%-д барьж, зуушийг тараг, ааруул, алим болго (хориг биш)");

    // Хоолны загвар
    var mealKey = (isPregnant(p) || weeksPP(p) != null || isMenopause(p) || g === "womens") ? "womens" : hasGoal(p, "metabolic") || (p.metabolic || []).length ? "metabolic" : wantsLoss ? "fatloss" : wantsGain ? "muscle" : g === "stress_sleep" ? "stress_sleep" : "default";
    var meals = (Foods.meals[mealKey] || Foods.meals["default"]).map(function (m) {
      return { id: m.id, name: m.name, items: m.items.map(function (it) { return { foodId: it.foodId, amount: it.amount }; }), kcal: m.kcal, protein: m.protein, why: m.why.slice() };
    });
    var mealsKcal = meals.reduce(function (s, m) { return s + m.kcal; }, 0);
    var mealsProt = meals.reduce(function (s, m) { return s + m.protein; }, 0);
    var scale = targetKcal / mealsKcal;
    var scaleNote = Math.abs(scale - 1) > 0.1 ? "Загвар " + mealsKcal + " ккал, таны зорилт " + targetKcal + " → порцоо " + (scale > 1 ? "+" : "−") + Math.round(Math.abs(scale - 1) * 100) + "% (нүүрс ус, тосноос)" : "Загвар " + mealsKcal + " ккал ≈ зорилт " + targetKcal;
    meals.forEach(function (m, i) { m.why.unshift(["Өглөө 25%", "Өдөр 40%", "Орой 20%", "Зууш 15%"][i] + " ≈ " + Math.round(targetKcal * [0.25, 0.4, 0.2, 0.15][i]) + " ккал"); });
    why.push(scaleNote + "; загварын уураг " + mealsProt + " г, зорилт " + proteinG[0] + "–" + proteinG[1] + " г");

    // Дэлгүүрийн жагсаалт
    var shopping = buildShopping(p, a, { wantsLoss: wantsLoss, wantsGain: wantsGain, winter: vitShow, focus: focus });

    return { bmr: bmr, tdee: tdee, targetKcal: targetKcal, deficit: deficit, proteinG: proteinG, fatMinG: fatMinG, fiberG: fiberG, waterL: waterL,
      refuse: refuse, hands: hands, mealSplit: [0.25, 0.4, 0.2, 0.15], saltTeaCups: saltTeaCups, vitD: vitD, focus: focus, meals: meals, shopping: shopping, why: why };
  }
  function buildShopping(p, a, o) {
    var d = p.diet || {}, budget = d.budget || "mid";
    var list = [];
    function add(id, reason) {
      var f = Foods.byId(id);
      if (!f || list.some(function (x) { return x.foodId === id; })) return;
      var src = (f.brands[0] ? f.brands[0] + " — " : "") + f.where.slice(0, 2).join(", ");
      var price = f.price ? " (" + f.price.mnt.toLocaleString("ru-RU").replace(/ /g, " ") + " ₮/" + f.price.unit + ", " + f.price.year + ", тооцоолол)" : "";
      list.push({ foodId: id, note: src + price + " — " + (reason || f.tip) });
    }
    add("ondog", "хамгийн хямд уураг, өглөө 2 ш");
    add("tarag", "амтлаагүй, өглөө эсвэл зууш");
    add("aaruul", "зууш, протеин баарны оронд");
    if (budget === "low") { add("nootsiin_makh", "сарын 20-ноос нөөцийн цэгээс"); add("takhiany_tsee", "уургийн грамм хамгийн хямд мах"); add("shosh", "махгүй өдрийн уураг, ширхэг"); }
    else if (budget === "high") { add("ukhriin_makh", "өдрийн хоолны алга"); add("zagas", "долоо хоногт 2 удаа"); add("takhiany_tsee", "оройн хөнгөн уураг"); }
    else { add("takhiany_tsee", "оройн уураг"); add("ukhriin_makh", "долоо хоногт 3 удаа"); add("zagas", "долоо хоногт 1–2 удаа"); }
    add("baitsaa", "өвлийн хямд ногоо, хоол бүрт нэг нударга"); add("luuvan", "буузны дүүргэлт, салат"); add("songino", "давсны оронд амт");
    if (o.focus.indexOf("veg") >= 0) add("khuldoosun_nogoo", "ногоо 3 порцод хүрэх хамгийн амар зам");
    if (o.wantsGain) { add("budaa", "хичээлийн эрч"); add("suu", "кальци, уураг"); add("samar", "+250 ккал"); }
    else add("ovyoos", "өглөөний ширхэг");
    if (o.wantsLoss) { add("aarts", "сахаргүй уурагтай зууш"); add("orgost_khemkh", "ногооны порц"); }
    if (hasMet(p, "htn")) { add("suutei_tsai_davsgui", "давстай цайг энэ рүү"); add("nogoon_tsai", "үдээс хойш"); }
    if (hasMet(p, "t2d")) { add("sagagan", "будааны оронд"); add("brokkoli", "сахарыг удаан өсгөнө"); }
    if (hasMet(p, "gout")) { add("us", "өдөрт 2,5–3 л"); add("moog", "махны тал хэсгийг солино"); }
    if (isPregnant(p) || weeksPP(p) != null) { add("suu", "кальци өдөрт 3 порц"); add("jurj", "төмрийн шимэгдэлт"); }
    if (isMenopause(p) || isOlder(p)) { add("suu", "кальци, витамин D"); add("byaslag", "кальци, уураг"); }
    if (primaryGoal(p) === "stress_sleep") { add("gadil", "хичээлийн өмнө"); add("nogoon_tsai", "кофены оронд"); }
    if (o.winter) { add("vitamin_d", "10–4 сард эмчтэй зөвлөөд"); add("jurj", "өвлийн витамин C"); }
    add("alim", "оройн чихрийн оронд"); add("sagagan", "ширхэг ихтэй нүүрс ус"); add("toms", "нүүрс ус, нэг нударга"); add("us", "ширээн дээр 1 л сав");
    return list.slice(0, 15);
  }

  var FitEngine = {
    screen: screen, assess: assess, buildProgram: buildProgram, adapt: adapt, nutrition: nutrition, retestDue: retestDue,
    stepsTarget: stepsTarget, estimateMinutes: estimateMinutes, estimateItemSeconds: estimateItemSeconds, describeItem: describeItem,
    cyclePhases: cyclePhases, contraFlags: contraFlags, VERSION: VERSION,
    labels: { PAIN_MN: PAIN_MN, GOAL_MN: GOAL_MN, PATTERN_MN: PATTERN_MN, TYPE_MN: TYPE_MN, PHASE_MN: PHASE_MN, DOW_MN: DOW_MN, MUSCLE_MN: MUSCLE_MN, EQ_MN: EQ_MN }
  };

  if (typeof window !== "undefined") window.FitEngine = FitEngine;
  if (typeof module !== "undefined") module.exports = FitEngine;
})(this);
