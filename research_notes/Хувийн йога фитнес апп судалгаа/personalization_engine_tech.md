# Personalization engine for a yoga/pilates/fitness + nutrition app: technical and product-design research

Scope note: researched 2026-10-06. Web search budget ran out mid-task and the egress proxy blocked direct fetches of most primary pages (fitbod.me, revenuecat.com, adapty.io, arxiv.org, PMC, openai.com, ouraring.com, lazyweb.com, macrofactor.com). Findings below therefore rest on search-result extracts of those pages plus full reads of GitHub repos and Anthropic's official docs. Where a number comes only from a secondary/aggregator page, that is stated. Engineering sketches (data model, rule sets, cost math) in the "Inferences" sections are my synthesis, not sourced claims.

---

## KQ1. Architectures used in practice (Down Dog, Fitbod, Juggernaut AI, Freeletics, Zing, WHOOP Coach, Oura Advisor, Strava)

### Takeaway
No vendor publishes its actual algorithm, but the public descriptions converge on one pattern: a deterministic/parametric engine (exercise graph + constraints, or muscle-recovery scoring, or RPE rules) decides *what* the workout is, and since 2023 an LLM layer (GPT-4 at WHOOP, Claude on Bedrock at Strava, proprietary at Oura, "Coach+ Pilot" at Freeletics) is bolted on only for *conversation, explanation and insight text*. Nobody public lets the LLM invent the program.

### Cited Findings
- Down Dog: "Every practice is generated just for you. You pick your time, level, focus, voice, and music — and Down Dog builds a brand-new class that never repeats"; it generates "a new sequence, new music, and new cues every session" — [Down Dog](https://www.downdogapp.com/). Down Dog "says it has over 60,000 configurations so that you'll never hear the instructor say the same thing in the same order" — [Local3News What-the-Tech](https://www.local3news.com/local-news/what-the-tech/what-the-tech-down-dog-app-provides-different-routines-during-each-use/article_31cc9993-3a00-5f96-9479-f16a4573263f.html). First-run options are instructor voice, music, yoga type (meditation/stretch/traditional), body-part target (glutes, hamstrings, back, legs) and focus (flexibility, relaxation, strength) — [Healthify NZ review](https://healthify.nz/apps/y/yoga-down-dog-app). No technical write-up of the sequencing engine was found (see Gaps).
- Fitbod: "two core engines: an Exercise Selector (what you do) and a Capability Recommender (how much weight, sets, and reps)"; built on "400 million+ logged workouts" — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm). "Fitbod scores every exercise based on how recovered the required muscles are"; after each logged workout it "estimates how much each muscle group was worked (by sets, reps, and load) and assigns a recovery percentage from 0–100%", shown as a muscle heat map — [Fitbod: How Fitbod Creates Your Workout](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout); [Fitbod: tracking volume, intensity, recovery](https://fitbod.me/blog/tracking-volume-intensity-and-recovery-with-fitbod/). Inputs: goal (build muscle / get stronger / get lean / lose weight), training history and estimated strength, recent muscle fatigue, available equipment; 1RM is "estimated dynamically ... from your logged performance, then adjusts every session" — [Fitbod personalization](https://fitbod.me/blog/how-fitbod-personalizes-your-workout-plan-using-smart-training-algorithms/). "Strength Score converts your estimated strength across many exercises into a 0–100+ score for each muscle group ... developed by feeding billions of data points into a custom machine learning model that estimates how different exercises load different muscles" — [Fitbod Insights](https://fitbod.me/blog/fitbod-insights-feature/).
- JuggernautAI: "The autoregulation is a rules engine that takes your readiness inputs (sleep, soreness, motivation) and your performance feedback (the RPE and RIR you log per set), then adjusts load and volume for the next session or week" — [FitnessVolt comparison](https://fitnessvolt.com/rpe-training/comparisons/rpe-calculator-vs-juggernautai/). Three loop levels: pre-session readiness check (sleep, mood, energy, soreness) adjusts the day's volume/weight; per-set RPE on top set and back-off sets adjusts the following sets in real time; weekly check-in adjusts volume/intensity/frequency; end of block makes larger changes — [JTS help: how JuggernautAI is individualized](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); [JTS: RPE and RIR](https://help.jtsstrength.com/en/articles/2-all-about-rpe-and-rir).
- Freeletics: AI Coach first released 2017; "The Coach's algorithm crafts personalized recommendations for exercises, reps, and sets using input like your age, gender, and fitness level"; claims the Coach "adapts each training session as you go with a 90% accuracy after week one" (vendor claim, methodology not given); recommendations based on "your feedback and millions of data points collected from 58 million users" — [Freeletics: AI and your Coach](https://freeletics.com/en/blog/posts/AI-and-your-Coach); [Freeletics sports science](https://freeletics.com/en/blog/posts/freeletics-sports-science). July 2024: "Coach+ Pilot", a generative-AI layer where "LLMs and generative AI will emulate a lifelike personal training experience with personalised dialogues for guidance, feedback, and motivation" — [Fitt Insider press release](https://insider.fitt.co/press-release/freeletics-unveils-a-new-era-in-digital-fitness-with-the-launch-of-coach/).
- WHOOP Coach (Sept 2023): "AI-based chatbot powered by OpenAI's GPT-4 model with access to all of your personal WHOOP data"; "After fine-tuning with anonymized member data and proprietary WHOOP algorithms, GPT-4 was able to deliver extremely personalized, relevant, and conversational responses"; "all data is anonymized before being sent to the LLM, and the partner hosting the LLM has a Zero-Retention/Zero Training Policy"; answers in "over 50 languages" — [OpenAI customer story](https://openai.com/index/whoop); [BikeRadar](https://www.bikeradar.com/news/whoop-coach-chatgpt-4/); [the5krunner](https://the5krunner.com/2023/09/27/whoop-coach-openai-chargpt/).
- Oura Advisor: uses "your own short- and long-term data, manual inputs, and previous interactions"; in April 2026 Oura added a "proprietary large language model designed for women's health" that "draws from established medical standards, research, and knowledge sources reviewed by Oura's in-house team of board-certified clinicians" — [Oura blog](https://ouraring.com/blog/oura-advisor/); [Wareable](https://www.wareable.com/health-and-wellbeing/oura-advisor-womens-health-ai-labs-announcement-launch); [T3](https://www.t3.com/active/fitness-trackers/oura-smart-ring-womens-health-llm-advisor).
- Strava Athlete Intelligence: "powered by Claude in Amazon Bedrock"; "handles 14 million tokens per minute at peak"; "More than 80 percent of users who provided feedback indicated that they found the Athlete Intelligence insight to be 'very helpful' or 'helpful'"; subscriber-only; turns activity metrics into short "upbeat insights" — [AWS case study](https://aws.amazon.com/solutions/case-studies/strava-case-study/); [Running Magazine](https://runningmagazine.ca/the-scene/strava-launches-ai-powered-guidance-feature-for-athletes/).
- Zing Coach: "checks in daily about energy levels, mood, and sleep, adjusting the workout plan in real-time"; "uses LLM-based chat dialogues for personalization, with over 30K monthly fitness dialogues as part of its unique AI training data" — [App Store listing](https://apps.apple.com/app/id1552207792); [DataCamp PDF on Zing](https://media.datacamp.com/cms/using-data-to-improve-your-fitness.pdf).

### Inferences
- The industry-standard split for a small team: (1) a deterministic "program builder" over a tagged exercise library (Down Dog-style parametric sequencing for yoga/pilates; Fitbod-style per-muscle fatigue scoring for strength), (2) a thin rules engine for autoregulation (Juggernaut-style readiness + RPE), (3) an LLM only for Mongolian coaching copy, explanations and Q&A grounded in the generated program and logs (WHOOP/Strava pattern).
- Fitbod's recovery percentage can be approximated without ML: per-muscle fatigue = Σ(sets × load_factor × involvement_weight), decaying exponentially toward 0 over ~48–72 h; exercise score = Σ over muscles of (recovery% × involvement). This is enough for "don't hit the same tissue two days in a row".
- Down Dog's "60,000 configurations" is a product count of (time × level × focus × boost × voice × music), not a count of sequences; the engine itself is almost certainly a pose graph with legal transitions and template slots.

### Gaps
- No primary technical description of Down Dog's sequencer exists publicly (only product copy). The founder-interview search could not run (budget exhausted).
- Fitbod's actual fatigue decay constants and muscle involvement weights are proprietary; only the 0–100% output is described.
- Freeletics "90% accuracy" has no published methodology.

---

## KQ2. Rule-based / expert-system approach and open exercise databases

### Takeaway
A tagged exercise library + template slots + constraint filtering is the approach academia (SmartFit/GECKO, LiftEngine) and practitioners both use; good open data exists for strength (free-exercise-db, public domain, 873 exercises with images; exercemus/wger CC data) but there is no open, well-licensed yoga or pilates library with media, so that part must be authored in-house.

### Cited Findings
- free-exercise-db: "873 individual JSON documents describing strength, stretching, plyometric, powerlifting, olympic-weightlifting, strongman and cardio exercises", released under the Unlicense (public domain); fields: id, name, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images; JPG images hosted via raw.githubusercontent; combined dataset at `dist/exercises.json`; maintainer notes force/mechanic/equipment are incomplete for some entries — [GitHub yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db); [apis.io listing](https://apis.io/providers/free-exercise-db/).
- wger: code AGPL-3.0-or-later; exercise and ingredient data "licensed additionally under one of the Creative Commons licenses, see the individual exercises"; REST API; community translations via Weblate — [GitHub wger-project/wger](https://github.com/wger-project/wger).
- exercemus/exercises: MIT code; "individual exercises have their own licenses (only open-source licensed exercises included)"; schema has category, name, aliases, description, instructions, tips, equipment, primary/secondary muscles, tempo, variation relationships, licensing/attribution; optional image URLs and YouTube embeds; data merged from exercemus.com, wger.de and exercises.json — [GitHub exercemus/exercises](https://github.com/exercemus/exercises).
- ExerciseDB API: repo under AGPL-3.0 but the data service is freemium: "11,000+ structured fitness exercises", "15,000+ videos, 20,000+ images, 5,000+ GIFs"; free tier has "strict rate limits" and is "not recommended for production integration"; paid plans for production — [GitHub exercisedb/exercisedb-api](https://github.com/exercisedb/exercisedb-api). Also sold via RapidAPI/Zyla marketplaces — [Zyla listing](https://www.zylalabs.com/api-marketplace/top-search/Exercise%20DB).
- Yoga-82 (CVPRW 2020): 82 pose classes, ~28.4K images, three-level hierarchy (standing, sitting, balancing, inverted, reclining, wheel → variations → pose names); it is a classification dataset of scraped images, and no explicit open license for the images was found — [CVF open access](https://openaccess.thecvf.com/content_CVPRW_2020/html/w70/Verma_Yoga-82_A_New_Dataset_for_Fine-Grained_Classification_of_Human_Poses_CVPRW_2020_paper.html); [Neurohive summary](https://neurohive.io/en/news/yoga-82-new-dataset-with-complex-yoga-poses/).
- SmartFit: "knowledge-based system for generating training plans tailored to individual trainees, developed as an application of a constraint-based configuration system called GECKO, which generates optimal or optimized configurations satisfying high-level user demands" — [TUM publication page](https://portal.fis.tum.de/en/publications/smartfit-using-knowledge-based-configuration-for-automatic-traini/).
- LiftEngine (commercial): "uses a constraint-based solver to rule out infeasible options and a genetic algorithm that evaluates feasible plans against ten training-quality criteria including progressive overload and muscle balance" — [Product Hunt](https://www.producthunt.com/p/liftengine).
- Pre-exercise screening: the standard instrument is PAR-Q+, used to flag conditions needing clearance before exercise (search for primary source could not run; well-established instrument, see Gaps).

### Inferences
- Recommended exercise record (Supabase/Postgres, JSONB where flexible):
  ```
  exercises(
    id text pk, slug, name_mn, name_en,
    modality enum(yoga|pilates|strength|mobility|cardio|breath),
    movement_pattern enum(hinge|squat|lunge|push_h|push_v|pull_h|pull_v|carry|rotation|anti_rotation|flexion|extension|lateral_flexion|balance|inversion|backbend|forward_fold|twist),
    primary_muscles text[], secondary_muscles text[],
    equipment text[]          -- 'none','mat','block','strap','band','dumbbell','chair','wall'
    difficulty smallint 1-10, impact enum(none|low|high),
    position enum(standing|kneeling|seated|supine|prone|side|inverted|plank),
    unilateral bool, is_hold bool, default_hold_s int, default_reps int, default_tempo text,
    contraindications text[]  -- 'pregnancy_t2','pregnancy_t3','hypertension','wrist_pain','knee_pain','low_back_acute','shoulder_impingement','glaucoma','osteoporosis','postpartum_6w','diastasis'
    regression_of text fk, progression_of text fk,   -- graph edges
    transitions_from text[]   -- for yoga flow legality (pose graph)
    media jsonb               -- {image, loop_mp4, lottie, cue_audio_mn}
    cues_mn text[], breath_cue_mn text, license text, source text)
  ```
- Session template ("fill the slots"): warm-up 10–15% of time (position-matched, impact none) → main block 55–65% (goal-weighted movement patterns) → accessory/core 15% → cool-down/breath 10–15%. Time filling is a bounded knapsack: each candidate has duration (sets × (reps × tempo + rest) or hold_s × sides) and value (goal weight × novelty × recovery%), fill until time budget − 30 s.
- Example rule set (declarative, store as JSON rows in a `rules` table so non-devs can edit):
  - `IF profile.pregnancy_trimester >= 2 THEN exclude position IN (prone, supine_long_hold>60s), exclude contraindication 'pregnancy_t2', cap difficulty 5, cap impact none`
  - `IF assessment.pain.low_back = true THEN exclude movement_pattern IN (hinge heavy, backbend deep), prefer regression_of for flexion poses, add 'cat-cow' to warm-up`
  - `IF equipment = ['none'] THEN candidates = equipment ⊆ {none, mat, wall, chair}`
  - `IF goal = weight_loss THEN main block ≥ 40% compound patterns, rest ≤ 45 s, include 1 low-impact cardio circuit if impact allowed`
  - `IF level = beginner THEN difficulty ≤ 4, no inversions, no single-leg balance > 20 s, hold ≤ 30 s`
  - `IF prefers_floor = true OR space = small THEN weight position IN (supine, prone, seated, kneeling) × 1.5`
- Yoga sequencing legality: encode `transitions_from` so consecutive poses change position at most one level (standing → kneeling → seated → supine) and never jump inverted → standing without a counter-pose; alternate flexion/extension and left/right sides; Down Dog's observable output follows exactly these conventions.
- Licensing plan: seed strength library from free-exercise-db (public domain, no attribution needed) and exercemus (per-exercise CC attribution stored in `license`/`source`); author the yoga/pilates library (poses, Mongolian names, cues) in-house because no open media library exists; treat ExerciseDB as a paid media option only.

### Gaps
- No open pilates exercise dataset found at all; no yoga dataset with openly licensed demo media (Yoga-82 is images for ML classification, license unclear).
- Number of exercises in wger and exercemus not stated on their READMEs.
- Could not fetch SmartFit full text (constraint types, solver evaluation) — proxy blocked.
- PAR-Q+ primary source not retrieved (search budget exhausted).

---

## KQ3. Constraint-satisfaction / optimization, recommender systems, bandits

### Takeaway
Academic work frames plan generation as constraint configuration (SmartFit/GECKO), grammatical-evolution/GA over a fitness-fatigue model (Connor 2019), or CSP-then-GA (LiftEngine); for adapting *delivery* (when/what to nudge), the best-documented method in mHealth is a Thompson-sampling contextual bandit (HeartSteps). Collaborative filtering is impractical for a small new app (cold start, tiny user base); content-based scoring over tags is the realistic path.

### Cited Findings
- Connor et al. 2019 (IEEE CEC): "grammatical evolution approach to genetic programming, with a grammatical encoding that dictates plan structure and a fitness-fatigue model calculating plan quality using performance metrics" for seasonal plans for elite athletes — [GP bibliography entry](https://gpbib.cs.ucl.ac.uk/gp-html/Connor_2019_CEC.html).
- SmartFit/GECKO: constraint-based configuration "generates optimal or optimized configurations satisfying high-level user demands" — [TUM](https://portal.fis.tum.de/en/publications/smartfit-using-knowledge-based-configuration-for-automatic-traini/).
- LiftEngine: constraint solver prunes infeasible plans, then GA scores against "ten training-quality criteria including progressive overload and muscle balance" — [Product Hunt](https://www.producthunt.com/p/liftengine).
- A UNO honors thesis "aims to develop a mathematical model for generating personalized workout plans by leveraging optimization techniques such as linear programming and genetic algorithms" — [UNO Digital Commons](https://digitalcommons.unomaha.edu/university_honors_program/347).
- US patents 11,684,821 and 12,102,877 "Virtual athletic coach" cover automated plan generation (relevant as prior-art/landmine awareness) — [USPTO 11684821](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11684821); [USPTO 12102877](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12102877).
- HeartSteps: "a contextual bandit trained online with Thompson sampling that maintains a Bayesian model of how the current context predicts a participant's response"; decides "at each candidate decision point the probability of delivering a contextually tailored activity suggestion"; HeartSteps V1 was a 42-day trial with Fitbit — [Liao et al., Personalized HeartSteps (arXiv 1909.03539)](https://arxiv.org/abs/1909.03539v1); actor-critic contextual bandit variants — [arXiv 1706.09090](https://arxiv.org/pdf/1706.09090), [arXiv 1802.09714](https://arxiv.org/pdf/1802.09714). JITAIs are "a sequence of decision rules that takes the user's current context as input and specifies whether and what type of an intervention should be provided" — [arXiv 2307.13916](https://arxiv.org/pdf/2307.13916).
- Explanation/recsys: in a controlled food-recommender study, "the mobile application successfully explained the reasons behind the recommended meals ... and this explanation process led to an increase in trust in the recommendations" despite a preference mismatch — [imec publication](https://imec-publications.be/handle/20.500.12860/59547). (More in KQ6.)

### Inferences
- For v1, skip solvers: a greedy slot-filler with hard-constraint filtering and a weighted score is deterministic, debuggable, explainable and runs in <10 ms in the browser (fits the no-build PWA). Score(e) = w_goal·match(e.pattern, goal_weights) + w_recov·recovery(e.muscles) + w_novel·(1 − seen_last_7d) + w_pref·liked(e) − w_diff·|e.difficulty − target| ; hard filters: equipment, contraindications, position prefs, time.
- Use a bandit only for *difficulty step and nudge timing*, not exercise choice: arms = {−1, 0, +1 difficulty step}, context = {last RPE, completion %, days since last session, sleep self-report}, reward = completed_session ∧ RPE in [6,8] ∧ no pain. Thompson sampling with Beta priors per arm per user-segment needs no ML infra and works with ~10 observations.
- Collaborative filtering only becomes viable with thousands of users logging liked/skipped exercises; until then, "users like you" can be faked with segment-level priors (age band × level × goal).

### Gaps
- Could not read Connor 2019 or SmartFit full texts for constraint lists/evaluation numbers.
- No peer-reviewed survey on CF vs content-based specifically for exercise recommendation was retrieved before the budget ran out.

---

## KQ4. LLM approach (2025–2026): pros/cons, safety, constraining, cost, latency, hybrid pattern, Mongolian

### Takeaway
Evidence says unconstrained LLM programs are accurate on what they say (~91%) but incomplete (41% of gold-standard content), miss FITT parameters, and can be unsafe for people with comorbidities; the viable 2026 pattern is "rules decide structure, LLM writes text", with Claude's GA structured outputs / strict tools pinning the LLM to a curated library. At official prices a Haiku 4.5 program explanation costs ~$0.01–0.03; Mongolian is weaker than English in LLMs (74% vs 90.7% in one benchmark) and tokenizes less efficiently, so keep generated Mongolian short and templated.

### Cited Findings
- ChatGPT exercise recommendations (UConn, 2024): output "provided only 41% of the content expected in a gold-standard exercise recommendation" and "failed to provide guidance on key elements such as frequency, intensity, time, and type (the FITT principle)", though "of the content provided, ChatGPT output demonstrated high accuracy, around 91%" — [UConn Today](https://today.uconn.edu/2024/02/are-chatgpt-exercise-recommendations-just-what-the-doctor-ordered); [JMIR Med Educ 2024](https://mededu.jmir.org/2024/1/e51308/PDF).
- ChatGPT-4o exercise plans for type 2 diabetes rated by coaching experts: "Some exercise plans showed serious safety issues, especially for patients with secondary diseases/complications" — [PMC12031090](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12031090/).
- ChatGPT vs Gemini resistance-training prescriptions, 25 licensed evaluators: no significant differences; both "perceived as moderately good"; conclusion: LLMs "may be useful as auxiliary tools for drafting training programs, but they do not yet demonstrate sufficient technical refinement to replace professional expertise, particularly regarding individualization, load progression, and systematic risk management" — [JMIR preprint 93865](https://preprints.jmir.org/preprint/93865); [Inonu Univ. record](https://abakus.inonu.edu.tr/items/cd310f69-2e27-4d13-9c47-e54b241a85c2).
- Claude structured outputs are GA on Opus 5.5/5/4.8/4.7/4.6, Sonnet 5.5/5/4.6/4.5, Haiku 4.5 (and Fable/Mythos). Two mechanisms: `output_config.format` (JSON schema) and `tools[].strict: true` (constrained decoding on tool inputs). Supported: enum, const, anyOf/allOf (limited), $ref, required, additionalProperties:false, string formats, simple regex. Not supported: recursive schemas, min/max numeric constraints, minLength/maxLength. First request with a new schema pays grammar-compile latency; schema cached 24 h. Limits: 20 strict tools/request, 24 optional params, 16 union-typed params. Refusals can return non-schema output with `stop_reason: "refusal"`; enum capitalization not guaranteed — [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- Official Claude API prices (per MTok, input / output): Haiku 4.5 $1 / $5 (cache read $0.10); Sonnet 5.5 $2 / $10; Sonnet 5 $2 / $10; Sonnet 4.6 $3 / $15; Opus 5.5 $4 / $20; Opus 5 and 4.8 $5 / $25. Batch API = 50% off. Cache read = 0.1× input (5-min write 1.25×, 1-h write 2×). "Claude 4.7 and later models ... use a newer tokenizer ... produces approximately 30% more tokens for the same text" (Sonnet 4.6 and earlier use the old tokenizer). "1 token is approximately 4 characters or 0.75 words in English. The exact count varies by language" — [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing). (A third-party page listed Opus 4.8 as current flagship at $5/$25, consistent — [Finout](https://finout.io/blog/anthropic-api-pricing).)
- Mongolian LLM quality: MM-Eval (Modern Mongolian, Cyrillic): 569 syntax, 677 semantics, 344 knowledge, 250 reasoning tasks; models tested (Qwen2-7B, GLM4-9B, Llama3.1-8B, GPT-4, DeepSeek-V2.5) "all performed better on syntactic tasks than semantic tasks" — [arXiv 2411.09492](https://arxiv.org/abs/2411.09492). A 2026 study found "a consistent performance gap of 13.8–16.7 percentage points between English and low-resource language conditions. Mongolian direct prompting achieves 74.0% accuracy compared to English's 90.7%. Mean response time increases from 7.3 seconds in English to 25.0 seconds for Mongolian direct prompting" — [arXiv 2603.21036](https://arxiv.org/html/2603.21036v1). MonCulture-Eval benchmarks cultural knowledge across Traditional and Cyrillic scripts — [ACL Findings 2026](https://aclanthology.org/2026.findings-acl.1449.pdf).
- WHOOP's guardrails: data anonymised before the LLM call, zero-retention hosting, fine-tuning on anonymised member data plus "proprietary WHOOP algorithms" — [OpenAI/WHOOP](https://openai.com/index/whoop). Oura grounds its model in clinician-reviewed sources — [Oura](https://ouraring.com/blog/oura-advisor/).

### Inferences
- Hybrid architecture (recommended):
  1. Browser/Edge Function runs the deterministic builder → `program.json` (exercise ids, sets/reps/holds, order, rationale codes like `R_LOWBACK_REGRESSION`).
  2. One Claude call with `output_config.format` schema `{week_intro_mn, per_session: [{title_mn, why_mn (≤180 chars), cue_overrides: [{exercise_id (enum of ids in this program), cue_mn}]}], cautions_mn[]}` — the enum of exercise ids makes it impossible to introduce an unknown exercise. Pass rationale codes and let the LLM only verbalise them. Mark the LLM text as `coach_text` and never let it change sets/reps/load.
  3. Post-validate server-side: every exercise_id ∈ program, no digits that change prescriptions (regex), banned-word list (diagnoses, "cure", medication), length caps; on failure fall back to templated Mongolian strings (always ship templates; the LLM is an upgrade, not a dependency).
- Cost math at official prices (my calculation): system prompt ~2,500 tokens (cached) + profile/program ~1,500 tokens input, ~1,200 tokens Mongolian output (assume Cyrillic ≈ 1.5–2× English tokens → budget 2,000). Haiku 4.5: input 1,500×$1/M + cache read 2,500×$0.1/M = $0.0018; output 2,000×$5/M = $0.010 → ≈ $0.012 per program. Sonnet 5.5: ≈ $0.023. Opus 5.5: ≈ $0.046. Batch (overnight weekly regeneration) halves this. A daily 300-token check-in message on Haiku ≈ $0.002. Per active user per month (1 program/week + daily message): Haiku ≈ $0.05 + $0.06 ≈ $0.11; Sonnet 5.5 ≈ $0.25. For 1,000 MAU that is ~$110–250/month, i.e. negligible vs. a ~$5–10/month subscription.
- Latency: structured-output grammar compile on first call per schema (then cached 24 h); 2,000 output tokens is seconds, not sub-second — hide behind the "Таны хөтөлбөрийг бэлдэж байна…" screen (KQ7) or pre-generate weekly in Batch.
- Mongolian handling: (a) prefer Sonnet-class or better for Cyrillic Mongolian prose, test Haiku on a 50-item Mongolian coaching-copy eval before committing; (b) give the model a glossary of fixed Mongolian exercise names and tone examples (few-shot) and run the `mn-humanizer` style rules as a post-check; (c) keep all safety-critical strings (contraindication warnings) as human-written templates, never generated; (d) the ~30% tokenizer inflation on 4.7+ models plus Cyrillic inflation argues for short outputs and heavy prompt caching; (e) build an eval set: 100 profiles × rubric (facts match program, no new exercises, no medical claims, natural Mongolian) scored by a second model + spot checks by a Mongolian coach.
- Safety screen before any generation: PAR-Q+-style yes/no flags; any "yes" (chest pain, dizziness, uncontrolled BP, pregnancy complications, recent surgery) → conservative template program + "see a doctor" copy, no LLM involvement.

### Gaps
- No published measurement of Cyrillic-Mongolian token inflation on Claude's tokenizer (search could not run); the 1.5–2× figure above is an assumption to validate with the token-counting endpoint.
- No per-model output tokens/sec latency numbers retrieved for Haiku 4.5 / Sonnet 5.5.
- Freeletics has not published how Coach+ Pilot is constrained.

---

## KQ5. Adaptation loop: post-session data, weight-trend smoothing, volume/intensity/calorie rules, disengagement detection

### Takeaway
Commercial autoregulation (Juggernaut, Zing, Fitbod) runs on four cheap inputs — pre-session readiness, per-session RPE/completion, pain, and weekly check-in — with rules at session/week/block granularity; weight is handled as a smoothed trend (EMA, Hacker's Diet lineage; MacroFactor's expenditure model); churn in fitness apps is predictable from frequency and early-activity variables with ~1–3 weeks error, so a simple "days since last session + declining completion" trigger is defensible.

### Cited Findings
- Juggernaut loop: readiness (sleep, mood, energy, soreness) before session; RPE on top set and back-offs adjusts remaining sets; weekly check-in adjusts volume/intensity/frequency; block-end adjustments — [JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you). RPE 8 = "you could still complete 2 more reps" — [JTS RPE/RIR](https://help.jtsstrength.com/en/articles/2-all-about-rpe-and-rir).
- Fitbod recomputes per-muscle recovery 0–100% from sets × reps × load after every log and re-estimates 1RM every session — [Fitbod help](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout).
- Zing: daily check-in on energy, mood, sleep → real-time plan adjustment — [App Store](https://apps.apple.com/app/id1552207792).
- Weight smoothing: exponentially smoothed moving average for daily weight is the Hacker's Diet method ("proven useful in applications ranging from air defence radar to trading the Chicago pork belly market") — [Hacker's Diet](https://fourmilab.ch/hackdiet/www/subsubsection1_2_4_0_4_3.html); Built With Science app explains it uses EMA for weight tracking — [BWS help](https://help.builtwithscience.com/migration/en/why-does-the-app-use-exponentially-moving-average-ema-for-tracking); MacroFactor's "expenditure algorithm Version 3 is more responsive, stable, accurate, and resilient to missing data"; "nutrition and weight data are noisy — they contain trends that can be used to estimate energy expenditure, but also contain messiness that conceals those trends" — [MacroFactor](https://macrofactor.com/expenditure-v3/).
- Churn: survival analysis on 3,034 Mammoth Hunters users; "men, older users, and those with higher training frequency showing longer engagement, while sedentary users and women disengaged earlier"; LogNormal models gave MAE of 1.02, 1.94 and 3.32 weeks across horizons; "many users discontinue app use within weeks" — [mHealth (AME) article](https://mhealth.amegroups.org/article/view/144969/html); [Recercat record](https://recercat.cat/handle/20.500.14342/5629).
- Habit dose: "roughly four sessions per week for at least six weeks is the minimum dosage needed to establish a self-sustaining gym habit"; "Positive affect experienced during workouts significantly boosts habit strength" — [arXiv 2501.01779](https://arxiv.org/pdf/2501.01779).

### Inferences
- Post-session form (≤ 10 s): completion % (auto), session RPE 1–10 (one tap, Mongolian anchors), pain (none / which joint), enjoyment 1–5, optional "too easy / just right / too hard". Weekly: weight (optional daily), sleep quality, energy, menstrual phase (opt-in), free text.
- Session/week rules (example):
  - completion ≥ 90% ∧ RPE ≤ 5 for 2 consecutive sessions → +1 difficulty step (progression_of) or +1 set / +5 s hold
  - RPE ≥ 9 ∨ completion < 60% → −1 step next session; two in a row → deload week (volume −30%)
  - pain reported on joint J → exclude exercises with contraindication tag for J for 14 days, substitute regression, show "why" card; pain 3 sessions in a row → stop and advise clinician
  - readiness (sleep+energy) low → swap main block to mobility/breath variant, keep streak alive (never punish showing up)
  - enjoyment ≤ 2 on an exercise twice → down-weight it (w_pref) and prefer siblings in same pattern
- Weight trend: EMA with α = 0.1 (≈ 10-day memory) on daily weigh-ins; weekly rate = slope of EMA over 14 days; targets: fat loss 0.5–1.0%/week, gain 0.25–0.5%/week; adjust calories ±100–150 kcal when the 2-week trend is outside the band for 2 consecutive weeks and logging adherence ≥ 5 days/week; freeze adjustments if < 3 weigh-ins/week. Store weigh-ins raw and compute EMA client-side so missing days don't corrupt it (MacroFactor's "resilient to missing data" goal).
- Disengagement trigger (no ML needed at launch): risk = days_since_session > 1.5 × personal median gap, OR completion falling 3 sessions, OR skipped 2 scheduled sessions; intervene with a shortened "5-минутын" session offer + reason-ask (too busy / too hard / bored / pain) that feeds back into rules. Survival-model literature suggests you can later fit a LogNormal on (training frequency, level, age, sex) to rank users for outreach.

### Gaps
- Could not fetch Foster session-RPE validation literature (budget); sRPE is standard but uncited here.
- MacroFactor's actual smoothing parameters are not public.
- No published Mongolian-population baseline for weigh-in adherence.

---

## KQ6. Explainability ("why this exercise / this meal")

### Takeaway
Multiple user studies find explanations raise trust and intention to follow health recommendations, with users preferring short, feature-importance-style ("because you said X") explanations over comparative or negatively-framed ones; explanations of decision logic matter more than explanations of optimisation targets.

### Cited Findings
- Food recommender field study: despite mismatch with preferences, explaining reasons "led to an increase in trust in the recommendations" — [imec publication](https://imec-publications.be/handle/20.500.12860/59547).
- Health recommendations for lay users: benefits include "increased trust and a higher tendency to follow up on these recommendations"; six explanation modalities tested; "a strong preference towards feature importance explanations" and "issues with modalities that highlight negative emotions" — [TU Delft repository](https://repository.tudelft.nl/file/File_4b8535f7-17f9-4910-8aa0-1155def4c4e2).
- Explanation content types WHAT (data), HOW (rationale), WHY (optimised metric): "explanations about algorithmic decision logic being notably more influential than those about optimized metrics" on trust — [JMIR preprint 51271](https://preprints.jmir.org/preprint/51271).
- Users "favor straightforward, concise explanations over comparative ones" — [EasyChair preprint](https://easychair-www.easychair.org/publications/preprint/6j21); personal vs impersonal explanations study — [Interactive Systems, 2019](https://interactivesystems.info/publications/let-me-explain-impact-of-personal-and-impersonal-explanations-on-trust-in-recommender-systems-2019).
- Strava reports >80% of feedback-giving users rated its explanatory insight text helpful — [AWS/Strava](https://aws.amazon.com/solutions/case-studies/strava-case-study/).

### Inferences
- Because the builder is rule-based, every selection already has machine-readable reasons (`rationale_codes`). Render them as one-line Mongolian chips on each exercise/meal card ("Нуруу өвддөг гэснээс – хөнгөрүүлсэн хувилбар", "Хэрэгсэлгүй – зөвхөн дэвсгэр"). This is free, deterministic, auditable, and it is precisely the feature-importance style users prefer. Use the LLM only to merge chips into one friendly sentence where there is space.
- Avoid negative framing ("you are too weak for X"); phrase as fit ("энэ долоо хоногт X-ийн оронд Y").

### Gaps
- No study found that isolates explanation effects on *workout adherence* specifically (studies are on trust/intention in food and general health recsys).

---

## KQ7. Onboarding-quiz UX and conversion benchmarks (2024–2026), dark patterns and regulation

### Takeaway
Health & fitness apps run the longest onboarding in the store (median ~20 screens) and it works: the plan-reveal before the paywall is the key conversion moment, Day-0 paywalls drive ~89% of trial starts, median trial→paid is ~40% (RevenueCat) to ~62% (Adapty, different sample), but first-renewal retention is the worst of any category (~30%). FTC "click-to-cancel" was vacated in 2025 (revival proposed Jan 2026), but ROSCA/state laws and Apple 3.1.2 still require clear price/duration/cancel disclosure.

### Cited Findings
- "Health & Fitness apps have a median onboarding of 20.5 screens (compared to 11 overall)"; "Across 24 Health & Fitness quiz apps specifically, the onboarding quiz averages 6.2 question screens with a median of 4.5 and a max of 21" — [LazyWeb research](https://www.lazyweb.com/research/health-fitness-onboarding-length.md) (teardown-based, methodology not fully verifiable; page blocked for full read).
- "The most critical moment in Noom's funnel is the 'your personalized plan' reveal page that appears before the paywall"; "a paywall after 15 minutes of self-disclosure feels like the logical next step" — [LazyWeb](https://www.lazyweb.com/research/longest-app-onboarding-flows); Adapty 2025: health & fitness "paywall-to-purchase conversion rates between 3% and 7%" — [RocketShip HQ](https://www.rocketshiphq.com/?p=5491).
- RevenueCat State of Subscription Apps 2026: health & fitness median trial-to-paid 39.9%, top 10% at 68.3%; trials of 17–32 days convert at 45.7% median vs 26.8% for ≤4-day trials; 3- and 7-day trials have the highest Day-0/Day-1 cancellation; health & fitness median revenue per install after 60 days $0.63 (highest category); only 5% of health & fitness apps reach $10k total revenue in two years; iOS converts ~2× Android — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [SaaStr summary](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/); [AthleTech News](https://athletechnews.com/?p=124212).
- Adapty State of In-App Subscriptions 2026: "89.4% of trial starts happen on Day 0"; onboarding paywalls without trials convert at 37.45% "but produce the lowest long-term value"; paywalls after a "value moment" see "trial start rates 2.1x higher" than immediate hard paywalls; health & fitness trial-to-paid 62% vs 53% all-category; annual plans 60.6% of H&F revenue; H&F median 1-year install LTV $1.21 (highest); H&F "last by category at 30.3% first-renewal retention"; weekly plans now 55.5% of all app revenue (43.3% in 2023); hard paywalls +21% LTV/subscriber vs soft — [Adapty report](https://adapty.io/state-of-in-app-subscriptions/); [Adapty H&F benchmarks](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/); [PPC Land summary](https://ppc.land/95-of-app-subscription-revenue-goes-to-top-10-adaptys-2026-benchmark-report/). Note the RevenueCat (39.9%) and Adapty (62%) trial-to-paid figures conflict; different customer bases and definitions.
- Duolingo commitment device: "added a streak-goal choice immediately after users started a new streak — and though the team did not store or use the chosen value, the act of choosing created commitment and improved user retention weeks after" — [LazyWeb experiments summary](https://experiments.lazyweb.com/research/duolingo-streak-goals-retention); CTA change from "continue" to "commit to my goal" was a significant win; 600+ streak experiments in 4 years — [Lenny's Podcast summary](https://www.recall.it/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team).
- Regulation: FTC click-to-cancel rule "finalized in October 2024 and vacated by the Eighth Circuit in July 2025, though the underlying standard still applies through ROSCA and state auto-renewal laws. The FTC signaled its intent to revive the regulation with a new rulemaking proposal in January 2026" — [jwatte audit post](https://jwatte.com/blog/blog-tool-subscription-autorenewal-audit/); [eMarketer](https://www.emarketer.com/content/ftc-affirms-click-to-cancel-rule-target-deceptive-account-cancellation-practices); [TechCrunch](https://techcrunch.com/?p=2899671). Apple: apps with auto-renewing subscriptions "must clearly tell you what you're getting, what it costs, how long it lasts, and how to cancel before you sign up" — [Conduct Atlas summary of Guideline 3.1.2](https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/subscription-and-auto-renewal-requirements/).

### Inferences
- Quiz design for this app: 8–12 question screens (one question per screen, big tap targets, 16 px inputs per the repo's iOS rule), ordered goal → body (height/weight/age/sex) → schedule (days/week, minutes) → equipment/space → injuries & PAR-Q flags → preferences (floor vs standing, yoga vs pilates vs strength mix, music) → nutrition basics (meals/day, allergies, likes). Insert 2–3 "insight interstitials" (not questions) that reflect answers back ("Таны сонгосон 20 минут × 4 өдөр = ...") — these are what the quiz-app teardowns call personalisation theatre and they are cheap with a rule engine.
- "Хөтөлбөрийг бэлдэж байна…" screen: run the deterministic builder instantly, then the LLM copy call (2–6 s); animate a 4-step checklist that reflects real steps (constraints → exercises → nutrition → schedule). Then show the real week-1 preview (titles, durations, first 3 exercises with images) *before* the paywall; the data above says this reveal is the key moment.
- Pricing: given 30% first-renewal retention in H&F, favour annual + 14-day-or-longer trial over 3/7-day trials; Mongolia-specific pricing/payment rails (QPay etc.) are out of scope here.
- Don't: pre-selected upsells, countdown timers, fake "limited spots", hiding the monthly option, blocking cancellation (ROSCA/Apple 3.1.2 exposure). Since this is a PWA (no App Store), Apple's guidelines bite only if a native wrapper is shipped later; still, design for them now.

### Gaps
- LazyWeb numbers come from a teardown site whose methodology and sample could not be inspected (page blocked).
- No Mongolia-specific conversion or pricing benchmarks exist in any source found.
- Apple's exact 2026 guideline text on quiz-before-paywall (3.1.2/5.1.1) not retrieved; only a summary.

---

## KQ8. Retention / behaviour-change mechanics with evidence

### Takeaway
Evidence supports: streaks with forgiveness (Duolingo: streak wager +14% D7; ~9M users with ≥1-year streaks), commitment devices (choosing a goal, even unused), implementation intentions/if-then plans, event-based cues over reminders (reminders sustain repetition but hinder automaticity), positive affect during sessions, and a minimum habit dose (~4×/week × 6 weeks). The most-used BCTs in mHealth (feedback/monitoring, goals/planning, associations) are not necessarily the most effective.

### Cited Findings
- Duolingo: "9 million people maintaining a streak of at least one year"; "Streak Wager ... Day-7 retention showing the greatest improvement at +14%"; 600+ streak experiments in 4 years; CTA "commit to my goal" win; unused streak-goal choice still improved retention weeks later — [Duolingo blog](https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals); [Lenny's Podcast summary](https://www.recall.it/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team); [LazyWeb experiments](https://experiments.lazyweb.com/research/duolingo-streak-goals-retention); "retention compounds and acquisition does not" — [The Audiencers](https://theaudiencers.com/subscription-models-live-off-habits-lessons-from-duolingos-retention-success/).
- Lally et al. 2010: "an average of 66 consecutive days for actions to feel automatic ... for some it took just 18 days while for others as long as 254 days. Automaticity was achieved more quickly for simple actions like drinking water after breakfast than for more effortful actions such as 50 sit-ups" — [The Behavioral Scientist](https://www.thebehavioralscientist.com/articles/how-long-to-form-a-habit).
- Gym habit study (large dataset, 2025): "roughly four sessions per week for at least six weeks is the minimum dosage"; "Positive affect experienced during workouts significantly boosts habit strength, whereas monotonous or aversive sessions fail to produce lasting automaticity" — [arXiv 2501.01779](https://arxiv.org/pdf/2501.01779).
- Reminders vs cues: "Relying on reminders supported repetition but hindered habit development, while the use of event-based cues led to increased automaticity" — [Stawarz et al., CHI 2015](https://mijn.bsl.nl/doi/10.1145/2702123.2702230). Implementation intentions: "'If-then' plans specifying when, where, and how a behavior will occur dramatically increase follow-through" — [Frontiers in Psychology 2022](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.883795/pdf).
- JMIR systematic review (24 studies, 2010–2021): most-used BCTs were "feedback and monitoring (n=20), goals and planning (n=14), associations (n=14), shaping knowledge (n=12), and personalization" but "these frequently used techniques are not necessarily the most effective" — [Aguiar et al., JMIR mHealth 2022](https://mhealth.jmir.org/2022/9/e33247/PDF); [PMC9508675](https://pmc.ncbi.nlm.nih.gov/articles/PMC9508675). Engagement–BCT association protocol — [Milne-Ives et al.](https://preprints.jmir.org/preprint/35172/submitted).
- Habit-formation SLR on fitness apps — [HRMARS review](https://hrmars.com/ijarbss/article/view/27327/Mobile-Fitness-Apps-in-Promoting-Habit-Formation-A-Systematic-Literature-Review).

### Inferences
- Transferable Duolingo mechanics: weekly-streak (not daily — fitness sessions are 3–5×/week, so count "weeks with ≥ planned sessions" and allow a free "амралт" day), streak freeze earned by completing a week, a commitment question at onboarding ("Долоо хоногт хэдэн удаа?") whose answer is also used by the builder (double value), and "commit" CTA copy. Avoid Duolingo-style daily guilt notifications; instead schedule reminders at the user's self-chosen *cue* ("after morning tea", "after kids sleep") per the event-cue evidence.
- Keep sessions enjoyable: the enjoyment rating in KQ5 is not vanity — positive affect predicts habit strength, so let it drive exercise weighting and music/voice choices.
- Micro-commitments: offer a 5–7-minute fallback session whenever readiness is low or a session is about to be missed; it preserves the weekly streak and counts toward the 4×/week × 6-week dose.
- Progress proofs with low friction: weekly EMA weight trend, monthly photo prompt, "first full hold of X" milestones derived from logs; social features are low priority for a small team and the evidence found doesn't single them out.

### Gaps
- Duolingo's own blog could not be fetched; numbers come from summaries of it.
- No controlled study found on streaks specifically in fitness apps (vs. language learning).

---

## KQ9. Measurement capture tech: camera body measurement, pose estimation, wearables (incl. Xiaomi/Huawei/Garmin)

### Takeaway
Two-photo body measurement (Bodygram) and MediaPipe-based rep/form detection (82–96% accuracy in small studies) are feasible on phones, but accuracy depends on lighting, camera angle and full-body visibility; wearable data is reachable on Android via Health Connect (Garmin joined 2025, Mi Fitness supports it, Huawei phones without Google Play cannot install it), while a PWA has no direct HealthKit/Health Connect access.

### Cited Findings
- Bodygram: "extracts body measurements from a set of 2D photos and uses deep-learning techniques ... employing parameters such as weight, sex, age, height" (front + side photo); vendor claims "sub-one-inch accuracy" and "99 percent accuracy compared to professional human tailors"; deployed in a Japanese medical weight-loss clinic (2022) — [TechCrunch](https://techcrunch.com/2018/07/02/original-stitchs-new-bodygram-will-measure-your-body); [Bodygram case study](https://www.bodygram.com/en/case-study/dioclinic). Independent academic evaluation of 3D body-scanning mobile apps (usability and accuracy), 2020 — [CDATP journal](https://journals.qucosa.de/cdatp/article/view/26).
- MediaPipe form feedback: PoseTracker Android app: "88.33% for jumping jacks, 85% for squats, 83.33% for push-ups, and 82% for sit-ups" across 240 reps, participants 17–50 — [IJCSHAI 2025](https://journal.binus.ac.id/index.php/ijcshai/article/view/15123); Python/OpenCV system: "96.2% accuracy for assessing squats, lunges, and push-ups ... 32 fps on a typical laptop ... 92% accuracy in dim lighting and 94% accuracy at a 30-degree camera offset"; "33 3D body landmarks, normalize them ... cosine similarity ... against a reference dataset" — [engrXiv preprint](https://engrxiv.org/preprint/download/3953/6952/5640); another: 90% squat, 86% lunge "under typical home-workout conditions" — [MMU repository](https://shdl.mmu.edu.my/16287/). "Environmental factors such as inconsistent lighting, camera positioning and incomplete body visibility can influence system performance" — [MMU](https://shdl.mmu.edu.my/13530/).
- Health Connect: APIs where "multiple apps and services can read (or write) your health metrics" — [Optimus Health guide](https://sites.google.com/view/optimus-health/health-connect-integration). Garmin: announced at Google I/O 2025 to join Health Connect in June 2025 — [Notebookcheck](https://www.notebookcheck.net/Garmin-and-Health-Connect-integration-on-the-way-to-smartwatch-users.1022327.0.html). Xiaomi: "Mi Fitness can share with Health Connect on recent versions by opening Profile, then Settings, and looking for Health Connect" — [Ismaili setup guide](https://help.the.ismaili/setup/other-android). Huawei: "Health Connect is only distributed through the Google Play Store, so a phone without it cannot install Health Connect, which affects most Huawei phones sold after 2019"; the third-party app Health Sync bridges Huawei Health to Google Fit/Strava etc. — [Roger Frost](https://www.rogerfrost.com/get-huawei-watch-to-send-health-data-to-google-fit-google-drive/).

### Inferences
- For v1 of a PWA: skip camera anthropometry; ask tape measurements (waist, hips, chest, thigh) with an illustrated guide and store them as `assessments.measurements jsonb`; the gain from photo-based mm accuracy is small relative to weight-trend + waist for home users.
- Form checks: MediaPipe Pose runs in the browser (WASM/WebGL) so a PWA *can* do rep counting for 4–6 big movements (squat, lunge, push-up, plank hold timer) with the joint-angle rule approach; treat it as a fun feature, not a safety system (accuracy 82–96% in favourable conditions).
- Wearables: a PWA cannot read HealthKit or Health Connect directly; options are (a) manual entry of steps/sleep, (b) a later thin native wrapper (Capacitor) exposing HealthKit/Health Connect, (c) cloud APIs (Garmin Health API requires partner approval; Huawei Health Kit cloud API exists for Huawei accounts). Given Xiaomi/Huawei prevalence in Mongolia, (a) now and (b) later is the pragmatic order.

### Gaps
- No independent accuracy study of Bodygram specifically (only vendor claims and a general 2020 study of 3D scanning apps).
- Garmin Health Connect rollout details and Huawei Health Kit cloud-API terms not verified (fetch blocked / budget).
- No source on Mongolian wearable market share found.

---

## KQ10. Nutrition personalisation engine

### Takeaway
Calorie counting produces faster short-term loss but hand/portion methods have higher adherence; the strongest-looking evidence (a 24-week RCT: tracking 5.8 kg vs portion 3.9 kg vs combined 5.4 kg, with combined having best 12-month regain) comes only from an app blog and could not be verified, so treat it as unconfirmed. Local food data for Mongolia was not found in this pass.

### Cited Findings
- Claimed 2024 RCT (International Journal of Obesity): 24 weeks, three arms — app calorie tracking 5.8 kg, hand-portion 3.9 kg, combined 5.4 kg; portion control 71% adherence at 24 weeks vs 62% for tracking; satisfaction 7.1 vs 6.4/10; combined approach lowest 12-month regain (0.9 kg) — reported by [Nutrola blog](https://nutrola.app/en/blog/should-i-track-calories-or-just-use-portion-control); a targeted search for the primary paper found no matching IJO article, so this is UNVERIFIED.
- Claimed 2023 study (J Nutr Educ Behav): hand method reduced intake by ~290 kcal/day — reported by [Nutrola blog](https://nutrola.app/en/blog/i-dont-want-to-count-calories-but-need-to-lose-weight); primary not located.
- Patel et al. 2019 (JMIR mHealth, n=105, 12 weeks, MyFitnessPal): median diet self-monitoring days/week 1.9 (Sequential), 5.3 (Simultaneous), 2.9 (App-Only); weight tracked 4.8–5.1 days/week — [PubMed 30816851](https://pubmed.ncbi.nlm.nih.gov/30816851/). Registered trial of hand-based calorie estimation in an app — [ClinicalTrials NCT04945291](https://clinicaltrials.gov/study/NCT04945291); micro-randomised trial on burden-reducing self-monitoring — [NCT07228130](https://clinicaltrials.gov/study/NCT07228130).
- Self-monitoring burden: 142 participants tracked for 24 weeks; most successful lost ~10% body weight spending 23.2 min/day in month 1, falling to 14.6 min/day by month 6 — [Earth.com summary of the study](https://earth.com/news/tracking-food-calorie-intake); [UPI](https://www.upi.com/Study-Self-monitoring-diets-not-time-consuming-work-best/7741551109751/).
- Precision Nutrition hand-portion system (palm protein, fist vegetables, cupped-hand carbs, thumb fats) is the commonly cited practitioner method — [Precision Nutrition](https://www.precisionnutrition.com/hand-portion-transformations); [IDEA Fitness](https://www.ideafit.com/nutrition-by-the-handful-an-alternative-to-counting-calories/).
- wger ships an open ingredient database under CC licences with a REST API — [wger](https://github.com/wger-project/wger).

### Inferences
- Engine: TDEE from Mifflin-St Jeor (sex, age, kg, cm) × activity factor, then calibrate weekly against the EMA weight trend (KQ5) instead of trusting the formula. Protein 1.6–2.2 g/kg for fat loss/recomp, fats ≥ 0.7 g/kg, carbs fill. Default UX = hand portions per meal (palm/fist/cupped hand/thumb counts per meal computed from kcal/macros), with optional calorie logging for users who want precision; the (unverified) combined-approach result and the clear adherence advantage both point this way.
- Data model:
  ```
  foods(id, name_mn, name_en, kcal, protein_g, fat_g, carb_g, fiber_g, per_100g bool, hand_unit enum(palm|fist|cupped|thumb|none), hand_unit_g, tags text[] -- 'dairy','meat','wheat','local','seasonal_winter'
        allergens text[], source, license)
  recipes(id, name_mn, servings, steps_mn text[], total_min, tags, cost_band)
  recipe_items(recipe_id, food_id, grams)
  meal_plans(user_id, week_start, day, slot enum(breakfast|lunch|dinner|snack), recipe_id, portion_mult, rationale_codes text[])
  swaps: rule "same slot, |Δkcal| ≤ 15%, same protein class, respects allergens/dislikes, prefers tags user liked"
  grocery_list = Σ recipe_items × portion_mult grouped by food, minus pantry staples
  ```
- Allergy/preference rules are hard filters (allergens, religious/ethical exclusions); dislikes are soft weights. Keep every swap explainable with rationale codes like KQ6.

### Gaps
- Mifflin-St Jeor validation and plate-method evidence searches could not run (budget). Formula choice is standard practice but uncited here.
- The headline portion-vs-tracking RCT and the 290 kcal/day finding could not be traced to primary publications; report as unverified.
- No Mongolian food-composition table or local recipe dataset located (search did not run); likely need to compile from the national FCT/FAO INFOODS and hand-enter local dishes (бууз, хуушуур, цуйван, сүүтэй цай...).

---

## KQ11. Tech stack for a small team on a static PWA + Supabase

### Takeaway
The deterministic builder can run entirely in the browser (no build step, instant, offline), with Supabase holding library/program/log tables and one Edge Function proxying the Claude call for Mongolian coach text; offline needs IndexedDB + a write queue (RxDB has a Supabase replication plugin); demo media is the main cash cost (open images are free; pre-made 3D animation packs run $95–195 per 100–130 moves; illustration libraries $1,200/yr for ~679 exercises).

### Cited Findings
- Offline-first with Supabase: requires "a client-side storage layer (IndexedDB), a background synchronization mechanism (Service Workers), and a conflict resolution strategy" — [minhvo blog](https://minhvo.is-a.dev/blogs/building-offline-first-applications); RxDB Supabase replication plugin: "two-way synchronization between RxDB collections and a Supabase (Postgres) table, using PostgREST for pull/push and Supabase Realtime (logical replication) to stream live updates", with custom conflict resolution — [RxDB docs](https://rxdb.info/replication-supabase.md); [npm rxdb-supabase](https://www.npmjs.com/package/rxdb-supabase).
- Media costs: pre-made "100 Workout and Exercise Animation Library for Apps & Coaches" and "130 3D bodyweight home fitness library" sold on Upwork (reported at ~$95 and ~$195) — [Upwork listing 1](https://www.upwork.com/services/product/video-audio-100-workout-and-exercise-animation-library-for-apps-coaches-2011072366940827674); [Upwork listing 2](https://www.upwork.com/services/product/video-audio-130-3d-bodyweight-home-fitness-library-for-apps-and-courses-2011048238385457234); WorkoutLabs illustration licensing: from $15/illustration annual or $25 perpetual, full library (679 exercises) from $1,200/year or $3,500+ perpetual, API from $195 setup + $50/month — [WorkoutLabs licensing](https://workoutlabs.com/exercise-illustrations-licensing/); custom 3D animation quotes $40–100 per movement for 50+ libraries — [Upwork job post](https://www.upwork.com/freelance-jobs/apply/Character-Animator-Anatomical-Fitness-Exercise-Animation-Test-Piece-Library_~022065632620930354881/); Lottie fitness animations exist with commercial licences — [LottieFiles](https://lottiefiles.com/fr/free-animation/cable-close-grip-single-arm-pulldown-exercise-for-back-Xok849RigE).
- Free media: free-exercise-db JPG pairs (start/end) under Unlicense — [GitHub](https://github.com/yuhonas/free-exercise-db); ExerciseDB video/GIF only on paid plans — [GitHub](https://github.com/exercisedb/exercisedb-api). Open-source coaching platform workout.cool (shown on HN) is another reference implementation — [HN thread](https://hn.svelte.dev/item/44309320).
- Claude cost levers: prompt caching (0.1× on reads), Batch API (−50%), Haiku for simple tasks — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

### Inferences
- Schema sketch (Postgres, RLS by `user_id`):
  ```
  profiles(user_id pk, sex, birth_year, height_cm, goal enum, level enum, days_per_week, minutes_per_session, equipment text[], space enum, prefs jsonb, locale 'mn')
  assessments(id, user_id, taken_at, weight_kg, measurements jsonb, parq jsonb, injuries text[], pregnancy jsonb, movement_screen jsonb)
  exercises(...)                      -- KQ2
  exercise_media(exercise_id, kind, url, license)
  rules(id, scope, condition jsonb, action jsonb, priority, explanation_mn)
  programs(id, user_id, week_start, generated_by enum(rules_v1|rules_v1+llm), builder_version, inputs_hash, program jsonb, coach_text jsonb, status)
  sessions(id, program_id, day_index, planned jsonb, started_at, finished_at, completion_pct, srpe, pain jsonb, enjoyment, notes)
  set_logs(session_id, exercise_id, set_no, reps, hold_s, load_kg, rpe)
  weigh_ins(user_id, date, kg)         -- EMA computed client-side
  foods / recipes / recipe_items / meal_plans / food_logs  -- KQ10
  events(user_id, ts, type, payload)   -- for churn/engagement rules
  ```
  Keep `program jsonb` self-contained (exercise snapshots incl. names/cues) so a session renders offline and survives library edits; `inputs_hash` lets you skip regeneration when nothing changed.
- Runtime split: builder = pure JS module in `index.html` (deterministic, unit-testable with fixtures); Supabase Edge Function `coach-text` = the only server code (holds the Anthropic key, enforces per-user quota, validates schema and banned words, falls back to templates). Pre-generate next week's program Sunday night via a scheduled function using the Batch API.
- Offline: cache `exercises` + media of the current program in IndexedDB/Cache Storage at program generation; queue `sessions`/`set_logs` writes; last-write-wins is acceptable for single-user personal data (conflicts are rare). RxDB is optional; a hand-rolled queue of ~100 lines fits the no-build constraint better.
- Media strategy by cost: Phase 1 free-exercise-db images + in-house photos for yoga/pilates poses (two photos per pose, consistent background); Phase 2 short looping MP4/WebM (3–5 s, ≤ 300 KB) recorded in-house or a $100–200 pre-made 3D pack for the strength subset; audio cues in Mongolian recorded by a human for the ~150 most common cues (LLM text is for explanations, not for timing-critical cueing).
- Localisation: all exercise/food names and cues as `*_mn` columns (not runtime translation); LLM text generated directly in Mongolian with a glossary, then style-checked (`mn-humanizer` rules).

### Gaps
- Marketplace prices above are listings seen in search extracts, not negotiated quotes; WorkoutLabs page could not be fetched to confirm current tiers.
- No source on Supabase Edge Function cold-start latency for this use case retrieved.
- Mongolian TTS quality for generated cues not researched (budget).

---

## Cross-cutting recommendation summary (synthesis, not sourced)

1. Build the program builder as data + rules, not ML: tagged library (KQ2 schema), template slots, hard filters, weighted greedy fill, pose-transition graph for yoga, per-muscle recovery score for strength. Runs in the browser, offline, explainable by construction.
2. Autoregulate with four inputs (readiness, sRPE, completion, pain) and ~10 rules at session/week/block level (KQ5); EMA weight trend drives calorie adjustments.
3. Use Claude only for Mongolian coach copy and Q&A, constrained with GA structured outputs where exercise ids are enums from the generated program; always have template fallbacks; est. $0.05–0.25 per active user per month.
4. Onboarding: 8–12 one-question screens with insight interstitials, a real plan preview before the paywall, ≥14-day trial, annual-first pricing, no dark patterns.
5. Retention: weekly streaks with forgiveness, commitment question, user-chosen event cues instead of generic reminders, 5-minute fallback sessions, enjoyment feedback that shapes selection.
6. Measurements: tape + weight now; MediaPipe rep counting as a delight feature; wearables via manual entry until a native wrapper exists.
7. Nutrition: hand-portion default with optional logging; Mongolian food table must be compiled in-house.
