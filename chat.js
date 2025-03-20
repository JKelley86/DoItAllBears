document.addEventListener("DOMContentLoaded", function () {
    const chatContainer = document.createElement("div");
    chatContainer.classList.add("chat-container");

    chatContainer.innerHTML = `
        <div class="chat-box" id="chatBox"></div>
        <div class="chat-input-container">
            <input type="text" id="chatInput" placeholder="Type a message..." />
            <button id="sendMessage">Send</button>
            <button id="clearChat">Clear</button>
        </div>
    `;

    document.body.appendChild(chatContainer);

    const chatBox = document.getElementById("chatBox");
    const chatInput = document.getElementById("chatInput");
    const sendMessageButton = document.getElementById("sendMessage");
    const clearChatButton = document.getElementById("clearChat");

    // Load chat history from local storage
    function loadChatHistory() {
        const messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
        chatBox.innerHTML = "";
        messages.forEach(msg => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("chat-message");
            messageElement.textContent = msg;
            chatBox.appendChild(messageElement);
        });
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
    }

    // Send message function
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message !== "") {
            const messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
            messages.push(message);
            localStorage.setItem("chatHistory", JSON.stringify(messages));

            chatInput.value = "";
            loadChatHistory();
        }
    }

    // Clear chat history
    clearChatButton.addEventListener("click", function () {
        localStorage.removeItem("chatHistory");
        loadChatHistory();
    });

    sendMessageButton.addEventListener("click", sendMessage);

    chatInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    // Load existing messages when the page loads
    loadChatHistory();
});
