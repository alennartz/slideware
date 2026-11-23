# DR-001: Use deckfile's engine as-is for single-file decks

## Status
Accepted

## Context
Decks must open from disk, offline, as one HTML file. The agent authors all content, so the format must be simple for an agent to write and edit. Reuse of mature code saves effort, and future deck volume favours a repeatable factory over one-off builds.

Three candidate runtimes were reviewed:
- **reveal.js** (MIT): mature, but multi-file. Inlining is needed anyway for single-file output, and most of its surface would go unused.
- **Slidev**: builds a Vue SPA. Not a self-contained file.
- **Marp**: a Markdown-to-HTML converter. No presenter view or in-slide animation.

deckfile (MIT) ships exactly the target shape: one `index.html` with inline CSS and JS, about 1,700 lines of JS and 50 of CSS, no build step. It offers 1920×1080 scaling, builds, presenter view over `postMessage`, print-to-PDF with one page per slide, and an edit view.

## Decision
- The runtime is deckfile's engine, used as-is. Start from its `template.html`. Do not fork yet.
- Each deck is one self-contained HTML file. Engine, theme, and slides are inline.
- Optional libraries (Chart.js, Tabulator, both MIT) are inlined at build time, only into decks that use them.
- The only build step is a Node script in this repo that assembles decks and inlines optional libraries. The viewer needs no build.
- The agent authors deck HTML directly.
- Fork deckfile only when a required feature is missing or a change cannot be made through its public markup and tokens.

## Consequences
- We do not own the engine's code. We track its upstream by hand.
- Each deck carries its own copy of the engine. Engine fixes do not reach existing decks until they are re-assembled. The build script must treat the engine as a shared source.
- Fast start: no engine to write or test from scratch.
- Future engine features (for example Auto-Animate) are blocked until we fork or accept what deckfile provides.
- Reconsider this DR if deckfile goes unmaintained, if it conflicts with a required feature, or if we fork it.

Attribution: deckfile is MIT (github.com/roaldnefs/deckfile). Keep its license notice in every copied engine.
