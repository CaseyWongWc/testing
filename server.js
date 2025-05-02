import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable or default to 5000
const VITE_PORT = 5173;
const server = http.createServer(app);

console.log(`Starting server with PORT=${PORT} and VITE_PORT=${VITE_PORT}`);

// Start Vite dev server with proper configuration
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

// Add a diagnostic endpoint for City of the Damned
app.get('/api/city-of-damned', (req, res) => {
  res.json({
    status: 'ok',
    message: 'City of the Damned API endpoint is active',
    timestamp: new Date().toISOString()
  });
});

// Add a configuration endpoint to expose server environment variables to the client
app.get('/api/config', (req, res) => {
  res.json({
    useSecureWebsocket: process.env.USE_SECURE_WEBSOCKET === 'true',
    loadCityOfDamned: process.env.LOAD_CITY_OF_DAMNED === 'true',
    serverPort: process.env.PORT || 3001,
    timestamp: new Date().toISOString()
  });
});

// Handle the city of damned HTML page directly with Express
app.get('/city-of-damned.html', (req, res) => {
  res.sendFile('city-of-damned.html', { root: '.' });
});

// Proxy all other requests to Vite with specific WebSocket handling
app.use('/', createProxyMiddleware({
  target: `http://0.0.0.0:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  secure: false,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url}`);
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log(`Proxying WebSocket: ${req.url}`);
    socket.on('error', (err) => console.log('WebSocket error:', err));
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Proxy error', 
        message: err.message,
        url: req.url
      }));
    }
  }
}));

// Set up WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Basic room management
const rooms = new Map();
const players = new Map();
let nextPlayerId = 1;
let nextRoomId = 1;

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getOrCreateDefaultRoom() {
  const defaultRoomId = 'default';
  if (!rooms.has(defaultRoomId)) {
    rooms.set(defaultRoomId, {
      id: defaultRoomId,
      code: 'DEFAULT',
      players: new Set(),
      isDefault: true,
      createdAt: new Date().toISOString()
    });
  }
  return rooms.get(defaultRoomId);
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket server');
  ws.isAlive = true;
  
  // Send welcome message to the client
  ws.send(JSON.stringify({
    type: 'connect',
    message: 'Connected to WebSocket server',
    timestamp: new Date().toISOString()
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'game_update':
          // Broadcast game updates to all connected clients
          broadcastMessage({
            type: 'game_update',
            data: data.data,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'player_action':
          // Handle player actions (movement, combat, etc.)
          broadcastMessage({
            type: 'player_action',
            playerId: data.playerId,
            action: data.action,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'ping':
          // Respond to ping messages
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'join_game':
          // Player joining a game
          const playerName = data.name || `Player ${nextPlayerId}`;
          const playerId = nextPlayerId++;
          let room;
          
          if (data.roomCode) {
            // Find room by code
            room = Array.from(rooms.values()).find(r => r.code === data.roomCode);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'join_response',
                success: false,
                error: 'Room not found',
                timestamp: new Date().toISOString()
              }));
              return;
            }
          } else {
            // Join the default room if no room code is provided
            room = getOrCreateDefaultRoom();
          }
          
          // Add player to the room
          room.players.add(playerId);
          
          // Store player info
          players.set(playerId, {
            id: playerId,
            name: playerName,
            roomId: room.id,
            ws: ws,
            joinedAt: new Date().toISOString()
          });
          
          // Associate the WebSocket connection with the player
          ws.playerId = playerId;
          
          // Send success response
          ws.send(JSON.stringify({
            type: 'join_response',
            success: true,
            playerId: playerId,
            room: {
              id: room.id,
              code: room.code,
              playerCount: room.players.size
            },
            timestamp: new Date().toISOString()
          }));
          
          // Broadcast updated player count to all players in the room
          broadcastToRoom(room.id, {
            type: 'room_update',
            roomId: room.id,
            playerCount: room.players.size,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'leave_game':
          if (ws.playerId) {
            const player = players.get(ws.playerId);
            if (player) {
              const room = rooms.get(player.roomId);
              if (room) {
                room.players.delete(ws.playerId);
                
                // Broadcast updated player count
                broadcastToRoom(room.id, {
                  type: 'room_update',
                  roomId: room.id,
                  playerCount: room.players.size,
                  timestamp: new Date().toISOString()
                });
                
                // Clean up empty non-default rooms
                if (room.players.size === 0 && !room.isDefault) {
                  rooms.delete(room.id);
                }
              }
              
              players.delete(ws.playerId);
              delete ws.playerId;
              
              // Confirm leave
              ws.send(JSON.stringify({
                type: 'leave_response',
                success: true,
                timestamp: new Date().toISOString()
              }));
            }
          }
          break;
          
        case 'create_room':
          const roomId = `room_${nextRoomId++}`;
          const roomCode = generateRoomCode();
          
          rooms.set(roomId, {
            id: roomId,
            code: roomCode,
            players: new Set(),
            isDefault: false,
            createdAt: new Date().toISOString()
          });
          
          ws.send(JSON.stringify({
            type: 'create_room_response',
            success: true,
            room: {
              id: roomId,
              code: roomCode
            },
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'list_rooms':
          const roomList = Array.from(rooms.values()).map(room => ({
            id: room.id,
            code: room.code,
            playerCount: room.players.size,
            isDefault: room.isDefault
          }));
          
          ws.send(JSON.stringify({
            type: 'room_list',
            rooms: roomList,
            timestamp: new Date().toISOString()
          }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle pings to keep connection alive
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket server');
    
    // Handle player leaving their room on disconnect
    if (ws.playerId) {
      const player = players.get(ws.playerId);
      if (player) {
        const room = rooms.get(player.roomId);
        if (room) {
          room.players.delete(ws.playerId);
          
          // Broadcast updated player count
          broadcastToRoom(room.id, {
            type: 'room_update',
            roomId: room.id,
            playerCount: room.players.size,
            timestamp: new Date().toISOString()
          });
          
          // Clean up empty non-default rooms
          if (room.players.size === 0 && !room.isDefault) {
            rooms.delete(room.id);
          }
        }
        
        players.delete(ws.playerId);
      }
    }
  });
});

// Broadcast message to all connected clients
function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Broadcast message to all players in a specific room
function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.players.forEach(playerId => {
    const player = players.get(playerId);
    if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to Vite server at http://0.0.0.0:${VITE_PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
});

// Handle shutdown
process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});