# Diagrams

Use Mermaid for processes, relationships, and message exchanges that benefit from automatic layout. Use inline SVG for a custom drawing that needs precise placement. Keep each diagram to the slide's one idea; reduce nodes and shorten labels before shrinking text.

This reference teaches flowcharts and sequence diagrams. Other native types require checking support in the vendored Mermaid Tiny bundle and the rendered result.

## Markup

Declare `mermaid` in the first-line library header, alongside any other libraries the deck uses. Put native Mermaid text in `<pre class="mermaid">` inside `.diagram-box`. The box fills the available width and is 640 canvas pixels tall by default; source-side inline styles may adjust its layout, including inside `.cols`.

```html
<!-- title: Approval workflow -->
<!-- libs: mermaid -->

<!-- 3 · Only reviewed drafts reach publication -->
<section class="slide">
  <h2>Only reviewed drafts reach publication</h2>
  <div class="diagram-box"><pre class="mermaid">
flowchart LR
  accTitle: Publication workflow
  accDescr: A draft passes through review before publication.
  A[Draft] --> B[Review]:::highlight --> C[Publish]
  class A muted
  </pre></div>
</section>
```

Write native syntax, not JSON or generated SVG. The adapter replaces the text with SVG in the browser; keep the Mermaid source in `source/slides.html`.

### HTML escaping

`pre` is still HTML, not a raw-text element. Escape literal `<` as `&lt;` and literal `&` as `&amp;` throughout its contents, including arrows, labels, and accessibility text. The browser decodes those entities before Mermaid reads the text. For example, a label containing `x < 5` is written `A["x &lt; 5"]`; `Terms & checks` becomes `Terms &amp; checks`.

Sequence arrows `->>` and `-->>` contain no `<` or `&`, so leave them unchanged. Write any native arrow containing `<` with `&lt;` in the HTML source. Use plain-text labels unless a node needs an image.

## Images inside nodes

Use `data-html-labels` on the `pre` only when an image belongs inside a node. Keep Mermaid's strict security; the adapter opts in to HTML labels for that diagram. Escape the image tag as HTML text, use a deck-local asset, provide alt text, and set both dimensions so layout does not depend on image loading.

```html
<section class="slide">
  <h2>The runtime hosts the workload</h2>
  <div class="diagram-box"><pre class="mermaid" data-html-labels>
flowchart LR
  accTitle: Runtime and workload
  accDescr: The runtime hosts a workload.
  A["&lt;img src='assets/logo.svg' width='48' height='48' alt='Runtime logo' /&gt; Runtime"] --> B[Workload]
  </pre></div>
</section>
```

The build inlines the asset as it does for other images. Read `deck-images` for sourcing. HTML labels use SVG `foreignObject`; check them on the slide and in print. Readiness waits for label images to decode and reports a diagram error if they fail.

## Flowcharts

Start with `flowchart LR` for a left-to-right process or `flowchart TD` for a top-down hierarchy. Use stable node IDs with short labels: `A[Draft]` is a step, `B{Approved?}` a decision. Connect nodes with `A --> B` or a labelled edge such as `B -->|Yes| C`.

The adapter supplies two theme-aware flowchart classes:

- `:::highlight` marks a focal node, as in `B[Review]:::highlight`.
- `class A muted` makes a supporting node quieter. Several IDs can share a class: `class A,C muted`.

Use these classes instead of hardcoded colours. Omit colour-bearing `style` or `classDef` rules and Mermaid theme/config directives: the adapter reads the containing slide's tokens, including on `.dark` slides. Sequence diagrams use the same slide theme; the node classes are for flowcharts.

## Sequence diagrams

Use `sequenceDiagram` for who sends what, in what order. Declare participants in reading order, give them short names, and label messages with the action or result. `->>` is a message; `-->>` suits a response.

```html
<div class="diagram-box"><pre class="mermaid">
sequenceDiagram
  accTitle: Review exchange
  accDescr: The author submits a draft to the reviewer, who returns feedback.
  participant A as Author
  participant R as Reviewer
  A->>R: Submit draft
  R-->>A: Return feedback
</pre></div>
```

Keep the library header shown above. Split a long exchange across slides rather than crowding lifelines and messages into one box.

## Accessibility

Give every diagram a native `accTitle:` and `accDescr:`. The title names the diagram's purpose; the description explains the relationships or sequence in words, not just the node names. Mermaid carries them into the SVG's accessible title and description. These belong inside the Mermaid text, as in both examples above.

## Browser review

A successful build only proves assembly; Mermaid parses and lays out diagrams in the browser. Batch preview checks after a set of edits rather than checking each diagram separately. Before a final deck pass, review all diagrams in the published `output/<slug>.html` and its print output.

1. Wait until `#stage[data-diagrams]` is no longer `pending`, then require its value to be `ready`. Each `pre.mermaid` must also have `data-diagram-status="ready"`, not `pending` or `error`. A missing readiness attribute on a deck using Mermaid is not a pass.
2. On `error`, read the visible message identifying the slide and the browser console. Fix the Mermaid source and rebuild or reload; require readiness again. Record unresolved errors as required changes.
3. Inspect each affected diagram in its slide, and every diagram in a final review: readable labels, complete arrows, no overlap, no clipping, and suitable contrast. Check dark slides and column layouts where used. Readiness reports rendering, not visual quality.
4. For the final review, after readiness, inspect print preview or PDF for legible labels, unclipped SVG, and fit within the slide. Wait before opening browser-menu print; it cannot await rendering. The deck's own print path waits for the render batch to settle, but still require `ready` before accepting the output.

The adapter waits for fonts and renders all diagrams eagerly in an offscreen measurement container, so review does not depend on visiting a slide to trigger rendering. The shipped deck carries the renderer and needs no CDN or runtime install.
