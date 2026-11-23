import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FACTORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const ADDON_CONFIG_RELATIVE_PATH = '.local/slideware.json';
export const ADDON_MANIFEST_NAME = 'slideware-addon.json';
export const ADDON_SCHEMA_VERSION = 1;

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function fail(location, message) {
  throw new Error(`${location}: ${message}`);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(label, `cannot read valid JSON (${error.message})`);
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label, 'expected an object');
  return value;
}

function requireName(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    fail(label, 'expected a lowercase name using letters, numbers, and hyphens');
  }
  return value;
}

function resolveAddonRoot(factoryRoot, configuredPath, label) {
  if (typeof configuredPath !== 'string' || !configuredPath.trim()) fail(label, 'expected a non-empty add-on path');
  let addonRoot;
  try {
    addonRoot = realpathSync(resolve(factoryRoot, configuredPath));
  } catch (error) {
    fail(label, `add-on path is unavailable (${error.message})`);
  }
  if (isInside(factoryRoot, addonRoot)) fail(label, 'add-on source must live outside the factory checkout');
  if (!statSync(addonRoot).isDirectory()) fail(label, 'add-on path must be a directory');
  return addonRoot;
}

function resolvePackagePath(addonRoot, relativePath, label, kind = 'file') {
  if (typeof relativePath !== 'string' || !relativePath.trim() || isAbsolute(relativePath)) {
    fail(label, 'expected a relative path inside the add-on');
  }
  const candidate = resolve(addonRoot, relativePath);
  if (!isInside(addonRoot, candidate)) fail(label, 'path escapes the add-on directory');

  let actual;
  try {
    actual = realpathSync(candidate);
  } catch (error) {
    fail(label, `path is unavailable (${error.message})`);
  }
  if (!isInside(addonRoot, actual)) fail(label, 'resolved path escapes the add-on directory');
  const info = statSync(actual);
  if (kind === 'file' && !info.isFile()) fail(label, 'expected a file');
  if (kind === 'directory' && !info.isDirectory()) fail(label, 'expected a directory');
  return actual;
}

function readAddon(addonRoot) {
  const manifestPath = resolvePackagePath(addonRoot, ADDON_MANIFEST_NAME, 'add-on manifest');
  const manifest = requireObject(readJson(manifestPath, 'add-on manifest'), 'add-on manifest');
  if (manifest.schemaVersion !== ADDON_SCHEMA_VERSION) {
    fail(manifestPath, `unsupported schemaVersion ${JSON.stringify(manifest.schemaVersion)} (expected ${ADDON_SCHEMA_VERSION})`);
  }
  const id = requireName(manifest.id, `${manifestPath} id`);
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) fail(manifestPath, 'name must be non-empty text');
  if (manifest.description !== undefined && typeof manifest.description !== 'string') fail(manifestPath, 'description must be text');

  let guidePath;
  if (manifest.guide !== undefined) guidePath = resolvePackagePath(addonRoot, manifest.guide, `${manifestPath} guide`);

  const themes = [];
  const themeConfig = requireObject(manifest.themes ?? {}, `${manifestPath} themes`);
  for (const [nameValue, value] of Object.entries(themeConfig)) {
    const name = requireName(nameValue, `${manifestPath} theme name`);
    const theme = requireObject(value, `${manifestPath} theme ${name}`);
    const cssPath = resolvePackagePath(addonRoot, theme.css, `${manifestPath} theme ${name} CSS`);
    const assetsDir = theme.assetRoot === undefined
      ? dirname(cssPath)
      : resolvePackagePath(addonRoot, theme.assetRoot, `${manifestPath} theme ${name} assetRoot`, 'directory');
    themes.push({ name, cssPath, assetsDir, addonId: id, packageRoot: addonRoot, manifestPath });
  }

  const commands = [];
  const commandConfig = requireObject(manifest.commands ?? {}, `${manifestPath} commands`);
  for (const [nameValue, value] of Object.entries(commandConfig)) {
    const name = requireName(nameValue, `${manifestPath} command name`);
    const command = requireObject(value, `${manifestPath} command ${name}`);
    const entryPath = resolvePackagePath(addonRoot, command.entry, `${manifestPath} command ${name} entry`);
    if (!/\.(?:mjs|cjs|js)$/.test(entryPath)) fail(`${manifestPath} command ${name}`, 'entry must be JavaScript (.mjs, .cjs, or .js)');
    if (command.description !== undefined && typeof command.description !== 'string') {
      fail(`${manifestPath} command ${name}`, 'description must be text');
    }
    commands.push({ name, entryPath, addonId: id, packageRoot: addonRoot, manifestPath, description: command.description ?? '' });
  }

  return {
    id,
    name: manifest.name.trim(),
    description: manifest.description ?? '',
    addonRoot,
    manifestPath,
    guidePath,
    themes,
    commands,
  };
}

export function loadAddons({ factoryRoot = FACTORY_ROOT, configPath } = {}) {
  const resolvedFactoryRoot = realpathSync(factoryRoot);
  const configuredFile = configPath ?? (process.env.SLIDEWARE_ADDONS_CONFIG?.trim() || ADDON_CONFIG_RELATIVE_PATH);
  const configFile = isAbsolute(configuredFile)
    ? resolve(configuredFile)
    : resolve(resolvedFactoryRoot, configuredFile);
  if (!existsSync(configFile)) return { factoryRoot: resolvedFactoryRoot, configPath: configFile, addons: [] };

  const config = requireObject(readJson(configFile, 'local add-on configuration'), 'local add-on configuration');
  if (config.schemaVersion !== ADDON_SCHEMA_VERSION) {
    fail(configFile, `unsupported schemaVersion ${JSON.stringify(config.schemaVersion)} (expected ${ADDON_SCHEMA_VERSION})`);
  }
  if (!Array.isArray(config.addons)) fail(configFile, 'addons must be an array of external add-on paths');

  const addons = [];
  const seenIds = new Set();
  const seenPaths = new Set();
  for (const configuredPath of config.addons) {
    const label = `${configFile} add-on path`;
    const addonRoot = resolveAddonRoot(resolvedFactoryRoot, configuredPath, label);
    if (seenPaths.has(addonRoot)) fail(configFile, `add-on path is listed more than once: ${addonRoot}`);
    const addon = readAddon(addonRoot);
    if (seenIds.has(addon.id)) fail(configFile, `duplicate add-on id "${addon.id}"`);
    seenPaths.add(addonRoot);
    seenIds.add(addon.id);
    addons.push(addon);
  }

  return { factoryRoot: resolvedFactoryRoot, configPath: configFile, addons };
}

export function listAddons(options) {
  return loadAddons(options).addons;
}

export function resolveTheme(name, { addons, reservedNames = [] } = {}) {
  const matches = (addons ?? loadAddons().addons).flatMap(addon => addon.themes).filter(theme => theme.name === name);
  if (matches.length > 1) fail('add-on themes', `theme name "${name}" is provided by multiple add-ons`);
  if (matches.length && reservedNames.includes(name)) fail('add-on themes', `theme name "${name}" is reserved by the factory or a local theme`);
  return matches[0] ?? null;
}

export function resolveCommand(name, { addonId, addons } = {}) {
  const available = (addons ?? loadAddons().addons)
    .filter(addon => !addonId || addon.id === addonId)
    .flatMap(addon => addon.commands.filter(command => command.name === name));
  if (addonId && !available.length) fail('add-on command', `add-on "${addonId}" does not provide command "${name}"`);
  if (!available.length) fail('add-on command', `no configured add-on provides command "${name}"; run make addons to inspect available capabilities`);
  if (!addonId && available.length > 1) {
    const ids = [...new Set(available.map(command => command.addonId))].sort().join(', ');
    fail('add-on command', `multiple add-ons provide "${name}"; set ADDON=<id> (${ids})`);
  }
  return available[0];
}
