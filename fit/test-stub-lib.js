/* Туршилтын жижиг дасгалын сан. Зөвхөн `node fit/test.js`-д зориулагдсан:
   FIT_LIB=./test-stub-lib.js node fit/test.js
   Бодит сан нь fit/lib.js (өөр агент бичнэ), схем нь SPEC.md-ийн FitLib. */
(function (root) {
  "use strict";

  // E(id, name, en, type, pattern, muscles, equipment, level, position, impact, contra, unit, defaults, sides, regress, progress, extra)
  function E(id, name, en, type, pattern, muscles, equipment, level, position, impact, contra, unit, d, sides, regress, progress, extra) {
    var defaults = { sets: d[0], reps: null, seconds: null, breaths: null, rest: d[2] };
    if (unit === "reps") defaults.reps = d[1];
    else if (unit === "seconds") defaults.seconds = d[1];
    else defaults.breaths = d[1];
    var ex = {
      id: id, name: name, en: en, type: type, pattern: pattern, muscles: muscles, equipment: equipment,
      level: level, position: position, impact: impact, contra: contra, unit: unit, defaults: defaults,
      sides: sides, cues: ["Амьсгалаа барихгүй, жигд хий", "Хөдөлгөөнийг удаан, хяналттай хий"],
      mistakes: ["Хэт хурдан хийх"], regress: regress, progress: progress, snack: false
    };
    if (extra) for (var k in extra) ex[k] = extra[k];
    return ex;
  }
  var S = "strength", Y = "yoga", P = "pilates", M = "mobility", C = "cardio", B = "breath";
  var SN = { snack: true };
  function yoga(sanskrit, family, next, counter, snack) {
    return { yoga: { sanskrit: sanskrit, family: family, next: next, counter: counter || [] }, snack: !!snack };
  }
  function pil(tier, classical, snack) { return { pilates: { tier: tier, classical: classical }, snack: !!snack }; }

  var exercises = [
    // ---- Хүч: суулт ----
    E("squat_wall_sit", "Ханын суулт", "Wall sit", S, "squat", ["quads", "glutes"], ["wall"], 1, "standing", 0, [], "seconds", [2, 30, 45], "both", null, "squat_chair", SN),
    E("squat_chair", "Сандалд суугаад босох", "Chair squat", S, "squat", ["quads", "glutes"], ["chair"], 1, "standing", 0, [], "reps", [2, 10, 45], "both", "squat_wall_sit", "squat_bw", SN),
    E("squat_bw", "Суулт", "Bodyweight squat", S, "squat", ["quads", "glutes"], [], 2, "standing", 0, ["knee"], "reps", [3, 10, 60], "both", "squat_chair", "squat_jump"),
    E("squat_jump", "Үсрэлттэй суулт", "Jump squat", S, "squat", ["quads", "glutes", "calves"], [], 4, "standing", 2, ["knee", "ankle", "pregnancy", "postpartum", "hypertension"], "reps", [3, 8, 60], "both", "squat_bw", null),
    E("squat_goblet_db", "Гантель тэврэн суух", "Goblet squat", S, "squat", ["quads", "glutes", "core"], ["db"], 3, "standing", 0, ["knee"], "reps", [3, 8, 75], "both", "squat_bw", null),
    // ---- Хүч: алхсан суулт ----
    E("lunge_step_up", "Сандал дээр гишгэх", "Step-up", S, "lunge", ["quads", "glutes"], ["chair"], 2, "standing", 1, ["ankle"], "reps", [2, 8, 45], "each", "squat_chair", "lunge_reverse"),
    E("lunge_reverse", "Арагш алхсан суулт", "Reverse lunge", S, "lunge", ["quads", "glutes"], [], 2, "standing", 0, [], "reps", [2, 8, 60], "each", "lunge_step_up", "lunge_split"),
    E("lunge_split", "Хуваасан суулт", "Split squat", S, "lunge", ["quads", "glutes"], [], 3, "standing", 0, ["knee"], "reps", [3, 8, 60], "each", "lunge_reverse", null),
    // ---- Хүч: түнхний нугалалт ----
    E("hinge_bw", "Түнхний нугалалт", "Hip hinge", S, "hinge", ["hams", "glutes", "back"], [], 1, "standing", 0, [], "reps", [2, 10, 45], "both", null, "hinge_db_rdl", SN),
    E("hinge_db_rdl", "Гантельтэй румын татлага", "Dumbbell Romanian deadlift", S, "hinge", ["hams", "glutes", "back"], ["db"], 3, "standing", 0, ["lowback"], "reps", [3, 8, 75], "both", "hinge_bw", "hinge_kb_swing"),
    E("hinge_kb_swing", "Гир савах", "Kettlebell swing", S, "hinge", ["hams", "glutes", "back"], ["kb"], 4, "standing", 1, ["lowback", "pregnancy", "postpartum", "hypertension"], "reps", [3, 12, 60], "both", "hinge_db_rdl", null),
    E("hinge_glute_bridge", "Өгзөгний гүүр", "Glute bridge", S, "hinge", ["glutes", "hams", "core"], ["mat"], 1, "supine", 0, [], "reps", [2, 12, 45], "both", null, "hinge_single_bridge", SN),
    E("hinge_single_bridge", "Нэг хөлт гүүр", "Single-leg bridge", S, "hinge", ["glutes", "hams"], ["mat"], 3, "supine", 0, ["hip"], "reps", [3, 8, 60], "each", "hinge_glute_bridge", null),
    // ---- Хүч: түлхэлт ----
    E("push_wall", "Ханын түлхэлт", "Wall push-up", S, "push", ["chest", "triceps", "shoulders"], ["wall"], 1, "standing", 0, [], "reps", [2, 10, 45], "both", null, "push_incline", SN),
    E("push_incline", "Налуу түлхэлт", "Incline push-up", S, "push", ["chest", "triceps", "shoulders"], ["chair"], 2, "standing", 0, ["wrist"], "reps", [2, 8, 60], "both", "push_wall", "push_knee"),
    E("push_knee", "Өвдөгнөөс түлхэлт", "Knee push-up", S, "push", ["chest", "triceps", "shoulders"], ["mat"], 2, "kneeling", 0, ["wrist", "shoulder"], "reps", [3, 8, 60], "both", "push_incline", "push_full"),
    E("push_full", "Бүтэн түлхэлт", "Push-up", S, "push", ["chest", "triceps", "shoulders", "core"], [], 3, "prone", 0, ["wrist", "shoulder"], "reps", [3, 8, 75], "both", "push_knee", "push_pike"),
    E("push_pike", "Пайк түлхэлт", "Pike push-up", S, "push", ["shoulders", "triceps"], [], 4, "prone", 0, ["wrist", "shoulder", "inversion", "hypertension", "pregnancy"], "reps", [3, 6, 75], "both", "push_full", null),
    E("push_db_floor_press", "Шалан дээр гантель дарах", "Dumbbell floor press", S, "push", ["chest", "triceps"], ["db", "mat"], 2, "supine", 0, ["shoulder"], "reps", [3, 10, 60], "both", "push_wall", null),
    E("push_db_shoulder_press", "Гантель дээш дарах", "Dumbbell shoulder press", S, "push", ["shoulders", "triceps"], ["db"], 3, "standing", 0, ["shoulder", "hypertension"], "reps", [3, 8, 75], "both", "push_wall", null),
    // ---- Хүч: татлага ----
    E("pull_towel_iso", "Алчуур татах (изометрик)", "Towel isometric row", S, "pull", ["back", "biceps"], [], 1, "standing", 0, [], "seconds", [2, 20, 45], "both", null, "pull_band_row", SN),
    E("pull_band_pullapart", "Резин задлах", "Band pull-apart", S, "pull", ["back", "shoulders"], ["band"], 1, "standing", 0, [], "reps", [2, 15, 45], "both", "pull_towel_iso", "pull_band_row", SN),
    E("pull_band_row", "Резинтэй татлага", "Band row", S, "pull", ["back", "biceps"], ["band"], 2, "standing", 0, [], "reps", [3, 12, 60], "both", "pull_towel_iso", "pull_db_row"),
    E("pull_db_row", "Гантель татлага", "Dumbbell row", S, "pull", ["back", "biceps"], ["db", "chair"], 2, "standing", 0, ["lowback"], "reps", [3, 10, 60], "each", "pull_band_row", null),
    E("pull_superman", "Супермен", "Superman", S, "pull", ["back", "glutes", "spine"], ["mat"], 1, "prone", 0, ["lowback", "pregnancy"], "reps", [2, 10, 45], "both", "pull_towel_iso", null),
    // ---- Хүч: гол булчин ----
    E("core_curl_up", "МакГиллийн атирах", "McGill curl-up", S, "core", ["core"], ["mat"], 1, "supine", 0, ["pregnancy", "neck"], "reps", [2, 6, 30], "both", null, "core_dead_bug"),
    E("core_dead_bug", "Үхсэн цох", "Dead bug", S, "core", ["core"], ["mat"], 2, "supine", 0, ["pregnancy"], "reps", [2, 8, 45], "each", "core_curl_up", "core_plank"),
    E("core_bird_dog", "Шувуу нохой", "Bird dog", S, "core", ["core", "back", "glutes"], ["mat"], 1, "kneeling", 0, ["wrist"], "reps", [2, 6, 30], "each", null, "core_plank_knee", SN),
    E("core_plank_knee", "Өвдөгний планк", "Knee plank", S, "core", ["core", "shoulders"], ["mat"], 1, "kneeling", 0, ["shoulder", "wrist"], "seconds", [2, 20, 45], "both", "core_bird_dog", "core_plank"),
    E("core_plank", "Планк", "Plank", S, "core", ["core", "shoulders"], ["mat"], 2, "prone", 0, ["shoulder", "wrist", "pregnancy"], "seconds", [3, 30, 45], "both", "core_plank_knee", "core_side_plank"),
    E("core_side_plank_knee", "Хажуугийн планк (өвдөгнөөс)", "Side plank from knees", S, "core", ["core"], ["mat"], 1, "side", 0, ["shoulder"], "seconds", [2, 10, 30], "each", null, "core_side_plank", SN),
    E("core_side_plank", "Хажуугийн планк", "Side plank", S, "core", ["core", "shoulders"], ["mat"], 3, "side", 0, ["shoulder", "wrist"], "seconds", [2, 20, 45], "each", "core_side_plank_knee", null),
    E("core_standing_knee_lift", "Зогсоод өвдөг өргөх", "Standing knee lift", S, "core", ["core", "hipflex"], [], 1, "standing", 0, [], "reps", [2, 10, 30], "each", null, "core_dead_bug", SN),
    E("core_pallof_band", "Паллоф түлхэлт", "Pallof press", S, "core", ["core"], ["band"], 2, "standing", 0, [], "reps", [2, 10, 45], "each", "core_standing_knee_lift", null),
    // ---- Хүч: зөөлт, эргэлт ----
    E("carry_db_farmer", "Фермерийн зөөлт", "Farmer carry", S, "carry", ["fullbody", "core"], ["db"], 2, "standing", 0, [], "seconds", [3, 30, 60], "both", null, "carry_kb_suitcase"),
    E("carry_kb_suitcase", "Нэг талын зөөлт", "Suitcase carry", S, "carry", ["core", "fullbody"], ["kb"], 3, "standing", 0, ["lowback"], "seconds", [3, 30, 60], "each", "carry_db_farmer", null),
    E("rot_standing_twist", "Зогсоод мушгих", "Standing twist", S, "rotation", ["core", "spine"], [], 1, "standing", 0, [], "reps", [2, 10, 30], "each", null, "rot_band_chop", SN),
    E("rot_band_chop", "Резинтэй цавчилт", "Band chop", S, "rotation", ["core", "spine"], ["band"], 2, "standing", 0, ["lowback"], "reps", [2, 10, 45], "each", "rot_standing_twist", null),
    // ---- Тэнцвэр ----
    E("bal_single_leg", "Нэг хөл дээр зогсох", "Single-leg stance", S, "balance", ["calves", "glutes", "core"], ["chair"], 1, "standing", 0, [], "seconds", [2, 20, 20], "each", null, "bal_tandem", SN),
    E("bal_tandem", "Тандем алхалт", "Tandem walk", S, "balance", ["calves", "core"], [], 2, "standing", 0, [], "reps", [2, 10, 30], "both", "bal_single_leg", "bal_single_leg_closed"),
    E("bal_single_leg_closed", "Нүдээ аниад нэг хөл дээр зогсох", "Eyes-closed stance", S, "balance", ["calves", "core"], ["wall"], 3, "standing", 0, [], "seconds", [2, 10, 30], "each", "bal_tandem", null),
    E("bal_heel_raise", "Өсгий өргөх", "Heel raise", S, "balance", ["calves"], ["chair"], 1, "standing", 0, ["ankle"], "reps", [2, 12, 30], "both", null, "bal_single_leg", SN),
    // ---- Кардио / алхалт ----
    E("cardio_walk", "Алхалт", "Walk", C, "gait", ["fullbody"], [], 1, "standing", 0, [], "seconds", [1, 1200, 0], "both", null, "cardio_brisk_walk"),
    E("cardio_brisk_walk", "Хурдан алхалт", "Brisk walk", C, "gait", ["fullbody"], [], 2, "standing", 1, [], "seconds", [1, 1200, 0], "both", "cardio_walk", "cardio_run_walk"),
    E("cardio_run_walk", "Гүй-алх интервал", "Run-walk intervals", C, "gait", ["fullbody", "calves"], [], 3, "standing", 2, ["knee", "ankle", "pregnancy", "postpartum"], "seconds", [1, 1200, 0], "both", "cardio_brisk_walk", null),
    E("cardio_march", "Газар дээрээ алхах", "March in place", C, "gait", ["fullbody"], [], 1, "standing", 0, [], "seconds", [2, 45, 30], "both", null, "cardio_stairs", SN),
    E("cardio_stairs", "Шатаар өгсөх", "Stair climb", C, "gait", ["quads", "glutes", "calves"], [], 2, "standing", 1, ["knee"], "seconds", [3, 60, 60], "both", "cardio_march", "cardio_jacks"),
    E("cardio_jacks", "Үсрэлт (jumping jack)", "Jumping jacks", C, "gait", ["fullbody"], [], 3, "standing", 2, ["knee", "ankle", "pregnancy", "postpartum"], "seconds", [3, 30, 45], "both", "cardio_stairs", null),
    // ---- Йога ----
    E("yoga_mountain", "Уулын поз", "Mountain pose", Y, "balance", ["fullbody"], [], 1, "standing", 0, [], "breaths", [1, 5, 0], "both", null, null, yoga("Tadasana", "standing", ["yoga_forward_fold", "yoga_chair_pose", "yoga_warrior2", "yoga_tree", "yoga_standing_side_bend"], [], true)),
    E("yoga_standing_side_bend", "Зогсоод хажуу тийш нугалах", "Standing side bend", Y, "core", ["core", "spine"], [], 1, "standing", 0, [], "breaths", [1, 5, 0], "each", null, null, yoga("Parsva Urdhva Hastasana", "standing", ["yoga_mountain", "yoga_forward_fold"], [], true)),
    E("yoga_forward_fold", "Урагш бөхийлт", "Standing forward fold", Y, "hinge", ["hams", "back"], [], 1, "standing", 0, ["lowback"], "breaths", [1, 5, 0], "both", null, null, yoga("Uttanasana", "forward", ["yoga_mountain", "yoga_down_dog", "yoga_chair_pose"], ["yoga_mountain"])),
    E("yoga_chair_pose", "Сандлын поз", "Chair pose", Y, "squat", ["quads", "glutes"], [], 2, "standing", 0, ["knee"], "breaths", [1, 5, 0], "both", null, null, yoga("Utkatasana", "standing", ["yoga_mountain", "yoga_forward_fold"], ["yoga_forward_fold"])),
    E("yoga_warrior2", "Дайчин II", "Warrior II", Y, "lunge", ["quads", "glutes", "shoulders"], [], 2, "standing", 0, ["knee"], "breaths", [1, 5, 0], "each", null, null, yoga("Virabhadrasana II", "standing", ["yoga_triangle", "yoga_warrior1", "yoga_mountain"], ["yoga_mountain"])),
    E("yoga_warrior1", "Дайчин I", "Warrior I", Y, "lunge", ["quads", "glutes", "hipflex"], [], 2, "standing", 0, ["knee"], "breaths", [1, 5, 0], "each", null, null, yoga("Virabhadrasana I", "standing", ["yoga_warrior2", "yoga_mountain", "yoga_down_dog"], ["yoga_forward_fold"])),
    E("yoga_triangle", "Гурвалжин", "Triangle pose", Y, "rotation", ["hams", "core", "spine"], [], 2, "standing", 0, ["lowback"], "breaths", [1, 5, 0], "each", null, null, yoga("Trikonasana", "standing", ["yoga_warrior2", "yoga_mountain"], ["yoga_mountain"])),
    E("yoga_tree", "Мод", "Tree pose", Y, "balance", ["calves", "glutes", "core"], [], 2, "standing", 0, ["ankle"], "breaths", [1, 5, 0], "each", null, null, yoga("Vrksasana", "balance", ["yoga_mountain"], [])),
    E("yoga_chair_cat_cow", "Сандал дээр муур-үхэр", "Seated cat-cow", Y, "core", ["spine", "core"], ["chair"], 1, "seated", 0, [], "breaths", [1, 6, 0], "both", null, null, yoga("Marjaryasana (сандал)", "core", ["yoga_mountain", "yoga_standing_side_bend"], [], true)),
    E("yoga_cat_cow", "Муур-үхэр", "Cat-cow", Y, "core", ["spine", "core"], ["mat"], 1, "kneeling", 0, ["wrist"], "breaths", [1, 6, 0], "both", null, null, yoga("Marjaryasana-Bitilasana", "core", ["yoga_down_dog", "yoga_child", "yoga_cobra"], [], true)),
    E("yoga_down_dog", "Нохой доош", "Downward dog", Y, "push", ["hams", "calves", "shoulders", "back"], ["mat"], 2, "prone", 0, ["wrist", "shoulder"], "breaths", [1, 5, 0], "both", null, null, yoga("Adho Mukha Svanasana", "forward", ["yoga_mountain", "yoga_forward_fold", "yoga_child", "yoga_cobra"], ["yoga_child"])),
    E("yoga_cobra", "Могой", "Cobra", Y, "core", ["spine", "back"], ["mat"], 2, "prone", 0, ["lowback", "pregnancy"], "breaths", [1, 5, 0], "both", null, null, yoga("Bhujangasana", "back", ["yoga_child", "yoga_down_dog"], ["yoga_child"])),
    E("yoga_bridge", "Гүүр", "Bridge pose", Y, "hinge", ["glutes", "spine"], ["mat"], 2, "supine", 0, ["neck", "pregnancy"], "breaths", [1, 5, 0], "both", null, null, yoga("Setu Bandha Sarvangasana", "back", ["yoga_supine_twist", "yoga_knees_chest"], ["yoga_knees_chest"])),
    E("yoga_knees_chest", "Өвдөг цээжинд", "Knees to chest", Y, "core", ["back", "glutes"], ["mat"], 1, "supine", 0, ["pregnancy"], "breaths", [1, 5, 0], "both", null, null, yoga("Apanasana", "forward", ["yoga_supine_twist", "yoga_shavasana"], [])),
    E("yoga_child", "Хүүхдийн поз", "Child's pose", Y, "core", ["back", "spine"], ["mat"], 1, "kneeling", 0, ["knee"], "breaths", [1, 6, 0], "both", null, null, yoga("Balasana", "restorative", ["yoga_cat_cow", "yoga_seated_forward"], [], true)),
    E("yoga_seated_forward", "Суугаа бөхийлт", "Seated forward bend", Y, "hinge", ["hams", "back"], ["mat"], 1, "seated", 0, ["lowback"], "breaths", [1, 6, 0], "both", null, null, yoga("Paschimottanasana", "forward", ["yoga_butterfly", "yoga_seated_twist"], [])),
    E("yoga_seated_twist", "Суугаа мушгилт", "Seated twist", Y, "rotation", ["spine", "core"], ["mat"], 2, "seated", 0, ["pregnancy"], "breaths", [1, 5, 0], "each", null, null, yoga("Ardha Matsyendrasana", "twist", ["yoga_butterfly", "yoga_shavasana"], [])),
    E("yoga_supine_twist", "Хэвтээ мушгилт", "Supine twist", Y, "rotation", ["spine", "core"], ["mat"], 1, "supine", 0, ["pregnancy"], "breaths", [1, 6, 0], "each", null, null, yoga("Supta Matsyendrasana", "twist", ["yoga_shavasana", "yoga_knees_chest"], [])),
    E("yoga_butterfly", "Эрвээхэй", "Butterfly pose", Y, "core", ["adductors", "hipflex"], ["mat"], 1, "seated", 0, ["hip"], "breaths", [1, 6, 0], "both", null, null, yoga("Baddha Konasana", "hipopen", ["yoga_seated_forward", "yoga_shavasana", "yoga_side_rest"], [])),
    E("yoga_pigeon", "Тагтаа", "Pigeon pose", Y, "core", ["glutes", "hipflex"], ["mat"], 3, "kneeling", 0, ["knee", "hip"], "breaths", [1, 6, 0], "each", null, null, yoga("Eka Pada Rajakapotasana", "hipopen", ["yoga_child", "yoga_down_dog"], ["yoga_child"])),
    E("yoga_legs_wall", "Хөл ханан дээр", "Legs up the wall", Y, "core", ["hams", "fullbody"], ["mat", "wall"], 1, "supine", 0, ["pregnancy", "inversion"], "breaths", [1, 10, 0], "both", null, null, yoga("Viparita Karani", "inversion", ["yoga_shavasana"], [])),
    E("yoga_shavasana", "Шавасана", "Corpse pose", Y, "core", ["fullbody"], ["mat"], 1, "supine", 0, ["pregnancy"], "breaths", [1, 10, 0], "both", null, null, yoga("Shavasana", "restorative", [], [])),
    E("yoga_side_rest", "Хажуугаар хэвтэж амрах", "Side-lying rest", Y, "core", ["fullbody"], ["mat"], 1, "side", 0, [], "breaths", [1, 10, 0], "both", null, null, yoga("Parsva Shavasana", "restorative", [], [])),
    // ---- Пилатес ----
    E("pil_breathing", "Пилатесийн амьсгал", "Pilates breathing", P, "core", ["core"], [], 1, "seated", 0, [], "breaths", [1, 8, 0], "both", null, null, pil(1, null, true)),
    E("pil_pelvic_floor", "Аарцагны ёроол чангалах", "Pelvic floor lift", P, "core", ["core"], [], 1, "seated", 0, [], "breaths", [2, 10, 30], "both", null, "pil_pelvic_tilt", pil(1, null, true)),
    E("pil_pelvic_tilt", "Аарцаг хөдөлгөх", "Pelvic tilt", P, "core", ["core", "spine"], ["mat"], 1, "supine", 0, [], "reps", [2, 10, 30], "both", "pil_pelvic_floor", "pil_hundred", pil(1, null, false)),
    E("pil_hundred", "Зуу", "The Hundred", P, "core", ["core"], ["mat"], 2, "supine", 0, ["neck", "pregnancy"], "breaths", [1, 10, 30], "both", "pil_pelvic_tilt", "pil_roll_up", pil(1, 1)),
    E("pil_roll_up", "Эргэж босох", "Roll up", P, "core", ["core", "spine"], ["mat"], 3, "supine", 0, ["lowback", "pregnancy"], "reps", [1, 6, 30], "both", "pil_hundred", null, pil(1, 2)),
    E("pil_leg_circle", "Нэг хөлөөр тойрог", "Single leg circles", P, "core", ["core", "hipflex"], ["mat"], 2, "supine", 0, ["hip"], "reps", [1, 6, 20], "each", "pil_pelvic_tilt", null, pil(1, 3)),
    E("pil_rolling", "Бөмбөг шиг эргэх", "Rolling like a ball", P, "core", ["core", "spine"], ["mat"], 2, "seated", 0, ["lowback", "neck"], "reps", [1, 8, 30], "both", "pil_spine_stretch", null, pil(1, 4)),
    E("pil_single_leg_stretch", "Нэг хөл сунгах", "Single leg stretch", P, "core", ["core"], ["mat"], 2, "supine", 0, ["neck", "pregnancy"], "reps", [1, 10, 30], "each", "pil_pelvic_tilt", "pil_double_leg_stretch", pil(1, 5)),
    E("pil_double_leg_stretch", "Хоёр хөл сунгах", "Double leg stretch", P, "core", ["core"], ["mat"], 3, "supine", 0, ["neck", "lowback", "pregnancy"], "reps", [1, 8, 30], "both", "pil_single_leg_stretch", null, pil(2, 6)),
    E("pil_spine_stretch", "Нуруу урагш сунгах", "Spine stretch forward", P, "hinge", ["spine", "hams"], ["mat"], 1, "seated", 0, [], "reps", [1, 6, 20], "both", null, "pil_saw", pil(1, 8, true)),
    E("pil_saw", "Хөрөө", "The Saw", P, "rotation", ["spine", "core", "hams"], ["mat"], 3, "seated", 0, ["lowback", "pregnancy"], "reps", [1, 5, 30], "each", "pil_spine_stretch", null, pil(2, 9)),
    E("pil_shoulder_bridge", "Мөрний гүүр", "Shoulder bridge", P, "hinge", ["glutes", "hams", "spine"], ["mat"], 2, "supine", 0, ["neck"], "reps", [1, 8, 30], "both", "pil_pelvic_tilt", null, pil(1, 21)),
    E("pil_side_kick", "Хажуугийн хөл савалт", "Side kick", P, "core", ["glutes", "core", "adductors"], ["mat"], 1, "side", 0, ["hip"], "reps", [1, 10, 20], "each", null, null, pil(1, 23)),
    E("pil_teaser", "Тизер", "Teaser", P, "core", ["core", "hipflex"], ["mat"], 4, "supine", 0, ["lowback", "neck", "pregnancy"], "reps", [1, 5, 45], "both", "pil_single_leg_stretch", null, pil(3, 26)),
    E("pil_leg_pull_front", "Планкаас хөл өргөх", "Leg pull front", P, "push", ["core", "shoulders", "glutes"], ["mat"], 4, "prone", 0, ["wrist", "shoulder", "pregnancy"], "reps", [1, 6, 45], "each", "pil_swimming", null, pil(2, 27)),
    E("pil_swimming", "Усанд сэлэх", "Swimming", P, "core", ["back", "glutes", "spine"], ["mat"], 2, "prone", 0, ["lowback", "pregnancy"], "seconds", [1, 30, 30], "both", null, "pil_leg_pull_front", pil(1, 28)),
    E("pil_side_bend", "Хажуугийн нугалалт", "Side bend", P, "core", ["core", "shoulders"], ["mat"], 3, "side", 0, ["wrist", "shoulder"], "reps", [1, 4, 45], "each", "pil_side_kick", null, pil(2, 31)),
    E("pil_wall_roll_down", "Хана налан бөхийх", "Wall roll down", P, "hinge", ["spine", "hams"], ["wall"], 1, "standing", 0, [], "reps", [1, 6, 20], "both", null, "pil_spine_stretch", pil(1, null, true)),
    // ---- Мобилити ----
    E("mob_neck_rolls", "Хүзүү эргүүлэх", "Neck rolls", M, "rotation", ["neck"], [], 1, "seated", 0, [], "seconds", [1, 30, 0], "both", null, null, SN),
    E("mob_shoulder_rolls", "Мөр эргүүлэх", "Shoulder rolls", M, "core", ["shoulders", "neck"], [], 1, "standing", 0, [], "reps", [1, 10, 0], "both", null, null, SN),
    E("mob_chest_doorway", "Хаалганы хүрээнд цээж сунгах", "Doorway chest stretch", M, "push", ["chest", "shoulders"], ["wall"], 1, "standing", 0, [], "seconds", [1, 30, 0], "both", null, null, SN),
    E("mob_thoracic_openbook", "Ном нээх", "Open book", M, "rotation", ["spine", "back"], ["mat"], 1, "side", 0, [], "reps", [1, 8, 0], "each", null, null, SN),
    E("mob_hip_circles", "Түнх эргүүлэх", "Hip circles", M, "core", ["hipflex", "glutes"], [], 1, "standing", 0, [], "reps", [1, 8, 0], "each", null, null, SN),
    E("mob_hip_flexor_stretch", "Түнхний нугалагч сунгах", "Hip flexor stretch", M, "lunge", ["hipflex", "quads"], ["mat"], 1, "kneeling", 0, ["knee"], "seconds", [1, 30, 0], "each", null, null),
    E("mob_hamstring_chair", "Сандал дээр хөл тавьж сунгах", "Hamstring stretch on chair", M, "hinge", ["hams"], ["chair"], 1, "standing", 0, [], "seconds", [1, 30, 0], "each", null, null),
    E("mob_calf_wall", "Тугалын булчин сунгах", "Calf stretch at wall", M, "gait", ["calves"], ["wall"], 1, "standing", 0, [], "seconds", [1, 30, 0], "each", null, null, SN),
    E("mob_ankle_circles", "Шагай эргүүлэх", "Ankle circles", M, "balance", ["calves"], [], 1, "seated", 0, [], "reps", [1, 10, 0], "each", null, null, SN),
    E("mob_wrist_circles", "Бугуй эргүүлэх", "Wrist circles", M, "core", ["fullbody"], [], 1, "standing", 0, [], "reps", [1, 10, 0], "both", null, null, SN),
    E("mob_leg_swings", "Хөл савах", "Leg swings", M, "gait", ["hipflex", "hams"], ["wall"], 2, "standing", 0, [], "reps", [1, 10, 0], "each", null, null),
    // ---- Амьсгал ----
    E("br_diaphragm", "Хэвлийн амьсгал", "Diaphragmatic breathing", B, "core", ["core"], [], 1, "seated", 0, [], "breaths", [1, 10, 0], "both", null, null, SN),
    E("br_coherent", "Тайван амьсгал (минутад 6)", "Coherent breathing", B, "core", ["core"], [], 1, "seated", 0, [], "breaths", [1, 12, 0], "both", null, null, SN),
    E("br_box", "Дөрвөлжин амьсгал", "Box breathing", B, "core", ["core"], [], 2, "seated", 0, ["pregnancy", "hypertension"], "breaths", [1, 8, 0], "both", "br_coherent", null),
    E("br_478", "4-7-8 амьсгал", "4-7-8 breathing", B, "core", ["core"], [], 2, "seated", 0, ["pregnancy", "hypertension"], "breaths", [1, 6, 0], "both", "br_coherent", null),
    E("br_nidra", "Йога нидра (богино)", "Short yoga nidra", B, "core", ["fullbody"], ["mat"], 1, "supine", 0, [], "seconds", [1, 600, 0], "both", null, null),
    E("br_body_scan", "Биеэ ажиглах", "Body scan", B, "core", ["fullbody"], [], 1, "seated", 0, [], "seconds", [1, 300, 0], "both", null, null)
  ];

  var map = {};
  exercises.forEach(function (e) { map[e.id] = e; });

  var FitLib = {
    exercises: exercises,
    byId: function (id) { return map[id]; },
    filter: function (q) {
      q = q || {};
      return exercises.filter(function (e) {
        if (q.type && (Array.isArray(q.type) ? q.type.indexOf(e.type) < 0 : e.type !== q.type)) return false;
        if (q.pattern && (Array.isArray(q.pattern) ? q.pattern.indexOf(e.pattern) < 0 : e.pattern !== q.pattern)) return false;
        if (q.maxLevel && e.level > q.maxLevel) return false;
        if (q.equipment && e.equipment.some(function (x) { return q.equipment.indexOf(x) < 0; })) return false;
        if (q.exclContra && e.contra.some(function (x) { return q.exclContra.indexOf(x) >= 0; })) return false;
        if (q.position && (Array.isArray(q.position) ? q.position.indexOf(e.position) < 0 : e.position !== q.position)) return false;
        return true;
      });
    },
    TYPES: ["strength", "yoga", "pilates", "mobility", "cardio", "breath"],
    PATTERNS: ["squat", "hinge", "lunge", "push", "pull", "core", "carry", "rotation", "balance", "gait"],
    CONTRA: ["knee", "lowback", "neck", "shoulder", "wrist", "hip", "ankle", "pregnancy", "postpartum", "hypertension", "inversion"]
  };

  if (typeof window !== "undefined") window.FitLib = FitLib;
  if (typeof module !== "undefined") module.exports = FitLib;
})(this);
