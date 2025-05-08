import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflicts
const VITE_PORT = 5173;

// Create HTTP server
const server = createServer(app);

// Start Vite dev server
console.log(`Starting Vite dev server on port ${VITE_PORT}...`);
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', `${VITE_PORT}`], {
  stdio: 'inherit',
  shell: true
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server, 
  path: '/ws'
});

// Store connected clients
const clients = new Map();

// WebSocket server event handlers
wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  console.log(`WebSocket client connected: ${clientId}`);
  
  // Add client to the map with its ID
  clients.set(ws, {
    id: clientId,
    color: '#' + Math.floor(Math.random()*16777215).toString(16) // random color
  });
  
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
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received message from ${clientId}:`, data);
      
      // Add client ID if not present
      if (!data.clientId) {
        data.clientId = clientId;
      }
      
      // Add timestamp if not present
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }
      
      // Broadcast message to all clients
      broadcastMessage(data);
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
    
    // Get clientId before removing from map
    const client = clients.get(ws);
    
    // Remove client from the map
    clients.delete(ws);
    
    // Broadcast disconnect message if we have the client info
    if (client) {
      broadcastMessage({
        type: 'user_left',
        clientId: client.id,
        message: `Client ${client.id} left`,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Function to broadcast messages to all connected clients
function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Add API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Express server is running',
    timestamp: new Date().toISOString()
  });
});

// Add a WebSocket status endpoint
app.get('/api/ws-status', (req, res) => {
  const clientList = Array.from(clients.values()).map(client => client.id);
  
  res.json({
    status: 'ok',
    message: 'WebSocket server is running',
    clientCount: clients.size,
    clients: clientList,
    timestamp: new Date().toISOString()
  });
});

// Proxy all other requests to Vite
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: false, // Don't proxy WebSockets - we handle those separately
  onProxyReq: (proxyReq, req, res) => {
    if (!req.url.startsWith('/ws')) {
      console.log(`Proxying ${req.method} ${req.url}`);
    }
  }
}));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server available at ws://0.0.0.0:${PORT}/ws`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  if (vite) {
    vite.kill();
  }
  
  process.exit(0);
});