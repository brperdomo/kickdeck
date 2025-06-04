#!/bin/bash

echo "Starting Soccer Facility Management Platform..."

# Kill any existing processes
pkill -f "node.*server" 2>/dev/null || true
pkill -f "working-server" 2>/dev/null || true

# Start the working server
node working-server.mjs