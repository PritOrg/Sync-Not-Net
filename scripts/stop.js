const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const runtimeDir = path.join(repoRoot, '.runtime');

const services = [
  {
    name: 'backend',
    pidFile: path.join(runtimeDir, 'backend.pid')
  },
  {
    name: 'frontend',
    pidFile: path.join(runtimeDir, 'frontend.pid')
  }
];

function stopService(service) {
  if (!fs.existsSync(service.pidFile)) {
    console.log(`${service.name} is not running from the root launcher.`);
    return;
  }

  const pid = Number.parseInt(fs.readFileSync(service.pidFile, 'utf8').trim(), 10);
  fs.rmSync(service.pidFile, { force: true });

  if (!pid) {
    console.log(`${service.name} PID file was invalid and has been removed.`);
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Stopped ${service.name} (PID ${pid}).`);
  } catch (error) {
    if (error.code === 'ESRCH') {
      console.log(`${service.name} was not running, and its stale PID file was removed.`);
      return;
    }

    throw error;
  }
}

for (const service of services) {
  stopService(service);
}