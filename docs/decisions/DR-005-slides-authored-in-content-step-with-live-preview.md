# DR-005: Slides are written in the content step, previewed live

## Status
Accepted

## Context
DR-003 set the design flow as markdown artifacts, from purpose to review. The owner then said that deck building is iterative, and that results should build up visibly while the presenter talks the deck through. A single build at the end is too late for that. The owner also said HTML is premature before the content is settled: a visual preview of headlines would show layout, not the message.

A live preview needs a server, because a browser does not reload a `file://` page on change. The owner accepts a dev-time dependency only if it is not needed to present or share the deck.

## Decision
- Steps 2–5 (purpose, audience, argument, storyboard) stay markdown only. No HTML is written.
- Step 6 (content) writes slides into `decks/<slug>/source/slides.html` as each slide is approved. The content skill writes the title slide first, then starts the dev server, so the deck builds up in a browser while the owner talks it through. The server needs `source/slides.html` to exist, so the title slide comes first.
- The dev server is `preview/dev.mjs`. It has zero dependencies. It rebuilds on each save of `source/slides.html`, and the open page reloads itself. It keeps serving the last good build when a save fails.
- The reload hook exists only in dev output. `output/<slug>.html` for presenting or sharing is unchanged, with no server and no hook.
- Step 7 (review) previews the full deck. The build of `output/<slug>.html` runs after review passes.

## Consequences
- The content step gains a running process and a browser tab. Those are design-time costs only.
- The dev server reloads the whole page. The engine keeps the current slide across reloads, so the presenter's place survives a save.
- Storyboard headlines are not previewed. The owner accepted this.
- DR-003 step 6 changes from "write content.md" to "write slides, and content.md as the record". DR-003's sequence otherwise stands.
