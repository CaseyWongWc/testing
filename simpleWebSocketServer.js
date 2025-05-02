// Simple WebSocket Server
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Set up WebSocket server on a specific path to avoid conflicts with Vite HMR
const wss = new WebSocketServer({ 
  server: server, 
  path: '/ws'  // Specific path for our WebSocket server
});

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket server');
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to WebSocket server',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Echo the message back to the client
      ws.send(JSON.stringify({
        type: 'echo',
        data: data,
        timestamp: new Date().toISOString()
      }));
      
      // Broadcast to all other clients if it's a broadcast message
      if (data.type === 'broadcast') {
        broadcastMessage({
          type: 'broadcast',
          from: 'server',
          data: data.data,
          timestamp: new Date().toISOString()
        }, ws);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket server');
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast a message to all clients except the sender
function broadcastMessage(message, excludeWs) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Simple API endpoint to check server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Simple WebSocket server is running',
    timestamp: new Date().toISOString(),
    clientCount: clients.size
  });
});

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple WebSocket server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
});