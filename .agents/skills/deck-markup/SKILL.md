---
name: deck-markup
description: "Slide HTML for decks: section classes, text, lists, stats, columns, charts, tables, diagrams, speaker notes, builds, and image references. Use when writing or editing `decks/<slug>/source/slides.html`."
---

# Deck Markup

The reference for writing slide markup. Use it for any edit to `decks/<slug>/source/slides.html`, whether inside the new-deck flow or in an ad-hoc session.

Full catalogue: `components.md` in this folder. Read the section you need.

## Rules

- Each slide is one `<section class="slide">` inside the stage. Choose the variant class from `components.md`.
- Precede each section with a marker comment such as `<!-- 3 · headline -->`. Use the storyboard number when one exists; otherwise number slides in deck order. Revisions find a slide by its marker; an ad-hoc edit needs no storyboard.
- Speaker notes, when requested: `<div class="s-notes">` as the section's last child. Author and revise them in `source/slides.html`; `S` opens the presenter view.
- Header comments on the first lines: `<!-- title: … -->`, and `<!-- libs: chart tabulator mermaid -->` listing only the libraries used (Chart.js, Tabulator, Mermaid). Plain HTML tables and inline SVG need no library.
- Charts: `<div class="chart-box"><canvas data-chart='…'>` with a Chart.js config as JSON. Tables: `<div data-tabulator='…'>` with Tabulator options as JSON. Details: `build/README.md` (relative to the repo root).
- Diagrams: read [diagrams.md](diagrams.md) when authoring or reviewing Mermaid. It owns markup, native syntax, accessibility, theme classes, and browser checks.
- Images: files in `decks/<slug>/source/assets/`, referenced as `assets/<file>`. The build inlines them. Use `<img>`, not a CSS background. Supported: png, jpg, gif, webp, svg.
- Edit only the slide source and its assets, not generated `output/<slug>.html` or the engine's edit view. Put layout overrides in source-side inline styles.
- Never write the `data-deck="engine"` block, `<html>`, `<head>`, or `<body>`. The build owns them.
