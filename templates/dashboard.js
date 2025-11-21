class ChatDashboard {
    constructor() {
        this.currentChatId = null;
        this.chats = [];
        this.isRecording = false;
        this.recognition = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.loadChatHistory();
        this.createNewChat();
    }

    setupEventListeners() {
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.createNewChat();
        });

        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Microphone button
        document.getElementById('micBtn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.showClearAllModal();
        });

        // Modal buttons
        document.getElementById('cancelClearBtn').addEventListener('click', () => {
            this.hideClearAllModal();
        });

        document.getElementById('confirmClearBtn').addEventListener('click', () => {
            this.clearAllChats();
        });

        // Home button
        document.getElementById('homeBtn').addEventListener('click', () => {
            window.location.href = '/';
        });

        // Mobile toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('mobileToggle');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target) &&
                sidebar.classList.contains('open')) {
                this.toggleSidebar();
            }
        });
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isRecording = true;
                const micBtn = document.getElementById('micBtn');
                micBtn.classList.add('recording');
                micBtn.innerHTML = '<i class="fas fa-stop"></i>';
                document.getElementById('messageInput').placeholder = 'Listening...';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('messageInput').value = transcript;
                this.stopRecording();
                // Auto-send after voice input
                setTimeout(() => this.sendMessage(), 500);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
                this.showNotification('Voice input error. Please try again.', 'error');
            };

            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            // Hide microphone button if not supported
            document.getElementById('micBtn').style.display = 'none';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.showNotification('Could not access microphone. Please check permissions.', 'error');
            }
        }
    }

    stopRecording() {
        this.isRecording = false;
        const micBtn = document.getElementById('micBtn');
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        document.getElementById('messageInput').placeholder = 'Type your message...';
    }

    async loadChatHistory() {
        try {
            const response = await fetch('/api/chat/history');
            const data = await response.json();
            this.chats = data.chats || [];
            this.renderChatList();
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.showNotification('Failed to load chat history', 'error');
        }
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        
        if (this.chats.length === 0) {
            chatList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5); font-size: 0.9rem;">
                    <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No chat history yet.<br>Start your first conversation!
                </div>
            `;
            return;
        }

        chatList.innerHTML = this.chats.map(chat => `
            <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" 
                 data-chat-id="${chat.id}" onclick="chatDashboard.loadChat('${chat.id}')">
                <div class="chat-item-header">
                    <div class="chat-title">${this.escapeHtml(chat.title)}</div>
                    <button class="chat-delete" onclick="event.stopPropagation(); chatDashboard.deleteChat('${chat.id}')" title="Delete chat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="chat-meta">
                    <span class="chat-time">${this.formatTime(chat.updated_at)}</span>
                    <span class="chat-count">${chat.message_count} messages</span>
                </div>
            </div>
        `).join('');
    }

    async createNewChat() {
        try {
            const response = await fetch('/api/chat/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.currentChatId = data.chat_id;
                this.clearChatMessages();
                this.addBotMessage("Hi there! I'm KushlBot, your AI assistant. How can I help you today? 🤖");
                await this.loadChatHistory();
                this.updateCurrentChatTitle('New Chat');
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
            this.showNotification('Failed to create new chat', 'error');
        }
    }

    async loadChat(chatId) {
        if (chatId === this.currentChatId) return;

        try {
            this.currentChatId = chatId;
            this.renderChatList(); // Update active state
            
            const response = await fetch(`/api/chat/${chatId}/messages`);
            const data = await response.json();
            
            if (data.messages) {
                this.clearChatMessages();
                
                if (data.messages.length === 0) {
                    this.addBotMessage("Hello! This is the beginning of our conversation. What would you like to talk about?");
                } else {
                    data.messages.forEach(message => {
                        if (message.role === 'user') {
                            this.addUserMessage(message.content, message.timestamp);
                        } else {
                            this.addBotMessage(message.content, message.timestamp);
                        }
                    });
                }
                
                // Update chat title
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) {
                    this.updateCurrentChatTitle(chat.title);
                }
            }
        } catch (error) {
            console.error('Error loading chat:', error);
            this.showNotification('Failed to load chat', 'error');
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || !this.currentChatId) return;

        // Disable send button
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        // Clear input
        input.value = '';

        // Add user message
        this.addUserMessage(message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch(`/api/chat/${this.currentChatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Remove typing indicator
            this.hideTypingIndicator();

            if (data.response) {
                this.addBotMessage(data.response);
                // Refresh chat history to update titles and counts
                await this.loadChatHistory();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error sending message:', error);
            this.addBotMessage("I apologize, but I'm having trouble responding right now. Please try again in a moment.");
            this.showNotification('Failed to send message', 'error');
        } finally {
            sendBtn.disabled = false;
        }
    }

    addUserMessage(message, timestamp = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const time = timestamp ? new Date(timestamp) : new Date();
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user';
        messageElement.innerHTML = `
            <div class="message-avatar">U</div>
            <div class="message-content">
                ${this.escapeHtml(message)}
                <div class="message-time">${this.formatTime(time.toISOString())}</div>
            </div>
        `;
        
        this.removeEmptyState();
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    addBotMessage(message, timestamp = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const time = timestamp ? new Date(timestamp) : new Date();
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot';
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${this.escapeHtml(message)}
                <div class="message-time">${this.formatTime(time.toISOString())}</div>
            </div>
        `;
        
        this.removeEmptyState();
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot';
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <span>KushlBot is typing</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    clearChatMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
    }

    removeEmptyState() {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    async deleteChat(chatId) {
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            const response = await fetch(`/api/chat/${chatId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // If deleted chat is current, create new one
                if (chatId === this.currentChatId) {
                    await this.createNewChat();
                }
                
                await this.loadChatHistory();
                this.showNotification('Chat deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            this.showNotification('Failed to delete chat', 'error');
        }
    }

    showClearAllModal() {
        document.getElementById('clearAllModal').style.display = 'flex';
    }

    hideClearAllModal() {
        document.getElementById('clearAllModal').style.display = 'none';
    }

    async clearAllChats() {
        try {
            const response = await fetch('/api/chat/clear-all', {
                method: 'POST'
            });

            if (response.ok) {
                this.chats = [];
                this.renderChatList();
                await this.createNewChat();
                this.hideClearAllModal();
                this.showNotification('All chats cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Error clearing all chats:', error);
            this.showNotification('Failed to clear chats', 'error');
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    updateCurrentChatTitle(title) {
        document.getElementById('currentChatTitle').textContent = title;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;

        // Add slide animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
let chatDashboard;
document.addEventListener('DOMContentLoaded', () => {
    chatDashboard = new ChatDashboard();
});

// Handle page visibility for better performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause any ongoing operations
        if (chatDashboard && chatDashboard.recognition) {
            chatDashboard.recognition.stop();
        }
    }
});

// Handle network status
window.addEventListener('online', () => {
    if (chatDashboard) {
        chatDashboard.showNotification('Connection restored', 'success');
    }
});

window.addEventListener('offline', () => {
    if (chatDashboard) {
        chatDashboard.showNotification('No internet connection', 'error');
    }
});