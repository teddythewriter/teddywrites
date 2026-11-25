# Homepage Opening Line Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three entry tiles at the top of the homepage with one large, hand-picked line from a piece. The line rotates in the browser, and a quiet browse row sits below it.

**Architecture:** Posts get an optional `line:` front-matter field. `home.html` server-renders the newest lined post as the default hero and embeds every lined post as inline JSON. A small homepage-only script picks a random entry on load and on "Show me another". A Python check validates the built homepage, and `node --test` covers the pick logic.

**Tech Stack:** Hugo 0.162+ (Hugo Pipes for minify and fingerprint), vanilla JS, Python 3 stdlib check script, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-25-homepage-opening-line-design.md`

## Global Constraints

- Lines are quoted word for word from the post, at most about 30 words, and approved by Teddy before they're committed.
- Only posts with a `line` enter the rotation.
- The hero is complete without JS (server-rendered default = newest post that has a `line`).
- Use only existing CSS tokens (`--band`, `--accent`, `--meta`, `--mono`, `--serif`, `--btn-bg`, `--btn-text`). No new colors, so light mode works on its own.
- Header, footer, inner pages and every homepage section below the hero stay untouched. The palette strip stays, under the browse row.
- Copy: the label is `{Form} · {Month YYYY}`, the attribution is `from <strong>{Title}</strong>`, the button is `Read the {story|letter|fragment}` (or `Read it` when a post has no form), the swap control is `Show me another ↻`, and the browse row is `or browse · N stories · N fragments · N letters · N serial`.
- A short fade is allowed and must be skipped under `prefers-reduced-motion`.

## Review Focus

1. **Only one lined post.** "Show me another" must stay hidden, not be a no-op. It is server-rendered `hidden` and unhidden by JS only when `entries.length >= 2` (Tasks 2 and 3). `pickNext(1, …)` returns 0.
2. **Lines with quotes, apostrophes, `&` or `<`.** The JSON must still parse, and the visible text must match. Pinned in `check_home.py` (Task 2), with at least one approved line containing a curly quote.
3. **The Sinhala story's line.** The blockquote must carry `lang="si"` so the Sinhala font applies, both server-rendered and after a JS swap. JSON entries carry `lang` (Task 2 check, Task 3 JS).
4. **No posts have a line yet** (for example on a fresh checkout before Task 1 lands). The template must render no hero, only the browse row, and must not error. Pinned by building once before content lands (Task 2, Step 2).
5. **"Show me another" pressed repeatedly.** It must never show the same line twice in a row. Pinned by the `pickNext` test (Task 3).

---

### Task 1: Draft and approve opening lines

**Files:**
- Modify: front matter of every post in `content/posts/*.md` (except `_index.md`) and `content/sinhala/her-eyes.md`

**Interfaces:**
- Produces: the front-matter field `line: "<verbatim text>"` (a YAML string, or a TOML string in `+++` files).

- [ ] **Step 1:** For each post, pick one line from its body that stands alone, verbatim and at most about 30 words. It doesn't have to be the first sentence. Write them all to `docs/superpowers/plans/2026-11-25-opening-lines-draft.md` as a table: file | title | proposed line.
- [ ] **Step 2:** Show the draft to Teddy. **Stop until Teddy approves or edits it.** Pieces Teddy strikes get no `line`.
- [ ] **Step 3:** Add the approved `line:` values to the front matter. Run `hugo --quiet`. Expected: exit 0.
- [ ] **Step 4:** Commit: `git add content docs/superpowers/plans/2026-11-25-opening-lines-draft.md && git commit -m "content: add hand-picked opening lines"`

### Task 2: Hero template, styles and build check

**Files:**
- Modify: `themes/teddywrites/layouts/home.html` (replace the `entry-tiles` block, lines 9–17 of the `hero-inner` div)
- Modify: `themes/teddywrites/assets/css/main.css:110-114` (replace the `.entry-tiles`/`.entry-tile` rules) plus the mobile block near line 209
- Create: `scripts/check_home.py`
- Modify: `.github/workflows/hugo.yaml` (run `check_home.py` after `check_site.py`)

**Interfaces:**
- Consumes: `line` from Task 1.
- Produces: this DOM contract for Task 3:
  - `<section class="stage" aria-labelledby="hero-title">` containing
  - `<p class="stage-label" data-ol="label">`, `<blockquote class="stage-line" data-ol="line" lang="…" aria-live="polite">`, `<a data-ol="title">` inside `<p class="stage-from">`, `<a class="btn btn-primary" data-ol="read">`, and `<button type="button" class="stage-another" data-ol="another">Show me another ↻</button>`
  - `<script type="application/json" id="opening-lines">`, an array of `{"line","title","url","form","date","lang"}`, where `date` is `"September 2026"`-formatted and `form` is `"Story"|"Letter"|"Fragment"|""`
  - `<nav class="browse-row" aria-label="Browse by form">`
- Keep the existing `<h1 id="hero-title" class="sr-only">`.

- [ ] **Step 1: Write `scripts/check_home.py <public_dir>`.** It parses `public/en/index.html` and exits 1 with a message on failure. It asserts:
  - no element with class `entry-tile` remains
  - `#opening-lines` parses as JSON and is a non-empty list, and every entry has all six keys with a non-empty `line`, `title` and `url`
  - the server-rendered `[data-ol=line]` text equals the `line` of the entry with the newest date (compare by `url` against the first JSON entry, which the template emits newest-first)
  - the `[data-ol=read]` href equals that entry's `url`, and its text starts with `Read `
  - `[data-ol=line]` has `lang` equal to that entry's `lang`
  - `.browse-row` contains links to `/stories/`, `/fragments/`, `/letters/` and `/series/` and text matching `\d+ stories`, `\d+ fragments`, `\d+ letters`
  - `.palette-strip` comes after `.browse-row`
- [ ] **Step 2: Run it against the current build to see it fail.** Run `hugo --quiet && python3 scripts/check_home.py public`. Expected: FAIL on `entry-tile`. If Task 1 hasn't landed, also build after the template change below to confirm the no-lines case (Review Focus 4) renders the browse row without error.
- [ ] **Step 3: Implement the template.**
  - Candidates: `where (where site.RegularPages "Section" "in" (slice "posts" "sinhala")) "Params.line" "!=" nil`, sorted by date descending.
  - `lang`: `"si"` when `.Params.storyLanguage` is `si`, else `"en"`.
  - Form label: `.Params.form | humanize`.
  - Counts: `len (where $posts "Params.form" "story")` and so on. The serial count is `len (where site.RegularPages "Section" "series")`.
  - Emit the JSON with `jsonify` inside `<script type="application/json">`, which Hugo escapes safely.
  - Wrap the stage in `{{ with $lines }}…{{ end }}` so no lines means no stage.
  - Render the "Show me another" button with the `hidden` attribute. Task 3's JS unhides it, so without JS there's no dead control.
  - Load the Task 3 script on the homepage only. Put the `<script>` tag at the end of `main` in `home.html`, minified and fingerprinted with an integrity attribute and `defer`, following the `theme.js` pattern in `baseof.html`.
- [ ] **Step 4: Implement the styles.**
  - `.stage`: `background: var(--band)` plus the subtle radial accent from the mockup, padding `72px 56px 52px`.
  - `.stage-line`: italic, `font-size: clamp(28px, 4.2vw, 44px)`, `line-height: 1.3`, `max-width: 860px`, `margin: 0`. Add `:lang(si)` with `font-style: normal; line-height: 1.6`.
  - `.stage-label` and `.stage-another`: `--mono` at 12–13px in `--meta`. `.stage-another` has an underline in `--accent` (like `.more-link`), a transparent background, no border and `min-height: 44px`.
  - `.browse-row`: a mono 12px flex-wrap row with `gap: 8px 22px`, `padding: 16px 56px` and a top border in `--rule`.
  - At `max-width` mobile, set the side padding to 22px.
- [ ] **Step 5:** Run `hugo --quiet && python3 scripts/check_home.py public && python3 scripts/check_site.py public`. Expected: both exit 0.
- [ ] **Step 6:** Add `- name: Check homepage hero` / `run: python scripts/check_home.py public` to `hugo.yaml` after the link check.
- [ ] **Step 7:** Commit: `git commit -am "feat: opening-line hero replaces homepage tiles"`, also adding `scripts/check_home.py`.

### Task 3: Rotation script

**Files:**
- Create: `themes/teddywrites/assets/js/opening-line.js`
- Create: `scripts/opening-line.test.mjs`

**Interfaces:**
- Consumes: the DOM contract and JSON from Task 2.
- Produces: `pickNext(length: number, current: number, rand: () => number): number`, which returns an index in `[0, length)` that is `!== current` when `length >= 2`, and `0` when `length <= 1`. When `current` is `-1` (initial load), any index is allowed. The function is exposed for tests with `if (typeof module !== "undefined") module.exports = { pickNext };`, and the rest of the file is an IIFE that runs only when `document` exists.

- [ ] **Step 1: Write the failing tests** in `scripts/opening-line.test.mjs` (using `createRequire` to load the asset file):
  - `pickNext(1, 0, Math.random) === 0`
  - for `length = 5` and `current` in 0..4, 200 random trials never return `current` and always fall in `[0, 5)`
  - `pickNext(2, 0, () => 0.99) === 1` and `pickNext(2, 1, () => 0) === 0`
  - `pickNext(3, -1, () => 0) === 0`
- [ ] **Step 2:** Run `node --test scripts/`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `pickNext`.** When `current >= 0`, draw from `length - 1` slots and skip over `current`.
- [ ] **Step 4: Implement the DOM behavior** in the same file.
  - Read `#opening-lines`, and return early if it's missing or empty.
  - If `entries.length >= 2`, remove `hidden` from `[data-ol=another]`. Otherwise leave it hidden.
  - Track `current` by matching the server-rendered `[data-ol=read]` href to an entry's `url`.
  - On load, call `show(pickNext(len, -1, Math.random))`. On button click, call `show(pickNext(len, current, Math.random))`.
  - `show(i)` sets the label (`form ? form + " · " + date : date`), the line `textContent`, the line `lang`, the title text and href, and the read href and text (`"Read the " + form.toLowerCase()` or `"Read it"`).
  - Fade the blockquote's opacity over 180ms unless `matchMedia("(prefers-reduced-motion: reduce)").matches`.
  - Use `textContent` only, never `innerHTML`.
- [ ] **Step 5:** Run `node --test scripts/`. Expected: all pass. Run `hugo --quiet && python3 scripts/check_home.py public`. Expected: exit 0.
- [ ] **Step 6:** Commit: `git add themes/teddywrites/assets/js/opening-line.js scripts/opening-line.test.mjs && git commit -m "feat: rotate opening line in the browser"`

### Task 4: Visual verification

- [ ] **Step 1:** With `hugo server`, open `/teddywrites/en/` in the browser pane. Check:
  - dark theme: the line shows, and "Show me another" swaps it with no repeats over 10 clicks
  - light theme (toggle): the text is readable on `--band`
  - mobile preset: no horizontal scroll, and the line wraps cleanly
  - JS disabled (or the script tag removed temporarily): the newest piece's line shows, and "Show me another" isn't visible.
  - The Sinhala line, if approved: it renders in Noto Serif Sinhala, upright.
- [ ] **Step 2:** Fix anything found, and rerun `check_home.py`, `check_site.py` and `node --test scripts/`.
