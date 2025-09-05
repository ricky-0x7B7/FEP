#!/bin/bash

# Function to cleanup background processes
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Error: Virtual environment not found. Please run ./install.sh first"
    exit 1
fi

# Check if ports are available
if lsof -i :5001 >/dev/null 2>&1; then
    echo "Warning: Port 5001 is already in use. Backend may fail to start."
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "Warning: Port 5173 is already in use. Frontend may fail to start."
fi

# Start backend (Python Flask)
echo "Starting backend on http://localhost:5001..."
source venv/bin/activate && cd backend && python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "Error: Backend failed to start"
    exit 1
fi

# Start frontend (Vite React)
echo "Starting frontend on http://localhost:5173..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo "Both services started successfully!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:5001"
echo "Press Ctrl+C to stop both services"

# Wait for processes to keep terminal alive
wait $BACKEND_PID $FRONTEND_PID
