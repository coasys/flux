const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKIP_PACKAGES = [
  'flux-electron',
  '@coasys/flux-docs',
  'flux-webrtc-debug-view',
  'my-first-flux-plugin',
  'my-first-vue-flux-plugin',
  'flux',
  'flux-monorepo',
  // add more package names to skip here
];

function findPackageJsons(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
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

function bumpVersion(pkgPath, newVersion, allPackageNames) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = newVersion;

  // Update internal dependencies
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((depField) => {
    if (pkg[depField]) {
      Object.keys(pkg[depField]).forEach((depName) => {
        if (allPackageNames.has(depName)) {
          pkg[depField][depName] = newVersion;
        }
      });
    }
  });

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Bumped ${pkg.name} to ${newVersion} (and updated internal deps)`);
}

function publishPackage(pkgDir, dryRun = false) {
  const pkgJson = path.join(pkgDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
  const cmd = `npm publish --registry=https://registry.npmjs.org${dryRun ? ' --dry-run' : ''}`;
  console.log(`\n--- Publishing ${pkg.name} (${pkgDir}) ---`);
  try {
    // Use 'pipe' to capture output for error parsing
    execSync(cmd, { cwd: pkgDir, stdio: 'pipe' });
    console.log(`${dryRun ? '[DRY RUN] ' : ''}Published ${pkg.name}`);
    return { success: true };
  } catch (e) {
    let output = '';
    if (e.stdout) output += e.stdout.toString();
    if (e.stderr) output += e.stderr.toString();
    const msg = (output || e.message || '').toLowerCase();

    let reason = '';
    if (msg.includes('e403') && msg.includes('cannot publish over the previously published versions')) {
      reason = '(already published)';
    } else if (msg.includes('e403')) {
      reason = '(forbidden or no permission)';
    } else if (msg.includes('eprivate')) {
      reason = '(package is private)';
    } else if (msg.includes('eneedauth') || msg.includes('need auth')) {
      reason = '(not authenticated)';
    } else if (msg.includes('version already exists')) {
      reason = '(version already exists)';
    } else if (msg.trim()) {
      // fallback: show first line of error output
      reason = '(' + msg.trim().split('\n')[0] + ')';
    }
    console.error(`\n[ERROR] Failed to publish ${pkg.name} (${pkgDir}):\n${output || e.message}\n`);
    return { success: false, reason };
  }
}

function getPackageName(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.name;
}

function getDependencies(pkgPath, allNames) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  // Only consider dependencies that are also in the monorepo
  const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies);
  return Object.keys(deps || {}).filter((dep) => allNames.has(dep));
}

function topologicalSort(pkgs) {
  // Build name-to-path and dependency graph
  const nameToPath = {};
  pkgs.forEach((pkgPath) => {
    const name = getPackageName(pkgPath);
    nameToPath[name] = pkgPath;
  });
  const allNames = new Set(Object.keys(nameToPath));
  const graph = {};
  pkgs.forEach((pkgPath) => {
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
  if (!['bump', 'dry-run', 'publish', 'bump-ad4m'].includes(mode)) {
    console.log('Usage: node scripts/monorepo-version.js bump|dry-run|publish|bump-ad4m [newVersion]');
    process.exit(1);
  }

  const root = process.cwd();
  const allPkgPaths = findPackageJsons(root);
  let pkgs = allPkgPaths;
  // Only skip packages for publish/dry-run
  if (mode === 'dry-run' || mode === 'publish') {
    pkgs = allPkgPaths.filter((pkgPath) => !shouldSkip(pkgPath));
    try {
      pkgs = topologicalSort(pkgs);
    } catch (e) {
      console.error('Dependency sort error:', e.message);
      process.exit(1);
    }
  }
  const allPackageNames = new Set(allPkgPaths.map(getPackageName));

  if (mode === 'bump') {
    const newVersion = process.argv[3];
    if (!newVersion) {
      console.error('Please provide a new version: node scripts/monorepo-publish.js bump 1.2.3');
      process.exit(1);
    }
    pkgs.forEach((pkgPath) => bumpVersion(pkgPath, newVersion, allPackageNames));
  } else if (mode === 'bump-ad4m') {
    const newVersion = process.argv[3];
    if (!newVersion) {
      console.error('Please provide a new version: node scripts/monorepo-publish.js bump-ad4m 1.2.3');
      process.exit(1);
    }
    // Find all AD4M packages
    const ad4mPrefix = '@coasys/ad4m';
    // Bump all AD4M packages and update AD4M dependencies in all packages
    pkgs.forEach((pkgPath) => {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      let changed = false;
      // If this is an AD4M package, bump its version
      if (pkg.name && pkg.name.startsWith(ad4mPrefix)) {
        pkg.version = newVersion;
        changed = true;
      }
      // Update AD4M dependencies in all packages
      ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((depField) => {
        if (pkg[depField]) {
          Object.keys(pkg[depField]).forEach((depName) => {
            if (depName.startsWith(ad4mPrefix)) {
              pkg[depField][depName] = newVersion;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`Bumped ${pkg.name} to ${newVersion} (and updated AD4M deps)`);
      }
    });

    // Also update AD4M versions in resolutions field of root package.json
    const rootPkgPath = path.join(root, 'package.json');
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    if (rootPkg.resolutions) {
      let changed = false;
      Object.keys(rootPkg.resolutions).forEach((resName) => {
        if (resName.startsWith(ad4mPrefix)) {
          rootPkg.resolutions[resName] = newVersion;
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
        console.log(`Updated AD4M versions in root package.json resolutions to ${newVersion}`);
      }
    }
  } else {
    const successes = [];
    const failures = [];
    for (const pkgPath of pkgs) {
      const pkgDir = path.dirname(pkgPath);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const result = publishPackage(pkgDir, mode === 'dry-run');
      if (result.success) {
        successes.push(pkg.name);
      } else {
        failures.push({ name: pkg.name, reason: result.reason });
      }
    }
    console.log('\n=== Publish Summary ===');
    if (successes.length) {
      console.log('✅ Published:');
      successes.forEach((pkg) => console.log(`  ✅ ${pkg}`));
    }
    if (failures.length) {
      console.log('❌ Failed:');
      failures.forEach((pkg) => console.log(`  ❌ ${pkg.name} ${pkg.reason || ''}`));
    }
    if (!failures.length) {
      console.log('🎉 All packages published successfully!');
    }
  }
}

main();
