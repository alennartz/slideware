#!/usr/bin/env node
// Live preview for the content and review steps. Serves a built deck with a reload hook and
// rebuilds whenever decks/<slug>/source/slides.html changes. Dev-only: published HTML has no hook.
//
// Usage: node preview/dev.mjs <slug> [port]     (default port 4321)

import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deckPaths, renderDeck, themeDependencies } from '../build/build.mjs';
import { referencedAssets } from '../build/images.mjs';

// Returns { url, close, version }. `slidesPath` is the file to watch; `slug` names the deck.
export function startDev({ slidesPath, slug, port = 4321 }) {
  const dir = dirname(slidesPath);
  let html = null, version = 0, lastSignature = '';

  // what a rebuild depends on: the slides and every image they reference
  const signature = () => {
    const slides = readFileSync(slidesPath, 'utf8');
    const refs = referencedAssets(slides);
    const dependencies = [...refs.map(r => join(dir, r)), ...themeDependencies(slides)];
    return [statSync(slidesPath).mtimeMs, ...dependencies.map(path => existsSync(path) ? statSync(path).mtimeMs : 'missing')].join('|');
  };

  const rebuild = () => {
    try {
      const built = renderDeck(dir, slug, { dev: true }).html;
      html = built;
      version++;
      console.log(`rebuilt ${slug} (version ${version})`);
    } catch (e) {
      console.error(`build failed, still serving the last good version: ${e.message}`);
    }
  };

  const check = () => {
    let sig;
    try { sig = signature(); } catch { return; } // a file vanished mid-save: try again next tick
    if (sig !== lastSignature) { lastSignature = sig; rebuild(); }
  };

  check();
  if (html === null) throw new Error(`could not build ${slug} on start`);
  const timer = setInterval(check, 300);

  const server = createServer((req, res) => {
    if (req.url === '/__version') {
      res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
      return res.end(String(version));
    }
    if (req.url === '/' || req.url.startsWith('/?')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}/`,
      version: () => version,
      close: () => new Promise(r => { clearInterval(timer); server.close(r); }),
    }));
  });
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [slug, portArg] = process.argv.slice(2);
  if (!slug) { console.error('Usage: node preview/dev.mjs <slug> [port]'); process.exit(2); }
  const { slidesPath } = deckPaths(slug);
  startDev({ slidesPath, slug, port: Number(portArg ?? 4321) })
    .then(s => console.log(`previewing ${slug} at ${s.url} (Ctrl+C to stop)`))
    .catch(e => { console.error(e.message); process.exit(1); });
}
