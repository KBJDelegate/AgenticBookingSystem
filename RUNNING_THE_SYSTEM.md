# How to Run the KF Insurance Booking System

## Quick Start

### 1. Start the Backend (Terminal 1)
```bash
cd backend
npm install        # First time only
npm run dev        # Starts on port 3001
```

You should see:
```
Server is running on port 3001
Environment: development
Press CTRL-C to stop
```

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install        # First time only
npm run dev        # Starts on port 5173
```

## Troubleshooting

### Port Already in Use Error

If you get "address already in use :::3001", there's a process already using that port.

**Solution:**
```bash
# Option 1: Kill the process on port 3001
npx kill-port 3001

# Option 2: Find and kill manually
lsof -i :3001                    # Find process
kill -9 <PID>                    # Kill it

# Option 3: Kill all node processes (careful!)
killall node

# Option 4: Change the port in backend/.env
PORT=3002                        # Use different port
```

### Backend Won't Start

1. Check if `backend/.env` file exists
2. Make sure you're in the `backend` directory
3. Run `npm install` if you haven't already
4. Check the logs for specific errors

### Frontend Won't Connect to Backend

1. Make sure backend is running on port 3001
2. Check CORS settings in backend
3. Verify `VITE_API_URL` in frontend `.env`

## Testing the System

### Test Backend is Running:
```bash
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...,
  "environment": "development"
}
```

### Test Frontend is Running:
Open browser to: http://localhost:5173

## Development Tips

1. **Use separate terminals** - One for backend, one for frontend
2. **Watch the logs** - Both servers show helpful error messages
3. **Hot Reload** - Both frontend and backend auto-reload on file changes
4. **API Testing** - Use Postman or curl to test backend endpoints directly

## Ports Used

- **3001**: Backend API server
- **5173**: Frontend React development server
- **6379**: Redis (if using - optional)

## Stopping the Servers

- Press `CTRL+C` in each terminal to stop the servers
- Or close the terminal windows

## Production Deployment

For production, use:
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

Or use Docker:
```bash
docker-compose up
```