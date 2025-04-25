#!/bin/bash
pkill -f "node server.js" || true
pkill -f vite || true
sleep 2
node server.js
