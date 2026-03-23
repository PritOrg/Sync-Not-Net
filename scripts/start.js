const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'api');
const frontendDir = path.join(repoRoot, 'pro');
const runtimeDir = path.join(repoRoot, '.runtime');
const setupOnly = process.argv.includes('--setup-only');
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

const services = [
  {
    name: 'backend',
    directory: apiDir,
    url: 'http://localhost:5000',
    port: 5000,
    pidFile: path.join(runtimeDir, 'backend.pid')
  },
  {
    name: 'frontend',
    directory: frontendDir,
    url: 'http://localhost:3000',
    port: 3000,
    pidFile: path.join(runtimeDir, 'frontend.pid')
  }
];

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function removeStalePidFile(service) {
  if (!fs.existsSync(service.pidFile)) {
    return;
  }

  const pid = Number.parseInt(fs.readFileSync(service.pidFile, 'utf8').trim(), 10);
  if (!pid) {
    fs.rmSync(service.pidFile, { force: true });
    return;
  }

  try {
    process.kill(pid, 0);
  } catch (error) {
    if (error.code === 'ESRCH') {
      fs.rmSync(service.pidFile, { force: true });
      return;
    }
  }
}

function ensureServiceNotAlreadyManaged(service) {
  removeStalePidFile(service);

  if (!fs.existsSync(service.pidFile)) {
    return;
  }

  const pid = fs.readFileSync(service.pidFile, 'utf8').trim();
  throw new Error(`${service.name} is already running with PID ${pid}. Run \`npm run stop\` from the repo root before starting again.`);
}

function checkPortAvailability(service) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve({
          available: false,
          message: `Port ${service.port} is already in use, so ${service.name} cannot start. Stop the process using ${service.url} or change the port configuration before running \`npm start\`.`
        });
        return;
      }

      resolve({
        available: false,
        message: `Port ${service.port} could not be checked for ${service.name}: ${error.message}`
      });
    });

    server.listen(service.port, '0.0.0.0', () => {
      server.close(() => resolve({ available: true }));
    });
  });
}

async function assertPortsAvailable() {
  const results = await Promise.all(services.map(checkPortAvailability));
  const failures = results.filter((result) => !result.available);

  if (failures.length === 0) {
    return;
  }

  const errorMessage = failures.map((failure) => `- ${failure.message}`).join('\n');
  throw new Error(`Startup aborted because required ports are unavailable:\n${errorMessage}`);
}

function ensureEnvFiles() {
  const apiEnv = path.join(apiDir, '.env');
  const apiEnvExample = path.join(apiDir, '.env.example');
  const frontendEnv = path.join(frontendDir, '.env');

  if (!fs.existsSync(apiEnv) && fs.existsSync(apiEnvExample)) {
    fs.copyFileSync(apiEnvExample, apiEnv);
    console.log('Created api/.env from api/.env.example. Review the values before using it outside local development.');
  }

  ensureFile(frontendEnv, 'REACT_APP_BACKEND_URL=http://localhost:5000\n');
}

function runNpm(args, cwd, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, args, {
      cwd,
      stdio: 'inherit',
      shell: isWindows
    });

    child.on('error', (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function ensureDependencies(service) {
  const nodeModulesDir = path.join(service.directory, 'node_modules');
  if (fs.existsSync(nodeModulesDir)) {
    console.log(`${service.name} dependencies already installed.`);
    return;
  }

  console.log(`Installing ${service.name} dependencies...`);
  await runNpm(['install'], service.directory, `${service.name} install`);
}

function startService(service) {
  const child = spawn(npmCommand, ['run', 'start'], {
    cwd: service.directory,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows
  });

  fs.writeFileSync(service.pidFile, `${child.pid}\n`, 'utf8');

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${service.name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${service.name}] ${chunk}`);
  });

  child.on('error', (error) => {
    console.error(`${service.name} failed to start: ${error.message}`);
  });

  return child;
}

async function main() {
  ensureDirectory(runtimeDir);
  ensureEnvFiles();

  for (const service of services) {
    await ensureDependencies(service);
  }

  if (setupOnly) {
    console.log('Setup complete. Run npm start from the repo root to launch both apps.');
    return;
  }

  for (const service of services) {
    ensureServiceNotAlreadyManaged(service);
  }

  await assertPortsAvailable();

  console.log('Starting Sync-Not-Net services...');
  services.forEach((service) => {
    console.log(`${service.name}: ${service.url}`);
  });

  const children = services.map(startService);
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const child of children) {
      if (!child.killed) {
        child.kill(signal);
      }
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  children.forEach((child, index) => {
    const service = services[index];
    child.on('exit', (code, signal) => {
      if (!shuttingDown) {
        shutdown('SIGTERM');
      }

      if (signal) {
        console.log(`${service.name} stopped by signal ${signal}.`);
      } else if (code !== 0 && code !== null) {
        console.error(`${service.name} exited with code ${code}.`);
        process.exitCode = code;
      }

      fs.rmSync(service.pidFile, { force: true });
    });
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});