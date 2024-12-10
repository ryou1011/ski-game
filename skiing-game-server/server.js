const WebSocket = require('ws');

const port = 8080;
const wss = new WebSocket.Server({ port });

let players = {};
let gameState = {
    seed: Math.floor(Math.random() * 1000000).toString(), // Shared seed for terrain generation
    coins: [], // Shared coin positions
    powerUps: [], // Shared power-up positions
    ramps: [] // Shared ramp positions
};

wss.on('connection', (ws) => {
    const playerId = generateUniqueId();
    players[playerId] = { 
        ws, 
        username: null,
        position: { x: 0, y: 0, z: 0, rotationY: 0 },
        state: {
            speed: 0,
            isJumping: false,
            score: 0,
            coins: 0,
            tricks: 0,
            trickMultiplier: 1,
            isPerformingTrick: false,
            currentTrick: ''
        }
    };

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'init':
                    // Set the player's username and send initial game state
                    players[playerId].username = data.username;
                    ws.send(JSON.stringify({ 
                        type: 'init', 
                        id: playerId,
                        gameState: {
                            seed: gameState.seed,
                            coins: gameState.coins,
                            powerUps: gameState.powerUps,
                            ramps: gameState.ramps
                        }
                    }));

                    // Send existing players' data to the new player
                    Object.keys(players).forEach((id) => {
                        if (id !== playerId && players[id].username) {
                            ws.send(JSON.stringify({
                                type: 'player_joined',
                                id,
                                username: players[id].username,
                                position: players[id].position,
                                state: players[id].state
                            }));
                        }
                    });

                    // Broadcast new player to all other players
                    broadcast(JSON.stringify({
                        type: 'player_joined',
                        id: playerId,
                        username: data.username,
                        position: players[playerId].position,
                        state: players[playerId].state
                    }), playerId);
                    break;

                case 'update':
                    // Update player state
                    players[playerId].position = data.position;
                    if (data.state) {
                        players[playerId].state = {
                            ...players[playerId].state,
                            ...data.state
                        };
                    }
                    
                    // Broadcast update to all other players
                    broadcast(JSON.stringify({
                        type: 'update',
                        id: playerId,
                        position: data.position,
                        state: data.state
                    }), playerId);
                    break;

                case 'coin_collected':
                    // Update shared game state
                    const coinIndex = gameState.coins.findIndex(
                        coin => coin.x === data.coin.x && 
                        coin.y === data.coin.y && 
                        coin.z === data.coin.z
                    );
                    if (coinIndex !== -1) {
                        gameState.coins.splice(coinIndex, 1);
                        // Broadcast coin collection to all players
                        broadcast(JSON.stringify({
                            type: 'coin_collected',
                            coinIndex,
                            playerId
                        }));
                    }
                    break;

                case 'powerup_collected':
                    // Update shared game state
                    const powerUpIndex = gameState.powerUps.findIndex(
                        powerUp => powerUp.x === data.powerUp.x && 
                        powerUp.y === data.powerUp.y && 
                        powerUp.z === data.powerUp.z
                    );
                    if (powerUpIndex !== -1) {
                        gameState.powerUps.splice(powerUpIndex, 1);
                        // Broadcast power-up collection to all players
                        broadcast(JSON.stringify({
                            type: 'powerup_collected',
                            powerUpIndex,
                            playerId
                        }));
                    }
                    break;

                case 'trick_performed':
                    // Broadcast trick information to all players
                    broadcast(JSON.stringify({
                        type: 'trick_performed',
                        playerId,
                        trickName: data.trickName,
                        position: players[playerId].position
                    }));
                    break;

                case 'chat_message':
                    // Broadcast chat message to all players
                    broadcast(JSON.stringify({
                        type: 'chat_message',
                        playerId,
                        username: players[playerId].username,
                        message: data.message
                    }));
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        // Clean up player data when they disconnect
        delete players[playerId];
        // Notify all other players about the disconnection
        broadcast(JSON.stringify({ 
            type: 'player_left', 
            id: playerId,
            username: players[playerId]?.username 
        }));
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        // Attempt to clean up the connection
        try {
            ws.close();
        } catch (e) {
            console.error('Error closing socket:', e);
        }
    });
});

// Broadcast message to all players except the sender
function broadcast(message, exceptId = null) {
    Object.keys(players).forEach((id) => {
        if (id !== exceptId && players[id].ws.readyState === WebSocket.OPEN) {
            try {
                players[id].ws.send(message);
            } catch (error) {
                console.error(`Error broadcasting to player ${id}:`, error);
            }
        }
    });
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

// Periodic cleanup of disconnected players
setInterval(() => {
    Object.keys(players).forEach((id) => {
        if (players[id].ws.readyState === WebSocket.CLOSED) {
            delete players[id];
            broadcast(JSON.stringify({ 
                type: 'player_left', 
                id,
                username: players[id]?.username 
            }));
        }
    });
}, 30000); // Run every 30 seconds

// Log server start
console.log(`WebSocket server is running on ws://localhost:${port}`);

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    wss.clients.forEach((client) => {
        client.close();
    });
    process.exit(0);
});