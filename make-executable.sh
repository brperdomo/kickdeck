#!/bin/bash
# Make all the shell scripts executable

echo "Making all shell scripts executable..."
find . -name "*.sh" -type f -exec chmod +x {} \;
echo "Done!"

# List all now-executable scripts
echo 
echo "Executable scripts:"
find . -name "*.sh" -type f -ls | awk '{print $11}'