#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FACTORY_ROOT, listAddons, resolveCommand, resolveTheme } from './registry.mjs';

function validateThemeNames(addons) {
  const builtIns = Object.keys(JSON.parse(readFileSync(join(FACTORY_ROOT, 'themes/manifest.json'), 'utf8')));
  const localDir = join(FACTORY_ROOT, '.local', 'themes');
  const local = existsSync(localDir)
    ? readdirSync(localDir).filter(name => /^[a-z0-9-]+\.css$/.test(name)).map(name => name.slice(0, -4))
    : [];
  const reservedNames = [...builtIns, ...local];
  for (const addon of addons) {
    for (const theme of addon.themes) resolveTheme(theme.name, { addons, reservedNames });
  }
}

function printAddons() {
  const addons = listAddons();
  validateThemeNames(addons);
  if (!addons.length) {
    console.log('No local add-ons configured. Register external paths in ignored .local/slideware.json.');
    return;
  }
  for (const addon of addons) {
    console.log(`${addon.id} — ${addon.name}`);
    if (addon.description) console.log(`  ${addon.description}`);
    if (addon.themes.length) console.log(`  themes: ${addon.themes.map(theme => theme.name).join(', ')}`);
    if (addon.commands.length) {
      for (const command of addon.commands) {
        console.log(`  command: ${command.name}${command.description ? ` — ${command.description}` : ''}`);
      }
    }
    if (addon.guidePath) console.log(`  guide: ${addon.guidePath}`);
  }
}

function runAssetSource(args) {
  const separator = args.indexOf('--');
  const selection = separator < 0 ? args : args.slice(0, separator);
  const commandArgs = separator < 0 ? [] : args.slice(separator + 1);
  if (selection.length > 1) throw new Error("Usage: make assets [ADDON=<id>] ARGS='<asset command>'.");
  const command = resolveCommand('assets', { addonId: selection[0] || undefined });
  const child = spawn(process.execPath, [command.entryPath, ...commandArgs], {
    cwd: FACTORY_ROOT,
    env: { ...process.env, SLIDEWARE_ROOT: FACTORY_ROOT },
    stdio: 'inherit',
  });
  child.once('error', error => {
    console.error(`could not start add-on ${command.addonId} asset command: ${error.message}`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    if (signal) {
      console.error(`add-on ${command.addonId} asset command stopped by ${signal}`);
      process.exitCode = 1;
    } else {
      process.exitCode = code ?? 1;
    }
  });
}

function usage() {
  console.log(`Slideware local add-ons

Usage:
  make addons
  make assets [ADDON=<id>] ARGS='<asset command>'

Add-on sources are configured in the ignored .local/slideware.json.
Asset commands run only when explicitly invoked.`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (!command || command === 'help' || command === '--help' || command === '-h') usage();
  else if (command === 'list' || command === 'addons') printAddons();
  else if (command === 'assets') runAssetSource(args);
  else throw new Error(`Unknown add-on operation: ${command}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
