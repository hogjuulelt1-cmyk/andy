/* Dev-only stubs for FitLib / FitFoods / FitEngine. Loaded by index.html only with ?mock=1.
   With the flag the stubs replace the real modules, and app.js runs local-only (no Supabase). */
(function () {
"use strict";
function ex(id, name, en, type, pattern, o) {
  return Object.assign({ id, name, en, type, pattern, muscles: ["core"], equipment: [], level: 1, position: "standing", impact: 0, contra: [],
    unit: "reps", defaults: { sets: 3, reps: 10, seconds: null, breaths: null, rest: 45 }, sides: "both",
    cues: ["Нуруугаа тэгш барь", "Амьсгалаа барихгүй", "Хөдөлгөөнийг удаан хий"], mistakes: ["Өвдөг дотогш орох"], regress: null, progress: null, snack: true }, o || {});
}
const EX = [
  ex("squat_chair", "Сандалд суугаад босох", "Chair squat", "strength", "squat", { equipment: ["chair"], muscles: ["quads", "glutes"], regress: "squat_wall_sit", progress: "squat_bw" }),
  ex("squat_bw", "Суулт", "Bodyweight squat", "strength", "squat", { level: 2, muscles: ["quads", "glutes"], regress: "squat_chair", contra: ["knee"] }),
  ex("squat_wall_sit", "Ханан дээр суух", "Wall sit", "strength", "squat", { equipment: ["wall"], unit: "seconds", defaults: { sets: 3, reps: null, seconds: 30, breaths: null, rest: 45 }, progress: "squat_chair" }),
  ex("hinge_glute_bridge", "Ташаа өргөлт", "Glute bridge", "strength", "hinge", { position: "supine", equipment: ["mat"], muscles: ["glutes", "hams"], progress: "hinge_single_bridge" }),
  ex("hinge_single_bridge", "Нэг хөлний ташаа өргөлт", "Single-leg bridge", "strength", "hinge", { level: 3, position: "supine", equipment: ["mat"], sides: "each", regress: "hinge_glute_bridge" }),
  ex("push_wall", "Ханан дээр түлхэлт", "Wall push-up", "strength", "push", { equipment: ["wall"], muscles: ["chest", "triceps"], progress: "push_knee" }),
  ex("push_knee", "Өвдөг дээрх түлхэлт", "Knee push-up", "strength", "push", { level: 2, position: "kneeling", equipment: ["mat"], muscles: ["chest", "triceps"], regress: "push_wall", contra: ["wrist"] }),
  ex("pull_band_row", "Резинтэй татлага", "Band row", "strength", "pull", { equipment: ["band"], muscles: ["back", "biceps"] }),
  ex("pull_towel_row", "Алчууртай татлага", "Towel isometric row", "strength", "pull", { unit: "seconds", defaults: { sets: 3, reps: null, seconds: 20, breaths: null, rest: 40 }, muscles: ["back"] }),
  ex("core_plank_knee", "Өвдөг дээрх планк", "Knee plank", "strength", "core", { position: "prone", equipment: ["mat"], unit: "seconds", defaults: { sets: 3, reps: null, seconds: 20, breaths: null, rest: 40 }, progress: "core_plank" }),
  ex("core_plank", "Планк", "Plank", "strength", "core", { level: 2, position: "prone", equipment: ["mat"], unit: "seconds", defaults: { sets: 3, reps: null, seconds: 30, breaths: null, rest: 45 }, regress: "core_plank_knee" }),
  ex("core_bird_dog", "Шувуу-нохой", "Bird dog", "strength", "core", { position: "kneeling", equipment: ["mat"], sides: "each", defaults: { sets: 2, reps: 8, seconds: null, breaths: null, rest: 30 } }),
  ex("lunge_split", "Алхаж суулт", "Split squat", "strength", "lunge", { level: 2, sides: "each", muscles: ["quads", "glutes"], contra: ["knee"], regress: "squat_chair" }),
  ex("yoga_cat_cow", "Муур-үхэр", "Cat-cow", "yoga", "core", { position: "kneeling", equipment: ["mat"], unit: "breaths", defaults: { sets: 1, reps: null, seconds: null, breaths: 8, rest: 0 }, yoga: { sanskrit: "Marjaryasana", family: "back", next: ["yoga_down_dog"], counter: [] } }),
  ex("yoga_down_dog", "Нохой доош", "Downward dog", "yoga", "core", { level: 2, position: "prone", equipment: ["mat"], unit: "breaths", defaults: { sets: 1, reps: null, seconds: null, breaths: 5, rest: 0 }, contra: ["wrist", "inversion"], yoga: { sanskrit: "Adho Mukha Svanasana", family: "inversion", next: ["yoga_child"], counter: ["yoga_child"] } }),
  ex("yoga_child", "Хүүхдийн поз", "Child's pose", "yoga", "core", { position: "kneeling", equipment: ["mat"], unit: "breaths", defaults: { sets: 1, reps: null, seconds: null, breaths: 6, rest: 0 }, yoga: { sanskrit: "Balasana", family: "restorative", next: [], counter: [] } }),
  ex("pilates_hundred", "Зуу", "The Hundred", "pilates", "core", { level: 2, position: "supine", equipment: ["mat"], unit: "breaths", defaults: { sets: 1, reps: null, seconds: null, breaths: 10, rest: 0 }, pilates: { tier: 1, classical: 1 } }),
  ex("mob_hip_flexor", "Түнхний сунгалт", "Hip flexor stretch", "mobility", "lunge", { position: "kneeling", equipment: ["mat"], unit: "seconds", defaults: { sets: 1, reps: null, seconds: 30, breaths: null, rest: 0 }, sides: "each", muscles: ["hipflex"] }),
  ex("breath_box", "Дөрвөлжин амьсгал", "Box breathing", "breath", "core", { position: "seated", unit: "breaths", defaults: { sets: 1, reps: null, seconds: null, breaths: 6, rest: 0 }, cues: ["4 тоолж амьсгаа ав", "4 тоолж барь", "4 тоолж гарга"] }),
  ex("walk_brisk", "Түргэн алхалт", "Brisk walk", "cardio", "gait", { unit: "seconds", defaults: { sets: 1, reps: null, seconds: 600, breaths: null, rest: 0 }, impact: 1 }),
];
window.FitLib = {
  exercises: EX, byId: (id) => EX.find((e) => e.id === id),
  filter: (q) => EX.filter((e) => (!q.type || e.type === q.type) && (!q.pattern || e.pattern === q.pattern) && (!q.maxLevel || e.level <= q.maxLevel)),
  TYPES: ["strength", "yoga", "pilates", "mobility", "cardio", "breath"],
  PATTERNS: ["squat", "hinge", "lunge", "push", "pull", "core", "carry", "rotation", "balance", "gait"],
  CONTRA: ["knee", "lowback", "neck", "shoulder", "wrist", "hip", "ankle", "pregnancy", "postpartum", "hypertension", "inversion"],
};

function food(id, name, en, group, o) { return Object.assign({ id, name, en, group, per: "100g", kcal: 100, protein: 5, fat: 3, carb: 10, sodium: 50, fiber: 1, estimate: true, brands: [], where: ["зах"], season: "all", price: null, tags: [], swaps: [], tip: "" }, o || {}); }
const FOODS = [
  food("aaruul", "Ааруул", "Dried curd", "dairy", { per: "piece", kcal: 25, protein: 2, brands: ["Сүү ХК", "АПУ Дэйри"], where: ["CU", "Номин"], price: { mnt: 612, unit: "ш", year: 2026, estimate: true }, tags: ["high-protein"], tip: "Өглөөний цайнд 5–6 ширхэг ааруул 10 г орчим уураг өгнө." }),
  food("tarag", "Тараг", "Yogurt", "dairy", { per: "cup", kcal: 120, protein: 7, brands: ["Сүү ХК"], where: ["Номин", "Имарт"], price: { mnt: 3200, unit: "л", year: 2026, estimate: true } }),
  food("egg", "Өндөг", "Egg", "protein", { per: "piece", kcal: 72, protein: 6, estimate: false, where: ["CU", "GS25", "зах"], price: { mnt: 450, unit: "ш", year: 2026, estimate: true } }),
  food("beef", "Үхрийн мах", "Beef", "protein", { kcal: 190, protein: 22, estimate: false, where: ["зах", "Номин"], price: { mnt: 18000, unit: "кг", year: 2026, estimate: true } }),
  food("buuz", "Бууз", "Buuz", "dish", { per: "piece", kcal: 95, protein: 5, where: ["гэр"], tags: ["traditional"] }),
  food("rice", "Будаа", "Rice", "grain", { kcal: 130, protein: 2.5, estimate: false }),
  food("oats", "Овъёос", "Oats", "grain", { kcal: 380, protein: 13, brands: ["Увс"], where: ["Номин", "Имарт"] }),
  food("cabbage", "Байцаа", "Cabbage", "veg", { kcal: 25, protein: 1, estimate: false, where: ["зах", "Номин"], price: { mnt: 1500, unit: "кг", year: 2026, estimate: true } }),
  food("carrot", "Лууван", "Carrot", "veg", { kcal: 41, protein: 1, estimate: false }),
  food("frozen_veg", "Хөлдөөсөн ногоо", "Frozen vegetables", "veg", { kcal: 60, protein: 3, brands: ["Hortex"], where: ["Номин", "Имарт"], season: "winter" }),
  food("apple", "Алим", "Apple", "fruit", { per: "piece", kcal: 80, protein: 0, estimate: false }),
  food("milk_tea_salt", "Сүүтэй цай (давстай)", "Salted milk tea", "drink", { per: "cup", kcal: 60, protein: 2, sodium: 400, tags: ["salty", "traditional"], swaps: ["milk_tea_nosalt"] }),
  food("milk_tea_nosalt", "Сүүтэй цай (давсгүй)", "Milk tea, no salt", "drink", { per: "cup", kcal: 60, protein: 2, sodium: 40 }),
  food("vitd", "Витамин D", "Vitamin D", "snack", { per: "piece", kcal: 0, protein: 0, brands: ["Монос"], where: ["эмийн сан"] }),
];
const MEAL = (id, name, items, kcal, protein, why) => ({ id, name, items, kcal, protein, why });
window.FitFoods = {
  foods: FOODS, byId: (id) => FOODS.find((f) => f.id === id), byGroup: (g) => FOODS.filter((f) => f.group === g),
  meals: { default: [
    MEAL("m1", "Өглөө", [{ foodId: "oats", amount: "60 г" }, { foodId: "tarag", amount: "1 аяга" }, { foodId: "aaruul", amount: "4 ш" }], 420, 26, ["Уураг 26 г → өглөөний цадалт удаан"]),
    MEAL("m2", "Өдөр", [{ foodId: "beef", amount: "150 г" }, { foodId: "rice", amount: "150 г" }, { foodId: "cabbage", amount: "1 атга" }], 620, 38, ["Мах + будаа + ногоо: гарын порцоор 2-1-2"]),
    MEAL("m3", "Орой", [{ foodId: "egg", amount: "2 ш" }, { foodId: "frozen_veg", amount: "200 г" }], 330, 20, ["Орой хөнгөн → нойр сайжирна"]),
    MEAL("m4", "Зууш", [{ foodId: "apple", amount: "1 ш" }], 80, 0, []),
  ] },
  tips: { salt: ["Давстай цайг аяга тутамд нэг халбага бага давсаар хийж үзээрэй."], winter: ["Өвөл нарны гэрэл бага тул витамин D 1000 нэгж авч болно."], budget: ["Нөөцийн мах + 4 ногоо хамгийн хямд уурагтай хоол."], tsagaansar: ["Цагаан сарын буузыг ногоотой, 5–6 ширхэгээр хязгаарлаарай."], naadam: ["Наадмын хуушуурыг нэг л удаа, ногоотой идээрэй."] },
};

function ses(id, title, type, minutes, blocks, why) { return { id, title, type, minutes, blocks, why }; }
function it(exId, o) { const e = window.FitLib.byId(exId); const d = e.defaults; return Object.assign({ exId, sets: d.sets, reps: d.reps, seconds: d.seconds, breaths: d.breaths, rest: d.rest, sides: e.sides, tempo: null, why: [] }, o || {}); }
function mkProgram(profile, assessment, opts) {
  opts = opts || {}; const w = opts.weekIndex || 0;
  const strength = ses("s" + w + "a", "Хүч + сунгалт", "strength", profile.minutes || 20, [
    { name: "Халаалт", items: [it("yoga_cat_cow", { why: ["Суугаа ажил → нурууг халаана"] }), it("mob_hip_flexor")] },
    { name: "Үндсэн", items: [it("squat_chair", { why: ["Сандалд босох тест 14 → суултыг сандалтай эхэлнэ"] }), it("hinge_glute_bridge"), it("push_wall", { why: ["Бугуй өвддөг → шалан дээрх түлхэлтийг хассан"] }), it("pull_towel_row"), it("core_plank_knee", { why: ["Планк 35 с → өвдөг дээр эхэлж 2 долоо хоногийн дараа бүтэн"] })] },
    { name: "Тайвшрал", items: [it("breath_box")] },
  ], ["Өдөрт " + (profile.minutes || 20) + " минут → 5 дасгал, 3 сет", "Зорилго: жин хасах → хүч 2 + алхалт"]);
  const pil = ses("s" + w + "b", "Пилатес + амьсгал", "pilates", profile.minutes || 20, [
    { name: "Халаалт", items: [it("yoga_cat_cow")] },
    { name: "Үндсэн", items: [it("pilates_hundred", { why: ["Голын хүч 2-р түвшин → Зуу-г 10 амьсгалаар"] }), it("core_bird_dog"), it("hinge_glute_bridge"), it("yoga_down_dog")] },
    { name: "Тайвшрал", items: [it("yoga_child"), it("breath_box")] },
  ], ["Стресс 4/5 → амьсгалын блок нэмсэн"]);
  const walk = ses("s" + w + "w", "Түргэн алхалт", "walk", 20, [{ name: "Үндсэн", items: [it("walk_brisk", { why: ["Бүсэлхий/өндөр 0.53 → алхалт нэмсэн"] })] }], ["Хоолны дараа 10 мин → сахарын хэлбэлзэл багасна"]);
  const snack = ses("sn" + w, "5 минутын зууш", "mobility", 5, [{ name: "Үндсэн", items: [it("squat_chair", { sets: 1, reps: 12, rest: 0 }), it("yoga_cat_cow")] }], ["Суугаа ажил → цаг тутам босох"]);
  return {
    id: "p" + w + Date.now().toString(36), version: 1, weekIndex: w, createdAt: new Date().toISOString(), goals: profile.goals,
    title: (w + 1) + "-р долоо хоног: " + (w === 0 ? "суурь тавих" : w === 3 ? "амраах" : "ачаалал нэмэх"), phase: w === 3 ? "deload" : w === 0 ? "base" : "build",
    stepsTarget: 6000 + w * 500,
    days: [
      { dow: 1, kind: "session", session: strength, why: ["Даваа: долоо хоногийн эхэнд хүч"] },
      { dow: 2, kind: "walk", session: walk, why: [] },
      { dow: 3, kind: "session", session: pil, why: [] },
      { dow: 4, kind: "snack", session: null, why: ["Амралтын өдөр, 5 минутын зууш л хангалттай"] },
      { dow: 5, kind: "session", session: Object.assign({}, strength, { id: "s" + w + "c" }), why: [] },
      { dow: 6, kind: "walk", session: walk, why: [] },
      { dow: 7, kind: "rest", session: null, why: ["Ням: бүрэн амралт"] },
    ],
    snacks: [snack, Object.assign({}, snack, { id: "sn" + w + "b", title: "Амьсгалын завсарлага", type: "breath", blocks: [{ name: "Үндсэн", items: [it("breath_box")] }] })],
    notes: ["Эхний долоо хоногт хөдөлгөөнийг зөв сурахад анхаар, жин нэмэх хэрэггүй."],
  };
}
window.FitEngine = {
  VERSION: 1,
  screen(p) { const yes = (p.parq || []).some(Boolean); const flags = yes ? [{ code: "parq", text: "Эмчээс зөвшөөрөл аваад эхлээрэй. Асуултуудын аль нэгэнд “Тийм” гэж хариулсан тул өөрөө хөтөлбөр эхлэхийг зөвлөхгүй." }] : []; if (p.womens && p.womens.stage === "pregnancy") flags.push({ code: "pregnancy", text: "Жирэмсэн үед эмчтэйгээ зөвлөлдөөд хөнгөн хөтөлбөрөөр хичээллэнэ." }); return { ok: !yes, stop: yes, flags }; },
  assess(p) {
    const h = (p.heightCm || 165) / 100, bmi = +((p.weightKg || 65) / (h * h)).toFixed(1), whtr = +(((p.waistCm || 80) / (p.heightCm || 165))).toFixed(2);
    const t = p.tests || {};
    return { bmi, whtr, whtrBand: whtr < 0.5 ? "ok" : whtr < 0.6 ? "watch" : "high", level: 2, strengthLevel: 2, coreLevel: 2, balanceLevel: 2, mobilityLevel: 2,
      tests: { pushups: { value: t.pushups, band: "mid", text: "Насныхаа дунджид" }, chairStand30: { value: t.chairStand30, band: "mid", text: "Дундаж" }, plankSec: { value: t.plankSec, band: "low", text: "Эхлэгч" } },
      flags: ["desk", "high_salt", "winter_vitd"], why: ["Бүсэлхий/өндөр " + whtr + " → алхалт, хүчний хослол", "Суугаа ажил → цаг тутам босох зууш"] };
  },
  buildProgram: mkProgram,
  adapt(program, p, logs) { return { changes: [{ text: "Суулт: RPE 5, 5 → давталт 10 → 12" }, { text: "Планк: өвдөг дээрээс бүтэн планк руу" }, { text: "Алхамын зорилт 6000 → 6500" }], nextOpts: {} }; },
  nutrition(p, a) {
    const kg = p.weightKg || 65;
    return { bmr: 1400, tdee: 1900, targetKcal: 1500, deficit: -400, proteinG: [Math.round(kg * 1.6), Math.round(kg * 2.2)], fatMinG: Math.round(kg * 0.7), fiberG: 28, waterL: +(kg * 0.03).toFixed(1), refuse: null,
      hands: { protein: 2, veg: 2, carb: 1, fat: 1 }, mealSplit: [0.25, 0.4, 0.2, 0.15],
      saltTeaCups: { now: (p.diet || {}).saltTeaCups || 3, target: 1, text: "Давстай цай " + ((p.diet || {}).saltTeaCups || 3) + " аяга → өдөрт 1 аяга хүртэл бууруулж, бусдыг нь давсгүй уугаарай." },
      vitD: { show: true, text: "Арваас дөрөвдүгээр сар хүртэл нар бага тул витамин D 1000–2000 нэгж авч болно." },
      focus: ["protein", "salt", "veg"], meals: window.FitFoods.meals.default,
      shopping: [{ foodId: "aaruul", note: "Сүү ХК, CU" }, { foodId: "egg", note: "30 ш → долоо хоногт" }, { foodId: "beef", note: "1 кг, зах" }, { foodId: "frozen_veg", note: "Hortex, Номин" }, { foodId: "oats", note: "Увс, 1 кг" }, { foodId: "cabbage", note: "1 толгой" }, { foodId: "tarag", note: "2 л" }, { foodId: "apple", note: "7 ш" }, { foodId: "vitd", note: "эмийн сан" }],
      why: ["Жин " + kg + " кг, жин хасах → −400 ккал", "Уураг 1.6–2.2 г/кг → " + Math.round(kg * 1.6) + "–" + Math.round(kg * 2.2) + " г"] };
  },
  retestDue(p, logs, now) { return (logs || []).length >= 12; },
  stepsTarget(p, a, w) { return 6000 + (w || 0) * 500; },
  estimateMinutes(s) { return s.minutes || 20; },
  describeItem(i) { if (i.seconds) return i.sets + " × " + i.seconds + " сек"; if (i.breaths) return i.sets + " × " + i.breaths + " амьсгал"; return i.sets + " × " + i.reps + " давталт"; },
};
})();
