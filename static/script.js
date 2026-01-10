// Modern KushlBot Chat Interface
const chatArea = document.getElementById("chat-area");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-history");
const themeToggle = document.getElementById("theme-toggle");

let recognition;
let isRecording = false;
let welcomeShown = true;
let isDarkMode = false;

// ==================== Initialization ====================
window.onload = () => {
  loadChatHistory();
  setupSuggestionChips();
  loadThemePreference();
  
  // Show welcome message if no history
  if (!hasChatHistory()) {
    setTimeout(() => {
      sendBotMessage("Hi there! Nice to see you 🙂 How can I assist you today?");
    }, 500);
  }
};

// ==================== Setup Suggestion Chips ====================
function setupSuggestionChips() {
  const chips = document.querySelectorAll('.suggestion-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const message = chip.getAttribute('data-message');
      if (message) {
        messageInput.value = message;
        messageInput.focus();
        // Small delay to show the typed message before sending
        setTimeout(() => {
          sendBtn.click();
        }, 100);
      }
    });
  });
}

// Re-setup chips after clearing history
function refreshSuggestionChips() {
  setTimeout(() => {
    setupSuggestionChips();
  }, 100);
}

// ==================== Load & Save Chat History ====================
function loadChatHistory() {
  const saved = localStorage.getItem("chat-history");
  if (saved) {
    chatArea.innerHTML = saved;
    scrollToBottom();
    welcomeShown = false;
  }
}

function saveChat() {
  localStorage.setItem("chat-history", chatArea.innerHTML);
}

function hasChatHistory() {
  const saved = localStorage.getItem("chat-history");
  return saved && saved.trim() !== "";
}

// ==================== Remove Welcome Section ====================
function removeWelcome() {
  if (welcomeShown) {
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
      welcomeSection.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        welcomeSection.remove();
      }, 300);
    }
    welcomeShown = false;
  }
}

// ==================== Add Messages ====================
function addMessage(role, text) {
  removeWelcome();
  
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role} fade-in`;
  
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.innerText = text;
  
  const time = document.createElement("div");
  time.className = "timestamp";
  time.innerText = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  bubble.appendChild(time);
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);
  
  scrollToBottom();
  saveChat();
}

function sendBotMessage(msg) {
  addMessage("bot", msg);
}

function sendUserMessage(msg) {
  addMessage("user", msg);
}

// ==================== Typing Indicator ====================
function showTypingIndicator() {
  removeWelcome();
  
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "chat-message bot fade-in";
  
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <span style="font-size: 13px; color: #636e72;">KushlBot is typing</span>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  
  chatArea.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// ==================== Send Message ====================
sendBtn.onclick = async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  // Disable input while sending
  sendBtn.disabled = true;
  messageInput.disabled = true;
  
  sendUserMessage(message);
  messageInput.value = "";

  showTypingIndicator();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    hideTypingIndicator();

    if (data.response) {
      sendBotMessage(data.response);
    } else {
      sendBotMessage("Oops! Something went wrong. Please try again.");
    }
  } catch (err) {
    console.error(err);
    hideTypingIndicator();
    sendBotMessage("Network error. Please check your connection and try again.");
  } finally {
    sendBtn.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
  }
};

// ==================== Enter Key to Send ====================
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// ==================== Clear History ====================
clearBtn.onclick = () => {
  if (confirm("Are you sure you want to clear the chat history?")) {
    localStorage.removeItem("chat-history");
    chatArea.innerHTML = `
      <div class="welcome-section">
        <div class="welcome-icon">
          <i class="fas fa-robot"></i>
        </div>
        <h2 class="welcome-title">Welcome to KushlBot!</h2>
        <p class="welcome-subtitle">Your intelligent AI assistant is here to help. Ask me anything!</p>
        <div class="suggestions">
          <button class="suggestion-chip" data-message="What can you help me with?">
            <i class="fas fa-question-circle"></i> What can you do?
          </button>
          <button class="suggestion-chip" data-message="Tell me a fun fact">
            <i class="fas fa-lightbulb"></i> Fun fact
          </button>
          <button class="suggestion-chip" data-message="Help me brainstorm ideas">
            <i class="fas fa-brain"></i> Brainstorm
          </button>
        </div>
      </div>
    `;
    welcomeShown = true;
    refreshSuggestionChips();
    
    setTimeout(() => {
      sendBotMessage("Chat history cleared. How can I help you today?");
    }, 500);
  }
};

// ==================== Dark/Light Mode Toggle ====================
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    isDarkMode = false;
    document.body.classList.remove('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

themeToggle.onclick = () => {
  isDarkMode = !isDarkMode;
  
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', 'light');
  }
};

// ==================== Speech Recognition ====================
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add("recording");
    messageInput.placeholder = "Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    recognition.stop();
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e);
    micBtn.classList.remove("recording");
    messageInput.placeholder = "Type your message here...";
    isRecording = false;
    
    if (e.error === 'not-allowed') {
      showNotification("Microphone access denied. Please enable it in your browser settings.", "error");
    } else {
      showNotification("Voice recognition error. Please try again.", "error");
    }
  };

  recognition.onend = () => {
    micBtn.classList.remove("recording");
    isRecording = false;
    messageInput.placeholder = "Type your message here...";
  };

  micBtn.onclick = () => {
    if (!isRecording) {
      try {
        recognition.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        showNotification("Could not start voice recognition.", "error");
      }
    } else {
      recognition.stop();
    }
  };
} else {
  micBtn.style.display = "none";
}

// ==================== Scroll to Bottom ====================
function scrollToBottom() {
  setTimeout(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 100);
}

// Auto-scroll when keyboard opens on mobile
messageInput.addEventListener("focus", () => {
  setTimeout(scrollToBottom, 300);
});

// ==================== Notification System ====================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#667eea'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 500;
    font-size: 14px;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

// ==================== Online/Offline Detection ====================
window.addEventListener('online', () => {
  showNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
  showNotification('You are offline', 'error');
});

// ==================== Page Visibility ====================
document.addEventListener('visibilitychange', () => {
  if (document.hidden && recognition && isRecording) {
    recognition.stop();
  }
});
