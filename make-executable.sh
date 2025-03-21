#!/bin/bash
# Make important scripts and entry points executable
set -e

echo "Making scripts executable..."

# Make all shell scripts executable
find . -name "*.sh" -exec chmod +x {} \;

# Make entry points executable
chmod +x index.js index.cjs replit.js replit.cjs 2>/dev/null || true

echo "Done making scripts executable!"