import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Check if we're running in direct npm run dev mode
const isDirectViteMode = process.argv.includes('--direct-vite');

// Start the Vite development server if we're not in direct mode
let vite;
if (!isDirectViteMode) {
  console.log('Starting Vite development server...');
  vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5174'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_SOME_KEY: 'force-port-5174' }
  });
} else {
  console.log('Running in direct Vite mode, skipping Vite launch');
}

// Give Vite a moment to start
setTimeout(() => {
  const app = express();
  const port = 5000;

  // Add API endpoints first so they're not proxied
  
  // Add a diagnostic endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Express proxy server is running',
      vitePort: 5174,
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

  // Proxy all other requests to the Vite dev server
  app.use('/', createProxyMiddleware({
    target: 'http://0.0.0.0:5174', // Using 0.0.0.0 instead of localhost for better container/VM compatibility
    changeOrigin: true,
    ws: true, // proxy websockets
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying request: ${req.method} ${req.url}`);
    },
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
    console.log(`Proxying requests to Vite development server at http://0.0.0.0:5174`);
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