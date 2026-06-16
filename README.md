# BiochemQuiz · v0.6.21

A live instructor-led quiz app for medical biochemistry students at JLU Giessen. The instructor projects the app on screen, students join via QR code on their phones, answer in real time, and results appear as a live bar chart once voting closes — no installation required for anyone.

**Stack:** Node.js · Express · WebSocket · vanilla JS · deployed on Render.com

---

## Features

- **Real-time sync** via WebSocket — answers arrive instantly; bar chart updates in the background
- **Results hidden during voting** — the bar chart is only shown to the instructor after the timer expires or "Stop timer" is clicked, so projected screens cannot influence student choices
- **167 questions** across 12 biochemistry topics (Glycolysis, Gluconeogenesis, Glycogen Metabolism, Krebs Cycle, Respiratory Chain & OXPHOS, Fatty Acid Oxidation, Fatty Acid Biosynthesis, Amino Acid Catabolism, Urea Cycle, Water and pH, Proteins, Proteomics)
- **3 languages** — EN / DE / ES, switchable in one click; questions, options, and explanations all translate
- **5 answer options** (A–E) per question with full-text wrapping (no truncation)
- **SVG countdown timer** with danger highlight in the last 10 seconds; per-question timer override before each question starts
- **QR code** auto-generated from the server's public URL — students scan to join
- **Student answer changes** — students can revise their answer before the instructor reveals
- **Explanation panel** — shown to instructor on screen and to students on their phones after reveal; optional diagram image
- **Student score screen** — shows total score and a per-question ✓/✗ breakdown with the student's chosen option
- **Saved presets** — save named question selections (with timer setting) and reload them in one click from any device; export/import as JSON backup
- **Question bank editor** — add, edit, delete questions in-app; auto-saves to disk; question IDs visible in list
- **Keyboard shortcuts** for the instructor: `S` = start question, `R` = reveal, `N` = next question, `E` = toggle explanation, `F` = fullscreen
- **Fullscreen toggle** button in the instructor toolbar
- **CSV export** of session results with explanation text per question in the Results tab
- **Dark mode** (follows system preference)

---

## How it works

```
Instructor browser ──── WebSocket ──── Render server ──── Student phones
      (projects on screen)                                (QR code → browser)
```

All session state lives in the server's memory. Students open the URL in their phone browser — no app, no account, no install. The QR code appears automatically once a session is launched.

---

## Quick start (local)

### 1. Install Node.js

Download the LTS version from [nodejs.org](https://nodejs.org) if you don't have it.

### 2. Install dependencies

```bash
npm install
```

### 3. Install git hooks (one-time)

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

The pre-commit hook validates question sync and auto-bumps the patch version on every commit.

### 4. Run

```bash
node server.js
```

Open `http://localhost:3000` for the instructor view. Students on the same network connect via `http://<your-local-ip>:3000` (shown in the terminal on startup).

---

## Deployment (Render.com)

The live instance runs at **https://biochemquiz.onrender.com**

To deploy your own:

1. Push this repository to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → connect your repo
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Instance type:** Free
4. Deploy — the QR code will automatically use the Render public URL

> **Free tier note:** the server sleeps after ~15 min of inactivity. Open the URL 1–2 minutes before class so it is awake when students arrive.

---

## Instructor workflow

### Before class

1. Open the app URL in a browser you will project
2. Go to **Session tab** — the **Saved presets** card is at the top
   - Click **Load** on a saved preset to instantly restore a question selection, timer, and session name
   - Or select questions manually by topic using the filter chips, then check individual questions
3. Set the session name and timer duration (15–300 seconds per question)
4. Click **Save current selection as preset** to reuse this selection in a future lesson

### During class

5. Click **Launch session** — the QR code appears on screen; students scan to join
6. **Start question** → countdown begins; students answer on their phones
   - Adjust the timer for the current question before clicking Start — the input defaults to the session timer but can be overridden per question
   - The bar chart is **not visible** while voting is open, so the projected screen does not reveal vote distribution
7. **Stop timer** (or let it expire) → bar chart appears instantly with collected votes
8. **Reveal** → correct bar turns green; students see correct (green) / wrong (red) on their phones along with the explanation text
9. **Show explanation** → explanation text and optional diagram appear on the instructor screen
10. **Next question** → phones reset to waiting
11. **End session** → Results tab shows full breakdown with explanations, exportable as CSV

**Keyboard shortcuts (instructor view):** `S` start · `R` reveal · `N` next question · `E` toggle explanation · `F` fullscreen

### Saving presets permanently

Presets created via the UI survive for the current server session but reset when Render restarts. To make them permanent across all devices and restarts:

1. Click **Export** → downloads `biochemquiz-presets.json`
2. Ask Claude to update `presets.json` in the repo with that file
3. Commit and push — Render redeploys and loads them at startup

---

## Student workflow

1. Scan the QR code (or open the link) — phone shows the student view
2. Wait for the instructor to start each question
3. Tap an answer — can change it anytime before the instructor reveals
4. After reveal: see correct (green) / wrong (red) on your selected answer
5. After the last question: score screen shows how many you got right

---

## Question bank

### Structure

Questions live in three parallel files that must stay in sync:

| File | Language |
|------|----------|
| `questions.json` | English (source of truth) |
| `questions.de.json` | German |
| `questions.es.json` | Spanish |

Each question object:

```json
{
  "id":         "gly001",
  "topic":      "Glycolysis",
  "text":       "Where does glycolysis take place?",
  "options":    ["In the mitochondria", "In the cytosol", "In the lysosome", "In the nucleus", "In the peroxisome"],
  "correct":    1,
  "explain":    "Glycolysis is a cytosolic pathway that runs entirely in the cytoplasm.",
  "explainImg": "images/gly001.svg"
}
```

- `id` — permanent identifier in the format `{topicPrefix}{3-digit-number}` (e.g. `gly001`, `tca010`). **Never renumber existing IDs.**
- `correct` — zero-based index of the correct option (0 = A … 4 = E)
- `explainImg` — `""` for no image, otherwise `"images/{id}.{ext}"` (filename must match the question ID)

### Topic prefixes

| Topic (EN) | Prefix | ID range |
|------------|--------|----------|
| Glycolysis | `gly` | gly001–gly015 |
| Gluconeogenesis | `gcn` | gcn001–gcn015 |
| Glycogen Metabolism | `glg` | glg001–glg010 |
| Krebs Cycle | `tca` | tca001–tca015 |
| Respiratory Chain and OXPHOS | `rc` | rc001–rc017 |
| Fatty Acid Oxidation | `fao` | fao001–fao010 |
| Fatty Acid Biosynthesis | `fab` | fab001–fab010 |
| Amino Acid Catabolism | `aac` | aac001–aac010 |
| Urea Cycle | `uc` | uc001–uc010 |
| Water and pH | `wph` | wph001–wph015 |
| Proteins | `pro` | pro001–pro015 |
| Proteomics | `ptx` | ptx001–ptx015 |

### Adding / editing / deleting questions

The recommended workflow is to ask Claude Code directly — it handles ID assignment, translation to all three languages, and validation in one step.

To do it manually:

1. Write the question fully in English in `questions.json`
2. Assign the next available ID for that topic
3. Translate to German and Spanish, adding the same object (same `id`, `correct`, `explainImg`) to `questions.de.json` and `questions.es.json` — only `topic`, `text`, `options`, and `explain` are translated
4. Run `npm run check` — must report 0 errors before committing

```bash
npm run check
```

The pre-commit hook runs this automatically and blocks the commit if files are out of sync.

### Explanation images

Images are static assets committed to `images/` and served directly by the server.

**Naming convention:** filename must match the question ID — `images/{id}.{ext}` (e.g. `images/gly002.svg`).

To add an image:
1. Place the file in `images/` with the correct name (e.g. `images/tca005.png`)
2. Set `"explainImg": "images/tca005.png"` in the question object across all three language files
3. Commit and push — Render redeploys automatically

Supported formats: SVG (recommended for diagrams), PNG, JPG, WebP.

---

## Saved presets

Presets store a named question selection together with the timer duration so a lesson can be reproduced in one click from any device.

### How they work

- `presets.json` in the repository is loaded at server startup (persistent across deployments)
- Presets created or deleted via the UI exist in server memory for the current session
- On Render free tier, in-memory changes reset when the server restarts

### Workflow for durable presets

1. Create presets via the UI during a session
2. Click **Export** to download `biochemquiz-presets.json`
3. Commit the file to the repo as `presets.json` (or ask Claude to do it)
4. Push → Render redeploys → presets are available on every device permanently

### Backup / restore

- **Export** — downloads the current in-memory presets as a JSON file
- **Import** — uploads a JSON backup and replaces all current presets in one click; also pushes to the server so other devices see the updated list immediately (does not affect `presets.json` on disk until committed)

---

## Development

### Validation script

```bash
npm run check    # validates question sync + image naming across EN/DE/ES
```

Reports:
- Question IDs missing from any language file
- `explainImg` values that don't follow `images/{id}.{ext}`
- Image files referenced in JSON but missing from disk

### Git hooks

A pre-commit hook at `.git/hooks/pre-commit` (source in `scripts/pre-commit.sh`) runs `npm run check` and bumps the patch version automatically on every commit. Install it once per clone:

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

### Project rules for Claude

`CLAUDE.md` at the repository root documents the versioning convention, question authoring workflow, ID scheme, and image naming rules that Claude Code follows when making changes to this project.

---

## File structure

```
biochemquiz/
├── index.html              ← full app (instructor + student views, all JS/CSS inline)
├── server.js               ← Express + WebSocket server, preset API
├── package.json            ← dependencies (express, ws) + npm scripts
├── questions.json          ← question bank — English
├── questions.de.json       ← question bank — German
├── questions.es.json       ← question bank — Spanish
├── presets.json            ← saved question selections (loaded at startup)
├── lang/
│   ├── en.json             ← UI strings — English
│   ├── de.json             ← UI strings — German
│   └── es.json             ← UI strings — Spanish
├── images/                 ← explanation figures (named images/{id}.{ext})
├── scripts/
│   ├── check-questions.js  ← question sync validator (npm run check)
│   └── pre-commit.sh       ← source for git pre-commit hook
├── CLAUDE.md               ← project rules for Claude Code
└── README.md
```

---

## Troubleshooting

**QR code not working on phones:**
- **Render (recommended):** URL is public — students connect from any network (campus WiFi, home, 4G/5G)
- **Running locally:** Phones must be on the same WiFi as your laptop; use the LAN IP shown in the terminal (e.g. `http://192.168.x.x:3000`), not `localhost`. Mobile data won't reach a local server.

**Server sleeping on Render:** Open the URL ~2 minutes before class. The free tier sleeps after inactivity; the first request wakes it up in 30–60 seconds.

**Presets missing after Render restart:** The server was restarted and in-memory presets were lost. Use **Import** to restore from your last exported backup, or commit `presets.json` to the repo as described in the presets workflow above.

**Questions not loading:** Validate your JSON at [jsonlint.com](https://jsonlint.com). A missing comma or bracket breaks loading silently.

**`npm run check` reports errors:** One or more question IDs are missing from a language file, or an `explainImg` path doesn't follow the `images/{id}.{ext}` convention. Fix the reported items before committing.

**Language toggle not translating questions:** Make sure all three question files (`questions.json`, `questions.de.json`, `questions.es.json`) are valid JSON and contain the same set of question IDs. Run `npm run check` to diagnose.
