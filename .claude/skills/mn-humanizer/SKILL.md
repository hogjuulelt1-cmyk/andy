---
name: mn-humanizer
description: Rewrite or write Mongolian (Cyrillic) text so it reads like a native writer, not an English draft translated by AI. Use for any Mongolian prose - site copy, posts, emails, memos, pitches, articles, legal text - and whenever the user says Mongolian text sounds like AI, translated, stiff, or "AI slop". Run it together with humanizer-main / no-ai-slop, which cover English-origin tells.
---

# mn-humanizer

Claude's Mongolian usually fails the same way: the thinking is English, the words are Mongolian. Sentences come out short, same length, subject-first, with English rhetorical moves translated word for word. Native writing is built differently. Fix the structure first, the words second.

Reference voice: baabar.mn columns (Баабар, Саруул, Сүхбаатар, Батбаяр). Read one of them before a long piece if you can reach it. Match their grammar habits, not their topics.

## 1. What AI Mongolian looks like

**English rhetoric, translated**
- Staged openers: "Бидний санал энгийн." "Асуулт нь энэ." "Үнэн хэрэгтээ..." Cut; start with the content.
- Not-X-but-Y: "Реклам биш, агуулга." "Зүгээр нэг X биш, Y." Say what it is.
- One-line closers and fragments: "Монголыг төлөөлөх цорын ганц баг энэ." "Аварга болохыг хүлээхгүй." Fold into the previous sentence.
- Calqued idioms: "бид сонссон" (we heard you), "бодит болгоно" (make it real), "гурван баганатай" (three pillars), "ширээн дээр байна", "тоглоомыг өөрчлөх". Replace with the plain Mongolian verb.
- "Бид" as subject in every sentence. Mongolian drops the subject when it is obvious.

**Rhythm**
- Every sentence 5-9 words, one clause, full stop. This is the strongest tell. Native prose joins actions with converbs and lets sentences run 20-40 words when the thought is one thought.
- Questions written as statements with a period ("...орж ирж байгаа юм уу."). Either use "?" or turn them into a list inside one sentence: "..., ... үлдэх үү гэх мэт."

**Word level**
- Bureaucratic filler: "чухал ач холбогдолтой", "онцгой анхаарал хандуулах", "хэрэгжүүлэх ажлыг зохион байгуулах", "тэмдэглэх нь зүйтэй", "дүгнэж хэлэхэд", "өөрөөр хэлбэл", "үүний зэрэгцээ" at sentence starts, "та бүхэн".
- Chains of -ын/-ийн three deep. Break with a verb.
- "Энэ нь ... юм" in every other sentence (English "This is...").
- Raw English inside Mongolian with no reason: clinic, milestone, social reach, insight, engagement. Use the Mongolian word; if the English term matters, gloss it once with "буюу": "Grand Master буюу Их мастер".
- «Ёлочка» quotes and semicolons. Mongolian text uses “ ” and almost never ";".

**Facts**
- Invented statistics that sound precise ("итгэл 28 хувиар өссөн"). Any number, date, or company fact you did not get from the user or a source gets a `[шалгах]` flag. Never present it as known.

## 2. What native Mongolian does

**Converbs carry the flow.** Chain clauses instead of cutting them:
-ж/-ч, -аад/-ээд, -саар, -тал, -вал/-вэл, -сан бол ... харин, -хдаа, -снаар, -магц.
Bad: "Капитрон ивээн тэтгэгч болсон. Баг нэрээ сольсон."
Good: "Капитрон ерөнхий ивээн тэтгэгч болсноор баг “Өмнөговийн Хүлэгүүд” гэж нэрлэгдэх болов."

**Endings carry the stance.** Vary them; do not end everything in -на / -лаа.
- Reported or discovered fact: -жээ, -чээ, ажээ, аж, -сан байна, гэнэ.
- Known shared fact: билээ, юм билээ, юм.
- Guess: бололтой, байх, бизээ.
- Plain narration: -лаа, -лээ, -ов, -эв, -сан.
- Plan: -на, -нэ, -хаар төлөвлөж байна.

**Connectors that humans actually use:** Гэхдээ, Гэвч, Гэтэл, Харин, Ялангуяа, Тэр байтугай, Үүнтэй адилаар, Үүнд, Иймээс, Тийм ч учраас, Үнэхээр ч, Үүнээс хойш, Дараа нь, мөн дээр нь нэмээд, ... буюу ... . Use them where the logic turns, not to decorate.

**Concrete first.** Paragraphs open with a date, place, person, or number ("1926 онд...", "1951 оны зуны нэгэн өдөр..."), not with a thesis. They end on a fact or a short aside, not on a moral.

**Names:** initial + name ("М.Пунсалмаа"), full name once, then short.

**Particles and idiom, by register only:**
- Essay, column, social post, founder voice: л, шүү, даа, юм л даа, бизээ, лээ are fine and help. So is one proverb or folk image if it fits ("Бие нь жижиг ч бэлчээр нь том"). The author may appear: "Би ч гэсэн очлоо."
- Business memo, proposal, email to a client: no даа/шүү, no proverbs. Still use converbs, varied endings, and dropped subjects. Formal is not the same as choppy.
- Site UI and legal: short is correct for buttons and labels. Legal body text follows the numbered formal style of the source document; still no calques.

## 3. Process

1. Draft directly in Mongolian. Do not write English and translate.
2. Read the draft and mark every sentence under 10 words. Merge the ones that belong to the same thought with a converb.
3. Delete openers, closers, not-X-but-Y, and calques from section 1.
4. Check endings: at least three different ending types in a paragraph of 4+ sentences.
5. Replace unexplained English words. Fix quotes to “ ”, remove ";".
6. Flag unverified numbers with `[шалгах]`.
7. Spelling pass: ө/ү, е/ё/ю, у/ү, -ын/-ийн/-ы/-ий after the right vowel, "ё" not "йо".

## 4. Worked example (business memo register)

**AI draft**
> Хүлэгүүд баг 2026 онд гурван удаа нэрээ сольсон. Тавдугаар сард BCL Asia-д «Chinggis Broncos» гэж тоглов. Наймдугаар сарын 11-нд ХасБанк 22 жилийн дараа ивээн тэтгэхээ больж, баг бие даасан клуб боллоо. [...] Монголыг төлөөлөх цорын ганц баг энэ.
>
> Фэнүүд юу асууж байгааг бид сонссон. Капитрон спортын салбарт шинээр том тоглогч болж орж ирж байгаа юм уу. Хүлэгүүд нэр, лого, өнгө үлдэх үү. [...] Эдгээрт логоноос өмнө хариулах хэрэгтэй.
>
> Бидний санал энгийн. Нэг мессэж, бүх сувгаар. [...] Реклам биш, агуулга: [...] Аварга болохыг хүлээхгүй. [...]
>
> Хэмжилт гурван баганатай: брэндийг таних судалгаа, апп болон дансны тоо, social reach.

**Rewrite**
> Хүлэгүүд баг энэ онд гурван ч удаа нэрээ сольжээ. Тавдугаар сард BCL Asia-д “Chinggis Broncos” нэрээр тоглож байсан бол наймдугаар сарын 11-нд ХасБанк 22 жил ивээн тэтгэсний эцэст гэрээгээ сунгаагүй тул баг бие даасан клуб болсон. Есдүгээр сард Капитрон ерөнхий ивээн тэтгэгч болсноор баг “Өмнөговийн Хүлэгүүд” гэж нэрлэгдэх болов. Аравдугаар сарын 3-нд EASL-ийн шинэ улирал эхлэхэд Монголоос оролцох ганц баг нь Хүлэгүүд байх юм.
>
> Фэнүүдийн дунд асуулт цөөнгүй байна: Капитрон спорт руу яагаад орж ирэв, Хүлэгүүдийн нэр, лого, өнгө хэвээр үлдэх үү, Улаанбаатарт тоглодог багийг яагаад Өмнөговийнх гэж нэрлэв, Сэргэлэн, Билгүүн, Азбаяр нар үлдэх үү гэх мэт. Шинэ лого гаргахаас өмнө эдгээрт хариулт өгөх хэрэгтэй гэж үзэж байна.
>
> Санал маань ийм байна. Капитрон, баг хоёр хамтдаа нэг гол мессеж сонгоод бүх сувгаар түүнийгээ л ярина, эхлэх санаа нь “Багтайгаа ойрхон”. Сурталчилгааны оронд бэлтгэл, аялал, хувцас солих өрөөний яриаг UFC Embedded маягийн богино цувралаар үзүүлнэ. [...] Аваргын цомыг хүлээлгүй рекорд оноо, дараалсан хожил, тоглогчийн хувийн амжилт бүрийг фэнүүдтэй хамт тэмдэглэж урамшуулна.
>
> Үр дүнг брэндийг таних судалгаа, апп болон дансны тоо, сошиал сүлжээний хүрээ гэсэн гурван үзүүлэлтээр улирлын эхэнд, төгсгөлд хэмжинэ.

What changed: staccato sentences merged with -сан бол, -снаар, -хэд; endings varied (-жээ, -сан, -ов, юм); opener "Бидний санал энгийн", slogan fragment "Нэг мессэж, бүх сувгаар", not-X-but-Y "Реклам биш, агуулга" and closer "Монголыг төлөөлөх цорын ганц баг энэ" removed; question-statements turned into one list sentence; "бид сонссон", "гурван баганатай", "social reach", «» fixed. The comparison paragraph (Beşiktaş, Barclays 28%, BRI 11→27 сая) needs `[шалгах]` on every figure, and Beşiktaş is a football club, not a bank.
