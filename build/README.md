# Build

Assembles `decks/<slug>/output/<slug>.html` from `decks/<slug>/source/slides.html`. Node built-ins only.

```
node build/build.mjs                 # every deck
node build/build.mjs <slug> ...      # named decks
node --test build/test/build.test.mjs build/test/images.test.mjs preview/test/dev.test.mjs
```

Live preview (design time only; the published `output/<slug>.html` has no server and no hook):

```
node preview/dev.mjs <slug> [port]    # http://127.0.0.1:4321/ by default
```

The page reloads on each save of `source/slides.html`. A save that fails to build keeps the last good version on screen.

Browser smoke test: `make test-browser`, with `agent-browser` and its Chromium installed. It opens built fixtures over `file://` with networking disabled and checks diagram rendering, slide themes, hidden slides, authoring examples, malformed syntax, print readiness, and a five-page PDF. This is a dev-only check; the build and shipped deck need no browser tooling.

## What the build assembles

| Part | Source | Note |
|---|---|---|
| Engine CSS and JS | `engine/deck.css`, `engine/deck.js` | deckfile v0.2.0, as-is (`engine/VERSION.md`) |
| Theme | `themes/manifest.json`, `themes/`, `.local/themes/`, configured external add-ons | Built-ins come from the manifest; local and add-on themes are selected with the same header; selected CSS and local assets are inlined |
| Optional libraries | `libs/manifest.json` | declared libraries and their licence text inlined; licences appear as JS comments |
| Library glue | `libs/libs-init.js`, `libs/libs.css` | starts charts, tables, and diagrams; sizes them for slides |
| Page shell | `build/shell.html` | fixed structure, same engine blocks as deckfile's template |

## Slides fragment

`source/slides.html` holds `<section class="slide">` elements only. Optional header comments, first lines:

```html
<!-- title: My talk -->
<!-- theme: deckfile-default -->
<!-- libs: chart tabulator mermaid -->
```

Omit the theme comment to use `deckfile-default`. Built-in theme names come from `themes/manifest.json`. Add a checkout-local theme as `.local/themes/<name>.css`; external add-on themes are registered in the add-on manifest described in [Customization and updates](../docs/customization.md). CSS can reference local `assets/<file>` under its configured asset root; the build embeds those assets in each deck.

Charts: wrap a canvas in `.chart-box` (640 px tall) and give it a Chart.js config as JSON:

```html
<div class="chart-box"><canvas data-chart='{"type":"bar","data":{"labels":["A","B"],"datasets":[{"label":"x","data":[1,2]}]}}'></canvas></div>
```

Tables: a Tabulator options object as JSON:

```html
<div data-tabulator='{"columns":[{"title":"Name","field":"name"}],"data":[{"name":"one"}]}'></div>
```

Datasets without a colour take the theme's accent, ink, then muted tokens. Charts and tables redraw when their slide appears and before printing.

## Mermaid rendering

The optional `mermaid` key inlines the vendored `@mermaid-js/tiny` 12.3.0 plain-script bundle and its adapter. No CDN, runtime install, or build-time renderer is required. Diagram authoring and browser review are defined in [deck-markup/diagrams.md](../.agents/skills/deck-markup/diagrams.md).

The adapter resolves the containing slide's theme tokens into concrete colours, waits for fonts, then eagerly renders every diagram to SVG in an offscreen measurement container. This gives hidden slides usable layout without changing the engine. Diagram boxes default to 640 px tall and fill their available width.

During rendering, `#stage[data-diagrams]` and each `pre.mermaid[data-diagram-status]` report `pending`, then `ready` or `error`. Failures appear visibly with the slide identity and in the browser console. Build success does not validate Mermaid syntax or layout; final review must require browser readiness and inspect screen and print output. The deck's own print path waits for rendering to settle; browser-menu print must be opened after readiness.

## Images

Put image files in `decks/<slug>/source/assets/` and reference them from slides as `assets/<file>`, in `src` or `url()`. The build inlines each one as a data URI (DR-006). Supported: png, jpg, gif, webp, svg. A missing file fails the build. An image over 1 MB produces a warning: resize it first. The preview reloads when an image changes.

## Rules the build enforces

- Unknown library names fail the build.
- Slides may not contain the engine block or `<html`, `<head`, `<body>`.
- No asset may contain a closing `</script` or `</style`.
- Remote `src`, `href` or `url()` references in slides produce warnings.
- Image paths stay inside the deck folder, with a supported extension.

## Updating

- The engine is copied from deckfile, so `npx github:roaldnefs/deckfile update decks/<slug>/output/<slug>.html` also works on built decks. The build's engine blocks match deckfile's rule (`build/test` checks this).
- To change the engine, follow `engine/VERSION.md`, then rebuild.

## Known gaps

- Fonts are not embedded. The theme names Inter and JetBrains Mono, so decks fall back to system fonts without them. Embedding is part of theme work (DR-001, theming notes).
- The engine's edit view saves over the published HTML file. Edits made there do not flow back to `source/slides.html`. The factory owns the source, so do not use the edit view on factory decks.
