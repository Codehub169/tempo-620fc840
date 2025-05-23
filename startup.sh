#!/bin/bash
# This script starts the Kids Game Dashboard application.

# Navigate to the directory where the script is located (optional, usually run from project root)
# cd "$(dirname "$0")"

# Print a message to the console
echo "Starting Kids Game Dashboard server..."
echo "Application will be available at http://localhost:9000"

# Start a simple HTTP server using Python 3 on port 9000.
# Python 3 and its http.server module are assumed to be available.
python3 -m http.server 9000

# If python3 is not found, you might need to use 'python' instead:
# python -m http.server 9000

echo "Server stopped."