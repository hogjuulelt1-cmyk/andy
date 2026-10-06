# Chinbilig Tracker

Хүүгийн өдөр тутмын хөгжлийн дэвтэр: зуршил, хуваарь, хоол, дэлгэцийн цаг, бэлтгэлийн бүртгэл, зорилго, мөнгө, материалын сан, долоо хоногийн тойм, календарь.

Static site (no build step). Data lives in Supabase.

## Setup

1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL Editor.
2. **Sign-ups off**: Authentication → Sign In / Providers → turn off "Allow new users to sign up".
3. **Family accounts**: Authentication → Users → Add user → Create new user (email + password, "Auto confirm"). One for the parent, one for the son.
4. **Config**: put the Project URL and anon public key (Project Settings → API) in `config.js`.
5. **Vercel**: Add New Project → import this repo → Framework: Other → Deploy. Every push to `main` redeploys.

## Moving data from the Claude version

In the Claude artifact: Тохиргоо → "Нөөц хуулбар татах (JSON)". In this app: Тохиргоо → "Нөөц хуулбараас сэргээх". Files attached in the Claude version stay there and need re-uploading.

## Pattern Lab (`pattern-lab/`)

Тусдаа судалгааны хэрэгсэл: рулеткийн үр дүн, ширээний бооцоо, тоглогчдын бүртгэлээс хэв маяг хайж, шударга дугуйтай харьцуулан шалгана. `/pattern-lab/` хаягаар нээгдэнэ. Хөдөлгүүр нь `engine.js` (Node дээр ч ажиллана), судалгааны тэмдэглэл `pattern-lab/RESEARCH.md`.

## Жиу-житсу (`bjj/`)

Бэлтгэл, ахиц дэвшлийн тусдаа апп, `/bjj/` хаягаар нээгдэнэ, интерфейс нь англи хэлтэй. Дэвтэртэй нэг нэвтрэлт, нэг `docs` хүснэгт (`bjj/*` замууд). Хэсгүүд: Technique (байрлал → хийх зүйл → эсрэг талын хамгаалалт → дараагийн алхам, mindmap эсвэл жагсаалтаар, мөн тоглолтын төлөвлөгөө), Бэлтгэл (бүртгэл, сабмишн статистик, дугуйн таймер), Бие (халаалт, сунгалт, хүч, кардио), Зэрэг (бүс, судал, зорилго), Жин (бүртгэл, IBJJF ангилал), Тэмцээн (арга хэмжээ, барилдаан бүр). Анхны сан `bjj/seed.js`, код `bjj/app.js`. Бэлтгэлийн бүртгэл Дэвтэрийн өдрийн doc руу, бүс профайл руу толин тусгалаар хадгалагдана.

## Тэнхээ (`fit/`)

Хувийн йога, пилатес, фитнесийн апп, `/fit/` хаягаар нээгдэнэ, монгол интерфэйстэй. Хэрэглэгч 12 дэлгэцийн асуулгад хариулж, гэрийн тест хийснээр (суулт-босолт, планк, тэнцвэр, суналт) апп нь бэлэн хөтөлбөрөөс сонгох биш, дүрмийн хөдөлгүүрээр долоо хоногийн хөтөлбөрийг зорилго, өвдөлт, хэрэгсэл, цагт нь тааруулж бүтээнэ. Дасгал, хоолны зөвлөмж бүрийн доор "Яагаад" чип байна. Хоолны хэсэг нь Монгол хүнс, брэнд, үнэ (2025–2026, тооцоолол) дээр тулгуурлана.

Файлууд: `fit/SPEC.md` (гэрээ: схем, API, дизайн), `fit/lib.js` (277 дасгал), `fit/foods.js` (80 хүнс, хоолны загвар), `fit/engine.js` (шүүлт PAR-Q+, үнэлгээ, хөтөлбөр бүтээгч, дасан зохицол, хоол), `fit/app.js` + `fit/index.html` (UI). Тест: `node fit/test.js`, `node fit/test-lib.js`. Хөгжүүлэлтийн mock: `/fit/?mock=1`. Судалгаа: `reports/Хувийн йога фитнес апп судалгаа.md`.

Хадгалалт: Дэвтэртэй нэг нэвтрэлт, `docs` хүснэгтийн `fit/*` замууд; нэвтрээгүй бол зөвхөн төхөөрөмж дээр (localStorage).
