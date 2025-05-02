import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = 5000;
const VITE_PORT = 5173;
const server = http.createServer(app);

// Start Vite dev server
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', VITE_PORT.toString()], {
  stdio: 'inherit',
  shell: true
});

// Proxy all requests to Vite
app.use('/', createProxyMiddleware({
  target: `http://0.0.0.0:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url}`);
  }
}));

// Set up WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket server');
  ws.isAlive = true;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to Vite server at http://0.0.0.0:${VITE_PORT}`);
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});