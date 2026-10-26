---
doc: spec
status: approved
---

# Shift Shock — Technical Spec

> Approval note: approved provisionally by the learner's relay assistant under the learner's instruction to proceed; product answers marked [AI-provisional] await the learner's confirmation.

All technical decisions here are [AI-provisional], made by the relay assistant, and the learner will confirm them. None of them was chosen by the learner.

## How This Works, In Plain Language
Shift Shock is one web page that runs entirely in the visitor's browser. There is no server and no account.
- **The page** (`index.html` with `style.css`) holds the layout and the duty-board look.
- **The screen logic** (`app.js`) reacts to clicks, draws the board and animates the cards.
- **The rules engine** (`core.js`) is plain logic with no screen code: given the helpers, their skills and who is absent, it works out the smallest fix. Keeping it separate means it can be tested on its own.
- **The test page** (`tests.html`) runs checks against `core.js` in the browser and prints ALL PASS when they succeed.

Why this shape: a static page with no build step is the simplest thing that judges can open from a link, and it can be written and checked quickly.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. The coordinator opens the page → `app.js` loads the "School festival" preset into the state and draws the board.
2. They click a card → `app.js` flips that helper's absent flag and redraws; the post turns red.
3. They press **Find the smallest fix** → `app.js` passes the state to `core.js`.
4. `core.js` searches every possible assignment and returns the best one: the moves, a reason for each, and any uncovered posts.
5. `app.js` animates the moved cards, adds numbered badges, and shows the explanation list or the alert panel.
6. They press an export button → `app.js` builds the CSV, PNG or text in the browser and downloads or copies it.

## Stack
- HTML, CSS and plain JavaScript; no framework, no external libraries, no network calls, no build step. This keeps the project dependency-free and easy to host.
- Browser APIs: Blob and a download link (CSV), canvas (PNG), the clipboard API (Copy as text). These are standard browser features; to check early in the build that they work in the browser used for the demo (clipboard access can need a secure page, which GitHub Pages provides).
- Code is written by OpenAI Codex on the learner's own small home computer from this spec, and checked in a browser before recording.

## Where It Runs and How Someone Tries It
- Runs in any current desktop browser. No installation.
- Local: open `index.html` directly, or run `python3 -m http.server` in the project folder and open `http://localhost:8000`.
- Public: hosted on GitHub Pages so judges can try it without an account.
- Required for submission: a short demo video and a public GitHub repository. The Pages site is a bonus, not a substitute for either.
- Demo recording: load the preset, mark Haru absent, run the fix, then mark Aiko absent and show the alert.

## Look and Feel
Carried from `prd.md > Look and Feel`.
- Cream card-stock background; pegboard columns with dotted rules drawn in CSS; helper cards as paper tags with a punched hole (a CSS circle).
- Signal-red for empty posts and absences, forest-green for covered posts.
- System font stack; no emoji; no images other than what CSS draws.
- Works at 1280x720; large, legible names.
- Interface copy is short and plain, such as "Everyone is here - nothing to fix".

## Components

### Rules engine (`core.js`)
Pure functions with no screen access.
- **Search:** try every assignment of present helpers to posts (at most 10 helpers and 5 posts, so this is small) and keep the best by this order: (1) fewest helpers whose post changes, (2) fewest Floating helpers used, (3) name order. This is deterministic, so the same input always gives the same answer.
- **Partial plan:** if no assignment covers every post, choose the assignment that covers the most posts, then apply the same order.
- **Explanations:** for each move, a plain sentence of the form "X moves from A to B because …", ordered so that a move that frees a post comes before the move that fills it.
- **Output:** `{ moves, reasons, uncovered, covered }`.
PRD ref: `prd.md > Features and Behavior`.

### Screen logic (`app.js`)
Holds the state, draws the board, handles clicks, edits and animation, and builds the CSV, PNG and text exports.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Features and Behavior`.

### Page and style (`index.html`, `style.css`)
Layout, the board and the look.
PRD ref: `prd.md > Look and Feel`.

### Tests (`tests.html`)
Loads `core.js` and asserts, at least: Haru absent gives exactly the two example moves; Aiko absent gives First aid uncovered with a reason; nobody absent gives no moves; all absent leaves every post uncovered; duplicate names are refused; the same input gives the same output twice. Prints ALL PASS.
PRD ref: `prd.md > Product Decisions`.

## Data Model
In the page's memory only:
- `helpers`: a list of `{ name, skills: [post, …], post (a post name or "Floating"), absent: true/false }`.
- `posts`: the fixed list Reception, Guide, Stage, Kitchen, First aid.
- `result`: the latest fix `{ moves, reasons, uncovered }`, or nothing.
Nothing is stored. Reloading the page returns to the preset; export is the only way to keep a roster.

## File Structure
```
project/
├── index.html      # page structure
├── style.css       # duty-board look
├── app.js          # screen logic, animation, exports
├── core.js         # rules engine (pure logic)
├── tests.html      # browser checks, prints ALL PASS
├── LICENSE         # MIT
├── README.md       # what it is and how to try it
└── devpost/        # Devpost learning workspace
```

## External Services and Dependencies
None. No APIs, keys, database or cost. Hosting is GitHub Pages (free) and is optional.

## Important Failure Modes
- **PNG or clipboard export fails in a browser** → the page shows a short message, and the CSV download still works.
- **No assignment covers every post** → this is a designed outcome, not an error: the alert panel and the best partial plan are shown.
- **Duplicate name or more than 10 helpers** → refused with a short message; the state does not change.

## What Was Simplified and Why
- **Exhaustive search** instead of a clever algorithm — with at most 10 helpers and 5 posts it is fast and easy to prove correct. A larger event would need a smarter method.
- **One slot and one person per post** instead of full schedules — it proves the kernel in a minute of demo.
- **Export instead of saving** — no storage, accounts or server to build.

## Decisions and Open Issues
- All decisions above are [AI-provisional]: static no-build web app, no libraries, GitHub Pages hosting, Codex builds it, browser-checked before recording. Tradeoff accepted: no persistence, and the search does not scale beyond small events.
- Genuine learner uncertainty discussed: not established. None was identified in this session.
- Open: names, skills and starting posts of the 7 preset helpers (from `prd.md > Open Questions`), to be fixed at build so both examples work.
- Open: the learner's confirmation of every [AI-provisional] decision in one batch.
- To check early in the build: the PNG and clipboard exports in the demo browser.
