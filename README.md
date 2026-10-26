# Shift Shock

Shift Shock is a same-day shift fixer. When a helper at a small volunteer event is absent, it finds the smallest reshuffle that keeps every post covered and explains each move in plain words. It is for the volunteer coordinator of a small event (school festival, community meetup, charity booth) with about 6 to 10 helpers.

## Try it

- Live demo: https://driedsandwich.github.io/shift-shock/
- Locally: download the repository and open `index.html` in a modern desktop browser. No install, no build step.
- Tests: open `tests.html` in the browser. It prints "ALL PASS" when the checks succeed.
- Demo video: [VIDEO URL]

## What it does

- Loads a "School festival" preset of 7 helpers (made-up names) on a duty board with five posts: Reception, Guide, Stage, Kitchen and First aid, plus a Floating column for helpers without a fixed post. Each post needs one person.
- Click a helper card to mark that helper absent. The card turns grey and the post they held turns red.
- "Find the smallest fix" finds the roster that covers every post and changes the fewest helpers' posts. Moved cards get numbered badges, and a numbered list gives a plain-words reason for each move, ordered so each move follows from the one before.
- If a post cannot be covered, an alert panel names the post, gives the reason, and shows the best partial plan.
- The preset is designed to show both cases: one absence that is fixed with 2 moves, and the absence of the only First aid helper, which is reported as "cannot be covered".
- Add helpers, tick skills and set posts (up to 10 helpers; duplicate names are refused). Reset returns to the starting roster.
- Export the new roster as CSV, as a PNG image of the board, or copy it as text.

## How it works

Shift Shock is a static page that runs entirely in the browser: HTML, CSS and plain JavaScript, with no build step, no external libraries and no network calls.

- `index.html`, `style.css`: layout and the duty-board look.
- `app.js`: state, drawing the board, animation, editing and exports.
- `core.js`: the rules engine, plain logic with no screen code so it can be tested on its own.
- `tests.html`: browser assertions on `core.js`.

The engine tries every assignment of present helpers to posts (at most 10 helpers and 5 posts, so this is small). It keeps the best one in this order: fewest helpers whose post changes, then fewest Floating helpers used, then name order. The order is fixed, so the same input always gives the same answer. If no assignment covers every post, it picks the one that covers the most posts by the same order. Each move gets a sentence of the form "X moves from A to B because ...".

## Limits

- One time slot and one person per post. A larger event would need a smarter method than exhaustive search.
- Cut from the proof of concept: multi-slot schedules, messaging helpers, accounts and saving to a server, preference or fairness scoring, and real staff data (the preset uses made-up names).
- Nothing is saved between visits. Reloading returns to the preset; CSV, PNG and text export are the only way to keep a roster. Nothing leaves the browser.

## How this was made

- The author is a Japanese speaker and not a software engineer. The idea was chosen by the author from nine candidates that another AI (OpenAI Codex) generated from the public hackathon brief.
- Planning: in Claude Code, the Devpost Learn Skill Pack's 1-start skill was run in the project folder, and `scope.md`, `prd.md` and `spec.md` were drafted from the Skill Pack's templates and instructions. Because of the deadline, the author asked the assistant to answer the product questions provisionally on the author's behalf. Those answers are marked [AI-provisional] in the documents and await the author's confirmation.
- Build: the code was written by OpenAI Codex, running on the author's own small home computer, from the spec. It was checked in a browser with the included `tests.html` before the demo was recorded.
- Planning documents: [devpost/scope.md](devpost/scope.md), [devpost/prd.md](devpost/prd.md), [devpost/spec.md](devpost/spec.md).
- Hosted on GitHub Pages. The demo video is a screen recording with English captions and no voice.

## License

MIT. See `LICENSE`.
