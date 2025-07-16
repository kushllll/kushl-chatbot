// const chatArea = document.getElementById("chat-area");
// const messageInput = document.getElementById("message");
// const sendBtn = document.getElementById("send-btn");
// const micBtn = document.getElementById("mic-btn");
// const themeBtn = document.getElementById("toggle-theme");
// const clearBtn = document.getElementById("clear-history");

// let isDark = false;
// let recognition;
// let isRecording = false;

// // -------------------- Load Chat History --------------------
// window.onload = () => {
//   const saved = localStorage.getItem("chat-history");
//   if (saved) {
//     chatArea.innerHTML = saved;
//     scrollToBottom();
//   }
//   sendBotMessage("Hi there! Nice to see you 🙂");
// };

// // -------------------- Save Chat History --------------------
// function saveChat() {
//   localStorage.setItem("chat-history", chatArea.innerHTML);
// }

// // -------------------- Add Messages --------------------
// function addMessage(role, text) {
//   const wrapper = document.createElement("div");
//   wrapper.className = `chat-message ${role}`;

//   const content = document.createElement("div");
//   content.innerText = text;

//   const time = document.createElement("div");
//   time.className = "timestamp";
//   time.innerText = new Date().toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   wrapper.appendChild(content);
//   wrapper.appendChild(time);
//   chatArea.appendChild(wrapper);
//   scrollToBottom();
//   saveChat();
// }

// function sendBotMessage(msg) {
//   addMessage("bot", msg);
// }

// function sendUserMessage(msg) {
//   addMessage("user", msg);
// }

// // -------------------- Send Button --------------------
// sendBtn.onclick = async () => {
//   const message = messageInput.value.trim();
//   if (!message) return;

//   sendUserMessage(message);
//   messageInput.value = "";

//   const typingEl = document.createElement("div");
//   typingEl.className = "chat-message bot typing-dots";
//   typingEl.innerHTML = "<span></span><span></span><span></span>";
//   chatArea.appendChild(typingEl);
//   scrollToBottom();

//   try {
//     const res = await fetch("/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();
//     chatArea.removeChild(typingEl);

//     if (data.response) {
//       sendBotMessage(data.response);
//     } else {
//       sendBotMessage("Oops! Something went wrong.");
//     }
//   } catch (err) {
//     console.error(err);
//     sendBotMessage("Network error. Try again.");
//   }
// };

// // -------------------- Theme Toggle --------------------
// themeBtn.onclick = () => {
//   document.body.classList.toggle("dark-mode");
//   isDark = !isDark;
// };

// // -------------------- Clear History --------------------
// clearBtn.onclick = () => {
//   localStorage.removeItem("chat-history");
//   chatArea.innerHTML = "";
//   sendBotMessage("Chat history cleared.");
// };

// // -------------------- Mic Speech to Text --------------------
// if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
//   const SpeechRecognition =
//     window.SpeechRecognition || window.webkitSpeechRecognition;
//   recognition = new SpeechRecognition();
//   recognition.interimResults = true;
//   recognition.lang = "en-US";

//   recognition.onstart = () => {
//     micBtn.classList.add("recording");
//     messageInput.placeholder = "Listening...";
//   };

//   recognition.onresult = (event) => {
//     const transcript = Array.from(event.results)
//       .map((res) => res[0].transcript)
//       .join("");

//     messageInput.value = transcript;

//     if (event.results[0].isFinal) {
//       recognition.stop();
//       micBtn.classList.remove("recording");
//       sendBtn.click();
//     }
//   };

//   recognition.onerror = (e) => {
//     console.error("Mic error", e);
//     micBtn.classList.remove("recording");
//   };

//   recognition.onend = () => {
//     micBtn.classList.remove("recording");
//     messageInput.placeholder = "Enter message...";
//   };

//   micBtn.onclick = () => {
//     if (isRecording) {
//       recognition.stop();
//       isRecording = false;
//     } else {
//       recognition.start();
//       isRecording = true;
//     }
//   };
// } else {
//   micBtn.style.display = "none";
// }

// // -------------------- Auto Scroll --------------------
// function scrollToBottom() {
//   chatArea.scrollTop = chatArea.scrollHeight;
// }

// Speech Recognition
const startVoiceInput = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
      alert("Speech recognition not supported in your browser");
      return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  
  recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('user-input').value = transcript;
  };
  
  recognition.start();
};

// Clear History
document.getElementById('clear-history').addEventListener('click', () => {
  fetch('/clear', { method: 'POST' })
  .then(response => response.json())
  .then(data => {
      if (data.status === 'success') {
          document.getElementById('chat-container').innerHTML = '';
      }
  });
});

// Send Message
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const userInput = document.getElementById('user-input').value;
  if (!userInput.trim()) return;

  // Add to UI immediately
  addMessageToChat(userInput, 'user');
  document.getElementById('user-input').value = '';

  // Send to backend
  fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput })
  })
  .then(response => response.json())
  .then(data => {
      addMessageToChat(data.response, 'bot');
  });
}

function addMessageToChat(text, sender) {
  const chatContainer = document.getElementById('chat-container');
  const messageDiv = document.createElement('div');
  
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
  `;
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
