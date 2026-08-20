const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT_DIR, 'changed-services.json');
const DEPLOY_STATE_FILE = 'C:\\ahha-deploy\\.last_deployed_commit';

// Service path mappings
const BACKEND_SERVICES = {
  admin: [
    'apps/admin',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'loyalty-admin': [
    'apps/loyalty-admin',
    'libs/loyalty',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'loyalty-consumer': [
    'apps/loyalty-consumer',
    'libs/loyalty',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'user-admin': [
    'apps/user-admin',
    'libs/user',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'user-consumer': [
    'apps/user-consumer',
    'libs/user',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'product-admin': [
    'apps/product-admin',
    'libs/product',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  'product-consumer': [
    'apps/product-consumer',
    'libs/product',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
  redistro: [
    'apps/redistro',
    'libs/base',
    'libs/database',
    'libs/auth',
    'libs/encryption',
    'libs/middleware',
  ],
};

const FRONTEND_SERVICES = {
  'frontend-cms': ['apps/frontend-cms'],
  'frontend-consumer': ['apps/frontend-consumer'],
};

// Files that force a full rebuild of everything
const GLOBAL_REBUILD_PATTERNS = [
  'package.json',
  'yarn.lock',
  'nest-cli.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'Jenkinsfile',
  'deploy.bat',
  'start-all.ps1',
  'scripts/detect-changed-services.js',
];

function getGitDiffFiles(lastCommit) {
  try {
    const targetCommit = lastCommit || 'HEAD~1';
    const output = execSync(`git diff --name-only ${targetCommit} HEAD`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  } catch (err) {
    console.warn('Could not determine git diff. Defaulting to FULL rebuild.');
    return null;
  }
}

function getLastDeployedCommit() {
  if (fs.existsSync(DEPLOY_STATE_FILE)) {
    try {
      return fs.readFileSync(DEPLOY_STATE_FILE, 'utf8').trim();
    } catch (_) {}
  }
  return null;
}

function detectChanges() {
  const currentCommit = execSync('git rev-parse HEAD', {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  }).trim();

  const lastCommit = getLastDeployedCommit();
  const changedFiles = getGitDiffFiles(lastCommit);

  if (!changedFiles) {
    return {
      deployAll: true,
      lastCommit,
      currentCommit,
      backend: Object.keys(BACKEND_SERVICES),
      frontend: Object.keys(FRONTEND_SERVICES),
      reason: 'No previous deploy state or git diff failed',
    };
  }

  const isGlobalChange = changedFiles.some((file) =>
    GLOBAL_REBUILD_PATTERNS.some(
      (pattern) => file === pattern || file.startsWith(pattern),
    ),
  );

  if (isGlobalChange) {
    console.log(
      'Global configuration change detected. Performing FULL rebuild.',
    );
    return {
      deployAll: true,
      lastCommit,
      currentCommit,
      backend: Object.keys(BACKEND_SERVICES),
      frontend: Object.keys(FRONTEND_SERVICES),
      reason: 'Global dependency/script change detected',
    };
  }

  const affectedBackend = new Set();
  const affectedFrontend = new Set();

  changedFiles.forEach((file) => {
    Object.entries(BACKEND_SERVICES).forEach(([service, paths]) => {
      if (paths.some((p) => file.startsWith(p))) {
        affectedBackend.add(service);
      }
    });

    Object.entries(FRONTEND_SERVICES).forEach(([service, paths]) => {
      if (paths.some((p) => file.startsWith(p))) {
        affectedFrontend.add(service);
      }
    });
  });

  const backendList = Array.from(affectedBackend);
  const frontendList = Array.from(affectedFrontend);

  // If nothing changed in apps/libs, default to full to be safe
  const deployAll = backendList.length === 0 && frontendList.length === 0;

  return {
    deployAll,
    lastCommit,
    currentCommit,
    backend: deployAll ? Object.keys(BACKEND_SERVICES) : backendList,
    frontend: deployAll ? Object.keys(FRONTEND_SERVICES) : frontendList,
    changedFiles,
  };
}

function runBuilds(result) {
  console.log('=== Selective Build Report ===');
  console.log(`Current Commit: ${result.currentCommit}`);
  console.log(`Backend Apps to Build: ${result.backend.join(', ') || 'None'}`);
  console.log(
    `Frontend Apps to Build: ${result.frontend.join(', ') || 'None'}`,
  );

  if (result.deployAll) {
    console.log('Building ALL backend services via nest build...');
    execSync('npx nest build', { cwd: ROOT_DIR, stdio: 'inherit' });
  } else {
    result.backend.forEach((app) => {
      console.log(`Building NestJS app [${app}]...`);
      execSync(`npx nest build ${app}`, { cwd: ROOT_DIR, stdio: 'inherit' });
    });
  }

  if (result.frontend.includes('frontend-cms')) {
    console.log('Building frontend-cms...');
    const cmsDir = path.join(ROOT_DIR, 'apps/frontend-cms');
    execSync('yarn install --ignore-engines --network-timeout 600000', {
      cwd: cmsDir,
      stdio: 'inherit',
    });
    execSync('npx vite build', { cwd: cmsDir, stdio: 'inherit' });
  }

  if (result.frontend.includes('frontend-consumer')) {
    console.log('Building frontend-consumer...');
    const consumerDir = path.join(ROOT_DIR, 'apps/frontend-consumer');
    execSync('npm install --no-audit --no-fund', {
      cwd: consumerDir,
      stdio: 'inherit',
    });
    execSync('npx vite build', { cwd: consumerDir, stdio: 'inherit' });
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved build state to ${STATE_FILE}`);
}

const mode = process.argv[2] || '--detect';
const result = detectChanges();

if (mode === '--build') {
  runBuilds(result);
} else {
  console.log(JSON.stringify(result, null, 2));
  fs.writeFileSync(STATE_FILE, JSON.stringify(result, null, 2), 'utf8');
}
