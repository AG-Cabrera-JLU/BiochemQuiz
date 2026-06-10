# BiochemQuiz · v0.6

A live instructor-led quiz app for medical biochemistry students at JLU Giessen. The instructor projects the app on screen, students join via QR code on their phones, answer in real time, and results appear as a live bar chart — no installation required for anyone.

**Stack:** Node.js · Express · WebSocket · vanilla JS · deployed on Render.com

---

## Features

- **Real-time sync** via WebSocket — answers appear instantly on the instructor's bar chart
- **90 questions** across 9 biochemistry topics (Glycolysis, Gluconeogenesis, Glycogen Metabolism, Krebs Cycle, Respiratory Chain & OXPHOS, Fatty Acid Oxidation & Biosynthesis, Amino Acid Catabolism, Urea Cycle)
- **3 languages** — EN / DE / ES, switchable in one click; questions, options, and explanations all translate
- **5 answer options** (A–E) per question
- **SVG countdown timer** with danger highlight in the last 10 seconds
- **QR code** auto-generated from the server's public URL — students scan it to join
- **Student answer changes** — students can revise their answer before the instructor reveals
- **Instructor-only explanation** — explanation text and images shown only on the instructor screen after reveal
- **Question bank editor** — add, edit, delete questions in-app; auto-saves to disk (persists across restarts)
- **CSV export** of session results
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
cd biochemquiz
npm install
```

### 3. Run

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

1. Open the app URL and project it on screen
2. **Session tab** → select questions by topic → set timer → **Launch session**
3. QR code appears — students scan to join
4. **Start question** → countdown begins, students answer on their phones
5. Watch live bar chart update as answers come in (correct answer highlighted for you only)
6. **Reveal** → students see correct/wrong result on their phones
7. **Next question** → phones reset to waiting
8. **End session** → Results tab shows full breakdown, exportable as CSV

---

## Student workflow

1. Scan the QR code (or open the link) — phone shows the student view
2. Wait for instructor to start each question
3. Tap an answer — can change it anytime before the instructor reveals
4. After reveal: see correct (green) / wrong (red) on your selected answer

---

## Editing the question bank

Open any of these files in a text editor or directly on GitHub:

| File | Language |
|---|---|
| `questions.json` | English |
| `questions.de.json` | German |
| `questions.es.json` | Spanish |

Each question follows this structure:

```json
{
  "id": "gly001",
  "topic": "Glycolysis",
  "text": "Which enzyme catalyzes the first committed step of glycolysis?",
  "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
  "correct": 1,
  "explain": "Explanation shown after reveal (instructor screen only).",
  "explainImg": "images/optional_figure.png"
}
```

- `correct` is the **0-based index** of the correct option (0 = A, 1 = B, …, 4 = E)
- `explainImg` is optional — use `""` if no image
- Questions can also be added/edited live in-app via the Question Bank tab

You can also edit questions directly in the app (Question Bank tab → pencil icon). Changes auto-save to disk on the server.

---

## File structure

```
biochemquiz/
├── index.html           ← full app (instructor + student views, all JS/CSS inline)
├── server.js            ← Express + WebSocket server
├── package.json         ← dependencies (express, ws)
├── questions.json       ← question bank — English
├── questions.de.json    ← question bank — German
├── questions.es.json    ← question bank — Spanish
├── lang/
│   ├── en.json          ← UI strings — English
│   ├── de.json          ← UI strings — German
│   └── es.json          ← UI strings — Spanish
├── images/              ← explanation figures (optional)
├── config.example.js    ← unused placeholder (legacy)
├── .gitignore
└── README.md
```

---

## Troubleshooting

**QR code not working on phones:** It depends on where the server is running.
- **Render (recommended):** The URL is public — students can connect from any network: campus WiFi, home WiFi, 4G, 5G. No restrictions.
- **Running locally on your laptop:** Phones must be on the **same WiFi network** as your laptop, and you must use the LAN IP shown in the terminal (e.g. `http://192.168.x.x:3000`), not `localhost`. Mobile data will not work in this case because your laptop is not publicly reachable.

**Server sleeping on Render:** Open the URL ~2 minutes before class. The free tier sleeps after inactivity; the first request wakes it up in 30–60 seconds.

**Questions not loading:** Validate your JSON at [jsonlint.com](https://jsonlint.com). A missing comma or bracket breaks loading silently.

**Language toggle not translating questions:** Make sure all three question files (`questions.json`, `questions.de.json`, `questions.es.json`) exist and are valid JSON with the same question IDs.
