const API_KEY = 'AIzaSyB_6PFbktl04BHmkUOCODJxXm4ubKy3fww';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${API_KEY}&alt=sse`;

class BotChat {
    constructor() {
        this.bot = null;
        this.chatHistory = [];
        this.init();
    }

    async init() {
        await this.loadBot();
        this.bindEvents();
        this.updateBotInfo();
    }

    async loadBot() {
        const urlParams = new URLSearchParams(window.location.search);
        const botId = urlParams.get('id');

        if (!botId) {
            alert('Bot tidak ditemukan!');
            window.location.href = 'index.html';
            return;
        }

        const bots = JSON.parse(localStorage.getItem('aiBots')) || [];
        this.bot = bots.find(bot => bot.id === botId);

        if (!this.bot) {
            alert('Bot tidak ditemukan!');
            window.location.href = 'index.html';
            return;
        }

        // Load chat history from localStorage
        this.chatHistory = JSON.parse(localStorage.getItem(`chat_${botId}`)) || [];
        this.renderChatHistory();
    }

    updateBotInfo() {
        document.getElementById('botName').textContent = this.bot.name;
        document.getElementById('botAvatar').src = this.bot.image;
        document.getElementById('botAvatarMsg').src = this.bot.image;
        
        // Fallback for broken images
        document.getElementById('botAvatar').onerror = function() {
            this.src = 'https://via.placeholder.com/50?text=Bot';
        };
        document.getElementById('botAvatarMsg').onerror = function() {
            this.src = 'https://via.placeholder.com/35?text=Bot';
        };
    }

    bindEvents() {
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping(true);

        try {
            const response = await this.generateAIResponse(message);
            this.addMessage(response, 'bot');
            
            // Save to chat history
            this.saveChatHistory();
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'bot');
        } finally {
            this.showTyping(false);
        }
    }

    async generateAIResponse(userMessage) {
        const persona = this.bot.persona;
        
        const prompt = {
            contents: [{
                parts: [{
                    text: `${persona}\n\nKonteks percakapan sebelumnya:\n${this.getConversationContext()}\n\nUser: ${userMessage}\n\nBot:`
                }]
            }]
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prompt)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.candidates && parsed.candidates[0].content.parts[0].text) {
                                fullResponse += parsed.candidates[0].content.parts[0].text;
                            }
                        } catch (e) {
                            // Continue processing other lines
                        }
                    }
                }
            }

            return fullResponse || 'Maaf, saya tidak bisa menghasilkan respons saat ini.';
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    getConversationContext() {
        return this.chatHistory
            .slice(-5) // Last 5 messages for context
            .map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.content}`)
            .join('\n');
    }

    addMessage(content, role) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const avatarSrc = role === 'user' 
            ? 'https://via.placeholder.com/35?text=You'
            : this.bot.image;

        messageDiv.innerHTML = `
            <img src="${avatarSrc}" alt="${role}" class="message-avatar" onerror="this.src='https://via.placeholder.com/35?text=${role === 'user' ? 'You' : 'Bot'}'">
            <div class="message-bubble">${this.escapeHtml(content)}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to chat history
        this.chatHistory.push({ role, content, timestamp: new Date().toISOString() });
    }

    renderChatHistory() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';

        // Add welcome message if no history
        if (this.chatHistory.length === 0) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'message bot';
            welcomeMsg.innerHTML = `
                <img src="${this.bot.image}" alt="Bot" class="message-avatar" onerror="this.src='https://via.placeholder.com/35?text=Bot'">
                <div class="message-bubble">
                    Halo! Saya ${this.bot.name}. ${this.bot.persona.includes('Kamu adalah') ? '' : 'Saya siap membantu Anda!'} Ada yang bisa saya bantu?
                </div>
            `;
            messagesContainer.appendChild(welcomeMsg);
            return;
        }

        // Render chat history
        this.chatHistory.forEach(msg => {
            this.addMessage(msg.content, msg.role);
        });
    }

    saveChatHistory() {
        localStorage.setItem(`chat_${this.bot.id}`, JSON.stringify(this.chatHistory));
    }

    showTyping(show) {
        const indicator = document.getElementById('typingIndicator');
        if (show) {
            indicator.classList.add('show');
        } else {
            indicator.classList.remove('show');
        }
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, '<br>');
    }
}

// Initialize chat when page loads
new BotChat();