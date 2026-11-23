## Vision

This project is a slide deck factory. The slides are built on an opinionated stack (html, js, css) and created through a collaborative skill driven workflow. Modularity, Re-use and Simplicity are the core principles of it's design.

## Important Files

- [Codemap](codemap.md) Read the codemap before exploring or altering any of the code
- See [glossary.md](./glossary.md) for the project's domain language — use its terms in code, docs, and conversation.
- [Makefile](Makefile) The common commands for working with the deck building engine. run `make help` for details

## Local customizations

- Decks and private working material live under ignored `decks/`; don't inspect or stage them unless the user asks.
- Checkout-specific instructions may live in ignored `.local/AGENTS.md`. Read it when present; never commit `.local/`.
- Add skills under `.agents/skills/local/`, Pi extensions under `.pi/extensions/local/`, and themes as `.local/themes/<name>.css`. These paths survive upstream updates.
- Treat files outside these paths as upstream-managed. Prefer these extension points over editing core files.
- Run `make addons` to discover configured external capabilities before using them. Add-on commands run only when explicitly invoked.
