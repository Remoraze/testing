const socket = io();

// Prompt for a username when the user connects
socket.on('askForUsername', () => {
  let username = '';
  while (!username) {
    username = prompt('Enter your username:');
  }
  socket.emit('setUsername', username);
});

// Notify when the username is set
socket.on('usernameSet', (username) => {
  console.log(`Your username is: ${username}`);
});

// Load previous messages
socket.on('loadMessages', (messages) => {
  const chat = document.getElementById('chat');
  messages.forEach((message) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = `${message.name}: ${message.text}`;
    chat.appendChild(messageElement);
  });
});

// Display new messages
socket.on('newMessage', (message) => {
  const chat = document.getElementById('chat');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.textContent = `${message.name}: ${message.text}`;
  chat.appendChild(messageElement);
});

// Notify of errors
socket.on('usernameError', (error) => {
  alert(error);
});

// Handle message sending
document.getElementById('sendButton').addEventListener('click', () => {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (message) {
    socket.emit('sendMessage', message);
    input.value = '';
  }
});
