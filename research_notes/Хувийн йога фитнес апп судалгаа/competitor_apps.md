# Competitive analysis: onboarding assessment and program generation in personalized fitness / yoga / pilates apps (2024–2026)

**Method note for the report writer.** Research was done on 2026-10-06. All findings below come from web-search result snippets attributed to the linked pages. Every attempt to open the pages themselves (Fitbod help center and blog, JuggernautAI help docs, downdogapp.com, Freeletics forum/help/blog, RevenueCat, Lazyweb benchmark, App Store listings, Trustpilot, Tom's Guide, TechRadar, Oura blog, OpenAI/WHOOP page, etc.) was refused by the sandbox's egress proxy, and the shared web-search budget ran out before the last round of queries (Fitbod/Juggernaut/Down Dog pricing, Ladder, Caliber, Peloton IQ, Freeletics Nutrition, retention benchmarks). So: (a) claims are near-verbatim from search summaries, not from a full read of the source, and should be spot-checked before publication; (b) "Gaps" sections are long and honest. Prices are in USD unless noted.

---

## Key question 1: App-by-app profile (onboarding questions, measurements, generation method, nutrition, pricing, platform, complaints)

### Takeaway
Across ~20 apps there are four distinct generation models: (1) **rule/score-based engines that assemble a fresh session every time** (Down Dog, Fitbod, Freeletics Coach), (2) **periodized strength engines driven by readiness + RPE** (JuggernautAI, Evolve AI), (3) **human coach writes the plan** (Future, Caliber premium, Ladder teams), and (4) **content libraries with a filter/quiz on top** (Centr, Sweat, Alo Moves, Glo, Peloton, Apple Fitness+, NTC). LLMs so far appear mainly as chat layers on wearable data (WHOOP Coach, Oura Advisor, Strava Athlete Intelligence) or as onboarding/Q&A assistants (Freeletics Coach+), not as the core program generator of any major incumbent.

### Cited Findings

**Down Dog (yoga; sister apps HIIT, Barre, Pilates, Meditation, Prenatal Yoga) — algorithmic sequencing**
- "Down Dog generates each practice on the spot — a new sequence, new music, and new cues every session. You pick your time, level, focus, voice, and music — and Down Dog builds a brand-new class that never repeats." — [downdogapp.com](https://www.downdogapp.com/)
- Older marketing claimed "over 60,000 configurations so that you'll never hear the instructor say the same thing in the same order"; the current App Store listing claims "over a million possible configurations, so no two sessions are the same." — [downdogapp.com](https://www.downdogapp.com/); [App Store listing via AppFollow](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca)
- User-controllable parameters: "Like" poses to raise their probability, "Dislike" poses so "they will never appear"; "Transition Speed (amount of time to move between one pose and another) and Hold Length (amount of time you spend in the pose)"; "primary and a secondary boost from among 19 different body areas" (examples given: backbends, hip openers, core, shoulders). — [downdogapp.com](https://www.downdogapp.com/); [AppFollow listing](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca)
- Leveling: "start with Beginner 1 and build up at their own pace, unlocking new poses and more variety as they level up." — [AppFollow listing](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca)
- Separate sub-apps exist for HIIT and Barre (hiit.downdogapp.com, barre.downdogapp.com). — [hiit.downdogapp.com](https://hiit.downdogapp.com); [barre.downdogapp.com](https://barre.downdogapp.com/)
- Prenatal Yoga app: "a brand new yoga practice every time adapted to your trimester and your body, from your first weeks of pregnancy through labor prep and into postpartum recovery", with "pregnancy and postpartum-specific boosts", and "dislike poses to skip them". — [Prenatal Yoga | Down Dog (App Store, via AppFollow)](https://apps.appfollow.io/ios/prenatal-yoga-down-dog/1504152442?country=us)
- Local TV tech segment describes the app as providing "different routines during each use". — [Local3News What the Tech](https://www.local3news.com/local-news/what-the-tech/what-the-tech-down-dog-app-provides-different-routines-during-each-use/article_31cc9993-3a00-5f96-9479-f16a4573263f.html)

**Fitbod (strength) — rule/score-based engine on logged data**
- "The algorithm has two core engines: an Exercise Selector (what you do) and a Capability Recommender (how much weight, sets, and reps)." — [Fitbod blog: the Fitbod algorithm](https://fitbod.me/blog/fitbod-algorithm)
- "Muscle recovery drives exercise selection — Fitbod scores every exercise based on how recovered the required muscles are, so you never overtrain the same tissue two days in a row." Fitbod "tracks how 'fresh' each muscle group is". — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm); [Fitbod help: How Fitbod Creates Your Workout](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout)
- Inputs: "profile + workout history + recovery status + equipment"; goals "hypertrophy vs. strength vs. endurance ... change the balance of sets, reps, and exercise selection". — [Fitbod blog: how Fitbod personalizes](https://fitbod.me/blog/how-fitbod-personalizes-your-workout-plan-using-smart-training-algorithms/)
- Adaptation signals: "as you log workouts, mark workouts as too easy/hard, tweak weight/reps, skip or replace exercises, or update equipment." Progressive overload is built in automatically. — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm); [Fitbod blog: progressive overload](https://fitbod.me/blog/what-is-progressive-overload-and-how-fitbod-builds-it-into-every-workout-automatically/)
- Scale claim: "built on 400 million+ logged workouts". — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm)
- Fitbod has a help article on "Why did my workout change? Understanding workout refreshes". — [Fitbod help section](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works)
- Injuries: "Fitbod's injury feature helps you work around injuries or limitations by adjusting your workout plan, allowing you to note areas you want to avoid stressing and get alternative exercise recommendations"; "Fitbod doesn't diagnose injuries, you can substitute any exercise". — [Fitbod help article 37629269518103](https://help.fitbod.me/hc/en-us/articles/37629269518103); [Fitbod FAQs](https://fitbod.me/faqs/)
- Complaints: "Around 10% of users express dissatisfaction with Fitbod's AI's tendency to repeat the same workouts". — [Onclarity Fitbod insight](https://www.onclarity.com/leaderboard/insight/fitbod)
- "Fitbod genuinely needs 10-15 workouts of input data before the personalization reaches its full quality"; "long-term users (1+ years) almost universally rate Fitbod 4-5 stars". — [IndieHackers Fitbod review 2026](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)

**JuggernautAI (powerlifting/strength) — periodized engine with readiness + RPE**
- "Before each session, the app asks about your readiness (e.g., sleep, mood, energy, soreness), and based on your answers, it adjusts the day's training, modifying volume or weight as needed." — [JTS help: How JuggernautAI is individualized](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you)
- "As you enter your top set and back down set RPEs during a workout, the program continues to adjust in real-time, tweaking your next sets". — [JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); [JTS help: All about RPE and RIR](https://help.jtsstrength.com/en/articles/2-all-about-rpe-and-rir)
- Multi-interval adaptation: post-session data feeds "your readiness score—a running, weighted average"; "At the end of each week, Juggernaut AI further adapts your training based on your performance and check-in data"; "After completing a block, the program makes more significant adjustments to guide your next training phase." — [JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); [JTS article by Chad Wesley Smith](https://www.jtsstrength.com/?p=644517)

**Freeletics (bodyweight/HIIT + weights) — Coach algorithm + "Coach+" LLM assistant**
- Onboarding asks "gender, goal, fitness level, age, height and weight." — [Freeletics forum: onboarding / initial assessment](https://forum.freeletics.com/t/onboarding-how-to-go-through-initial-assessment/2789)
- Onboarding also "emphasizes mindset and commitment assessment, exploring motivation levels and mental readiness". — [Reteno gallery: Freeletics app screens](https://gallery.reteno.com/flows/app-screens-freeletics)
- Training Journeys: "Each Journey is designed to help you reach a specific goal, and includes workouts and exercises that are tailored to you and continuously adapt to your progress." — [Freeletics blog: Training Journeys update](https://www.freeletics.com/en/blog/posts/update-freeletics-training-journeys/)
- "Using input like your age, gender, and fitness level, the Coach's algorithm crafts personalized recommendations for exercises, reps, and sets"; "once a day is completed, the Freeletics Coach analyzes the user's performance and feedback to make sure their next training day is a perfect fit." — [Freeletics blog: AI and your Coach](https://freeletics.com/en/blog/posts/AI-and-your-Coach); [Freeletics sports science](https://freeletics.com/en/blog/posts/freeletics-sports-science)
- Marketing claim: "adapts each training session as you go with a 90% accuracy after week one." — [Freeletics blog: AI and your Coach](https://freeletics.com/en/blog/posts/AI-and-your-Coach) (claim as reported in search summary; methodology not visible)
- Coach+ (LLM assistant): "supports users during the onboarding process, helps them select a Freeletics Training Journey which fits their personal goals and needs, and answers fitness and Freeletics-specific questions". — [Fitt Insider press release](https://insider.fitt.co/press-release/freeletics-unveils-a-new-era-in-digital-fitness-with-the-launch-of-coach/)
- Injuries: "Freeletics is designed for people without injuries, and the 'Adapt' section is more for soreness rather than pure injuries ... they have intentionally chosen not to offer the option to adapt training in case of injury, instead advising athletes to consult a doctor and stop training temporarily." — [Freeletics forum: knee injury](https://forum.freeletics.com/t/knee-injury-more-flexibility-in-app/9747); [forum: change specific exercises](https://forum.freeletics.com/t/ability-to-change-specific-exercises-within-a-plan-instead-of-changing-the-whole-plan-due-to-certain-healthphysical-restrictions/6495); [forum: excluding an injured muscle](https://forum.freeletics.com/t/excluding-an-injured-muscle-from-a-training-plan/15290)
- Reddit-sourced summary: "Freeletics can be repetitive; most coaching features are paid." — [Setgraph: best workout app Reddit](https://setgraph.app/ai-blog/best-workout-app-reddit)

**Zing Coach (AI home/gym) — long quiz + AI plan, weekly/daily adjustment**
- "extensive onboarding quiz to gather data on goals, lifestyle, and physical attributes ... goals and motivations before the app dives into more detailed inquiries regarding their lifestyle, diet, sleep, injuries, activity level and training preferences"; "meticulously structured into three phases". — [Techpoint Africa Zing review](https://techpoint.africa/guide/zing-coach-ai-review/)
- Users say it "adjusts weekly and daily"; Trustpilot TrustScore 3.4–3.5 from 367 reviews. — [Trustpilot Zing Coach](https://www.trustpilot.com/review/zing.coach?page=6)
- Raised $10M. — [Athletech News](https://athletechnews.com/zing-coach-raises-10m-for-feature-packed-ai-fitness-app/)
- Onboarding flow is catalogued on screensdesign.com (not readable from this sandbox). — [Screensdesign: Zing AI](https://screensdesign.com/showcase/zing-ai-home-gym-workouts)

**Evolve AI (strength, "AI coach") — periodized engine + injuries/energy + voice**
- "adapts their training ... by progressively increasing the stress load on an athlete over time and allowing for periods of recovery"; "can adapt exercises based on injuries & energy, and makes real-time workout adjustments where you can say 'next set', 'I'm tired', or 'I have knee pain' — and your workout updates instantly." — [Dr. Muscle: Evolve AI review](https://dr-muscle.com/evolve-ai-app-review/); [Evolve Training App (App Store)](https://apps.apple.com/us/app/-/id1631174176)
- Pricing: "$64.99 per month or a Yearly Subscription for $219.99"; includes "tailored nutrition plans". — [App Store listing](https://apps.apple.com/us/app/-/id1631174176); [Product Hunt](https://www.producthunt.com/posts/evolve-ai-fitness-coach)
- "Reviews on Reddit showed mixed results, with some users believing it offers advantages over a traditional coach ... responsiveness to daily input like sleep and fatigue." — [Dr. Muscle review](https://dr-muscle.com/evolve-ai-app-review/)

**Future (human coach, iOS/Apple Watch-centric)**
- "$50 for the first month, then $199/month, or $149/month prepaid for a year" ($1,788/yr); "pairs you with one certified human coach who writes your program, adjusts it weekly and messages you in the app." — [Sensai: Future app review 2026](https://www.sensai.fit/blog/future-app-review-2026)
- App Store 4.9 from 10,703 ratings; Trustpilot 3.9/5 from 99 reviews. — [Sensai](https://www.sensai.fit/blog/future-app-review-2026)
- Industry framing: "in the age of AI, human personal trainers might become a luxury" (Future, Caliber). — [Athletech News](https://athletechnews.com/age-of-ai-human-personal-trainers-might-become-a-luxury-future-caliber/)

**Caliber (strength; free tier + premium human coaching)**
- "Those who want a dedicated human trainer can upgrade to one-on-one coaching for around $200 a month" (~$2,400/yr). — [Sensai](https://www.sensai.fit/blog/future-app-review-2026); [Garage Gym Reviews best workout apps](https://www.garagegymreviews.com/best-workout-apps)

**Ladder (team-based strength programs written by coaches)**
- "Ladder PRO annual costs $179.99". — [Sensai](https://www.sensai.fit/blog/future-app-review-2026)

**Centr (Chris Hemsworth; Train / Eat / Live library)**
- Content "divided into three main categories: Train (workouts), Eat (meal plans and recipes), and Live (mindfulness guides)"; trainers lead "HIIT, strength training, yoga, pilates, and stretching". — [Garage Gym Reviews Centr review](https://www.garagegymreviews.com/centr-review)
- Pricing (two sources disagree on tiers): "$10 a month on a 12-month contract or $30 a month on a rolling contract" — [TechRadar Centr review](https://www.techradar.com/health-fitness/fitness-apps/centr-review); "three- and 12-month subscriptions, which come out to $19.99 or $7.50 per month" — [Tom's Guide Centr review](https://www.tomsguide.com/uk/reviews/i-used-thors-workout-app-for-a-month-heres-what-happened). Seven-day free trial per both.
- Complaints: "biggest lacking feature of Centr is a lack of interactivity and accountability features"; "primary complaint ... is the price". — [Garage Gym Reviews](https://www.garagegymreviews.com/centr-review); [Reviewed.com Centr](https://reviewed.com/health/content/centr-chris-hemsworth-app-review)

**Sweat (Kayla Itsines; women's programs)**
- "$19.99/£14.99 per month or $119/£89 per year"; "19 full training programs ... home-based, zero-equipment, gym training plans, and post-pregnancy plans"; pregnancy program "40 weeks long"; subscription includes "recipes". — [Tom's Guide Sweat review](https://www.tomsguide.com/reviews/sweat-app); [Tom's Guide decade review](https://tomsguide.com/wellness/workouts/sweat-app-review-ive-been-using-this-app-for-the-past-decade-and-heres-why-i-think-its-the-best-workout-app-for-women)
- Injuries: "The programs in the Sweat app are not customized to accommodate injuries or health concerns ... seek clearance from a healthcare professional"; support team "can provide exercise alternatives". — [Sweat support: programs with an injury](https://support.sweat.com/hc/en-us/articles/360001085676-Can-I-complete-the-programs-in-the-Sweat-app-with-an-injury)

**Apple Fitness+, Peloton, Nike Training Club (libraries with light personalization)**
- Apple Fitness+: "$9.99 a month or $79.99 a year"; "Custom Plans that let subscribers build personalized schedules with chosen workout types, trainers, and durations." Peloton: "App One option at $15.99/month or App+ at $28.99/month". NTC: "free for Nike Members", "no in-app purchases". — [Sensai: NTC vs FitOn vs Apple Fitness+ 2026](https://www.sensai.fit/blog/nike-training-club-vs-fiton-vs-apple-fitness-plus-2026); [FindYourEdge UK alternatives 2026](https://www.findyouredge.app/news/apple-fitness-plus-alternatives-uk-2026)
- Apple announced "easier Fitness+ workouts and better routines in 2026" (new programs). — [T3](https://www.t3.com/active/apple-fitness-plus-new-programs-2026)

**Alo Moves, Glo (yoga/pilates libraries)**
- Alo Moves: "$12.99 monthly or $129.99 annually ... 14-day free trial"; "recommends classes and series to you based on the survey you complete upon signing up"; "over 2,500 classes". — [ChoosingTherapy Alo Moves review](https://choosingtherapy.com/alo-moves-yoga-app-review/); [Garage Gym Reviews Alo Moves](https://www.garagegymreviews.com/alo-moves-review)
- Glo: in-app purchases "$30.00–$244.99"; 4.9★ from 31.7K reviews; marketed as "tailored to fit your unique life stages". — [AppPricingLab Glo](https://apppricinglab.com/app/apple/1023475268); [AppFollow Glo](https://apps.appfollow.io/ios/glo-yoga-and-meditation-app/1023475268?country=kr)

**BetterMe (quiz-funnel weight loss / fitness / mental health)**
- "11 question screens in its onboarding quiz" (benchmark; see Q2 for the caveat that the catalogued flow may be the BetterMe: Mental Health app). — [LazyLanding Labs benchmark](https://lazylanding-labs.onrender.com/research/longest-onboarding-quizzes-benchmark.md)
- Scale and rating: "more than 10 million installs and averages around 4.5 stars". — [Unstar: Is BetterMe legit 2026](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026)
- Complaints: "a cheap trial that quietly renews into a much more expensive subscription, and a 30-day money-back guarantee people say they can never actually claim"; "One buyer was billed over $500"; "Workout plans feel repetitive and AI-generated rather than the tailored program the quiz promised"; "very generic nutrition and exercise recommendations, not personalized based on answers to questions at beginning, with the same workout day after day"; "The app crashes or freezes right after you have paid." — [Unstar](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026); [Kimola Trustpilot analysis](https://kimola.com/reports/unlock-betterme-app-insights-comprehensive-review-analysis-trustpilot-en-us-146549); [Reviews.io BetterMe World](https://www.reviews.io/company-reviews/store/betterme-world/n5d)

**Noom (behavior-change + nutrition quiz)** — see Q2.

**WHOOP Coach, Oura Advisor, Strava Athlete Intelligence (LLM on wearable data)**
- WHOOP Coach (Sept 2023): "AI-based chatbot powered by OpenAI's GPT-4 model with access to all of your personal WHOOP data"; "all data is anonymized before being sent to the LLM, and the partner hosting the LLM has a 'Zero-Retention/Zero Training Policy'". Usage: "4 of 5 most common questions members ask WHOOP Coach are about self-improvement, and 40% of all questions relate to recommendations." — [OpenAI customer story: WHOOP](https://openai.com/index/whoop/); [BusinessWire](https://www.businesswire.com/news/home/20230926899032/en); [BikeRadar](https://www.bikeradar.com/news/whoop-coach-chatgpt-4/)
- Oura Advisor: "transforms Oura insights into actionable, personalized guidance ... Sleep, Activity, Readiness and Resilience data"; "In April 2026, Oura introduced a proprietary large language model designed for women's health that draws from medical standards and research reviewed by board-certified clinicians". — [Oura blog: Oura Advisor](https://ouraring.com/blog/pl/oura-advisor/); [Athletech News 5W report](https://athletechnews.com/strava-myfitnesspal-oura-top-ai-fitness-apps-5w-report/)
- Strava Athlete Intelligence: beta for subscribers Oct 2024, out of beta Feb 2025; "moving away from novelty AI summaries and towards something that attempted to explain effort, fatigue, and trends in plain language". — [the5krunner](https://the5krunner.com/2024/10/03/strava-athlete-intelligence-subscribers/); [Stuff.co.za](https://stuff.co.za/2025/02/21/stravas-athlete-intelligence-out-of-beta/); [T3 Strava 2026](https://www.t3.com/active/strava-2026-future-and-challenges)
- 5W "Fitness & Wellness Apps AI Visibility Index 2026": Strava ~13% AI citation share, MyFitnessPal ~10%, Peloton ~8%, Apple Fitness+ ~6%, WHOOP ~5.5%, Oura ~5%. — [Athletech News](https://athletechnews.com/strava-myfitnesspal-oura-top-ai-fitness-apps-5w-report/)

**LLM-based newcomers (2025–2026)**
- Product Hunt launches: Gymble – AI Coach (20 Mar 2025); Coachly – AI Fitness Coach (18 Feb 2026). — [Product Hunt: Coachly / Gymble](https://www.producthunt.com/products/gymble-ai-coach/launches/accesibility-added)
- Movit (AI Fitness Coach) first released 27 Jul 2026. — [MWM.ai Movit](https://mwm.ai/apps/movit/6789943422)
- Agency case study: "AI-powered HIIT platform was launched in early 2025 after 10 months of development, integrated with LLM ... grew its user base by approximately 196.3% year-over-year, with 7% of its user base being paid subscribers." — [MobiDev case study](https://mobidev.biz/case-studies/ai-powered-hiit-workout-app)
- Typical LLM-app feature set described by a dev shop: "AI-generated personalized workout plans, progress tracking, exercise library with form notes, nutrition logging with AI macro calculation, and weekly check-ins." — [GeekyAnts](https://geekyants.com/en-au/blog/how-to-build-a-personalized-ai-fitness-coach-for-the-us-market---with-live-demo)
- "LLM cost per query dropped roughly 70% from 2023 to 2025" (low-authority source; treat as indicative). — [SignalSCV](https://signalscv.com/2026/05/how-ai-is-transforming-fitness-app-development-in-modern-times/)

### Inferences
- The incumbents with real "unique program" generation (Down Dog, Fitbod, Juggernaut, Freeletics) are all **deterministic/score-based**, not LLM-based; LLMs are used where the output is text (chat, Q&A, summaries) and where a hallucinated set/rep scheme would be a safety or trust problem.
- Apps that promise personalization through a quiz but deliver from a fixed content library (BetterMe, Centr, Sweat) draw the "generic / repetitive" complaints; apps that compute from logged data (Fitbod, Juggernaut) draw "cold start" complaints instead (needs 10–15 sessions).
- Nobody in this set combines a Down Dog-style per-session yoga/pilates generator with a Fitbod-style recovery model and nutrition in one product — that is the gap the user's app targets.

### Gaps
- Could not verify 2026 prices for Down Dog, Fitbod, JuggernautAI, Zing, Freeletics, BetterMe, Noom, Caliber free tier, Ladder monthly (search budget ran out / pages blocked).
- No primary Down Dog engineering blog on the sequencing algorithm was surfaced; only product-level parameter descriptions.
- Peloton "Personalized Plans"/Peloton IQ and MyFitnessPal AI features were not researched (budget).
- Nike Training Club onboarding, Glo onboarding, Caliber onboarding ("Strength Score"), Ladder onboarding not found.

---

## Key question 2: Exact onboarding questions (BetterMe, Noom, Freeletics, Fitbod, Down Dog, Zing), quiz length, and what growth/UX analyses say about length vs conversion

### Takeaway
Health & fitness is the longest-onboarding category (median ~20 screens, Noom up to 77–113 screens, 10–15 minutes); benchmarks argue the length is deliberate commitment-building before a soft paywall, and mature quiz funnels can convert >10% of completers. Only partial verbatim question lists were recoverable.

### Cited Findings

**Benchmarks**
- "Across 26 tracked Health & Fitness onboarding flows from 24 companies, the average is 24.7 screens and the median is 20.5 — nearly double the 11-screen median across all categories. Lengths range from 5 to 70 screens." — [Lazyweb: health & fitness onboarding length](https://www.lazyweb.com/research/health-fitness-onboarding-length)
- "Among 129 tracked onboarding flows, Lose It has the longest at 70 screens, followed by Rise (60) and JustFit (47). The top of the list is dominated by Health & Fitness apps that use long personalization quizzes." — [Lazyweb: longest onboarding flows](https://app.lazyweb.com/research/longest-app-onboarding-flows)
- "In fitness, a 20-screen onboarding is normal because the length collects goals, body metrics, and habits to build a personalized plan and commitment before the paywall." — [Lazyweb: is 20 onboarding steps too many](https://experiments.lazyweb.com/research/is-20-onboarding-steps-too-many)
- "According to Adapty's 2025 benchmark data, the average health and fitness app sees paywall-to-purchase conversion rates between 3% and 7%." — [RocketshipHQ](https://www.rocketshiphq.com/?p=5491)
- "Noom's quiz funnel is one of the highest-converting acquisition mechanisms in consumer health apps, with an estimated 40-50 question onboarding flow that takes 10-15 minutes ... Quiz-to-paid conversion for mature quiz funnels can exceed 10% of quiz completers." — [RocketshipHQ](https://www.rocketshiphq.com/?p=5491) (estimate, not Noom-disclosed)

**Noom**
- "Noom's web-to-app onboarding funnel spans up to 113 screens and takes 10–15 minutes to complete ... sensitive questions are framed with context, expectations are set and repeated deliberately, and the paywall appears only after users have invested significant time and emotional energy." — [RevenueCat: web-to-app onboarding funnel](https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel)
- First question: "What's your weight loss goal?" with options including "maintain weight and get fit" or "I haven't decided" — "removes the pressure to have a perfect answer on the very first screen". — [RevenueCat](https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel)
- "Dynamic branching: the quiz adapts in real time based on user inputs"; "inserts stats and success stories between questions". — [RevenueCat](https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel)
- "At one point, users are asked ten questions with four possible answers each, that's 262,144 potential combinations." — [Paddle: Fix That Funnel — Noom](https://www.paddle.com/studios/shows/fix-that-funnel/noom)
- "users completing a 77-step quiz and seeing their personalized plan before being presented with a 7-day free trial offer, with urgency created through a 15-minute countdown timer." — [Landing Doctors: Noom teardown](https://landingdoctors.com/teardowns/noom-com)
- Noom's in-app UX uses "gamification, progressive disclosure & nudges". — [Justinmind UX case study](https://www.justinmind.com/blog/ux-case-study-of-noom-app-gamification-progressive-disclosure-nudges/)
- Conflict: screen counts of 113 (RevenueCat), 77 (Landing Doctors), 40–50 questions (RocketshipHQ) — different dates/variants of the funnel; treat as a range.

**BetterMe**
- "BetterMe has 11 question screens in its onboarding quiz". — [LazyLanding Labs](https://lazylanding-labs.onrender.com/research/longest-onboarding-quizzes-benchmark.md)
- Catalogued questions (these appear to come from the **BetterMe: Mental Health** flow): "goals (stress reduction, anxiety coping, happiness), current feelings, and past meditation experience"; "habit questionnaire on daily energy levels ... even energy, a lunchtime dip, or needing a nap — with a progress indicator and back navigation"; stress-trigger statement "I easily get stressed over the small things"; expectations "Teach me new skills," "Review my beliefs". — [Screensdesign: BetterMe Mental Health](https://screensdesign.com/showcase/betterme-mental-health); [Lazyweb: habit questions](https://www.lazyweb.com/research/how-many-apps-ask-habit-question-onboarding); [Screensdesign: personalized onboarding](https://screensdesign.com/articles/personalized-app-onboarding/)
- Tactics: "weaves in social proof mid-onboarding – a user testimonial and a compelling graph showing reduced mood swings over time"; "Only after this extensive personalization and trust-building does BetterMe present its paywall with a classic soft paywall: a 7-day free trial." — [Screensdesign](https://screensdesign.com/articles/personalized-app-onboarding/)

**Freeletics**
- Asked: "gender, goal, fitness level, age, height and weight" plus "mindset and commitment ... motivation levels and mental readiness". — [Freeletics forum](https://forum.freeletics.com/t/onboarding-how-to-go-through-initial-assessment/2789); [Reteno gallery](https://gallery.reteno.com/flows/app-screens-freeletics)
- The Coach can be reset (re-running the assessment). — [Freeletics help: reset Training Coach](https://help.freeletics.com/hc/en-us/articles/360011919479-Can-I-reset-my-Training-Coach)

**Fitbod**
- Inputs named in Fitbod's own material: profile (fitness goal — strength / hypertrophy / endurance), training experience, available equipment, workout history. — [Fitbod blog](https://fitbod.me/blog/how-fitbod-personalizes-your-workout-plan-using-smart-training-algorithms/); [Fitbod blog: adapts to any level/goal/gym setup](https://fitbod.me/blog/what-fitness-app-is-best-for-you-how-fitbod-adapts-to-any-fitness-level-goal-or-gym-setup/)

**Down Dog**
- Not a quiz: the "assessment" is the per-session configuration — time, level (Beginner 1 upward), focus/practice type, boost (primary + secondary of 19 areas), voice, music, transition speed, hold length, liked/disliked poses. — [downdogapp.com](https://www.downdogapp.com/); [AppFollow listing](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca)

**Zing**
- Three-phase quiz: (1) goals and motivations, (2) lifestyle, diet, sleep, injuries, activity level, (3) training preferences. — [Techpoint Africa](https://techpoint.africa/guide/zing-coach-ai-review/)

### Inferences
- The funnels that convert best (Noom, BetterMe) treat the quiz as a **persuasion device** (social proof interleaved, "you can't fail" first answers, branching) as much as a data collector; the apps whose output genuinely depends on the answers (Fitbod, Juggernaut, Down Dog) ask far fewer questions and gather the rest from logged sessions.
- For a measurement-plus-questions product, the benchmark suggests ~20 screens is tolerated in this category; the risk is not length per se but a long quiz followed by output that visibly ignores the answers (BetterMe complaint pattern).

### Gaps
- Verbatim, ordered question lists for BetterMe's fitness/weight-loss quiz, Noom's full 77/113 screens, Fitbod's and Zing's onboarding, and JuggernautAI's setup (training days, competition date, lift maxes) could not be retrieved — the catalog sites (Screensdesign, Lazyweb, Page Flows, Mobbin) were blocked.
- No Noom- or BetterMe-disclosed conversion numbers; only third-party estimates.

---

## Key question 3: Generation engines in depth (Down Dog, Fitbod, JuggernautAI)

### Takeaway
Down Dog composes a session from a pose graph constrained by level, time, focus, boosts and likes/dislikes; Fitbod scores exercises by per-muscle recovery and recommends loads from history; JuggernautAI runs a periodized block plan and re-tunes it at four cadences (set, session, week, block) from readiness + RPE.

### Cited Findings
- Down Dog parameters and claims: see Q1 — time, level, focus, voice, music; boosts (19 areas, primary + secondary); like/dislike with "dislike = never appears"; transition speed and hold length; progressive unlock from Beginner 1; "over a million possible configurations". — [downdogapp.com](https://www.downdogapp.com/); [AppFollow listing](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca)
- Fitbod: Exercise Selector + Capability Recommender; per-muscle freshness scoring; equipment filter; goal changes set/rep balance; adaptation from too-easy/too-hard, swaps, skips, equipment edits; 400M+ workouts; "workout refreshes" when context changes. — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm); [Fitbod help](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout); [Fitbod help section](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works)
- JuggernautAI: pre-session readiness (sleep, mood, energy, soreness) → same-day volume/weight change; set-level RPE on top and back-down sets → next-set change; post-session data → weighted-average readiness score; weekly adaptation; block-end "more significant adjustments". — [JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); [JTS RPE/RIR article](https://help.jtsstrength.com/en/articles/2-all-about-rpe-and-rir)
- Freeletics (for comparison): per-day re-planning from "performance and feedback" after each session. — [Freeletics blog](https://freeletics.com/en/blog/posts/AI-and-your-Coach)

### Inferences
- Down Dog's model is the closest analogue for a yoga/pilates generator: a constrained random sampler over a pose library with (a) hard exclusions (dislikes, level gates, prenatal contraindications), (b) soft weights (likes, boosts), (c) global pacing knobs. The "unlock as you level" mechanic doubles as beginner safety.
- Fitbod's recovery-scoring idea transfers directly to pilates/strength days: track which muscle groups were loaded, down-weight them for 24–72h.
- Juggernaut's four-cadence loop (set → session → week → block) is the most explicit template for "adapt from RPE, skipped sessions, soreness".

### Gaps
- No public technical description of Down Dog's pose-transition rules, how "level" gates poses, or how boosts change sequence weighting.
- Fitbod's actual recovery half-lives / scoring formula and load-progression rules are not public.
- JuggernautAI's onboarding inputs (maxes, training days, meet date, equipment) and pricing not verified.

---

## Key question 4: Injuries / contraindications, pregnancy, beginners, mid-program adaptation

### Takeaway
Handling is weak and inconsistent: Fitbod and Evolve AI let users flag body areas and substitute; Freeletics and Sweat explicitly refuse to adapt for injuries and refer to a doctor; Down Dog's prenatal app adapts by trimester and lets users exclude poses; an academic review found pregnancy exercise apps do not screen for contraindications at all.

### Cited Findings
- Fitbod: injury feature — "note areas you want to avoid stressing and get alternative exercise recommendations"; does not diagnose; any exercise can be substituted and preferences are learned. — [Fitbod help 37629269518103](https://help.fitbod.me/hc/en-us/articles/37629269518103); [Fitbod FAQs](https://fitbod.me/faqs/)
- Evolve AI: "adapt exercises based on injuries & energy", voice input "I have knee pain" updates the workout instantly. — [Dr. Muscle review](https://dr-muscle.com/evolve-ai-app-review/)
- Freeletics: "designed for people without injuries ... 'Adapt' section is more for soreness ... intentionally chosen not to offer the option to adapt training in case of injury". — [Freeletics forum 9747](https://forum.freeletics.com/t/knee-injury-more-flexibility-in-app/9747); [forum 15290](https://forum.freeletics.com/t/excluding-an-injured-muscle-from-a-training-plan/15290)
- Sweat: "programs ... are not customized to accommodate injuries or health concerns"; manual alternatives from support after medical clearance. — [Sweat support](https://support.sweat.com/hc/en-us/articles/360001085676-Can-I-complete-the-programs-in-the-Sweat-app-with-an-injury)
- Sweat pregnancy: 40-week pregnancy program and post-pregnancy programs. — [Tom's Guide](https://www.tomsguide.com/reviews/sweat-app)
- Down Dog Prenatal: adapted "to your trimester and your body", pregnancy/postpartum boosts, dislike-to-exclude. — [Prenatal Yoga | Down Dog](https://apps.appfollow.io/ios/prenatal-yoga-down-dog/1504152442?country=us)
- Academic review of pregnancy exercise apps: "Few exercise apps designed for pregnancy aligned with current evidence-based physical activity guidelines, and none of the apps screened users for contraindications to physical activity and exercise during pregnancy, with most lacking appropriate personalization features". — [JMIR mHealth 2022, v10 e31607](https://mhealth.jmir.org/article/export/end/mhealth_v10i1e31607); [Bond University](https://research.bond.edu.au/en/publications/how-appropriate-are-physical-activity-apps-for-pregnant-women-a-s/)
- Mid-program adaptation signals in use: JuggernautAI (readiness: sleep, mood, energy, soreness; RPE per set; weekly and block check-ins) — [JTS help](https://help.jtsstrength.com/en/articles/3-how-juggernautai-is-individualized-to-you); Fitbod (too easy/hard, swaps, skips, equipment) — [Fitbod blog](https://fitbod.me/blog/fitbod-algorithm); Freeletics (post-session feedback → next day) — [Freeletics blog](https://freeletics.com/en/blog/posts/AI-and-your-Coach); Zing ("adjusts weekly and daily") — [Trustpilot](https://www.trustpilot.com/review/zing.coach?page=6); Future (human coach adjusts weekly) — [Sensai](https://www.sensai.fit/blog/future-app-review-2026).
- Beginners: Down Dog starts everyone at "Beginner 1" and unlocks poses by level. — [AppFollow listing](https://apps.appfollow.io/ios/yoga-down-dog/983693694?country=ca); Fitbod's personalization is weak until ~10–15 logged workouts. — [IndieHackers](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)

### Inferences
- A structured contraindication screen at onboarding (PAR-Q-style, pregnancy trimester, joint-specific pain) plus a hard-exclusion layer in the generator would exceed every mass-market competitor found here; the liability-driven refusal of Freeletics/Sweat is the norm, not the exception.
- "Soreness" is treated differently from "injury" by Freeletics; copying that distinction (soft down-weight vs hard exclude) is sensible.

### Gaps
- How Centr, Sweat, Alo Moves, Glo, Peloton or Apple Fitness+ screen pregnancy or injuries at onboarding (beyond disclaimers) was not found.
- No evidence found on how any app handles *skipped sessions* algorithmically (e.g., re-planning the week), other than general "adapts" claims.

---

## Key question 5: How nutrition is paired with training (Centr, Freeletics Nutrition, BetterMe, Sweat, Evolve, Noom)

### Takeaway
Most apps bolt on recipes or meal plans as a parallel content library (Centr "Eat", Sweat recipes) rather than coupling them to the training plan; BetterMe and Noom lead with diet and are criticized for generic output; Evolve AI and newer LLM apps claim training-coupled nutrition plans / AI macro calculation, but no verified mechanics were found.

### Cited Findings
- Centr: "Eat (meal plans and recipes)" sits beside "Train" and "Live"; "The recipe section offers quality food options." — [Garage Gym Reviews](https://www.garagegymreviews.com/centr-review)
- Sweat: subscription "gives you full access to all of the training plans ... as well as the on-demand sessions and the recipes." — [Tom's Guide](https://www.tomsguide.com/reviews/sweat-app)
- BetterMe: users report "very generic nutrition and exercise recommendations, not personalized based on answers to questions at beginning". — [Unstar](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026)
- Noom: quiz-first weight-loss product; "What's your weight loss goal?" is the opening question; behavior-change framing. — [RevenueCat](https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel)
- Evolve AI: "Users receive tailored nutrition plans to complement their training ... flexible scheduling to adjust workouts and nutrition plans to fit their lifestyle." — [Product Hunt / LogicWeb](https://www.logicweb.com/ai/evolveai/)
- LLM newcomers: "nutrition logging with AI macro calculation". — [GeekyAnts](https://geekyants.com/en-au/blog/how-to-build-a-personalized-ai-fitness-coach-for-the-us-market---with-live-demo)
- Oura/WHOOP: coaching is on biometrics (sleep, readiness), not meal planning. — [Oura Advisor](https://ouraring.com/blog/pl/oura-advisor/); [OpenAI/WHOOP](https://openai.com/index/whoop/)

### Inferences
- The incumbent pattern is "meal plans vs training plan in separate tabs". A product that derives calorie/protein targets from the same inputs (measurements, goal, training load for the week) and states them as principles would be differentiated, but must avoid BetterMe's failure mode of visibly generic advice.

### Gaps
- Freeletics Nutrition (whether it still exists in 2026, pricing, meal-plan mechanics) — not researched (budget).
- Whether Centr's meal plans set calorie targets from user data or are fixed per plan; whether Sweat has calorie targets — not confirmed.
- MyFitnessPal 2025–2026 AI features and pricing — not researched.

---

## Key question 6: What reviews and Reddit say are the biggest failures of "personalized" apps

### Takeaway
Three recurring failure modes: (1) **generic/repetitive output after a long quiz** (BetterMe, Freeletics, ~10% of Fitbod reviews), (2) **billing traps** — cheap trial auto-renewing into expensive plans, hard cancellation, unclaimable money-back guarantees (BetterMe; Zing's middling 3.4 Trustpilot), and (3) **price without accountability** (Centr, Future).

### Cited Findings
- BetterMe: trial→expensive renewal, unclaimable 30-day guarantee, "$500" billing case, deliberately hard cancellation, "same workout day after day", crash after payment. — [Unstar](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026); [Kimola](https://kimola.com/reports/unlock-betterme-app-insights-comprehensive-review-analysis-trustpilot-en-us-146549); [Reviews.io](https://www.reviews.io/company-reviews/store/betterme-world/n5d)
- Fitbod: "~10% ... dissatisfaction with Fitbod's AI's tendency to repeat the same workouts"; new users find it "generic before it learns"; needs 10–15 workouts. — [Onclarity](https://www.onclarity.com/leaderboard/insight/fitbod); [IndieHackers](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)
- Freeletics: "can be repetitive; most coaching features are paid"; refuses injury adaptation (forum threads above). — [Setgraph](https://setgraph.app/ai-blog/best-workout-app-reddit)
- Zing Coach: Trustpilot 3.4–3.5 (367 reviews) with mixed billing/experience feedback. — [Trustpilot](https://www.trustpilot.com/review/zing.coach?page=6)
- Centr: "lack of interactivity and accountability features"; price. — [Garage Gym Reviews](https://www.garagegymreviews.com/centr-review)
- Future: Trustpilot 3.9 vs App Store 4.9 — [Sensai](https://www.sensai.fit/blog/future-app-review-2026); price $199/mo.
- Noom: 15-minute countdown timer at paywall is cited as a pressure tactic. — [Landing Doctors](https://landingdoctors.com/teardowns/noom-com)

### Inferences
- The strongest trust signal a new app can give is **showing the causal link** between an answer/measurement and a visible change in the generated program (e.g., "because you flagged a left knee, lunges were replaced by ..."), since the dominant complaint is that the answers seemed to go nowhere.
- Transparent pricing with in-app cancellation is itself a differentiator in this category.

### Gaps
- Direct Reddit threads (r/fitness, r/yoga, r/pilates, r/Fitbod) could not be opened; only an aggregator summary (Setgraph) was available.
- Down Dog complaint themes (unitQ scorecard exists but was blocked).

---

## Key question 7: Business models, prices, trials, retention

### Takeaway
2025–2026 prices cluster at $10–20/month for algorithmic or library apps ($80–130/yr), $65/month for premium AI coaching (Evolve), and $150–200/month for human coaching (Future, Caliber). Free tiers: NTC (fully free), Caliber (free app, paid coach), Down Dog/Glo via IAP. Trials are 7 days (BetterMe, Noom, Centr) to 14 days (Alo Moves). Public retention numbers were not found; the only conversion benchmarks are Adapty's 3–7% paywall-to-purchase and a 7% paid share for one LLM HIIT app.

### Cited Findings
- Apple Fitness+ $9.99/mo, $79.99/yr; Peloton App One $15.99/mo, App+ $28.99/mo; NTC free. — [Sensai](https://www.sensai.fit/blog/nike-training-club-vs-fiton-vs-apple-fitness-plus-2026)
- Alo Moves $12.99/mo, $129.99/yr, 14-day trial. — [ChoosingTherapy](https://choosingtherapy.com/alo-moves-yoga-app-review/)
- Glo IAPs $30–$244.99. — [AppPricingLab](https://apppricinglab.com/app/apple/1023475268)
- Sweat $19.99/mo, $119/yr. — [Tom's Guide](https://www.tomsguide.com/reviews/sweat-app)
- Centr $10/mo (12-mo) or $30/mo rolling [TechRadar](https://www.techradar.com/health-fitness/fitness-apps/centr-review); alt. $19.99 (3-mo) / $7.50 (12-mo) per month [Tom's Guide](https://www.tomsguide.com/uk/reviews/i-used-thors-workout-app-for-a-month-heres-what-happened); 7-day trial.
- Evolve AI $64.99/mo, $219.99/yr. — [App Store](https://apps.apple.com/us/app/-/id1631174176)
- Future $50 first month then $199/mo, or $149/mo annual ($1,788/yr); Caliber coaching ~$200/mo (~$2,400/yr); Ladder PRO $179.99/yr. — [Sensai](https://www.sensai.fit/blog/future-app-review-2026)
- BetterMe and Noom: 7-day free trial soft paywall. — [Screensdesign](https://screensdesign.com/articles/personalized-app-onboarding/); [Landing Doctors](https://landingdoctors.com/teardowns/noom-com)
- Conversion: health & fitness paywall-to-purchase 3–7% (Adapty 2025, via RocketshipHQ); mature quiz funnels >10% of completers (estimate). — [RocketshipHQ](https://www.rocketshiphq.com/?p=5491)
- LLM HIIT app: 7% paid share, +196.3% YoY users. — [MobiDev](https://mobidev.biz/case-studies/ai-powered-hiit-workout-app)
- Market signals: Zing raised $10M — [Athletech News](https://athletechnews.com/zing-coach-raises-10m-for-feature-packed-ai-fitness-app/); BetterMe 10M+ installs — [Unstar](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026); Future 10,703 App Store ratings — [Sensai](https://www.sensai.fit/blog/future-app-review-2026).

### Inferences
- A yoga/pilates-plus-nutrition generator priced at ~$10–15/month with an annual plan around $80–120 sits in the established band; charging more requires either human touch (Future/Caliber) or clearly deeper adaptation (Evolve).

### Gaps
- Prices for Down Dog, Fitbod, JuggernautAI, Freeletics, Zing, BetterMe, Noom, Caliber, MyFitnessPal (2026) not verified.
- No public day-30 / month-6 retention figures for any named app; Sensor Tower / Appfigures 2025–2026 reports not reached.
- Trial-to-paid conversion disclosed by any named company: none found.
