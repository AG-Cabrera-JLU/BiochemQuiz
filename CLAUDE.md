# BiochemQuiz — Project Rules for Claude

## Versioning

- Bump `package.json` patch version on every meaningful commit (feature, fix, content change).
- Skip the bump only for whitespace-only or docs-only changes.
- The pre-commit hook (`scripts/check-questions.js` + `npm version patch`) handles this automatically; do not double-bump manually.
- After a bump, display the new version in the app header (it is read from `package.json` at load time via `/api/info`).

---

## Question Authoring Workflow

Questions live in three parallel files that **must stay in sync**:

| File | Language |
|------|----------|
| `questions.json` | English (EN) — source of truth |
| `questions.de.json` | German (DE) |
| `questions.es.json` | Spanish (ES) |

### Adding a new question

1. Write the complete question in English first (`questions.json`), including all fields below.
2. Assign the next available ID for that topic (e.g., if the last Glycolysis question is `gly015`, use `gly016`).
3. Translate the question to German and Spanish, adding the same object (with the **same `id`, `correct` index, and `explainImg` path**) to `questions.de.json` and `questions.es.json`. Only `topic`, `text`, `options`, and `explain` are translated.
4. Run `npm run check` — it must report **0 errors** before committing.

### Removing a question

Remove the entry with that ID from **all three files** simultaneously.

### Editing a question

If you edit `text`, `options`, or `explain` in one language, also update the corresponding entry in the other two files.

---

## Question Object Schema

```json
{
  "id":         "gly001",
  "topic":      "Glycolysis",
  "text":       "Question text here?",
  "options":    ["Option A", "Option B", "Option C", "Option D", "Option E"],
  "correct":    1,
  "explain":    "Full explanation text.",
  "explainImg": "images/gly001.svg"
}
```

- `id`: `{topicPrefix}{3-digit-number}` — **permanent, never renumber**.
- `correct`: zero-based index into `options`.
- `explainImg`: `""` (no image) or `"images/{id}.{ext}"` — the filename **must match the question ID**.

### Topic prefix reference

| Topic (EN) | Prefix | Example IDs |
|------------|--------|-------------|
| Glycolysis | `gly` | gly001–gly015 |
| Gluconeogenesis | `gcn` | gcn001–gcn015 |
| Glycogen Metabolism | `glg` | glg001–glg010 |
| Krebs Cycle | `tca` | tca001–tca010 |
| Respiratory Chain and OXPHOS | `rc` | rc001–rc010 |
| Fatty Acid Oxidation | `fao` | fao001–fao010 |
| Fatty Acid Biosynthesis | `fab` | fab001–fab010 |
| Amino Acid Catabolism | `aac` | aac001–aac010 |
| Urea Cycle | `uc` | uc001–uc010 |
| Water and pH | `wph` | wph001–wph015 |
| Proteins | `pro` | pro001–pro015 |
| Proteomics | `ptx` | ptx001–ptx015 |

---

## Image Naming Convention

- Images live in `images/`.
- Filename **must match the question ID**: `images/{id}.{ext}` (e.g., `images/gly002.svg`).
- Set `explainImg` in all three language files to `"images/{id}.{ext}"`.
- Preferred format: SVG. PNG/JPG accepted for photographs.
- The `scripts/check-questions.js` validator enforces this convention and checks that the file exists on disk.

---

## Validation Script

```sh
npm run check          # runs scripts/check-questions.js
```

Checks:
1. All question IDs present in all three language files.
2. `explainImg` follows `images/{id}.{ext}` or is empty.
3. Referenced image files exist on disk.

The **pre-commit hook** runs this automatically and blocks the commit if errors are found. It also bumps the patch version automatically.

### Re-installing the hook on a fresh clone

The pre-commit hook lives in `.git/hooks/pre-commit` (not tracked by git). Copy it manually or run:

```sh
cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```
