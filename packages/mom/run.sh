#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
LOG_DIR="$SCRIPT_DIR/logs"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Error: .env file not found at $SCRIPT_DIR/.env"
    exit 1
fi

# Ensure directories exist
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

# Clean up logs older than 7 days
find "$LOG_DIR" -name "mom-*.log" -mtime +7 -delete 2>/dev/null || true

# Create today's log file (append mode - survives restarts)
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/mom-$TODAY.log"

# Check if Docker container exists, create if not
if ! sudo docker ps -a --format '{{.Names}}' | grep -q '^mom-sandbox$'; then
    echo "Creating Docker sandbox container..."
    sudo docker run -d \
        --name mom-sandbox \
        -v "$DATA_DIR:/workspace" \
        alpine:latest \
        tail -f /dev/null
    echo "Container created."
fi

# Start container if not running
if ! sudo docker ps --format '{{.Names}}' | grep -q '^mom-sandbox$'; then
    echo "Starting Docker sandbox container..."
    sudo docker start mom-sandbox
fi

echo "Starting mom (Docker sandbox mode)..."
echo "Logging to: $LOG_FILE"
echo ""
echo "=== Mom started at $(date) ===" >> "$LOG_FILE"

# Run with output to both console and log file
# Use unbuffered mode to ensure real-time logging
node "$SCRIPT_DIR/dist/main.js" --sandbox=docker:mom-sandbox "$DATA_DIR" 2>&1 | tee -a "$LOG_FILE"
