import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
// Use Replit environment port or fall back to a default
const PORT = process.env.PORT || 3000;
const VITE_PORT = 5173;

// Create an HTTP server instance from the Express app
const httpServer = http.createServer(app);

// Start Vite dev server
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', VITE_PORT.toString()], {
  stdio: 'inherit',
  shell: true
});

// Setup WebSocket server on a distinct path
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Store connected clients
const clients = new Set();

// WebSocket server event handlers
wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  console.log(`WebSocket client connected: ${clientId}`);
  
  // Add client to the set with its ID
  clients.add({ id: clientId, ws });
  
  // Send welcome message with client ID
  ws.send(JSON.stringify({
    type: 'connect',
    clientId: clientId,
    message: 'Welcome to the WebSocket server',
    timestamp: new Date().toISOString()
  }));
  
  // Broadcast to all clients about new connection
  broadcastMessage({
    type: 'user_joined',
    clientId: clientId,
    message: `Client ${clientId} joined`,
    timestamp: new Date().toISOString()
  });
  
  // Handle incoming messages
  ws.on('message', (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
      console.log(`Received message from ${clientId}:`, parsedMessage);
      
      // Add client ID and timestamp if not present
      if (!parsedMessage.clientId) {
        parsedMessage.clientId = clientId;
      }
      if (!parsedMessage.timestamp) {
        parsedMessage.timestamp = new Date().toISOString();
      }
      
      // Broadcast message to all clients
      broadcastMessage(parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format. Expected JSON.',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    
    // Remove client from the set
    for (const client of clients) {
      if (client.id === clientId) {
        clients.delete(client);
        break;
      }
    }
    
    // Broadcast disconnect message
    broadcastMessage({
      type: 'user_left',
      clientId: clientId,
      message: `Client ${clientId} left`,
      timestamp: new Date().toISOString()
    });
  });
});

// Function to broadcast messages to all connected clients
function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

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

// Add a WebSocket status endpoint
app.get('/api/ws-status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WebSocket server is running',
    clients: Array.from(clients).map(client => client.id),
    timestamp: new Date().toISOString()
  });
});

// Handle WebSocket routes separately - no need to proxy WebSocket to itself
// since the WebSocketServer is already attached to the same HTTP server

// Proxy all other requests to Vite
const httpProxy = createProxyMiddleware('/', {
  target: `http://0.0.0.0:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    // Don't proxy WebSocket connections that should be handled by our server
    if (req.url.startsWith('/ws')) {
      console.log(`Not proxying WebSocket request: ${req.method} ${req.url}`);
      return;
    }
    console.log(`Proxying ${req.method} ${req.url}`);
  }
});

// Use the proxy for all non-API routes
app.use('/', httpProxy);

// Use the HTTP server to listen instead of the Express app
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
  console.log(`Proxying to Vite server at http://0.0.0.0:${VITE_PORT}`);
});

// Handle shutdown
process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});