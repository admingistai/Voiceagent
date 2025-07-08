#!/bin/sh
# Start script for Railway deployment

# Use Railway's PORT or default to 8000
PORT=${PORT:-8000}

echo "Starting API Gateway on port $PORT..."

# Start uvicorn with the proper port
exec python -m uvicorn api_gateway:app --host 0.0.0.0 --port $PORT