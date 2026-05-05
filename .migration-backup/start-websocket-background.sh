#!/bin/bash
echo "Stopping any existing node processes..."
pkill -f "node server.js" || true
sleep 1
echo "Starting WebSocket Server on port 3001..."
nohup node server.js > websocket.log 2>&1 &
echo "WebSocket server started with PID: $!"
echo "You can view logs with: cat websocket.log"
