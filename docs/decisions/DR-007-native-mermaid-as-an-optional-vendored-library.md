# DR-007: Native Mermaid as an optional vendored library

## Status
Accepted

## Context
Slides need process and relationship diagrams alongside Chart.js charts and Tabulator tables. Handwritten SVG offers precise placement but makes authors maintain coordinates as labels and connections change. Mermaid is familiar to AI authors and already appears in the codemap; its native syntax and automatic layout fit the existing markup workflow.

Decks must remain single-file and offline (DR-001, DR-004). The engine stays unchanged, and this addition must not introduce a build dependency, CLI, AI tool, or another skill. Hidden slides also need reliable layout before they are shown or printed.

## Decision
Use native Mermaid text as an optional `mermaid` library, with the vendored `@mermaid-js/tiny` 12.3.0 plain-script bundle and its licence. Authors put the text in `.diagram-box > pre.mermaid`; the adapter produces SVG using slide-local theme tokens. It waits for fonts and renders eagerly in an offscreen measurement container, rather than relying on a hidden slide's dimensions or rendering only on navigation. SVG scales with the slide and supports print.

Keep authoring and browser review in `deck-markup/diagrams.md`, initially teaching flowcharts and sequence diagrams. Reuse the content and review steps with small pointers. Native accessibility syntax and theme-aware flowchart classes avoid a separate metadata or styling language.

A new JSON diagram DSL would add translation and a second syntax to maintain without improving native layout. A CDN renderer would break offline delivery. Build-time SVG generation would add a renderer/browser dependency to the Node-built-ins build and move theme and font measurement away from the actual deck. Inline SVG remains available where exact placement matters; it is not the default for automatically laid-out diagrams.

## Consequences
Only decks declaring `mermaid` carry its bundle, but those decks gain roughly 2.7 MB of uncompressed JavaScript. Vendoring pins behaviour and preserves offline use; updates require checking bundle compatibility, licence, and rendered output.

Assembly success cannot prove diagram success: parsing and layout happen in the browser. Stage and per-diagram readiness/error states make failures observable, with visible slide identity and console diagnostics. Final review must wait for readiness, inspect labels and clipping, and check print layout. The deck's own print path can wait for rendering; browser-menu print cannot await it and must be opened after readiness.

Automatic layout gives up exact positioning and can crowd long labels or large graphs. Authors must simplify or split dense diagrams. HTML text escaping remains necessary inside `pre`, and the Tiny bundle's supported syntax constrains which native diagram types can be used.
