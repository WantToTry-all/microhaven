# Project Summary: MicroHaven

**What MicroHaven does:**
MicroHaven allows users to input the exact dimensions, sunlight, and moisture conditions of a small outdoor space (like a balcony or windowsill). It then deterministically filters and scores a curated list of native Willamette Valley plants to generate a customized 2-to-3-plant habitat recommendation that perfectly fits those constraints.

**What happens after the user clicks "Build My MicroHaven":**
1. The system loads the constraints and checks the `plants.json` dataset.
2. It completely filters out any plants that don't match the hard constraints (sun, moisture, size, budget).
3. It scores the remaining individual plants based on fit, difficulty, and ecological value.
4. It pairs combinations of 2-3 plants and scores the *entire group* for bloom complementarity, varied height layers, and pollinator diversity.
5. The highest-scoring combination is recommended and visually rendered.

**What is inside plants.json:**
A curated dataset of ~16 native plants from the Willamette Valley. It includes botanical data, bloom months, height layers, container viability (with minimum dimensions in inches), moisture/sun requirements, estimated costs, and supported pollinator types. 

**How hard constraints work:**
If a plant violates a constraint (e.g., requires full sun but the balcony is shaded, or requires a 16" pot but the balcony max depth is 14"), it is immediately rejected with a recorded reason. This guarantees no impossible configurations are generated.

**How individual scores work:**
Plants earn points (out of 100) based on weighted factors:
- Sun/Moisture matches (50%)
- Container and Space physical fit (25%)
- Beginner friendliness and Budget fit (15%)
- Extra ecological roles (10%)

**How combination selection works:**
Instead of just picking the top 3 individual plants, it builds pairs and trios and rewards them for spanning different bloom seasons (e.g., Spring + Summer + Fall), occupying different visual layers (Tall + Medium + Low), and supporting diverse wildlife.

**Where the LLM is used:**
An LLM is used *only* for generating a plain-English explanation of why the habitat works (the "Why this combination" section). It receives the deterministic plant array and the user constraints to write a localized summary.

**What happens without the LLM:**
The application uses a reliable, built-in deterministic text generator (`generateDeterministicExplanation()`) that seamlessly formats the hard data into a readable paragraph. The system functions perfectly without an API key or external network calls.

**Important files:**
- `src/data/plants.json`: The single source of truth for plant data.
- `src/engine/matchingEngine.js`: Contains all the filtering, scoring, and combination logic.
- `src/components/HabitatResult.jsx`: Renders the habitat, layout diagrams, and the reasoning breakdown.
- `src/index.css`: The complete "editorial" design system.

**How to start the project:**
```bash
npm install
npm run dev
```

**How to run the tests:**
No external test runner is needed for the hackathon. The transparency/"How this recommendation was chosen" section acts as an active visual unit test to prove constraints are respected in real-time.

**How to demonstrate it in 60–90 seconds:**
1. Open the homepage. Highlight the clean, premium design.
2. Click **"See an example"** to instantly load the Portland balcony demo.
3. Click "Build My MicroHaven".
4. Point out the loading steps to show it is *actually processing rules*.
5. On the result screen, emphasize the **Bloom Timeline** and the **Container Arrangement** to show it considers the space temporally and physically.
6. Open the **"How this recommendation was chosen"** toggle to prove to the judges that it is *not* an AI hallucination, but a deterministic scoring engine. 

**What claims we should NOT make to judges:**
- Do not claim it uses AI to make botanical decisions.
- Do not claim the plant combinations are scientifically validated by ecologists. 
- Do not claim it covers all of Oregon or the US (it is scoped specifically to Willamette Valley for the MVP).
- Do not claim it calculates precise carbon offsets or ecological impact metrics.
