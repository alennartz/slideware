# Customization and updates

Keep the factory in Git and checkout-specific material in ignored paths. Pull factory updates with `git pull`; update each external add-on from its own source separately.

## Ownership

| Upstream-managed | Checkout-, add-on-, or Deck-owned |
|---|---|
| `build/`, `engine/`, `libs/`, `preview/` | `decks/<slug>/` — private source, assets, and output; ignored by Git |
| Built-in `.agents/skills/` workflows | `.agents/skills/local/` — additional project skills |
| Built-in theme and manifest | `.local/themes/<name>.css` — checkout-local themes and their `assets/` |
| Shared code and tests | `.pi/extensions/local/` — checkout-local Pi extensions |
| `AGENTS.md` and public docs | `.local/AGENTS.md` — checkout-specific agent instructions |
| Generic add-on registry | External add-on directories referenced by `.local/slideware.json` |

`.local/`, `.env`, and the local skill/extension folders are ignored. Keep credentials in environment variables or an OS credential store, not in manifests. Do not edit tracked core files to customize one checkout; use a local skill, a local theme, an external add-on, or per-Deck CSS and markup instead.

## Stable extension points

- **Deck content and appearance:** author in `decks/<slug>/source/`; use source-side styles for a one-Deck adjustment.
- **Reusable checkout-local themes:** add `.local/themes/<name>.css` and select it with `<!-- theme: <name> -->`. No manifest edit is needed. Theme assets can live in `.local/themes/assets/` and are inlined at build time. Built-in names are reserved; the preview watches selected theme files and assets.
- **Agent behavior:** add skills with unique names under `.agents/skills/local/<skill-name>/SKILL.md`; put checkout-specific instructions in `.local/AGENTS.md`.
- **Pi integrations:** add a trusted project extension under `.pi/extensions/local/`. Pi loads project extensions only after the project is trusted. Slideware builds and published decks do not depend on Pi.
- **Host configuration:** copy `.env.example` to ignored `.env`, fill in only the integrations you use, then load it before starting Pi or running Make commands. For example: `set -a; . ./.env; set +a; pi`. Pi does not load `.env` automatically. An external add-on documents its own settings in its guide.

## External add-ons

Keep add-on source in a separate directory or repository, outside the factory checkout. Register its path in ignored `.local/slideware.json`:

```json
{
  "schemaVersion": 1,
  "addons": ["../my-slideware-addon"]
}
```

Paths are relative to the factory root; absolute paths also work. The add-on source must be outside the factory checkout and contain `slideware-addon.json`, a versioned, declarative manifest. Manifest resource paths are relative to and contained within the add-on. It can register local theme files and explicitly invoked commands, plus descriptions and a guide path. It does not provide Pi extensions or modify factory code.

A manifest looks like this:

```json
{
  "schemaVersion": 1,
  "id": "my-brand",
  "name": "My brand resources",
  "description": "Approved corporate slide assets and theme.",
  "guide": "README.md",
  "themes": {
    "my-brand": { "css": "themes/my-brand.css", "assetRoot": "themes" }
  },
  "commands": {
    "assets": { "entry": "tools/assets.mjs", "description": "Search and download approved images." }
  }
}
```

The default pointer is `.local/slideware.json`. Set `SLIDEWARE_ADDONS_CONFIG` only when an alternate pointer file is needed.

List the configured add-ons before use:

```sh
make addons
```

The agent uses this catalog to find capability names and read an add-on's guide. A Deck source selects a registered theme using its normal header, for example `<!-- theme: my-brand -->`. The build reads only the selected CSS and its local assets, then inlines them into the published HTML; it never imports or executes add-on code.

Run a listed asset command only when needed:

```sh
make assets ADDON=<id> ARGS='<command>'
```

If exactly one configured add-on provides `assets`, `ADDON` is optional. The command runs with the factory root as its working directory and receives `SLIDEWARE_ROOT`; it is not run by build, preview, or `make addons`. Add-on commands are trusted local programs and run with the user's permissions. The agent uses the generic image/tooling skills to inspect `make addons` and read an add-on guide before using its capabilities.

Without `.local/slideware.json`, no external add-ons load and the built-in factory works unchanged. A finished HTML Deck remains self-contained, but rebuilding its source requires the external add-on that provided its theme or assets. After a factory update, pull updates for an add-on separately.

## Optional image generation

Azure FLUX.2 image generation is a separate optional Pi integration, not part of the external add-on contract. The provider registers only when `AZURE_FLUX_ENDPOINT` and `AZURE_FLUX_API_KEY` are present when Pi starts. Each call is billed to the configured Azure account. Without those settings, use another configured image model or stock/local assets.
