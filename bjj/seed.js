// Starter library. Everything can be edited, deleted or extended by the user.
// Structure: position (pos) → my option (mv) → opponent's defense (df) → my follow-up (mv) → ...
// t: sub=submission, sweep, pass, td=takedown, esc=escape, trans=transition, grip, ctl=control
// en: secondary (Mongolian) name, used for search.
window.BJJ_SEED = (function () {
  const POS = [
    // ───────── Standing ─────────
    { id: 'st', n: 'Standing: grip fighting', en: 'Зогсоо: барьцын тэмцэл', cat: 'stand',
      x: 'Grips first, then the takedown. No technique without a grip. Their head down, your back straight.',
      c: [
        { n: 'Collar & sleeve grip', en: 'Зах + ханцуй барьц', t: 'grip',
          s: ['Dominant hand on their collar, other hand on the end of the sleeve', 'Elbows tight, pull them in and push their head down', 'Short steps to create an angle, never stand square in front'],
          c: [
            { n: 'They break the grip', en: 'Барьцыг тасална', x: 'They rotate the sleeve and snap it away.',
              c: [
                { n: 'Re-grip: sleeve to collar', en: 'Дахин барих', t: 'grip', s: ['Follow the hand and re-grip the sleeve', 'Switch the other hand to the collar', 'As soon as the grip is set, go to a takedown'] },
                { n: 'Arm drag to the back', en: 'Арм драг → ар руу', t: 'trans', to: 'bk_t', s: ['Cross-grip the wrist of the freed arm', 'Pull behind the elbow with the other hand and step past', 'Hug the waist and take the back'] },
              ] },
            { n: 'They grab your collar', en: 'Өөрөө захнаас чинь барина',
              c: [
                { n: 'Break the grip, take the sleeve', en: 'Барьцыг нь тасалж ханцуй авах', t: 'grip', s: ['Both hands on their wrist', 'Snap down hard to break the grip', 'Pull that sleeve back and create an angle'] },
                { n: 'Seoi nage off their grip', en: 'Сеой-наге (барьцаар нь)', t: 'td', to: 'sc_t', s: ['Grip the sleeve of the arm that holds you, above the elbow', 'Turn in, hips under them, knees bent', 'Bend forward, pull the arm and throw'] },
              ] },
            { n: 'They stiff-arm and push away', en: 'Хүчтэй түлхэж холдоно',
              c: [
                { n: 'Snap down to front headlock', en: 'Снап даун → урд тэврэлт', t: 'td', to: 'tt_t', s: ['Go with the push and snap the head down with both hands', 'Step back, lock chin and arm', 'Circle to the side and get on top of the turtle'] },
                { n: 'Double leg on their pull', en: 'Татахад нь хоёр хөл', t: 'td', to: 'sc_t', s: ['When they pull, step in without resisting', 'Level change, wrap both legs', 'Step to the side at an angle and finish'] },
              ] },
          ] },
        { n: '2-on-1 (Russian tie)', en: 'Хоёр гараар нэг гар', t: 'grip',
          s: ['Both hands on one arm: wrist and elbow', 'Pin the arm to your chest, step to the outside', 'Turn them sideways, then attack'],
          c: [
            { n: 'They pull the arm out', en: 'Гараа сугалж авна', c: [
              { n: 'Single leg', en: 'Ганц хөл', t: 'td', to: 'sc_t', s: ['Level change as they pull', 'Wrap the near leg with both hands', 'Lift the leg and step sideways to finish'] },
            ] },
            { n: 'They clinch in', en: 'Чамайг тэвэрч ойртоно', c: [
              { n: 'O-soto-gari', en: 'Осото-гари', t: 'td', to: 'sc_t', s: ['Shift their weight to the back leg', 'Reap the back leg with your outside leg', 'Drive with the upper body'] },
            ] },
          ] },
        { n: 'Seoi nage (shoulder throw)', en: 'Сеой-наге', t: 'td', to: 'sc_t',
          s: ['From collar & sleeve, pull them forward', 'Turn in, hips under, knees bent', 'Bend forward, pull the sleeve and throw over the shoulder'],
          c: [
            { n: 'They drop hips and base back', en: 'Ташаагаа буулгаж хойш татна', c: [
              { n: 'Drop to a single leg', en: 'Шууд ганц хөл рүү', t: 'td', to: 'sc_t', s: ['If the throw stalls, drop to the knee', 'Wrap the front leg', 'Step sideways and finish'] },
            ] },
            { n: 'They step around to your back', en: 'Ар руу чинь гарна', c: [
              { n: 'Turn in and pull guard', en: 'Эргэж суугаад гард татах', t: 'trans', to: 'cg_b', s: ['Turn to face them immediately', 'Keep the sleeve grip and sit', 'Close the guard'] },
            ] },
          ] },
        { n: 'Single leg', en: 'Ганц хөл', t: 'td', to: 'sc_t',
          s: ['Level change, wrap the front leg with both hands', 'Head inside, pressed to their chest', 'Lift the leg and step sideways to finish'],
          c: [
            { n: 'Sprawl', en: 'Спрол', c: [
              { n: 'Turn the corner', en: 'Тойрч ар руу', t: 'trans', to: 'bk_t', s: ['Keep the leg, step to the side', 'Head to the outside, hug the waist', 'Take the back'] },
            ] },
            { n: 'Whizzer', en: 'Виззер', c: [
              { n: 'Switch to double leg', en: 'Хөл сольж хоёр хөл', t: 'td', to: 'sc_t', s: ['Level change under the whizzer side', 'Wrap the other leg', 'Step at an angle and finish'] },
            ] },
            { n: 'They go for a guillotine', en: 'Гилотин хайна', c: [
              { n: 'Pressure through, free the head', en: 'Толгойгоо гаргаж дарах', t: 'esc', s: ['Do not lift their neck, keep driving the leg up', 'Put them on the mat, shoulder pressure on the choking side', 'Pull the head out'] },
            ] },
          ] },
        { n: 'Double leg', en: 'Хоёр хөл', t: 'td', to: 'sc_t',
          s: ['Level change, knee between their feet', 'Wrap both legs, head on the side', 'Step sideways at an angle, lift and finish'],
          c: [
            { n: 'Sprawl', en: 'Спрол', c: [
              { n: 'Switch to single', en: 'Ганц хөл рүү шилжих', t: 'td', to: 'sc_t', s: ['Keep one leg and go to a single', 'Stand up and lift the leg'] },
            ] },
            { n: 'Guillotine', en: 'Гилотин', c: [
              { n: 'Von Flue pressure', en: 'Фон Флю даралт', t: 'esc', to: 'sc_t', s: ['Step to the choking side and put them down', 'Drive your shoulder into the neck, pull the head out', 'Settle into side control'] },
            ] },
          ] },
        { n: 'O-soto-gari', en: 'Осото-гари', t: 'td', to: 'sc_t',
          s: ['Collar & sleeve, push them back so weight goes to the rear leg', 'Reap the rear leg from the outside', 'Drive with the chest'],
          c: [
            { n: 'They shift weight forward / hop', en: 'Жингээ урагш шилжүүлнэ', c: [
              { n: 'Switch to ko-uchi-gari', en: 'Ко-учи-гари руу', t: 'td', to: 'sc_t', s: ['As the weight comes forward, reap the inside leg', 'Push them back'] },
            ] },
          ] },
        { n: 'Guard pull', en: 'Гард татах', t: 'trans', to: 'cg_b',
          s: ['Set a solid collar & sleeve grip', 'Foot on the hip, sit down', 'Close the guard and pull the collar so they cannot posture'],
          c: [
            { n: 'They pass immediately', en: 'Суухад л шууд давна', c: [
              { n: 'Go to de la Riva', en: 'Де ла Рива руу', t: 'trans', to: 'dlr_b', s: ['Keep the foot on the hip', 'Hook the outside of the lead leg with the other foot', 'Grip sleeve and heel'] },
            ] },
          ] },
      ] },

    // ───────── Guard, bottom ─────────
    { id: 'cg_b', n: 'Closed guard', en: 'Хаалттай гард', cat: 'guard',
      x: 'Legs locked behind their back. Break their posture, never let them stand tall. Attacks chain: hip bump → kimura → guillotine.',
      c: [
        { n: 'Hip bump sweep', en: 'Хип бамп свип', t: 'sweep', to: 'mt_t',
          s: ['Open the guard, sit up on one elbow', 'Post the hand, reach over the shoulder with the other arm', 'Pop the hips up and roll them over'],
          c: [
            { n: 'They post the hand', en: 'Гараа ширээнд тулна', c: [
              { n: 'Kimura', en: 'Кимура', t: 'sub', s: ['Grab the wrist of the posted arm', 'Reach over and grab your own wrist (figure four)', 'Fall back, close the guard, rotate the arm behind the back'] },
              { n: 'Guillotine', en: 'Гилотин', t: 'sub', s: ['When the head drops, wrap the neck', 'Lock the hands', 'Close the guard, lean back and lift'] },
            ] },
            { n: 'They posture up', en: 'Босож жингээ хойш', c: [
              { n: 'Break the posture', en: 'Босголтыг эвдэх', t: 'ctl', s: ['Grip sleeve or collar and pull them in', 'Knees to their chest', 'Attack again'] },
            ] },
          ] },
        { n: 'Scissor sweep', en: 'Ножны свип', t: 'sweep', to: 'mt_t',
          s: ['Collar & sleeve, shrimp out, knee across the chest', 'Bottom leg flat on the mat against their knee', 'Scissor the legs and pull the sleeve'],
          c: [
            { n: 'They step the leg up and base', en: 'Хөлөө өргөж суурь авна', c: [
              { n: 'Push sweep', en: 'Түлхэх свип', t: 'sweep', to: 'mt_t', s: ['Push the raised leg with the bottom foot', 'Sweep to the other side'] },
            ] },
            { n: 'They try to pass', en: 'Давахыг оролдоно', c: [
              { n: 'Recover closed guard', en: 'Хаалттай гард сэргээх', t: 'ctl', s: ['Pull the knee back in', 'Lock the legs again'] },
            ] },
          ] },
        { n: 'Armbar', en: 'Армбар', t: 'sub',
          s: ['Pull one arm across your chest with both hands', 'Hips up, angle out, one foot on the far shoulder', 'Squeeze the knees, lift the hips, thumb up'],
          c: [
            { n: 'They pull the elbow (hitchhiker)', en: 'Тохойгоо татна', c: [
              { n: 'Triangle', en: 'Трайангл', t: 'sub', s: ['As the arm comes out, throw the leg over the neck', 'Fix the angle and lock the legs', 'Pull the head down and squeeze'] },
              { n: 'Omoplata', en: 'Омоплата', t: 'sub', s: ['Bring the pulled arm under your leg', 'Sit up and trap the shoulder', 'Hug the waist and drive forward'] },
            ] },
            { n: 'They stand and stack', en: 'Босож стак хийнэ', c: [
              { n: 'Angle up harder', en: 'Өнцгөө засах', t: 'ctl', s: ['Push the head down with the leg', 'Turn the hips to the side', 'Never lose the arm'] },
            ] },
          ] },
        { n: 'Triangle', en: 'Трайангл', t: 'sub',
          s: ['One arm in, one arm out', 'Leg over the neck and arm, create the angle', 'Lock the legs, pull the head down and squeeze'],
          c: [
            { n: 'They posture / stack', en: 'Босож стак хийнэ', c: [
              { n: 'Armbar from triangle', en: 'Трайанглаас армбар', t: 'sub', s: ['Pull the inside arm with both hands', 'Lift the hips'] },
            ] },
            { n: 'They put a hand inside', en: 'Гараа дотогш оруулна', c: [
              { n: 'To omoplata', en: 'Омоплата руу', t: 'sub', s: ['Keep the legs and sit up', 'Trap the shoulder'] },
            ] },
          ] },
        { n: 'Kimura', en: 'Кимура', t: 'sub',
          s: ['Open the guard, sit up, grab the wrist', 'Figure four and fall back', 'Close the guard again, rotate the arm behind the back'],
          c: [
            { n: 'They pull the arm in and grab their belt', en: 'Гараа татаж бүсээ барина', c: [
              { n: 'Hip bump sweep', en: 'Хип бамп свип', t: 'sweep', to: 'mt_t', s: ['Keep the grip and lift the hips', 'Sweep towards the kimura side', 'Finish the kimura from the top'] },
            ] },
          ] },
        { n: 'Cross collar choke', en: 'Кросс чок', t: 'sub',
          s: ['First hand deep in the collar, palm up', 'Second hand on the other collar, or over the top', 'Elbows together, pull them in and squeeze'],
          c: [
            { n: 'They posture and strip the grip', en: 'Босож барьцыг тасална', c: [
              { n: 'Armbar off the collar', en: 'Үлдсэн барьцаар армбар', t: 'sub', s: ['Pull the posting arm across your chest', 'Hips up, armbar'] },
            ] },
          ] },
        { n: 'Omoplata', en: 'Омоплата', t: 'sub',
          s: ['Grip the sleeve, swing the leg over that arm', 'Sit up and trap the shoulder with the leg', 'Hug the waist and drive forward'],
          c: [
            { n: 'They roll forward', en: 'Урагш эргэнэ', c: [
              { n: 'Follow the roll', en: 'Дагаж эргэх', t: 'trans', to: 'sc_t', s: ['Keep the waist, follow them', 'Settle on top'] },
            ] },
            { n: 'They stand up', en: 'Босож чамайг өргөнө', c: [
              { n: 'Omoplata sweep', en: 'Омоплата свип', t: 'sweep', to: 'sc_t', s: ['Hug the waist', 'Sweep to the side'] },
            ] },
          ] },
      ] },

    { id: 'hg_b', n: 'Half guard', en: 'Хагас гард', cat: 'guard',
      x: 'One of their legs trapped between yours. Never lie flat, stay on your side. Once you have the underhook everything opens up.',
      c: [
        { n: 'Underhook', en: 'Доорх хуки', t: 'grip',
          s: ['Turn to your side, near arm under their armpit', 'Head on their chest, round the back', 'Do not let them posture: go to the back or sweep'],
          c: [
            { n: 'Whizzer', en: 'Виззер', c: [
              { n: 'Dog fight to the back', en: 'Ар руу гүйх', t: 'trans', to: 'bk_t', s: ['Knee down, come up on your base', 'Push the whizzer sideways and walk to the back'] },
              { n: 'Old school sweep', en: 'Олд скүүл свип', t: 'sweep', to: 'sc_t', s: ['Wrap the far leg with both hands', 'Shrimp and drive forward'] },
            ] },
            { n: 'Cross face', en: 'Кросс фейс', c: [
              { n: 'Back to knee shield', en: 'Нип шилд рүү буцах', t: 'ctl', s: ['Frame, hips back', 'Knee across their chest'] },
            ] },
          ] },
        { n: 'Knee shield', en: 'Нип шилд', t: 'ctl',
          s: ['Top knee across their chest', 'Frames on the neck and wrist', 'Make space for a sweep or guard recovery'],
          c: [
            { n: 'Knee cut', en: 'Нип кат', c: [
              { n: 'Butterfly hook sweep', en: 'Баттерфлай хуки свип', t: 'sweep', to: 'sc_t', s: ['Bottom leg becomes a butterfly hook', 'Lift and sweep to the side'] },
              { n: 'Underhook to the back', en: 'Доорх хуки → ар', t: 'trans', to: 'bk_t', s: ['As the knee drops, get under the armpit', 'Walk to the back'] },
            ] },
          ] },
        { n: 'Deep half', en: 'Дип хаф', t: 'trans',
          s: ['Go under the leg and hug the thigh', 'Head between their legs', 'Lift the leg and roll'],
          c: [
            { n: 'They free the leg', en: 'Хөлөө сугалж авна', c: [
              { n: 'Recover half, underhook', en: 'Хагас гард сэргээх', t: 'ctl', s: ['Wrap the leg again', 'Turn to the side and underhook'] },
            ] },
          ] },
        { n: 'Kimura from bottom', en: 'Кимура (доороос)', t: 'sub',
          s: ['Grab the wrist of the framing arm', 'Figure four', 'Turn and crank the shoulder'],
          c: [
            { n: 'They pull the arm back', en: 'Гараа татна', c: [
              { n: 'Kimura to the back', en: 'Кимурагаар ар руу', t: 'trans', to: 'bk_t', s: ['Keep the figure four and turn', 'Take the back'] },
            ] },
          ] },
      ] },

    { id: 'dlr_b', n: 'De la Riva', en: 'Де ла Рива', cat: 'guard',
      x: 'Outside foot hooks their lead leg, grips on sleeve and heel. Keep their balance moving.',
      c: [
        { n: 'Grips & hook', en: 'Барьц ба хуки', t: 'grip',
          s: ['Outside foot hooks around their lead leg', 'Grip that heel and the opposite sleeve', 'Other foot on the hip or knee to keep distance'],
          c: [
            { n: 'They clear the hook', en: 'Хуки хөлийг салгана', c: [
              { n: 'To X-guard', en: 'Х-гард руу', t: 'trans', to: 'xg_b', s: ['Go under the leg', 'Both feet on their thighs', 'Hug the far leg'] },
              { n: 'To spider guard', en: 'Спайдер гард руу', t: 'trans', to: 'sp_b', s: ['Grip both sleeves', 'Feet on the biceps'] },
            ] },
          ] },
        { n: 'Berimbolo to the back', en: 'Беримболо', t: 'trans', to: 'bk_t',
          s: ['Grip the belt or the waist', 'Invert towards the hook side', 'Insert both hooks and take the back'],
          c: [
            { n: 'They sit down to block', en: 'Суугаад хойш хэвтэнэ', c: [
              { n: 'To single leg X', en: 'Ганц хөл Х рүү', t: 'trans', to: 'slx_b', s: ['Wrap the hook leg with both legs', 'Stand them up and sweep backwards'] },
            ] },
            { n: 'They step out', en: 'Хөлөө сугалж босно', c: [
              { n: 'Tripod sweep', en: 'Трайпод свип', t: 'sweep', to: 'sc_t', s: ['Grip the heel', 'Other foot on the hip and push'] },
            ] },
          ] },
        { n: 'Tripod sweep', en: 'Трайпод свип', t: 'sweep', to: 'sc_t',
          s: ['Grip the heel of the hooked leg', 'Other foot on the hip, push', 'Pull the sleeve, drop them back, stand up right away'],
          c: [
            { n: 'They step back', en: 'Хөлөө хойш авна', c: [
              { n: 'Sickle sweep', en: 'Сикл свип', t: 'sweep', to: 'sc_t', s: ['Hook the other leg', 'Sweep in the opposite direction'] },
            ] },
          ] },
        { n: 'To single leg X', en: 'Ганц хөл Х рүү', t: 'trans', to: 'slx_b',
          s: ['Pull the heel and go under the hooked leg', 'Wrap the leg with both legs and turn it outwards'] },
      ] },

    { id: 'sp_b', n: 'Spider guard', en: 'Спайдер гард', cat: 'guard',
      x: 'Both sleeves, feet on the biceps. Pull one arm, push the other, break their balance.',
      c: [
        { n: 'Spider sweep', en: 'Спайдер свип', t: 'sweep', to: 'mt_t',
          s: ['Pull one sleeve, push with the other foot', 'Hook the bottom leg', 'Roll on top'],
          c: [
            { n: 'They strip the sleeve', en: 'Ханцуйг тасална', c: [
              { n: 'To de la Riva', en: 'Де ла Рива руу', t: 'trans', to: 'dlr_b', s: ['Drop the foot and hook the outside leg'] },
            ] },
            { n: 'Toreando pass', en: 'Торэандо', c: [
              { n: 'Lasso', en: 'Лассо', t: 'grip', s: ['Wrap one foot under their arm', 'Tighten the sleeve'] },
            ] },
          ] },
        { n: 'Triangle', en: 'Трайангл', t: 'sub',
          s: ['Pull one arm down, other foot to the neck', 'Lock the legs, angle out'] },
        { n: 'Omoplata', en: 'Омоплата', t: 'sub',
          s: ['Pull the sleeve, leg over the arm', 'Sit up and trap the shoulder'] },
      ] },

    { id: 'bf_b', n: 'Butterfly guard', en: 'Баттерфлай гард', cat: 'guard',
      x: 'Seated, both feet hooked inside their thighs. Underhook and head high.',
      c: [
        { n: 'Butterfly sweep', en: 'Баттерфлай свип', t: 'sweep', to: 'mt_t',
          s: ['Underhook, other hand on the sleeve or elbow', 'Fall to the side and lift the hook', 'Roll on top'],
          c: [
            { n: 'They post the hand', en: 'Гараа тулна', c: [
              { n: 'Sweep the other way', en: 'Эсрэг тал руу свип', t: 'sweep', to: 'mt_t', s: ['Lift the other hook', 'Sweep away from the posted hand'] },
              { n: 'Arm drag to the back', en: 'Арм драг → ар', t: 'trans', to: 'bk_t', s: ['Drag the posted arm across and step past', 'Insert the hooks'] },
            ] },
            { n: 'They flatten you', en: 'Чамайг дарж хэвтүүлнэ', c: [
              { n: 'To half guard', en: 'Хагас гард руу', t: 'ctl', to: 'hg_b', s: ['Wrap one leg', 'Knee shield to make space'] },
            ] },
          ] },
        { n: 'Arm drag', en: 'Арм драг', t: 'trans', to: 'bk_t',
          s: ['Cross-grip the wrist', 'Pull behind the elbow and move past', 'Hug the waist and take the back'] },
        { n: 'Guillotine', en: 'Гилотин', t: 'sub',
          s: ['When the head drops, wrap the neck', 'Fall back and close the guard'] },
        { n: 'To X-guard (when they stand)', en: 'Х-гард руу', t: 'trans', to: 'xg_b',
          s: ['As they stand, go under the leg', 'Both feet on the thighs'] },
      ] },

    { id: 'xg_b', n: 'X-guard', en: 'Х гард', cat: 'guard',
      x: 'Under one of their legs, feet crossed on the thigh, other leg on your shoulder.',
      c: [
        { n: 'Technical stand-up sweep', en: 'Технический бослого свип', t: 'sweep', to: 'sc_t',
          s: ['Extend the leg to break balance', 'Keep the leg on your shoulder and stand', 'Drop them backwards'],
          c: [
            { n: 'They free the leg', en: 'Хөлөө сугалж авна', c: [
              { n: 'To single leg X', en: 'Ганц хөл Х рүү', t: 'trans', to: 'slx_b', s: ['Wrap the remaining leg'] },
            ] },
          ] },
      ] },

    { id: 'slx_b', n: 'Single leg X', en: 'Ганц хөл Х', cat: 'guard',
      x: 'One leg wrapped with both legs, heel in your armpit. Push the other leg off the hip.',
      c: [
        { n: 'Sweep backwards', en: 'Хойш унагаах свип', t: 'sweep', to: 'sc_t',
          s: ['Turn the leg outwards, push the other leg', 'Drop them back and stand up right away'],
          c: [
            { n: 'They lean forward to pressure', en: 'Тонгойж дарна', c: [
              { n: 'To X-guard', en: 'Х-гард руу', t: 'trans', to: 'xg_b', s: ['Other leg onto your shoulder'] },
            ] },
          ] },
        { n: 'Straight ankle lock', en: 'Шулуун шагайн түгжээ', t: 'sub', x: 'May be illegal in competition depending on age and belt. Ask your coach.',
          s: ['Heel tight in the armpit', 'Hips forward, straighten the back'] },
      ] },

    // ───────── Passing, top ─────────
    { id: 'cg_t', n: 'Inside closed guard', en: 'Хаалттай гардад', cat: 'pass',
      x: 'Back straight, head up. Posture first, then open the guard. Never put both hands in the guard.',
      c: [
        { n: 'Standing guard break', en: 'Босож гард нээх', t: 'pass', to: 'og_t',
          s: ['Pin the collar to the mat, other hand on the sleeve', 'Stand one leg at a time', 'Push the knee down to open the legs'],
          c: [
            { n: 'They pull you down as you stand', en: 'Босоход татаж хүндрүүлнэ', c: [
              { n: 'Keep posture', en: 'Босголтоо хадгалах', t: 'ctl', s: ['Hips forward, head up', 'Hold the collar and stand again'] },
            ] },
          ] },
        { n: 'Knee-in guard break', en: 'Өвдгөөр гард нээх', t: 'pass', to: 'hg_t',
          s: ['One knee to the tailbone, other leg out', 'Elbow on the thigh, sit back', 'When it opens, knee through the middle'] },
      ] },

    { id: 'og_t', n: 'Open guard passing', en: 'Нээлттэй гардын давалт', cat: 'pass',
      x: 'Control the legs, keep your hips away from their feet. Pass with head and hips together.',
      c: [
        { n: 'Toreando pass', en: 'Торэандо', t: 'pass', to: 'sc_t',
          s: ['Grip both knees or pant legs', 'Throw the legs to one side and run to the other', 'Chest down into side control'],
          c: [
            { n: 'They follow with the legs', en: 'Хөлөө эргүүлж дагана', c: [
              { n: 'Change direction', en: 'Чиглэл солих', t: 'pass', to: 'sc_t', s: ['Throw the legs the other way', 'Run again'] },
              { n: 'To knee on belly', en: 'Нип-он-бэлли руу', t: 'trans', to: 'kob_t', s: ['Knee on the belly', 'Collar and belt grips'] },
            ] },
          ] },
        { n: 'Knee cut pass', en: 'Нип кат', t: 'pass', to: 'sc_t',
          s: ['Pin one leg with the knee, take the underhook', 'Other hand cross face or sleeve', 'Slide the knee to the mat and pass'],
          c: [
            { n: 'They underhook and come up', en: 'Доорх хуки авч босно', c: [
              { n: 'Whizzer & cross face', en: 'Виззер + кросс фейс', t: 'ctl', s: ['Whizzer the underhooking arm', 'Cross face the head to the other side'] },
            ] },
            { n: 'Knee shield', en: 'Нип шилд', c: [
              { n: 'Smash the shield', en: 'Өвдгийг нь дарж давах', t: 'pass', to: 'sc_t', s: ['Push the knee to the mat', 'Step over the hips'] },
            ] },
          ] },
        { n: 'Leg drag', en: 'Лег драг', t: 'pass', to: 'sc_t',
          s: ['Drag one leg across your hip', 'Knee on the thigh', 'Grip the shoulder and settle in side control'] },
        { n: 'Double under / stack', en: 'Стак пасс', t: 'pass', to: 'sc_t',
          s: ['Both arms under the thighs, grip the belt', 'Lift the legs onto your shoulders and stack', 'Walk to the side and pass the head'] },
      ] },

    { id: 'hg_t', n: 'Half guard top', en: 'Хагас гардад', cat: 'pass',
      x: 'Cross face plus underhook. Control the upper body before freeing the leg.',
      c: [
        { n: 'Knee cut from half', en: 'Нип кат (хагас гардаас)', t: 'pass', to: 'sc_t',
          s: ['Cross face, flatten them', 'Slide the trapped knee to the mat', 'Free the foot'] },
        { n: 'Back step', en: 'Бэк степ', t: 'pass', to: 'sc_t',
          s: ['Step the trapped leg in the opposite direction', 'Hips on their chest', 'Free the leg'] },
        { n: 'Kimura from top', en: 'Кимура (дээрээс)', t: 'sub',
          s: ['Grab the arm they reach with for the underhook', 'Figure four, chest pressure'] },
      ] },

    // ───────── Dominant, top ─────────
    { id: 'sc_t', n: 'Side control', en: 'Хажуугийн хяналт', cat: 'top',
      x: 'Chest pressure, control the hips. Control first, then mount or submit.',
      c: [
        { n: 'To mount', en: 'Маунт руу', t: 'trans', to: 'mt_t',
          s: ['Near hand blocks the hip', 'Slide the knee across the belly', 'Step over and sit'],
          c: [
            { n: 'They block with the knee', en: 'Өвдгөө дунд нь оруулна', c: [
              { n: 'To knee on belly', en: 'Нип-он-бэлли руу', t: 'trans', to: 'kob_t', s: ['Come up, knee on the belly', 'Collar and belt'] },
            ] },
          ] },
        { n: 'Americana', en: 'Американа', t: 'sub',
          s: ['Pin the near wrist to the mat', 'Other hand under, grab your own wrist', 'Slide the elbow along the mat'],
          c: [
            { n: 'They pull the arm down', en: 'Гараа доош татна', c: [
              { n: 'To kimura', en: 'Кимура руу', t: 'sub', s: ['Keep the grip, follow the arm', 'Rotate the figure four'] },
            ] },
          ] },
        { n: 'Knee on belly', en: 'Нип-он-бэлли', t: 'trans', to: 'kob_t',
          s: ['Collar and belt grips', 'Knee on the belly, other leg extended'] },
        { n: 'Back take when they turn', en: 'Ар руу (эргэхэд нь)', t: 'trans', to: 'bk_t',
          s: ['When they turn away, insert the hook', 'Seat belt grip'] },
        { n: 'To north-south', en: 'Норт-саут руу', t: 'trans',
          s: ['Rotate towards the head', 'Chest pressure, control the arms'] },
      ] },

    { id: 'kob_t', n: 'Knee on belly', en: 'Нип-он-бэлли', cat: 'top',
      x: 'Weight on the knee. When they push, armbar.',
      c: [
        { n: 'Armbar off the push', en: 'Армбар (гараа түлхэхэд)', t: 'sub',
          s: ['Hug the arm that pushes your knee', 'Step around the head', 'Sit down and swing the leg over'] },
        { n: 'Baseball bat choke', en: 'Бэйсбол чок', t: 'sub',
          s: ['One hand deep in the collar palm up, other palm down', 'Spin around the head'] },
        { n: 'To mount', en: 'Маунт руу', t: 'trans', to: 'mt_t',
          s: ['Step over and sit'] },
      ] },

    { id: 'mt_t', n: 'Mount', en: 'Маунт', cat: 'top',
      x: 'Knees in the armpits, hips low. Wide base, no posting. Attack the neck, when they lift the arms, armbar.',
      c: [
        { n: 'Cross collar choke', en: 'Кросс чок', t: 'sub',
          s: ['First hand deep in the collar, palm up', 'Second hand to the other collar', 'Head to the mat, elbows together'],
          c: [
            { n: 'They defend the neck', en: 'Гараа хүзүү рүүгээ', c: [
              { n: 'S-mount armbar', en: 'S-маунт армбар', t: 'sub', s: ['Move to high mount', 'One leg under the head in an S', 'Hug the arm and fall back'] },
            ] },
          ] },
        { n: 'Armbar', en: 'Армбар', t: 'sub',
          s: ['Hug the defending arm to your chest', 'Swing the leg over the head', 'Sit back and lift the hips'],
          c: [
            { n: 'Hitchhiker escape', en: 'Тохойгоо татна', c: [
              { n: 'Switch arms', en: 'Нөгөө гар руу шилжих', t: 'sub', s: ['As they turn, take the other arm', 'Swing the leg over again'] },
            ] },
          ] },
        { n: 'Arm triangle', en: 'Арм трайангл', t: 'sub',
          s: ['Push the arm across the neck, head tight', 'Dismount to the side, legs extended', 'Lock the arms, round the back'],
          c: [
            { n: 'They free the arm', en: 'Гараа гаргана', c: [
              { n: 'Back to mount, collar choke', en: 'Маунтад буцаж кросс чок', t: 'sub', to: 'mt_t', s: ['Return to mount', 'Straight to the collar'] },
            ] },
          ] },
        { n: 'Back take when they turn', en: 'Ар руу (эргэхэд нь)', t: 'trans', to: 'bk_t',
          s: ['When they turn, insert the hook', 'Fall back with the seat belt'] },
        { n: 'Ezekiel choke', en: 'Эзекиел чок', t: 'sub',
          s: ['One arm under the head, hand inside your own sleeve', 'Other hand across the neck and squeeze'] },
      ] },

    { id: 'bk_t', n: 'Back control', en: 'Ар (хуки)', cat: 'top',
      x: 'Two hooks plus seat belt. Choking arm underneath, chest glued to their back. Do not rush and lose the hooks.',
      c: [
        { n: 'Rear naked choke', en: 'Ар талаас боох (RNC)', t: 'sub',
          s: ['One arm under the chin', 'Hand on the other bicep, hand behind the head', 'Expand the chest and squeeze'],
          c: [
            { n: 'They hand fight, chin down', en: 'Эрүүгээ доош, гараа хамгаална', c: [
              { n: 'Trap the arm', en: 'Гарыг нь түгжих', t: 'ctl', s: ['Trap one arm with your leg', 'Fight the remaining hand'] },
              { n: 'Bow and arrow choke', en: 'Боу энд арроу', t: 'sub', s: ['Deep collar grip', 'Grab the pants or leg and turn', 'Extend the legs and squeeze'] },
            ] },
            { n: 'They clear a hook and escape to the side', en: 'Хукигаа салгаж эргэнэ', c: [
              { n: 'Transition to mount', en: 'Маунт руу шилжих', t: 'trans', to: 'mt_t', s: ['As the hook goes, get on top', 'Keep the seat belt'] },
            ] },
          ] },
        { n: 'Bow and arrow', en: 'Боу энд арроу', t: 'sub',
          s: ['Deep collar grip with the choking hand', 'Other hand on the pants, leg over the back', 'Extend the legs, pull the collar'] },
        { n: 'Armbar from the back', en: 'Армбар (арнаас)', t: 'sub',
          s: ['Hug the defending arm', 'Leg over the head', 'Lift the hips'] },
      ] },

    { id: 'tt_t', n: 'Turtle top', en: 'Мөлхөөн дээр', cat: 'top',
      x: 'Chest on their back, one knee close. Insert hooks for the back or clock choke.',
      c: [
        { n: 'Take the back', en: 'Ар руу хуки оруулах', t: 'trans', to: 'bk_t',
          s: ['Near leg becomes a hook', 'Seat belt grip', 'Roll them to the side and get the second hook'],
          c: [
            { n: 'They block the hooks', en: 'Хуки өгөхгүй', c: [
              { n: 'Clock choke', en: 'Клок чок', t: 'sub', s: ['Deep collar grip', 'Head to the mat and walk around'] },
            ] },
            { n: 'They sit to guard', en: 'Эргэж гард руу сууна', c: [
              { n: 'Follow and pass', en: 'Дагаж дарах', t: 'pass', to: 'sc_t', s: ['Give no space as they turn', 'Chest pressure into side control'] },
            ] },
          ] },
        { n: 'Anaconda / D’Arce', en: 'Анаконда / Дарс', t: 'sub', x: 'Mostly no-gi.',
          s: ['Thread under the arm and head', 'Figure four and roll', 'Squeeze'] },
      ] },

    // ───────── Escapes, bottom ─────────
    { id: 'sc_b', n: 'Under side control', en: 'Хажуугийн хяналтын доор', cat: 'escape',
      x: 'Do not panic. Frame, bridge, shrimp. Never flat, elbows tight.',
      c: [
        { n: 'Frame & shrimp to guard', en: 'Фрэйм + ширээ → гард', t: 'esc', to: 'cg_b',
          s: ['One frame on the neck, one on the hip', 'Bridge to make space', 'Shrimp and bring the knee in'],
          c: [
            { n: 'Cross face, hips blocked', en: 'Кросс фейс, ташаа дарна', c: [
              { n: 'Bridge then shrimp', en: 'Гүүр, дахин ширээ', t: 'esc', to: 'hg_b', s: ['Bridge to lift the elbow', 'Shrimp again and wrap the leg'] },
            ] },
            { n: 'They go to mount', en: 'Маунт руу шилжнэ', c: [
              { n: 'Knee in, half guard', en: 'Өвдгөө оруулж хагас гард', t: 'esc', to: 'hg_b', s: ['Knee in fast', 'Wrap the leg'] },
            ] },
          ] },
        { n: 'Underhook to turtle', en: 'Доорх хуки → мөлхөөн', t: 'esc', to: 'tt_b',
          s: ['Bridge, near arm under their armpit', 'Turn and come up to the knees'] },
      ] },

    { id: 'mt_b', n: 'Under mount', en: 'Маунтын доор', cat: 'escape',
      x: 'Elbows tight, hands away from the neck. Two escapes: bridge and elbow-knee.',
      c: [
        { n: 'Trap & roll (upa)', en: 'Гүүр (упа)', t: 'esc', to: 'cg_t',
          s: ['Trap one arm and one leg on the same side', 'Bridge over the shoulder', 'Land in their guard with posture'],
          c: [
            { n: 'They post the hand', en: 'Гараа тулна', c: [
              { n: 'Trap the post, bridge again', en: 'Тулсан гарыг барьж дахин гүүр', t: 'esc', to: 'cg_t', s: ['Hug the posted arm', 'Bridge the other way'] },
              { n: 'Switch to elbow-knee', en: 'Тохой-өвдөг рүү шилжих', t: 'esc', to: 'hg_b', s: ['Shrimp and bring the knee in'] },
            ] },
          ] },
        { n: 'Elbow-knee escape', en: 'Тохой-өвдөг мултралт', t: 'esc', to: 'hg_b',
          s: ['Elbow frames on the knee', 'Shrimp and bring the knee in', 'Wrap the leg into half guard'],
          c: [
            { n: 'High mount', en: 'Өндөр маунт', c: [
              { n: 'Protect arms, bridge', en: 'Гараа хамгаалж гүүр', t: 'esc', s: ['Elbows tight', 'Bridge and shrimp down'] },
            ] },
          ] },
      ] },

    { id: 'bk_b', n: 'Back taken', en: 'Ар авахуулсан', cat: 'escape',
      x: 'Neck first: chin down, protect the hands. Then escape towards the choking arm side.',
      c: [
        { n: 'Escape to the side', en: 'Хажуу руу бууж мултрах', t: 'esc', to: 'hg_t',
          s: ['Push the elbow of the choking arm down', 'Shrimp to that side, back on the mat', 'Clear the hook and come on top'],
          c: [
            { n: 'They follow to mount', en: 'Дагаж маунт руу', c: [
              { n: 'Knee in, half guard', en: 'Өвдгөө оруулж хагас гард', t: 'esc', to: 'hg_b', s: ['Knee in fast'] },
            ] },
          ] },
        { n: 'Hand fighting', en: 'Гар тэмцэл', t: 'ctl',
          s: ['Chin down', 'Two hands on the wrist of the choking arm', 'Sit towards the open hook side'] },
      ] },

    { id: 'tt_b', n: 'Turtle bottom', en: 'Мөлхөөнд', cat: 'escape',
      x: 'Elbows and knees tight. No hooks, protect the neck. Do not stay, go back to guard.',
      c: [
        { n: 'Granby roll to guard', en: 'Гранби эргэлт → гард', t: 'esc', to: 'bf_b',
          s: ['Roll over the shoulder', 'Get the legs in and sit up'] },
        { n: 'Sit through to guard', en: 'Эргэж сууж гард сэргээх', t: 'esc', to: 'hg_b',
          s: ['Pull the near leg and sit to the side', 'Wrap the leg'],
          c: [
            { n: 'They get a hook', en: 'Хуки оруулна', c: [
              { n: 'Clear the hook', en: 'Хуки салгах', t: 'esc', s: ['Push the hooking leg down with the hand', 'Shrimp to that side'] },
            ] },
          ] },
        { n: 'Attack a single leg', en: 'Ганц хөл рүү довтлох', t: 'td', to: 'sc_t',
          s: ['Wrap the near leg', 'Stand up and lift the leg'] },
      ] },
  ];

  // ───────── Library v2: more options per position, appended so existing ids stay stable ─────────
  const MORE = {
    st: [
      { n: 'They extend an arm → flying armbar', en: 'Гараа сунгахад → jumping armbar', t: 'sub', x: 'Only with a solid sleeve/wrist grip and a soft mat. Check if it is allowed in your division.',
        s: ['Grip the extended arm at the wrist and above the elbow', 'Step your near foot onto their hip, swing the other leg over the head', 'Fall back, squeeze the knees, hips up'],
        c: [
          { n: 'They pull the arm back / posture', en: 'Гараа татна', c: [
            { n: 'Convert to arm drag → back', en: 'Арм драг', t: 'trans', to: 'bk_t', s: ['Keep the wrist grip, drag the arm across', 'Step past and take the back'] },
            { n: 'Land in closed guard', en: 'Хаалттай гард', t: 'trans', to: 'cg_b', s: ['Lock the legs, keep the sleeve'] },
          ] },
          { n: 'They slam / stack you', en: 'Чамайг дарж буулгана', c: [
            { n: 'Let go, recover guard', en: 'Гард сэргээх', t: 'esc', to: 'cg_b', s: ['Release the arm before they drop you', 'Frame and close the guard'] },
          ] },
        ] },
      { n: 'Ankle pick', en: 'Шагайнаас барьж унагаах', t: 'td', to: 'sc_t',
        s: ['Collar grip, snap their head down', 'Level change, reach the far ankle', 'Drive forward, lift the ankle'],
        c: [
          { n: 'They step the leg back', en: 'Хөлөө хойш авна', c: [
            { n: 'Switch to double leg', en: 'Хоёр хөл', t: 'td', to: 'sc_t', s: ['Stay low, wrap both legs'] },
          ] },
        ] },
      { n: 'Uchi mata', en: 'Учи-мата', t: 'td', to: 'sc_t',
        s: ['Collar & sleeve, pull them forward and up', 'Turn in, hips through, inner leg sweeps between their legs', 'Rotate over the hip and throw'],
        c: [
          { n: 'They hop around', en: 'Тойрч үсэрнэ', c: [
            { n: 'Switch to o-soto-gari', en: 'Осото-гари руу', t: 'td', to: 'sc_t', s: ['Step out, reap the outside leg'] },
          ] },
        ] },
      { n: 'Foot sweep (de ashi barai)', en: 'Хөл шүүрэх', t: 'td', to: 'sc_t',
        s: ['Wait for their step', 'Sweep the stepping foot with the sole of yours as the weight lands', 'Pull the sleeve down, lift the collar'] },
      { n: 'Sacrifice throw (sumi gaeshi)', en: 'Суми-гаеши', t: 'td', to: 'mt_t',
        s: ['Overhook or belt grip, sit under them', 'Butterfly hook on the inside of the thigh', 'Roll back and lift with the hook'] },
      { n: 'Body lock takedown', en: 'Бэлхүүснээс тэвэрч унагаах', t: 'td', to: 'sc_t',
        s: ['Get both arms around the waist, hips tight', 'Step to the outside, pull their hip over your knee', 'Follow them down to side control'],
        c: [
          { n: 'They sprawl hips back', en: 'Ташаагаа хойш', c: [
            { n: 'Inside trip (ouchi gari)', en: 'Дотор хөл хусах', t: 'td', to: 'sc_t', s: ['Hook the inside leg, drive forward'] },
          ] },
        ] },
      { n: 'Cross collar grip', en: 'Хөндлөн зах барьц', t: 'grip',
        s: ['Deep cross grip in the collar, thumb inside', 'Pull the head down, keep your elbow heavy', 'Sets up snap downs, guard pulls and the collar drag'],
        c: [
          { n: 'They strip the grip', en: 'Барьцыг тасална', c: [
            { n: 'Collar drag to the back', en: 'Захаар татаж ар руу', t: 'trans', to: 'bk_t', s: ['As they pull away, drag the collar across', 'Step past, hug the waist'] },
          ] },
        ] },
      { n: 'Collar tie (no-gi)', en: 'Хүзүү тэврэх (no-gi)', t: 'grip',
        s: ['Hand behind the neck, elbow down on the chest', 'Other hand controls the wrist or bicep', 'Snap, circle, then shoot'] },
      { n: 'Pull to de la Riva', en: 'Де ла Рива руу татах', t: 'trans', to: 'dlr_b',
        s: ['Collar & sleeve, step your foot across to their hip', 'Sit and hook the lead leg', 'Grip the heel'] },
      { n: 'Pull to butterfly guard', en: 'Баттерфлай руу татах', t: 'trans', to: 'bf_b',
        s: ['Sleeve and collar, sit with both hooks in', 'Underhook immediately'] },
      { n: 'Guillotine (standing)', en: 'Гилотин (зогсоо)', t: 'sub',
        s: ['When their head drops below your chest, wrap the neck', 'Lock the hands, hip in, pull guard to finish'],
        c: [
          { n: 'They drive you back / circle', en: 'Түлхэж тойрно', c: [
            { n: 'Pull guard with the choke', en: 'Гард татаж бооно', t: 'sub', s: ['Jump closed guard, lean back, lift'] },
          ] },
        ] },
      { n: 'They pull guard → pass immediately', en: 'Гард татахад нь дав', t: 'pass', to: 'og_t',
        s: ['Stay standing with a tall posture', 'Control the knees or the feet before they settle', 'Pass before the grips are set'] },
    ],
    cg_b: [
      { n: 'Flower (pendulum) sweep', en: 'Пендулум свип', t: 'sweep', to: 'mt_t',
        s: ['Grip the sleeve, open the guard', 'Swing the free leg under their arm, hook the far leg', 'Pendulum and roll on top'],
        c: [
          { n: 'They base wide', en: 'Өргөн тулна', c: [
            { n: 'Finish the armbar instead', en: 'Армбар', t: 'sub', s: ['The arm is already across, lift the hips'] },
          ] },
        ] },
      { n: 'Arm drag to the back', en: 'Арм драг → ар', t: 'trans', to: 'bk_t',
        s: ['Grip the wrist, pull the tricep across', 'Shrimp to the side, hug the waist', 'Insert the hook and take the back'],
        c: [
          { n: 'They turn back to face you', en: 'Эргэж өөдөөс чинь', c: [
            { n: 'Pendulum sweep', en: 'Пендулум свип', t: 'sweep', to: 'mt_t', s: ['Swing the leg and roll'] },
          ] },
        ] },
      { n: 'Collar drag → back', en: 'Захаар татаж ар руу', t: 'trans', to: 'bk_t',
        s: ['Deep collar grip, open the guard', 'Pull the collar across while you hip out', 'Come up on top of the back'] },
      { n: 'Double ankle sweep (when they stand)', en: 'Босоход нь хоёр шагай', t: 'sweep', to: 'mt_t',
        s: ['When they stand, grab both ankles', 'Push the hips with the knees', 'They fall back; come up to mount'],
        c: [
          { n: 'They step back out', en: 'Хойш алхана', c: [
            { n: 'Sit up, single leg', en: 'Ганц хөл', t: 'td', to: 'sc_t', s: ['Hold one ankle, drive forward'] },
          ] },
        ] },
      { n: 'Hip escape to open guard (when stacked)', en: 'Стак хийхэд → нээлттэй гард', t: 'trans', to: 'dlr_b',
        s: ['Open the guard before the pressure lands', 'Shrimp, feet on the hips', 'Hook a leg for de la Riva'] },
      { n: 'Overhook → triangle / omoplata', en: 'Оверхук', t: 'ctl',
        s: ['Overhook one arm, control the wrist with the other hand', 'Break the posture with the overhook', 'Pick: triangle on the far side or omoplata'] },
      { n: 'Lapel choke (loop choke)', en: 'Лооп чок', t: 'sub',
        s: ['Grip the collar deep with the palm up', 'As they posture, loop your forearm over the head', 'Turn to the side and pull'] },
      { n: 'Climb to high guard', en: 'Өндөр гард', t: 'ctl',
        s: ['Break the posture, walk the legs up the back', 'Clamp over the shoulders', 'Armbar and triangle are one move away'] },
    ],
    hg_b: [
      { n: 'John Wayne sweep', en: 'Жон Вэйн свип', t: 'sweep', to: 'sc_t',
        s: ['Underhook, come up to the knees', 'Grab the far knee, drive them over your shoulder', 'Land in side control'] },
      { n: 'Kimura trap from knee shield', en: 'Кимура трап', t: 'ctl',
        s: ['Grab the wrist of their cross-facing arm', 'Figure four, roll them to their back', 'Keep the kimura grip while you take the back'] },
      { n: 'Dogfight back take', en: 'Ар руу (догфайт)', t: 'trans', to: 'bk_t',
        s: ['Underhook and come up, their whizzer vs your underhook', 'Push the whizzer arm down, walk behind', 'Hooks in'] },
      { n: 'Guard recovery to closed guard', en: 'Хаалттай гард сэргээх', t: 'trans', to: 'cg_b',
        s: ['Knee shield, frame on the hip', 'Shrimp out, swing the bottom leg free', 'Close the guard'] },
      { n: 'Lockdown → electric chair', en: 'Локдаун', t: 'sweep', to: 'sc_t', x: 'Fun for drilling, be careful with the knee.',
        s: ['Lock their leg with the figure four of your legs', 'Whip up, underhook the far leg', 'Stretch them out and roll'] },
    ],
    dlr_b: [
      { n: 'Kiss of the dragon (reverse DLR)', en: 'Урвуу де ла Рива', t: 'trans', to: 'bk_t',
        s: ['Switch the hook to the inside (reverse DLR)', 'Invert under their leg', 'Come up on the back'] },
      { n: 'Collar drag from DLR', en: 'Захаар татах', t: 'trans', to: 'sc_t',
        s: ['Deep collar grip, pull as you shrimp', 'They fall forward; come up on top'] },
      { n: 'DLR ankle pick sweep', en: 'Шагайн свип', t: 'sweep', to: 'sc_t',
        s: ['Hook deep, grab the far ankle', 'Push the near knee with your foot', 'Topple them backwards and stand'] },
      { n: 'Leg drag counter: switch to lasso', en: 'Лассо руу', t: 'trans', to: 'sp_b',
        s: ['When they drag the leg, lasso the near arm', 'Re-grip the sleeve'] },
    ],
    sp_b: [
      { n: 'Lasso sweep', en: 'Лассо свип', t: 'sweep', to: 'mt_t',
        s: ['Lasso one arm, foot on the opposite bicep', 'Pull the lasso, push the bicep, hip out', 'Roll them over the lasso side'] },
      { n: 'Overhead sweep', en: 'Толгой дээгүүр свип', t: 'sweep', to: 'mt_t',
        s: ['Both feet on the hips, pull both sleeves', 'Lift them over your head', 'Roll back and come up on top'] },
      { n: 'Spider to de la Riva', en: 'Де ла Рива руу', t: 'trans', to: 'dlr_b',
        s: ['Drop one foot off the bicep', 'Hook the lead leg, keep the sleeve'] },
    ],
    bf_b: [
      { n: 'Snap down → front headlock', en: 'Снап даун', t: 'td', to: 'tt_t',
        s: ['They lean in: snap the head down with both hands', 'Sit through to the side, chin control'] },
      { n: 'Elevator sweep (sumi gaeshi)', en: 'Элеватор свип', t: 'sweep', to: 'mt_t',
        s: ['Overhook, hook with the same-side leg', 'Fall to the overhook side and lift', 'Roll to mount'] },
      { n: 'Shoulder crunch sweep', en: 'Мөр дарах свип', t: 'sweep', to: 'mt_t',
        s: ['Overhook, pull their shoulder to the mat', 'Hook lifts, roll over the shoulder'] },
    ],
    xg_b: [
      { n: 'Heel pull sweep', en: 'Өсгий татах свип', t: 'sweep', to: 'sc_t',
        s: ['Grab the far heel', 'Extend their base leg with your hooks', 'Pull the heel, come up'] },
      { n: 'Come up to a leg drag', en: 'Лег драг руу', t: 'trans', to: 'sc_t',
        s: ['Drop them, keep the leg on your shoulder', 'Drag the leg across and pass'] },
    ],
    slx_b: [
      { n: 'Tripod come-up to top', en: 'Босож дээр гарах', t: 'sweep', to: 'sc_t',
        s: ['Push the far hip, extend the trapped leg', 'Stand up with the leg, drive forward'] },
      { n: 'Transition to X-guard', en: 'Х-гард руу', t: 'trans', to: 'xg_b',
        s: ['Pull the far leg onto your shoulder', 'Cross the feet on the thigh'] },
    ],
    cg_t: [
      { n: 'Posture: hands on the chest, hips forward', en: 'Босголт', t: 'ctl',
        s: ['Head up, back straight, hips in', 'One hand on the chest, one on the hip', 'Never put your hands on the mat'] },
      { n: 'Log splitter guard break', en: 'Лог сплиттер', t: 'pass', to: 'hg_t',
        s: ['Pin the hips, step one leg up', 'Drive the knee through the middle', 'Pass to half, then knee cut'] },
    ],
    og_t: [
      { n: 'Over-under pass', en: 'Овер-андер', t: 'pass', to: 'sc_t',
        s: ['One arm over a leg, one arm under, head low', 'Drive the shoulder, pin the hip', 'Walk around the under side'],
        c: [
          { n: 'They turn away / turtle', en: 'Эргэж мөлхөнө', c: [
            { n: 'Take the back', en: 'Ар руу', t: 'trans', to: 'tt_t', s: ['Follow the turn, chest on the back'] },
          ] },
        ] },
      { n: 'Long step pass', en: 'Урт алхам', t: 'pass', to: 'sc_t',
        s: ['Control the knees, hips low', 'Step the far leg back and around', 'Drop the hip past the legs'] },
      { n: 'Smash pass (half guard pressure)', en: 'Дарж давах', t: 'pass', to: 'sc_t',
        s: ['Flatten the knee shield with your hip', 'Cross face, walk the legs through'] },
      { n: 'Body lock pass', en: 'Бэлхүүс тэврэх пасс', t: 'pass', to: 'sc_t',
        s: ['Lock the hands around the waist, head on the chest', 'Walk the knees up, split the legs', 'Pass to the side opposite their hooks'] },
      { n: 'Leg weave pass', en: 'Лег вийв', t: 'pass', to: 'sc_t',
        s: ['Weave the arm under one leg and over the other', 'Pin the knee to the mat, drive across'] },
      { n: 'Headquarters position', en: 'Хэдквотерс', t: 'ctl',
        s: ['Knee splitting their legs, foot on the far hip', 'Grips on the knee and collar', 'From here: knee cut, leg drag or smash'] },
    ],
    hg_t: [
      { n: 'Hip switch pass', en: 'Ташаа солих пасс', t: 'pass', to: 'sc_t',
        s: ['Switch the hips, sit toward their head', 'Pull the trapped leg free, swing around'] },
      { n: 'Arm triangle from half guard', en: 'Арм трайангл', t: 'sub',
        s: ['Cross face, push the arm across', 'Head tight, free the leg and settle on the side'] },
    ],
    sc_t: [
      { n: 'Arm triangle', en: 'Арм трайангл', t: 'sub',
        s: ['Push the near arm across their neck', 'Clasp the hands, head tight to the mat', 'Walk to the far side and squeeze'] },
      { n: 'Baseball choke', en: 'Бэйсбол чок', t: 'sub',
        s: ['One hand deep in the collar palm up, other palm down', 'Spin to north-south while the grips tighten'] },
      { n: 'Paper cutter choke', en: 'Пэйпер каттер', t: 'sub',
        s: ['Far collar grip under the head', 'Near hand grabs the collar, elbow across the neck', 'Drop the elbow down'] },
      { n: 'North-south kimura', en: 'Норт-саут кимура', t: 'sub',
        s: ['Go to north-south, isolate one arm', 'Figure four, step over the head', 'Rotate the arm up'] },
      { n: 'Kesa gatame', en: 'Кеса гатамэ', t: 'ctl',
        s: ['Hug the head, trap the near arm under your armpit', 'Hips low, legs wide'] },
      { n: 'Mount via knee slide', en: 'Өвдөг гулгуулж маунт', t: 'trans', to: 'mt_t',
        s: ['Near hand pins the far hip', 'Slide the knee across the belly'] },
    ],
    kob_t: [
      { n: 'Far side armbar', en: 'Хол талын армбар', t: 'sub',
        s: ['They push with the far arm: hug it', 'Step over the head', 'Sit back'] },
      { n: 'Cross choke from knee on belly', en: 'Кросс чок', t: 'sub',
        s: ['Deep collar grip, second hand over', 'Drop the weight through the knee and pull'] },
      { n: 'Switch sides', en: 'Тал солих', t: 'trans', to: 'kob_t',
        s: ['Hop over the hips to the other side', 'Keep the collar grip'] },
    ],
    mt_t: [
      { n: 'Mounted triangle', en: 'Маунт трайангл', t: 'sub',
        s: ['They push: push the arm across, slide a leg over the neck', 'Lock the triangle, roll to finish'] },
      { n: 'Americana from mount', en: 'Американа', t: 'sub',
        s: ['Pin the wrist to the mat, chest heavy', 'Thread the other hand under, paint the mat'] },
      { n: 'Gift wrap → back', en: 'Гифт врап → ар', t: 'trans', to: 'bk_t',
        s: ['Pull their arm across their face', 'Trap it with your chin and chest', 'Step over to technical mount, take the back'] },
      { n: 'S-mount', en: 'S-маунт', t: 'ctl',
        s: ['Climb high, knee under the arm', 'One leg bent across the face in an S', 'Armbar or back take from here'] },
      { n: 'Guard retention if they escape', en: 'Мултрахад нь', t: 'ctl',
        s: ['If they bridge, post wide', 'If they shrimp, follow with the knee'] },
    ],
    bk_t: [
      { n: 'Body triangle', en: 'Бие трайангл', t: 'ctl',
        s: ['Figure four the legs around the waist', 'Keep the seat belt, then attack'] },
      { n: 'Crossed collar choke from the back', en: 'Зах чок (арнаас)', t: 'sub',
        s: ['Deep collar grip with the choking hand', 'Second hand on the other collar', 'Pull, expand the chest'] },
      { n: 'Transition to mount', en: 'Маунт руу', t: 'trans', to: 'mt_t',
        s: ['If they turn into you, release a hook', 'Swing over to mount'] },
      { n: 'Mounted guard recovery (opponent)', en: 'Эсрэг тал гард сэргээнэ', t: 'ctl',
        s: ['Keep the top hook tight so they cannot turn', 'Chest glued to their back'] },
    ],
    tt_t: [
      { n: 'Crucifix', en: 'Крусификс', t: 'ctl',
        s: ['Trap one arm between your legs', 'Grab the other arm, roll them over', 'Chokes and armlocks open up'] },
      { n: 'Roll them to side control', en: 'Хажуугийн хяналт руу', t: 'trans', to: 'sc_t',
        s: ['Grab the far hip and the near armpit', 'Pull and roll over your shoulder'] },
      { n: 'Guillotine when they posture up', en: 'Босоход нь гилотин', t: 'sub',
        s: ['As the head comes up, wrap the neck', 'Sit back, chin control'] },
    ],
    sc_b: [
      { n: 'Bridge and roll (when they are high)', en: 'Гүүр хийж эргүүлэх', t: 'esc', to: 'cg_t',
        s: ['Trap the near arm and the near leg', 'Bridge over the shoulder'] },
      { n: 'Ghost escape', en: 'Гоуст мултралт', t: 'esc', to: 'tt_t',
        s: ['Frame, shrimp away and spin out under the arm', 'Come up to their back/turtle'] },
      { n: 'Guard recovery with the knee shield', en: 'Нип шилд гард', t: 'esc', to: 'hg_b',
        s: ['Elbow frame, shrimp, knee in', 'Catch the leg, knee shield'] },
    ],
    mt_b: [
      { n: 'Hip escape to half guard', en: 'Хагас гард руу', t: 'esc', to: 'hg_b',
        s: ['Frame on the hip, bridge, shrimp', 'Trap the leg'] },
      { n: 'Trap & roll on the cross choke', en: 'Кросс чок хийхэд упа', t: 'esc', to: 'cg_t',
        s: ['When they reach for the collar, trap that arm', 'Bridge towards it'] },
      { n: 'Foot drag to butterfly', en: 'Баттерфлай руу', t: 'esc', to: 'bf_b',
        s: ['Hook their ankle with your foot', 'Drag the leg, insert the hook'] },
    ],
    bk_b: [
      { n: 'Turn into the guard (loose hooks)', en: 'Гард руу эргэх', t: 'esc', to: 'cg_b',
        s: ['Clear the top hook', 'Turn into them, close the guard'] },
      { n: 'Chair sit escape', en: 'Сандал суулт', t: 'esc', to: 'sc_t',
        s: ['Scoot the hips down and away', 'Sit on the mat, clear the bottom hook', 'Come up on top'] },
      { n: 'Defend the choke: chin & two-on-one', en: 'Боолт хамгаалах', t: 'ctl',
        s: ['Chin down, two hands on the choking wrist', 'Walk the elbow to the mat'] },
    ],
    tt_b: [
      { n: 'Peek-out when they guillotine', en: 'Гилотинд пик-аут', t: 'esc', to: 'sc_t',
        s: ['Step the outside leg around', 'Pop the head out and settle on the side'] },
      { n: 'Roll through to guard', en: 'Эргэж гард', t: 'esc', to: 'cg_b',
        s: ['Tuck the shoulder, roll forward', 'Face them and close the guard'] },
    ],
  };
  for (const p of POS) if (MORE[p.id]) p.c = (p.c || []).concat(MORE[p.id]);

  // ───────── Library v3: situational options, traps and counter-traps (from rules + systems research) ─────────
  const MORE2 = {
    st: [
      { n: 'Snap down → front headlock', en: 'Снап даун', t: 'td', pts: 0, energy: 2, when: 'They bend forward, head heavy', legal: 'No points until you settle a top position', oc: [{ to: 'tt_t', f: 'common' }, { to: 'bk_t', f: 'rare' }],
        s: ['Collar tie or collar grip, pull the head down as they lean', 'Step back, chin to your chest', 'Go behind, or attack the neck'],
        c: [
          { n: 'They circle up and grab your legs', en: 'Хөлнөөс чинь барина', f: 'common', c: [
            { n: 'Sprawl and re-snap', en: 'Спрол, дахин снап', t: 'ctl', s: ['Hips back, hands on the head', 'Snap again as they come up'] },
            { n: 'Guillotine as they come up', en: 'Гилотин', t: 'sub', s: ['Wrap the neck as the head rises', 'Sit back to guard to finish'] },
          ] },
          { n: 'They sit back to guard', en: 'Гард руу сууна', f: 'rare', c: [
            { n: 'Pass before the grips are set', en: 'Шууд давах', t: 'pass', to: 'og_t', s: ['Stay heavy on the head', 'Pass to the open side'] },
          ] },
        ] },
      { n: 'Arm drag (standing)', en: 'Арм драг (зогсоо)', t: 'trans', energy: 2, when: 'They reach or extend an arm', oc: [{ to: 'bk_t', f: 'common' }, { to: 'tt_t', f: 'common' }, { to: 'sc_t', f: 'rare' }],
        s: ['Grab the wrist, cup the tricep', 'Pull the arm across as you step past', 'Hug the waist, trip or ride to the back'],
        c: [
          { n: 'They square up and pull the arm back', en: 'Гараа татна', f: 'common', c: [
            { n: 'Drag the other side', en: 'Нөгөө талд драг', t: 'trans', to: 'bk_t', s: ['Use their pull, switch the drag'] },
            { n: 'Ankle pick on the recoil', en: 'Ankle pick', t: 'td', to: 'sc_t', s: ['As they pull back, drop to the ankle'] },
          ] },
          { n: 'They over-commit into the drag to counter-drag you', en: 'Чамайг эсрэгээр драглана', f: 'rare', bait: 'They lean into your drag so your arm comes across and they can drag you', c: [
            { n: 'Sprawl and re-drag', en: 'Спрол, дахин драг', t: 'trans', to: 'bk_t', s: ['Hips back as they drive', 'Re-grip and drag again'] },
          ] },
        ] },
      { n: 'Overhook + inside trip', en: 'Оверхук, дотор хусалт', t: 'td', energy: 2, when: 'Clinch or underhook battle', oc: [{ to: 'hg_t', f: 'common' }, { to: 'sc_t', f: 'common' }],
        s: ['Overhook the underhooking arm, elbow tight', 'Step in, hook their inside leg', 'Drive over the trapped leg'],
        c: [
          { n: 'They drive forward', en: 'Урагш түлхэнэ', f: 'common', c: [
            { n: 'Sumi gaeshi with the overhook', en: 'Суми гаеши', t: 'td', to: 'mt_t', s: ['Sit under, hook, roll them over'] },
          ] },
        ] },
      { n: 'Trap: offer the collar', en: 'Trap: зах санал болгох', t: 'grip', gi: 'gi', energy: 1, when: 'Neutral, both standing', bait: 'Stand slightly square so they take a collar grip; the grip gives you seoi nage or the drag you wanted',
        s: ['Let them grip the collar', 'Grab that sleeve above the elbow', 'Seoi nage or arm drag off their own grip'] },
      { n: 'Trap: fake guard pull → ankle grab', en: 'Trap: хуурамч гард татаж шагай авах', t: 'td', gi: 'gi', energy: 2, when: 'They stand square or stall', bait: 'Drop as if pulling guard; when they base and lean back, grab the ankle for 2 points', oc: [{ to: 'og_t', f: 'common' }, { to: 'sc_t', f: 'common' }],
        s: ['Sit as if pulling guard with a sleeve grip', 'Catch the ankle as they base', 'Come up and drive them over'] },
      { n: 'Seated guard drag (after a safe pull)', en: 'Суугаад арм драг', t: 'trans', energy: 2, when: 'They stand square or stall', pts: 0, oc: [{ to: 'bk_t', f: 'common' }, { to: 'slx_b', f: 'rare' }],
        s: ['Sit to butterfly/seated with a wrist grip', 'Drag the arm as they step in', 'Take the back, or switch to single leg X if they pull out'] },
    ],
    cg_b: [
      { n: 'Open to butterfly', en: 'Баттерфлай руу нээх', t: 'trans', pts: 0, energy: 1, when: 'They posture up, hands on your hips', oc: [{ to: 'bf_b', f: 'common' }],
        s: ['Open the guard, sit up on the elbow', 'Hooks inside the thighs, underhook'] },
      { n: 'Trap: loose guard to invite the stand-up', en: 'Trap: босголтыг урих', t: 'sweep', energy: 2, when: 'They stand up', bait: 'Relax the lock so they stand; the moment both feet are planted grab the ankles for the double ankle sweep', oc: [{ to: 'mt_t', f: 'common' }, { to: 'og_t', f: 'rare' }],
        s: ['Loosen the guard, let them stand', 'Both ankles, knees into the hips', 'Come up to mount'],
        c: [
          { n: 'They stand but step one leg back first (they know the sweep)', en: 'Нэг хөлөө хойш авна', f: 'common', bait: 'A trained passer stands with a staggered base to bait you into the double ankle and pass', c: [
            { n: 'Switch to de la Riva on the front leg', en: 'Де ла Рива', t: 'trans', to: 'dlr_b', s: ['Hook the forward leg, grip the heel'] },
          ] },
        ] },
    ],
    hg_b: [
      { n: 'Knee lever sweep (as they smash)', en: 'Өвдөг хөшүүрэг свип', t: 'sweep', belt: 'blue', energy: 2, when: 'They smash the knee shield', oc: [{ to: 'sc_t', f: 'common' }, { to: 'hg_t', f: 'common' }],
        s: ['As they drive, grab the far knee', 'Lever with the shield leg, roll them over'] },
      { n: 'Limp arm to the back', en: 'Лимп арм → ар', t: 'trans', belt: 'blue', energy: 2, when: 'They whizzer your underhook', oc: [{ to: 'bk_t', f: 'common' }],
        s: ['Go limp with the underhook arm, pull it out downward', 'Circle behind'] },
      { n: 'Sit-up guard single leg', en: 'Суугаад ганц хөл', t: 'sweep', energy: 2, when: 'They stand or sit back', oc: [{ to: 'sc_t', f: 'common' }, { to: 'hg_t', f: 'common' }],
        s: ['Sit up, hug the near leg', 'Drive forward, come up on top'] },
      { n: 'Trap: loose knee shield', en: 'Trap: сул нип шилд', t: 'sweep', belt: 'blue', energy: 2, when: 'They smash the knee shield', bait: 'Make the shield look weak so they commit forward, then knee lever or kimura as they drive', oc: [{ to: 'sc_t', f: 'common' }],
        s: ['Soften the shield', 'As they drive, lever or grab the wrist for the kimura'] },
    ],
    sc_t: [
      { n: 'Trap: give the underhook', en: 'Trap: андерхук өгөх', t: 'sub', energy: 2, when: 'They fight for the underhook', bait: 'Let them have the underhook and come up to their knees; their head comes forward into the guillotine or d’arce',
        s: ['Release the far arm', 'As they come up, wrap the neck (guillotine) or thread for the d’arce', 'Sit back or roll to finish'],
        c: [
          { n: 'They keep the head up and go for a single leg', en: 'Толгойгоо дээш, ганц хөл', f: 'common', bait: 'A trained player knows the bait and uses the underhook for a single leg instead', c: [
            { n: 'Sprawl and re-pass', en: 'Спрол, дахин давах', t: 'pass', to: 'sc_t', s: ['Hips back, cross face', 'Walk around to the other side'] },
          ] },
        ] },
      { n: 'Step over the frame to mount', en: 'Фрэймийг давж маунт', t: 'trans', to: 'mt_t', energy: 1, when: 'They frame on your neck',
        s: ['Pin the framing elbow with your hip', 'Step the far leg over the frame'] },
      { n: 'Ride the bridge to knee on belly', en: 'Гүүрийг нь дагаж нип он бэлли', t: 'trans', to: 'kob_t', energy: 1, when: 'They bridge or turn away',
        s: ['Let the bridge lift you, post the knee on the belly as they land'] },
    ],
    mt_t: [
      { n: 'Trap: loose post to invite the upa', en: 'Trap: упа урих', t: 'ctl', energy: 1, when: 'They bridge', bait: 'Lean forward with a loose base so they bridge; ride it into technical mount or S-mount, or arm triangle the exposed side',
        s: ['Lean, look loose', 'As they bridge, base wide and slide to technical mount'],
        c: [
          { n: 'They bridge for real and you were too loose', en: 'Жинхэнэ гүүр', f: 'common', c: [
            { n: 'Post wide, grapevine the legs', en: 'Өргөн тулж, хөлийг нь ороох', t: 'ctl', s: ['Hands wide, hooks around the legs'] },
          ] },
        ] },
      { n: 'Palm-up cross grip (dilemma)', en: 'Кросс барьц дилемм', t: 'ctl', belt: 'blue', energy: 1, when: 'They defend with elbows in', bait: 'Cross grip one wrist palm up: if they ignore it you isolate the arm; if they strip it the other arm and the back open (gift wrap)',
        s: ['Cross grip the wrist palm up', 'Lift the arm to the underhook side', 'Arm triangle, mounted triangle or armbar from S-mount'] },
      { n: 'Technical mount when the knee comes in', en: 'Техникал маунт', t: 'ctl', energy: 1, when: 'They turn or elbow-escape',
        s: ['Post the hand, slide to the side of the knee', 'Hook the far arm, back or armbar from here'] },
    ],
    bk_t: [
      { n: 'Straight-jacket: offer the weak side', en: 'Стрэйт жакет', t: 'ctl', belt: 'blue', energy: 1, when: 'They defend the neck with both hands', bait: 'Show the overhook side as the threat so both their hands go there, then trap the near arm with your leg and choke one-handed',
        s: ['Threaten over the shoulder', 'Trap the arm with the leg', 'One-handed RNC or bow and arrow'] },
      { n: 'Back mount when they go belly down', en: 'Гэдэргээ хэвтэхэд бэк маунт', t: 'ctl', pts: 4, energy: 1, when: 'They turn away / slide down', legal: 'IBJJF: back mount = 4 points, hooks not needed',
        s: ['Sit on the hips, knees wide', 'RNC or bow and arrow (gi)'] },
      { n: 'Re-hook or take mount as they slide down', en: 'Дахин хуки эсвэл маунт', t: 'trans', to: 'mt_t', energy: 1, when: 'They turn away / slide down',
        s: ['Follow with the top hook', 'If they clear it, swing over to mount'] },
    ],
    sc_b: [
      { n: 'Underhook back → come up to a single leg', en: 'Андерхук → ганц хөл', t: 'esc', energy: 3, when: 'They reach for the underhook', oc: [{ to: 'tt_b', f: 'common' }, { to: 'sc_t', f: 'common' }],
        s: ['Underhook first, head up', 'Come to the knees, hug the near leg', 'Drive to top'],
        c: [
          { n: 'They guillotine the exposed head', en: 'Гилотин', f: 'common', c: [
            { n: 'Keep the head up, drive through', en: 'Толгой дээш', t: 'esc', to: 'sc_t', s: ['Never duck the head on the way up'] },
          ] },
        ] },
      { n: 'Turn to turtle when they go north-south', en: 'Норт-саут → мөлхөөн', t: 'esc', energy: 2, when: 'They switch position', oc: [{ to: 'tt_b', f: 'common' }, { to: 'hg_b', f: 'rare' }],
        s: ['Sit up into them as they switch', 'Turn to the knees'] },
      { n: 'Trap: expose the far arm', en: 'Trap: гараа харуулах', t: 'esc', belt: 'blue', energy: 2, when: 'They hunt an arm', bait: 'Give them the far arm so they reach for the kimura; use their reach to turn in and come up', oc: [{ to: 'tt_b', f: 'common' }, { to: 'hg_b', f: 'common' }],
        s: ['Let the arm show', 'As they grab, turn into them and sit up'] },
      { n: 'Re-guard before they settle', en: 'Хурдан гард сэргээх', t: 'esc', energy: 2, when: 'They switch position', oc: [{ to: 'hg_b', f: 'common' }, { to: 'bf_b', f: 'rare' }],
        s: ['The moment the weight lifts, knee shield or hook inside'] },
    ],
    mt_b: [
      { n: 'Trap: show the arm for the americana', en: 'Trap: гараа американад өгөх', t: 'esc', belt: 'blue', energy: 3, when: 'They hunt for arm attacks', bait: 'Let one arm look available so both their hands go to it, then bridge and roll while they are committed', oc: [{ to: 'cg_t', f: 'common' }],
        s: ['Show the arm', 'As they grab, trap the same-side leg and bridge'] },
    ],
    tt_b: [
      { n: 'Trap: give the back on purpose', en: 'Trap: ар өгөх', t: 'esc', belt: 'blue', energy: 3, when: 'They chase the back aggressively', bait: 'Turn to turtle so they chase hooks; roll them over the shoulder (Peterson roll) or sit out as the hook goes in loosely', oc: [{ to: 'sc_t', f: 'common' }, { to: 'hg_b', f: 'rare' }],
        s: ['Turtle, feel the hook', 'Grab the hooking leg, roll over the shoulder'],
        c: [
          { n: 'They keep the seat belt and ride it', en: 'Сийт бэлт барьсаар дагана', f: 'common', c: [
            { n: 'Sit out instead', en: 'Сит аут', t: 'esc', to: 'hg_b', s: ['Sit through to the open side'] },
          ] },
        ] },
    ],
  };
  for (const p of POS) if (MORE2[p.id]) p.c = (p.c || []).concat(MORE2[p.id]);

  const PLANS = [
    { n: 'Against a big, strong opponent', x: 'Never flat on the bottom. Half guard, knee shield, frames, keep changing angles. Movement over strength. On top, do not settle into side control: knee on belly and a mobile top game.', tags: ['hg_b', 'dlr_b', 'kob_t'] },
    { n: 'Against a tall, long-legged opponent', x: 'Do not pass from far away, get close and pass with pressure (knee cut, stack). On the bottom stay out of the triangle, elbows in. Takedowns: level change, single leg.', tags: ['og_t', 'st'] },
    { n: 'Against a fast, light opponent', x: 'No rush. Grips first, full control before any attack. Pressure from the top, hips away from their feet. Give no hooks.', tags: ['sc_t', 'mt_t'] },
    { n: 'Against a wrestler', x: 'Do not stay in the standing battle, pull guard or go to de la Riva as soon as you have grips. From the bottom prefer back takes (berimbolo, arm drag) over sweeps.', tags: ['st', 'dlr_b', 'bf_b'] },
    { n: 'Against a new, spazzy opponent', x: 'Safe positions: closed guard, side control. Protect the neck and fingers. Try techniques, finish calmly.', tags: ['cg_b', 'sc_t'] },
  ];

  // Body: routines. cat: warm=warm-up, str=stretching, sc=strength, cardio
  const ROUTINES = [
    { cat: 'warm', n: 'Standard BJJ warm-up', min: 10, items: ['Light jog, shoulder and hip circles · 2 min', 'Forward / backward rolls · 10', 'Shrimping (hip escape) · 2×20 m', 'Bridges · 15', 'Technical stand-up · 10', 'Granby rolls · 10', 'Sprawls · 15', 'Hip switches · 20'] },
    { cat: 'warm', n: 'Quick warm-up (5 min)', min: 5, items: ['Jump rope · 2 min', 'Shrimping · 20', 'Bridges · 10', 'Sprawls · 10', 'Hip and neck circles · 1 min'] },
    { cat: 'str', n: 'Post-training stretch', min: 10, items: ['Pigeon · 45 s each side', 'Straddle forward fold · 60 s', 'Cat-cow · 10', 'Lying spinal twist · 45 s each side', 'Neck · 30 s each side', 'Cross-body shoulder · 30 s each side', 'Couch stretch · 45 s each side'] },
    { cat: 'str', n: 'Hip mobility', min: 12, items: ['90/90 switches · 10', 'Hip CARs · 5 each side', 'Frog · 60 s', 'Deep squat hold · 60 s', 'Cossack squat · 8 each side'] },
    { cat: 'str', n: 'Neck, shoulders, back', min: 8, items: ['Neck circles · 10', 'Shoulder CARs · 5 each side', 'Thoracic rotations · 8 each side', 'Wall slides · 10', 'Child’s pose · 60 s'] },
    { cat: 'sc', n: 'Bodyweight strength (A)', min: 30, items: ['Pull-ups · 4×5–8', 'Push-ups · 4×12', 'Squats · 4×15', 'Glute bridges · 3×15', 'Plank · 3×45 s'] },
    { cat: 'sc', n: 'Bodyweight strength (B)', min: 30, items: ['Inverted rows · 4×10', 'Lunges · 3×10 each side', 'Dips · 3×8', 'Side plank · 3×30 s each side', 'Nordic hamstring · 3×5'] },
    { cat: 'sc', n: 'Grip strength', min: 15, items: ['Gi / towel pull-ups · 4×5', 'Towel hangs · 4×30 s', 'Farmer carry · 4×30 m', 'Wrist curls · 3×15'] },
    { cat: 'sc', n: 'Core', min: 15, items: ['Dead bugs · 3×10', 'Hollow body hold · 3×30 s', 'Side plank · 3×30 s', 'Leg raises · 3×12', 'Supermans · 3×12'] },
    { cat: 'cardio', n: 'Round intervals (match pace)', min: 24, items: ['5 min work / 1 min rest · 4 rounds', 'Work: burpees, shrimps, sprawls, jump rope in turns', 'Use the timer below'] },
    { cat: 'cardio', n: 'Long run', min: 35, items: ['Easy pace, 30–40 min', 'Conversational speed', '1–2 times a week'] },
    { cat: 'cardio', n: 'Intervals 30/30', min: 15, items: ['30 s hard / 30 s easy · 10–15 times', 'Run, bike or jump rope'] },
  ];

  // Belt ladder (IBJJF). kids: 4–15, adult: 16+
  const BELTS = {
    kids: [
      { id: 'white', n: 'White', c: '#f4f4f6', age: '4+' },
      { id: 'grey-white', n: 'Grey-white', c: '#9a9aa2', age: '4–15' },
      { id: 'grey', n: 'Grey', c: '#8c8c94', age: '4–15' },
      { id: 'grey-black', n: 'Grey-black', c: '#6e6e76', age: '4–15' },
      { id: 'yellow-white', n: 'Yellow-white', c: '#f5d547', age: '7–15' },
      { id: 'yellow', n: 'Yellow', c: '#f0c81c', age: '7–15' },
      { id: 'yellow-black', n: 'Yellow-black', c: '#d9b310', age: '7–15' },
      { id: 'orange-white', n: 'Orange-white', c: '#ff9f43', age: '10–15' },
      { id: 'orange', n: 'Orange', c: '#ff8c1a', age: '10–15' },
      { id: 'orange-black', n: 'Orange-black', c: '#e67600', age: '10–15' },
      { id: 'green-white', n: 'Green-white', c: '#4cc26b', age: '13–15' },
      { id: 'green', n: 'Green', c: '#2fb352', age: '13–15' },
      { id: 'green-black', n: 'Green-black', c: '#1f8f3f', age: '13–15' },
    ],
    adult: [
      { id: 'white', n: 'White', c: '#f4f4f6', age: '16+', min: '' },
      { id: 'blue', n: 'Blue', c: '#1f5fd6', age: '16+', min: 'Minimum 2 years at blue belt' },
      { id: 'purple', n: 'Purple', c: '#7a3fc4', age: '16+', min: 'Minimum 1.5 years at purple belt' },
      { id: 'brown', n: 'Brown', c: '#7a4a1f', age: '18+', min: 'Minimum 1 year at brown belt' },
      { id: 'black', n: 'Black', c: '#111114', age: '19+', min: '' },
    ],
  };

  // Example goals per belt. The user edits these.
  const BELT_GOALS = {
    white: ['Shrimp, bridge and technical stand-up without thinking', '2 sweeps and 2 submissions from closed guard', 'Escape mount and side control', 'One takedown and a guard pull', 'Know the positional hierarchy: back > mount > side > guard'],
    blue: ['1 sweep from each open guard (de la Riva, spider, butterfly)', 'One passing system: toreando + knee cut', '2 ways to take the back, 2 submissions from the back', 'A defense for every submission', 'Compete'],
    purple: ['Have your own game plan', 'Attack from both top and bottom', 'Teach kids and beginners'],
    brown: ['Refine the system, close the gaps', 'Lead and teach'],
    black: ['Keep teaching and growing'],
  };

  // Weight classes (IBJJF, weighed in the gi). kg
  const WEIGHT_CLASSES = {
    'adult_m': { n: 'Adult, male (gi)', c: [['Rooster', 57.5], ['Light Feather', 64], ['Feather', 70], ['Light', 76], ['Middle', 82.3], ['Medium Heavy', 88.3], ['Heavy', 94.3], ['Super Heavy', 100.5], ['Ultra Heavy', null]] },
    'adult_f': { n: 'Adult, female (gi)', c: [['Rooster', 48.5], ['Light Feather', 53.5], ['Feather', 58.5], ['Light', 64], ['Middle', 69], ['Medium Heavy', 74], ['Heavy', 79.3], ['Super Heavy', null]] },
    'juv_m': { n: 'Juvenile (16–17), male (gi)', c: [['Rooster', 53.5], ['Light Feather', 58.5], ['Feather', 64], ['Light', 69], ['Middle', 74], ['Medium Heavy', 79.3], ['Heavy', 84.3], ['Super Heavy', 89.3], ['Ultra Heavy', null]] },
    'juv_f': { n: 'Juvenile (16–17), female (gi)', c: [['Rooster', 44.3], ['Light Feather', 48.3], ['Feather', 52.5], ['Light', 56.5], ['Middle', 60.5], ['Medium Heavy', 65], ['Heavy', 69], ['Super Heavy', null]] },
    'nogi_m': { n: 'Adult, male (no-gi)', c: [['Rooster', 55.5], ['Light Feather', 61.5], ['Feather', 67.5], ['Light', 73.5], ['Middle', 79.5], ['Medium Heavy', 85.5], ['Heavy', 91.5], ['Super Heavy', 97.5], ['Ultra Heavy', null]] },
    'nogi_f': { n: 'Adult, female (no-gi)', c: [['Rooster', 46.5], ['Light Feather', 51.5], ['Feather', 56.5], ['Light', 61.5], ['Middle', 66.5], ['Medium Heavy', 71.5], ['Heavy', 76.5], ['Super Heavy', null]] },
  };

  const ENERGY = { td: 3, sweep: 2, pass: 2, sub: 2, esc: 3, trans: 2, grip: 1, ctl: 1 };
  const RANKS = { st: 0, cg_b: 0, hg_b: -1, dlr_b: 0, sp_b: 0, bf_b: 0, xg_b: 1, slx_b: 1, cg_t: 0, og_t: 0, hg_t: 1, sc_t: 1, kob_t: 2, mt_t: 2, bk_t: 2, tt_t: 1, sc_b: -1, mt_b: -2, bk_b: -2, tt_b: -1 };
  // Per-node annotations (gi/no-gi, belt, points, energy, situation, outcomes, traps, rules). Keyed by path id.
  const META = window.BJJ_META || {};
  // Flatten to a list with stable, path-based ids
  function flatten() {
    const out = [];
    function walk(node, parent, kind, path) {
      const id = node.id || path;
      const rec = { id, k: kind, p: parent, n: node.n, en: node.en || '', t: node.t || '', s: node.s || [], x: node.x || '', to: node.to || '', cat: node.cat || '' };
      const m = META[id] || {};
      if (kind === 'pos') rec.rank = m.rank != null ? m.rank : (RANKS[id] != null ? RANKS[id] : 0);
      if (kind === 'mv') {
        rec.gi = m.gi || node.gi || 'both'; rec.belt = m.belt || node.belt || 'white'; rec.energy = m.energy || node.energy || ENERGY[rec.t] || 2;
        rec.pts = m.pts != null ? m.pts : node.pts != null ? node.pts : (rec.t === 'td' ? 2 : rec.t === 'sweep' ? 2 : rec.t === 'pass' ? 3 : rec.to === 'mt_t' || rec.to === 'bk_t' ? 4 : rec.to === 'kob_t' ? 2 : 0);
        rec.when = m.when || node.when || ''; rec.bait = m.bait || node.bait || ''; rec.kids = m.kids === false || node.kids === false ? false : true; rec.legal = m.legal || node.legal || '';
        rec.oc = m.oc || node.oc || (rec.to ? [{ to: rec.to, f: 'common' }] : []);
      }
      if (kind === 'df') { rec.f = m.f || node.f || 'common'; rec.bait = m.bait || node.bait || ''; }
      out.push(rec);
      (node.c || []).forEach((ch, i) => walk(ch, id, kind === 'mv' ? 'df' : 'mv', id + '.' + (i + 1)));
    }
    POS.forEach((p) => walk(p, null, 'pos', p.id));
    return out;
  }

  return { version: 3, nodes: flatten, plans: PLANS, routines: ROUTINES, belts: BELTS, beltGoals: BELT_GOALS, weightClasses: WEIGHT_CLASSES };
})();
