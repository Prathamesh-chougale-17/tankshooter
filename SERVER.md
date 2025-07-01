# Tank Shooter Multiplayer Server Setup

## Running the Server

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the WebSocket server:**

   ```bash
   pnpm run server
   ```

   Or for development with auto-restart:

   ```bash
   pnpm run server:dev
   ```

3. **Start the Next.js client:**

   ```bash
   pnpm run dev
   ```

## Server Details

- **Port**: 3001
- **WebSocket URL**: `ws://localhost:3001/ws`
- **Features**:
  - Real-time multiplayer tank battles
  - Game room management (up to 10 players per room)
  - Chat system
  - Bullet physics simulation
  - Player statistics tracking
  - Automatic room cleanup

## Game Flow

1. Players connect to the WebSocket server
2. Server assigns players to available game rooms
3. Real-time synchronization of:
   - Tank positions and rotations
   - Bullet trajectories
   - Player statistics (health, score, kills)
   - Chat messages
4. Server handles game physics and collision detection
5. Automatic cleanup of inactive players and rooms

## Architecture

The server uses a room-based architecture where:

- Each room supports up to 10 concurrent players
- Rooms are automatically created and destroyed as needed
- Game state is synchronized at 60fps
- Inactive connections are cleaned up after 30 seconds
- Empty rooms are removed after 1 minute of inactivity

## Commands

- `pnpm run server` - Start the production server
- `pnpm run server:dev` - Start the development server with hot reload
- `pnpm run dev` - Start the Next.js client application
- `pnpm run build` - Build the client for production
