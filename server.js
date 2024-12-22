const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // serve static files (HTML, CSS, JS)

// Load existing chat messages from file (if any)
let messages = [];
if (fs.existsSync('messages.json')) {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
}

io.on('connection', (socket) => {
  // Send all previous messages to the new client
  socket.emit('loadMessages', messages);

  // Listen for new messages
  socket.on('sendMessage', (message) => {
    // Generate random name if not already present
    if (!message.name) {
      message.name = 'User' + Math.floor(Math.random() * 1000);
    }

    // Save the message
    messages.push(message);
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

    // Broadcast the message to all clients
    io.emit('newMessage', message);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
