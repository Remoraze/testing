const socket = io();

// Display username input overlay
document.addEventListener('DOMContentLoaded', () => {
  const usernameOverlay = document.getElementById('username-overlay');
  const usernameInput = document.getElementById('usernameInput');
  const submitButton = document.getElementById('submitUsername');
  const charCount = document.getElementById('charCount'); // Character count element
  const chatBox = document.getElementById('chat');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  let isAtBottom = true; // Tracks if the user is at the bottom of the chat

  // Update character count as the user types
  usernameInput.addEventListener('input', () => {
    const username = usernameInput.value;
    const remaining = 20 - username.length;

    // Update the character count display
    charCount.textContent = `Characters left: ${Math.max(remaining, 0)}`;

    // Handle character limit logic
    if (remaining < 0) {
      charCount.style.color = 'red'; // Highlight over-limit in red
      submitButton.disabled = true; // Disable the button if over limit
    } else {
      charCount.style.color = ''; // Reset color to default
      submitButton.disabled = false; // Enable the button if within limit
    }
  });

  // Handle username submission
  submitButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username && username.length <= 20) {
      socket.emit('setUsername', username); // Send username to server
    }
  });

  // Handle username errors
  socket.on('usernameError', (error) => {
    alert(error);
  });

  // If username is successfully set, remove the overlay
  socket.on('usernameSet', (username) => {
    console.log(`Your username is: ${username}`);
    usernameOverlay.style.display = 'none'; // Hide the username overlay
    messageInput.focus(); // Focus the message input for immediate typing
  });

  // Track user's scroll position
  chatBox.addEventListener('scroll', () => {
    const threshold = 10; // Define a threshold for "close to bottom"
    isAtBottom =
      chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
  });

  // Load previous messages
  socket.on('loadMessages', (messages) => {
    messages.forEach(addMessageToChat);
    scrollToBottom();
  });

  // Display new messages
  socket.on('newMessage', (message) => {
    addMessageToChat(message);
    if (isAtBottom) {
      scrollToBottom(); // Only scroll if the user is at the bottom
    }
  });

  // Handle message sending
  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendMessage();
  });

  // Helper function: Add a message to the chat box
  function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = `${message.name}: ${message.text}`;
    chatBox.appendChild(messageElement);
  }

  // Helper function: Send a message
  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      socket.emit('sendMessage', message);
      messageInput.value = ''; // Clear the input field immediately after sending
      messageInput.disabled = true; // Temporarily disable input to prevent spamming
      setTimeout(() => {
        messageInput.disabled = false; // Re-enable input after a short delay
      }, 1000); // 1-second delay to prevent spamming
      scrollToBottom(); // Force scroll to bottom when the user sends a message
    }
  }

  // Helper function: Auto-scroll to the bottom of the chat
  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
