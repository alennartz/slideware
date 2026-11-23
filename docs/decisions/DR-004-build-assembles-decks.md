# DR-004: The build assembles each deck from the engine, theme, and libraries

## Status
Accepted

## Context
DR-001 chose deckfile's engine as-is. DR-002 placed the engine in `engine/` as shared source, with the build copying it into each deck. Decks are agent-authored, so the source must stay small, and built files must still open from disk with no network.

Two forces shaped the build:
- Copying deckfile's full template into every deck would duplicate the slide examples and theme. The agent would then edit a file that mixes source and boilerplate.
- deckfile's own `update` command rewrites the engine blocks in place. If built decks match that layout, the upstream tool keeps working on them.

## Decision
- `decks/<slug>/source/slides.html` is the slide-markup source a deck owns. It holds the slide markup and two header comments.
- `build/build.mjs` assembles `decks/<slug>/output/<slug>.html` from `build/shell.html`, the engine, the theme, and any optional libraries the deck declares.
- The shell reproduces deckfile's engine-block layout exactly, including the newline placement that `deckfile update` writes. A test checks that its update rule leaves a fresh build unchanged.
- Chart.js (MIT, 4.6.1) and Tabulator (MIT, 6.7.1) are vendored in `libs/` and inlined only when declared.
- The page glue (`libs/libs-init.js`, `libs/libs.css`) belongs to the factory, not to the libraries. It starts the libraries, takes colours from theme tokens, and sizes them for a 1920 px slide.
- Charts and tables redraw when their slide appears and before printing. Hidden slides measure zero.

## Consequences
- The build is the only place the page structure is defined. Changing the shell changes every deck on the next build.
- Built decks still carry a full copy of the engine, so each file is standalone. Repo size grows with deck count, as DR-002 accepted.
- Fonts are not yet embedded, so decks render in system fonts until theme work lands. Output is not final for distribution.
- The engine's edit view writes to the published HTML file. Factory decks treat `source/slides.html` as the source and rebuild to `output/<slug>.html`.
- Rejected: copying deckfile's template per deck. That mixes boilerplate with the source and breaks the single-source rule.
