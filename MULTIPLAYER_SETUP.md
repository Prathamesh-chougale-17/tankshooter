# Tank Shooter Multiplayer Setup

## Features Added

- **Play Mode Selection**: Users can now choose between:
  - **Auto Select**: Automatically chooses multiplayer if server is online, bot arena if offline
  - **Multiplayer**: Play with real players online (requires server connection)
  - **Bot Arena**: Practice against AI opponents (works offline)

## How to Test Multiplayer

### 1. Start the WebSocket Server

```bash
# In terminal 1:
pnpm run server:dev
```

The server will start on `ws://localhost:3001/ws`

### 2. Start the Client Application

```bash
# In terminal 2:
pnpm run dev
```

The client will be available at `http://localhost:3000`

### 3. Test Different Modes

#### Bot Arena Mode

1. Select "Bot Arena" in the play mode dropdown
2. The game will run with AI bots regardless of server status
3. No multiplayer communication

#### Multiplayer Mode

1. Make sure the server is running
2. Select "Multiplayer" in the play mode dropdown
3. Open multiple browser tabs/windows to test with multiple players
4. Players will see each other in real-time
5. Chat functionality is available
6. Real-time leaderboard shows all connected players

#### Auto Select Mode

1. Select "Auto Select" (default)
2. If server is running: automatically uses multiplayer mode
3. If server is offline: automatically uses bot arena mode

## Visual Indicators

### Main Menu

- Connection status indicator (green dot = online, gray dot = offline)
- Server stats show live player counts when connected
- Button text changes based on selected mode

### In-Game

- Top-right corner shows connection status and current play mode
- Leaderboard prioritizes real players over bots in multiplayer mode
- Chat panel is available in multiplayer mode

## Server Features

- Room-based gameplay
- Real-time player synchronization
- Bullet synchronization
- Chat system
- Player join/leave notifications
- Automatic cleanup of inactive players and rooms

## Troubleshooting

- If "Multiplayer" is selected but server is offline, user gets an error message
- Game gracefully falls back to bot-only mode when multiplayer fails
- All modes require wallet connection and gas fee payment
