---
name: new-deck
description: "Starts a new slide deck and drives it from purpose to a published HTML deck. Use only for a new deck, never to revise one."
disable-model-invocation: true
---

# New Deck

Entry point for a new deck. The user starts it; the flow carries the brief from purpose to review without waiting for approval at each step. Changes to a finished deck happen outside this flow.

Dialog rules for all steps: `CONVENTIONS.md` in this folder.

## Invocation Contract

- When resuming an unfinished deck with `source/argument.md` but no `source/structure.md`, rename it to `source/structure.md` before checking prerequisites. If both exist, use `source/structure.md` without overwriting either file.
- Start with Name the deck unless the user names a step from the table. For a named step, identify the unfinished deck and check its input artifacts first. Create missing prerequisites from the brief and available context before continuing. Revisions to a finished deck stay outside this flow.
- Advance when the current step's actions and completion criteria are satisfied. Ask only for a decision that blocks useful work or requires consent.
- Finish after review, build, and preview shutdown. Report a final pass or a not-ready draft with its unresolved findings.

## Artifacts

Each deck lives in `decks/<slug>/`, with editable materials in `source/` and published files in `output/`. Each step has one primary artifact; later evidence updates may also change `decks/<slug>/source/structure.md`:

| Step | Skill | Artifact |
|---|---|---|
| 2 | deck-purpose | `decks/<slug>/source/purpose.md` |
| 3 | deck-audience | `decks/<slug>/source/audience.md` |
| 4 | deck-structure | `decks/<slug>/source/structure.md` |
| 5 | deck-storyboard | `decks/<slug>/source/storyboard.md` |
| 6 | deck-content | `decks/<slug>/source/slides.html` |
| 7 | deck-review | `decks/<slug>/source/review.md` |

Step skills are hidden from automatic discovery. When a step begins, read `../<skill-name>/SKILL.md` relative to this folder, using the exact skill name in the table. Read `CONVENTIONS.md` before the first dialog.

## Flow

### Name the deck (step 1)

Use the supplied title or derive a short one from the brief. If the subject is not clear enough to name the deck, ask for it. Derive a kebab-case slug; if `decks/<slug>/` already exists, append `-2`, `-3`, and so on until the folder name is free.

Create the deck folder with `source/` and `output/` subfolders before authoring begins.

Completion: a title and `<slug>`, with the deck workspace and its `source/` and `output/` subfolders created.

### Run steps 2–7

Read each step's `SKILL.md` when it begins and follow it. Start with deck-purpose, or the named step after its prerequisites are checked.

Completion: all step actions finished and the artifact written. Move to the next step in the table.

### Finish

When deck-review finishes, act on its final verdict:
- **Pass:** report `decks/<slug>/output/<slug>.html` and any consequential assumptions.
- **Not ready:** report the named changes and the step each belongs to. If the build succeeded, identify `decks/<slug>/output/<slug>.html` as a draft, not a final pass; otherwise report the build failure. Revisions happen outside this flow.

Completion: the final verdict is reported and the flow stops.

## Rules

- Run the steps in table order, updating earlier artifacts if later work changes them.
- Read each step's skill when its phase begins, not at the start of the flow.
- The structure step identifies the deck's class from the purpose and audience; do not ask the user about classes by name.
