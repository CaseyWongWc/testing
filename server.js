import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Start the Vite development server
console.log('Starting Vite development server...');
const vite = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

// Give Vite a moment to start
setTimeout(() => {
  const app = express();
  const port = 5000;

  // Proxy all requests to the Vite dev server
  // Vite usually runs on port 5173, but it may select another port if 5173 is in use
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true, // proxy websockets
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error: Could not connect to Vite development server. Please check console logs.');
    }
  }));

  // Error handling in case port 5000 is already in use
  app.listen(port, '0.0.0.0', () => {
    console.log(`Express proxy server running at http://localhost:${port}`);
    console.log(`Proxying requests to Vite development server`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please free up the port or use a different one.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}, 2000); // Wait 2 seconds for Vite to start

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('Shutting down...');
  vite && vite.kill();
  process.exit(0);
});