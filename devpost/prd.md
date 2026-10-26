---
doc: prd
status: approved
---

# Shift Shock — Product Requirements

> Approval note: approved provisionally by the learner's relay assistant under the learner's instruction to proceed; product answers marked [AI-provisional] await the learner's confirmation.

Shift Shock helps the volunteer coordinator of a small event find the smallest, explained fix when a helper is absent on the day. [AI-provisional]
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`. All requirements below are [AI-provisional] unless marked otherwise.

## The Core Journey
Source: `scope.md > The Core Loop`.
1. The coordinator opens the page. One line at the top says what it does and for whom. The "School festival" preset (7 helpers) is already loaded, so the board is not empty.
2. They click a helper's card to mark that helper absent. The card turns grey with an "Absent" label, and the post they held turns red.
3. They press **Find the smallest fix**.
4. Cards animate to their new posts, each moved card with a numbered badge. A numbered list explains each move in plain words.
5. If a post can't be covered, a red alert panel names the post and says why, and shows the best partial plan.
6. They download the new roster (CSV), download a roster image (PNG), or copy the roster as text.

Success: the coordinator knows who goes where within a minute, and understands why.

## Screens and Layout
Source: `scope.md > The POC Boundary`. A single screen, usable at 1280x720.
- **Header:** the app name and the one-line explanation.
- **Board:** one column per post (Reception, Guide, Stage, Kitchen, First aid) plus a Floating column for helpers without a fixed post.
- **Helper cards** sit in their columns, each with skill tags.
- **Action bar:** Find the smallest fix, Load preset, Reset, Download new roster (CSV), Download roster image (PNG), Copy as text.
- **Result area** below or beside the board: the numbered explanation list, or the alert panel for uncovered posts.
- **Helper editor:** add a helper, tick skills, set the current post.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.
- A printed duty board: cream card-stock background; pegboard columns with dotted rules; helper cards like paper tags with a punched hole.
- Signal-red accent for empty posts and absences; forest-green for covered posts.
- System fonts; no emoji; no external assets.
- Calm and legible under stress: large type for names and posts, little decoration beyond the board itself.

## Features and Behavior

### The board
- Posts are fixed: Reception, Guide, Stage, Kitchen, First aid. Each needs exactly 1 person.
- A helper is either at a post or Floating. Each helper has skill checkboxes (which posts they can cover).
- A post with nobody present is shown red; a covered post is shown green.

### Marking absence
- Clicking a card toggles absent. An absent card is greyed out with an "Absent" label and is never assigned.

### Finding the smallest fix
- Pressing **Find the smallest fix** finds the roster that covers every post and changes the fewest helpers' posts.
- Ties are broken by using fewer Floating helpers, then by name order, so the same input always gives the same answer.
- The result is shown as numbered moves, each with a plain-words reason (for example "Ken moves from Guide to Reception because Haru is absent and Ken can do Reception"). Reasons are ordered by dependency, so each move follows from the one before.
- If not every post can be covered, an alert panel names each uncovered post and gives the reason (for example "First aid cannot be covered: Aiko is absent and nobody else has the First aid skill"). It also shows the best partial plan, which covers as many posts as possible with the fewest moves.

### Editing helpers
- Add a helper with a name, skills, and current post (or Floating); change the skills or post of an existing helper.
- Duplicate names are refused with a short message.
- Up to 10 helpers.

### Presets and reset
- **Load preset** loads "School festival" (7 helpers). The preset must reproduce the two examples in `scope.md > What "Working" Looks Like`.
- **Reset** clears the absences and any applied fix, returning to the starting roster.

### Exports
- **Download new roster (CSV)**: one row per helper with name, post, and status.
- **Download roster image (PNG)**: an image of the board.
- **Copy as text**: the roster as plain text for pasting into a chat.

- As a volunteer coordinator, I want the smallest fix so that I disturb as few helpers as possible.
  - [ ] With the preset and Haru absent, the result is exactly 2 moves: Ken Guide → Reception, Mina Floating → Guide.
  - [ ] Every move has a reason in plain words, in dependency order.
- As a coordinator, I want to be told honestly when a post can't be covered.
  - [ ] With the preset and Aiko absent, the alert says First aid cannot be covered and why, and shows the best partial plan.
- As a coordinator, I want to take the new roster away.
  - [ ] CSV downloads, PNG downloads, and Copy as text puts the roster on the clipboard.

## States and Boundaries
- **First use** — the preset is loaded and nobody is absent.
- **Nobody absent** — pressing the button shows "Everyone is here - nothing to fix".
- **Fix found** — numbered badges, the explanation list, and the export buttons enabled.
- **Cannot be fully covered** — the alert panel plus the best partial plan.
- **All helpers absent** — every post is shown uncovered.
- **Duplicate name** — refused with a message; nothing is added.
- **Persistence** — nothing is saved between visits and nothing leaves the browser; export is the only way to keep a roster.

## Product Decisions
All [AI-provisional], made by the relay assistant on the learner's instruction; the learner will confirm.
- Minimum number of changed posts is the goal, not fairness or preferences — this is the kernel.
- One person per post and one time slot — keeps the proof of concept demonstrable in a minute.
- Exports in the browser, no server — no accounts and no data leaves the page.
- Duty-board look — it makes the roster feel familiar to a coordinator.

## What We're Building
Everything above: the board, absence toggling, the smallest-fix search with explanations and the honest "cannot be covered" panel, helper editing, preset and reset, and the three exports.

## Deferred From the POC
- Multiple time slots — one slot proves the kernel.
- Messaging helpers — would need a server or accounts.
- Saving rosters between visits — would need storage or accounts; export covers it.

## Possible Later Enhancements
- More than one person per post.
- Preferences or fairness scoring.
- Several absences with a suggested priority of posts.

## Non-Goals
- No accounts, no server, no real staff data.
- No preference or fairness scoring, which would blur the "smallest change" idea.

## Open Questions
- The exact names, skills, and starting posts of the 7 preset helpers are to be fixed at build so that both examples in `scope.md` come out as described. Needed for `5-build`; not needed for `4-spec`.
- The learner's confirmation of every [AI-provisional] decision. The learner will give it in one batch after the docs are written.
