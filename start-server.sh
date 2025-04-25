#!/bin/bash
echo "Starting AI Simulation Framework..."
pkill -f "node server.js" || true
pkill -f "vite" || true
node server.js &
npm run dev &
wait