---
name: deck-images
description: "Images in decks: when a slide needs one, sourcing tech logos and stock images, generating with FLUX.2 [pro], sizing, and alt text. Use when adding, replacing, or choosing an image or logo for a slide."
---

# Deck Images

The rules for images in a deck. Markup and the build are in `deck-markup` and `build/README.md`.

## When a slide needs an image

- Use an image when the subject is a real thing: a person, place, product, or screenshot.
- Use a diagram or chart when the point is a number or a process (`deck-slide-rules`).
- Otherwise use no image. Do not decorate.

## Sourcing

For photos and illustrations, stock first. Generate only when stock has no fit or the user asks for generated art.

- **Organization-owned assets**: run `make addons` to inspect configured local asset sources and read a relevant add-on guide before use. Invoke its listed command explicitly with `make assets ADDON=<id> ARGS='<command>'`. Save selected files in `decks/<slug>/source/assets/`; never link a slide directly to a private source. The default workflow uses local assets and requires no add-on.
- **Tech logos/icons**: prefer full-colour assets from [SVGL](https://svgl.app/) or [Devicon](https://devicon.dev/); fall back to [Simple Icons](https://simpleicons.org/) for single-colour SVGs. Use logos to identify technologies discussed on the slide, not as decoration. See [LOGOS.md](LOGOS.md) for search and download. When a Mermaid node needs a logo, put it inside the node rather than making a separate graph node; follow [deck-markup/diagrams.md](../deck-markup/diagrams.md#images-inside-nodes).
- **Stock** (default for photos and illustrations): Unsplash, Pexels, or other stock sources.
- **Generated**: optional FLUX.2 [pro] through the `azure-flux` provider. It is available only when `AZURE_FLUX_ENDPOINT` and `AZURE_FLUX_API_KEY` are set before Pi starts. Each call is billed to the configured Azure account, so generate only when the user asks or agrees. Without those settings, use another configured image model if available, or stock or local assets. Generated images suit illustrations and abstract visuals, not real people, data, or product screenshots. Check the output for accuracy before use.

## Generating an image

For the prompt itself, read `PROMPTING.md` in this folder: FLUX.2 wording, general prompt parts, and deck rules such as no text in images.

Run this from a `codemode` script only when the optional provider is configured. Launch Pi from a shell that exports both `AZURE_FLUX_ENDPOINT` and `AZURE_FLUX_API_KEY`; see [Customization and updates](../../../docs/customization.md).

```js
// @options: {"timeout_ms": 300000}
const flux = await models.getModelOfType("image", "azure-flux", "flux-2-pro");
const result = await models.generateImages(flux, {
  input: [{ type: "text", text: "<prompt>" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) if (block.type === "image") image(block);
```

`image()` saves the picture to a temp file and names its path in the result. Copy that file into the deck:

```
cp <temp path from the result> decks/<slug>/source/assets/<name>.png
```

Then reference it as `assets/<name>.png` (see Preparing the file).

Limits: one image per call. Output up to 4 MP. Reference images are supported (up to eight) through `input` image blocks.

## Preparing the file

- Resize to about 1920 px wide at most. Match the display size. Generated images are 1024 px by default, which is enough for most slides.
- Keep each file under 1 MB where practical. The build warns above that and does not fail. Generated 1024 px PNGs run about 1.5 MB; keep them unless the build warns.
- Use JPG for photos, PNG for screenshots, SVG for diagrams and logos.
- Place the file in `decks/<slug>/source/assets/`. Reference it as `assets/<file>`.

## Alt text

- Describe what the image shows and why it matters on this slide, in one sentence.
- Decorative image: `alt=""`.

## Checks before finishing

- Every `assets/` reference resolves. `make build SLUG=<slug>` fails otherwise.
- The image has alt text.
