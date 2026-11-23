---
name: deck-purpose
description: "Fixes a deck's outcome: what the audience will do, believe, or know afterwards. Step 2 of new-deck."
disable-model-invocation: true
---

# Deck Purpose

Start with the end in mind. Settle the outcome before any audience, structure, or slide.

Dialog rules: `../new-deck/CONVENTIONS.md`. Principles: `deck-storyline`.

Input: the brief, title, and slug from new-deck; identify the deck if invoked directly. Output: `decks/<slug>/source/purpose.md`.

## Steps

1. **Setting.** Record the title, slug, delivery mode, and date from the brief. Mark unavailable details `unknown`.
   - Completion: title, slug, delivery mode, and date recorded.

2. **Outcome.** Draft one sentence in the form "After this, [audience] will [verb] [object]." Choose one primary outcome and record any secondary outcomes. Use the brief; ask only if the intended outcome cannot be determined well enough to shape the deck.
   - Completion: one primary outcome named.

3. **Success and problem.** Record an observable success signal and the obstacle to the outcome when available. Mark unavailable information `unknown`, or record `none` if the brief establishes that no obstacle applies.
   - Completion: success signal and problem recorded.

4. **Write the artifact.** Write `purpose.md` with four sections: Setting, Outcome (primary and secondary), Success signal, Problem. Identify consequential assumptions.
   - Completion: file written.

## Rules

- Leave the audience's background to deck-audience.
