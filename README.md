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

---

# Хамт (`/hamt`)

Найзуудтайгаа хамт зуршил тогтоож, зорилгодоо хүрэх апп. Нээх: `https://<домэйн>/hamt/`.

- **Өнөөдөр**: өдрийн зуршлаа тэмдэглэнэ, багийнхны өнөөдрийн ахицыг харж 👏 илгээнэ.
- **Баг**: багийн долоо хоногийн хувь (зорилт 80%), гишүүдийн "хээ", чансаа, бооцоо, долоо хоногийн тайлан.
- **Зорилго**: том зорилго, яагаад чухал вэ, хугацаа, холбоотой зуршлууд.
- **Би**: статистик, апп-ын ард байгаа судалгаанууд (эх сурвалжтай).

Тохиргоогүй үед зөвхөн төхөөрөмж дээр ажиллаж, жишээ баг харуулна. Найзуудтайгаа хамт ашиглахын тулд:

1. Гэр бүлийн апп-аас **тусдаа** Supabase төсөл үүсгэнэ (энд бүртгэл нээлттэй байх ёстой, харин гэр бүлийн `docs` хүснэгт нэвтэрсэн бүх хүнд нээлттэй).
2. SQL Editor дээр `supabase/hamt.sql`-г ажиллуулна.
3. Authentication → Sign In / Providers: Email идэвхтэй, "Allow new users to sign up" асаалттай. Хурдан эхлэх бол "Confirm email"-г унтрааж болно.
4. Authentication → URL Configuration → Site URL: `https://<домэйн>/hamt/`.
5. `hamt/config.js` дотор Project URL болон anon key-г бичнэ.

Багт урих: Баг → Тохиргоо → "Урилга илгээх". Холбоосоор орсон хүн бүртгүүлмэгц багт нэгдэнэ.
