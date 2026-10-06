// node fit/test-lib.js — FitLib-ийн бүтэц, тоо, гинжийг шалгана.
"use strict";
const L = require("./lib.js");

const MUSCLES = ["quads", "hams", "glutes", "calves", "chest", "back", "shoulders", "biceps", "triceps", "core", "hipflex", "adductors", "spine", "neck", "fullbody"];
const EQUIP = ["mat", "wall", "chair", "band", "db", "kb"];
const POS = ["standing", "kneeling", "supine", "prone", "seated", "side"];
const UNITS = ["reps", "seconds", "breaths"];
const FAMILIES = ["standing", "forward", "back", "twist", "inversion", "restorative", "balance", "hipopen", "core"];
const MIN = { strength: 60, yoga: 45, pilates: 30, mobility: 25, breath: 6, cardio: 6 };

const errors = [];
const err = (m) => errors.push(m);
const isArr = (a, allowed) => Array.isArray(a) && a.every((x) => allowed.includes(x));

// API хэлбэр
if (!Array.isArray(L.exercises)) err("exercises массив биш");
if (typeof L.byId !== "function" || typeof L.filter !== "function") err("byId/filter функц биш");
if (JSON.stringify(L.TYPES) !== JSON.stringify(["strength", "yoga", "pilates", "mobility", "cardio", "breath"])) err("TYPES буруу");
if (JSON.stringify(L.PATTERNS) !== JSON.stringify(["squat", "hinge", "lunge", "push", "pull", "core", "carry", "rotation", "balance", "gait"])) err("PATTERNS буруу");
if (JSON.stringify(L.CONTRA) !== JSON.stringify(["knee", "lowback", "neck", "shoulder", "wrist", "hip", "ankle", "pregnancy", "postpartum", "hypertension", "inversion"])) err("CONTRA буруу");

// Давхардалгүй id
const ids = new Set();
for (const e of L.exercises) {
  if (!/^[a-z0-9_]+$/.test(e.id)) err(`id snake_case биш: ${e.id}`);
  if (ids.has(e.id)) err(`давхардсан id: ${e.id}`);
  ids.add(e.id);
}

// Талбарууд
for (const e of L.exercises) {
  const p = `${e.id}:`;
  if (!e.name || typeof e.name !== "string") err(`${p} name хоосон`);
  if (/[A-Za-z]/.test(e.name) && !/^(Y|T|W|V|S|C|CARs|4-7-8|90\/90|5-5|3\/3)/.test(e.name) && !/\b(Y|T|W|CARs|V)\b/.test(e.name)) err(`${p} name дотор латин үсэг: ${e.name}`);
  if (!e.en || typeof e.en !== "string") err(`${p} en хоосон`);
  if (!L.TYPES.includes(e.type)) err(`${p} type буруу: ${e.type}`);
  if (!L.PATTERNS.includes(e.pattern)) err(`${p} pattern буруу: ${e.pattern}`);
  if (!isArr(e.muscles, MUSCLES) || e.muscles.length === 0) err(`${p} muscles буруу: ${e.muscles}`);
  if (!isArr(e.equipment, EQUIP)) err(`${p} equipment буруу: ${e.equipment}`);
  if (!Number.isInteger(e.level) || e.level < 1 || e.level > 5) err(`${p} level буруу: ${e.level}`);
  if (!POS.includes(e.position)) err(`${p} position буруу: ${e.position}`);
  if (![0, 1, 2].includes(e.impact)) err(`${p} impact буруу: ${e.impact}`);
  if (!isArr(e.contra, L.CONTRA)) err(`${p} contra буруу: ${e.contra}`);
  if (!UNITS.includes(e.unit)) err(`${p} unit буруу: ${e.unit}`);
  const d = e.defaults;
  if (!d || typeof d !== "object") err(`${p} defaults алга`);
  else {
    for (const k of ["sets", "reps", "seconds", "breaths", "rest"]) if (!(k in d)) err(`${p} defaults.${k} алга`);
    if (!(d.sets >= 1)) err(`${p} sets < 1`);
    const key = { reps: "reps", seconds: "seconds", breaths: "breaths" }[e.unit];
    if (!(d[key] > 0)) err(`${p} unit=${e.unit} боловч defaults.${key}=${d[key]}`);
    if (typeof d.rest !== "number") err(`${p} rest тоо биш`);
  }
  if (!["both", "each"].includes(e.sides)) err(`${p} sides буруу: ${e.sides}`);
  if (!Array.isArray(e.cues) || e.cues.length < 2 || e.cues.length > 3) err(`${p} cues 2–3 биш (${e.cues && e.cues.length})`);
  if (!Array.isArray(e.mistakes) || e.mistakes.length < 1 || e.mistakes.length > 2) err(`${p} mistakes 1–2 биш`);
  for (const c of [...(e.cues || []), ...(e.mistakes || [])]) {
    if (/[«»;]/.test(c)) err(`${p} «» эсвэл ; тэмдэг: ${c}`);
    if (/[a-zA-Z]{3,}/.test(c)) err(`${p} cue дотор латин үг: ${c}`);
  }
  if (e.regress != null && !ids.has(e.regress)) err(`${p} regress олдсонгүй: ${e.regress}`);
  if (e.progress != null && !ids.has(e.progress)) err(`${p} progress олдсонгүй: ${e.progress}`);
  if (e.regress && e.regress === e.id) err(`${p} regress өөрөө`);
  if (e.progress && e.progress === e.id) err(`${p} progress өөрөө`);
  if (e.regress && L.byId(e.regress) && L.byId(e.regress).level > e.level) err(`${p} regress ${e.regress} илүү хүнд түвшинтэй`);
  if (e.progress && L.byId(e.progress) && L.byId(e.progress).level < e.level) err(`${p} progress ${e.progress} илүү хөнгөн түвшинтэй`);
  if (typeof e.snack !== "boolean") err(`${p} snack boolean биш`);
  if (e.type === "yoga") {
    if (!e.yoga) err(`${p} yoga объект алга`);
    else {
      if (!FAMILIES.includes(e.yoga.family)) err(`${p} yoga.family буруу: ${e.yoga.family}`);
      if (!("sanskrit" in e.yoga)) err(`${p} yoga.sanskrit алга`);
      for (const n of e.yoga.next) if (!ids.has(n)) err(`${p} yoga.next олдсонгүй: ${n}`);
      for (const n of e.yoga.counter) if (!ids.has(n)) err(`${p} yoga.counter олдсонгүй: ${n}`);
    }
  } else if (e.yoga) err(`${p} йога биш боловч yoga талбартай`);
  if (e.type === "pilates") {
    if (!e.pilates) err(`${p} pilates объект алга`);
    else {
      if (![1, 2, 3].includes(e.pilates.tier)) err(`${p} pilates.tier буруу`);
      if (e.pilates.classical != null && !(e.pilates.classical >= 1 && e.pilates.classical <= 34)) err(`${p} pilates.classical буруу`);
    }
  } else if (e.pilates) err(`${p} пилатес биш боловч pilates талбартай`);
  // Эмнэлгийн дүрэм
  if (e.position === "supine" && !e.contra.includes("pregnancy") && e.id !== "yoga_nidra") err(`${p} supine боловч pregnancy тэмдэггүй`);
  if (e.impact === 2 && !e.contra.includes("pregnancy")) err(`${p} impact 2 боловч pregnancy тэмдэггүй`);
  if (e.id === "squat_wall_sit" && e.contra.includes("hypertension")) err(`${p} wall sit-д hypertension тэмдэг байж болохгүй`);
  if (e.snack && e.unit === "seconds" && e.defaults.seconds * e.defaults.sets > 330) err(`${p} snack боловч 5 минутаас урт`);
}

// Тоо
const counts = {};
for (const e of L.exercises) counts[e.type] = (counts[e.type] || 0) + 1;
for (const t of L.TYPES) if ((counts[t] || 0) < MIN[t]) err(`${t}: ${counts[t] || 0} < ${MIN[t]}`);

// Заавал байх id-ууд
const must = ["mcgill_curlup", "side_plank_knees", "side_plank", "bird_dog", "pilates_hundred", "yoga_nidra", "pelvic_floor", "squat_chair", "pushup_wall", "glute_bridge", "plank",
  "yoga_tadasana", "yoga_cat_cow", "yoga_downdog", "yoga_child", "yoga_cobra", "yoga_sphinx", "yoga_low_lunge", "yoga_warrior1", "yoga_warrior2", "yoga_triangle", "yoga_tree",
  "yoga_utkatasana", "yoga_bridge", "yoga_supine_twist", "yoga_happy_baby", "yoga_legs_up_wall", "yoga_reclined_butterfly", "yoga_pigeon", "yoga_figure4", "yoga_forward_fold",
  "yoga_half_forward_fold", "yoga_plank", "yoga_locust", "yoga_camel", "yoga_thread_needle", "yoga_savasana", "box_breathing", "breath_478", "coherent_breathing", "bhramari",
  "nadi_shodhana", "physiological_sigh", "hip_9090", "worlds_greatest_stretch", "thoracic_rotation", "open_book", "wall_angel", "chin_tuck", "hamstring_doorway", "calf_stretch_wall",
  "ankle_knee_wall", "couch_stretch", "hip_flexor_kneel", "shoulder_cars", "pelvic_tilt", "dead_bug", "glute_bridge_march", "walk_brisk", "walk_interval", "stair_climb",
  "march_in_place", "step_touch", "shadow_boxing", "jumping_jack"];
for (const id of must) if (!ids.has(id)) err(`заавал байх id алга: ${id}`);

// 34 сонгодог пилатес: дор хаяж 30 дугаар бүрхэгдсэн
const classical = new Set(L.exercises.filter((e) => e.pilates && e.pilates.classical).map((e) => e.pilates.classical));
if (classical.size < 30) err(`сонгодог пилатесийн ${classical.size} дугаар л бүрхэгдсэн (≥30 хэрэгтэй)`);

// Хэв маяг бүр: level ≤2, equipment [] эсвэл ["mat"] дасгал ≥2
const patCover = {};
for (const p of L.PATTERNS) {
  patCover[p] = L.exercises.filter((e) => e.pattern === p && e.level <= 2 && e.equipment.every((x) => x === "mat")).length;
  if (patCover[p] < 2) err(`pattern ${p}: эхлэгчийн хэрэгсэлгүй дасгал ${patCover[p]} < 2`);
}

// Өвдөг / нуруу өвдөлттэй, хэрэгсэлгүй эхлэгчид хүчний дасгал байх эсэх
for (const pain of ["knee", "lowback", "wrist", "shoulder"]) {
  const ok = L.filter({ type: "strength", maxLevel: 2, equipment: ["mat"], exclContra: [pain] });
  const pats = new Set(ok.map((e) => e.pattern));
  for (const p of ["squat", "hinge", "push", "pull", "core"]) if (!pats.has(p)) err(`${pain} өвдөлттэй эхлэгчид ${p} дасгал алга`);
}
// Жирэмсэн (2–3-р гурван сар): impact 0, level ≤2, supine/inversion хассан
const preg = L.filter({ type: ["strength", "yoga", "mobility", "breath"], maxLevel: 2, equipment: ["mat", "chair", "wall"], exclContra: ["pregnancy", "inversion"] }).filter((e) => e.impact === 0);
if (preg.length < 40) err(`жирэмсэн хүнд тохирох дасгал ${preg.length} < 40`);
// Даралт ихтэй: hypertension хассан ч wall sit, plank үлдэнэ
const htn = L.filter({ exclContra: ["hypertension"] }).map((e) => e.id);
if (!htn.includes("squat_wall_sit") || !htn.includes("plank")) err("hypertension шүүлт wall sit/plank-ийг хасаж байна");

// filter() ажиллагаа
if (L.filter({ equipment: ["none"] }).some((e) => e.equipment.length)) err("equipment ['none'] хэрэгсэлтэй дасгал буцаалаа");
if (L.filter({ type: "yoga", position: "supine" }).some((e) => e.type !== "yoga" || e.position !== "supine")) err("filter type/position буруу");
if (L.byId("plank") !== L.exercises.find((e) => e.id === "plank")) err("byId буруу");
if (L.byId("nope") !== undefined) err("byId байхгүй id-д undefined биш");

// Хураангуй
const snackN = L.exercises.filter((e) => e.snack).length;
const lvl = {};
for (const e of L.exercises) lvl[e.level] = (lvl[e.level] || 0) + 1;
console.log("Нийт:", L.exercises.length);
console.log("Төрлөөр:", counts);
console.log("Түвшнээр:", lvl);
console.log("Зууш (snack):", snackN);
console.log("Сонгодог пилатес дугаар:", classical.size, "/ 34");
console.log("Хэв маяг (level ≤2, хэрэгсэлгүй):", patCover);
console.log("Файлын хэмжээ:", (require("fs").statSync(require("path").join(__dirname, "lib.js")).size / 1024).toFixed(1), "KB");

if (errors.length) {
  console.error(`\n${errors.length} алдаа:`);
  for (const m of errors) console.error(" -", m);
  process.exit(1);
}
console.log("\nOK — бүх шалгалт давлаа.");
