const API_KEY = 'AIzaSyB_YbCH0jzmzDx0BqGlTOn4NjyQdUWZZpI';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${API_KEY}&alt=sse`;

class BotCreator {
    constructor() {
        this.bots = JSON.parse(localStorage.getItem('aiBots')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderBots();
    }

    bindEvents() {
        document.getElementById('createBotBtn').addEventListener('click', () => this.showForm());
        document.getElementById('submitBot').addEventListener('click', () => this.createBot());
        document.getElementById('copyLink').addEventListener('click', () => this.copyLink());
    }

    showForm() {
        document.getElementById('botForm').classList.remove('hidden');
        document.getElementById('createBotBtn').style.display = 'none';
    }

    createBot() {
        const botName = document.getElementById('botName').value.trim();
        const botImage = document.getElementById('botImage').value.trim();
        const persona = document.getElementById('persona').value.trim();

        if (!botName || !botImage || !persona) {
            alert('Harap isi semua field!');
            return;
        }

        const botId = this.generateBotId();
        const bot = {
            id: botId,
            name: botName,
            image: botImage,
            persona: persona,
            createdAt: new Date().toISOString()
        };

        this.bots.push(bot);
        localStorage.setItem('aiBots', JSON.stringify(this.bots));

        this.showBotLink(botId);
        this.renderBots();
        this.resetForm();
    }

    generateBotId() {
        return 'bot_' + Math.random().toString(36).substr(2, 9);
    }

    showBotLink(botId) {
        const baseUrl = window.location.origin + window.location.pathname;
        const botUrl = baseUrl.replace('index.html', 'bot.html') + `?id=${botId}`;
        
        document.getElementById('shareLink').value = botUrl;
        document.getElementById('openBot').href = botUrl;
        
        document.getElementById('botForm').classList.add('hidden');
        document.getElementById('botLink').classList.remove('hidden');
    }

    copyLink() {
        const linkInput = document.getElementById('shareLink');
        linkInput.select();
        document.execCommand('copy');
        alert('Link berhasil disalin!');
    }

    resetForm() {
        document.getElementById('botName').value = '';
        document.getElementById('botImage').value = '';
        document.getElementById('persona').value = '';
    }

    renderBots() {
        const container = document.getElementById('botsContainer');
        
        if (this.bots.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Belum ada bot yang dibuat</p>';
            return;
        }

        container.innerHTML = this.bots.map(bot => `
            <div class="bot-card">
                <img src="${bot.image}" alt="${bot.name}" class="bot-avatar" onerror="this.src='https://via.placeholder.com/80?text=Bot'">
                <div class="bot-name">${bot.name}</div>
                <div class="bot-description">${bot.persona.substring(0, 100)}...</div>
                <a href="bot.html?id=${bot.id}" class="chat-btn">💬 Chat</a>
            </div>
        `).join('');
    }
}

// Initialize the app
new BotCreator();
