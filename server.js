import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5174;
const isProduction = process.env.NODE_ENV === 'production';

const server = createServer(app);

let vite;
if (!isProduction) {
  const { createProxyMiddleware } = await import('http-proxy-middleware');
  console.log(`Starting Vite dev server on port ${VITE_PORT}...`);
  vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', `${VITE_PORT}`], {
    stdio: 'inherit',
    shell: true
  });
}

// Create WebSocket server on the same server (no need for a separate port)
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

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createProxyMiddleware } = await import('http-proxy-middleware');
  app.use('/', createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: false,
    onProxyReq: (proxyReq, req, res) => {
      if (!req.url.startsWith('/ws')) {
        console.log(`Proxying ${req.method} ${req.url}`);
      }
    }
  }));
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server available at ws://0.0.0.0:${PORT}/ws`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // In non-production, vite might be running
  if (process.env.NODE_ENV !== 'production' && typeof vite !== 'undefined') {
    vite.kill();
  }
  
  process.exit(0);
});