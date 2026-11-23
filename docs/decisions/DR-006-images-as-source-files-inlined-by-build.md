# DR-006: Images are source files in the deck folder, inlined by the build

## Status
Accepted

## Context
Decks must stay single files (DR-001, DR-004). deckfile's component reference says images are separate files beside `index.html` and must never be base64-encoded, because of single-file decks. That rule suits a hand-edited deck. Here the agent writes the source, so separate image files are easier to add, replace, and check than base64 text inside slide markup. The owner wants the source to keep image files and the build to inline them. Where images come from (generation, search, upload) is a later decision.

## Decision
- Images live in `decks/<slug>/source/assets/` as ordinary files. Slides reference them by relative path: `<img src="assets/photo.jpg" alt="…">`.
- The build inlines each referenced image as a data URI in `output/<slug>.html`, so the published file stays self-contained.
- Use `<img>` for photos and screenshots, not CSS `background-image`. This keeps print reliable (deckfile's reason still applies).
- Sourcing is deferred. No image generation, search, or upload step exists yet.

## Consequences
- The build inlines image references and fails on missing files (`build/images.mjs`).
- Inlined images enlarge the published HTML file. Large photos should be resized before they go in. A size warning is planned.
- deckfile's image guidance is overridden for this factory. `components.md` gets a note saying so.
- The preview uses the same inlining, and reloads when an image changes, so it matches the shipped deck.
