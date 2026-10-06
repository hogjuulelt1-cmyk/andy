# Travel BNPL

Солонгосын 20–30 насны залуучуудад Монголын багц аялал зарах mobile-first вэб апп: багц сонгох → 동행 бүлэгт нэгдэх → онгоцны билетийн төлбөрөөр суудал баталгаажуулах → үлдсэнийг явахаас өмнө 0%-ийн хуваан төлөлтөөр.

Энэ хавтас `andy` repo-гийн дэд хавтас (Chinbilig Tracker-тэй хамаагүй). Бүх командыг `travel-bnpl/` дотроос ажиллуул.

## Демо горим

Одоогоор апп бүхэлдээ **mock** горимоор ажиллана: нэвтрэлт cookie (нэр л оруулна), захиалга cookie-д, Toss checkout нь `src/components/toss-checkout.tsx` дээрх дууриамал дэлгэц, бүлгийн гишүүд/чат `src/server/members.ts`-ийн mock өгөгдөл + localStorage. DB, Auth.js, Toss SDK ирэхээр `src/server/session.ts`, `actions.ts`, `catalog.ts` гурван файлыг л солино.

## Ажиллуулах

```bash
cd travel-bnpl
pnpm install
pnpm db:generate          # Prisma client → src/generated/prisma
cp .env.example .env.local  # DATABASE_URL гэх мэт
pnpm dev
```

Шалгалт: `pnpm lint && pnpm typecheck && pnpm test` (+ `pnpm test:e2e` Playwright, iPhone 13 профайл). Stack, data model: `docs/tech-stack.md`; дараагийн алхмууд: `docs/roadmap.md` (M0 дууссан).

## Starter файлууд

Доорх хэсэг нь анхны starter-ийн тайлбар.

## Dotor ni yu bga ve

| File                                                      | Agulga                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                               | Claude-d zoriulsan gol zaavar: yu bütээh, biznesiin dürem (0% huvaalt, hüü avahgüi), stack, komanduud |
| `docs/product-spec.md`                                    | Hereglegch, flow (bagts → 동행 group → deposit → huvaalt), admin, v1-d orohgui züil                   |
| `docs/business-model.md`                                  | Anthony-giin shiidverüüd, margin, jishee tootsoo                                                      |
| `docs/packages.md`                                        | Govi / Terelj+Hustai / Hövsgöl bagtsuud, ödör büriin hötölbör, üne (taamaglal)                        |
| `docs/risks-and-open-questions.md`                        | Huuli, ajillagaa, örsölдөөн, Anthony-oos asuuh asuultuud                                              |
| `docs/tech-stack.md`                                      | Next.js + Prisma + Toss Payments, data model, folder butets                                           |
| `docs/roadmap.md`                                         | M0 (scaffold) → M5 (launch) alhamuud                                                                  |
| `seed/packages.json`                                      | Bagtsuudyn seed data                                                                                  |
| `.claude/settings.json`, `.claude/hooks/session-start.sh` | Cloud session ehlehed dependency suulgadag SessionStart hook                                          |

Docs ni Angli helээр bichigdsen (Claude Code iluu sain ashiglana), app-iin UI ni Solongos hel.

## Yaj ashiglah

1. GitHub deer shine (private) repo üüsge, jishee `travel-bnpl`.
2. Ene folderiin bükh file-g (`.claude` folder oruulaad) repo-giin root-d hiigeed push hiine.
3. claude.ai/code deer ter repo-g songoj shine session neene.
4. Ehnii prompt: **"CLAUDE.md, docs/roadmap.md-g unshaad M0-g hii"**.

Hook ni `package.json` baihgüi üed yu ch hiihgüi, M0 scaffold hiisnii daraa `pnpm install` + `prisma generate` automataar ajillana.
