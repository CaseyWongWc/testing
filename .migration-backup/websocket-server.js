// ESM WebSocket server
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Create the Express app
const app = express();
const PORT = process.env.PORT || 5173; // Use Vite's default port

// Create HTTP server
const server = createServer(app);

// Create WebSocket server attached to the HTTP server with path /ws
const wss = new WebSocketServer({ 
  server: server, 
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

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws`);
});