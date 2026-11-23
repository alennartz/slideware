---
name: deck-structure
description: "Identifies the deck's class, then builds its structure from that class's guide: the sections, their order, and their evidence. Step 4 of new-deck."
disable-model-invocation: true
---

# Deck Structure

Find the deck's class, then build its structure. Each class has its own sections.

Dialog rules: `../new-deck/CONVENTIONS.md`.

Principles: `deck-storyline`. Input: `decks/<slug>/source/purpose.md` and `decks/<slug>/source/audience.md`. Output: `decks/<slug>/source/structure.md`, whatever the class.

## Steps

1. **Class.** Decide the deck's class from the outcome in `source/purpose.md` and the room in `source/audience.md`:
   - **Persuade:** the audience must choose a proposed action, approve, or change a belief.
   - **Inform:** the audience must understand something or learn how to do it. The subtype is define, describe, explain, or demonstrate.
   - **Review:** the audience must learn from something that already happened.
   - **Celebrate:** the audience must share a meaning: honour, inspire, or mark an occasion.

   Choose the best fit from the brief; record a consequential assumption if the fit is uncertain. Record `Class: <name>` as the first line of `source/structure.md`, using lowercase `persuade`, `inform`, `review`, or `celebrate`; the inform guide records the subtype in its own section.
   - Completion: class chosen.

2. **Load the class guide.** Read only `classes/<class>.md` in this folder. Do not read the other guides. The guide names the sections, their order, and what each needs.
   - Completion: guide read.

3. **Build each section.** Follow the guide's section order. Draft `source/structure.md` from the brief and available material. Each claim is a full sentence, not a topic label. Record non-applicable sections as `not used`.
   - Completion: applicable sections drafted and omissions recorded.

4. **Mark the evidence.** Use supplied or verified sources where available. In one Evidence section, map each factual claim to `evidenced` with its source, or `gap`. Labels and desired outcomes need no source. Never invent a source or present an unsupported hypothesis as fact.
   - Completion: every factual claim has an evidence entry, and every gap is listed.

5. **Write the artifact.** Write `source/structure.md`: the Class line, then the guide's sections in its order, then Evidence. Record consequential assumptions.
   - Completion: file written.

## Rules

- Each claim carries one idea. Split independent claims, not a single comparison or relationship.
- The class is a working decision for this step; describe the deck to the user in terms of what the audience will do.
