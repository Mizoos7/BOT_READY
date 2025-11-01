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

// Определяем режим работы: webhook для Railway, polling для локальной разработки
const useWebhook = process.env.RAILWAY_ENVIRONMENT || process.env.WEBAPP_URL;
// Убираем завершающий слеш из URL если он есть
const rawWebAppUrl = process.env.WEBAPP_URL || 'https://your-ngrok-url.ngrok.io';
const webAppUrl = rawWebAppUrl.replace(/\/+$/, ''); // Удаляем завершающие слеши

// Инициализируем бот без polling (будем использовать webhook или polling вручную)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Обработка ошибок бота
bot.on('error', (error) => {
    console.error('❌ Ошибка Telegram бота:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Получен сигнал SIGTERM, останавливаем бота...');
    try {
        if (useWebhook) {
            await bot.deleteWebHook();
            console.log('✅ Webhook удален');
        } else {
            await bot.stopPolling();
            console.log('✅ Polling остановлен');
        }
    } catch (err) {
        console.error('Ошибка остановки:', err.message);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Получен сигнал SIGINT, останавливаем бота...');
    try {
        if (useWebhook) {
            await bot.deleteWebHook();
            console.log('✅ Webhook удален');
        } else {
            await bot.stopPolling();
            console.log('✅ Polling остановлен');
        }
    } catch (err) {
        console.error('Ошибка остановки:', err.message);
    }
    process.exit(0);
});

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
    console.log('✅ Обработчик /start вызван!');
    console.log('📨 Получена команда /start от пользователя:', msg.from.username || msg.from.first_name);
    console.log('📋 Chat ID:', msg.chat.id);
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
    const webAppUrlForKeyboard = webAppUrl || 'https://your-ngrok-url.ngrok.io';
    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🚀 Запустить бота',
                    web_app: {
                        url: webAppUrlForKeyboard
                    }
                }
            ]
        ]
    };

    try {
        console.log('📤 Отправляем приветственное сообщение...');
        await bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
        console.log('✅ Сообщение отправлено успешно!');
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        console.error('❌ Stack:', error.stack);
    }
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

// Webhook endpoint для Telegram (должен быть до других POST маршрутов)
// Важно: этот маршрут должен быть ДО app.get('*', ...) чтобы не перехватывался
app.post('/webhook', express.json(), (req, res) => {
    try {
        const update = req.body;
        console.log('📥 Получено обновление от Telegram');
        console.log('📋 Тип обновления:', update.message ? 'message' : update.callback_query ? 'callback_query' : 'other');
        console.log('📋 Данные:', JSON.stringify(update, null, 2));

        if (update.message) {
            console.log('💬 Сообщение:', update.message.text || 'не текстовое');
            console.log('👤 От:', update.message.from?.username || update.message.from?.first_name);
        }

        bot.processUpdate(update);
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        console.error('❌ Stack:', error.stack);
        res.sendStatus(200); // Всегда отвечаем 200, чтобы Telegram не повторял запрос
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        botMode: useWebhook ? 'webhook' : 'polling',
        webAppUrl: webAppUrl
    });
});

// Тестовый endpoint для проверки webhook
app.get('/test-webhook', async (req, res) => {
    try {
        const webhookInfo = await bot.getWebHookInfo();
        res.json({
            success: true,
            webhookInfo: webhookInfo,
            webhookUrl: webhookInfo.url,
            pendingUpdates: webhookInfo.pending_update_count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 WEBAPP_URL: ${webAppUrl}`);
    console.log(`📋 Use Webhook: ${useWebhook ? 'YES' : 'NO'}`);

    // Настраиваем бота в зависимости от окружения
    if (useWebhook && webAppUrl && !webAppUrl.includes('your-ngrok-url')) {
        // Режим webhook для Railway/продакшена
        try {
            const webhookUrl = `${webAppUrl}/webhook`;

            // Сначала получаем информацию о текущем webhook
            console.log('🔍 Проверяем текущий webhook...');
            try {
                const webhookInfo = await bot.getWebHookInfo();
                if (webhookInfo.url) {
                    console.log(`📋 Текущий webhook: ${webhookInfo.url}`);

                    // Если webhook уже установлен на тот же URL, проверяем что он работает
                    if (webhookInfo.url === webhookUrl) {
                        console.log(`✅ Webhook уже установлен на правильный URL`);
                        console.log(`📊 Ожидающих обновлений: ${webhookInfo.pending_update_count || 0}`);
                        console.log(`🤖 Telegram bot активен (webhook mode)`);
                        console.log('✅ Все обработчики готовы к работе');
                        return; // Webhook уже установлен правильно
                    } else {
                        // Удаляем старый webhook
                        console.log('🔄 Удаляем старый webhook...');
                        await bot.deleteWebHook({ drop_pending_updates: true });
                        console.log('✅ Старый webhook удален');
                        
                        // Ждем, чтобы Telegram обработал удаление
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } else {
                    console.log('📋 Webhook не установлен, продолжаем...');
                }
                } catch (e) {
                    console.log('⚠️ Не удалось получить информацию о webhook, продолжаем...');
                    // Пытаемся удалить на всякий случай
                    try {
                        await bot.deleteWebHook({ drop_pending_updates: true });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (delErr) {
                        // Игнорируем ошибки
                    }
                }

            console.log(`🔗 Устанавливаем новый webhook: ${webhookUrl}`);
            await bot.setWebHook(webhookUrl, { drop_pending_updates: true });

            // Проверяем, что webhook установлен
            await new Promise(resolve => setTimeout(resolve, 1000));
            const verifyInfo = await bot.getWebHookInfo();
            if (verifyInfo.url === webhookUrl) {
                console.log(`✅ Telegram webhook успешно установлен: ${webhookUrl}`);
                console.log(`📊 Ожидающих обновлений: ${verifyInfo.pending_update_count || 0}`);
                console.log(`🤖 Telegram bot активен (webhook mode)`);
                console.log('✅ Все обработчики готовы к работе');
            } else {
                console.log(`⚠️ Webhook установлен, но URL не совпадает. Проверьте настройки.`);
                console.log(`📋 Ожидаемый: ${webhookUrl}`);
                console.log(`📋 Фактический: ${verifyInfo.url}`);
            }
            } catch (error) {
                console.error('❌ Ошибка настройки webhook:', error.message);
                if (error.response?.statusCode === 409) {
                    console.log('⚠️ Конфликт при установке webhook. Возможно, другой экземпляр пытается установить его.');
                    console.log('💡 Решение: подождите 10-15 секунд и перезапустите приложение.');
                } else {
                    console.log('⚠️ Webhook не установлен. Бот не будет работать до исправления.');
                }
            }
        } else {
            // Режим polling для локальной разработки
            console.log('🔄 Запускаем polling (локальная разработка)...');
            try {
                // Убедимся, что старый webhook удален
                try {
                    await bot.deleteWebHook({ drop_pending_updates: true });
                } catch (e) {
                    // Игнорируем ошибки
                }

                await bot.startPolling({ polling: { interval: 1000, params: { timeout: 10 } } });
                console.log(`🤖 Telegram bot активен (polling mode)`);
            } catch (error) {
                console.error('❌ Ошибка запуска polling:', error.message);
                if (error.response?.statusCode === 409) {
                    console.log('⚠️ Другой экземпляр бота уже запущен!');
                    console.log('💡 Решения:');
                    console.log('   1. Остановите другие экземпляры бота');
                    console.log('   2. Установите WEBAPP_URL в Railway для использования webhook');
                    console.log('   3. Подождите 1-2 минуты и перезапустите');
                }
            }
        }
    });