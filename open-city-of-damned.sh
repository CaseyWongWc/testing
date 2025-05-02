#!/bin/bash
clear
echo "+---------------------------------------------------------+"
echo "|          City of the Damned - Game Launcher             |"
echo "+---------------------------------------------------------+"

# Create cityresults directory if it doesn't exist
if [ ! -d "cityresults" ]; then
  mkdir -p cityresults
  echo "Created cityresults directory for high scores"
fi

# Determine the Replit URL if running on Replit
if [ -n "$REPL_ID" ] && [ -n "$REPL_OWNER" ] && [ -n "$REPL_SLUG" ]; then
  GAME_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co/?game=cityofdamned"
  echo "Running on Replit. Your game is available at:"
else
  GAME_URL="http://localhost:5173/?game=cityofdamned"
  echo "Running locally. Your game is available at:"
fi

echo "$GAME_URL"
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
echo "Open this URL in your browser to play the game."
echo "+---------------------------------------------------------+"

# Check if we can automatically open a browser
if [ -x "$(command -v xdg-open)" ]; then
  echo "Attempting to open browser automatically..."
  xdg-open "$GAME_URL" 2>/dev/null || echo "Could not open browser automatically"
elif [ -x "$(command -v open)" ]; then
  echo "Attempting to open browser automatically..."
  open "$GAME_URL" 2>/dev/null || echo "Could not open browser automatically"
else
  echo "Please copy and paste the URL into your browser to play."
fi