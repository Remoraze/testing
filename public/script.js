const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    // Get room from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoom = urlParams.get('room') || 'general';

    // Update room title in the UI
    const roomTitle = document.createElement('div');
    roomTitle.id = 'room-title';
    roomTitle.textContent = `${currentRoom.charAt(0).toUpperCase() + currentRoom.slice(1)} Room`;
    document.querySelector('#chat-container').prepend(roomTitle);

    const usernameOverlay = document.getElementById('username-overlay');
    const usernameInput = document.getElementById('usernameInput');
    const submitButton = document.getElementById('submitUsername');
    const charCount = document.getElementById('charCount');
    const chatBox = document.getElementById('chat');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    let isAtBottom = true;
    let username = null;

    // Username character count logic
    usernameInput.addEventListener('input', () => {
        const usernameValue = usernameInput.value;
        const remaining = 20 - usernameValue.length;
        charCount.textContent = `Characters left: ${Math.max(remaining, 0)}`;

        if (remaining < 0) {
            charCount.style.color = 'red';
            submitButton.disabled = true;
        } else {
            charCount.style.color = '';
            submitButton.disabled = false;
        }
    });

    // Handle username submission and room joining
    submitButton.addEventListener('click', () => {
        const usernameValue = usernameInput.value.trim();
        if (usernameValue && usernameValue.length <= 20) {
            username = usernameValue;
            socket.emit('joinRoom', { room: currentRoom, username });
            usernameOverlay.style.display = 'none';
            usernameInput.disabled = true; // Prevent further edits after setting the username
            submitButton.disabled = true;  // Disable the submit button after submission
            messageInput.focus();
        }
    });

    // Track scroll position
    chatBox.addEventListener('scroll', () => {
        const threshold = 10;
        isAtBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
    });

    // Load existing messages
    socket.on('loadMessages', (messages) => {
        chatBox.innerHTML = ''; // Clear existing messages
        messages.forEach(addMessageToChat);
        scrollToBottom();
    });

    // Handle new messages
    socket.on('newMessage', (message) => {
        addMessageToChat(message);
        if (isAtBottom) {
            scrollToBottom();
        }
    });

    // Handle username errors
    socket.on('usernameError', (errorMessage) => {
        alert(errorMessage);
    });

    // Message sending logic
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
    });

    function addMessageToChat(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Style system messages differently
        if (message.name === 'System') {
            messageElement.classList.add('system-message');
        } else if (message.name === 'Moderator') {
            messageElement.classList.add('moderator-message');
        }
        
        // Format timestamp if needed
        const timestamp = message.timestamp 
            ? new Date(message.timestamp).toLocaleTimeString() 
            : '';
        
        messageElement.innerHTML = `
            <span class="message-author">${message.name}</span>: 
            ${message.text}
            ${timestamp ? `<span class="message-time">${timestamp}</span>` : ''}
        `;
        chatBox.appendChild(messageElement);
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        const MAX_MESSAGE_LENGTH = 200; // Set a reasonable limit for message length

        if (!username) {
            alert('You need to set a username first!');
            usernameOverlay.style.display = 'block';
            usernameInput.focus();
            return;
        }
        if (message.length === 0) {
            alert('Message cannot be empty.');
            return;
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            alert(`Message is too long! Max ${MAX_MESSAGE_LENGTH} characters allowed.`);
            return;
        }
        socket.emit('sendMessage', { 
            text: message, 
            room: currentRoom 
        });
        messageInput.value = '';
        messageInput.disabled = true;
        setTimeout(() => {
            messageInput.disabled = false;
        }, 1000);
        scrollToBottom();
    }

    function scrollToBottom(smooth = true) {
        chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
        });
    }
    
    // Improve accessibility with aria-live
    chatBox.setAttribute('aria-live', 'polite');
    chatBox.setAttribute('role', 'log');
});
