#!/usr/bin/env node
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const statePath = resolve(scriptDir, '..', '.docker-state.json');

const BUILDABLE_SERVICES = ['backend', 'frontend'];
const CORE_SERVICES = ['db', 'redis', 'backend', 'frontend'];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const forceAll = args.has('--all');
const noBuild = args.has('--no-build');
const skipPs = args.has('--no-ps');
// Backend-only mode: skip the frontend image entirely so you can run the SPA
// with `bun run dev` (which proxies /api to the backend on :8000) and keep
// Docker for db/redis/backend + final verification.
const noFrontend = args.has('--no-frontend') || args.has('--backend-only');

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

main();

function main() {
  logHeader('LearnLab Docker');

  const state = readState();
  const currentHead = getCurrentHead();
  const hasPreviousBuild = Boolean(state?.lastHead);
  const { files: changedFiles, reliable: gitInspectionReliable } = getChangedFiles(
    state?.lastHead,
    currentHead,
  );
  const affected = forceAll || !gitInspectionReliable || !hasPreviousBuild
    ? new Set(BUILDABLE_SERVICES)
    : inferBuildServices(changedFiles);

  if (!forceAll) {
    for (const service of BUILDABLE_SERVICES) {
      if (!hasComposeImage(service)) {
        affected.add(service);
      }
    }
  }

  // Backend-only: never build or start the frontend image, and which services
  // to bring up shrinks to db/redis/backend.
  const coreServices = noFrontend
    ? CORE_SERVICES.filter((service) => service !== 'frontend')
    : CORE_SERVICES;
  if (noFrontend) {
    affected.delete('frontend');
    log('Backend-only mode (--no-frontend): skipping the frontend image; run the SPA with `bun run dev`.');
  }

  if (!hasPreviousBuild) {
    warn('No previous Docker helper stamp found; rebuilding all buildable images.');
  } else if (!gitInspectionReliable) {
    warn('Git inspection was unavailable; rebuilding all buildable images to stay safe.');
  } else if (changedFiles.length > 0) {
    log(`Changed files detected: ${changedFiles.length}`);
  } else {
    log('No Git-tracked or untracked file changes detected.');
  }

  if (touchesFreshDbOnly(changedFiles)) {
    warn('Database init files changed. Existing Docker volumes will not replay init scripts automatically.');
  }

  if (noBuild) {
    log('Skipping image rebuild because --no-build was supplied.');
  } else if (affected.size > 0) {
    const services = [...affected].sort(serviceSort);
    run('docker', ['compose', 'build', ...services]);
  } else {
    log('No affected build images detected; skipping docker compose build.');
  }

  if (noFrontend) {
    // Free up :5173 for `bun run dev`; harmless if it isn't running.
    run('docker', ['compose', 'stop', 'frontend']);
  }

  run('docker', ['compose', 'up', '-d', ...coreServices]);

  if (!skipPs) {
    run('docker', ['compose', 'ps']);
  }

  if (!dryRun && !noBuild && currentHead) {
    writeState({
      lastHead: currentHead,
      updatedAt: new Date().toISOString(),
    });
  }
}

function inferBuildServices(files) {
  const services = new Set();

  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');

    if (
      normalized === 'docker-compose.yml' ||
      normalized === 'docker-compose.yaml'
    ) {
      BUILDABLE_SERVICES.forEach((service) => services.add(service));
      continue;
    }

    if (normalized.startsWith('frontend/')) {
      services.add('frontend');
      continue;
    }

    if (normalized.startsWith('backend/')) {
      services.add('backend');
    }
  }

  return services;
}

function getChangedFiles(lastHead, currentHead) {
  const sinceLastBuild = lastHead && currentHead && lastHead !== currentHead
    ? capture('git', ['diff', '--name-only', lastHead, currentHead])
    : { ok: true, stdout: '' };
  const tracked = capture('git', ['diff', '--name-only', 'HEAD']);
  const untracked = capture('git', ['ls-files', '--others', '--exclude-standard']);
  const reliable = sinceLastBuild.ok && tracked.ok && untracked.ok;

  return {
    reliable,
    files: uniqueLines(`${sinceLastBuild.stdout}\n${tracked.stdout}\n${untracked.stdout}`)
      .map((file) => file.trim())
      .filter(Boolean)
      .sort(),
  };
}

function getCurrentHead() {
  const result = capture('git', ['rev-parse', 'HEAD']);
  return result.ok ? result.stdout.trim() : null;
}

function readState() {
  if (!existsSync(statePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    warn('Could not read .docker-state.json; rebuilding all buildable images.');
    return null;
  }
}

function writeState(state) {
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  log('Updated frontend/.docker-state.json.');
}

function hasComposeImage(service) {
  if (dryRun) {
    return true;
  }

  const result = spawnSync('docker', ['compose', 'images', '-q', service], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return result.status === 0 && result.stdout.trim().length > 0;
}

function touchesFreshDbOnly(files) {
  return files.some((file) => ['init-db.sh', 'init.sql'].includes(file.replaceAll('\\', '/')));
}

function capture(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const reason = result.error?.message || result.stderr?.trim() || `exit ${result.status}`;
    warn(`Could not inspect Git changes with: ${command} ${commandArgs.join(' ')} (${reason})`);
    return { ok: false, stdout: '' };
  }

  return { ok: true, stdout: result.stdout };
}

function run(command, commandArgs) {
  const printable = `${command} ${commandArgs.join(' ')}`;

  if (dryRun) {
    log(`[dry-run] ${printable}`);
    return;
  }

  log(`Running: ${printable}`);
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function uniqueLines(text) {
  return [...new Set(text.split(/\r?\n/))];
}

function serviceSort(a, b) {
  return BUILDABLE_SERVICES.indexOf(a) - BUILDABLE_SERVICES.indexOf(b);
}

function logHeader(title) {
  const cwd = relative(process.cwd(), repoRoot) || '.';
  console.log(`\n${title}`);
  console.log('='.repeat(title.length));
  console.log(`Compose root: ${cwd}\n`);
}

function log(message) {
  console.log(`[docker] ${message}`);
}

function warn(message) {
  console.log(`[docker] ${message}`);
}

function printHelp() {
  console.log(`
Usage:
  bun run docker
  npm run docker

Options:
  --all           Rebuild all buildable images before starting services.
  --no-build      Start services without rebuilding images.
  --no-frontend   Backend-only: skip the frontend image and stop it if running,
                  so you can run the SPA with \`bun run dev\` (alias: --backend-only).
  --no-ps         Skip the final docker compose ps output.
  --dry-run       Print the Docker commands without running them.

What it does:
  1. Inspects changed and untracked files with Git.
  2. Maps frontend/ changes to the frontend image and backend/ changes to the backend image.
  3. Rebuilds only affected build images, unless --all or --no-build is used.
  4. Starts db, redis, backend, and frontend with docker compose up -d.

Typical dev loop:
  bun run docker --no-frontend   # db + redis + backend in Docker
  bun run dev                    # SPA on :5173, /api proxied to the backend
  bun run docker                 # full stack for final verification
`);
}
