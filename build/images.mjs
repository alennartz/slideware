// Inlines images that a slides fragment references under assets/ (DR-006).
// Pure apart from the reader it is given, so tests can supply their own.

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
export const LARGE_IMAGE = 1024 * 1024; // bytes; above this the build warns to resize

// readAsset(rel) returns a Buffer for a path relative to the source folder, e.g. "assets/a.jpg". It throws when the file is missing.
export function inlineImages(slides, readAsset) {
  const warnings = [];
  const cache = new Map();
  const inline = rel => {
    if (!cache.has(rel)) {
      const ext = rel.split('.').pop().toLowerCase();
      if (rel.includes('..') || !MIME[ext]) throw new Error(`image "${rel}": use a relative path with a png, jpg, gif, webp or svg extension`);
      const data = readAsset(rel);
      if (data.length > LARGE_IMAGE) warnings.push(`large image ${rel} (${(data.length / 1048576).toFixed(1)} MB): resize it before it goes in`);
      cache.set(rel, `data:${MIME[ext]};base64,${data.toString('base64')}`);
    }
    return cache.get(rel);
  };
  const out = slides
    .replace(/(\bsrc\s*=\s*)(["'])(assets\/[^"']+)\2/gi, (m, pre, q, rel) => `${pre}${q}${inline(rel)}${q}`)
    .replace(/(url\(\s*)(["']?)(assets\/[^"')]+)\2(\s*\))/gi, (m, pre, q, rel, post) => `${pre}${q}${inline(rel)}${q}${post}`);
  return { slides: out, warnings };
}

// The files a fragment references, so a watcher knows what to rebuild on.
export function referencedAssets(slides) {
  return [...new Set([...slides.matchAll(/assets\/[^"'\s)]+/gi)].map(m => m[0]))];
}
