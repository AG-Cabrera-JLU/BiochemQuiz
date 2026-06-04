# BiochemQuiz

A live instructor-led quiz app for medical bachelor students. The instructor projects the app, students connect via QR code on their phones, answer in real time, and results are shown as a live bar chart.

---

## Quick start

### 1. Clone or download this repository

```bash
git clone https://github.com/YOUR_USERNAME/biochemquiz.git
cd biochemquiz
```

### 2. Set up Firebase (for real cross-device sync)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (free Spark plan is sufficient)
3. Add a Web app to the project
4. Copy your `firebaseConfig` values
5. In Firebase console → Build → Realtime Database → Create database (start in test mode)
6. Copy `config.example.js` to `config.js` and fill in your values:

```bash
cp config.example.js config.js
# then open config.js and fill in your Firebase credentials
```

> `config.js` is in `.gitignore` — your credentials are never committed to GitHub.

### 3. Deploy to GitHub Pages (recommended)

1. Push the folder to a GitHub repository
2. Go to repository Settings → Pages → Source: Deploy from branch → `main` → `/ (root)`
3. Your app will be live at `https://YOUR_USERNAME.github.io/biochemquiz/`
4. Share this URL — it works as both instructor and student interface

### 4. Or run locally

Just open `index.html` in a browser. For cross-device testing on the same network, use a local server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## How to use

### Instructor workflow

1. Open the app URL in your browser and project it on screen
2. Go to **Session** tab → select questions by topic → set timer → **Launch session**
3. A QR code appears — students scan it to join
4. Click **Start question** to begin the countdown
5. Watch live bar chart update as students answer
6. Click **Reveal to students** to show results and explanation on student screens
7. Click **Next question** to advance
8. Click **End session** when done → go to **Results** tab for full breakdown

### Student workflow

1. Scan the QR code or open the link shown by the instructor
2. Wait for the instructor to start each question
3. Tap your answer before the timer runs out
4. Wait for the instructor to reveal — results and explanation appear automatically

---

## Editing the question bank

### Add or edit a question

Open `questions.json` in any text editor or directly on GitHub (click the file → pencil icon).

Each question has this structure:

```json
{
  "id": "gly011",
  "topic": "Glycolysis",
  "text": "Your question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explain": "Explanation shown after reveal.",
  "explainImg": "images/your_figure.png"
}
```

- `correct` is the **index** of the correct option (0 = A, 1 = B, 2 = C, 3 = D)
- `explainImg` is optional — leave as `""` if no image

### Add a new topic

Add the topic name to the `"topics"` array at the top of `questions.json`:

```json
"topics": [
  "Glycolysis",
  "Gluconeogenesis",
  "Your New Topic"
]
```

It will appear automatically in the topic filter chips.

### Add an explanation image

1. Upload the image file to the `images/` folder (via GitHub drag-and-drop or git push)
2. Reference it in the question: `"explainImg": "images/yourfile.png"`

---

## Adding a new language

1. Copy `lang/en.json` to `lang/xx.json` (e.g. `lang/fr.json` for French)
2. Translate all string values (keep the keys unchanged)
3. In `index.html`, find the line:

```javascript
const SUPPORTED_LANGS = ['en', 'de', 'es'];
```

Add your new language code:

```javascript
const SUPPORTED_LANGS = ['en', 'de', 'es', 'fr'];
```

4. The toggle in the top-right will include the new language automatically.

---

## Changing the default language

In `index.html`, find:

```javascript
const DEFAULT_LANG = 'en';
```

Change to `'de'` or `'es'` as needed.

---

## File structure

```
biochemquiz/
├── index.html          ← full app (instructor + student views)
├── questions.json      ← all questions, editable anytime
├── config.js           ← your Firebase config (not committed)
├── config.example.js   ← template for Firebase config
├── lang/
│   ├── en.json         ← English strings
│   ├── de.json         ← German strings
│   └── es.json         ← Spanish strings
├── images/
│   └── (your explanation figures go here)
├── .gitignore
└── README.md
```

---

## Firebase Realtime Database rules (for production)

After testing, update your Firebase rules to prevent abuse:

```json
{
  "rules": {
    "session": {
      ".read": true,
      ".write": true
    },
    "responses": {
      ".read": true,
      ".write": true
    }
  }
}
```

For a more secure setup with authentication, contact your university IT department about Firebase Auth integration.

---

## Troubleshooting

**QR code not working:** Make sure the app is deployed to a public URL (GitHub Pages), not just opened as a local file. Students must be able to reach the same URL from their phones.

**Answers not syncing:** Check that `config.js` exists and your Firebase project has Realtime Database enabled (not only Firestore).

**Questions not loading:** Validate your `questions.json` at [https://jsonlint.com](https://jsonlint.com). A missing comma or bracket will break loading.

**Language toggle missing:** Check that all files in `lang/` exist and are valid JSON.
