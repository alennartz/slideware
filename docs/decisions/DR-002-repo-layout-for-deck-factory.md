# DR-002: Repository layout for the deck factory

## Status
Accepted

## Context
This folder is a factory: an agent produces many decks from a repeatable process. DR-001 fixed the runtime (deckfile's engine, used as-is) and the output (one HTML file per deck). The layout must let the agent find each part without searching, keep the engine shared rather than rewritten per deck, and carry the process with the repo so it is not tied to one user profile.

Pi discovers project skills in `.pi/skills/` (`docs/configuration.md`) and in `.agents/skills/` from the working directory up to the repo root (`docs/skills.md`). `.agents/skills/` is the Agent Skills location, so other harnesses can read it too.

## Decision
```
slideware/
  AGENTS.md            project vision and rules
  docs/decisions/      decision records
  engine/              deckfile engine, used as-is, with its MIT notice
  libs/                vendored Chart.js and Tabulator, min builds
  build/               Node script: deck source + engine + libs -> one .html
  decks/<slug>/        one folder per deck, with source/ and output/
  .agents/skills/      factory skills, discovered by pi and other harnesses
```

- The engine is shared source. The build copies it into each deck. Engine fixes apply on rebuild.
- Each deck's `source/` holds its editable materials. `output/` holds the slug-named, built `.html` and exported files.
- Libraries are vendored once. The build inlines only the libraries a deck uses.
- Factory skills live in `.agents/skills/`, not in `.pi/skills/`, for harness compatibility.

## Consequences
- Every deck build depends on `build/`. A broken build script breaks every deck. Keep it small and tested.
- Each built deck is a full copy of the engine. Repo size grows with deck count. Acceptable for single-file output.
- Skills in `.agents/skills/` load for any project-scoped session under this root. Review them before trusting the project.
- Reconsider this layout if decks need shared assets beyond the engine and libraries, such as a theme library. A theme directory would then join the top level.

## Amendment: one directory per module

The layout above grew a `preview/` directory for the live server. The libraries' page glue (`libs-init.js`, `libs.css`) moved from `build/` to `libs/`, and the dev server moved from `build/` to `preview/`. Each module now owns one directory, so the codemap can map each to a single glob. Module boundaries follow `codemap.md`.
