# Slideware

Build slide decks with an AI agent, from the first idea to a presentation you can open in a browser. You shape the story and approve the slides; the agent handles the files, layout, preview, and build.

Each finished deck is a single HTML file you can present offline, share, or print to PDF. Slides can include images, charts, tables, diagrams, and speaker notes.

The factory code is MIT-licensed; vendored components retain the licenses included alongside them.

## Get started

You'll need:

- [Pi](https://pi.dev), connected to an AI provider.
- Node.js 22.19 or newer and `make`.
- A web browser for previewing and presenting.

Clone or download this repository, then start Pi from its root:

```sh
cd slideware
pi
```

Pi discovers the deck-building skills in this repo automatically. There are no npm dependencies to install for building or previewing decks.

## Create your first deck

In Pi, run:

```text
/skill:new-deck
```

You can include a brief:

```text
/skill:new-deck A 15-minute talk for engineering leads about reducing deployment risk. The goal is to get agreement on a pilot next quarter.
```

Bring whatever you have: a rough idea, audience details, a time limit, research, data, or an existing outline. You don't need a finished script or any HTML knowledge.

The flow takes the brief through:

1. **Name and purpose** — what the deck is called and what it should achieve.
2. **Audience** — what they know, care about, and need from the talk.
3. **Structure** — the story, its claims, and the evidence behind them.
4. **Storyboard** — slide order, headlines, and pacing.
5. **Slides** — wording, visuals, and optional speaker notes.
6. **Review** — whether the deck delivers its takeaway and fits the time available.

The agent uses your brief, makes reasonable choices, and asks when essential information or consent is needed. It records assumptions and missing evidence rather than inventing facts or sources. During slide writing, it provides a live preview URL; ask it to open the preview if you like.

The built presentation is at:

```text
decks/<slug>/output/<slug>.html
```

`<slug>` is the folder name derived from your deck's title, such as `deployment-risk`. The agent reports whether the deck passed review or is a draft with outstanding findings.

## Revise a deck

For an existing deck, ask Pi for the change directly. Don't restart `new-deck`.

```text
In decks/deployment-risk, shorten the introduction and make the closing slide ask for a six-week pilot. Preview the changes and rebuild the deck.
```

Editable planning and review notes, slides, and original images live in `decks/<slug>/source/`. The slide markup is `source/slides.html`; local images go in `source/assets/` and are referenced as `assets/<file>`.

The built-in theme is `deckfile-default`. To choose a checkout-local theme, put `.local/themes/<name>.css` in place and add this header to `source/slides.html`:

```html
<!-- theme: my-brand -->
```

The build inlines the selected theme, so the published deck works offline. Add customizations without editing tracked factory files; see [Customization and updates](docs/customization.md) for the supported extension points and optional integrations.

**Don't edit `decks/<slug>/output/<slug>.html` or use the presentation's built-in edit view.** That file is generated, and rebuilding will overwrite those changes. Ask the agent to update the source instead.

## Preview and build

The agent manages these during the guided flow. If you want to run them yourself, use a terminal at the repo root:

```sh
make decks                              # List your decks
make preview SLUG=deployment-risk       # Live preview; Ctrl+C to stop
make build SLUG=deployment-risk         # Build the shareable HTML file
make build                              # Build every deck
```

Replace `deployment-risk` with your deck's folder name. Preview normally runs at `http://127.0.0.1:4321` and reloads when slides or images change. If the port is busy, add `PORT=4322` to the preview command.

## Customize and update

`decks/`, `.local/`, local skills, local Pi extensions, and `.env` are ignored so private decks and checkout-specific customizations survive `git pull`. External add-ons live outside this checkout; run `make addons` to inspect configured capabilities. See [Customization and updates](docs/customization.md) rather than editing upstream-managed files.

## Present and share

Open `decks/<slug>/output/<slug>.html` in your browser. No preview server or Pi session is needed to present it.

| Key | Action |
|---|---|
| Right arrow / Space | Next reveal or slide |
| Left arrow | Previous reveal or slide |
| Down / Up arrow | Move forward / back by a whole slide |
| F | Fullscreen |
| S | Presenter view with notes, next preview, and timer |
| P | Print; choose **Save as PDF** in the print dialog |

Share `decks/<slug>/output/<slug>.html`, or save a PDF export as `decks/<slug>/output/<slug>.pdf` for readers who don't need interactive slides. Keep the whole `decks/<slug>/` folder if you want to revise the presentation later.
