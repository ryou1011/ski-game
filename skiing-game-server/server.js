// server.js
const WebSocket = require('ws');

const port = 8080;
const wss = new WebSocket.Server({ port });

let players = {};

wss.on('connection', (ws) => {
    const playerId = generateUniqueId();
    players[playerId] = { ws };

    // Send the new player their ID
    ws.send(JSON.stringify({ type: 'init', id: playerId }));

    // Notify the new player about existing players
    Object.keys(players).forEach((id) => {
        if (id !== playerId) {
            ws.send(JSON.stringify({ type: 'player_joined', id }));
        }
    });

    // Broadcast to all players that a new player has joined
    broadcast(JSON.stringify({ type: 'player_joined', id: playerId }), playerId);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'update':
                    // Broadcast the player's position to others
                    broadcast(JSON.stringify({ type: 'update', id: playerId, position: data.position }), playerId);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        delete players[playerId];
        // Notify others that this player has left
        broadcast(JSON.stringify({ type: 'player_left', id: playerId }));
    });
});

function broadcast(message, exceptId = null) {
    Object.keys(players).forEach((id) => {
        if (id !== exceptId) {
            players[id].ws.send(message);
        }
    });
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

console.log(`WebSocket server is running on ws://localhost:${port}`);
