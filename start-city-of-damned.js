// This script starts the server with a focus on running the City of the Damned component
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Setup WebSocket server on a specific path to avoid conflicts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');
    
    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connect',
      message: 'Connected to WebSocket server',
      timestamp: new Date().toISOString()
    }));
    
    // Ping clients every 30 seconds to keep connections alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);
    
    ws.on('message', function incoming(message) {
      console.log('Received message:', message.toString());
      
      try {
        const parsedMessage = JSON.parse(message.toString());
        
        // Handle message types
        if (parsedMessage.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
        
        // Broadcast to all clients
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === client.OPEN) {
            client.send(message.toString());
          }
        });
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
    
    ws.on('close', function() {
      console.log('WebSocket client disconnected');
      clearInterval(pingInterval);
    });
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);
  
  // Set cityOfDamned route to show this component specifically
  app.get('/cityofdamned', (req, res) => {
    res.redirect('/?game=cityofdamned');
  });

  // Start the server
  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`City of the Damned server listening on port ${port}`);
    console.log(`WebSocket server running on ws://localhost:${port}/ws`);
    console.log(`Visit http://localhost:${port}/cityofdamned to play the game`);
  });
}

createServer().catch((e) => {
  console.error('Error starting server:', e);
});