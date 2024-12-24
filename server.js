// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Directory to store messages
const MESSAGES_DIR = path.join(__dirname, 'messages');

app.use(express.static('public'));

// Room messages
const rooms = {
    gaming: [],
    general: [],
    memes: [],
    coding: []
};

const MAX_MESSAGES = 100;

// Load messages from files
function loadRoomMessages() {
    Object.keys(rooms).forEach((room) => {
        const filename = path.join(MESSAGES_DIR, `${room}-messages.json`);
        if (fs.existsSync(filename)) {
            try {
                rooms[room] = JSON.parse(fs.readFileSync(filename, 'utf8'));
            } catch (error) {
                console.error(`Error loading messages for ${room}:`, error.message);
            }
        }
    });
}

// Save messages to files
function saveRoomMessages(room) {
    const filename = path.join(MESSAGES_DIR, `${room}-messages.json`);
    if (fs.existsSync(filename)) {
        try {
            if (rooms[room].length > MAX_MESSAGES) {
                rooms[room] = rooms[room].slice(-MAX_MESSAGES);
            }
            fs.writeFileSync(filename, JSON.stringify(rooms[room], null, 2));
        } catch (error) {
            console.error(`Error saving messages for ${room}:`, error.message);
        }
    }
}

// Load messages initially
loadRoomMessages();

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    let username = null;
    let currentRoom = null;

    socket.on('joinRoom', ({ room, username: newUsername }) => {
        if (currentRoom) {
            socket.leave(currentRoom);
        }

        username = newUsername;
        currentRoom = room;
        socket.join(room);

        socket.emit('loadMessages', rooms[room]);

        io.to(room).emit('newMessage', {
            name: 'System',
            text: `${username} has joined the room`,
            timestamp: Date.now()
        });
    });

    socket.on('sendMessage', ({ text, room }) => {
        if (!username || !room) return;

        const message = { name: username, text, timestamp: Date.now() };
        rooms[room].push(message);
        saveRoomMessages(room);
        io.to(room).emit('newMessage', message);
    });

    socket.on('disconnect', () => {
        if (username && currentRoom) {
            io.to(currentRoom).emit('newMessage', {
                name: 'System',
                text: `${username} has left the room`,
                timestamp: Date.now()
            });
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
