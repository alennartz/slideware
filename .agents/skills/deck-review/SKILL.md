---
name: deck-review
description: "Audits the finished content against the purpose with a cold read: takeaway, slide roles, gaps, and pacing. Step 7 of new-deck."
disable-model-invocation: true
---

# Deck Review

Test the deck against its purpose before the final build.

Dialog rules: `../new-deck/CONVENTIONS.md`.

Input: `decks/<slug>/source/slides.html` (the slides under review), `source/purpose.md` (the outcome), `source/structure.md` (the gaps), and `source/storyboard.md` (the time budget). Output: `decks/<slug>/source/review.md`.

## Steps

1. **Cold read.** Read the slides from the audience's perspective and state the takeaway in one sentence. Compare it with the primary outcome in `source/purpose.md`. This is an author-side assessment, not a substitute for testing with the audience.
   - Completion: takeaway recorded, and match or mismatch noted.

2. **Slide purpose.** Assess each slide against the primary outcome and `source/structure.md`. Mark it `serves`, `cut`, or `accepted` with a reason for retaining it despite the finding. Use `accepted` only when the user explicitly accepted the finding. A `cut` names deck-content as the required change step.
   - Completion: every slide has a disposition; every required cut has a named change.

3. **Gap check.** Check every `gap` in `source/structure.md` and any unsourced factual claims in `source/slides.html`. A gap is resolved only when the source is recorded in `source/structure.md` and carried into the affected slide. Record a gap as accepted only when the user explicitly accepted it with a reason; otherwise name the required fix.
   - Completion: every gap is resolved, explicitly accepted with a reason, or assigned a required change to deck-structure or deck-content.

4. **Pacing.** Compare actual slide count/order with `source/storyboard.md` and sum its estimated slide times against any supplied budget. When the budget is unknown, assess density and order and record time fit as `unknown`, not `fits`. A known mismatch is a finding to fix or explicitly accept.
   - Completion: density and order assessed; time fit recorded as `fits`, `unknown`, explicitly `accepted` with a reason, or a required deck-storyboard/deck-content change.

5. **Verdict and artifact.** Apply the content checks in the pass rule below. Record a provisional pass or not-ready verdict; a provisional pass awaits the build result. Name every required change and its step. Write `source/review.md` with: Takeaway, Slide marks, Gaps, Pacing, Verdict, Build. Mark Build `not run` initially.
   - Completion: provisional verdict, all required changes, and the review artifact recorded.

6. **Build.** Build as `deck-tooling` describes on either verdict. For Mermaid decks, review the built file in the browser using [deck-markup/diagrams.md](../deck-markup/diagrams.md), including readiness, labels, clipping, and print layout. Record the build result, warnings, and diagram review in `source/review.md`. A build or diagram failure changes the verdict to not ready and names the required fix. If content findings remain but the build succeeds, label `output/<slug>.html` a draft in `source/review.md` and the user-facing report; never present it as a final pass.
   - Completion: build and any diagram review results recorded; pass requires `decks/<slug>/output/<slug>.html`, a successful build exit, and passing Mermaid browser checks where used.

7. **Stop the preview.** Stop this deck's preview safely as `deck-tooling` describes, on either verdict. Report the verdict, output path if the build succeeded, consequential assumptions, and outstanding findings to the user.
   - Completion: no preview process for this repo and slug is running, and the final status is reported.

## Rules

- A mismatch in the cold read names deck-purpose or deck-structure as the step the change belongs to. Record it in the verdict.
- Pass requires the takeaway to match the primary outcome, every slide/gap/known pacing finding to be resolved or explicitly accepted with a reason, and no required change left open. An unavailable time budget may remain `unknown`; report that timing was not verified. The final pass also requires a successful build and, for Mermaid decks, passing browser diagram checks.
