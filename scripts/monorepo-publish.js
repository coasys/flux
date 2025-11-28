const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKIP_PACKAGES = [
    'flux-electron',
    '@coasys/flux-docs',
    'flux-webrtc-debug-view',
    'my-first-flux-plugin',
    'my-first-vue-flux-plugin',
    // add more package names to skip here
];

function findPackageJsons(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name.startsWith('.')
    ) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findPackageJsons(fullPath, found);
    } else if (entry.name === 'package.json') {
      // Only include if not in a dist directory
      if (!fullPath.includes('/dist/')) {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (pkg.name) found.push(fullPath);
        } catch (e) {
          // skip invalid package.json
        }
      }
    }
  }
  return found;
}

function shouldSkip(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return SKIP_PACKAGES.includes(pkg.name);
}

function bumpVersion(pkgPath, newVersion) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Bumped ${pkg.name} to ${newVersion}`);
}

function publishPackage(pkgDir, dryRun = false) {
  const pkgJson = path.join(pkgDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
  const cmd = `npm publish${dryRun ? ' --dry-run' : ''}`;
  console.log(`\n--- Publishing ${pkg.name} (${pkgDir}) ---`);
  try {
    execSync(cmd, { cwd: pkgDir, stdio: 'inherit' });
    console.log(`${dryRun ? '[DRY RUN] ' : ''}Published ${pkg.name}`);
  } catch (e) {
    console.error(`\n[ERROR] Failed to publish ${pkg.name} (${pkgDir}):\n${e.message}\n`);
    throw e;
  }
}

function getPackageName(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.name;
}

function getDependencies(pkgPath, allNames) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  // Only consider dependencies that are also in the monorepo
  const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
  return Object.keys(deps || {}).filter(dep => allNames.has(dep));
}

function topologicalSort(pkgs) {
  // Build name-to-path and dependency graph
  const nameToPath = {};
  pkgs.forEach(pkgPath => {
    const name = getPackageName(pkgPath);
    nameToPath[name] = pkgPath;
  });
  const allNames = new Set(Object.keys(nameToPath));
  const graph = {};
  pkgs.forEach(pkgPath => {
    const name = getPackageName(pkgPath);
    graph[name] = getDependencies(pkgPath, allNames);
  });

  // Topological sort
  const visited = new Set();
  const temp = new Set();
  const sorted = [];

  function visit(name) {
    if (visited.has(name)) return;
    if (temp.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }
    temp.add(name);
    (graph[name] || []).forEach(visit);
    temp.delete(name);
    visited.add(name);
    sorted.push(nameToPath[name]);
  }

  Object.keys(graph).forEach(visit);
  return sorted;
}

async function main() {
  const mode = process.argv[2];
  if (!['bump', 'dry-run', 'publish'].includes(mode)) {
    console.log('Usage: node scripts/monorepo-publish.js bump|dry-run|publish [newVersion]');
    process.exit(1);
  }

  const root = process.cwd();
  const pkgsUnsorted = findPackageJsons(root).filter(pkgPath => !shouldSkip(pkgPath));
  let pkgs = pkgsUnsorted;

  // Only sort for publish/dry-run, not bump
  if (mode !== 'bump') {
    try {
      pkgs = topologicalSort(pkgsUnsorted);
    } catch (e) {
      console.error('Dependency sort error:', e.message);
      process.exit(1);
    }
  }

  if (mode === 'bump') {
    const newVersion = process.argv[3];
    if (!newVersion) {
      console.error('Please provide a new version: node scripts/monorepo-publish.js bump 1.2.3');
      process.exit(1);
    }
    pkgs.forEach(pkgPath => bumpVersion(pkgPath, newVersion));
  } else {
    for (const pkgPath of pkgs) {
      const pkgDir = path.dirname(pkgPath);
      publishPackage(pkgDir, mode === 'dry-run');
    }
  }
}

main();