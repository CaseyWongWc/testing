import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

const app = express();
const PORT = 3000;
const VITE_PORT = 5173;

// Start Vite dev server
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', VITE_PORT.toString()], {
  stdio: 'inherit',
  shell: true
});

// Add API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Express proxy server is running',
    timestamp: new Date().toISOString()
  });
});

// Add a diagnostic endpoint for checking arrow component
app.get('/api/arrow', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Arrow component is set up',
      component: 'ArrowIcon',
      timestamp: new Date().toISOString()
    });
  });

// Proxy all other requests to Vite
app.use('/', createProxyMiddleware({
  target: `http://0.0.0.0:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url}`);
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to Vite server at http://0.0.0.0:${VITE_PORT}`);
});

// Handle shutdown
process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});