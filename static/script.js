const chatArea = document.getElementById("chat-area");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-history");

let recognition;
let isRecording = false;

// -------------------- Load Chat History --------------------
window.onload = () => {
  const saved = localStorage.getItem("chat-history");
  if (saved) {
    chatArea.innerHTML = saved;
    scrollToBottom();
  }
  sendBotMessage("Hi there! Nice to see you 🙂");
};

// -------------------- Save Chat History --------------------
function saveChat() {
  localStorage.setItem("chat-history", chatArea.innerHTML);
}

// -------------------- Add Messages --------------------
function addMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role}`;

  const content = document.createElement("div");
  content.innerText = text;

  const time = document.createElement("div");
  time.className = "timestamp";
  time.innerText = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  wrapper.appendChild(content);
  wrapper.appendChild(time);
  chatArea.appendChild(wrapper);
  scrollToBottom();
  saveChat();
}

function sendBotMessage(msg) {
  addMessage("bot", msg);
}

function sendUserMessage(msg) {
  addMessage("user", msg);
}

// -------------------- Send Button --------------------
sendBtn.onclick = async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  sendUserMessage(message);
  messageInput.value = "";

  const typingEl = document.createElement("div");
  typingEl.className = "chat-message bot typing-dots";
  typingEl.innerHTML = "<span></span><span></span><span></span>";
  chatArea.appendChild(typingEl);
  scrollToBottom();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    chatArea.removeChild(typingEl);

    if (data.response) {
      sendBotMessage(data.response);
    } else {
      sendBotMessage("Oops! Something went wrong.");
    }
  } catch (err) {
    console.error(err);
    sendBotMessage("Network error. Try again.");
  }
};

// -------------------- Clear History --------------------
clearBtn.onclick = () => {
  localStorage.removeItem("chat-history");
  chatArea.innerHTML = "";
  sendBotMessage("Chat history cleared.");
};

// -------------------- Mic Speech to Text --------------------
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    micBtn.classList.add("recording");
    messageInput.placeholder = "Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    recognition.stop();
    micBtn.classList.remove("recording");
    sendBtn.click();
  };

  recognition.onerror = (e) => {
    console.error("Mic error", e);
    micBtn.classList.remove("recording");
    messageInput.placeholder = "Enter message...";
  };

  recognition.onend = () => {
    micBtn.classList.remove("recording");
    isRecording = false;
    messageInput.placeholder = "Enter message...";
  };

  micBtn.onclick = () => {
    if (!isRecording) {
      recognition.start();
      isRecording = true;
    } else {
      recognition.stop();
    }
  };
} else {
  micBtn.style.display = "none";
}

// -------------------- Scroll --------------------
function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

// scroll chat to bottom when keyboard opens
document.getElementById("message").addEventListener("focus", () => {
  setTimeout(() => {
    document.getElementById("chat-area").scrollTop = document.getElementById("chat-area").scrollHeight;
  }, 300);
});

