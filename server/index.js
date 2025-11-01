const express = require('express');
const cors = require('cors');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Инициализация базы данных
const db = new sqlite3.Database('../bot.db');

// Создание таблиц
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS photo_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    file_path TEXT,
    ai_analysis TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Инициализация Telegram бота
console.log('🤖 Инициализация Telegram бота...');
console.log('Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Найден' : 'НЕ НАЙДЕН!');

// Инициализируем бот без автоматического polling
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Обработка ошибок бота
bot.on('error', (error) => {
    console.error('❌ Ошибка Telegram бота:', error);
    // Если ошибка 409 (конфликт), пытаемся остановить polling и перезапустить
    if (error.code === 'ETELEGRAM' && error.response?.statusCode === 409) {
        console.log('⚠️ Обнаружен конфликт: другой экземпляр бота работает');
        console.log('🔄 Останавливаем polling и ждем 5 секунд...');
        bot.stopPolling().then(() => {
            setTimeout(() => {
                console.log('🔄 Перезапускаем polling...');
                bot.startPolling().catch(err => {
                    console.error('❌ Не удалось перезапустить polling:', err.message);
                });
            }, 5000);
        }).catch(err => {
            console.error('❌ Ошибка остановки polling:', err.message);
        });
    }
});

bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling:', error);
    // Если ошибка 409, это означает, что другой экземпляр уже работает
    if (error.code === 'ETELEGRAM' && error.response?.statusCode === 409) {
        console.log('⚠️ ВНИМАНИЕ: Другой экземпляр бота уже запущен!');
        console.log('💡 Убедитесь, что:');
        console.log('   1. Локально не запущен бот (node server/index.js)');
        console.log('   2. На Railway только один активный деплой');
        console.log('   3. Старые процессы бота остановлены');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал SIGTERM, останавливаем бота...');
    bot.stopPolling().then(() => {
        console.log('✅ Polling остановлен');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Получен сигнал SIGINT, останавливаем бота...');
    bot.stopPolling().then(() => {
        console.log('✅ Polling остановлен');
        process.exit(0);
    });
});

console.log('✅ Telegram бот инициализирован');

// Устанавливаем команды бота
bot.setMyCommands([
    { command: 'start', description: '🚀 Запустить AI Photo Analyzer' },
    { command: 'help', description: '❓ Помощь и инструкции' }
]);

// Инициализация OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Функция для проверки лимита загрузок
function checkUploadLimit(telegramId) {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0];

        db.get(`
      SELECT COUNT(*) as count 
      FROM photo_uploads pu 
      JOIN users u ON pu.user_id = u.id 
      WHERE u.telegram_id = ? AND DATE(pu.uploaded_at) = ?
    `, [telegramId, today], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count < 3);
            }
        });
    });
}

// Функция для анализа фото с помощью ИИ
async function analyzePhoto(imagePath) {
    try {
        // Если это URL, скачиваем изображение
        let imageBuffer;
        if (imagePath.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        } else {
            // Если это локальный путь, читаем файл
            const fs = require('fs');
            imageBuffer = fs.readFileSync(imagePath);
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Проанализируй это изображение и дай красивый, вдохновляющий прогноз или описание того, что ты видишь. Будь креативным и позитивным в своем ответе. Ответь на русском языке."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Ошибка анализа ИИ:', error);
        return 'Извините, не удалось проанализировать изображение. Попробуйте еще раз.';
    }
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
    console.log('📨 Получена команда /start от пользователя:', msg.from.username || msg.from.first_name);
    const chatId = msg.chat.id;
    const user = msg.from;

    // Сохраняем пользователя в БД
    db.run(
        `INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name) 
     VALUES (?, ?, ?, ?)`,
        [user.id, user.username, user.first_name, user.last_name]
    );

    const welcomeText = `🎉 Добро пожаловать в AI Photo Analyzer!

Я умею анализировать ваши фотографии с помощью искусственного интеллекта и давать красивые, вдохновляющие прогнозы!

📸 Отправьте мне фото, и я расскажу что вижу на нем
⏰ Лимит: 3 фото в день
✨ Каждый анализ уникален и креативен`;

    // Создаем inline keyboard с кнопкой для запуска веб-приложения
    const webAppUrl = process.env.WEBAPP_URL || 'https://your-ngrok-url.ngrok.io';
    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🚀 Запустить бота',
                    web_app: {
                        url: webAppUrl
                    }
                }
            ]
        ]
    };

    bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpText = `🤖 AI Photo Analyzer - Помощь

📸 Как использовать:
1. Нажмите кнопку "🚀 Запустить бота" для открытия приложения
2. Загрузите фото в приложении
3. Получите AI анализ вашего изображения

⚡ Возможности:
• Анализ фотографий с помощью ИИ
• Красивые и вдохновляющие описания
• История ваших загрузок
• Лимит: 3 фото в день

🔧 Поддержка:
• Отправьте /start для начала работы
• Используйте кнопку меню для быстрого доступа к приложению

✨ Приятного использования!`;

    bot.sendMessage(chatId, helpText);
});

// Обработчик нажатий на кнопки
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    if (data === 'launch_webapp') {
        bot.answerCallbackQuery(callbackQuery.id, {
            text: '🚀 Запускаем веб-приложение...',
            show_alert: false
        });
    }
});

// Обработчик фото
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    try {
        // Проверяем лимит
        const canUpload = await checkUploadLimit(user.id);
        if (!canUpload) {
            bot.sendMessage(chatId, '❌ Вы уже использовали лимит в 3 фото на сегодня. Попробуйте завтра!');
            return;
        }

        // Получаем файл
        const photo = msg.photo[msg.photo.length - 1];
        const file = await bot.getFile(photo.file_id);
        const filePath = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        bot.sendMessage(chatId, '🔍 Анализирую ваше фото... Это может занять несколько секунд.');

        // Анализируем фото
        const analysis = await analyzePhoto(filePath);

        // Сохраняем в БД
        db.run(
            `INSERT INTO photo_uploads (user_id, file_path, ai_analysis) 
       VALUES ((SELECT id FROM users WHERE telegram_id = ?), ?, ?)`,
            [user.id, filePath, analysis]
        );

        // Отправляем результат
        bot.sendMessage(chatId, `✨ Анализ вашего фото:\n\n${analysis}`);

    } catch (error) {
        console.error('Ошибка обработки фото:', error);
        bot.sendMessage(chatId, '❌ Произошла ошибка при обработке фото. Попробуйте еще раз.');
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoints
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const analysis = await analyzePhoto(req.file.path);

        res.json({
            success: true,
            analysis,
            filePath: req.file.path
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/api/user/:telegramId/uploads', (req, res) => {
    const { telegramId } = req.params;

    db.all(`
    SELECT pu.*, u.username 
    FROM photo_uploads pu 
    JOIN users u ON pu.user_id = u.id 
    WHERE u.telegram_id = ? 
    ORDER BY pu.uploaded_at DESC
  `, [telegramId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 Telegram bot is active`);
});