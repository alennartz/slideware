---
name: deck-storyboard
description: "Sequences the selected deck structure into numbered slides with timing, section breaks, and a class-appropriate close. Step 5 of new-deck."
disable-model-invocation: true
---

# Deck Storyboard

Sketch the sequence before building any slide.

Dialog rules: `../new-deck/CONVENTIONS.md`.

Input: `decks/<slug>/source/purpose.md`, `audience.md`, and `structure.md`. Output: `decks/<slug>/source/storyboard.md`. Read the guide named by `Class` at `../deck-structure/classes/<class>.md` for its opening, section order, and close.

## Steps

1. **Time budget and pace.** Use the brief and `purpose.md` to determine delivery mode and available time. For a live talk, subtract known question time from the total slot; for a reading deck, use the target reading time when supplied. Mark missing facts `unknown` and choose a pace suited to the brief.
   - Completion: delivery mode, timing fields, and pace recorded.

2. **Opening and sequence.** Choose an opening suited to the audience and the selected class guide. Start with a title slide using the deck title. Turn the content sections in `source/structure.md` into slides, preserving the guide's dependencies. Evidence is supporting material, not a required standalone slide. Apply `deck-slide-rules` to the headlines.
   - Completion: ordered title and content headlines drafted; every used content section is represented.

3. **One idea per slide.** Check each content headline against `deck-slide-rules`. Split independent claims.
   - Completion: every content slide carries one idea.

4. **Sections, close, and timing.** Add dividers or a closing slide when they serve the deck. Number every slide consecutively from 1. Estimate minutes per slide when a time budget applies; check the sum against that budget and revise if needed.
   - Completion: a numbered sequence and applicable timing estimates recorded; any unresolved timing mismatch noted.

5. **Write the artifact.** Write `source/storyboard.md` with:
   - **Timing:** delivery mode, pace, live slot/question/presentation minutes or target reading minutes, and any timing mismatch.
   - **Slides:** a numbered list with number, kind (`title`, `content`, `divider`, `closing`), section, headline, one idea, and estimated minutes or `not applicable`.
   - Completion: file written.

## Rules

- Shape the sequence as `deck-storyline` describes.
