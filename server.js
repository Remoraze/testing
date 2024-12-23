const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// Load existing chat messages from file (if any)
let messages = [];
if (fs.existsSync('messages.json')) {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
}

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Temporary username for this connection
  let username = null;

  // Prompt the user to set a username
  socket.emit('askForUsername');

  // Handle username setting
  socket.on('setUsername', (newUsername) => {
    username = newUsername;
    socket.emit('usernameSet', username);
    console.log(`User ${socket.id} set their username to: ${username}`);
  });

  // Send all previous messages to the new client
  socket.emit('loadMessages', messages);

  // Handle incoming messages
  socket.on('sendMessage', (messageText) => {
    if (!username) {
      socket.emit('usernameError', 'You must set a username first!');
      return;
    }

    // Add the message with the username
    const message = { name: username, text: messageText };
    messages.push(message);
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

    // Broadcast the message to all clients
    io.emit('newMessage', message);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
