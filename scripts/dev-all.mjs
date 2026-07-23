import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'inherit', env: process.env }),
];

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill(signal);
}

for (const child of children) {
  child.once('exit', (code, signal) => {
    if (!stopping) {
      stop();
      process.exitCode = code ?? (signal ? 1 : 0);
    }
  });
}
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
