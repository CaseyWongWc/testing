#!/bin/bash
clear
echo "+---------------------------------------------------------+"
echo "|          City of the Damned - Standalone Mode           |"
echo "+---------------------------------------------------------+"
echo "Starting City of the Damned game server..."

# Kill any existing Node.js processes that might be using our ports
echo "Checking for existing processes..."
pkill -f "node server.js" || echo "No existing server processes found"
sleep 1

# Create a cityresults directory if it doesn't exist
if [ ! -d "cityresults" ]; then
  mkdir -p cityresults
  echo "Created cityresults directory for high scores"
fi

# Set environment variables for the game
export LOAD_CITY_OF_DAMNED=true
export PORT=5000  # Changed to 5000 to avoid conflicts

# Determine the Replit URL if running on Replit
if [ -n "$REPL_ID" ] && [ -n "$REPL_OWNER" ]; then
  REPLIT_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
  echo "Running on Replit. Your game will be available at:"
  echo "${REPLIT_URL}/?game=cityofdamned"
  echo "Or via the dedicated URL: ${REPLIT_URL}/city-of-damned.html"
  
  # Set this to tell the WebSocket client to use secure connections
  export USE_SECURE_WEBSOCKET=true
else
  echo "You can access the City of the Damned directly at: http://localhost:5000/?game=cityofdamned"
  echo "Or via the dedicated URL: http://localhost:5000/city-of-damned.html"
fi

echo ""
echo "Game Controls:"
echo "  WASD - Move player"
echo "  Mouse - Aim"
echo "  Left Click - Primary weapon"
echo "  Right Click - Secondary weapon"
echo "  E - Melee attack"
echo "  R - Reload"
echo "  Space - Dodge"
echo "  Tab - Switch player"
echo "  ESC - Return control to AI"
echo ""
echo "Press Ctrl+C to stop the server"
echo "+---------------------------------------------------------+"

# Start the node server with the main server.js file
exec node server.js