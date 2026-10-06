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

## Жиу-житсу

Тусдаа апп, тусдаа репо: `hogjuulelt1-cmyk/BJJ-APP`. Дэвтэртэй нэг Supabase төсөл, нэг нэвтрэлт, `docs` хүснэгтийн `bjj/*` замууд. Толгой хэсгийн "Жиу-житсу" холбоос `config.js` дэх `bjjUrl`-ийг заана.
