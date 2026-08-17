# MicroHaven

**Turn a balcony, patio, or windowsill into a tiny native habitat.**

MicroHaven is a web prototype that helps people in Portland, Oregon (Willamette Valley) create small native plant habitats in container-sized spaces. It uses a curated local plant database and deterministic matching — not AI guesswork — to find plant combinations that actually work together.

## The Problem

Most people with small outdoor spaces don't know which native plants will survive in a container on their balcony, let alone which plants work well *together* as a tiny ecosystem. Generic gardening advice assumes you have a yard.

## How It Works

```
User describes their space
       ↓
Hard-constraint filtering (sun, moisture, size, budget)
       ↓
Individual plant scoring (weighted match)
       ↓
Combination evaluation (bloom timing, pollinator diversity, height layers)
       ↓
Best 2-3 plant habitat selected
       ↓
Visual result with full reasoning
```

### Why Deterministic Matching?

The plant database and matching rules are the **source of truth**. An LLM is never used to select plants, invent species, or determine botanical facts. If an LLM is available, it only explains the already-selected habitat in plain language. The system works fully without any AI API.

This matters because:
- Plant compatibility is a factual question, not a creative one
- Hard constraints (sun, moisture, space) must never be violated
- The reasoning is fully transparent and auditable

## Plant Database

`src/data/plants.json` contains ~16 curated Willamette Valley native plants with:
- Scientific and common names
- Sun, moisture, and container requirements
- Bloom periods, pollinators, and ecological roles
- Approximate costs and care notes
- Source attributions

## Matching Algorithm

### Hard Constraints (pass/fail)
- Must be native to Willamette Valley
- Must be container-suitable
- Sunlight must be compatible
- Moisture must be compatible
- Must physically fit the space
- Must be within budget

### Individual Scoring (weighted 0-100)
| Factor | Weight |
|--------|--------|
| Sun match | 30 |
| Moisture match | 20 |
| Container fit | 15 |
| Difficulty fit | 10 |
| Space fit | 10 |
| Budget fit | 5 |
| Ecological value | 10 |

### Combination Scoring
Evaluates 2-3 plant combinations for:
- Bloom period complementarity
- Pollinator diversity
- Ecological role diversity
- Height/layer complementarity
- Space and budget feasibility

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Vanilla CSS (editorial design system)
- **Data**: Local JSON (no database server)
- **Matching**: Deterministic JavaScript (no AI)
- **LLM**: Optional explanation only (disabled by default)

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Vercel

This project is Vercel-ready out of the box:
1. Connect your GitHub repo to Vercel
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

No environment variables are required.

## Demo

Click **"See an example"** on the homepage to load a preconfigured scenario:
- Portland apartment balcony
- 6 × 4 ft
- Part sun
- Moderate moisture
- Beginner
- $40 budget

## Geographic Scope

**MVP region**: Willamette Valley, Oregon (Portland demo location).

Multi-region support is not implemented.

## Known Limitations

- Plant data is a curated demo set (~16 plants), not a comprehensive botanical database
- No scientific validation has been performed on the specific plant combinations
- Cost estimates are approximate
- The system does not account for soil type, wind exposure, or microclimates
- Single-region only (Portland / Willamette Valley)
- No user accounts or saved plans

## License

MIT
