#!/usr/bin/env node
// Builds decks/<slug>/output/<slug>.html from decks/<slug>/source/slides.html.
//
// Usage: node build/build.mjs [slug ...]     (no slugs: every decks/*/source/slides.html)
//
// A slides.html is a fragment: <section class="slide"> elements, nothing else structural. Optional
// header comments, first lines of the file:
//   <!-- title: My talk -->             page title (default: the slug)
//   <!-- theme: my-brand -->           shared theme (default: deckfile-default)
//   <!-- libs: chart tabulator -->      optional libraries to inline (names in libs/manifest.json)

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineImages, referencedAssets } from './images.mjs';
import { loadAddons, resolveTheme } from '../addons/registry.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = p => readFileSync(join(ROOT, p), 'utf8');

export function deckPaths(slug) {
  const dir = join(ROOT, 'decks', slug);
  return {
    sourceDir: join(dir, 'source'),
    slidesPath: join(dir, 'source', 'slides.html'),
    outputPath: join(dir, 'output', `${slug}.html`),
  };
}
const LIBS = JSON.parse(read('libs/manifest.json'));
const BUILTIN_THEMES = JSON.parse(read('themes/manifest.json'));

function coreThemes() {
  const themes = Object.fromEntries(Object.entries(BUILTIN_THEMES).map(([name, file]) => [name, {
    cssPath: join(ROOT, 'themes', file),
    assetsDir: join(ROOT, 'themes'),
  }]));
  const localDir = join(ROOT, '.local', 'themes');
  if (existsSync(localDir)) {
    for (const file of readdirSync(localDir).filter(name => /^[a-z0-9-]+\.css$/.test(name))) {
      const name = file.slice(0, -4);
      if (Object.hasOwn(themes, name)) continue;
      const cssPath = join(localDir, file);
      if (statSync(cssPath).isFile()) themes[name] = { cssPath, assetsDir: localDir, local: true };
    }
  }
  return themes;
}

function selectTheme(name, { addonConfigPath } = {}) {
  const themes = coreThemes();
  if (themes[name]) return { theme: themes[name], knownNames: Object.keys(themes) };

  const registry = loadAddons({ configPath: addonConfigPath });
  const theme = resolveTheme(name, { addons: registry.addons, reservedNames: Object.keys(themes) });
  const knownNames = [...Object.keys(themes), ...registry.addons.flatMap(addon => addon.themes.map(item => item.name))];
  return { theme, knownNames: [...new Set(knownNames)], configPath: registry.configPath };
}

export function themeDependencies(slides, options = {}) {
  const name = /<!--\s*theme:\s*([a-z0-9-]+)\s*-->/.exec(slides)?.[1] ?? 'deckfile-default';
  const localDir = join(ROOT, '.local', 'themes');
  const selected = selectTheme(name, options);
  if (!selected.theme) return [localDir, selected.configPath];
  const { theme } = selected;
  const css = readFileSync(theme.cssPath, 'utf8');
  const localDependencies = theme.local ? [localDir] : [];
  const addonDependencies = theme.manifestPath ? [selected.configPath, theme.manifestPath] : [];
  return [...localDependencies, ...addonDependencies, theme.cssPath, ...referencedAssets(css).map(asset => join(theme.assetsDir, asset))];
}

// Mirror of deckfile's update rule (bin/deckfile.mjs). Comments match first and are left alone, so a
// comment that mentions the engine tags is never mistaken for an engine block.
export const ENGINE_BLOCKS = [
  { tag: 'style', re: /<!--[\s\S]*?-->|(<style\b[^>]*\bdata-deck="engine"[^>]*>)[\s\S]*?(<\/style>)/g, file: 'deck.css' },
  { tag: 'script', re: /<!--[\s\S]*?-->|(<script\b[^>]*\bdata-deck="engine"[^>]*>)[\s\S]*?(<\/script>)/g, file: 'deck.js' },
];

// Polls the preview version and reloads the page when it changes. Used only by preview/dev.mjs.
export const RELOAD_HOOK = `<script data-deck="dev">(() => {
  let seen = null;
  setInterval(async () => {
    try {
      const v = await (await fetch('/__version', { cache: 'no-store' })).text();
      if (seen !== null && v !== seen) location.reload();
      seen = v;
    } catch {}
  }, 500);
})();</script>`;

// Turn a slides fragment into a complete deck from the runtime, selected theme, and declared libraries.
export function assemble(slides, { slug, dev = false, addonConfigPath } = {}) {
  const title = /<!--\s*title:\s*(.+?)\s*-->/.exec(slides)?.[1] ?? slug;
  const themeName = /<!--\s*theme:\s*([a-z0-9-]+)\s*-->/.exec(slides)?.[1] ?? 'deckfile-default';
  const selected = selectTheme(themeName, { addonConfigPath });
  if (!selected.theme) {
    throw new Error(`unknown theme "${themeName}" (known: ${selected.knownNames.join(', ')})`);
  }
  const libNames = (/<!--\s*libs:\s*(.*?)\s*-->/.exec(slides)?.[1] ?? '').split(/[\s,]+/).filter(Boolean);
  for (const name of libNames) {
    if (!LIBS[name]) throw new Error(`unknown library "${name}" (known: ${Object.keys(LIBS).join(', ')})`);
  }
  for (const bad of ['data-deck="engine"', '<html', '<head', '<body']) {
    if (slides.includes(bad)) throw new Error(`slides.html must not contain ${bad}: the build owns the page structure`);
  }

  const theme = selected.theme;
  const themeSource = readFileSync(theme.cssPath, 'utf8');
  const { slides: themeCss } = inlineImages(themeSource, rel => readFileSync(join(theme.assetsDir, rel)));
  const assets = { ENGINE_CSS: read('engine/deck.css'), THEME_CSS: themeCss,
    ENGINE_JS: read('engine/deck.js'), LIBS_INIT_JS: read('libs/libs-init.js') };
  const libCss = [...new Set(libNames.flatMap(n => LIBS[n].css))].map(read);
  const libJs = libNames.map(n => `/*!\n${read(LIBS[n].license)}\n*/\n` + LIBS[n].js.map(read).join('\n'));
  for (const [k, v] of Object.entries({ ...assets, LIB_CSS: libCss.join('\n'), LIB_JS: libJs.join('\n') })) {
    if (/<\/(script|style)/i.test(v)) throw new Error(`${k} contains a closing script or style tag`);
  }
  const parts = {
    TITLE: title, SLUG: slug, SLIDES: slides.replace(/^\s*<!--\s*(title|theme|libs):.*-->\s*$/gm, '').trim(),
    ...assets,
    // the glue only starts libraries, so it is inlined only when a deck declares one
    LIBS_INIT: libNames.length ? `<script data-deck="libs">\n${assets.LIBS_INIT_JS}</script>` : '',
    LIB_CSS: libCss.map(c => `<style>\n${c}\n</style>`).join('\n'),
    LIB_JS: libJs.map(j => `<script>\n${j}\n</script>`).join('\n'),
  };
  // substitute in one pass; a function replacer keeps "$" in assets from being read as patterns
  const html = read('build/shell.html').replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in parts)) throw new Error(`shell placeholder ${m} has no value`);
    return parts[k];
  });
  // the dev reload hook is added only for the live preview, never to a deck that ships
  if (!dev) return html;
  const closingBody = html.lastIndexOf('</body>');
  return html.slice(0, closingBody) + RELOAD_HOOK + '\n' + html.slice(closingBody);
}

// Warnings for things a deck should not depend on: remote resources in the slides.
export function warnings(slides) {
  const out = [];
  for (const m of slides.matchAll(/\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)/gi)) out.push(`remote resource: ${m[1]}`);
  for (const m of slides.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/gi)) out.push(`remote resource: ${m[1]}`);
  return out;
}

// Reads a deck's source, inlines its images, and assembles it. Returns the page and any warnings.
export function renderDeck(sourceDir, slug, { dev = false, addonConfigPath } = {}) {
  const source = readFileSync(join(sourceDir, 'slides.html'), 'utf8');
  const { slides, warnings: imageWarnings } = inlineImages(source, rel => readFileSync(join(sourceDir, rel)));
  return { html: assemble(slides, { slug, dev, addonConfigPath }), warnings: [...warnings(source), ...imageWarnings] };
}

export function buildDeck(slug) {
  const { sourceDir, outputPath } = deckPaths(slug);
  const { html, warnings: w } = renderDeck(sourceDir, slug);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html);
  return { html, warnings: w };
}

function allSlugs() {
  const decks = join(ROOT, 'decks');
  if (!existsSync(decks)) return [];
  return readdirSync(decks).filter(s => existsSync(join(decks, s, 'source', 'slides.html')) && statSync(join(decks, s)).isDirectory());
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : allSlugs();
  let failed = false;
  for (const slug of slugs) {
    try {
      const { html, warnings: w } = buildDeck(slug);
      console.log(`built ${relative(ROOT, deckPaths(slug).outputPath)} (${(html.length / 1024).toFixed(0)} KB)`);
      w.forEach(x => console.log(`  warning: ${x}`));
    } catch (e) {
      failed = true;
      console.error(`FAILED ${slug}: ${e.message}`);
    }
  }
  if (!slugs.length) console.log('no decks: add decks/<slug>/source/slides.html');
  process.exit(failed ? 1 : 0);
}
