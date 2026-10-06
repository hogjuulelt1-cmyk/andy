/* Тэнхээ — дасгалын сан (FitLib). Spec: fit/SPEC.md "Дасгалын сан".
   Нэг дасгал = нэг E(type, {...}) дуудлага. Богино түлхүүрүүд:
   pat → pattern, m → muscles, eq → equipment, lv → level, pos → position, imp → impact,
   c → contra, sets/reps/sec/br/rest → defaults, cue → cues, mis → mistakes,
   reg → regress, pro → progress, y → yoga {s: sanskrit, f: family, next, counter}, pil → pilates {t: tier, n: classical}.
   unit: sec байвал "seconds", br байвал "breaths", үгүй бол "reps". */
(function () {
  "use strict";

  const TYPES = ["strength", "yoga", "pilates", "mobility", "cardio", "breath"];
  const PATTERNS = ["squat", "hinge", "lunge", "push", "pull", "core", "carry", "rotation", "balance", "gait"];
  const CONTRA = ["knee", "lowback", "neck", "shoulder", "wrist", "hip", "ankle", "pregnancy", "postpartum", "hypertension", "inversion"];

  // Төрөл тус бүрийн анхдагч утга
  const TD = {
    strength: { pat: "core", pos: "standing", sets: 2, reps: 10, rest: 45 },
    yoga:     { pat: "core", pos: "standing", sets: 1, br: 5, rest: 0 },
    pilates:  { pat: "core", pos: "supine", sets: 1, reps: 8, rest: 15 },
    mobility: { pat: "core", pos: "standing", sets: 1, reps: 8, rest: 10 },
    breath:   { pat: "core", pos: "seated", sets: 1, br: 10, rest: 0 },
    cardio:   { pat: "gait", pos: "standing", sets: 1, sec: 600, rest: 0, imp: 1 },
  };

  const exercises = [];
  function E(type, o) {
    const d = TD[type];
    const sec = o.sec != null ? o.sec : (o.reps == null && o.br == null ? d.sec : undefined);
    const br = o.br != null ? o.br : (o.reps == null && sec == null ? d.br : undefined);
    const reps = o.reps != null ? o.reps : (sec == null && br == null ? d.reps : undefined);
    const unit = sec != null ? "seconds" : br != null ? "breaths" : "reps";
    const ex = {
      id: o.id, name: o.name, en: o.en, type,
      pattern: o.pat || d.pat,
      muscles: o.m || ["core"],
      equipment: o.eq || [],
      level: o.lv || 1,
      position: o.pos || d.pos,
      impact: o.imp != null ? o.imp : (d.imp || 0),
      contra: o.c || [],
      unit,
      defaults: { sets: o.sets || d.sets, reps: reps != null ? reps : null, seconds: sec != null ? sec : null, breaths: br != null ? br : null, rest: o.rest != null ? o.rest : d.rest },
      sides: o.sides || "both",
      cues: o.cue || [],
      mistakes: o.mis || [],
      regress: o.reg || null,
      progress: o.pro || null,
      snack: !!o.snack,
    };
    if (o.y) ex.yoga = { sanskrit: o.y.s || null, family: o.y.f, next: o.y.next || [], counter: o.y.counter || [] };
    if (o.pil) ex.pilates = { tier: o.pil.t, classical: o.pil.n != null ? o.pil.n : null };
    exercises.push(ex);
  }

  /* ============================ ХҮЧ ============================ */
  // --- Суулт (squat) ---
  E("strength", { id: "squat_wall_sit", name: "Ханан дээр суух", en: "Wall sit", pat: "squat", m: ["quads", "glutes"], eq: ["wall"], lv: 1, sec: 30, sets: 3, snack: true,
    cue: ["Нуруугаа ханандаа бүхэлд нь наа.", "Өвдгөө 90 градусаас гүн нугалахгүй.", "Жигд амьсгалж, амьсгалаа барилгүй."],
    mis: ["Өвдөг хөлийн хурууны үзүүрээс урагш гарах"], pro: "wall_sit_single" });
  E("strength", { id: "wall_sit_single", name: "Ханан дээр нэг хөлөөр суух", en: "Single-leg wall sit", pat: "squat", m: ["quads", "glutes"], eq: ["wall"], lv: 3, sec: 20, sets: 3, sides: "each", c: ["knee"],
    cue: ["Эхлээд хоёр хөлөөрөө суугаад нэг хөлөө шалнаас хэдхэн см өргө.", "Аарцгаа тэгш байлга."],
    mis: ["Аарцаг нэг тийшээ хазайх"], reg: "squat_wall_sit" });
  E("strength", { id: "squat_partial", name: "Хагас суулт", en: "Partial squat", pat: "squat", m: ["quads", "glutes"], eq: [], lv: 1, reps: 12, sets: 2, snack: true,
    cue: ["Хөлөө мөрний өргөнтэй тавьж хонгоо хойш, өвдгөө бага нугал.", "Өвдөг өвдөхгүй гүн хүртэл л буу, өсгий шалан дээр.", "Өсгийгөөр түлхэж бос."],
    mis: ["Өвдөг хурууны үзүүрээс урагш"], pro: "squat_bw" });
  E("strength", { id: "squat_chair_assist", name: "Сандлаас гар түшиж босох", en: "Assisted sit-to-stand", pat: "squat", m: ["quads", "glutes"], eq: ["chair"], lv: 1, reps: 8, sets: 2, snack: true,
    cue: ["Хөлөө сандлын хөлний чигт ойрхон тавь.", "Урагш бөхийгөөд гараараа бага зэрэг түшиж бос.", "Суухдаа унахгүй, аажуу буу."],
    mis: ["Суухдаа сандал руу шууд унах"], pro: "squat_chair" });
  E("strength", { id: "squat_chair", name: "Сандлаас босож суух", en: "Sit-to-stand", pat: "squat", m: ["quads", "glutes"], eq: ["chair"], lv: 1, reps: 10, sets: 2, snack: true,
    cue: ["Гараа цээжин дээрээ зөрүүлж, урагш бага бөхийгөөд бос.", "Өвдгөө хөлийн хурууны чигт байлга.", "Суухдаа гурав тоолж аажуу буу."],
    mis: ["Өвдөг дотогшоо ойртох", "Хурдлан унаж суух"], reg: "squat_chair_assist", pro: "squat_box" });
  E("strength", { id: "squat_box", name: "Сандал хүртэл суулт", en: "Box squat", pat: "squat", m: ["quads", "glutes"], eq: ["chair"], lv: 2, reps: 10, sets: 3,
    cue: ["Сандалд өгзгөө зөөлхөн хүргээд, суулгүй буцаад бос.", "Цээжээ өргөж, харцаа урагш."],
    mis: ["Жингээ сандалд бүрэн тавих"], reg: "squat_chair", pro: "squat_bw" });
  E("strength", { id: "squat_bw", name: "Суулт", en: "Bodyweight squat", pat: "squat", m: ["quads", "glutes"], eq: [], lv: 2, reps: 12, sets: 3, c: ["knee"], snack: true,
    cue: ["Хөлөө мөрний өргөнтэй тавьж, өсгийгөө шалнаас салгахгүй.", "Сандалд суух мэт хонгоо хойш, доош буулга.", "Босохдоо өсгийгөөр шал түлх."],
    mis: ["Өсгий шалнаас хөндийрөх", "Өвдөг дотогшоо ойртох"], reg: "squat_box", pro: "squat_tempo" });
  E("strength", { id: "squat_sumo", name: "Сумо суулт", en: "Sumo squat", pat: "squat", m: ["quads", "glutes", "adductors"], eq: [], lv: 2, reps: 12, sets: 3, c: ["knee"],
    cue: ["Хөлөө мөрнөөс өргөн тавьж, хурууг гадагш 45 градус хар.", "Өвдгөө хөлийн хурууны чигт нээж буу."],
    mis: ["Нуруу бөгтийх"], reg: "squat_box", pro: "squat_goblet" });
  E("strength", { id: "squat_tempo", name: "Удаан суулт", en: "Tempo squat (3-1-1)", pat: "squat", m: ["quads", "glutes"], eq: [], lv: 3, reps: 8, sets: 3, c: ["knee"],
    cue: ["Гурав тоолж буугаад, доороо нэг секунд зогс.", "Нэг тоололд бос."],
    mis: ["Доод цэгт сулрах"], reg: "squat_bw", pro: "squat_pulse" });
  E("strength", { id: "squat_pulse", name: "Пульс суулт", en: "Pulse squat", pat: "squat", m: ["quads", "glutes"], eq: [], lv: 3, reps: 15, sets: 3, c: ["knee"],
    cue: ["Суултын доод цэгт байж, 10 см орчим дээш доош хөдөл.", "Өсгий шалнаас салгахгүй."],
    mis: ["Хэт өндөр босож амрах"], reg: "squat_tempo", pro: "squat_goblet" });
  E("strength", { id: "squat_goblet", name: "Гоблет суулт", en: "Goblet squat", pat: "squat", m: ["quads", "glutes", "core"], eq: ["db"], lv: 3, reps: 10, sets: 3, rest: 60, c: ["knee"],
    cue: ["Дамббелийг цээжин дээрээ хоёр гараараа барь.", "Тохойгоо өвдөгнийхөө дотор талд хүртэл буу.", "Цээжээ өргөөтэй байлга."],
    mis: ["Жин урагш татаж бөгтийх"], reg: "squat_bw", pro: "squat_single_chair" });
  E("strength", { id: "squat_single_chair", name: "Нэг хөлөөр сандлаас босох", en: "Single-leg sit-to-stand", pat: "squat", m: ["quads", "glutes"], eq: ["chair"], lv: 4, reps: 6, sets: 3, rest: 60, sides: "each", c: ["knee"],
    cue: ["Нэг хөлөө урагш сунгаад нөгөө хөлөөрөө бос.", "Аажуу буугаад сандалд хүрээд л босо."],
    mis: ["Өвдөг дотогшоо унах"], reg: "squat_goblet", pro: "squat_jump" });
  E("strength", { id: "squat_jump", name: "Үсрэлттэй суулт", en: "Jump squat", pat: "squat", m: ["quads", "glutes", "calves"], eq: [], lv: 4, reps: 8, sets: 3, rest: 60, imp: 2, c: ["knee", "ankle", "pregnancy", "postpartum"],
    cue: ["Хагас сууж үсрээд, хөлийн үзүүрээр зөөлөн буу.", "Буухдаа өвдгөө нугалж чимээгүй газард."],
    mis: ["Шулуун хөлөөр хатуу буух"], reg: "squat_tempo" });

  // --- Хонго (hinge) ---
  E("strength", { id: "hinge_wall_tap", name: "Хонгоо хана руу хөдөлгөх", en: "Wall hip hinge", pat: "hinge", m: ["glutes", "hams"], eq: ["wall"], lv: 1, reps: 10, sets: 2, snack: true,
    cue: ["Ханаас нэг алхам урагш зогс.", "Нуруугаа шулуун байлгаж хонгоо хойш хана руу хүргэ.", "Өвдгөө бага зэрэг нугал."],
    mis: ["Нуруугаа бөхийлгөж бөгтийх"], pro: "rdl_bw" });
  E("strength", { id: "glute_bridge", name: "Гүүр", en: "Glute bridge", pat: "hinge", m: ["glutes", "hams"], eq: ["mat"], lv: 1, pos: "supine", reps: 12, sets: 2, c: ["pregnancy"], snack: true,
    cue: ["Нуруугаар хэвтэж өвдгөө нугалан, өсгийгөө өгзөг рүүгээ ойртуул.", "Өгзгөө чангалж аарцгаа дээш өргө.", "Дээд цэгт өвдөг, хонго, мөр нэг шугамд."],
    mis: ["Нурууны хонхорхойг хэт гэдийлгэх"], pro: "glute_bridge_hold" });
  E("strength", { id: "glute_bridge_hold", name: "Гүүр барих", en: "Glute bridge hold", pat: "hinge", m: ["glutes", "hams"], eq: ["mat"], lv: 1, pos: "supine", sec: 30, sets: 2, c: ["pregnancy"],
    cue: ["Гүүрийн дээд цэгт өгзгөө чангалсаар бай.", "Жигд амьсгал."],
    mis: ["Хавирга дээш гарч нуруу гэдийх"], reg: "glute_bridge", pro: "glute_bridge_single" });
  E("strength", { id: "glute_bridge_single", name: "Нэг хөлний гүүр", en: "Single-leg glute bridge", pat: "hinge", m: ["glutes", "hams"], eq: ["mat"], lv: 3, pos: "supine", reps: 10, sets: 3, sides: "each", c: ["pregnancy"],
    cue: ["Нэг хөлөө тэнгэр рүү сунгаад нөгөө хөлөөрөө аарцгаа өргө.", "Аарцаг хазайхгүй, тэгш."],
    mis: ["Аарцаг нэг тал руу унах"], reg: "glute_bridge_hold", pro: "hip_thrust_chair" });
  E("strength", { id: "hip_thrust_chair", name: "Сандалд налсан гүүр", en: "Hip thrust (chair)", pat: "hinge", m: ["glutes", "hams"], eq: ["chair"], lv: 3, pos: "supine", reps: 12, sets: 3, rest: 60, c: ["pregnancy"],
    cue: ["Далныхаа доод хэсгийг сандлын суудалд налуул.", "Эрүүгээ цээж рүүгээ татаж аарцгаа өргө."],
    mis: ["Нуруу гэдийж аарцгийн оронд хавирга өргөгдөх"], reg: "glute_bridge_single", pro: "rdl_db" });
  E("strength", { id: "rdl_bw", name: "Румын татлага (биеийн жин)", en: "Bodyweight Romanian deadlift", pat: "hinge", m: ["hams", "glutes", "back"], eq: [], lv: 2, reps: 12, sets: 3,
    cue: ["Өвдгөө бага нугалж, хонгоо хойш түлхэнгээ цээжээ урагш буулга.", "Нуруу шулуун, харц урагш доош.", "Гуяны ар сунгарахыг мэдэрмэгц өгзгөөрөө бос."],
    mis: ["Нуруу бөгтийх", "Өвдөг нугалж суулт болгох"], reg: "hinge_wall_tap", pro: "rdl_single" });
  E("strength", { id: "good_morning", name: "Бөхийлт", en: "Good morning", pat: "hinge", m: ["hams", "glutes", "back"], eq: [], lv: 2, reps: 12, sets: 2,
    cue: ["Гараа толгойныхоо ард тавь.", "Хонгоо хойш, цээжээ урагш бөхийгөөд нуруу шулуун байлга."],
    mis: ["Нурууны доод хэсгийг бөхийлгөх"], reg: "hinge_wall_tap", pro: "rdl_bw" });
  E("strength", { id: "rdl_single", name: "Нэг хөлний румын татлага", en: "Single-leg RDL", pat: "hinge", m: ["hams", "glutes", "core"], eq: [], lv: 3, reps: 8, sets: 3, sides: "each",
    cue: ["Нэг хөлөө хойш сунгангаа цээжээ урагш буулга.", "Аарцаг шал руу харсан хэвээр.", "Хэрэгтэй бол ханыг хуруугаараа түш."],
    mis: ["Аарцаг гадагш эргэх"], reg: "rdl_bw", pro: "rdl_db" });
  E("strength", { id: "rdl_db", name: "Дамббелтэй румын татлага", en: "Dumbbell RDL", pat: "hinge", m: ["hams", "glutes", "back"], eq: ["db"], lv: 3, reps: 10, sets: 3, rest: 60,
    cue: ["Дамббелийг гуяныхаа дагуу гулсуулж доош буулга.", "Нуруу шулуун, дал хавчсан.", "Өгзгөө чангалж бос."],
    mis: ["Жинг биеэсээ холдуулах"], reg: "rdl_bw", pro: "kb_deadlift" });
  E("strength", { id: "kb_deadlift", name: "Гирийн татлага", en: "Kettlebell deadlift", pat: "hinge", m: ["glutes", "hams", "back"], eq: ["kb"], lv: 3, reps: 10, sets: 3, rest: 60,
    cue: ["Гирийг хөлийнхөө дунд тавь.", "Хонгоо хойш татаж бариулыг нь атгаад, хөлөөрөө шал түлхэж бос.", "Дээд цэгт өгзгөө чангал."],
    mis: ["Нуруугаар татах"], reg: "rdl_db", pro: "kb_swing" });
  E("strength", { id: "kb_swing", name: "Гирийн савлалт", en: "Kettlebell swing", pat: "hinge", m: ["glutes", "hams", "core"], eq: ["kb"], lv: 4, reps: 15, sets: 4, rest: 60, imp: 1, c: ["lowback", "pregnancy", "postpartum"],
    cue: ["Хонгоо хойш татаж гирийг хөлийн хооронд өнгөрүүл.", "Өгзгөө огцом чангалж гирийг цээжний түвшин хүртэл савла.", "Гараараа өргөхгүй, хонгоороо түлх."],
    mis: ["Суулт шиг өвдөг нугалах", "Гар, мөрөөр өргөх"], reg: "kb_deadlift" });

  // --- Алхалт (lunge) ---
  E("strength", { id: "lunge_static_chair", name: "Сандал түшиж байрны алхалт", en: "Supported split squat", pat: "lunge", m: ["quads", "glutes"], eq: ["chair"], lv: 1, reps: 8, sets: 2, sides: "each",
    cue: ["Нэг хөлөө урагш алхаад сандлын түшлэгийг барь.", "Биеэ шулуун доош буулга, бага гүн хангалттай."],
    mis: ["Урд өвдөг хэт урагш гарах"], pro: "lunge_split_static" });
  E("strength", { id: "lunge_split_static", name: "Байрны алхалт", en: "Split squat", pat: "lunge", m: ["quads", "glutes"], eq: [], lv: 2, reps: 10, sets: 3, sides: "each",
    cue: ["Нэг хөлөө урагш том алхам тавь.", "Хоёр өвдгөө нугалж биеэ шулуун доош буулга.", "Урд өсгийгөөр түлхэж бос."],
    mis: ["Бие урагш хазайх"], reg: "lunge_static_chair", pro: "lunge_reverse" });
  E("strength", { id: "step_up", name: "Гишгүүрт гарах", en: "Step-up", pat: "lunge", m: ["quads", "glutes"], eq: [], lv: 2, reps: 10, sets: 3, sides: "each", snack: true,
    cue: ["Шатны доод гишгүүр эсвэл тогтвортой тавцан ашигла.", "Урд хөлөөрөө бүрэн гишгэж бос, хойд хөлөөрөө түлхэхгүй.", "Удаан буу."],
    mis: ["Хойд хөлөөрөө үсэрч гарах"], reg: "lunge_static_chair", pro: "lunge_reverse" });
  E("strength", { id: "lunge_reverse", name: "Хойш алхалт", en: "Reverse lunge", pat: "lunge", m: ["quads", "glutes", "hams"], eq: [], lv: 2, reps: 10, sets: 3, sides: "each", c: ["knee"],
    cue: ["Нэг хөлөө хойш алхаж, хойд өвдгөө шал руу ойртуул.", "Цээж өргөөтэй, урд өвдөг шагайн дээр."],
    mis: ["Хойд өвдөг шалыг цохих"], reg: "lunge_split_static", pro: "lunge_forward" });
  E("strength", { id: "lunge_forward", name: "Урагш алхалт", en: "Forward lunge", pat: "lunge", m: ["quads", "glutes"], eq: [], lv: 3, reps: 10, sets: 3, sides: "each", c: ["knee"],
    cue: ["Урагш алхаж, хоёр өвдгөө 90 градус нугал.", "Урд өсгийгөөр түлхэж буцаж ир."],
    mis: ["Урд өвдөг хурууны үзүүрээс урагш гарах"], reg: "lunge_reverse", pro: "lunge_walking" });
  E("strength", { id: "lunge_lateral", name: "Хажуу тийш алхалт", en: "Lateral lunge", pat: "lunge", m: ["quads", "glutes", "adductors"], eq: [], lv: 2, reps: 8, sets: 3, sides: "each", c: ["knee"],
    cue: ["Нэг хөлөө хажуу тийш том алхаж, тэр хөлөндөө суу.", "Нөгөө хөлөө шулуун байлга, цээж урагш."],
    mis: ["Суусан өвдөг дотогшоо ойртох"], reg: "lunge_static_chair", pro: "lunge_curtsy" });
  E("strength", { id: "lunge_curtsy", name: "Мэхийх алхалт", en: "Curtsy lunge", pat: "lunge", m: ["glutes", "quads"], eq: [], lv: 3, reps: 10, sets: 3, sides: "each", c: ["knee"],
    cue: ["Нэг хөлөө нөгөөгийнхөө ард хөндлөн алхаж буу.", "Аарцаг урагш харсан хэвээр."],
    mis: ["Урд өвдөг хажуу тийш унах"], reg: "lunge_lateral", pro: "lunge_bulgarian" });
  E("strength", { id: "lunge_walking", name: "Алхаж суух", en: "Walking lunge", pat: "lunge", m: ["quads", "glutes"], eq: [], lv: 3, reps: 12, sets: 3, c: ["knee"],
    cue: ["Алхам бүрт хойд өвдгөө шал руу буулга.", "Бие шулуун, алхаа жигд."],
    mis: ["Алхам хэт богино болж өвдөг урагш гарах"], reg: "lunge_forward", pro: "lunge_bulgarian" });
  E("strength", { id: "lunge_bulgarian", name: "Болгар суулт", en: "Bulgarian split squat", pat: "lunge", m: ["quads", "glutes"], eq: ["chair"], lv: 4, reps: 8, sets: 3, rest: 60, sides: "each", c: ["knee"],
    cue: ["Хойд хөлийнхөө үзүүрийг сандал дээр тавь.", "Урд хөлөөрөө шулуун доош суу."],
    mis: ["Урд хөл сандалд хэт ойр"], reg: "lunge_split_static", pro: "lunge_db" });
  E("strength", { id: "lunge_db", name: "Дамббелтэй алхалт", en: "Dumbbell reverse lunge", pat: "lunge", m: ["quads", "glutes"], eq: ["db"], lv: 4, reps: 8, sets: 3, rest: 60, sides: "each", c: ["knee"],
    cue: ["Хоёр гартаа дамббел барьж хойш алх.", "Цээж өргөөтэй, жин хажуудаа унжсан."],
    mis: ["Урагш бөхийх"], reg: "lunge_reverse" });

  // --- Түлхэлт (push) ---
  E("strength", { id: "chest_squeeze_iso", name: "Алгаа шахах", en: "Isometric palm press", pat: "push", m: ["chest", "shoulders"], eq: [], lv: 1, sec: 15, sets: 3, rest: 30, snack: true,
    cue: ["Алгаа цээжнийхээ урд нийлүүлж чангаар шах.", "Амьсгалаа барилгүй жигд амьсгал."],
    mis: ["Мөр чихэнд хүрэх"], pro: "pushup_wall" });
  E("strength", { id: "pushup_wall", name: "Ханан дээрх шахалт", en: "Wall push-up", pat: "push", m: ["chest", "triceps", "shoulders"], eq: ["wall"], lv: 1, reps: 10, sets: 2, snack: true,
    cue: ["Ханаас нэг алхам зайтай зогсоод алгаа мөрний түвшинд тавь.", "Биеэ шулуун байлгаж цээжээ хана руу ойртуул.", "Түлхэж буцаж ир."],
    mis: ["Хонго хойш гарах"], reg: "chest_squeeze_iso", pro: "pushup_incline_chair" });
  E("strength", { id: "pushup_incline_chair", name: "Сандалд налсан шахалт", en: "Incline push-up", pat: "push", m: ["chest", "triceps", "shoulders"], eq: ["chair"], lv: 2, reps: 10, sets: 3, c: ["wrist"],
    cue: ["Сандлыг хананд налуулж, суудлыг нь гараараа барь.", "Толгойноос өсгий хүртэл шулуун шугам."],
    mis: ["Аарцаг унжих"], reg: "pushup_wall", pro: "pushup_knee" });
  E("strength", { id: "pushup_knee", name: "Өвдөглөсөн шахалт", en: "Knee push-up", pat: "push", m: ["chest", "triceps", "shoulders"], eq: ["mat"], lv: 2, pos: "kneeling", reps: 10, sets: 3, c: ["wrist"],
    cue: ["Өвдөг дээрээ зогсож гараа мөрнөөсөө арай өргөн тавь.", "Өвдөгнөөс толгой хүртэл шулуун, өгзгөө чангал.", "Цээжээ шалнаас 5 см хүртэл буулга."],
    mis: ["Хонго дээш гарч өгзөг өргөгдөх", "Тохой хажуу тийш хэт нээгдэх"], reg: "pushup_incline_chair", pro: "pushup_neg" });
  E("strength", { id: "pushup_neg", name: "Удаан буух шахалт", en: "Negative push-up", pat: "push", m: ["chest", "triceps", "shoulders", "core"], eq: ["mat"], lv: 3, pos: "prone", reps: 6, sets: 3, c: ["wrist", "pregnancy"],
    cue: ["Бүрэн планкаас дөрөв тоолж аажуу буу.", "Өвдөг дээрээ бууж босоод дахин эхэл."],
    mis: ["Хурдан унаж буух"], reg: "pushup_knee", pro: "pushup" });
  E("strength", { id: "pushup", name: "Шахалт", en: "Push-up", pat: "push", m: ["chest", "triceps", "shoulders", "core"], eq: ["mat"], lv: 3, pos: "prone", reps: 8, sets: 3, rest: 60, c: ["wrist", "pregnancy", "postpartum"], snack: true,
    cue: ["Гараа мөрний доор тавьж, биеэ нэг шулуун шугам болго.", "Тохойгоо 45 градус хойш нугалж цээжээ буулга.", "Өгзөг, гэдсээ чангалсан хэвээр."],
    mis: ["Нуруу хотойх", "Толгой доош унжих"], reg: "pushup_neg", pro: "pushup_diamond" });
  E("strength", { id: "pushup_diamond", name: "Нарийн гартай шахалт", en: "Diamond push-up", pat: "push", m: ["triceps", "chest"], eq: ["mat"], lv: 4, pos: "prone", reps: 8, sets: 3, rest: 60, c: ["wrist", "shoulder", "pregnancy", "postpartum"],
    cue: ["Эрхий, долоовор хуруугаа нийлүүлж гурвалжин үүсгэ.", "Тохой биедээ ойрхон."],
    mis: ["Тохой хажуу тийш нээгдэх"], reg: "pushup", pro: "pushup_decline" });
  E("strength", { id: "pushup_decline", name: "Хөл өндөрлөсөн шахалт", en: "Decline push-up", pat: "push", m: ["chest", "shoulders", "triceps"], eq: ["chair"], lv: 4, pos: "prone", reps: 8, sets: 3, rest: 60, c: ["wrist", "shoulder", "pregnancy", "postpartum"],
    cue: ["Хөлөө сандал дээр тавьж планк бай.", "Цээжээ шал руу буулгахдаа биеэ шулуун байлга."],
    mis: ["Нуруу хотойх"], reg: "pushup", pro: "pushup_archer" });
  E("strength", { id: "pushup_pike", name: "Пайк шахалт", en: "Pike push-up", pat: "push", m: ["shoulders", "triceps"], eq: ["mat"], lv: 4, pos: "prone", reps: 8, sets: 3, rest: 60, c: ["wrist", "shoulder", "pregnancy"],
    cue: ["Нохой доош байрлалаас толгойгоо гарынхаа урдах шал руу буулга.", "Хонго дээш, тохой хойш."],
    mis: ["Хонго буугаад планк болох"], reg: "pushup", pro: "pushup_archer" });
  E("strength", { id: "pushup_archer", name: "Нэг тал руу хазайсан шахалт", en: "Archer push-up", pat: "push", m: ["chest", "triceps", "shoulders"], eq: ["mat"], lv: 5, pos: "prone", reps: 6, sets: 3, rest: 90, sides: "each", c: ["wrist", "shoulder", "pregnancy", "postpartum"],
    cue: ["Гараа өргөн тавьж, нэг гар руугаа буу, нөгөө гар шулуун үлдэнэ.", "Бие шулуун."],
    mis: ["Аарцаг эргэх"], reg: "pushup_decline" });
  E("strength", { id: "db_floor_press", name: "Шалан дээр дамббел шахах", en: "Dumbbell floor press", pat: "push", m: ["chest", "triceps"], eq: ["db", "mat"], lv: 2, pos: "supine", reps: 10, sets: 3, rest: 60, c: ["pregnancy"],
    cue: ["Нуруугаар хэвтэж тохойгоо шалан дээр 45 градус тавь.", "Дамббелийг цээжний дээр шулуун шахаж, тохой шалд хүртэл буулга."],
    mis: ["Тохой хажуу тийш хэт нээгдэх"], reg: "pushup_wall", pro: "db_overhead_press" });
  E("strength", { id: "band_chest_press", name: "Резинэн цээжний шахалт", en: "Band chest press", pat: "push", m: ["chest", "triceps"], eq: ["band"], lv: 2, reps: 12, sets: 3,
    cue: ["Резинийг далныхаа ард өнгөрүүлж хоёр үзүүрийг атга.", "Урагш шулуун шахаад аажуу буцаа."],
    mis: ["Мөр чихэнд хүрэх"], reg: "pushup_wall", pro: "band_overhead_press" });
  E("strength", { id: "db_overhead_press", name: "Дамббел дээш шахах", en: "Dumbbell overhead press", pat: "push", m: ["shoulders", "triceps"], eq: ["db"], lv: 3, reps: 10, sets: 3, rest: 60, c: ["shoulder"],
    cue: ["Дамббелийг мөрний түвшинд барь.", "Хавиргаа доош, гэдсээ чангалж толгойн дээр шулуун шах."],
    mis: ["Нуруу хотойж гэдийх"], reg: "band_overhead_press" });
  E("strength", { id: "band_overhead_press", name: "Резинийг дээш шахах", en: "Band overhead press", pat: "push", m: ["shoulders", "triceps"], eq: ["band"], lv: 3, reps: 12, sets: 3, c: ["shoulder"],
    cue: ["Резин дээр зогсож хоёр үзүүрийг мөрний түвшинд барь.", "Толгойн дээр шахаад аажуу буулга."],
    mis: ["Нуруу гэдийх"], reg: "band_chest_press", pro: "db_overhead_press" });
  E("strength", { id: "chair_dip", name: "Сандалд трицепс шахалт", en: "Chair dip", pat: "push", m: ["triceps", "shoulders"], eq: ["chair"], lv: 3, reps: 10, sets: 3, c: ["shoulder", "wrist"],
    cue: ["Сандлыг хананд налуулж, суудлын захыг гараараа барь.", "Тохойгоо хойш нугалж өгзгөө буулгаад түлхэж бос.", "Мөрөө доош, чихнээс хол."],
    mis: ["Хэт гүн буух", "Мөр урагш эргэх"], reg: "pushup_incline_chair", pro: "db_triceps_ext" });
  E("strength", { id: "db_triceps_ext", name: "Дамббел толгойн ард", en: "Overhead triceps extension", pat: "push", m: ["triceps"], eq: ["db"], lv: 3, reps: 12, sets: 3, c: ["shoulder"],
    cue: ["Нэг дамббелийг хоёр гараараа толгойн дээр барь.", "Тохойгоо чихнийхээ дэргэд байлгаж ард руу буулгаад сунга."],
    mis: ["Тохой хажуу тийш нээгдэх"], reg: "chair_dip" });

  // --- Татлага (pull) ---
  E("strength", { id: "scap_squeeze", name: "Дал хавчих", en: "Scapular squeeze", pat: "pull", m: ["back", "shoulders"], eq: [], lv: 1, sec: 5, reps: 10, sets: 2, rest: 30, snack: true,
    cue: ["Гараа хажуудаа унжуулж, хоёр далаа хооронд нь хавчиж 5 секунд барь.", "Мөр доош, чихнээс хол."],
    mis: ["Мөрөө дээш өргөх"], pro: "prone_t" });
  E("strength", { id: "towel_iso_row", name: "Алчуур татах", en: "Towel isometric row", pat: "pull", m: ["back", "biceps"], eq: [], lv: 1, sec: 10, sets: 3, rest: 30, snack: true,
    cue: ["Алчуурын хоёр үзүүрийг цээжнийхээ урд барь.", "Хоёр тийш татангаа тохойгоо хойш, далаа хавчиж барь."],
    mis: ["Амьсгалаа барих"], pro: "band_row" });
  E("strength", { id: "wall_slide", name: "Ханан дээрх гар гулсалт", en: "Wall slide", pat: "pull", m: ["shoulders", "back"], eq: ["wall"], lv: 1, reps: 10, sets: 2, snack: true,
    cue: ["Нуруу, тохой, бугуйгаа хананд наа.", "Гараа ханаар дээш гулсуулаад буцаа.", "Хавирга хананаас хөндийрөхгүй."],
    mis: ["Нуруу хотойж хананаас салах"], pro: "prone_y" });
  E("strength", { id: "prone_t", name: "Хэвтээд Т өргөлт", en: "Prone T raise", pat: "pull", m: ["back", "shoulders"], eq: ["mat"], lv: 1, pos: "prone", reps: 10, sets: 2, c: ["pregnancy"],
    cue: ["Гэдсээр хэвтэж гараа хоёр тийш Т үсэг мэт сунга.", "Эрхий хуруу дээшээ, далаа хавчиж гараа өргө."],
    mis: ["Толгойгоо дээш гэдийлгэх"], pro: "prone_y" });
  E("strength", { id: "prone_y", name: "Хэвтээд Y өргөлт", en: "Prone Y raise", pat: "pull", m: ["back", "shoulders"], eq: ["mat"], lv: 1, pos: "prone", reps: 10, sets: 2, c: ["pregnancy", "shoulder"],
    cue: ["Гараа Y үсэг мэт урагш дэлгэ.", "Эрхий хуруу дээш, далаа доош татангаа гараа өргө."],
    mis: ["Мөр чих рүү өргөгдөх"], reg: "prone_t", pro: "prone_w" });
  E("strength", { id: "prone_w", name: "Хэвтээд W өргөлт", en: "Prone W raise", pat: "pull", m: ["back", "shoulders"], eq: ["mat"], lv: 1, pos: "prone", reps: 10, sets: 2, c: ["pregnancy"],
    cue: ["Тохойгоо нугалж W үсэг үүсгэ.", "Тохой, гараа хамт өргөнгөө далаа хавч."],
    mis: ["Нуруугаар гэдийх"], reg: "prone_t", pro: "superman_alt" });
  E("strength", { id: "superman_alt", name: "Хөл гараа ээлжлэн өргөх", en: "Alternating superman", pat: "pull", m: ["back", "glutes"], eq: ["mat"], lv: 1, pos: "prone", reps: 10, sets: 2, sides: "each", c: ["pregnancy"],
    cue: ["Гэдсээр хэвтэж баруун гар, зүүн хөлөө зэрэг өргө.", "Харц шал руу, хүзүү урт."],
    mis: ["Толгой гэдийх"], pro: "superman" });
  E("strength", { id: "superman", name: "Супермэн", en: "Superman", pat: "pull", m: ["back", "glutes"], eq: ["mat"], lv: 2, pos: "prone", sec: 5, reps: 8, sets: 2, c: ["pregnancy", "lowback"],
    cue: ["Хоёр гар, хоёр хөлөө зэрэг шалнаас өргөөд 5 секунд барь.", "Хүзүү нуруутайгаа нэг шугамд."],
    mis: ["Хэт өндөр гэдийх"], reg: "superman_alt", pro: "yoga_locust" });
  E("strength", { id: "band_pull_apart", name: "Резин салгах", en: "Band pull-apart", pat: "pull", m: ["back", "shoulders"], eq: ["band"], lv: 1, reps: 15, sets: 2, snack: true,
    cue: ["Резинийг гараа шулуун урагш сунгаж мөрний өргөнтэй барь.", "Далаа хавчиж цээж хүртэл хоёр тийш татаад аажуу буцаа."],
    mis: ["Мөр дээш өргөгдөх"], pro: "band_row" });
  E("strength", { id: "band_row", name: "Резинэн татлага", en: "Band row", pat: "pull", m: ["back", "biceps"], eq: ["band"], lv: 1, pos: "seated", reps: 12, sets: 3, snack: true,
    cue: ["Шалан дээр хөлөө сунгаж суугаад резинийг улан дээгүүрээ өнгөрүүл.", "Тохойгоо хойш татаж далаа хавч.", "Нуруу шулуун, мөр доош."],
    mis: ["Нуруугаар хойш хазайх"], reg: "towel_iso_row", pro: "db_row_chair" });
  E("strength", { id: "band_pulldown", name: "Резинийг дээрээс татах", en: "Band overhead pulldown", pat: "pull", m: ["back", "shoulders"], eq: ["band"], lv: 2, reps: 12, sets: 3, c: ["shoulder"],
    cue: ["Резинийг толгойн дээр хоёр гараараа чангалж барь.", "Тохойгоо доош, хажуу тийш татаж резинийг цээжний ар руу буулга."],
    mis: ["Нуруу хотойх"], reg: "band_pull_apart", pro: "db_bent_row" });
  E("strength", { id: "band_reverse_fly", name: "Бөхийж резин дэлгэх", en: "Band reverse fly", pat: "pull", m: ["back", "shoulders"], eq: ["band"], lv: 2, reps: 12, sets: 3,
    cue: ["Резин дээр зогсож бөхийгөөд хоёр үзүүрийг зөрүүлж барь.", "Гараа хоёр тийш дэлгэж далаа хавч."],
    mis: ["Нуруу бөгтийх"], reg: "band_pull_apart", pro: "db_reverse_fly" });
  E("strength", { id: "db_row_chair", name: "Нэг гарын дамббел татлага", en: "Single-arm dumbbell row", pat: "pull", m: ["back", "biceps"], eq: ["db", "chair"], lv: 2, reps: 10, sets: 3, rest: 60, sides: "each",
    cue: ["Нэг гар, нэг өвдгөөрөө сандалд түшиж нуруугаа шулуун байлга.", "Тохойгоо хонго руугаа татаж далаа хавч."],
    mis: ["Биеэ эргүүлж татах"], reg: "band_row", pro: "db_bent_row" });
  E("strength", { id: "db_bent_row", name: "Бөхийж дамббел татах", en: "Bent-over dumbbell row", pat: "pull", m: ["back", "biceps"], eq: ["db"], lv: 3, reps: 10, sets: 3, rest: 60, c: ["lowback"],
    cue: ["Хонгоо хойш татаж 45 градус бөхий.", "Хоёр дамббелийг хонго руугаа татаж далаа хавч."],
    mis: ["Нуруу бөгтийх"], reg: "db_row_chair" });
  E("strength", { id: "db_reverse_fly", name: "Бөхийж дамббел дэлгэх", en: "Dumbbell reverse fly", pat: "pull", m: ["back", "shoulders"], eq: ["db"], lv: 3, reps: 12, sets: 3,
    cue: ["Бөхийгөөд дамббелийг хоёр тийш далавч мэт дэлгэ.", "Тохой бага нугалаатай, мөр доош."],
    mis: ["Хэт хүнд жин авч савлах"], reg: "band_reverse_fly" });
  E("strength", { id: "band_curl", name: "Резинэн бицепс", en: "Band biceps curl", pat: "pull", m: ["biceps"], eq: ["band"], lv: 2, reps: 12, sets: 3,
    cue: ["Резин дээр зогсож тохойгоо биедээ наа.", "Гараа мөр рүүгээ нугалаад аажуу буулга."],
    mis: ["Тохой урагш гарах"], pro: "db_curl" });
  E("strength", { id: "db_curl", name: "Дамббел бицепс", en: "Dumbbell curl", pat: "pull", m: ["biceps"], eq: ["db"], lv: 2, reps: 10, sets: 3,
    cue: ["Тохой хажуудаа тогтмол, зөвхөн шуу хөдөлнө.", "Буулгахдаа гурав тоол."],
    mis: ["Биеэрээ савлах"], reg: "band_curl" });

  // --- Их бие (core) ---
  E("strength", { id: "mcgill_curlup", name: "Макгиллийн муруйлт", en: "McGill curl-up", pat: "core", m: ["core"], eq: ["mat"], lv: 1, pos: "supine", sec: 8, reps: 6, sets: 2, rest: 30, c: ["pregnancy"], snack: true,
    cue: ["Нэг хөлөө нугалж, гараа нурууныхаа хонхорт тавь.", "Толгой, мөрөө шалнаас 2–3 см л өргөөд 8 секунд барь.", "Хүзүү урт, эрүү татахгүй."],
    mis: ["Толгойгоо дээш хэт өргөж хүзүүгээр татах"], pro: "plank_knees" });
  E("strength", { id: "bird_dog", name: "Шувуу–нохой", en: "Bird dog", pat: "core", m: ["core", "back", "glutes"], eq: ["mat"], lv: 1, pos: "kneeling", sec: 5, reps: 6, sets: 2, rest: 30, sides: "each", c: ["wrist"], snack: true,
    cue: ["Дөрвөн мөчөөрөө зогсож нуруугаа тэгш ширээ мэт байлга.", "Эсрэг гар, хөлөө сунгаад 5 секунд барь.", "Аарцаг хөдөлж эргэхгүй."],
    mis: ["Хөлөө хэт өндөр өргөж нуруу хотойх"], pro: "bird_dog_hold" });
  E("strength", { id: "bird_dog_hold", name: "Шувуу–нохой урт барих", en: "Bird dog hold", pat: "core", m: ["core", "back", "glutes"], eq: ["mat"], lv: 2, pos: "kneeling", sec: 20, sets: 2, sides: "each", c: ["wrist"],
    cue: ["Сунгасан гар, хөлөө 20 секунд хөдөлгөөнгүй барь.", "Усны аяга нуруун дээр чинь тогтож байгаа мэт."],
    mis: ["Аарцаг хажуу тийш хазайх"], reg: "bird_dog", pro: "plank" });
  E("strength", { id: "side_plank_knees", name: "Өвдөглөсөн хажуу планк", en: "Side plank (knees)", pat: "core", m: ["core", "glutes"], eq: ["mat"], lv: 1, pos: "side", sec: 15, sets: 2, rest: 30, sides: "each", c: ["shoulder"],
    cue: ["Хажуугаар хэвтэж тохойгоо мөрний яг доор тавь.", "Өвдгөө нугалаастай хонгоо шалнаас өргө.", "Бие нэг шулуун шугам."],
    mis: ["Хонго хойш унжих"], pro: "side_plank" });
  E("strength", { id: "side_plank", name: "Хажуу планк", en: "Side plank", pat: "core", m: ["core", "glutes"], eq: ["mat"], lv: 3, pos: "side", sec: 25, sets: 2, sides: "each", c: ["shoulder"],
    cue: ["Хөлөө сунгаж тохой, хөл дээрээ тулж хонгоо өргө.", "Дээд гараа тэнгэр рүү."],
    mis: ["Хонго доош унах", "Мөр чих рүү"], reg: "side_plank_knees", pro: "side_plank_hip_dip" });
  E("strength", { id: "side_plank_hip_dip", name: "Хажуу планк хонго буулгах", en: "Side plank hip dip", pat: "core", m: ["core"], eq: ["mat"], lv: 4, pos: "side", reps: 10, sets: 2, sides: "each", c: ["shoulder"],
    cue: ["Хажуу планкаас хонгоо шал руу буулгаад буцаан өргө.", "Мөр тохойн яг дээр, бие урагш эргэхгүй."],
    mis: ["Хурдан савлах"], reg: "side_plank" });
  E("strength", { id: "plank_knees", name: "Өвдөглөсөн планк", en: "Knee plank", pat: "core", m: ["core"], eq: ["mat"], lv: 1, pos: "kneeling", sec: 20, sets: 2, rest: 30, snack: true,
    cue: ["Тохой мөрний доор, өвдөг шалан дээр.", "Өвдөгнөөс толгой хүртэл шулуун шугам, өгзгөө чангал."],
    mis: ["Өгзөг дээш гарах"], reg: "mcgill_curlup", pro: "plank" });
  E("strength", { id: "plank", name: "Планк", en: "Forearm plank", pat: "core", m: ["core", "shoulders"], eq: ["mat"], lv: 2, pos: "prone", sec: 30, sets: 2, c: ["pregnancy", "postpartum"], snack: true,
    cue: ["Тохой мөрний доор, хөлийн хуруун дээр тул.", "Өгзөг, гэдсээ чангалж биеэ шулуун байлга.", "Жигд амьсгал."],
    mis: ["Нуруу хотойж аарцаг унжих", "Өгзөг дээш гарах"], reg: "plank_knees", pro: "plank_hands" });
  E("strength", { id: "plank_hands", name: "Гар дээрх планк", en: "High plank", pat: "core", m: ["core", "shoulders"], eq: ["mat"], lv: 2, pos: "prone", sec: 30, sets: 2, c: ["wrist", "pregnancy", "postpartum"],
    cue: ["Гараа мөрний яг доор тавь.", "Шалыг гараараа түлхэж далны хоорондох зайг нээ."],
    mis: ["Мөр чих рүү"], reg: "plank", pro: "plank_shoulder_tap" });
  E("strength", { id: "plank_shoulder_tap", name: "Планк мөр тогшилт", en: "Plank shoulder tap", pat: "core", m: ["core", "shoulders"], eq: ["mat"], lv: 3, pos: "prone", reps: 12, sets: 3, c: ["wrist", "pregnancy", "postpartum"],
    cue: ["Гар дээрх планкаас нэг гараараа эсрэг мөрөө хүр.", "Хонго хөдөлгөхгүй, хөлөө өргөн тавь."],
    mis: ["Хонго хажуу тийш найгах"], reg: "plank_hands", pro: "plank_up_down" });
  E("strength", { id: "plank_up_down", name: "Планк дээш доош", en: "Up-down plank", pat: "core", m: ["core", "shoulders", "triceps"], eq: ["mat"], lv: 3, pos: "prone", reps: 8, sets: 3, c: ["wrist", "shoulder", "pregnancy", "postpartum"],
    cue: ["Тохойн планкаас гар дээр гараад буцаж тохой дээр буу.", "Гар эхлэх дараалал бүр ээлжлэх."],
    mis: ["Хонго найгах"], reg: "plank_shoulder_tap", pro: "mountain_climber_slow" });
  E("strength", { id: "mountain_climber_slow", name: "Удаан уулчин", en: "Slow mountain climber", pat: "core", m: ["core", "hipflex", "shoulders"], eq: ["mat"], lv: 3, pos: "prone", reps: 16, sets: 3, imp: 1, c: ["wrist", "pregnancy", "postpartum"],
    cue: ["Гар дээрх планкаас өвдгөө ээлжлэн цээж рүүгээ татаж аваач.", "Хурдлахгүй, хонго өргөгдөхгүй."],
    mis: ["Өгзөг дээш гарах"], reg: "plank_up_down" });
  E("strength", { id: "bear_hold", name: "Баавгайн байрлал барих", en: "Bear hold", pat: "core", m: ["core", "quads", "shoulders"], eq: ["mat"], lv: 3, pos: "kneeling", sec: 20, sets: 3, c: ["wrist", "knee"],
    cue: ["Дөрвөн мөчөөрөө зогсоод өвдгөө шалнаас 3 см өргө.", "Нуруу тэгш, харц шал руу."],
    mis: ["Өгзөг дээш гарах"], reg: "bird_dog_hold" });
  E("strength", { id: "leg_lower", name: "Хөл буулгах", en: "Leg lowers", pat: "core", m: ["core", "hipflex"], eq: ["mat"], lv: 2, pos: "supine", reps: 10, sets: 2, c: ["pregnancy", "lowback", "postpartum"],
    cue: ["Нуруугаар хэвтэж хоёр хөлөө дээш сунга.", "Нурууны хонхорхойг шалан дээр дарангаа хөлөө аажуу буулга, хонхор хөндийрмөгц буцаа."],
    mis: ["Нуруу шалнаас салах"], reg: "mcgill_curlup", pro: "hollow_hold" });
  E("strength", { id: "hollow_hold", name: "Холлоу барих", en: "Hollow body hold", pat: "core", m: ["core"], eq: ["mat"], lv: 3, pos: "supine", sec: 20, sets: 3, c: ["pregnancy", "lowback", "neck", "postpartum"],
    cue: ["Нуруугаа шалан дээр дарж, мөр, хөлөө бага өргө.", "Гараа чихнийхээ дэргэд сунга, хонхор шалнаас салахгүй."],
    mis: ["Нуруу хотойх"], reg: "leg_lower" });
  E("strength", { id: "crunch", name: "Кранч", en: "Crunch", pat: "core", m: ["core"], eq: ["mat"], lv: 2, pos: "supine", reps: 15, sets: 2, c: ["pregnancy", "lowback", "neck", "postpartum"],
    cue: ["Өвдгөө нугалж, гараа цээжин дээрээ зөрүүл.", "Далаа шалнаас өргөхөд л хангалттай, амьсгалаа гарга."],
    mis: ["Хүзүүгээр татах"], reg: "mcgill_curlup", pro: "bicycle_crunch" });
  E("strength", { id: "sit_up", name: "Пресс босох", en: "Sit-up", pat: "core", m: ["core", "hipflex"], eq: ["mat"], lv: 3, pos: "supine", reps: 12, sets: 3, c: ["pregnancy", "lowback", "neck", "postpartum"],
    cue: ["Өвдгөө нугалж, нуруугаа нэг нугаламаар ээлжлэн босго.", "Хурдлахгүй, доош буухдаа удаан."],
    mis: ["Савлаж босох", "Хөлөө түших"], reg: "crunch" });
  E("strength", { id: "bicycle_crunch", name: "Дугуй кранч", en: "Bicycle crunch", pat: "rotation", m: ["core"], eq: ["mat"], lv: 3, pos: "supine", reps: 16, sets: 3, c: ["pregnancy", "lowback", "neck", "postpartum"],
    cue: ["Тохойгоо эсрэг өвдөг рүүгээ эргүүлж аваач.", "Удаан, хяналттай, нуруу шалан дээр."],
    mis: ["Хүзүүгээр татах"], reg: "crunch", pro: "russian_twist" });

  // --- Эргэлт (rotation) ---
  E("strength", { id: "standing_knee_elbow", name: "Зогсоод өвдөг тохой нийлүүлэх", en: "Standing knee to elbow", pat: "rotation", m: ["core", "hipflex"], eq: [], lv: 1, reps: 12, sets: 2, sides: "each", snack: true,
    cue: ["Гараа толгойны ард тавьж, өвдөг тохой хоёрыг эсрэг талаар нь нийлүүл.", "Бие шулуун, удаан."],
    mis: ["Урагш бөхийх"], pro: "woodchop_bw" });
  E("strength", { id: "standing_side_bend", name: "Хажуу тийш бөхийх", en: "Standing side bend", pat: "rotation", m: ["core"], eq: [], lv: 1, reps: 10, sets: 2, sides: "each", snack: true,
    cue: ["Нэг гараа дээш сунгаад нөгөө тал руугаа аажуу бөхий.", "Аарцаг хөдлөхгүй, урагш хазайхгүй."],
    mis: ["Урагш бөхийх"], pro: "suitcase_carry_home" });
  E("strength", { id: "woodchop_bw", name: "Мод цавчих хөдөлгөөн", en: "Bodyweight woodchop", pat: "rotation", m: ["core", "shoulders"], eq: [], lv: 1, reps: 10, sets: 2, sides: "each",
    cue: ["Гараа нийлүүлж нэг мөрний дээрээс эсрэг өвдөг рүү ташуу буулга.", "Хөлөө бага нугалж, хонгоороо эргэ."],
    mis: ["Зөвхөн гараар савлах"], pro: "woodchop_band" });
  E("strength", { id: "woodchop_band", name: "Резинтэй мод цавчих", en: "Band woodchop", pat: "rotation", m: ["core", "shoulders"], eq: ["band"], lv: 2, reps: 10, sets: 3, sides: "each",
    cue: ["Резинийг нэг хөлөөрөө гишгэж хоёр гараараа барь.", "Эсрэг мөр рүү ташуу татаж бие эргэ."],
    mis: ["Нуруу бөхийх"], reg: "woodchop_bw", pro: "pallof_press" });
  E("strength", { id: "pallof_press", name: "Паллоф шахалт", en: "Pallof press", pat: "rotation", m: ["core"], eq: ["band"], lv: 2, reps: 10, sets: 3, sides: "each",
    cue: ["Резинийг тогтвортой зүйлд цээжний түвшинд бэхлэ.", "Хажуу тийш зогсоод гараа урагш шулуун сунгаж, эргүүлэх хүчийг тэсвэрлэ."],
    mis: ["Бие резин рүү эргэх"], reg: "woodchop_band", pro: "russian_twist" });
  E("strength", { id: "russian_twist", name: "Орос эргэлт", en: "Russian twist", pat: "rotation", m: ["core"], eq: ["mat"], lv: 3, pos: "seated", reps: 16, sets: 3, c: ["lowback", "pregnancy", "postpartum"],
    cue: ["Сууж хойш бага хазайгаад гараа цээжин дээрээ нийлүүл.", "Цээжээ хоёр тийш ээлжлэн эргүүл, хөл шалан дээр."],
    mis: ["Нуруу бөгтийх"], reg: "pallof_press" });

  // --- Зөөлт (carry) ---
  E("strength", { id: "farmer_carry_home", name: "Хоёр гарт сав зөөх", en: "Farmer carry (household weights)", pat: "carry", m: ["fullbody", "core"], eq: [], lv: 1, sec: 30, sets: 3, snack: true,
    cue: ["Хоёр гартаа ижил хүнд зүйл (усны сав, уут) барь.", "Мөр хойш доош, цээж өргөөтэй, жигд алх."],
    mis: ["Мөр урагш унжих"], pro: "farmer_carry_db" });
  E("strength", { id: "suitcase_carry_home", name: "Нэг гарт сав зөөх", en: "Suitcase carry (household)", pat: "carry", m: ["core", "fullbody"], eq: [], lv: 2, sec: 30, sets: 2, sides: "each",
    cue: ["Нэг гартаа хүнд зүйл барьж шулуун зогс.", "Жинтэй тал руу хазайхгүй алх."],
    mis: ["Бие жин рүү хазайх"], reg: "farmer_carry_home", pro: "suitcase_carry_db" });
  E("strength", { id: "farmer_carry_db", name: "Фермерийн зөөлт", en: "Farmer carry", pat: "carry", m: ["fullbody", "core"], eq: ["db"], lv: 2, sec: 40, sets: 3,
    cue: ["Хоёр дамббел барьж жигд богино алхмаар яв.", "Цээж өргөөтэй, харц урагш."],
    mis: ["Хурдлаж найгах"], reg: "farmer_carry_home", pro: "suitcase_carry_db" });
  E("strength", { id: "suitcase_carry_db", name: "Нэг гарын зөөлт", en: "Suitcase carry", pat: "carry", m: ["core", "fullbody"], eq: ["db"], lv: 3, sec: 40, sets: 2, sides: "each",
    cue: ["Нэг дамббел барьж, нөгөө талын хажуугийн булчингаа чангал.", "Мөр тэгш."],
    mis: ["Хазайх"], reg: "farmer_carry_db", pro: "kb_rack_carry" });
  E("strength", { id: "kb_rack_carry", name: "Гирийг цээжинд барьж зөөх", en: "Kettlebell rack carry", pat: "carry", m: ["core", "shoulders"], eq: ["kb"], lv: 3, sec: 40, sets: 2, sides: "each",
    cue: ["Гирийг нэг гартаа цээж, шууныхаа хооронд тогтоо.", "Хавирга доош, шулуун алх."],
    mis: ["Хойш гэдийх"], reg: "suitcase_carry_db", pro: "overhead_carry_db" });
  E("strength", { id: "overhead_carry_db", name: "Дээш өргөж зөөх", en: "Overhead carry", pat: "carry", m: ["shoulders", "core"], eq: ["db"], lv: 4, sec: 30, sets: 2, sides: "each", c: ["shoulder"],
    cue: ["Нэг дамббелийг толгойн дээр шулуун барьж алх.", "Хавирга доош, гар чихний дэргэд."],
    mis: ["Нуруу гэдийх"], reg: "kb_rack_carry" });

  // --- Тэнцвэр, явдал (balance, gait) ---
  E("strength", { id: "weight_shift", name: "Жингээ хоёр тийш шилжүүлэх", en: "Weight shift", pat: "balance", m: ["glutes", "calves"], eq: [], lv: 1, reps: 10, sets: 2, snack: true,
    cue: ["Хөлөө мөрний өргөнтэй тавьж жингээ нэг хөлөөс нөгөөд аажуу шилжүүл.", "Хэрэгтэй бол ханыг хуруугаар түш."],
    mis: ["Хурдлан найгах"], pro: "single_leg_stance_chair" });
  E("strength", { id: "single_leg_stance_chair", name: "Нэг хөл дээр зогсох (сандал түшиж)", en: "Single-leg stance (chair)", pat: "balance", m: ["glutes", "calves"], eq: ["chair"], lv: 1, sec: 15, sets: 2, rest: 15, sides: "each", snack: true,
    cue: ["Сандлын түшлэгийг нэг гараараа барь.", "Нэг хөлөө шалнаас өргөөд харцаа нэг цэгт тогтоо."],
    mis: ["Түшлэгийг хэт чанга атгах"], reg: "weight_shift", pro: "single_leg_stance" });
  E("strength", { id: "single_leg_stance", name: "Нэг хөл дээр зогсох", en: "Single-leg stance", pat: "balance", m: ["glutes", "calves", "core"], eq: [], lv: 2, sec: 20, sets: 2, rest: 15, sides: "each", snack: true,
    cue: ["Нэг хөлөө өргөж, тулсан хөлийнхөө улаар шалыг атга.", "Харц урдах нэг цэгт.", "Шүд угаахдаа хийж болно."],
    mis: ["Аарцаг хажуу тийш унах"], reg: "single_leg_stance_chair", pro: "stance_eyes_closed" });
  E("strength", { id: "tandem_stance_chair", name: "Өсгий хуруу зэрэгцүүлж зогсох (сандал)", en: "Tandem stance (chair)", pat: "balance", m: ["calves", "glutes"], eq: ["chair"], lv: 1, sec: 15, sets: 2, rest: 15, sides: "each",
    cue: ["Нэг хөлийн өсгийг нөгөө хөлийн хурууны урд шууд тавь.", "Сандлыг зөөлөн түш."],
    mis: ["Хөлийг зөрүүлэлгүй хажуу тавих"], reg: "weight_shift", pro: "tandem_stance" });
  E("strength", { id: "tandem_stance", name: "Өсгий хуруу зэрэгцүүлж зогсох", en: "Tandem stance", pat: "balance", m: ["calves", "glutes"], eq: [], lv: 2, sec: 20, sets: 2, rest: 15, sides: "each",
    cue: ["Хөлөө нэг шугам дээр урд хойно тавь.", "Гараа хажуудаа, харц урагш."],
    mis: ["Доош шал руу харах"], reg: "tandem_stance_chair", pro: "tandem_walk" });
  E("strength", { id: "tandem_walk", name: "Шугамаар алхах", en: "Tandem walk", pat: "gait", m: ["calves", "glutes", "core"], eq: [], lv: 2, reps: 10, sets: 2, rest: 15,
    cue: ["Өсгийгөө нөгөө хөлийн хурууны урд тавьж шулуун шугамаар алх.", "Хана дэргэдээ байлга."],
    mis: ["Хурдлах"], reg: "tandem_stance", pro: "heel_toe_walk" });
  E("strength", { id: "heel_toe_walk", name: "Өсгий, хуруугаар алхах", en: "Heel and toe walk", pat: "gait", m: ["calves"], eq: [], lv: 2, reps: 10, sets: 2, rest: 15,
    cue: ["10 алхам өсгий дээрээ, 10 алхам хөлийн үзүүрээр алх.", "Цээж өргөөтэй."],
    mis: ["Урагш бөхийх"], reg: "tandem_walk", pro: "clock_reach" });
  E("strength", { id: "side_step", name: "Хажуу тийш алхах", en: "Side step", pat: "gait", m: ["glutes", "adductors"], eq: [], lv: 1, reps: 10, sets: 2, rest: 15, sides: "each", snack: true,
    cue: ["Нэг хөлөө хажуу тийш алхаад нөгөөг нь дагуул.", "Өвдөг бага нугалаатай, хөлийн хуруу урагш."],
    mis: ["Хөл хоёр зөрөх"], pro: "tandem_walk" });
  E("strength", { id: "seated_march", name: "Сандалд суугаад алхах", en: "Seated march", pat: "gait", m: ["hipflex", "core"], eq: ["chair"], lv: 1, pos: "seated", reps: 20, sets: 2, rest: 15, snack: true,
    cue: ["Сандлын захад сууж нуруугаа шулуун байлга.", "Өвдгөө ээлжлэн өргөж гараа дагуулан савла."],
    mis: ["Түшлэгт налах"], pro: "march_in_place" });
  E("strength", { id: "heel_raise_chair", name: "Өсгий өргөх (сандал түшиж)", en: "Heel raise (chair)", pat: "balance", m: ["calves"], eq: ["chair"], lv: 1, reps: 12, sets: 2, snack: true,
    cue: ["Сандлын түшлэгийг барьж өсгийгөө аажуу өргө.", "Дээд цэгт нэг секунд зогсоод буу."],
    mis: ["Шагай гадагш эргэх"], pro: "calf_raise" });
  E("strength", { id: "calf_raise", name: "Өсгий өргөх", en: "Calf raise", pat: "balance", m: ["calves"], eq: [], lv: 2, reps: 15, sets: 3, snack: true,
    cue: ["Хоёр хөлөөрөө зогсож өсгийгөө аль болох өндөр өргө.", "Гурав тоолж буу."],
    mis: ["Хурдан савлах"], reg: "heel_raise_chair", pro: "calf_raise_single" });
  E("strength", { id: "calf_raise_single", name: "Нэг хөлний өсгий өргөлт", en: "Single-leg calf raise", pat: "balance", m: ["calves"], eq: ["wall"], lv: 3, reps: 12, sets: 3, sides: "each",
    cue: ["Ханыг хуруугаар түшиж нэг хөл дээр өсгийгөө өргө.", "Удаан буу."],
    mis: ["Хана руу жингээ тавих"], reg: "calf_raise" });
  E("strength", { id: "stance_eyes_closed", name: "Нүдээ аниад зогсох", en: "Eyes-closed stance", pat: "balance", m: ["calves", "glutes", "core"], eq: [], lv: 3, sec: 20, sets: 2, rest: 15,
    cue: ["Хөлөө нийлүүлж нүдээ аниад зогс.", "Хана дэргэд байх."],
    mis: ["Хөлөө хэт өргөн тавих"], reg: "single_leg_stance", pro: "stance_head_turn" });
  E("strength", { id: "stance_head_turn", name: "Нэг хөл дээр толгой эргүүлэх", en: "Single-leg stance with head turns", pat: "balance", m: ["calves", "glutes", "core"], eq: [], lv: 3, reps: 8, sets: 2, rest: 15, sides: "each",
    cue: ["Нэг хөл дээр зогсоод толгойгоо аажуу баруун, зүүн тийш эргүүл.", "Хана дэргэд, тулсан хөлийн улаар шалыг атга."],
    mis: ["Толгойтойгоо хамт бие эргэх"], reg: "stance_eyes_closed", pro: "clock_reach" });
  E("strength", { id: "clock_reach", name: "Цагны зүү хүрэлт", en: "Single-leg clock reach", pat: "balance", m: ["glutes", "core", "calves"], eq: [], lv: 3, reps: 6, sets: 2, rest: 30, sides: "each",
    cue: ["Нэг хөл дээр зогсож нөгөө хөлөө 12, 3, 6, 9 цагийн чигт хүргэ.", "Тулсан өвдөг бага нугалаатай."],
    mis: ["Бие хэт хазайх"], reg: "stance_head_turn" });

  /* ============================ ЙОГА ============================ */
  // --- Зогсоо позууд ---
  E("yoga", { id: "yoga_tadasana", name: "Уулын поз", en: "Mountain pose", pat: "balance", m: ["fullbody"], eq: [], lv: 1, br: 5, snack: true,
    y: { s: "Tadasana", f: "standing", next: ["yoga_urdhva_hastasana", "yoga_forward_fold", "yoga_tree", "yoga_utkatasana"], counter: [] },
    cue: ["Хөлөө нийлүүлж, улаараа шалыг тэгш дар.", "Оройгоороо дээш сунаж, мөрөө доош тавь.", "Хамраар жигд амьсгал."],
    mis: ["Өвдөг хойш түгжих"] });
  E("yoga", { id: "yoga_urdhva_hastasana", name: "Гараа дээш өргөх", en: "Upward salute", pat: "core", m: ["shoulders", "spine"], eq: [], lv: 1, br: 5, c: ["shoulder"],
    y: { s: "Urdhva Hastasana", f: "standing", next: ["yoga_forward_fold", "yoga_standing_side_bend", "yoga_utkatasana"], counter: ["yoga_forward_fold"] },
    cue: ["Амьсгал авангаа гараа хажуугаар дээш өргө.", "Хавирга доош, мөр чихнээс хол."],
    mis: ["Нуруу гэдийх"], reg: "yoga_tadasana" });
  E("yoga", { id: "yoga_standing_side_bend", name: "Зогсоо хажуу сунгалт", en: "Standing side bend", pat: "rotation", m: ["core", "spine"], eq: [], lv: 1, br: 4, sides: "each", snack: true,
    y: { s: "Parsva Urdhva Hastasana", f: "standing", next: ["yoga_forward_fold", "yoga_utkatasana"], counter: [] },
    cue: ["Нэг бугуйгаа нөгөө гараараа барьж хажуу тийш сунга.", "Хоёр хөл дээр жин тэнцүү."],
    mis: ["Урагш бөхийх"] });
  E("yoga", { id: "yoga_utkatasana", name: "Сандлын поз", en: "Chair pose", pat: "squat", m: ["quads", "glutes", "core"], eq: [], lv: 2, br: 5, c: ["knee"], snack: true,
    y: { s: "Utkatasana", f: "standing", next: ["yoga_forward_fold", "yoga_chair_twist", "yoga_tadasana"], counter: ["yoga_forward_fold"] },
    cue: ["Сандалд суух мэт хонгоо хойш, доош буулга.", "Гараа дээш, цээж өргөөтэй.", "Жин өсгий дээр."],
    mis: ["Өвдөг хурууны үзүүрээс урагш"], reg: "squat_box", pro: "yoga_chair_twist" });
  E("yoga", { id: "yoga_chair_twist", name: "Сандлын поз эргэлттэй", en: "Revolved chair pose", pat: "rotation", m: ["quads", "core", "spine"], eq: [], lv: 3, br: 4, sides: "each", c: ["knee", "pregnancy"],
    y: { s: "Parivrtta Utkatasana", f: "twist", next: ["yoga_forward_fold", "yoga_tadasana"], counter: ["yoga_forward_fold"] },
    cue: ["Сандлын позоос алгаа нийлүүлж, тохойгоо эсрэг өвдөгний гадна тал дээр тавь.", "Өвдөг хоёр зэрэгцсэн хэвээр."],
    mis: ["Нэг өвдөг урагш гарах"], reg: "yoga_utkatasana" });
  E("yoga", { id: "yoga_forward_fold", name: "Урагш бөхийлт", en: "Standing forward fold", pat: "hinge", m: ["hams", "spine"], eq: [], lv: 1, br: 5, c: ["lowback"],
    y: { s: "Uttanasana", f: "forward", next: ["yoga_half_forward_fold", "yoga_tadasana", "yoga_downdog"], counter: ["yoga_half_forward_fold", "yoga_tadasana"] },
    cue: ["Хонгоноосоо бөхийж өвдгөө зөөлөн нугал.", "Толгой, хүзүүгээ сул унжуул."],
    mis: ["Өвдөг түгжиж нуруугаар бөхийх"], reg: "yoga_half_forward_fold" });
  E("yoga", { id: "yoga_half_forward_fold", name: "Хагас бөхийлт", en: "Half forward fold", pat: "hinge", m: ["hams", "back"], eq: [], lv: 1, br: 4, snack: true,
    y: { s: "Ardha Uttanasana", f: "forward", next: ["yoga_forward_fold", "yoga_tadasana", "yoga_plank"], counter: [] },
    cue: ["Гараа шилбэн дээрээ тавьж нуруугаа шулуун сунга.", "Харц урагш доош, хүзүү нуруутай нэг шугамд."],
    mis: ["Нуруу бөгтийх"], pro: "yoga_forward_fold" });
  E("yoga", { id: "yoga_prasarita", name: "Хөлөө дэлгэж бөхийх", en: "Wide-legged forward fold", pat: "hinge", m: ["hams", "adductors", "spine"], eq: [], lv: 2, br: 5, c: ["lowback"],
    y: { s: "Prasarita Padottanasana", f: "forward", next: ["yoga_triangle", "yoga_goddess", "yoga_tadasana"], counter: ["yoga_goddess"] },
    cue: ["Хөлөө өргөн тавьж, хурууг бага дотогш хар.", "Хонгоноосоо бөхийж гараа шалд эсвэл шилбэнд тавь."],
    mis: ["Жин өсгий рүү унах"], reg: "yoga_half_forward_fold" });
  E("yoga", { id: "yoga_high_lunge", name: "Өндөр алхалт", en: "High lunge", pat: "lunge", m: ["quads", "glutes", "hipflex"], eq: [], lv: 2, br: 5, sides: "each", c: ["knee"],
    y: { s: "Ashta Chandrasana", f: "standing", next: ["yoga_warrior1", "yoga_warrior3", "yoga_low_lunge"], counter: ["yoga_forward_fold"] },
    cue: ["Нэг хөлөө урагш, хойд өсгийгөө өргөөтэй.", "Урд өвдөг шагайн дээр, гар дээш.", "Хойд хөлөө шулуун чангал."],
    mis: ["Урд өвдөг дотогш"], reg: "yoga_low_lunge", pro: "yoga_warrior1" });
  E("yoga", { id: "yoga_low_lunge", name: "Нам алхалт", en: "Low lunge", pat: "lunge", m: ["hipflex", "quads", "glutes"], eq: ["mat"], lv: 1, pos: "kneeling", br: 5, sides: "each", c: ["knee"],
    y: { s: "Anjaneyasana", f: "standing", next: ["yoga_high_lunge", "yoga_lizard", "yoga_downdog", "yoga_half_split"], counter: ["yoga_child"] },
    cue: ["Хойд өвдгөө шалан дээр (хэрэгтэй бол дэвсгэр хавчуул).", "Хонгоо урагш доош, гараа дээш.", "Хойд гуяны урд сунгалтыг мэдэр."],
    mis: ["Нуруугаар гэдийх"], pro: "yoga_high_lunge" });
  E("yoga", { id: "yoga_half_split", name: "Хагас салаа", en: "Half splits", pat: "hinge", m: ["hams"], eq: ["mat"], lv: 2, pos: "kneeling", br: 5, sides: "each", c: ["knee"],
    y: { s: "Ardha Hanumanasana", f: "forward", next: ["yoga_low_lunge", "yoga_downdog"], counter: ["yoga_low_lunge"] },
    cue: ["Нам алхалтаас хонгоо хойш тавьж урд хөлөө шулуутга.", "Нуруу шулуун, урд хөлийн хуруу өөр лүүгээ."],
    mis: ["Нуруу бөгтийх"], reg: "yoga_low_lunge" });
  E("yoga", { id: "yoga_warrior1", name: "Дайчин 1", en: "Warrior I", pat: "lunge", m: ["quads", "glutes", "shoulders"], eq: [], lv: 2, br: 5, sides: "each", c: ["knee"],
    y: { s: "Virabhadrasana I", f: "standing", next: ["yoga_warrior2", "yoga_high_lunge", "yoga_pyramid", "yoga_warrior3"], counter: ["yoga_forward_fold"] },
    cue: ["Хойд хөлийн улыг 45 градус гадагш тавьж шалд наа.", "Урд өвдгөө нугалж, аарцгаа урагш хар.", "Гараа дээш, мөр доош."],
    mis: ["Хойд өсгий өргөгдөх", "Аарцаг хажуу тийш нээгдэх"], reg: "yoga_high_lunge", pro: "yoga_warrior3" });
  E("yoga", { id: "yoga_warrior2", name: "Дайчин 2", en: "Warrior II", pat: "lunge", m: ["quads", "glutes", "shoulders"], eq: [], lv: 2, br: 5, sides: "each", c: ["knee"],
    y: { s: "Virabhadrasana II", f: "standing", next: ["yoga_reverse_warrior", "yoga_triangle", "yoga_side_angle", "yoga_half_moon"], counter: ["yoga_prasarita"] },
    cue: ["Хөлөө өргөн тавьж урд өвдгөө шагайн дээр нугал.", "Гараа хоёр тийш шалтай зэрэгцүүл, харц урд гарын хуруу руу.", "Мөр хонгоны дээр, хажуу тийш хазайхгүй."],
    mis: ["Урд өвдөг дотогш унах", "Бие урагш хазайх"], reg: "yoga_high_lunge", pro: "yoga_side_angle" });
  E("yoga", { id: "yoga_reverse_warrior", name: "Урвуу дайчин", en: "Reverse warrior", pat: "lunge", m: ["quads", "core", "spine"], eq: [], lv: 2, br: 4, sides: "each", c: ["knee"],
    y: { s: "Viparita Virabhadrasana", f: "standing", next: ["yoga_warrior2", "yoga_side_angle", "yoga_triangle"], counter: ["yoga_warrior2"] },
    cue: ["Дайчин 2-оос урд гараа дээш, хойд гараа хойд хөл дээр.", "Урд өвдөг нугалаастай хэвээр."],
    mis: ["Урд өвдөг шулуун болох"], reg: "yoga_warrior2" });
  E("yoga", { id: "yoga_side_angle", name: "Хажуугийн өнцөг", en: "Extended side angle", pat: "lunge", m: ["quads", "core", "adductors"], eq: [], lv: 2, br: 5, sides: "each", c: ["knee"],
    y: { s: "Utthita Parsvakonasana", f: "standing", next: ["yoga_warrior2", "yoga_triangle", "yoga_half_moon"], counter: ["yoga_warrior2"] },
    cue: ["Дайчин 2-оос урд шууг гуян дээрээ тавь.", "Дээд гараа чихний дээгүүр урагш сунга, хойд хөлөөс хуруу хүртэл нэг шугам."],
    mis: ["Цээж шал руу хаагдах"], reg: "yoga_warrior2" });
  E("yoga", { id: "yoga_triangle", name: "Гурвалжин", en: "Triangle pose", pat: "hinge", m: ["hams", "core", "spine"], eq: [], lv: 2, br: 5, sides: "each",
    y: { s: "Utthita Trikonasana", f: "standing", next: ["yoga_warrior2", "yoga_pyramid", "yoga_half_moon", "yoga_prasarita"], counter: ["yoga_tadasana"] },
    cue: ["Хөлөө өргөн, урд хөл шулуун боловч түгжээгүй.", "Хонгоноосоо хажуу тийш бөхийж гараа шилбэн дээр тавь.", "Дээд гар тэнгэр рүү, цээж нээлттэй."],
    mis: ["Урагш бөхийх", "Урд өвдөг түгжих"], reg: "yoga_warrior2", pro: "yoga_half_moon" });
  E("yoga", { id: "yoga_pyramid", name: "Пирамид", en: "Pyramid pose", pat: "hinge", m: ["hams", "spine"], eq: [], lv: 2, br: 5, sides: "each", c: ["lowback"],
    y: { s: "Parsvottanasana", f: "forward", next: ["yoga_warrior1", "yoga_warrior3", "yoga_forward_fold"], counter: ["yoga_warrior1"] },
    cue: ["Хөлөө урд хойно богино тавьж аарцгаа урагш тэгшлэ.", "Нуруугаа урт байлган урд хөл дээгүүрээ бөхий."],
    mis: ["Аарцаг эргэх"], reg: "yoga_half_forward_fold" });
  E("yoga", { id: "yoga_goddess", name: "Дарь эхийн поз", en: "Goddess pose", pat: "squat", m: ["quads", "glutes", "adductors"], eq: [], lv: 2, br: 5, c: ["knee"],
    y: { s: "Utkata Konasana", f: "standing", next: ["yoga_prasarita", "yoga_warrior2", "yoga_tadasana"], counter: ["yoga_prasarita"] },
    cue: ["Хөлөө өргөн тавьж хуруугаа гадагш хар.", "Өвдгөө хурууны чигт нугалж суу, тохойгоо мөрний түвшинд нугал."],
    mis: ["Өвдөг дотогш"], reg: "squat_sumo" });
  E("yoga", { id: "yoga_malasana", name: "Гүн суулт", en: "Garland pose", pat: "squat", m: ["glutes", "adductors", "calves"], eq: [], lv: 3, br: 5, c: ["knee", "ankle"],
    y: { s: "Malasana", f: "hipopen", next: ["yoga_forward_fold", "yoga_tadasana"], counter: ["yoga_forward_fold"] },
    cue: ["Хөлөө мөрнөөс өргөн тавьж бүрэн суу.", "Тохойгоороо өвдгөө гадагш түлхэж алгаа нийлүүл.", "Өсгий өргөгдвөл доор нь эвхсэн алчуур тавь."],
    mis: ["Нуруу бөгтийх"], reg: "yoga_goddess" });
  E("yoga", { id: "yoga_tree", name: "Мод", en: "Tree pose", pat: "balance", m: ["glutes", "calves", "core"], eq: [], lv: 2, br: 5, sides: "each", snack: true,
    y: { s: "Vrksasana", f: "balance", next: ["yoga_tadasana", "yoga_eagle", "yoga_warrior3"], counter: [] },
    cue: ["Нэг хөлийн улыг нөгөө хөлийн шилбэ эсвэл гуян дээр тавь, өвдөг дээр биш.", "Алгаа цээжин дээр нийлүүлж харцаа нэг цэгт.", "Хана дэргэдээ байж болно."],
    mis: ["Улаа өвдөг дээр тавих", "Аарцаг хажуу тийш"], reg: "single_leg_stance_chair", pro: "yoga_eagle" });
  E("yoga", { id: "yoga_eagle", name: "Бүргэд", en: "Eagle pose", pat: "balance", m: ["glutes", "shoulders", "core"], eq: [], lv: 3, br: 5, sides: "each", c: ["knee", "shoulder"],
    y: { s: "Garudasana", f: "balance", next: ["yoga_tadasana", "yoga_tree", "yoga_warrior3"], counter: ["yoga_tadasana"] },
    cue: ["Нэг хөлөө нөгөө дээгүүрээ ороож, тулсан өвдгөө нугал.", "Гараа тохойн доогуур ороож далаа нээ."],
    mis: ["Нуруу бөхийх"], reg: "yoga_tree" });
  E("yoga", { id: "yoga_warrior3", name: "Дайчин 3", en: "Warrior III", pat: "balance", m: ["glutes", "hams", "core"], eq: [], lv: 3, br: 5, sides: "each",
    y: { s: "Virabhadrasana III", f: "balance", next: ["yoga_tadasana", "yoga_half_moon", "yoga_warrior1"], counter: ["yoga_forward_fold"] },
    cue: ["Нэг хөл дээр зогсож биеэ Т үсэг мэт урагш хазайлга.", "Аарцаг шал руу харсан, хойд хөл чангарсан."],
    mis: ["Аарцаг гадагш эргэх"], reg: "rdl_single", pro: "yoga_half_moon" });
  E("yoga", { id: "yoga_half_moon", name: "Хагас сар", en: "Half moon pose", pat: "balance", m: ["glutes", "core", "hams"], eq: [], lv: 3, br: 5, sides: "each",
    y: { s: "Ardha Chandrasana", f: "balance", next: ["yoga_warrior2", "yoga_triangle", "yoga_tadasana"], counter: ["yoga_forward_fold"] },
    cue: ["Гурвалжингаас урд гараа шалд (эсвэл ном дээр) тавьж хойд хөлөө өргө.", "Хонгоо хана руу нээж цээжээ эргүүл."],
    mis: ["Цээж шал руу хаагдах"], reg: "yoga_triangle" });
  E("yoga", { id: "yoga_dancer", name: "Бүжигчин", en: "Dancer pose", pat: "balance", m: ["glutes", "quads", "shoulders", "spine"], eq: [], lv: 4, br: 5, sides: "each", c: ["knee", "shoulder", "lowback"],
    y: { s: "Natarajasana", f: "balance", next: ["yoga_tadasana", "yoga_forward_fold"], counter: ["yoga_forward_fold"] },
    cue: ["Нэг хөлөө ардаа барьж, цээжээ урагш, хөлөө хойш, дээш түлх.", "Харц нэг цэгт."],
    mis: ["Өвдөг хажуу тийш нээгдэх"], reg: "yoga_tree" });

  // --- Өвдөглөсөн, хэвтээ (prone) позууд ---
  E("yoga", { id: "yoga_cat_cow", name: "Муур–үхэр", en: "Cat-cow", pat: "core", m: ["spine", "core"], eq: ["mat"], lv: 1, pos: "kneeling", br: 6, snack: true,
    y: { s: "Marjaryasana–Bitilasana", f: "core", next: ["yoga_child", "yoga_downdog", "yoga_thread_needle", "yoga_puppy"], counter: [] },
    cue: ["Дөрвөн мөчөөрөө зогс, гар мөрний доор, өвдөг хонгоны доор.", "Амьсгал авахдаа гэдсээ буулгаж цээжээ нээ, гаргахдаа нуруугаа дээш бөгтийлгө.", "Хөдөлгөөн амьсгалаа дага."],
    mis: ["Хүзүүгээр хэт гэдийх"] });
  E("yoga", { id: "yoga_child", name: "Хүүхдийн поз", en: "Child's pose", pat: "core", m: ["spine", "back", "glutes"], eq: ["mat"], lv: 1, pos: "kneeling", br: 8, c: ["knee"], snack: true,
    y: { s: "Balasana", f: "restorative", next: ["yoga_cat_cow", "yoga_downdog", "yoga_puppy", "yoga_savasana"], counter: [] },
    cue: ["Өвдгөө дэлгэж өгзгөө өсгий рүүгээ буулга.", "Гараа урагш сунгаж духаа шалд тавь.", "Хэвлий рүүгээ гүн амьсгал."],
    mis: ["Өгзөг өсгийд хүрэхгүй бол доор нь дэр тавихгүй байх"] });
  E("yoga", { id: "yoga_puppy", name: "Гөлөгний поз", en: "Extended puppy pose", pat: "core", m: ["shoulders", "spine", "back"], eq: ["mat"], lv: 1, pos: "kneeling", br: 6, c: ["shoulder"],
    y: { s: "Uttana Shishosana", f: "forward", next: ["yoga_child", "yoga_downdog", "yoga_cat_cow"], counter: ["yoga_child"] },
    cue: ["Дөрвөн мөчөөс гараа урагш алхуулж цээжээ шал руу буулга.", "Хонго өвдөгний яг дээр үлдэнэ."],
    mis: ["Нуруу хэт хотойх"] });
  E("yoga", { id: "yoga_thread_needle", name: "Зүү сүвлэх", en: "Thread the needle", pat: "rotation", m: ["shoulders", "spine", "back"], eq: ["mat"], lv: 1, pos: "kneeling", br: 5, sides: "each",
    y: { s: "Parsva Balasana", f: "twist", next: ["yoga_cat_cow", "yoga_child", "yoga_downdog"], counter: [] },
    cue: ["Дөрвөн мөчөөс нэг гараа нөгөө гарынхаа доогуур шургуулж мөрөө шалд тавь.", "Хонго өвдөгний дээр хэвээр."],
    mis: ["Хонго хажуу тийш хазайх"] });
  E("yoga", { id: "yoga_downdog", name: "Нохой доош", en: "Downward-facing dog", pat: "push", m: ["shoulders", "hams", "calves", "back"], eq: ["mat"], lv: 2, pos: "prone", br: 5, c: ["wrist", "shoulder"],
    y: { s: "Adho Mukha Svanasana", f: "inversion", next: ["yoga_plank", "yoga_low_lunge", "yoga_forward_fold", "yoga_child", "yoga_cobra"], counter: ["yoga_child", "yoga_plank"] },
    cue: ["Дөрвөн мөчөөс өгзгөө дээш, хойш түлхэж биеэ урвуу V болго.", "Өвдгөө зөөлөн нугалж нуруугаа урт байлга.", "Хуруугаараа шал түлхэж чихээ мөрнөөс холдуул."],
    mis: ["Нуруу бөгтийх", "Жин бүгд бугуйнд"], reg: "yoga_puppy", pro: "yoga_plank" });
  E("yoga", { id: "yoga_plank", name: "Планк (йога)", en: "Plank pose", pat: "push", m: ["core", "shoulders", "chest"], eq: ["mat"], lv: 2, pos: "prone", br: 5, c: ["wrist", "postpartum"],
    y: { s: "Phalakasana", f: "core", next: ["yoga_downdog", "yoga_chaturanga", "yoga_cobra", "yoga_child"], counter: ["yoga_child", "yoga_downdog"] },
    cue: ["Гар мөрний доор, толгойноос өсгий хүртэл шулуун.", "Өсгийгөө хойш түлхэж өгзгөө чангал."],
    mis: ["Аарцаг унжих"], reg: "plank_knees", pro: "yoga_chaturanga" });
  E("yoga", { id: "yoga_chaturanga", name: "Чатуранга", en: "Four-limbed staff pose", pat: "push", m: ["chest", "triceps", "core"], eq: ["mat"], lv: 4, pos: "prone", br: 2, c: ["wrist", "shoulder", "pregnancy", "postpartum"],
    y: { s: "Chaturanga Dandasana", f: "core", next: ["yoga_updog", "yoga_cobra", "yoga_downdog"], counter: ["yoga_updog", "yoga_child"] },
    cue: ["Планкаас тохойгоо хойш нугалж биеэ шалнаас 10 см хүртэл буулга.", "Тохой хавирганд ойрхон, мөр тохойноос доош орохгүй."],
    mis: ["Мөр урагш унах"], reg: "pushup_knee" });
  E("yoga", { id: "yoga_sphinx", name: "Сфинкс", en: "Sphinx pose", pat: "pull", m: ["spine", "back"], eq: ["mat"], lv: 1, pos: "prone", br: 6, c: ["pregnancy"], snack: true,
    y: { s: "Salamba Bhujangasana", f: "back", next: ["yoga_cobra", "yoga_child", "yoga_locust"], counter: ["yoga_child"] },
    cue: ["Гэдсээр хэвтэж тохойгоо мөрний доор тавь.", "Шууг шалд дарж цээжээ өргө, мөр доош.", "Аарцгаа шалд хүндрүүл."],
    mis: ["Мөр чих рүү өргөгдөх"], pro: "yoga_cobra" });
  E("yoga", { id: "yoga_cobra", name: "Могой", en: "Cobra pose", pat: "pull", m: ["spine", "back", "chest"], eq: ["mat"], lv: 2, pos: "prone", br: 5, c: ["pregnancy"],
    y: { s: "Bhujangasana", f: "back", next: ["yoga_downdog", "yoga_child", "yoga_locust", "yoga_bow"], counter: ["yoga_child", "yoga_downdog"] },
    cue: ["Алгаа цээжний хажууд тавьж, нурууны булчингаар цээжээ өргө.", "Гар бага тусална, тохой нугалаатай.", "Хүзүү урт, харц урагш."],
    mis: ["Гараараа түлхэж нурууг хэт гэдийлгэх"], reg: "yoga_sphinx", pro: "yoga_updog" });
  E("yoga", { id: "yoga_updog", name: "Нохой дээш", en: "Upward-facing dog", pat: "push", m: ["spine", "chest", "shoulders"], eq: ["mat"], lv: 3, pos: "prone", br: 4, c: ["wrist", "lowback", "pregnancy"],
    y: { s: "Urdhva Mukha Svanasana", f: "back", next: ["yoga_downdog", "yoga_child"], counter: ["yoga_downdog", "yoga_child"] },
    cue: ["Гараа шулуутгаж гуя, өвдгөө шалнаас өргө.", "Мөрөө хойш доош, цээж урагш."],
    mis: ["Мөр чихэнд", "Гуя шалан дээр үлдэх"], reg: "yoga_cobra" });
  E("yoga", { id: "yoga_locust", name: "Царцаа", en: "Locust pose", pat: "pull", m: ["back", "glutes", "spine"], eq: ["mat"], lv: 2, pos: "prone", br: 4, c: ["pregnancy", "lowback"],
    y: { s: "Salabhasana", f: "back", next: ["yoga_child", "yoga_bow", "yoga_downdog"], counter: ["yoga_child"] },
    cue: ["Гэдсээр хэвтэж гар, цээж, хөлөө зэрэг өргө.", "Хүзүү урт, харц шал руу.", "Өгзгөө чангал."],
    mis: ["Толгой гэдийх"], reg: "superman_alt", pro: "yoga_bow" });
  E("yoga", { id: "yoga_bow", name: "Нум", en: "Bow pose", pat: "pull", m: ["spine", "back", "quads", "chest"], eq: ["mat"], lv: 3, pos: "prone", br: 4, c: ["pregnancy", "lowback", "knee", "shoulder"],
    y: { s: "Dhanurasana", f: "back", next: ["yoga_child", "yoga_downdog"], counter: ["yoga_child"] },
    cue: ["Гэдсээр хэвтэж шагайгаа гараараа барь.", "Хөлөөрөө гараа түлхэж цээжээ өргө."],
    mis: ["Өвдөг хоёр тийш нээгдэх"], reg: "yoga_locust" });
  E("yoga", { id: "yoga_camel", name: "Тэмээ", en: "Camel pose", pat: "hinge", m: ["spine", "chest", "hipflex", "quads"], eq: ["mat"], lv: 3, pos: "kneeling", br: 4, c: ["knee", "lowback", "neck", "pregnancy"],
    y: { s: "Ustrasana", f: "back", next: ["yoga_child", "yoga_hero"], counter: ["yoga_child"] },
    cue: ["Өвдөг дээрээ зогсож гараа ууцан дээрээ тавь.", "Аарцгаа урагш түлхэж цээжээ дээш нээ, хүзүүгээ сул унагахгүй.", "Хүрвэл өсгийгөө барь."],
    mis: ["Хонго хойш унаж нуруу хугарч гэдийх", "Толгой огцом хойш унах"], reg: "yoga_cobra" });
  E("yoga", { id: "yoga_gate", name: "Хаалга", en: "Gate pose", pat: "rotation", m: ["core", "adductors", "spine"], eq: ["mat"], lv: 2, pos: "kneeling", br: 5, sides: "each", c: ["knee"],
    y: { s: "Parighasana", f: "standing", next: ["yoga_child", "yoga_cat_cow", "yoga_camel"], counter: [] },
    cue: ["Нэг өвдөг дээрээ зогсож нөгөө хөлөө хажуу тийш сунга.", "Сунгасан хөл рүүгээ хажуу тийш бөхийж дээд гараа чихний дээгүүр."],
    mis: ["Урагш эргэх"], reg: "yoga_standing_side_bend" });
  E("yoga", { id: "yoga_lizard", name: "Гүрвэл", en: "Lizard pose", pat: "lunge", m: ["hipflex", "adductors", "glutes"], eq: ["mat"], lv: 3, pos: "kneeling", br: 6, sides: "each", c: ["hip", "knee"],
    y: { s: "Utthan Pristhasana", f: "hipopen", next: ["yoga_low_lunge", "yoga_pigeon", "yoga_downdog"], counter: ["yoga_downdog"] },
    cue: ["Нам алхалтаас урд хөлөө гарынхаа гадна талд тавь.", "Шууг шалд буулгаж болно, хойд өвдөг шалан дээр."],
    mis: ["Урд өвдөг дотогш"], reg: "yoga_low_lunge" });
  E("yoga", { id: "yoga_pigeon", name: "Тагтаа", en: "Pigeon pose", pat: "core", m: ["glutes", "hipflex"], eq: ["mat"], lv: 3, pos: "kneeling", br: 8, sides: "each", c: ["knee", "hip"],
    y: { s: "Eka Pada Rajakapotasana", f: "hipopen", next: ["yoga_downdog", "yoga_child", "yoga_seated_forward_fold"], counter: ["yoga_downdog"] },
    cue: ["Урд шилбээ дэвсгэрийн урд захтай ойролцоо хөндлөн тавь.", "Хойд хөл шулуун, аарцаг тэгш.", "Өвдөгөнд өвдвөл хэвтээ 4-ийн зураг хий."],
    mis: ["Аарцаг нэг тал руу унах"], reg: "yoga_figure4" });
  E("yoga", { id: "yoga_figure4", name: "Хэвтээ 4-ийн зураг", en: "Reclined figure four", pat: "core", m: ["glutes", "hipflex"], eq: ["mat"], lv: 1, pos: "supine", br: 8, sides: "each", c: ["pregnancy"], snack: true,
    y: { s: "Supta Kapotasana", f: "hipopen", next: ["yoga_happy_baby", "yoga_supine_twist", "yoga_knees_to_chest"], counter: [] },
    cue: ["Нуруугаар хэвтэж нэг шагайгаа нөгөө өвдөгнийхөө дээр тавь.", "Доод гуяныхаа арыг барьж цээж рүүгээ тат.", "Толгой, мөр шалан дээр."],
    mis: ["Толгой өргөгдөх"], pro: "yoga_pigeon" });
  E("yoga", { id: "yoga_hero", name: "Баатрын суулт", en: "Hero pose", pat: "core", m: ["quads", "hipflex"], eq: ["mat"], lv: 2, pos: "kneeling", br: 8, c: ["knee", "ankle"],
    y: { s: "Virasana", f: "restorative", next: ["yoga_child", "yoga_camel", "yoga_cat_cow"], counter: ["yoga_downdog"] },
    cue: ["Өвдөг нийлсэн, хөл хоёр тийш, өгзгөө дунд нь (эсвэл дэр дээр) суулга.", "Нуруу шулуун, гар гуян дээр."],
    mis: ["Өвдөгний өвдөлтийг тэвчих"], reg: "yoga_easy_pose" });

  // --- Суугаа позууд ---
  E("yoga", { id: "yoga_easy_pose", name: "Амар суулт", en: "Easy pose", pat: "core", m: ["spine", "hipflex"], eq: ["mat"], lv: 1, pos: "seated", br: 8, snack: true,
    y: { s: "Sukhasana", f: "restorative", next: ["yoga_seated_twist", "yoga_butterfly", "yoga_seated_forward_fold", "yoga_cat_cow"], counter: [] },
    cue: ["Шилбээ зөрүүлж суу, өгзгийн доор дэр тавьж болно.", "Оройгоороо дээш сунаж мөрөө суллаа.", "Гар өвдөгний дээр."],
    mis: ["Нуруу бөгтийх"] });
  E("yoga", { id: "yoga_dandasana", name: "Таягны поз", en: "Staff pose", pat: "core", m: ["core", "spine", "hams"], eq: ["mat"], lv: 1, pos: "seated", br: 5,
    y: { s: "Dandasana", f: "core", next: ["yoga_seated_forward_fold", "yoga_head_to_knee", "yoga_boat", "yoga_seated_twist"], counter: [] },
    cue: ["Хөлөө урагш сунгаж, хурууг өөр лүүгээ тат.", "Алгаа хонгоныхоо хажууд шалд дарж нуруугаа шулуун өргө."],
    mis: ["Ууц хойш унах"] });
  E("yoga", { id: "yoga_seated_forward_fold", name: "Сууж урагш бөхийх", en: "Seated forward fold", pat: "hinge", m: ["hams", "spine", "back"], eq: ["mat"], lv: 2, pos: "seated", br: 8, c: ["lowback"],
    y: { s: "Paschimottanasana", f: "forward", next: ["yoga_dandasana", "yoga_butterfly", "yoga_bridge", "yoga_savasana"], counter: ["yoga_bridge", "yoga_dandasana"] },
    cue: ["Таягны позоос хонгоноосоо бөхий, өвдгөө нугалж болно.", "Нуруугаа урт байлган цээжээ гуя руугаа ойртуул."],
    mis: ["Нуруу бөгтийж толгой өвдөг рүү"], reg: "yoga_dandasana" });
  E("yoga", { id: "yoga_head_to_knee", name: "Толгой өвдөг рүү", en: "Head-to-knee pose", pat: "hinge", m: ["hams", "spine"], eq: ["mat"], lv: 2, pos: "seated", br: 6, sides: "each", c: ["lowback", "knee"],
    y: { s: "Janu Sirsasana", f: "forward", next: ["yoga_seated_forward_fold", "yoga_seated_twist", "yoga_butterfly"], counter: ["yoga_bridge"] },
    cue: ["Нэг хөлөө сунгаж нөгөө улаа дотор гуяндаа наа.", "Сунгасан хөл дээгүүрээ хонгоноосоо бөхий."],
    mis: ["Нуруу бөгтийх"], reg: "yoga_dandasana" });
  E("yoga", { id: "yoga_butterfly", name: "Эрвээхэй", en: "Bound angle pose", pat: "core", m: ["adductors", "hipflex"], eq: ["mat"], lv: 1, pos: "seated", br: 8, c: ["knee"], snack: true,
    y: { s: "Baddha Konasana", f: "hipopen", next: ["yoga_seated_forward_fold", "yoga_wide_seated_fold", "yoga_reclined_butterfly", "yoga_easy_pose"], counter: [] },
    cue: ["Улаа нийлүүлж өвдгөө хоёр тийш унагаа.", "Нуруу шулуун, өвдгөө дарж хүчлэхгүй."],
    mis: ["Нуруу бөгтийх"], pro: "yoga_wide_seated_fold" });
  E("yoga", { id: "yoga_wide_seated_fold", name: "Хөл дэлгэж сууж бөхийх", en: "Wide-angle seated forward bend", pat: "hinge", m: ["adductors", "hams", "spine"], eq: ["mat"], lv: 3, pos: "seated", br: 8, c: ["lowback"],
    y: { s: "Upavistha Konasana", f: "forward", next: ["yoga_butterfly", "yoga_seated_forward_fold", "yoga_savasana"], counter: ["yoga_bridge"] },
    cue: ["Хөлөө өргөн дэлгэж хурууг дээш хар.", "Нуруу урт, хонгоноосоо урагш бөхий."],
    mis: ["Ууц хойш унах"], reg: "yoga_butterfly" });
  E("yoga", { id: "yoga_seated_twist", name: "Сууж эргэх", en: "Half lord of the fishes", pat: "rotation", m: ["spine", "core", "glutes"], eq: ["mat"], lv: 2, pos: "seated", br: 6, sides: "each", c: ["pregnancy"],
    y: { s: "Ardha Matsyendrasana", f: "twist", next: ["yoga_seated_forward_fold", "yoga_dandasana", "yoga_easy_pose"], counter: ["yoga_seated_forward_fold"] },
    cue: ["Нэг хөлөө сунгаж нөгөө улаа түүний гадна талд тавь.", "Амьсгал авч нуруугаа урт, гаргаж өвдөг рүүгээ эргэ.", "Эргэлт нурууны дунд хэсгээс."],
    mis: ["Хүзүүгээр л эргэх"], reg: "yoga_easy_pose" });
  E("yoga", { id: "yoga_cow_face", name: "Үхрийн нүүр", en: "Cow face pose", pat: "core", m: ["shoulders", "glutes", "triceps"], eq: ["mat"], lv: 3, pos: "seated", br: 6, sides: "each", c: ["knee", "shoulder"],
    y: { s: "Gomukhasana", f: "hipopen", next: ["yoga_dandasana", "yoga_seated_forward_fold"], counter: [] },
    cue: ["Өвдгөө давхарлан суу.", "Нэг гараа дээрээс, нөгөөг доороос нуруун дээр нийлүүл (хүрэхгүй бол алчуур барь)."],
    mis: ["Нуруу хотойх"], reg: "yoga_butterfly" });
  E("yoga", { id: "yoga_half_boat", name: "Хагас завь", en: "Half boat pose", pat: "core", m: ["core", "hipflex"], eq: ["mat"], lv: 2, pos: "seated", br: 5, c: ["pregnancy", "lowback", "postpartum"],
    y: { s: "Ardha Navasana", f: "core", next: ["yoga_boat", "yoga_dandasana", "yoga_bridge"], counter: ["yoga_bridge", "yoga_seated_forward_fold"] },
    cue: ["Өвдгөө нугалж шилбээ шалтай зэрэгцүүлэн өргө.", "Цээж өргөөтэй, гар урагш."],
    mis: ["Нуруу бөгтийх"], reg: "yoga_dandasana", pro: "yoga_boat" });
  E("yoga", { id: "yoga_boat", name: "Завь", en: "Boat pose", pat: "core", m: ["core", "hipflex"], eq: ["mat"], lv: 3, pos: "seated", br: 5, c: ["pregnancy", "lowback", "postpartum"],
    y: { s: "Navasana", f: "core", next: ["yoga_dandasana", "yoga_bridge", "yoga_seated_forward_fold"], counter: ["yoga_bridge", "yoga_seated_forward_fold"] },
    cue: ["Хөлөө шулуун 45 градус өргөж биеэ V болго.", "Нуруу шулуун, цээж нээлттэй."],
    mis: ["Ууц бөгтийх"], reg: "yoga_half_boat" });

  // --- Хэвтээ (supine) позууд ---
  E("yoga", { id: "yoga_bridge", name: "Гүүр (йога)", en: "Bridge pose", pat: "hinge", m: ["glutes", "spine", "chest"], eq: ["mat"], lv: 1, pos: "supine", br: 6, c: ["pregnancy", "neck"],
    y: { s: "Setu Bandha Sarvangasana", f: "back", next: ["yoga_knees_to_chest", "yoga_supine_twist", "yoga_happy_baby", "yoga_savasana"], counter: ["yoga_knees_to_chest"] },
    cue: ["Өвдгөө нугалж өсгийгөө өгзөг рүүгээ ойртуул.", "Аарцгаа дээш өргөж далаа доогуураа нийлүүл.", "Эрүү цээж рүү зөөлөн."],
    mis: ["Өвдөг хоёр тийш нээгдэх"], pro: "glute_bridge_hold" });
  E("yoga", { id: "yoga_knees_to_chest", name: "Өвдгөө цээжиндээ", en: "Knees-to-chest pose", pat: "core", m: ["spine", "glutes"], eq: ["mat"], lv: 1, pos: "supine", br: 8, c: ["pregnancy"], snack: true,
    y: { s: "Apanasana", f: "restorative", next: ["yoga_supine_twist", "yoga_happy_baby", "yoga_figure4", "yoga_savasana"], counter: [] },
    cue: ["Хоёр өвдгөө цээж рүүгээ тэврэн тат.", "Ууцаа шалд хүндрүүлж амьсгалаа гарга."],
    mis: ["Толгой өргөгдөх"] });
  E("yoga", { id: "yoga_supine_twist", name: "Хэвтээ эргэлт", en: "Supine spinal twist", pat: "rotation", m: ["spine", "glutes", "core"], eq: ["mat"], lv: 1, pos: "supine", br: 8, sides: "each", c: ["pregnancy"], snack: true,
    y: { s: "Supta Matsyendrasana", f: "twist", next: ["yoga_knees_to_chest", "yoga_happy_baby", "yoga_savasana"], counter: ["yoga_knees_to_chest"] },
    cue: ["Нуруугаар хэвтэж нэг өвдгөө эсрэг тал руу унагаа.", "Хоёр мөр шалан дээр, толгой эсрэг тал руу харна."],
    mis: ["Мөр шалнаас хөндийрөх"] });
  E("yoga", { id: "yoga_happy_baby", name: "Жаргалтай нялх", en: "Happy baby pose", pat: "core", m: ["glutes", "adductors", "spine"], eq: ["mat"], lv: 1, pos: "supine", br: 8, c: ["pregnancy"],
    y: { s: "Ananda Balasana", f: "hipopen", next: ["yoga_knees_to_chest", "yoga_supine_twist", "yoga_savasana"], counter: [] },
    cue: ["Нуруугаар хэвтэж улныхаа гадна талаас барь.", "Өвдгөө суганы чигт доош татаж ууцаа шалд наа."],
    mis: ["Ууц шалнаас салах"] });
  E("yoga", { id: "yoga_reclined_hand_toe", name: "Хэвтээд хөл сунгах", en: "Reclined hand-to-big-toe", pat: "hinge", m: ["hams", "calves"], eq: ["mat"], lv: 1, pos: "supine", br: 8, sides: "each", c: ["pregnancy"],
    y: { s: "Supta Padangusthasana", f: "forward", next: ["yoga_figure4", "yoga_supine_twist", "yoga_knees_to_chest"], counter: [] },
    cue: ["Нэг хөлөө дээш сунгаж гуяныхаа арыг (эсвэл алчуураар улаа) барь.", "Нөгөө хөл шалан дээр шулуун, толгой доош."],
    mis: ["Аарцаг шалнаас өргөгдөх"] });
  E("yoga", { id: "yoga_reclined_butterfly", name: "Хэвтээ эрвээхэй", en: "Reclined bound angle", pat: "core", m: ["adductors", "hipflex"], eq: ["mat"], lv: 1, pos: "supine", br: 10, c: ["pregnancy"],
    y: { s: "Supta Baddha Konasana", f: "restorative", next: ["yoga_savasana", "yoga_knees_to_chest", "yoga_legs_up_wall"], counter: [] },
    cue: ["Нуруугаар хэвтэж улаа нийлүүлж өвдгөө хоёр тийш унагаа.", "Өвдөгний доор дэр тавьж болно, гар гэдсэн дээр."],
    mis: ["Өвдгөө хүчээр дарах"] });
  E("yoga", { id: "yoga_legs_up_wall", name: "Хөл ханан дээр", en: "Legs up the wall", pat: "core", m: ["hams", "calves"], eq: ["mat", "wall"], lv: 1, pos: "supine", br: 15, c: ["pregnancy", "inversion"], snack: true,
    y: { s: "Viparita Karani", f: "inversion", next: ["yoga_savasana", "yoga_knees_to_chest"], counter: [] },
    cue: ["Өгзгөө хананд ойртуулж хөлөө хана дагуу дээш тавь.", "Гараа хоёр тийш, нүдээ аниад гэдсээр амьсгал."],
    mis: ["Өгзөг хананаас хол"] });
  E("yoga", { id: "yoga_fish", name: "Загас", en: "Fish pose", pat: "core", m: ["chest", "neck", "spine"], eq: ["mat"], lv: 3, pos: "supine", br: 5, c: ["neck", "pregnancy", "lowback"],
    y: { s: "Matsyasana", f: "back", next: ["yoga_knees_to_chest", "yoga_savasana"], counter: ["yoga_knees_to_chest"] },
    cue: ["Нуруугаар хэвтэж тохойгоо доогуураа тавьж цээжээ өргө.", "Оройгоо шалд зөөлөн хүргэ, жин тохой дээр."],
    mis: ["Жин бүгд толгой дээр"], reg: "yoga_bridge" });
  E("yoga", { id: "yoga_shoulder_stand", name: "Мөрөн дээр зогсох", en: "Shoulder stand", pat: "core", m: ["core", "neck", "shoulders"], eq: ["mat"], lv: 4, pos: "supine", br: 8, c: ["neck", "inversion", "hypertension", "pregnancy", "shoulder"],
    y: { s: "Salamba Sarvangasana", f: "inversion", next: ["yoga_fish", "yoga_knees_to_chest", "yoga_savasana"], counter: ["yoga_fish"] },
    cue: ["Мөрний доор эвхсэн хөнжил тавь.", "Хөлөө дээш өргөж гараараа нуруугаа түш.", "Толгойгоо эргүүлэхгүй."],
    mis: ["Хүзүүнд жин унах"], reg: "yoga_legs_up_wall" });
  E("yoga", { id: "yoga_savasana", name: "Шавасана", en: "Corpse pose", pat: "core", m: ["fullbody"], eq: ["mat"], lv: 1, pos: "supine", br: 20, c: ["pregnancy"],
    y: { s: "Savasana", f: "restorative", next: [], counter: [] },
    cue: ["Нуруугаар хэвтэж хөлөө мөрний өргөнөөр, алгаа дээш хар.", "Бие бүхэлдээ шаланд уусаж байгаа мэт сул тавь.", "Амьсгалаа удирдахгүй, зүгээр ажигла."],
    mis: ["Унтах"], reg: "yoga_savasana_side" });
  E("yoga", { id: "yoga_savasana_side", name: "Хажуугаар хэвтэх шавасана", en: "Side-lying savasana", pat: "core", m: ["fullbody"], eq: ["mat"], lv: 1, pos: "side", br: 20,
    y: { s: "Parsva Savasana", f: "restorative", next: [], counter: [] },
    cue: ["Зүүн хажуугаараа хэвтэж өвдөгний хооронд дэр хавчуул.", "Толгойн доор дэр, бие сул."],
    mis: ["Нуруу бөгтийх"] });

  /* ============================ ПИЛАТЕС ============================ */
  // --- Tier 1: эхлэгч, бэлтгэл хувилбарууд ---
  E("pilates", { id: "pilates_pelvic_curl", name: "Аарцгийн муруйлт", en: "Pelvic curl", pat: "hinge", m: ["glutes", "spine", "core"], lv: 1, reps: 8, c: ["pregnancy"], pil: { t: 1, n: null }, snack: true,
    cue: ["Нуруугаар хэвтэж амьсгал гаргангаа ууцнаасаа эхлэн нэг нугаламаар дээш өргө.", "Дээд цэгт өвдөг, хонго, мөр нэг шугам.", "Буухдаа цээжнээс эхлэн нугалам тус бүрээр."],
    mis: ["Аарцгаа бүхлээр нь шууд өргөх"], pro: "pilates_shoulder_bridge" });
  E("pilates", { id: "pilates_toe_taps", name: "Хөлийн үзүүр тогшилт", en: "Toe taps", pat: "core", m: ["core", "hipflex"], lv: 1, reps: 10, sides: "each", c: ["pregnancy"], pil: { t: 1, n: null }, snack: true,
    cue: ["Хөлөө ширээний байрлалд өргө (өвдөг 90 градус).", "Нэг хөлийн үзүүрийг шалд хүргээд буцаа, ууц хөдөлгөөнгүй."],
    mis: ["Нуруу шалнаас салах"], pro: "pilates_hundred_prep" });
  E("pilates", { id: "pilates_hundred_prep", name: "Зуу (бэлтгэл)", en: "Hundred prep", pat: "core", m: ["core"], lv: 1, reps: 50, c: ["pregnancy"], pil: { t: 1, n: 1 },
    cue: ["Толгой шалан дээр, хөл ширээний байрлалд.", "Гараа шалнаас өргөж жижиг хэмнэлээр савла, 5 тоолж авч 5 тоолж гарга."],
    mis: ["Мөр чангарах"], reg: "pilates_toe_taps", pro: "pilates_hundred" });
  E("pilates", { id: "pilates_hundred", name: "Зуу", en: "The Hundred", pat: "core", m: ["core"], lv: 2, reps: 100, c: ["pregnancy", "lowback", "neck", "postpartum"], pil: { t: 2, n: 1 },
    cue: ["Толгой, мөрөө өргөж хөлөө ширээний байрлалд эсвэл 45 градус сунга.", "Гараа 5 удаа савлангаа амьсгал авч, 5 удаа савлангаа гарга, нийт 100.", "Ууцаа шалд наа."],
    mis: ["Хүзүүгээр барих", "Нуруу гэдийх"], reg: "pilates_hundred_prep", pro: "pilates_roll_up" });
  E("pilates", { id: "pilates_half_roll_back", name: "Хагас эргэлт хойш", en: "Half roll back", pat: "core", m: ["core", "spine"], lv: 1, pos: "seated", reps: 8, c: ["pregnancy", "lowback"], pil: { t: 1, n: 2 },
    cue: ["Өвдгөө нугалж сууж гуяныхаа арыг барь.", "Ууцаа бөхийлгөж С хэлбэртэй хойш хагас хэвтээд буцаж суу."],
    mis: ["Нуруу шулуун хэвээр хойш унах"], pro: "pilates_roll_up" });
  E("pilates", { id: "pilates_roll_up", name: "Эргэж босох", en: "Roll up", pat: "core", m: ["core", "spine", "hipflex"], lv: 3, reps: 6, c: ["pregnancy", "lowback", "neck", "postpartum"], pil: { t: 2, n: 2 },
    cue: ["Нуруугаар хэвтэж гараа дээш сунга.", "Эрүүгээ татаж нуруугаа нэг нугаламаар босгож хөл рүүгээ бөхий.", "Буцахдаа ууцнаасаа эхлэн нугалам тус бүрээр буу."],
    mis: ["Савлаж босох", "Хөл шалнаас хөндийрөх"], reg: "pilates_half_roll_back", pro: "pilates_neck_pull" });
  E("pilates", { id: "pilates_leg_circle", name: "Нэг хөлний тойрог", en: "One leg circle", pat: "core", m: ["core", "hipflex", "hams"], lv: 1, reps: 5, sides: "each", c: ["pregnancy"], pil: { t: 1, n: 4 },
    cue: ["Нэг хөлөө дээш сунгаж нөгөөг нь шалд (эсвэл нугалаастай) тавь.", "Хөлөөрөө жижиг тойрог зур, аарцаг хөдөлгөөнгүй.", "Хоёр чигт 5 удаа."],
    mis: ["Аарцаг хажуу тийш найгах"], pro: "pilates_single_leg_stretch" });
  E("pilates", { id: "pilates_rolling_ball", name: "Бөмбөг шиг өнхрөх", en: "Rolling like a ball", pat: "core", m: ["core", "spine"], lv: 2, pos: "seated", reps: 8, c: ["pregnancy", "lowback", "neck"], pil: { t: 1, n: 5 },
    cue: ["Өвдгөө тэврэн С хэлбэрт ороод хөлөө шалнаас өргө.", "Амьсгал авч хойш өнхөр, гаргаж буцаж ир, толгой шалд хүрэхгүй."],
    mis: ["Толгой шалд хүрэх", "Хэлбэр задрах"], reg: "pilates_half_roll_back", pro: "pilates_open_leg_rocker" });
  E("pilates", { id: "pilates_single_leg_stretch", name: "Нэг хөлний сунгалт", en: "One leg stretch", pat: "core", m: ["core", "hipflex"], lv: 2, reps: 10, sides: "each", c: ["pregnancy", "neck", "lowback"], pil: { t: 1, n: 6 },
    cue: ["Толгой, мөрөө өргөж нэг өвдгөө цээж рүүгээ татаж нөгөөг нь сунга.", "Хөлөө ээлжил, ууц шалан дээр.", "Хүзүү өвдвөл толгойгоо шалд тавь."],
    mis: ["Нуруу гэдийх"], reg: "pilates_toe_taps", pro: "pilates_double_leg_stretch" });
  E("pilates", { id: "pilates_double_leg_stretch", name: "Хоёр хөлний сунгалт", en: "Double leg stretch", pat: "core", m: ["core", "hipflex", "shoulders"], lv: 2, reps: 8, c: ["pregnancy", "neck", "lowback"], pil: { t: 2, n: 7 },
    cue: ["Өвдгөө тэврэн толгойгоо өргө.", "Амьсгал авч гар, хөлөө зэрэг сунга, гаргаж буцаан тэвэр."],
    mis: ["Хөлийг хэт нам буулгаж нуруу гэдийх"], reg: "pilates_single_leg_stretch", pro: "pilates_criss_cross" });
  E("pilates", { id: "pilates_single_straight_leg", name: "Хайч", en: "Single straight leg stretch", pat: "core", m: ["core", "hams"], lv: 2, reps: 10, sides: "each", c: ["pregnancy", "neck", "lowback"], pil: { t: 2, n: null },
    cue: ["Толгой өргөөтэй, нэг хөлөө дээш сунгаж хоёр удаа татаад солио.", "Хоёр хөл шулуун, ууц шалан дээр."],
    mis: ["Өвдөг нугалах"], reg: "pilates_single_leg_stretch", pro: "pilates_double_straight_leg" });
  E("pilates", { id: "pilates_double_straight_leg", name: "Хоёр шулуун хөл буулгах", en: "Double straight leg stretch", pat: "core", m: ["core", "hipflex"], lv: 3, reps: 8, c: ["pregnancy", "neck", "lowback", "postpartum"], pil: { t: 3, n: null },
    cue: ["Гараа толгойны ард, хоёр хөлөө дээш сунга.", "Хөлөө ууц хөндийрөхгүй хүртэл буулгаад буцаа."],
    mis: ["Нуруу шалнаас салах"], reg: "pilates_single_straight_leg" });
  E("pilates", { id: "pilates_criss_cross", name: "Загалмай", en: "Criss-cross", pat: "rotation", m: ["core"], lv: 2, reps: 10, sides: "each", c: ["pregnancy", "neck", "lowback", "postpartum"], pil: { t: 2, n: null },
    cue: ["Гараа толгойны ард, тохойгоо эсрэг өвдөг рүү эргүүл.", "Эргэлт цээжнээс, тохой нээлттэй."],
    mis: ["Тохойгоор татаж хүзүүг хүчлэх"], reg: "pilates_double_leg_stretch", pro: "pilates_corkscrew" });
  E("pilates", { id: "pilates_spine_stretch", name: "Нуруу сунгах", en: "Spine stretch forward", pat: "hinge", m: ["spine", "hams", "core"], lv: 1, pos: "seated", reps: 6, c: ["lowback"], pil: { t: 1, n: 8 }, snack: true,
    cue: ["Хөлөө мөрний өргөнтэй сунгаж суу, гар урагш.", "Амьсгал гаргангаа оройноосоо эхлэн урагш С хэлбэртэй бөхий.", "Хонго хойш татаастай, ууцнаасаа нэг нугаламаар босо."],
    mis: ["Хонгоноосоо хавтгай бөхийх"], pro: "pilates_saw" });
  E("pilates", { id: "pilates_open_leg_rocker", name: "Хөл дэлгэж өнхрөх", en: "Open leg rocker", pat: "core", m: ["core", "hams"], lv: 3, pos: "seated", reps: 6, c: ["pregnancy", "lowback", "neck"], pil: { t: 3, n: 9 },
    cue: ["Шагайгаа барьж хөлөө V хэлбэрээр сунга.", "Хойш өнхрөөд тэнцвэртэйгээр буцаж ир."],
    mis: ["Толгой шалд хүрэх"], reg: "pilates_rolling_ball" });
  E("pilates", { id: "pilates_corkscrew", name: "Шураг", en: "Corkscrew", pat: "rotation", m: ["core"], lv: 3, reps: 6, c: ["pregnancy", "lowback", "neck", "postpartum"], pil: { t: 3, n: 10 },
    cue: ["Хоёр хөлөө нийлүүлж дээш сунга.", "Хөлөөрөө тойрог зур, нуруу шалан дээр.", "Чигээ ээлжил."],
    mis: ["Аарцаг савлах"], reg: "pilates_criss_cross" });
  E("pilates", { id: "pilates_saw", name: "Хөрөө", en: "The Saw", pat: "rotation", m: ["spine", "core", "hams"], lv: 2, pos: "seated", reps: 6, sides: "each", c: ["lowback", "pregnancy"], pil: { t: 2, n: 11 },
    cue: ["Хөлөө дэлгэж, гараа хоёр тийш сунга.", "Эргээд чигчий хуруугаараа эсрэг хөлийн жижиг хурууг хөрөөдөх мэт урагш бөхий.", "Хонго хоёулаа шалан дээр."],
    mis: ["Эсрэг хонго өргөгдөх"], reg: "pilates_spine_stretch" });
  E("pilates", { id: "pilates_swan_prep", name: "Хун (бэлтгэл)", en: "Swan prep", pat: "pull", m: ["back", "spine"], lv: 1, pos: "prone", reps: 6, c: ["pregnancy"], pil: { t: 1, n: 12 },
    cue: ["Гэдсээр хэвтэж алгаа мөрний дэргэд тавь.", "Амьсгал авч цээжээ бага өргө, гар бага тусална.", "Хүзүү урт, харц шал руу."],
    mis: ["Гараараа түлхэх"], pro: "pilates_swan" });
  E("pilates", { id: "pilates_swan", name: "Хун", en: "Swan", pat: "pull", m: ["back", "spine", "glutes"], lv: 2, pos: "prone", reps: 6, c: ["pregnancy", "lowback"], pil: { t: 2, n: 12 },
    cue: ["Гараа шулуутгаж цээжээ өндөр өргө, аарцаг шалан дээр.", "Хүзүү нурууны үргэлжлэл."],
    mis: ["Мөр чихэнд"], reg: "pilates_swan_prep", pro: "pilates_rocking" });
  E("pilates", { id: "pilates_single_leg_kick", name: "Нэг хөлний цохилт", en: "One leg kick", pat: "pull", m: ["hams", "glutes", "back"], lv: 2, pos: "prone", reps: 8, sides: "each", c: ["pregnancy", "knee"], pil: { t: 2, n: 13 },
    cue: ["Тохой дээрээ тулж цээжээ өргө.", "Нэг өсгийгөөр өгзгөө хоёр удаа цохиод солио.", "Аарцаг шалан дээр."],
    mis: ["Ууц хотойх"], reg: "pilates_swan_prep", pro: "pilates_double_leg_kick" });
  E("pilates", { id: "pilates_double_leg_kick", name: "Хоёр хөлний цохилт", en: "Double leg kick", pat: "pull", m: ["hams", "back", "chest"], lv: 2, pos: "prone", reps: 6, c: ["pregnancy", "lowback", "shoulder"], pil: { t: 2, n: 14 },
    cue: ["Гараа нуруун дээрээ нийлүүлж хацраа шалд тавь.", "Хоёр өсгийгөөр гурав цохиод гараа сунгаж цээжээ өргө."],
    mis: ["Хүзүү хэт гэдийх"], reg: "pilates_single_leg_kick" });
  E("pilates", { id: "pilates_neck_pull", name: "Хүзүүний татлага", en: "Neck pull", pat: "core", m: ["core", "spine", "hipflex"], lv: 4, reps: 5, c: ["pregnancy", "lowback", "neck", "postpartum"], pil: { t: 3, n: 15 },
    cue: ["Гараа толгойны ард, хөл мөрний өргөнтэй.", "Нэг нугаламаар босож бөхийгөөд шулуун сууж, бөхийлгүй хойш буу."],
    mis: ["Хүзүүгээр татах"], reg: "pilates_roll_up" });
  E("pilates", { id: "pilates_scissors", name: "Өндөр хайч", en: "Scissors", pat: "core", m: ["core", "hams", "hipflex"], lv: 4, reps: 6, sides: "each", c: ["pregnancy", "lowback", "neck", "inversion"], pil: { t: 3, n: 16 },
    cue: ["Аарцгаа гараараа түшиж хөлөө дээш өргө.", "Хөлөө хайч шиг ээлжлэн салга."],
    mis: ["Хүзүүнд жин унах"], reg: "pilates_single_straight_leg" });
  E("pilates", { id: "pilates_bicycle", name: "Дугуй", en: "Bicycle", pat: "core", m: ["core", "hipflex", "hams"], lv: 4, reps: 6, sides: "each", c: ["pregnancy", "lowback", "neck", "inversion"], pil: { t: 3, n: 17 },
    cue: ["Өндөр хайчны байрлалаас дугуй унах мэт хөлөө эргүүл.", "Аарцаг гар дээр тогтвортой, чигээ солио."],
    mis: ["Аарцаг унах"], reg: "pilates_scissors" });
  E("pilates", { id: "pilates_shoulder_bridge", name: "Мөрний гүүр", en: "Shoulder bridge", pat: "hinge", m: ["glutes", "hams", "core"], lv: 2, reps: 5, sides: "each", c: ["pregnancy"], pil: { t: 2, n: 18 },
    cue: ["Аарцгаа гүүр болгож өргө.", "Нэг хөлөө дээш сунгаад буулгаж өргө, аарцаг тогтвортой."],
    mis: ["Аарцаг хажуу тийш унах"], reg: "pilates_pelvic_curl" });
  E("pilates", { id: "pilates_spine_twist", name: "Нуруу эргүүлэх", en: "Spine twist", pat: "rotation", m: ["spine", "core"], lv: 1, pos: "seated", reps: 6, sides: "each", pil: { t: 1, n: 19 }, snack: true,
    cue: ["Хөлөө нийлүүлж сунгаж суугаад гараа хоёр тийш дэлгэ.", "Амьсгал гаргангаа цээжээ хоёр удаа эргүүл, аарцаг хөдлөхгүй."],
    mis: ["Хонго дагаж эргэх"], pro: "pilates_saw" });
  E("pilates", { id: "pilates_jackknife", name: "Эвхдэг хутга", en: "Jackknife", pat: "core", m: ["core", "glutes"], lv: 4, reps: 5, c: ["pregnancy", "lowback", "neck", "inversion", "postpartum"], pil: { t: 3, n: 20 },
    cue: ["Хөлөө толгойн дээгүүр аваачаад тэнгэр рүү шууд өргө.", "Нэг нугаламаар буу."],
    mis: ["Савлах"], reg: "pilates_roll_up" });
  E("pilates", { id: "pilates_side_leg_lift", name: "Хажуугаар хөл өргөх", en: "Side-lying leg lift", pat: "core", m: ["glutes", "adductors", "core"], lv: 1, pos: "side", reps: 10, sides: "each", pil: { t: 1, n: 21 }, snack: true,
    cue: ["Хажуугаар хэвтэж биеэ нэг шугамд байлга.", "Дээд хөлөө хонгоны өндөрт өргөөд удаан буулга."],
    mis: ["Хонго хойш унах"], pro: "pilates_side_kick" });
  E("pilates", { id: "pilates_clam", name: "Хясаа", en: "Clam", pat: "core", m: ["glutes"], lv: 1, pos: "side", reps: 12, sides: "each", pil: { t: 1, n: null }, snack: true,
    cue: ["Хажуугаар хэвтэж өвдгөө нугал, өсгий нийлсэн.", "Дээд өвдгөө хясаа нээх мэт өргө, аарцаг хойш эргэхгүй."],
    mis: ["Аарцаг хойш унах"], pro: "pilates_side_leg_lift" });
  E("pilates", { id: "pilates_side_kick", name: "Хажуугийн цохилт", en: "Side kick", pat: "core", m: ["glutes", "hams", "core"], lv: 2, pos: "side", reps: 10, sides: "each", pil: { t: 2, n: 21 },
    cue: ["Хажуугаар хэвтэж дээд хөлөө урагш хоёр удаа савлаад хойш сунга.", "Их бие хөдөлгөөнгүй."],
    mis: ["Бие дагаж найгах"], reg: "pilates_side_leg_lift", pro: "pilates_side_kick_kneeling" });
  E("pilates", { id: "pilates_teaser_prep", name: "Тизер (бэлтгэл)", en: "Teaser prep", pat: "core", m: ["core", "hipflex"], lv: 2, pos: "seated", reps: 6, c: ["pregnancy", "lowback", "postpartum"], pil: { t: 2, n: 22 },
    cue: ["Өвдгөө нугалж хөл шалан дээр, хойш хагас хэвтээд гараа урагш.", "Нэг хөлөө сунгаж тэнцвэр барь."],
    mis: ["Нуруу бөгтийх"], reg: "pilates_half_roll_back", pro: "pilates_teaser" });
  E("pilates", { id: "pilates_teaser", name: "Тизер", en: "Teaser", pat: "core", m: ["core", "hipflex"], lv: 4, reps: 5, c: ["pregnancy", "lowback", "neck", "postpartum"], pil: { t: 3, n: 22 },
    cue: ["Хэвтээ байрлалаас гар, хөлөө зэрэг өргөж V хэлбэрт ор.", "Нэг нугаламаар буу."],
    mis: ["Савлаж босох"], reg: "pilates_teaser_prep", pro: "pilates_boomerang" });
  E("pilates", { id: "pilates_hip_twist", name: "Хонго эргүүлэх", en: "Hip twist", pat: "rotation", m: ["core", "hipflex"], lv: 4, pos: "seated", reps: 5, c: ["pregnancy", "lowback", "postpartum"], pil: { t: 3, n: 23 },
    cue: ["Гараа ардаа тулж хөлөө дээш сунга.", "Хөлөөрөө тойрог зур, аарцаг тогтвортой."],
    mis: ["Мөр чихэнд"], reg: "pilates_corkscrew" });
  E("pilates", { id: "pilates_swimming_prep", name: "Сэлэлт (бэлтгэл)", en: "Swimming prep", pat: "pull", m: ["back", "glutes"], lv: 1, pos: "prone", reps: 10, sides: "each", c: ["pregnancy"], pil: { t: 1, n: 24 },
    cue: ["Гэдсээр хэвтэж эсрэг гар, хөлөө ээлжлэн өргө.", "Харц шал руу, аарцаг шалан дээр."],
    mis: ["Толгой гэдийх"], pro: "pilates_swimming" });
  E("pilates", { id: "pilates_swimming", name: "Сэлэлт", en: "Swimming", pat: "pull", m: ["back", "glutes", "shoulders"], lv: 2, pos: "prone", reps: 20, c: ["pregnancy", "lowback"], pil: { t: 2, n: 24 },
    cue: ["Гар, хөлөө бүгдийг шалнаас өргө.", "Сэлж буй мэт ээлжлэн хурдан савла, 5 тоолж авч 5 тоолж гарга."],
    mis: ["Хүзүү хэт гэдийх"], reg: "pilates_swimming_prep" });
  E("pilates", { id: "pilates_leg_pull_front", name: "Планк хөл өргөлт", en: "Leg pull front", pat: "push", m: ["core", "shoulders", "glutes"], lv: 3, pos: "prone", reps: 6, sides: "each", c: ["wrist", "pregnancy", "postpartum"], pil: { t: 2, n: 25 },
    cue: ["Гар дээрх планкаас нэг хөлөө дээш өргөөд буулга.", "Аарцаг тэгш, мөр бугуйн дээр."],
    mis: ["Хонго дээш гарах"], reg: "plank_hands", pro: "pilates_leg_pull_back" });
  E("pilates", { id: "pilates_leg_pull_back", name: "Урвуу планк хөл өргөлт", en: "Leg pull back", pat: "push", m: ["glutes", "triceps", "core", "shoulders"], lv: 4, pos: "seated", reps: 6, sides: "each", c: ["wrist", "shoulder"], pil: { t: 3, n: 26 },
    cue: ["Урвуу планк (гар ардаа) байрлалаас нэг хөлөө өргө.", "Хонго өндөр, цээж нээлттэй."],
    mis: ["Хонго унах"], reg: "pilates_leg_pull_front" });
  E("pilates", { id: "pilates_side_kick_kneeling", name: "Өвдөглөж хажуугийн цохилт", en: "Side kick kneeling", pat: "balance", m: ["glutes", "core"], lv: 3, pos: "kneeling", reps: 8, sides: "each", c: ["knee", "wrist"], pil: { t: 3, n: 27 },
    cue: ["Нэг өвдөг, нэг гар дээрээ тулж нөгөө хөлөө хонгоны өндөрт өргө.", "Урагш хойш савла, их бие тогтвортой."],
    mis: ["Хонго буух"], reg: "pilates_side_kick" });
  E("pilates", { id: "pilates_mermaid", name: "Лусын дагина", en: "Mermaid", pat: "rotation", m: ["core", "spine"], lv: 1, pos: "seated", br: 4, sides: "each", pil: { t: 1, n: 28 }, snack: true,
    cue: ["Хөлөө нэг тал руу нугалж суу.", "Нэг гараа дээш сунгаж эсрэг тал руу хажуугаар бөхий."],
    mis: ["Урагш эргэх"], pro: "pilates_side_bend" });
  E("pilates", { id: "pilates_side_bend", name: "Хажуугийн планк (пилатес)", en: "Side bend", pat: "core", m: ["core", "shoulders"], lv: 3, pos: "side", reps: 5, sides: "each", c: ["wrist", "shoulder"], pil: { t: 3, n: 28 },
    cue: ["Нэг гар дээрээ тулж хонгоо дээш өргөн нуман хэлбэрт ор.", "Дээд гараа толгой дээгүүр сунга."],
    mis: ["Мөр чихэнд"], reg: "pilates_mermaid" });
  E("pilates", { id: "pilates_boomerang", name: "Бумеранг", en: "Boomerang", pat: "core", m: ["core", "hams"], lv: 5, pos: "seated", reps: 4, c: ["pregnancy", "lowback", "neck", "inversion", "postpartum"], pil: { t: 3, n: 29 },
    cue: ["Хөлөө давхарлан хойш өнхрөөд хөлөө солиод тизер болон босож ир.", "Гараа ардаа нийлүүлж урагш бөхий, хөдөлгөөн бүр хяналттай."],
    mis: ["Хяналтгүй өнхрөх"], reg: "pilates_teaser" });
  E("pilates", { id: "pilates_seal", name: "Далайн хав", en: "Seal", pat: "core", m: ["core", "spine"], lv: 2, pos: "seated", reps: 8, c: ["pregnancy", "lowback", "neck"], pil: { t: 2, n: 30 },
    cue: ["Шагайгаа дотроос нь барьж хөлөө шалнаас өргө.", "Хойш өнхрөөд улаа гурван удаа алгадаж буцаж ир."],
    mis: ["Толгой шалд хүрэх"], reg: "pilates_rolling_ball" });
  E("pilates", { id: "pilates_crab", name: "Хавч", en: "Crab", pat: "core", m: ["core", "spine"], lv: 4, pos: "seated", reps: 5, c: ["pregnancy", "lowback", "neck", "knee"], pil: { t: 3, n: 31 },
    cue: ["Хөлөө зөрүүлж улаа барь, хойш өнхрөөд хөлөө солио.", "Урагш ирэхдээ оройгоо шалд зөөлөн хүргэ, хүзүүнд жин тавихгүй."],
    mis: ["Хүзүүнд жин унах"], reg: "pilates_seal" });
  E("pilates", { id: "pilates_rocking", name: "Хөвөх", en: "Rocking", pat: "pull", m: ["back", "quads", "chest"], lv: 4, pos: "prone", reps: 5, c: ["pregnancy", "lowback", "knee", "shoulder"], pil: { t: 3, n: 32 },
    cue: ["Нумын позоос урагш хойш хөв, амьсгалаа дага.", "Авахад цээж өргөгдөж, гаргахад гуя өргөгдөнө."],
    mis: ["Өвдөг хоёр тийш нээгдэх"], reg: "pilates_swan" });
  E("pilates", { id: "pilates_control_balance", name: "Хяналттай тэнцвэр", en: "Control balance", pat: "balance", m: ["core", "hams", "glutes"], lv: 5, reps: 4, sides: "each", c: ["pregnancy", "neck", "inversion", "lowback"], pil: { t: 3, n: 33 },
    cue: ["Хөлөө толгойн дээгүүр аваачиж нэг шагайгаа барь, нөгөө хөлөө дээш сунга.", "Хөлөө ээлжлэн солино, жин мөрөн дээр."],
    mis: ["Хүзүүнд жин"], reg: "pilates_jackknife" });
  E("pilates", { id: "pilates_pushup", name: "Пилатес шахалт", en: "Pilates push-up", pat: "push", m: ["chest", "triceps", "core"], lv: 3, reps: 5, c: ["wrist", "pregnancy", "postpartum"], pil: { t: 2, n: 34 },
    cue: ["Зогсоо байрлалаас урагш бөхийж гараа планк хүртэл алхуул.", "Тохой биедээ наалдсан гурван шахалт хийгээд буцаж алхаж бос."],
    mis: ["Тохой хажуу тийш нээгдэх"], reg: "pushup_knee" });
  E("pilates", { id: "pilates_roll_over", name: "Хөл толгой дээгүүр", en: "Roll over", pat: "core", m: ["core", "hams", "spine"], lv: 4, reps: 5, c: ["pregnancy", "lowback", "neck", "inversion", "hypertension"], pil: { t: 3, n: 3 },
    cue: ["Хөлөө дээш сунгаж толгойн дээгүүр аваачаад хөлөө салгаж нэг нугаламаар буу.", "Гар шалд дарагдсан, хүзүүнд жин тавихгүй."],
    mis: ["Савлах"], reg: "pilates_roll_up" });

  /* ============================ МОБИЛИТИ ============================ */
  E("mobility", { id: "pelvic_tilt", name: "Аарцаг хөдөлгөх", en: "Pelvic tilt", m: ["core", "spine"], eq: ["mat"], lv: 1, pos: "supine", reps: 10, c: ["pregnancy"], snack: true,
    cue: ["Нуруугаар хэвтэж өвдгөө нугал.", "Ууцаа шалд дарж аарцгаа өөр лүүгээ эргүүл, дараа нь суллаж хонхор үүсгэ.", "Хөдөлгөөн жижиг, амьсгалтайгаа."],
    mis: ["Өгзгөө шалнаас өргөх"], pro: "dead_bug" });
  E("mobility", { id: "dead_bug", name: "Үхсэн цох", en: "Dead bug", m: ["core"], eq: ["mat"], lv: 1, pos: "supine", reps: 8, sides: "each", c: ["pregnancy"], snack: true,
    cue: ["Гараа дээш, хөлөө ширээний байрлалд.", "Амьсгал гаргангаа эсрэг гар, хөлөө сунгаад буцаа.", "Ууц шалнаас салахгүй."],
    mis: ["Нуруу хотойх"], reg: "pelvic_tilt", pro: "leg_lower" });
  E("mobility", { id: "glute_bridge_march", name: "Гүүр дээр алхах", en: "Glute bridge march", pat: "hinge", m: ["glutes", "core"], eq: ["mat"], lv: 2, pos: "supine", reps: 10, sides: "each", c: ["pregnancy"],
    cue: ["Гүүрийн байрлалд өвдгөө ээлжлэн цээж рүүгээ өргө.", "Аарцаг хазайхгүй."],
    mis: ["Аарцаг унах"], reg: "glute_bridge", pro: "glute_bridge_single" });
  E("mobility", { id: "pelvic_floor", name: "Аарцгийн ёроолын булчин агшаах", en: "Pelvic floor contractions (Kegel)", m: ["core"], eq: [], lv: 1, pos: "seated", sec: 5, reps: 10, snack: true,
    cue: ["Шээс тогтоох мэт аарцгийн ёроолын булчингаа дотогш, дээш татаад 5 секунд барь.", "Өгзөг, гуя, гэдэс чангалахгүй, жигд амьсгал.", "Бүрэн сулла, дараа нь дахин."],
    mis: ["Амьсгалаа барих", "Өгзгөөр чангалах"] });
  E("mobility", { id: "chin_tuck", name: "Эрүү татах", en: "Chin tuck", m: ["neck"], eq: [], lv: 1, pos: "seated", sec: 5, reps: 10, snack: true,
    cue: ["Шулуун сууж харцаа урагш байлга.", "Эрүүгээ хойш татаж “давхар эрүү” үүсгээд 5 секунд барь.", "Толгойгоо доош бөхийлгөхгүй."],
    mis: ["Толгой доош бөхийх"], pro: "wall_angel" });
  E("mobility", { id: "neck_side_stretch", name: "Хүзүү хажуу сунгах", en: "Neck side stretch", m: ["neck"], eq: [], lv: 1, pos: "seated", sec: 20, sides: "each", snack: true,
    cue: ["Нэг чихээ мөр рүүгээ ойртуулж нөгөө мөрөө доош тат.", "Гараараа зөөлөн дарж болно, хүчлэхгүй."],
    mis: ["Мөр дээш өргөгдөх"] });
  E("mobility", { id: "neck_rotation", name: "Хүзүү эргүүлэх", en: "Neck rotation", m: ["neck"], eq: [], lv: 1, pos: "seated", reps: 6, sides: "each", snack: true,
    cue: ["Эрүүгээ мөр рүүгээ аажуу эргүүлж 3 секунд зогс.", "Мөр хөдлөхгүй."],
    mis: ["Хурдан эргүүлэх"] });
  E("mobility", { id: "shoulder_rolls", name: "Мөр эргүүлэх", en: "Shoulder rolls", pat: "pull", m: ["shoulders", "neck"], eq: [], lv: 1, reps: 10, snack: true,
    cue: ["Мөрөө дээш, хойш, доош том тойргоор эргүүл.", "Амьсгалаа дага."],
    mis: ["Жижиг хурдан тойрог"] });
  E("mobility", { id: "arm_circles", name: "Гар эргүүлэх", pat: "push", en: "Arm circles", m: ["shoulders"], eq: [], lv: 1, reps: 10, snack: true,
    cue: ["Гараа хоёр тийш сунгаж жижгээс том тойрог руу эргүүл.", "Хоёр чигт."],
    mis: ["Мөр чихэнд"] });
  E("mobility", { id: "shoulder_cars", name: "Мөрний тойрог (CARs)", en: "Shoulder CARs", pat: "pull", m: ["shoulders"], eq: [], lv: 2, reps: 5, sides: "each", c: ["shoulder"],
    cue: ["Нэг гараа шулуун урагш, дээш, хойш хамгийн том тойргоор аажуу эргүүл.", "Бие хөдлөхгүй, зөвхөн мөр."],
    mis: ["Бие дагаж эргэх"], reg: "arm_circles" });
  E("mobility", { id: "wall_angel", name: "Ханан дээрх тэнгэр элч", en: "Wall angel", pat: "pull", m: ["shoulders", "back"], eq: ["wall"], lv: 1, reps: 8, snack: true,
    cue: ["Нуруу, толгойгоо хананд наа, хөл арай урагш.", "Тохой, бугуйгаа хананд наалдуулж гараа дээш, доош гулсуул."],
    mis: ["Ууц хананаас салах"], reg: "chin_tuck", pro: "wall_slide" });
  E("mobility", { id: "chest_wall_stretch", name: "Цээж сунгах (хана)", en: "Chest wall stretch", pat: "push", m: ["chest", "shoulders"], eq: ["wall"], lv: 1, sec: 30, sides: "each", snack: true,
    cue: ["Шууг хананд мөрний түвшинд тавь.", "Биеэ ханаас аажуу эргүүлж цээжний сунгалтыг мэдэр."],
    mis: ["Мөр урагш эргэх"] });
  E("mobility", { id: "lat_stretch_wall", name: "Дал, хажуу сунгах", en: "Lat stretch at wall", pat: "pull", m: ["back", "shoulders"], eq: ["wall"], lv: 1, sec: 30, sides: "each",
    cue: ["Гараа хананд тавьж хонгоо хойш татаж бөхий.", "Суганы доорх сунгалтыг мэдэр."],
    mis: ["Нуруу хотойх"] });
  E("mobility", { id: "thoracic_rotation", name: "Дөрвөн мөчөөр цээж эргүүлэх", en: "Quadruped thoracic rotation", pat: "rotation", m: ["spine", "back"], eq: ["mat"], lv: 1, pos: "kneeling", reps: 8, sides: "each", c: ["wrist"],
    cue: ["Дөрвөн мөчөөрөө зогсож нэг гараа толгойны ард тавь.", "Тохойгоо тэнгэр рүү эргүүлж харцаа дага, буцаад тохойгоо нөгөө гарын доогуур."],
    mis: ["Хонго дагаж эргэх"], pro: "open_book" });
  E("mobility", { id: "open_book", name: "Ном дэлгэх", en: "Open book", pat: "rotation", m: ["spine", "chest"], eq: ["mat"], lv: 1, pos: "side", reps: 8, sides: "each", snack: true,
    cue: ["Хажуугаар хэвтэж өвдгөө 90 градус нугалж гараа урагш нийлүүл.", "Дээд гараа ном дэлгэх мэт нөгөө тал руу нээж харцаа дага.", "Өвдөг шалан дээр үлдэнэ."],
    mis: ["Өвдөг хөндийрөх"] });
  E("mobility", { id: "thoracic_ext_chair", name: "Сандлын түшлэгт цээж гэдийх", en: "Thoracic extension over chair", pat: "pull", m: ["spine", "chest"], eq: ["chair"], lv: 1, pos: "seated", reps: 8, snack: true,
    cue: ["Сандлын түшлэг дээр далныхаа доод хэсгийг тавь.", "Гараа толгойны ард, амьсгал гаргангаа цээжээ хойш нээ."],
    mis: ["Ууцаар гэдийх"] });
  E("mobility", { id: "seated_twist_chair", name: "Сандалд сууж эргэх", en: "Seated chair twist", pat: "rotation", m: ["spine", "core"], eq: ["chair"], lv: 1, pos: "seated", br: 4, sides: "each", snack: true,
    cue: ["Сандалд шулуун сууж нэг гараараа түшлэгийг барь.", "Амьсгал гаргангаа цээжээ эргүүл, аарцаг урагш хэвээр."],
    mis: ["Хүзүүгээр л эргэх"] });
  E("mobility", { id: "wrist_stretch", name: "Бугуй сунгах", en: "Wrist flexor and extensor stretch", pat: "push", m: ["shoulders"], eq: [], lv: 1, pos: "seated", sec: 20, sides: "each", snack: true,
    cue: ["Нэг гараа урагш сунгаж алгаа дээш хар, хуруугаа нөгөө гараараа зөөлөн доош тат.", "Дараа нь алгаа доош харуулж давт."],
    mis: ["Тохой нугалах"] });
  E("mobility", { id: "hip_cars", name: "Хонгоны тойрог", en: "Hip CARs", pat: "balance", m: ["hipflex", "glutes"], eq: ["wall"], lv: 2, reps: 5, sides: "each", c: ["hip"],
    cue: ["Ханыг түшиж нэг өвдгөө цээж рүү өргө, хажуу тийш нээж, хойш эргүүл.", "Аарцаг, их бие хөдөлгөөнгүй."],
    mis: ["Бие хажуу тийш хазайх"], reg: "hip_circles" });
  E("mobility", { id: "hip_circles", name: "Хонго эргүүлэх", en: "Standing hip circles", pat: "balance", m: ["hipflex", "glutes"], eq: [], lv: 1, reps: 8, snack: true,
    cue: ["Гараа ташаандаа тавьж аарцгаараа том тойрог зур.", "Хоёр чигт."],
    mis: ["Өвдөг түгжих"] });
  E("mobility", { id: "leg_swings", name: "Хөл савлах", en: "Leg swings", pat: "balance", m: ["hipflex", "hams", "glutes"], eq: ["wall"], lv: 2, reps: 10, sides: "each",
    cue: ["Ханыг түшиж нэг хөлөө урагш хойш сул савла.", "Их бие шулуун, савлалт аажмаар томорно."],
    mis: ["Нуруугаар савлах"], reg: "hip_circles" });
  E("mobility", { id: "hip_flexor_kneel", name: "Өвдөглөж хонгоны урд сунгах", en: "Kneeling hip flexor stretch", pat: "lunge", m: ["hipflex", "quads"], eq: ["mat"], lv: 1, pos: "kneeling", sec: 30, sides: "each", c: ["knee"],
    cue: ["Нэг өвдөг дээрээ, нөгөө хөл урдаа.", "Өгзгөө чангалж аарцгаа урагш түлх, нуруугаар гэдийхгүй."],
    mis: ["Ууцаар гэдийх"], pro: "couch_stretch" });
  E("mobility", { id: "couch_stretch", name: "Буйдангийн сунгалт", en: "Couch stretch", pat: "lunge", m: ["hipflex", "quads"], eq: ["wall", "mat"], lv: 2, pos: "kneeling", sec: 30, sides: "each", c: ["knee"],
    cue: ["Нэг өвдгөө хананы ёроолд тавьж шилбээ хана дагуу дээш.", "Нөгөө хөлөө урдаа тавьж биеэ аажуу босго, өгзөг чангарсан."],
    mis: ["Ууцаар гэдийх"], reg: "hip_flexor_kneel" });
  E("mobility", { id: "quad_stretch_wall", name: "Гуяны урд сунгах", en: "Standing quad stretch", pat: "balance", m: ["quads", "hipflex"], eq: ["wall"], lv: 1, sec: 30, sides: "each", c: ["knee"],
    cue: ["Ханыг түшиж нэг шагайгаа ардаасаа барь.", "Өвдөг хоёр зэрэгцсэн, аарцаг урагш."],
    mis: ["Ууцаар гэдийх"] });
  E("mobility", { id: "hamstring_doorway", name: "Хаалганы хүрээнд гуяны ар сунгах", en: "Doorway hamstring stretch", pat: "hinge", m: ["hams"], eq: ["mat"], lv: 1, pos: "supine", sec: 30, sides: "each", c: ["pregnancy"],
    cue: ["Хаалганы хүрээний дэргэд нуруугаар хэвтэж нэг хөлөө хүрээнд налуул.", "Нөгөө хөл хаалгаар шулуун.", "Ойртох тусам сунгалт нэмэгдэнэ."],
    mis: ["Аарцаг эргэх"], pro: "hamstring_chair" });
  E("mobility", { id: "hamstring_chair", name: "Сандалд хөл тавьж гуяны ар сунгах", en: "Hamstring stretch on chair", pat: "hinge", m: ["hams"], eq: ["chair"], lv: 1, sec: 30, sides: "each",
    cue: ["Нэг өсгийгөө сандал дээр тавьж өвдгөө шулуун байлга.", "Нуруу шулуун, хонгоноосоо урагш бөхий."],
    mis: ["Нуруу бөгтийх"] });
  E("mobility", { id: "calf_stretch_wall", name: "Ханан дээр шилбэ сунгах", en: "Wall calf stretch", pat: "gait", m: ["calves"], eq: ["wall"], lv: 1, sec: 30, sides: "each", snack: true,
    cue: ["Ханыг гараараа түшиж нэг хөлөө хойш тавь.", "Хойд өсгий шалан дээр, өвдөг шулуун, аарцаг урагш."],
    mis: ["Хойд өсгий өргөгдөх"], pro: "ankle_knee_wall" });
  E("mobility", { id: "ankle_knee_wall", name: "Өвдөг хана руу (шагай)", en: "Knee-to-wall ankle mobility", pat: "gait", m: ["calves"], eq: ["wall"], lv: 1, reps: 10, sides: "each", c: ["ankle"],
    cue: ["Хөлийн үзүүрийг ханаас 10 см зайд тавь.", "Өсгийгөө өргөлгүй өвдгөө хана руу хүргэ."],
    mis: ["Өсгий өргөгдөх", "Өвдөг дотогш"], reg: "calf_stretch_wall" });
  E("mobility", { id: "ankle_circles", name: "Шагай эргүүлэх", en: "Ankle circles", pat: "gait", m: ["calves"], eq: [], lv: 1, pos: "seated", reps: 10, sides: "each", snack: true,
    cue: ["Нэг хөлөө өргөж шагайгаараа том тойрог зур.", "Хоёр чигт."],
    mis: ["Хурдлах"] });
  E("mobility", { id: "seated_figure4", name: "Сандалд 4-ийн зураг", en: "Seated figure four", m: ["glutes", "hipflex"], eq: ["chair"], lv: 1, pos: "seated", sec: 30, sides: "each", snack: true,
    cue: ["Нэг шагайгаа нөгөө өвдөгний дээр тавь.", "Нуруу шулуун, урагш бага бөхий."],
    mis: ["Нуруу бөгтийх"], pro: "yoga_figure4" });
  E("mobility", { id: "hip_9090", name: "Хонго 90/90", en: "90/90 hip stretch", m: ["glutes", "hipflex", "adductors"], eq: ["mat"], lv: 2, pos: "seated", sec: 30, sides: "each", c: ["hip", "knee"],
    cue: ["Урд хөлөө 90 градус урдаа, хойд хөлөө 90 градус хажуудаа тавь.", "Нуруу шулуун, урд хөл дээгүүрээ бөхий, дараа нь хойд хөл рүү эргэ."],
    mis: ["Ууц бөгтийх"], reg: "seated_figure4" });
  E("mobility", { id: "adductor_rock", name: "Гуяны дотор тал сунгах", en: "Adductor rock back", pat: "squat", m: ["adductors"], eq: ["mat"], lv: 2, pos: "kneeling", reps: 8, sides: "each", c: ["knee", "wrist"],
    cue: ["Дөрвөн мөчөөс нэг хөлөө хажуу тийш шулуун сунга.", "Хонгоо хойш өсгий рүүгээ түлхээд буцаа."],
    mis: ["Нуруу бөгтийх"], pro: "frog_stretch" });
  E("mobility", { id: "frog_stretch", name: "Мэлхий", en: "Frog stretch", pat: "squat", m: ["adductors", "hipflex"], eq: ["mat"], lv: 2, pos: "kneeling", sec: 30, c: ["knee", "hip"],
    cue: ["Өвдгөө өргөн тавьж шилбээ зэрэгцүүл, тохой дээрээ тул.", "Хонгоо хойш аажуу түлх."],
    mis: ["Ууц хотойх"], reg: "adductor_rock" });
  E("mobility", { id: "worlds_greatest_stretch", name: "Дэлхийн хамгийн сайн сунгалт", en: "World's greatest stretch", pat: "lunge", m: ["hipflex", "spine", "hams"], eq: ["mat"], lv: 2, reps: 5, sides: "each", c: ["knee"],
    cue: ["Урагш гүн алхаж хоёр гараа урд хөлийн дотор талд тавь.", "Урд талын тохойгоо шал руу буулгаад, тэр гараа тэнгэр рүү эргүүл.", "Хойд хөл шулуун."],
    mis: ["Хойд өвдөг унах"], reg: "hip_flexor_kneel" });
  E("mobility", { id: "inchworm", name: "Хорхойн алхаа", en: "Inchworm", pat: "push", m: ["hams", "core", "shoulders"], eq: ["mat"], lv: 3, reps: 6, c: ["wrist", "pregnancy"],
    cue: ["Урагш бөхийж гараараа планк хүртэл алхаад хөлөөрөө гар руугаа буцаж алх.", "Өвдөг зөөлөн нугалаатай."],
    mis: ["Хонго унжих"], reg: "worlds_greatest_stretch" });

  /* ============================ АМЬСГАЛ ============================ */
  E("breath", { id: "diaphragm_breathing", name: "Гэдсээр амьсгалах", en: "Diaphragmatic breathing", m: ["core"], eq: [], lv: 1, pos: "seated", br: 10, snack: true,
    cue: ["Нэг гараа цээжин дээр, нөгөөг гэдсэн дээр тавь.", "Хамраар авахад гэдэс өргөгдөж, цээж бараг хөдлөхгүй.", "Амаар аажуу гарга."],
    mis: ["Мөрөөрөө амьсгалах"], pro: "box_breathing" });
  E("breath", { id: "box_breathing", name: "Дөрвөлжин амьсгал", en: "Box breathing", m: ["core"], eq: [], lv: 1, pos: "seated", br: 8, snack: true,
    cue: ["4 тоолж ав, 4 тоолж барь, 4 тоолж гарга, 4 тоолж хүлээ.", "Толгой эргэвэл тооллоо богиносго."],
    mis: ["Хүчлэн барих"], reg: "diaphragm_breathing" });
  E("breath", { id: "breath_478", name: "4-7-8 амьсгал", en: "4-7-8 breathing", m: ["core"], eq: [], lv: 1, pos: "seated", br: 4, c: ["pregnancy"], snack: true,
    cue: ["4 тоолж хамраар ав, 7 тоолж барь, 8 тоолж амаар гарга.", "Унтахын өмнө 4 удаа л хангалттай."],
    mis: ["Эхний өдрүүдэд 4-өөс олон давтах"], reg: "extended_exhale" });
  E("breath", { id: "extended_exhale", name: "Уртасгасан гаргалт", en: "Extended exhale (1:2)", m: ["core"], eq: [], lv: 1, pos: "seated", br: 10, snack: true,
    cue: ["4 тоолж авч 8 тоолж гарга.", "Гаргалт урт байх тусам бие тайвширна."],
    mis: ["Авалтаа хэт гүнзгийрүүлэх"], reg: "diaphragm_breathing" });
  E("breath", { id: "coherent_breathing", name: "Жигд амьсгал (5-5)", en: "Coherent breathing", m: ["core"], eq: [], lv: 1, pos: "seated", br: 30, snack: true,
    cue: ["5 секунд ав, 5 секунд гарга, минутад 6 удаа.", "Хамраар, чимээгүй, 5 минут үргэлжлүүл."],
    mis: ["Тоолохдоо хурдлах"], reg: "diaphragm_breathing" });
  E("breath", { id: "bhramari", name: "Зөгийн дуун амьсгал", en: "Humming bee breath", m: ["core"], eq: [], lv: 1, pos: "seated", br: 6, snack: true,
    cue: ["Нүдээ аниад амьсгал ав.", "Амаа хааж “ммм” гэж дуугарч гарга, толгойд чичиргээ мэдрэгдэнэ."],
    mis: ["Хэт чанга дуугарах"], reg: "extended_exhale" });
  E("breath", { id: "nadi_shodhana", name: "Хамрын ээлжит амьсгал", en: "Alternate nostril breathing", m: ["core"], eq: [], lv: 2, pos: "seated", br: 10,
    cue: ["Баруун эрхий хуруугаар баруун хамраа дарж зүүнээр ав.", "Зүүн хамраа дараад баруунаар гарга, баруунаар аваад зүүнээр гарга."],
    mis: ["Хамраа хэт чанга дарах"], reg: "coherent_breathing" });
  E("breath", { id: "physiological_sigh", name: "Хос авалттай санаа алдалт", en: "Physiological sigh", m: ["core"], eq: [], lv: 1, pos: "seated", br: 3, snack: true,
    cue: ["Хамраар гүн аваад дээр нь дахиад богино ав.", "Амаар урт, удаан гарга.", "Стресс ихтэй үед 1–3 удаа л хангалттай."],
    mis: ["Хоёр дахь авалтаа мартах"] });
  E("breath", { id: "ujjayi", name: "Далайн амьсгал", en: "Ujjayi breath", m: ["core"], eq: [], lv: 2, pos: "seated", br: 10,
    cue: ["Амаа хааж хоолойгоо бага нарийсгаж амьсгал.", "Далайн давалгаа мэт зөөлөн чимээ гарна."],
    mis: ["Хоолойгоо хэт чангалах"], reg: "diaphragm_breathing" });
  E("breath", { id: "yoga_nidra", name: "Йога нидра", en: "Yoga nidra", m: ["fullbody"], eq: ["mat"], lv: 1, pos: "supine", sec: 720,
    cue: ["Шавасанаар хэвтэж (жирэмсэн бол хажуугаар) биеэ дулаан хучаад нүдээ ань.", "Анхаарлаа хөлийн хуруунаас толгой хүртэл биеийн хэсэг бүрээр аажуу шилжүүл.", "Унтах шаардлагагүй, зүгээр л ажигла."],
    mis: ["Утасны мэдэгдэл асаалттай орхих"], reg: "yoga_savasana" });

  /* ============================ КАРДИО, АЛХАЛТ ============================ */
  E("cardio", { id: "walk_easy", name: "Тайван алхалт", en: "Easy walk", m: ["fullbody", "calves"], eq: [], lv: 1, sec: 900, imp: 0,
    cue: ["Ярьж чадахаар хурдтай алх.", "Мөр сул, харц урагш."],
    mis: ["Утас харсаар толгой доош унжих"], pro: "walk_brisk" });
  E("cardio", { id: "walk_post_meal", name: "Хоолны дараах алхалт", en: "Post-meal walk", m: ["fullbody"], eq: [], lv: 1, sec: 600, imp: 0,
    cue: ["Хоол идсэнээс 10–15 минутын дараа 10 минут алх.", "Хурд тайван, гэрийн дотор ч болно."],
    mis: ["Хоолны дараа шууд хэвтэх"], pro: "walk_brisk" });
  E("cardio", { id: "walk_brisk", name: "Хурдан алхалт", en: "Brisk walk", m: ["fullbody", "calves", "glutes"], eq: [], lv: 1, sec: 1200,
    cue: ["Ярьж чадах ч дуулж чадахгүй хурдтай алх.", "Гараа тохойноос нугалж идэвхтэй савла, алхаа богино, хурдан."],
    mis: ["Алхмаа хэт уртасгах"], reg: "walk_easy", pro: "walk_interval" });
  E("cardio", { id: "walk_interval", name: "Япон алхалт (3/3)", en: "Interval walking (3 min fast / 3 min slow)", m: ["fullbody", "calves", "glutes"], eq: [], lv: 2, sec: 1800,
    cue: ["3 минут хурдан (ярихад хэцүү), 3 минут тайван алх.", "5 удаа давт, нийт 30 минут.", "Долоо хоногт 4 удаа хийвэл үр дүн нь харагдана."],
    mis: ["Хурдан хэсэгтээ хангалттай хурдлахгүй байх"], reg: "walk_brisk" });
  E("cardio", { id: "stair_climb", name: "Шатаар өгсөх", en: "Stair climbing", m: ["quads", "glutes", "calves"], eq: [], lv: 2, sec: 300, c: ["knee"], snack: true,
    cue: ["Бариулыг хэрэгтэй бол түшиж, гишгүүр бүрт бүтэн ул тавь.", "Өгсөхдөө хурдан, буухдаа удаан."],
    mis: ["Хөлийн үзүүрээр гишгэх"], reg: "step_up" });
  E("cardio", { id: "march_in_place", name: "Зогсоод алхах", en: "Marching in place", m: ["hipflex", "calves", "fullbody"], eq: [], lv: 1, sec: 180, imp: 0, snack: true,
    cue: ["Өвдгөө ташааны өндөрт ээлжлэн өргө.", "Гараа дагуулж савла, бие шулуун."],
    mis: ["Урагш бөхийх"], reg: "seated_march", pro: "high_knee_march" });
  E("cardio", { id: "high_knee_march", name: "Өвдөг өндөр алхалт", en: "High-knee march", m: ["hipflex", "core", "calves"], eq: [], lv: 2, sec: 120, c: ["hip"],
    cue: ["Өвдгөө ташаанаас дээш өргөж хурдан алх.", "Бие шулуун, хөлийн үзүүрээр зөөлөн буу."],
    mis: ["Хойш гэдийх"], reg: "march_in_place", pro: "jumping_jack" });
  E("cardio", { id: "step_touch", name: "Хажуу гишгэлт", en: "Step touch", m: ["glutes", "calves", "fullbody"], eq: [], lv: 1, sec: 180, imp: 0, snack: true,
    cue: ["Нэг хөлөө хажуу тийш гишгээд нөгөөг нь дэргэд нь нийлүүл.", "Нөгөө тал руу давт, гараа дагуул."],
    mis: ["Өвдөг түгжих"], pro: "shadow_boxing" });
  E("cardio", { id: "shadow_boxing", name: "Сүүдэртэй бокс", en: "Shadow boxing", pat: "rotation", m: ["shoulders", "core", "fullbody"], eq: [], lv: 2, sec: 180, c: ["shoulder"],
    cue: ["Хөлөө мөрний өргөнтэй, өвдөг зөөлөн.", "Шулуун, дэгээ цохилтыг ээлжилж хонгоороо эргэ.", "Тохойгоо бүрэн түгжихгүй."],
    mis: ["Тохой түгжих"], reg: "step_touch" });
  E("cardio", { id: "jumping_jack", name: "Үсрэлттэй дэлгэлт", en: "Jumping jack", m: ["fullbody", "calves", "shoulders"], eq: [], lv: 2, sec: 60, imp: 2, c: ["knee", "ankle", "pregnancy", "postpartum"],
    cue: ["Хөлөө дэлгэнгээ гараа дээш, буцаж нийлүүлнгээ гараа доош.", "Хөлийн үзүүрээр зөөлөн буу."],
    mis: ["Өсгийгөөр хатуу буух"], reg: "step_touch" });

  /* ============================ API ============================ */
  const byIdMap = new Map(exercises.map((e) => [e.id, e]));
  const arr = (v) => (v == null ? null : Array.isArray(v) ? v : [v]);

  function byId(id) { return byIdMap.get(id); }

  // filter({ type, pattern, equipment, maxLevel, exclContra, position })
  //   type / pattern / position: string эсвэл массив (аль нэг нь таарна)
  //   equipment: хэрэглэгчид БАЙГАА хэрэгслийн жагсаалт ("none" → зөвхөн биеийн жин); дасгалын equipment ⊆ үүнд
  //   maxLevel: level ≤ maxLevel
  //   exclContra: эдгээр шалтгаантай дасгалыг хасна
  function filter(q) {
    q = q || {};
    const types = arr(q.type), pats = arr(q.pattern), poss = arr(q.position), excl = arr(q.exclContra);
    const have = q.equipment == null ? null : new Set(q.equipment.filter((x) => x !== "none"));
    return exercises.filter((e) => {
      if (types && !types.includes(e.type)) return false;
      if (pats && !pats.includes(e.pattern)) return false;
      if (poss && !poss.includes(e.position)) return false;
      if (q.maxLevel != null && e.level > q.maxLevel) return false;
      if (have && !e.equipment.every((x) => have.has(x))) return false;
      if (excl && e.contra.some((c) => excl.includes(c))) return false;
      return true;
    });
  }

  const FitLib = { exercises, byId, filter, TYPES, PATTERNS, CONTRA };
  const root = typeof window !== "undefined" ? window : globalThis;
  root.FitLib = FitLib;
  if (typeof module !== "undefined") module.exports = FitLib;
})();
