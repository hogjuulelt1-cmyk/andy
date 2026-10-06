# Chinbilig Tracker

Static PWA (no build step): `index.html` holds all CSS/JS, `config.js` the Supabase
URL + anon key, `supabase/schema.sql` the database. Deployed by Vercel on every push
to `main`. UI text is Mongolian; talk to the user in Mongolian.

`bjj/` is a separate sub-app (`index.html`, `app.js`, `seed.js`) with an English UI. It
shares the diary's Supabase session and `docs` table under `bjj/*` paths.

`fit/` ("Тэнхээ") is a personalized home yoga/pilates/fitness sub-app with a Mongolian UI.
`fit/SPEC.md` is the contract (schemas, engine API, design tokens): read it before changing
`lib.js` (exercise library), `foods.js`, `engine.js` (pure logic, Node-testable) or `app.js`.
Run `node fit/test.js` and `node fit/test-lib.js` after touching the engine or library.
Research behind it: `reports/Хувийн йога фитнес апп судалгаа.md`.

`tools/build.py` regenerates `index.html` from an old artifact file that is no longer
in the repo — edit `index.html` directly.

## Skills (in `.claude/skills/`)

Load the matching skill before starting the work:

| Task | Skill |
| --- | --- |
| Mobile feel, motion, gestures, translucent UI | `apple-design` |
| New screens, visual redesign, colors, type | `frontend-design`, `ui-ux-pro-max` |
| UI / accessibility review | `web-design-guidelines` |
| Checking a change in a browser, screenshots | `webapp-testing` |
| Mongolian copy in the app | `mn-humanizer` |
| Deploy questions | `deploy-to-vercel` |

## Agents

- Use `Explore` agents to locate code in `index.html` (~1000 lines, minified-style) instead of reading it whole.
- For a larger change, split independent parts (e.g. CSS vs JS, separate tabs) across parallel agents, then review the combined diff.
- After a UI change, have an agent run the `webapp-testing` flow at iPhone size in light and dark mode and report page errors and screenshots.

## Checks before pushing

- Serve locally with `config.js` set to `window.APP_CONFIG={}` (local mode, no login) and load the page in Playwright at iPhone 13 size: no page errors, no horizontal overflow.
- Form fields stay 16px (iOS zoom), motion respects `prefers-reduced-motion`.
