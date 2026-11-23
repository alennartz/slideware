# Tech logo lookup

Prefer the full-colour assets from SVGL or Devicon. If neither has the logo, use Simple Icons' single-colour SVG.

These examples use `curl` and, for Devicon's index, Node.js. Replace the example names, selected URLs and `/tmp` output paths. Save the final asset in `decks/<slug>/source/assets/`.

## SVGL

Search the [API](https://svgl.app/docs/api) by title:

```sh
curl -sSG --data-urlencode 'search=PostgreSQL' -w '\nHTTP %{http_code}\n' https://api.svgl.app
```

Match `title`. `route` is the icon; `wordmark` is optional. Either can be a URL or an object with `light` and `dark` URLs. Download the selected URL from the result:

```sh
curl -fLsS 'https://svgl.app/library/postgresql.svg' -o /tmp/postgresql.svg
```

A 404 with `SVG not found` means no match. Other errors, including rate limits, do not establish absence.

## Devicon

Search the official index by name or alternate name. Inspect `versions.svg` and select an available `original` variant:

```sh
NAME='k3s'
curl -fsSL https://raw.githubusercontent.com/devicons/devicon/master/devicon.json | \
  node -e 'let s=""; process.stdin.setEncoding("utf8").on("data", x => s+=x).on("end", () => {
    const q=process.argv[1].toLowerCase();
    console.log(JSON.stringify(JSON.parse(s).filter(x => [x.name, ...(x.altnames ?? [])].some(n => n.toLowerCase().includes(q))), null, 2));
  })' "$NAME"
```

Use the returned `name` and an available SVG variant to construct the [documented asset path](https://github.com/devicons/devicon#usage):

```sh
ICON='k3s'
VARIANT='original'
curl -fLsS "https://raw.githubusercontent.com/devicons/devicon/master/icons/$ICON/$ICON-$VARIANT.svg" -o /tmp/k3s.svg
```

An empty array means no matching name. Do not assume every icon has an `original` variant.

## Simple Icons

Find the exact slug in the [official index](https://github.com/simple-icons/simple-icons/blob/master/slugs.md):

```sh
NAME='Cilium'
curl -fsSL https://raw.githubusercontent.com/simple-icons/simple-icons/master/slugs.md | grep -iF "$NAME"
```

Download the selected slug from the project's [colour CDN](https://github.com/simple-icons/simple-icons#cdn-with-colors). It defaults to the icon's brand colour, but the icon remains single-colour:

```sh
SLUG='cilium'
curl -fLsS "https://cdn.simpleicons.org/$SLUG" -o /tmp/cilium.svg
```
