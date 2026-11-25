# Homepage opening line — design

Date: 2026-11-25
Status: awaiting approval

## Intent

The three cards at the top of the homepage (Stories / Fragments / Letters) repeat the
header nav and put a menu in front of the writing. Replace them with a single large
line from one of Teddy's pieces, so the first thing a visitor does is read.
(Chosen from mockups: direction B, "Opening line, full stage".)

## Goals

- The top of the homepage shows one line from a piece, large and in italics, on the darker band background.
- Above the line: a small mono label with form and month/year ("Letter · September 2026").
- Below it: "from **Title**", then a primary button "Read the story / letter / fragment" and a "Show me another ↻" link.
- A quiet browse row under the stage: "or browse · 14 stories · 16 fragments · 19 letters · 1 serial", with counts computed at build time.
- A different line on each visit, and "Show me another" swaps it in place.

## Non-goals

- Anything below the hero: the serial card, "Start here", "From the notebook" and "Follow a thread" stay as they are. They may get a follow-up.
- Header, footer and inner pages are not touched.
- No daily scheduled rebuilds.

## Anti-goals

- A broken or empty hero when JavaScript is off.
- Lines that read as throwaway scene-setting ("It was almost time for the sun to rise.").

## Approaches

1. **Pick in the browser (chosen).** Hugo writes every line into the homepage as an inline JSON list, and a small script picks one at random on load. Works on GitHub Pages as it is.
2. Pick at build time, with a daily scheduled Action rebuild. Rejected: more moving parts, and "another" still needs JS.
3. Always use the newest piece's line. Rejected: goes stale between posts, and there's no "another".

## Design

- **Content:** a new optional front-matter field `line:` on posts. Only posts with a `line` go into the rotation. *My call:* the lines are hand-picked, not auto-extracted. I draft one line per post (taken word for word from the post, at most about 30 words) and Teddy approves or swaps them before they're committed. Series chapters and the Sinhala story are included if they have a line.
- **Template (`layouts/home.html`):** replaces the `entry-tiles` block. The server-rendered default is the newest post that has a `line`, so the hero is complete without JS. Every candidate is written into `<script type="application/json" id="opening-lines">` as `{line, title, url, form, date}`.
- **Script (`assets/js/opening-line.js`):** minified and fingerprinted like `theme.js`, and loaded on the homepage only. On load it picks a random entry and updates the label, line, title, button text and href. "Show me another" picks a different entry, never the current one. A short fade is skipped under `prefers-reduced-motion`. The link is a real `<button>`, and the swapped region is `aria-live="polite"`.
- **Styles (`main.css`):** `.entry-tiles` and `.entry-tile` rules are replaced with a `.stage` hero and a `.browse-row`. The hero uses the existing tokens (`--band`, `--accent`, `--mono`, `--serif`) so light mode works without extra rules. Mobile uses a 22px side padding and a fluid `clamp()` font size.
- **Palette strip:** stays, under the browse row (my call).
- **Check:** build with `hugo` and run `scripts/check_site.py`, then view the homepage in dark, light, mobile and no-JS.

## Left to the builder

Exact spacing and font sizes, using the B mockup at `.superpowers/brainstorm/.../homepage-top.html` as the reference.
