// Development script to run both Vite and WebSocket servers
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting WebSocket server...');
const websocketServer = spawn('node', ['websocket-server.js'], {
  stdio: 'inherit',
  shell: true
});

console.log('Starting Vite dev server...');
const viteServer = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

// Handle SIGINT and clean up child processes
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  websocketServer.kill();
  viteServer.kill();
  process.exit(0);
});

// Log when child processes exit
websocketServer.on('close', (code) => {
  console.log(`WebSocket server exited with code ${code}`);
});

viteServer.on('close', (code) => {
  console.log(`Vite server exited with code ${code}`);
});