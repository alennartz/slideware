---
name: deck-content
description: "Writes each storyboard slide into the deck with its evidence, visual, wording, and notes, and previews it live. Step 6 of new-deck."
disable-model-invocation: true
---

# Deck Content

Build the deck from the storyboard in batches. Use the live preview for checks and user feedback without waiting for slide-by-slide approval.

Dialog rules: `../new-deck/CONVENTIONS.md`.
Markup: `deck-markup`. Slide rules: `deck-slide-rules`. Preview commands: `deck-tooling`.

Input: `decks/<slug>/source/storyboard.md`, `decks/<slug>/source/structure.md`, `decks/<slug>/source/purpose.md`, and `decks/<slug>/source/audience.md`. Output: `decks/<slug>/source/slides.html`. Evidence updates and gaps stay recorded in `decks/<slug>/source/structure.md`.

If authoring changes a headline or sequence, update `source/storyboard.md` and affected markers as part of the change.

## Steps

1. **Title and preview.** Draft storyboard slide 1 as the title card, using a byline only if supplied. Write it to `decks/<slug>/source/slides.html`. Start the preview as `deck-tooling` describes and give the user its URL; open it in their browser if requested.
   - Completion: title slide written and preview running.

2. **Draft the slides.** Write the remaining storyboard slides in batches, in order, using `deck-markup` and `deck-slide-rules`. Choose the visual each slide needs: chart, table, diagram, quote, image, text only, or none. Apply `deck-images` to image sourcing and preparation. For Mermaid, follow [deck-markup/diagrams.md](../deck-markup/diagrams.md).
   - Completion: every storyboard slide is written at its position with its marker.

3. **Evidence and notes.** Carry factual claims and sources from `source/structure.md`; record new claims, sources, and remaining gaps in its Evidence section. Title and divider labels need no source. Use the user's deck-wide preference for speaker notes; if none was given, omit optional speaking notes.
   - Completion: every factual claim has a source or recorded `gap`; requested notes are present.

4. **Check.** Check that slide count, order, variants, and marker numbers/headlines match the full storyboard. Check Mermaid readiness and on-slide rendering in the live preview as `deck-markup/diagrams.md` describes.
   - Completion: slides and markers match, and any Mermaid diagrams are ready and visually checked.
