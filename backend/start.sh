#!/bin/bash
# Render start script for Analyzr backend
# This script is used when render.yaml's startCommand is not sufficient

# Exit on error
set -e

# Ensure upload and sessions directories exist
mkdir -p ./uploads ./sessions

# Start the server with gunicorn + uvicorn workers
exec gunicorn main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile -
