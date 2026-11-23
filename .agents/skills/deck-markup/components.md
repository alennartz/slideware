<!--
  Copied from deckfile v0.2.0 (skills/deck/references/components.md), MIT, Roald Nefs.
  Factory differences:
  - Charts: use `<div class="chart-box"><canvas data-chart='…'>` with a Chart.js config, and declare `<!-- libs: chart -->`.
  - Tables: use `<div data-tabulator='…'>` and declare `<!-- libs: tabulator -->`.
  - Build details: build/README.md, relative to the repo root.
  - Images: the source keeps them in `decks/<slug>/source/assets/` and references them as `assets/<file>`. The build inlines them into the published file (DR-006).
-->

# Slide and component catalogue

Author `<section class="slide">` elements in `decks/<slug>/source/slides.html`.
The build supplies `<div id="stage">` and the page shell; edit the source, not
`output/<slug>.html` or the engine's edit view. Use source-side inline styles for layout overrides.

The stage is a fixed 1920×1080 canvas, scaled to the viewport, so all sizes are in canvas pixels.
The content area runs from 160 px to 1760 px horizontally and from 120 px to
960 px vertically. A heading stays at the top; `.cols`, `.keys`, `.stats`, `.term`
and `ul` centre themselves in the room below it. The logo and counter sit in the
bottom corners.

## Slide variants (classes on `<section>`)

| Class | Use | Notes |
|---|---|---|
| `slide` | Standard content slide, dark text on white | Always present |
| `slide title` | Opening card | Centred, icon instead of logo; each time it is shown, the text rises in. Often combined with `dark` |
| `slide divider` | Section break | Centred; `.kicker` holds the section number. Usually combined with `dark` |
| `slide dark` | Dark emphasis slide | Black; re-points `--ink`, `--muted`, `--accent`, `--line` and so on to light-on-dark |
| `slide closing` | Final card | Centred like `title`, icon instead of logo |

Attributes:
- `data-auto="600"` on a section reveals its `.build` elements by themselves, one every N ms, as soon as the slide is shown. `→` and `←` take over.

## Text

```html
<div class="kicker">02 · Section name</div>   <!-- small accent label above the heading -->
<h1>Only on title, divider, closing</h1>
<h2>Slide heading</h2>
<h3>Sub-heading inside a column</h3>
<p class="sub">Large lead sentence (title slide)</p>
<p class="byline">Your Name, Role at Organisation</p>
<p class="small">Source: report, page 3</p>
<p class="small">[gap: evidence needed for this claim]</p>
<code>class="build"</code>                     <!-- code within a line -->
```

Use the kicker to show where you are (`02 · What we did`). On dividers it holds only the number (`02`).
Use "Illustrative data" only for deliberately hypothetical values. Keep unsupported real claims marked `[gap: …]` until sourced.

## Lists

```html
<ul>                           <!-- large plain lines, without bullets -->
  <li class="build">One sentence each</li>
</ul>

<ol class="agenda">            <!-- 01, 02, 03… large agenda list -->
  <li class="build">Part one</li>
</ol>
```

List length and content: `deck-slide-rules`.

## Stats row

```html
<div class="stats">            <!-- 3 equal columns; change grid-template-columns for 2 or 4 -->
  <div class="stat build"><span class="n">42%</span><span class="cap">What it measures · source</span></div>
</div>
```

## Two columns

```html
<div class="cols">             <!-- 1fr 1fr, 80px gap; override inline for other ratios -->
  <div>…</div>
  <div>…</div>
</div>
```

For a different ratio: `<div class="cols" style="grid-template-columns:1.4fr 1fr">`.

## Terminal panel

```html
<div class="term"><span class="b">$</span> <span class="w">command --flag</span>
<span class="d"># dim comment</span>
plain output line
</div>
```

`white-space:pre` applies, so line breaks inside the div are literal: do not indent the contents. It also suits markup and other code. A light panel: `.b` accent (prompt, values), `.w` medium weight (typed command), `.d` muted (output, comments). Keep it to 12 lines or fewer.

## Window

```html
<div class="window"><img src="assets/screenshot.png" alt="…"></div>   <!-- or an inline <svg viewBox> -->
```

A screenshot or drawing as a floating, rounded window. Its width comes from the column it sits in.

## Table

```html
<table class="keys"><tr><td>Label</td><td>Value</td></tr></table>
```

`kbd` renders keyboard keys.

## Buttons

```html
<a class="btn" href="…">Read more</a>          <!-- outline button -->
<a class="btn action" href="…">Sign up</a>     <!-- filled accent button -->
```

## Charts and quotes

For Chart.js charts, use `.chart-box` and `data-chart` as described in repo-root `build/README.md`. Alternatively, draw a chart as inline SVG in a `.window`, with an `aria-label` that gives the data in words. Write a quote as ordinary text. Put custom styling in source-side inline styles.

## Diagrams

For Mermaid flowcharts and sequence diagrams, read [diagrams.md](diagrams.md): markup, accessibility, theme classes, and browser review. Inline SVG remains an option for a custom drawing that needs precise placement.

## Images

Photos and screenshots are files in `decks/<slug>/source/assets/`, referenced as
`<img src="assets/photo.jpg" alt="…">`. Use `<img>`, not a CSS
`background-image`, because backgrounds can go missing when printed to PDF.
The build inlines them (DR-006); keep file references in the source.
Sourcing and sizing: `deck-images`.

A common pattern is a photo beside text:

```html
<div class="cols" style="grid-template-columns:1fr 1fr;align-items:center">
  <div><h2>Heading</h2><p>Text.</p></div>
  <img src="assets/photo.jpg" alt="…" style="width:100%;height:700px;object-fit:cover;border-radius:20px">
</div>
```

## Speaker notes

```html
<div class="s-notes"><p>What to say, in the speaker's voice.</p></div>
```

When speaking notes are requested, put this as the section's last child in `source/slides.html`. Notes appear in the presenter view (`S`); revise them in the source. They never show on the slide or in the PDF.

## Builds

Add `class="build"` to any element to reveal it on the next `→`. Builds go in
document order. `↓` advances to the next slide with all its builds shown.
