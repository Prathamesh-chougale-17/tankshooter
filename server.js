import { createServer } from "http";
import { WebSocketServer } from "ws";
// Server state
const gameRooms = new Map();
const clients = new Map();
const PORT = 10000;
// Create HTTP server
const server = createServer();
// Create WebSocket server
const wss = new WebSocketServer({
    server,
    path: "/ws",
});
// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function createGameRoom() {
    return {
        id: generateId(),
        tanks: new Map(),
        bullets: [],
        chatMessages: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
    };
}
function findOrCreateRoom() {
    // Find a room with less than 10 players
    for (const [roomId, room] of gameRooms) {
        if (room.tanks.size < 10) {
            room.lastActivity = Date.now();
            return roomId;
        }
    }
    // Create new room if none available
    const newRoom = createGameRoom();
    gameRooms.set(newRoom.id, newRoom);
    return newRoom.id;
}
function broadcastToRoom(roomId, message, excludePlayerId) {
    const room = gameRooms.get(roomId);
    if (!room)
        return;
    for (const [playerId, client] of clients) {
        if (client.roomId === roomId && playerId !== excludePlayerId) {
            if (client.ws.readyState === 1) {
                // WebSocket.OPEN
                try {
                    client.ws.send(JSON.stringify(message));
                }
                catch (error) {
                    console.error("Error sending message to client:", error);
                }
            }
        }
    }
}
function updateGameState(roomId) {
    const room = gameRooms.get(roomId);
    if (!room)
        return;
    // Update bullets (simple physics simulation)
    const currentTime = Date.now();
    room.bullets = room.bullets.filter((bullet) => {
        // Remove bullets older than 5 seconds
        if (currentTime - bullet.timestamp > 5000) {
            return false;
        }
        // Update bullet position
        bullet.position.x += bullet.velocity.x * 0.016; // 60fps approximation
        bullet.position.y += bullet.velocity.y * 0.016;
        // Remove bullets that are too far from center
        const distance = Math.sqrt(bullet.position.x * bullet.position.x +
            bullet.position.y * bullet.position.y);
        return distance < 2000;
    });
    // Broadcast updated game state to all clients in room
    broadcastToRoom(roomId, {
        type: "gameStateUpdate",
        tanks: Array.from(room.tanks.values()),
        bullets: room.bullets,
        timestamp: currentTime,
    });
}
function handlePlayerJoin(playerId, playerName, tankClass) {
    const roomId = findOrCreateRoom();
    const room = gameRooms.get(roomId);
    if (!room)
        return;
    // Create new tank for player
    const tank = {
        id: playerId,
        name: playerName,
        position: {
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
        },
        rotation: Math.random() * Math.PI * 2,
        health: 1000,
        maxHealth: 1000,
        score: 0,
        level: 1,
        kills: 0,
        tankClass: tankClass,
        color: getTankColor(tankClass),
        lastSeen: Date.now(),
    };
    room.tanks.set(playerId, tank);
    room.lastActivity = Date.now();
    // Update client connection
    const client = clients.get(playerId);
    if (client) {
        client.roomId = roomId;
        client.playerName = playerName;
    }
    // Broadcast player join to room
    broadcastToRoom(roomId, {
        type: "playerJoined",
        player: tank,
        playerCount: room.tanks.size,
    });
    // Send system message
    const joinMessage = {
        id: generateId(),
        playerName: "System",
        message: `${playerName} joined the battle!`,
        timestamp: Date.now(),
        type: "system",
    };
    room.chatMessages.push(joinMessage);
    broadcastToRoom(roomId, {
        type: "chatMessage",
        message: joinMessage,
    });
    console.log(`Player ${playerName} (${playerId}) joined room ${roomId}`);
}
function handlePlayerLeave(playerId) {
    const client = clients.get(playerId);
    if (!client)
        return;
    const room = gameRooms.get(client.roomId);
    if (room) {
        const tank = room.tanks.get(playerId);
        if (tank) {
            // Broadcast player leave
            broadcastToRoom(client.roomId, {
                type: "playerLeft",
                playerId: playerId,
                playerCount: room.tanks.size - 1,
            });
            // Send system message
            const leaveMessage = {
                id: generateId(),
                playerName: "System",
                message: `${tank.name} left the battle!`,
                timestamp: Date.now(),
                type: "system",
            };
            room.chatMessages.push(leaveMessage);
            broadcastToRoom(client.roomId, {
                type: "chatMessage",
                message: leaveMessage,
            });
            room.tanks.delete(playerId);
        }
        // Clean up empty rooms
        if (room.tanks.size === 0) {
            gameRooms.delete(client.roomId);
            console.log(`Cleaned up empty room ${client.roomId}`);
        }
    }
    clients.delete(playerId);
    console.log(`Player ${playerId} disconnected`);
}
function getTankColor(tankClass) {
    const colors = {
        basic: "#4A90E2",
        twin: "#E24A4A",
        sniper: "#4AE24A",
        "machine-gun": "#E2E24A",
    };
    return colors[tankClass] || "#4A90E2";
}
// WebSocket connection handling
wss.on("connection", (ws) => {
    const playerId = generateId();
    console.log(`New connection: ${playerId}`);
    // Register client
    clients.set(playerId, {
        ws,
        playerId,
        playerName: "",
        roomId: "",
        lastPing: Date.now(),
    });
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: "connected",
        playerId: playerId,
        serverTime: Date.now(),
    }));
    // Send initial server stats
    const totalPlayers = clients.size;
    const activeGames = Array.from(gameRooms.values()).filter((room) => room.tanks.size > 0).length;
    ws.send(JSON.stringify({
        type: "serverStats",
        onlinePlayers: totalPlayers,
        activeGames: activeGames,
        servers: 1,
    }));
    // Handle messages
    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data.toString());
            const client = clients.get(playerId);
            if (!client)
                return;
            switch (message.type) {
                case "join":
                    if (message.playerName && message.tankClass && message.gameMode) {
                        handlePlayerJoin(playerId, message.playerName, message.tankClass);
                    }
                    break;
                case "playerUpdate":
                    const room = gameRooms.get(client.roomId);
                    if (room && room.tanks.has(playerId)) {
                        const tank = room.tanks.get(playerId);
                        // Update tank data
                        if (message.position)
                            tank.position = message.position;
                        if (message.rotation !== undefined)
                            tank.rotation = message.rotation;
                        if (message.health !== undefined)
                            tank.health = message.health;
                        if (message.score !== undefined)
                            tank.score = message.score;
                        if (message.level !== undefined)
                            tank.level = message.level;
                        if (message.kills !== undefined)
                            tank.kills = message.kills;
                        tank.lastSeen = Date.now();
                        // Broadcast to other players
                        broadcastToRoom(client.roomId, {
                            type: "playerUpdate",
                            playerId: playerId,
                            position: message.position,
                            rotation: message.rotation,
                            health: message.health,
                            score: message.score,
                            level: message.level,
                            kills: message.kills,
                        }, playerId);
                    }
                    break;
                case "shoot":
                    const shootRoom = gameRooms.get(client.roomId);
                    if (shootRoom && message.position && message.velocity) {
                        const bullet = {
                            id: generateId(),
                            position: message.position,
                            velocity: message.velocity,
                            damage: message.damage || 30,
                            ownerId: playerId,
                            size: message.size || 6,
                            color: message.color || "#FFFF00",
                            timestamp: Date.now(),
                        };
                        shootRoom.bullets.push(bullet);
                        broadcastToRoom(client.roomId, {
                            type: "bulletFired",
                            bullet: bullet,
                        });
                    }
                    break;
                case "chat":
                    const chatRoom = gameRooms.get(client.roomId);
                    if (chatRoom && message.message) {
                        const chatMessage = {
                            id: generateId(),
                            playerName: message.playerName || client.playerName,
                            message: message.message,
                            timestamp: Date.now(),
                            type: "chat",
                        };
                        chatRoom.chatMessages.push(chatMessage);
                        broadcastToRoom(client.roomId, {
                            type: "chatMessage",
                            message: chatMessage,
                        });
                    }
                    break;
                case "ping":
                    client.lastPing = Date.now();
                    ws.send(JSON.stringify({
                        type: "pong",
                        timestamp: Date.now(),
                    }));
                    break;
                case "upgrade":
                    // Handle player upgrades
                    broadcastToRoom(client.roomId, {
                        type: "playerUpgrade",
                        playerId: playerId,
                        upgradeType: message.upgradeType,
                    }, playerId);
                    break;
                default:
                    console.log("Unknown message type:", message.type);
            }
        }
        catch (error) {
            console.error("Error parsing message:", error);
        }
    });
    // Handle disconnection
    ws.on("close", () => {
        handlePlayerLeave(playerId);
    });
    // Handle errors
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        handlePlayerLeave(playerId);
    });
});
// Game loop for updating game state
setInterval(() => {
    for (const [roomId, room] of gameRooms) {
        if (room.tanks.size > 0) {
            updateGameState(roomId);
            room.lastActivity = Date.now();
        }
    }
}, 16); // 60fps
// Cleanup inactive rooms and connections
setInterval(() => {
    const currentTime = Date.now();
    // Clean up inactive connections
    for (const [playerId, client] of clients) {
        if (currentTime - client.lastPing > 30000) {
            // 30 seconds timeout
            console.log(`Cleaning up inactive client: ${playerId}`);
            handlePlayerLeave(playerId);
        }
    }
    // Clean up inactive rooms
    for (const [roomId, room] of gameRooms) {
        if (currentTime - room.lastActivity > 60000) {
            // 1 minute timeout
            console.log(`Cleaning up inactive room: ${roomId}`);
            gameRooms.delete(roomId);
        }
    }
}, 10000); // Check every 10 seconds
// Start server
server.listen(PORT, () => {
    console.log(`🎮 Tank Shooter Multiplayer Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws`);
    console.log(`📊 Server stats will be logged every 30 seconds`);
});
// Server stats logging and broadcasting
setInterval(() => {
    const totalPlayers = clients.size;
    const totalRooms = gameRooms.size;
    const activeGames = Array.from(gameRooms.values()).filter((room) => room.tanks.size > 0).length;
    const roomDetails = Array.from(gameRooms.values()).map((room) => ({
        id: room.id,
        players: room.tanks.size,
        bullets: room.bullets.length,
    }));
    console.log(`📊 Server Stats: ${totalPlayers} players, ${totalRooms} rooms`);
    if (roomDetails.length > 0) {
        console.log("🏠 Rooms:", roomDetails);
    }
    // Broadcast server stats to all connected clients
    const statsMessage = {
        type: "serverStats",
        onlinePlayers: totalPlayers,
        activeGames: activeGames,
        servers: 1,
    };
    for (const [, client] of clients) {
        if (client.ws.readyState === client.ws.OPEN) {
            client.ws.send(JSON.stringify(statsMessage));
        }
    }
}, 30000);
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("🛑 Server shutting down...");
    wss.close(() => {
        server.close(() => {
            console.log("✅ Server shutdown complete");
            process.exit(0);
        });
    });
});
process.on("SIGINT", () => {
    console.log("🛑 Server shutting down...");
    wss.close(() => {
        server.close(() => {
            console.log("✅ Server shutdown complete");
            process.exit(0);
        });
    });
});
