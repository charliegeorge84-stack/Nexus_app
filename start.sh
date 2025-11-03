#!/bin/bash

echo "🚀 Starting Process Change Management Platform..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "process-change-management" 2>/dev/null
sleep 2

# Start backend server
echo "🔧 Starting backend server..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:5000"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running on http://localhost:3000"
else
    echo "⚠️  Frontend server may still be starting..."
fi

echo ""
echo "🎉 Process Change Management Platform is starting!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo ""
echo "🔑 Login Credentials:"
echo "   Email: admin@processmanagement.com"
echo "   Password: password"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait
