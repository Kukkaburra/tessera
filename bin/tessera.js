#!/usr/bin/env node
// Tessera CLI — run the token editor against the current repo.
//
//   tessera                 edit tokens in the current directory
//   tessera --root <dir>    edit tokens in <dir>
//   tessera --port <n>      serve on a specific port (default 5180)
//   tessera --open          open the browser
//   tessera init            scaffold a tessera.config.json (infers structure)
//   tessera --help | --version

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const toolDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const has = (...names) => names.some((n) => args.includes(n));
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

function printHelp() {
  console.log(`
  Tessera — a local editor for an app's design tokens.

  Usage
    tessera [options]          edit tokens in the current directory
    tessera init               write a tessera.config.json (infers structure)

  Options
    --root <dir>               repo to edit (default: cwd)
    --port <n>                 port to serve on (default: 5180)
    --open                     open the browser after starting
    -h, --help                 show this help
    -v, --version              show version
`);
}

// Pick a sensible tier order from collection names (primitives → semantic → components).
function rankCollection(name) {
  const order = ['primitive', 'palette', 'color', 'base', 'core', 'global', 'semantic', 'alias', 'theme', 'component'];
  const i = order.findIndex((k) => name.toLowerCase().startsWith(k));
  return i === -1 ? order.length : i;
}

function initConfig() {
  const cwd = process.cwd();
  const target = path.join(cwd, 'tessera.config.json');
  if (existsSync(target)) {
    console.error('✗ tessera.config.json already exists here.');
    process.exit(1);
  }
  const tokensDir = ['tokens', 'design/tokens', 'src/tokens'].find((d) => existsSync(path.join(cwd, d))) || 'tokens';
  const dir = path.join(cwd, tokensDir);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.')) : [];

  const byName = {};
  for (const f of files) {
    const base = f.replace(/\.tokens\.json$/, '').replace(/\.json$/, '');
    const [name, mode] = base.split('.'); // "semantic.dark" → semantic / dark
    (byName[name] ||= { name, files: {} }).files[mode || 'default'] = f;
  }
  const collections = Object.values(byName).sort((a, b) => rankCollection(a.name) - rankCollection(b.name));
  for (const c of collections) {
    const modes = Object.keys(c.files).filter((m) => m !== 'default');
    if (modes.length) c.modes = modes;
  }
  const themed = collections.find((c) => (c.modes || []).length > 1);

  const config = {
    tokensDir,
    modes: ['dark', 'light'],
    collections: collections.length
      ? collections
      : [{ name: 'tokens', files: { default: 'tokens.json' } }],
    preview: { collection: (themed || collections[collections.length - 1] || { name: 'tokens' }).name },
  };
  writeFileSync(target, JSON.stringify(config, null, 2) + '\n');
  console.log(`✓ Wrote ${path.relative(cwd, target)} — ${files.length} token file(s), ${collections.length} collection(s).`);
  if (!files.length) console.log(`  (no token files found in ${tokensDir}/ — edit the config to match your layout)`);
}

async function serve() {
  const appRoot = path.resolve(flag('--root', process.cwd()));
  const port = Number(flag('--port', process.env.TESSERA_PORT || 5180));
  if (!existsSync(path.join(appRoot, 'tessera.config.json'))) {
    console.warn(`! No tessera.config.json in ${appRoot} — using built-in defaults. Run \`tessera init\` to create one.`);
  }
  process.env.TESSERA_ROOT = appRoot;

  const { createServer } = await import('vite');
  const server = await createServer({
    root: toolDir,
    configFile: path.join(toolDir, 'vite.config.js'),
    server: { port },
  });
  await server.listen();
  const url = `http://localhost:${server.config.server.port}`;
  console.log(`\n  Tessera → editing tokens in ${appRoot}\n  ${url}\n`);
  if (has('--open')) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    (await import('node:child_process')).spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
  }
}

if (has('-h', '--help')) {
  printHelp();
} else if (has('-v', '--version')) {
  const pkg = JSON.parse(readFileSync(path.join(toolDir, 'package.json'), 'utf8'));
  console.log(`tessera ${pkg.version}`);
} else if (args[0] === 'init') {
  initConfig();
} else {
  await serve();
}
