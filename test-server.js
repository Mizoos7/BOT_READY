const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    const welcomeText = `🎉 Добро пожаловать в AI Photo Analyzer!

Я умею анализировать ваши фотографии с помощью искусственного интеллекта!

📸 Отправьте мне фото, и я расскажу что вижу на нем
⏰ Лимит: 3 фото в день
✨ Каждый анализ уникален и креативен

Веб-приложение: http://localhost:5173`;

    bot.sendMessage(chatId, welcomeText);
});

// Обработчик фото
bot.on('photo', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🔍 Получил ваше фото! Анализ будет доступен в веб-приложении.');
});

// API endpoint для проверки
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 Telegram bot is active`);
    console.log(`📱 Test endpoint: http://localhost:${PORT}/api/status`);
});
