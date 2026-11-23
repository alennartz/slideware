# Pure self-contained HTML slide stack: options and tradeoffs

Status: research proposal. No code written. Sources fetched 2026 from primary repos and docs where noted. Unverified claims are marked.

## Target

A slide deck is one `.html` file. It opens from disk with no network, no install, no build step for the viewer. It presents full-screen, has a presenter view, and prints to one PDF page per slide.

## Option A: Single-file engine, deckfile-style

One `index.html` holds slides, engine, and theme. Inline CSS and JS only.

How it works:
- Slides are `<section>` markup in the body. Engine is a `<script data-deck="engine">` block at the end.
- 1920×1080 canvas, scaled to viewport.
- Presenter view is the same file opened with `?presenter`. Windows sync via `postMessage`, which also works over `file://`.
- Print stylesheet gives one PDF page per slide.
- Edit view changes text and order in the browser and saves back to the file.

Evidence: `roaldnefs/deckfile` (MIT) describes exactly this. About 1,700 lines of JS and 50 of CSS. No build step, no dependencies.

Tradeoffs:
- Pro: strictest fit to the goal. Zero dependencies, the file is the artifact, easy for agents to edit.
- Pro: the engine is small enough to read and own.
- Con: you own every feature. Auto-animate, math, and code highlighting are yours to build or skip.
- Con: the edit view writes the file back, so you need a clear rule for who edits what (human vs agent).

## Option B: Reveal.js, vendored and inlined

Use reveal.js (MIT) as the runtime. Inline its JS and CSS into one file with a build script, or ship a folder.

How it works:
- Basic setup needs no build and no dependencies (verified, revealjs.com/installation).
- Installs from npm as ES modules, with plugins (`reveal.js/plugin/markdown`, etc.).
- Features: nested slides, Markdown, Auto-Animate, PDF export, speaker notes, LaTeX, syntax highlighting, extensive API (verified, GitHub README).

Evidence: the README and installation page. Verified.

Tradeoffs:
- Pro: most mature feature set. Auto-animate and PDF export are already solved.
- Pro: large community. Stable API.
- Con: not a single file by default. Inlining is your build step, and it adds a build dependency to the project.
- Con: external Markdown loading needs a web server (verified). Inline Markdown avoids this.
- Con: the bundle is large. Its size is unverified here.

## Option C: Marp as a source-to-HTML pipeline

Write Markdown. Marp exports standalone HTML, PDF, or PPTX (verified, marp.app). Built on Marpit (MIT).

Tradeoffs:
- Pro: best for text-first decks. The source is also a readable document. Good for agents.
- Pro: PDF and PPTX export are built in.
- Con: no in-slide animation (per secondary sources; not checked against Marp docs).
- Con: export runs through Chrome/Chromium (verified).
- Con: a converter, not a runtime. Presenter view and interactivity are limited.

Best as an authoring front end feeding Option A or B, not as the runtime.

## Option D (not recommended): Slidev

Vue and Vite. Slidev is Markdown-based, with Vite HMR and a Vue component model (verified, sli.dev and its GitHub README).

Excluded for this goal. Slidev is a dev server and Vue app. It does not produce one self-contained HTML file. Secondary sources say it builds a Vue SPA. Fails the "pure self-contained" constraint.

## Adjacent patterns

- **Agent skills that emit single files.** `zarazhangrui/frontend-slides` and `bluedusk/html-slides` (both MIT) generate single-file decks. Both advertise zero dependencies. However, `html-slides` loads Chart.js for chart components (verified in README), so its output is not dependency-free when charts are used. Treat these as prior art, not as the runtime.
- **Web Components / Lit.** Lit components are standard custom elements (verified, lit.dev). They suit reusable slide primitives, but need a bundle step to inline. Adds weight for little gain here. License not verified in this pass.
- **Animation libraries.** GSAP is not simply "free for all uses." Its Standard License (gsap.com) restricts use in tools that compete with Webflow's visual animation builder (verified). For a personal slide stack this is almost certainly fine, but it is a correction to my earlier claim. Motion is a lighter alternative; not evaluated in depth here.

## Comparison

| Criterion | A: Single-file engine | B: Vendored reveal.js | C: Marp (authoring) | D: Slidev |
|---|---|---|---|---|
| One file, no network | Yes | Yes, after inlining | Yes (HTML export) | No |
| Build step for viewer | None | None to view; inline script to ship | Conversion step | Dev/build step |
| Dependencies | None | reveal.js (MIT) | Marp CLI, Chromium | Node, Vite, Vue |
| Auto-animate, nested slides | Build yourself | Built in | No | Via Vue |
| Presenter view | Built in (deckfile) | Built in | No | Built in |
| Print to PDF | Built in (deckfile) | Built in | Built in | Built in |
| Agent editability | Excellent | Good | Excellent | Good |
| Owned code size | Small, readable | Large, third-party | Small | Large |

## Recommendation

Run a two-layer stack:

1. **Runtime: Option A**, starting from deckfile's engine (MIT). It meets the goal exactly: one file, no dependencies, presenter view, PDF.
2. **Escape hatch: Option B**, reveal.js, for any deck that needs Auto-Animate or heavy math. Inline it through a build script when needed.
3. **Optional authoring: Option C**, Marp, for text-first decks that should stay as Markdown.

Skip Slidev and Spectacle for this goal.

## Decision (confirmed)

- **Core engine: Option A.** One file per deck. Engine, theme, and slides inline. No runtime dependencies.
- **Authorship: the agent writes everything.** The human does not edit files. Source of truth is the deck HTML plus shared assets in this repo.
- **Optional libraries: reused, inlined at build time.** Chart.js (MIT, verified) and Tabulator (MIT, confirm in vendored LICENSE). Included only in decks that use them.
- **Reveal.js** is a fallback only, for Auto-Animate or math.
- **Build cost.** The engine is the largest piece. deckfile's engine is about 1,700 lines of JS. We own tests for scaling, presenter sync, print, and keyboard handling.

## Theming

- Theme = CSS custom properties in one `:root` block: colours, three font stacks (display, body, mono), logo slots.
- Three inline CSS layers: fixed engine CSS (no colours), theme block (tokens and shared component styles), deck block (per-deck overrides).
- Shared theme library lives in this repo. The build script inlines the chosen theme.
- Chart.js and Tabulator read colours from the tokens at init.
- Print uses a separate light stylesheet. Dark is a second token set, not a toggle.
- **Fonts: embed SIL OFL faces as base64.** Identical look offline on every machine. Accepted size cost per face.

## Open decisions for the user

1. Should slides be authored as raw HTML, as Markdown (Marp-style), or both?
2. Is Auto-Animate or heavy animation a hard requirement? If yes, weight B above A.
3. Is in-browser editing (deckfile's edit view) wanted, or should agents edit source only?

## Sources

- github.com/hakimel/reveal.js (README, MIT)
- revealjs.com/installation/
- github.com/roaldnefs/deckfile (README, MIT)
- github.com/bluedusk/html-slides (README, MIT)
- github.com/thisismairaj/html-slide-deck
- github.com/zarazhangrui/frontend-slides (MIT)
- marp.app
- sli.dev/guide/why; github.com/slidevjs/slidev
- gsap.com/community/standard-license/
- lit.dev
