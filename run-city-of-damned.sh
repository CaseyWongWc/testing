#!/bin/bash
echo "+---------------------------------------------------------+"
echo "|          City of the Damned - Standalone Mode           |"
echo "+---------------------------------------------------------+"
echo "Starting City of the Damned game server..."
echo "Opening server on port 3000..."

# Determine the Replit URL if running on Replit
if [ -n "$REPL_ID" ] && [ -n "$REPL_OWNER" ]; then
  echo "Running on Replit. Your game will be available at:"
  echo "https://${REPL_ID}.id.repl.co/?game=cityofdamned"
  echo "Or via the dedicated URL: https://${REPL_ID}.id.repl.co/city-of-damned.html"
else
  echo "You can access the City of the Damned directly at: http://localhost:3000/?game=cityofdamned"
  echo "Or via the dedicated URL: http://localhost:3000/city-of-damned.html"
fi

echo "Press Ctrl+C to stop the server"

# Set the URL parameter to automatically load City of the Damned
export LOAD_CITY_OF_DAMNED=true

# Create a cityresults directory if it doesn't exist
if [ ! -d "cityresults" ]; then
  mkdir -p cityresults
  echo "Created cityresults directory for high scores"
fi

# Start the node server with the main server.js file
exec node server.js