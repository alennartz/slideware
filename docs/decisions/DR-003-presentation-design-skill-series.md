# DR-003: Guide deck creation through a series of presentation-design skills

## Status
Accepted

The interaction and build gates described here are historical. Current workflow rules live in `.agents/skills/new-deck/` and `.agents/skills/deck-review/`.

## Context
Decks are made by an agent for a user. The hard part is not the HTML. It is deciding what the presentation must achieve, for whom, and in what order. Without a fixed process, the agent jumps to slides. The result is topic dumps with no through-line and no clear outcome.

Research on presentation design converges on a few points:
- Start from the desired outcome: what the audience should do, believe, or know afterwards (Podium Consulting; Communispond; Ethos3).
- Lead with the answer, then support it (Minto's Pyramid Principle).
- Frame the story as tension and resolution: "what is" against "what could be" (Duarte, *Resonate*).
- Storyboard the sequence before building slides (Atkinson, *Beyond Bullet Points*).
- One idea per slide (Reynolds, *Presentation Zen*).
- Agree the problem with the decision maker before building (Eklund).

A single skill would cover too much and invite premature completion. A series lets each step finish on a checkable artifact.

## Decision
Deck creation runs as seven skills in `.agents/skills/`, in order:

1. **new-deck**: entry point. Identifies new deck or revision, then starts the right step.
2. **deck-purpose**: outcome. Ends when the user confirms one sentence: what the audience will do, believe, or know afterwards.
3. **deck-audience**: who attends, what they already believe, objections, decision power. Ends with a short audience profile.
4. **deck-argument**: through-line. Answer first, three supporting points, and the tension behind them. Ends with a one-page argument.
5. **deck-storyboard**: sequence, one idea per slide, time budget, section breaks, closing call to action. Ends with a headline list.
6. **deck-content**: evidence, visual, and cuts per slide. Ends with a content file ready to build.
7. **deck-review**: cold-read audit. Ends when the takeaway can be stated in one sentence and every slide serves the purpose.

Steps 2–5 are the brainstorm stage. Each step is a dialog, one question at a time, using `ask_user` for choices. Each step writes its artifact to `decks/<slug>/source/`. Later steps read earlier artifacts. The build (see DR-001, DR-002) starts only after step 7 passes.

## Consequences
- Each step has a checkable completion criterion. Premature completion is less likely.
- Invocation (amended): the user starts the series with `new-deck`, the only entry point. All seven skills are user-invoked (`disable-model-invocation: true`), so none adds context load. The router reads each step by path and advances on its own when an artifact is confirmed. It stops at a passing review or at a decision only the user can make. This follows the autoflow pattern in the my-pi package. The original model-invoked router was reversed. The repo is not under git, so no supersession hash exists to record.
- Artifacts in `decks/<slug>/source/` make the process auditable. The flow does not resume a partial deck.
- The series covers design of the message only. Technical build concerns stay in DR-001 and DR-002.
- Research sources are secondary (blog posts, summaries of books). Verify the specific techniques before relying on them in a skill body.

## Amendment: the entry point is for new decks only

`new-deck` (formerly `deck-router`) starts new decks only. It has no resume path. Changes to a finished deck happen in ad hoc sessions, which reuse the guidance skills (`deck-markup`, `deck-slide-rules`, `deck-storyline`, `deck-tooling`). A not-ready review verdict stops the flow and reports the changes.
