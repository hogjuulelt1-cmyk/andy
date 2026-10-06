# Тэнхээ — хувийн йога, пилатес, фитнес апп (spec)

Судалгаа: `reports/Хувийн йога фитнес апп судалгаа.md`. Энэ файл нь кодын гэрээ (contract):
бүх модуль яг эндхийн нэр, бүтцийг дагана. Статик PWA, build алхамгүй, `/fit/` замаар нээгдэнэ.

## Файлууд

| Файл | Үүрэг | Глобал |
| --- | --- | --- |
| `fit/index.html` | CSS, shell (header, `#main`, доод таб), скриптүүдийг ачаална | — |
| `fit/lib.js` | Дасгалын сан (хүч, йога, пилатес, мобилити, амьсгал, алхалт) | `window.FitLib` |
| `fit/foods.js` | Монгол хүнсний сан, брэнд, үнэ, хоолны загварууд | `window.FitFoods` |
| `fit/engine.js` | Цэвэр логик: шүүлт (PAR-Q+), үнэлгээ, хөтөлбөр бүтээгч, дасан зохицол, хоол тооцоо | `window.FitEngine` |
| `fit/app.js` | Төлөв, хадгалалт (localStorage / Supabase `docs` хүснэгт, `fit/*` зам), рендер | — |
| `fit/manifest.webmanifest` | PWA manifest, `start_url: /fit/` | — |

Скрипт ачаалах дараалал: `/config.js` → `lib.js` → `foods.js` → `engine.js` → `app.js`.
`lib.js`, `foods.js`, `engine.js` нь Node дээр ч ажиллана:
файлын төгсгөлд `if (typeof module !== "undefined") module.exports = FitEngine;` маягийн guard.
`engine.js` нь `FitLib`, `FitFoods`-ийг `typeof window !== "undefined" ? window.FitLib : require("./lib.js")` маягаар авна.

## Дизайны чиглэл

Хэрэглэгч: Улаанбаатарын орон сууц, гэр хорооллын насанд хүрэгчид, ихэнх нь 25–45 насны эмэгтэйчүүд,
суугаа ажилтай, өвөл гадаа гарах боломж бага. Мэдрэмж: тайван, бодит, өвлийн өглөөний гэрэл.
Загвар биш, "аппын хувьд тэнэг зүйлгүй" байх.

Токен (`:root`, dark mode-д `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"])` ба `:root[data-theme="dark"]`):

```
light: --bg #EEF3F1  --surface #FFFFFF  --sunk #E3EAE7  --ink #16211F  --muted #5F6E6A  --line #D5DEDA
       --accent #B8741A (шар гүргэм, ааруулын өнгө)  --accent-ink #FFFFFF  --accent-soft #F6E9D2
       --ok #2F7D4F --ok-soft #E1F0E6  --warn #C2611C --warn-soft #FBE9DC  --bad #B2362E --bad-soft #F9E3E0
       төрлийн өнгө: --c-strength #B8741A  --c-yoga #1F6F7A  --c-pilates #6B4FA0  --c-mobility #4E8A5C  --c-walk #4A6FA5  --c-breath #1F6F7A
dark:  --bg #0E1514  --surface #182220  --sunk #22302D  --ink #ECF1EF  --muted #98A8A3  --line #2C3A36
       --accent #E0A24A  --accent-ink #1B1206  --accent-soft #3A2A10
       --ok #4FB372 --ok-soft #163322  --warn #E88A4A --warn-soft #3A2412  --bad #E5665C --bad-soft #3D1715
       төрлийн өнгө гэрэлтүүлсэн хувилбар
```

Бичвэр: display "Unbounded" (500/600, зөвхөн дэлгэцийн гарчиг, том тоо; `letter-spacing:-0.02em`),
body "Golos Text" (400/500/600), fallback `system-ui`. Google Fonts-оос `cyrillic-ext` дэд олонлогтой
(Ө, Ү үсэг). Body 16px, оролтууд 16px (iOS zoom). Мөрийн урт ≤ 70 тэмдэгт.

Бүтэц: нэг багана, `max-width: 640px`, 16px захтай, доод таб бар (translucent, `backdrop-filter`),
safe-area padding. Таб: **Өнөөдөр · Хөтөлбөр · Хоол · Ахиц · Би**. Онбординг нэг дэлгэц = нэг асуулт,
дээр нь нимгэн явцын шугам, доор "Үргэлжлүүлэх" товч (44px+). Хичээл тоглуулагч бүтэн дэлгэц.

Мартагдахгүй нэг зүйл: **"Яагаад" чипүүд** — хөтөлбөрийн дасгал, хоолны зөвлөмж бүрийн доор
хэрэглэгчийн хариултаас урган гарсан шалтгаан (жишээ: "Таны бүсэлхий/өндөр 0.56 → алхалт нэмсэн").
Бусад бүх зүйл тайван, чимэглэлгүй. Emoji icon болгож хэрэглэхгүй, inline SVG (stroke 1.75) ашиглана.
Хөдөлгөөн: зөвхөн хэрэглэгчийн үйлдлийн хариу, `prefers-reduced-motion` хүндэтгэнэ. Таб солиход
`transform/opacity` 220ms `cubic-bezier(.32,.72,0,1)`.

Монгол бичвэр: `.claude/skills/mn-humanizer` дүрмээр. "Та" гэж хандана, богино өгүүлбэр, англи calque-гүй.

## Профайл (`profile`) — онбордингийн гаралт

```js
{
  v: 1,
  name: "",                      // заавал биш
  goals: ["fatloss"],            // эрэмбэтэй, ≤3. ids: fatloss | muscle | posture_back | mobility | stress_sleep | fitness_energy
                                 //   | womens (дэд: cycle|pregnancy|postpartum|menopause) | metabolic (дэд: htn|t2d|gout) | older_balance | event_5k | habit
  womens: null | { stage: "none"|"pregnancy"|"postpartum"|"menopause", trimester: 1|2|3|null, weeksPostpartum: number|null },
  metabolic: [],                 // "htn" | "t2d" | "gout" | "cholesterol" — өөрөө мэдэгдсэн
  sex: "f"|"m", age: 34, heightCm: 165, weightKg: 68, waistCm: 84,
  daysPerWeek: 3, minutes: 20,   // 10|15|20|30|45
  equipment: ["mat","wall","chair"],  // none|mat|wall|chair|band|db|kb  ("none" гэдэг нь биеийн жин л)
  space: "floor"|"standing",     // шалан дээр хэвтэх зай бий эсэх
  parq: [false,false,false,false,false,false,false],  // PAR-Q+ 7 асуулт, true = "Тийм"
  pain: [],                      // knee|lowback|neck|shoulder|wrist|hip|ankle
  sleepHours: 7, stress: 3,      // stress 1..5
  occupation: "desk"|"physical"|"shift"|"home"|"student",
  failedBefore: true, cue: "Өглөө цайны дараа",  // дадлын зангуу (implementation intention)
  diet: { mealsPerDay: 3, meatDaysPerWeek: 6, saltTeaCups: 3, vegServings: 1, sugaryDrinksPerDay: 1, snacksLate: true, budget: "low"|"mid"|"high" },
  tests: { pushups: 8, pushupType: "knee"|"full", chairStand30: 14, plankSec: 35, balanceSec: 12, toeTouch: "floor"|"ankle"|"shin"|"knee" }, // бүгд заавал биш (null байж болно)
  prefs: { dislikes: [], likes: [] }, // төрөл: strength|yoga|pilates|mobility|walk|breath
  createdAt: "ISO"
}
```

## Дасгалын сан (`FitLib`)

```js
window.FitLib = {
  exercises: [Exercise],
  byId(id) -> Exercise | undefined,
  filter({ type, pattern, equipment, maxLevel, exclContra, position }) -> [Exercise],
  TYPES: ["strength","yoga","pilates","mobility","cardio","breath"],
  PATTERNS: ["squat","hinge","lunge","push","pull","core","carry","rotation","balance","gait"],
  CONTRA: ["knee","lowback","neck","shoulder","wrist","hip","ankle","pregnancy","postpartum","hypertension","inversion"],
}
Exercise = {
  id: "squat_chair",             // snake_case, латин
  name: "Сандалд суугаад босох",  // монгол, товч
  en: "Chair squat",
  type: "strength",              // TYPES
  pattern: "squat",              // PATTERNS (йога/пилатест ч хамаарах хэв маягийг тавина, core default)
  muscles: ["quads","glutes"],   // quads|hams|glutes|calves|chest|back|shoulders|biceps|triceps|core|hipflex|adductors|spine|neck|fullbody
  equipment: ["chair"],          // [] = зөвхөн биеийн жин; mat|wall|chair|band|db|kb
  level: 1,                      // 1 (бүрэн эхлэгч) … 5
  position: "standing",          // standing|kneeling|supine|prone|seated|side
  impact: 0,                     // 0 ямар ч үсрэлтгүй, 1 бага, 2 үсрэлттэй
  contra: ["knee"],              // энэ дасгалыг ХАСАХ шалтгаанууд (CONTRA)
  unit: "reps"|"seconds"|"breaths",
  defaults: { sets: 3, reps: 10, seconds: null, breaths: null, rest: 45 },
  sides: "both"|"each",
  cues: ["Хөлийг мөрний өргөнтэй тавь", "..."],  // 2–3 заавар
  mistakes: ["..."],             // 1–2 түгээмэл алдаа
  regress: "squat_wall_sit" | null,  // хялбар хувилбарын id
  progress: "squat_bw" | null,       // хүнд хувилбарын id
  yoga: { sanskrit: "Tadasana", family: "standing"|"forward"|"back"|"twist"|"inversion"|"restorative"|"balance"|"hipopen"|"core", next: ["id",...], counter: ["id",...] } | undefined,
  pilates: { tier: 1|2|3, classical: 1..34 | null } | undefined,
  snack: true | false,           // 5 минутын "зууш"-д тохирох эсэх
}
```

Хэмжээ: доод тал нь хүч 60, йога 45, пилатес 30 (34 сонгодог + хувилбар), мобилити 25, амьсгал 6, кардио/алхалт 6.
Эхлэгч (level 1–2) бүрэн хамрагдсан байх; `regress`/`progress` гинж бүрэн (id-ууд сангаасаа олддог).
Хүн бүрийн мэддэг нэр томьёо хэрэглэ (planк = "Планк", "Нохой доош" (Adho Mukha) г.м.).

## Хүнсний сан (`FitFoods`)

```js
window.FitFoods = {
  foods: [Food], byId(id), byGroup(group) -> [Food],
  meals: { [goalId]: [MealTemplate] },      // "default" заавал
  tips: { salt: [...], winter: [...], budget: [...], tsagaansar: [...], naadam: [...] }  // монгол зөвлөмж өгүүлбэрүүд
}
Food = {
  id: "aaruul", name: "Ааруул", en: "Dried curd",
  group: "protein"|"dairy"|"grain"|"veg"|"fruit"|"fat"|"drink"|"dish"|"snack",
  per: "100g"|"piece"|"cup"|"serving", kcal, protein, fat, carb, sodium /* мг */, fiber,
  estimate: true|false,          // тоо нь тооцоолол бол true (судалгааны тэмдэглэл: монгол найрлагын хүснэгт байхгүй)
  brands: ["Сүү ХК", "АПУ Дэйри"],  where: ["CU","GS25","Номин","Имарт","зах"],
  season: "all"|"summer"|"winter",
  price: { mnt: 612, unit: "ш", year: 2026, estimate: true } | null,
  tags: ["high-protein","cheap","salty","sugary","traditional"],
  swaps: ["eezgii","tarag"], tip: "Өглөөний цайнд 5–6 ширхэг ааруул 10 г орчим уураг өгнө."
}
MealTemplate = { id, name: "Өглөө", items: [{ foodId, amount: "2 ш" }], kcal, protein, why: ["..."] }
```

Доод тал нь 70 хүнс: уламжлалт цагаан идээ (сүү, тараг, ааруул, аарц, ээзгий, өрөм, бяслаг, шар тос, айраг, хоормог),
мах (үхэр, хонь, адуу, ямаа — нөөцийн мах тусад нь, тахиа, өндөг, загас, туна лаазтай), гурилан хоол (бууз, хуушуур,
цуйван, гурилтай шөл, банштай шөл, боорцог, талх, хар талх), будаа, сагаган, овъёос, гоймон, "4 ногоо" (төмс, лууван,
байцаа, сонгино) + өргөст хэмх, улаан лооль, чинжүү, брокколи, хөлдөөсөн ногоо, даршилсан байцаа, кимчи, жимс (алим, гадил,
жүрж, чацаргана), самар, тос, ундаа (сүүтэй цай давстай/давсгүй, ус, APU ундаа, кола, кофе), CU/GS25-ийн зүйлс (кимбап, чанасан өндөг,
протеин ундаа), нэмэлт (витамин D, омега-3). Үнэ: судалгааны тайлангаас (2025–2026, estimate тэмдэгтэй).

## Хөдөлгүүр (`FitEngine`)

```js
window.FitEngine = {
  screen(profile) -> { ok: boolean, stop: boolean, flags: [{ code, text }] },
    // PAR-Q+ аль нэг "Тийм" → stop:true, text "Эмчээс зөвшөөрөл аваад эхлээрэй" маягийн.
    // Жирэмсэн + анхааруулах шинж, систолын даралт мэдэгдсэн бол г.м. нэмэлт flag.
  assess(profile) -> Assessment,
  buildProgram(profile, assessment, { weekIndex: 0, prev: Program|null, logs: [Log] }) -> Program,
  adapt(program, profile, logs) -> { changes: [{ text }], nextOpts: {...} },  // долоо хоногийн төгсгөлд
  nutrition(profile, assessment) -> Nutrition,
  retestDue(profile, logs, now) -> boolean,   // 4 долоо хоног тутам
  stepsTarget(profile, assessment, weekIndex) -> number,
  VERSION: 1,
}

Assessment = {
  bmi: 25.0, whtr: 0.51, whtrBand: "ok"|"watch"|"high",   // <0.5 ok, 0.5–0.6 watch, ≥0.6 high (Ashwell)
  level: 1..5,                  // ерөнхий түвшин: тестүүд + туршлага + нас
  strengthLevel, coreLevel, balanceLevel, mobilityLevel: 1..5,
  tests: { pushups: { value, band: "low"|"mid"|"high", text: "..." }, ... },   // ACSM/Rikli-Jones/Springer нормын бүлгүүд
  flags: ["desk","lowback","short_sleep","high_salt","low_veg","winter_vitd","high_stress","beginner","older"],
  why: ["Бүсэлхий/өндөр 0.51 → ...", ...]   // монгол тайлбар
}

Program = {
  id, version: 1, weekIndex: 0, createdAt, goals, title: "1-р долоо хоног: суурь тавих",
  phase: "base"|"build"|"deload",     // 4 долоо хоногийн цикл: base, build, build, deload (эхлэгчид 3+1)
  stepsTarget: 6000,
  days: [ { dow: 1..7, kind: "session"|"snack"|"walk"|"rest", session: Session|null, why: [...] } ],  // dow 1 = Даваа
  snacks: [ Session ],                // ≤5 мин, өдөр бүр санал болгох 2
  notes: ["..."],
}
Session = {
  id, title: "Хүч + сунгалт", type: "strength"|"yoga"|"pilates"|"mix"|"mobility"|"walk"|"breath",
  minutes: 20,
  blocks: [ { name: "Халаалт"|"Үндсэн"|"Нэмэлт"|"Тайвшрал", items: [ Item ] } ],
  why: ["..."]
}
Item = { exId, sets, reps|seconds|breaths, rest, sides, why: ["..."] , tempo: null|"3-1-1" }
Log = { date: "YYYY-MM-DD", sessionId, done: true, rpe: 1..10, pain: ["knee"], enjoy: 1..5, minutes, skippedExIds: [] }
Nutrition = {
  bmr, tdee, targetKcal, deficit: -400|0|+250, proteinG: [120, 150], fatMinG, fiberG, waterL,
  refuse: null | "Жирэмсэн үед дутагдал санал болгохгүй" (teen <18, pregnancy, BMI<18.5 → deficit 0),
  hands: { protein: 2, veg: 2, carb: 1, fat: 1 },   // гарын порц, хоол тутамд
  mealSplit: [0.25, 0.4, 0.2, 0.15],   // НЭМҮТ: өглөө, өдөр, орой, зууш
  saltTeaCups: { now: 3, target: 1, text: "..." },
  vitD: { show: true (10–4 сар), text },
  focus: ["protein","salt","veg","sugar"],   // профайлын дагуу эрэмбэлсэн
  meals: [MealTemplate],                      // foods.js-ээс сонгосон, зорилгод тохируулсан
  shopping: [{ foodId, note }],               // 10–15 зүйл, брэнд/дэлгүүрийн нэртэй
  why: ["..."]
}
```

### Бүтээгчийн дүрэм (хураангуй, судалгааны тайлангийн "Хөтөлбөрийн дүрмүүд" бүлгээс)

- Долоо хоногийн загвар: `daysPerWeek` урт хичээл + өдөр бүр 1–2 зууш + алхамын зорилт (эхлэлт = одоогийнх эсвэл 5000, долоо хоног бүр +500…+1000, дээд 10000).
- Зорилгоос төрлийн хуваарилалт: fatloss → strength 2 + walk + 1 pilates/yoga; muscle → strength 3; posture_back → pilates/mobility 2 + strength 1, McGill 3 (curl-up, side plank, bird dog) халаалтад; mobility → yoga 2 + mobility; stress_sleep → yoga/breath 2 + walk; womens.menopause → strength 2 (өндөр эрчим, impact ≤1) + balance; pregnancy → impact 0, supine 1-р гурван сараас хойш хасна, inversion хасна, зөвхөн level ≤2; postpartum <12 долоо хоног → core-recovery, PFMT, impact 0; older_balance → strength 2 + balance өдөр бүр; metabolic htn → изометрик (wall sit, plank) + walk, Valsalva-гүй; t2d → хоолны дараах 10 мин алхалт; gout → бага эрчим, ус.
- Хичээлийн слот: Халаалт 10–15% (мобилити/амьсгал), Үндсэн 60–70%, Нэмэлт 10–15%, Тайвшрал 10% (суналт/амьсгал).
- Хүчний сонголт: хэв маяг бүрээс (squat, hinge, push, pull, core) нэг; хатуу шүүлтүүр: equipment ⊆ profile.equipment ∪ ["mat"? зөвхөн байвал], level ≤ assessment.level+1, contra ∩ (pain ∪ womens flags ∪ metabolic flags) = ∅, space=standing бол supine/prone хасна; жинлэсэн оноо: зорилгод таарах булчин +, өмнөх долоо хоногт хийсэн бол +0.2 (тогтвортой), 3 долоо хоног дараалан бол −0.3 (хувьсал), dislikes −1.
- Сет/давталт (NSCA): эхлэгч 2–3×8–12, 45–60 с амралт; хүч 3–4×5–8; тэсвэр 2×15–20; RIR 2–3.
- Явц: RPE ≤6 хоёр удаа дараалан → давталт/сек +10–20% эсвэл `progress` id; RPE ≥9 эсвэл өвдөлт → `regress` id, дараагийн долоо хоногт тэр бүс дээр ачаалал −20%; skip 2+ → хичээлийн минут −5; deload долоо хоногт сет −40%.
- Йога дараалал: Ирэх (амьсгал 1) → Халаалт (нохой доош, муур-үхэр) → Зогсоо → Оргил поз (зорилгоос) → Эсрэг поз → Шалан дээр → Тайвшрал (Shavasana/нидра). `yoga.next` графаар шилжилт.
- Пилатес: tier ≤ coreLevel, сонгодог дарааллаар 6–10 дасгал, 100 (Hundred) эхэнд (жирэмсэн/нуруунд roll-up хасна).
- Why чип бүр профайлын тодорхой утгыг иш татна: "Өдөрт 20 минут → ...", "Өвдөг өвддөг → ... хассан", "Нойр 5 цаг → эрчим −1".
- Хоол: Mifflin-St Jeor; AF: desk 1.3, home 1.4, shift 1.4, student 1.4, physical 1.6; + хичээлийн минут/7 × 0.05. fatloss deficit −400 (whtr high бол −500, дээд 20%), muscle +250, бусад 0. Уураг 1.6–2.2 г/кг (fatloss дээд тал), өөх ≥0.7 г/кг, ширхэг 25–30 г, ус 30 мл/кг.

## Апп (`app.js`) дэлгэцүүд

1. **Эхлэл** (профайл байхгүй): нэг өгүүлбэр юу хийдэг тухай, "Эхлэх" товч; "Нэвтрэх" холбоос (Supabase байвал).
2. **Онбординг** 12–14 дэлгэц: зорилго (≤3 сонгоно, эрэмбэ = сонгосон дараалал) → эмэгтэйчүүдийн үе шат (sex f бол) → нас/хүйс → өндөр/жин/бүсэлхий (бүсэлхийг хэрхэн хэмжих жижиг зураг/тайлбар) → хоног & минут → хэрэгсэл & зай → PAR-Q+ 7 (нэг дэлгэц, тийм/үгүй) → өвдөлт → нойр/стресс/ажил → өмнө бүтэлгүйтсэн эсэх + зангуу → хоол 6 асуулт → гэрийн тест (заавал биш, алгасаж болно; тест бүр заавартай, таймертай) → "Хөтөлбөрөө харах". Хариулт бүр `profile`-д шууд хадгалагдана (дундаас гарсан ч үргэлжилнэ).
3. **Өнөөдөр**: өнөөдрийн хичээл (эсвэл зууш/алхалт/амралт), алхамын зорилт (гараар оруулна), "Эхлэх" → тоглуулагч; доор why чипүүд; дууссан бол санал хүсэлт (RPE 1–10 слайдер, өвдөлт, таалагдсан эсэх).
4. **Тоглуулагч**: бүтэн дэлгэц, блок/дасгалын нэр, том таймер эсвэл давталтын тоо, cues, "Дараах"/"Өмнөх"/"Солих (regress)"/"Түр зогсоох", амралтын тоолуур, дуусахад дүгнэлт. Экран унтрахаас сэргийлэх Wake Lock (байвал).
5. **Хөтөлбөр**: долоо хоногийн 7 өдөр, хичээл бүрийг дэлгэх, дасгал тус бүрийн why; "Дараагийн долоо хоног" (adapt-ийн өөрчлөлтийн жагсаалттай); 4 долоо хоног тутам дахин тест сануулга.
6. **Хоол**: калори/уураг зорилт (гарын порцоор), фокус 3 зүйл (давс, уураг, ногоо…), өдрийн хоолны загвар, дэлгүүрийн жагсаалт брэндтэй, улирлын зөвлөмж (витамин D 10–4 сар, Цагаан сар/Наадам ойртвол), давстай цайны аяга тоолуур.
7. **Ахиц**: жин (EMA шугам, SVG), бүсэлхий, алхам, хичээлийн стрик (долоо хоногийн зорилтоор, өдрөөр биш), тестийн түүх, дахин тест товч.
8. **Би**: профайл засах (онбордингийн аль ч дэлгэц рүү), сэдэв, өгөгдөл экспорт/импорт JSON, нэвтрэх/гарах, "Эмнэлгийн зөвлөгөө биш" тэмдэглэл.

Хадгалалт: `S = { profile, assessment, program, programs: [], logs: [], weights: [{date,kg,waist}], steps: [{date,n}], settings: {theme, saltTeaToday} }`.
Local горим: `localStorage["fit-state"]`. Cloud: `fit/profile`, `fit/program`, `fit/logs`, `fit/body`, `fit/settings` замууд (`bjj/app.js`-ийн SB объекттой ижил REST хандалт, `cb-sb-session` session хуваалцана). `config.js` хоосон `{}` бол local-only, нэвтрэх товч харагдахгүй.

## Шалгалт

- `node fit/test.js` — engine-ийн 10+ профайлаар хөтөлбөр үүсгэж: id бүр санд байгаа, contra зөрчилгүй, минут ±20%, deficit дүрэм, PAR-Q stop шалгана.
- Playwright iPhone 13 (390×844), light/dark: console алдаагүй, хэвтээ overflow байхгүй, онбординг → хөтөлбөр → тоглуулагч → санал хүсэлт бүрэн гүйнэ.
