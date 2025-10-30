# Решение проблемы HTTPS для Telegram Web App

## Проблема
Telegram Bot API требует HTTPS URL для Web App кнопок. Ошибка:
```
ETELEGRAM: 400 Bad Request: inline keyboard button Web App URL 'http://localhost:5173' is invalid: Only HTTPS links are allowed
```

## Решение
Используем ngrok для создания HTTPS туннеля к localhost.

## Установка и настройка

### 1. Установка ngrok
```bash
npm install -g ngrok
```

### 2. Автоматический запуск
Запустите `start.bat` - он автоматически:
- Запустит ngrok туннель
- Получит HTTPS URL
- Обновит .env файл
- Запустит сервер и фронтенд

### 3. Ручная настройка (если нужно)
1. Запустите ngrok: `ngrok http 5173`
2. Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)
3. Обновите .env файл:
   ```
   WEBAPP_URL=https://abc123.ngrok.io
   ```
4. Перезапустите сервер

## Файлы изменений
- `server/index.js` - добавлена поддержка переменной окружения WEBAPP_URL
- `env.example` - добавлена переменная WEBAPP_URL
- `start.bat` - автоматический запуск ngrok и обновление .env
- `get-ngrok-url.js` - скрипт для автоматического получения ngrok URL
- `start-ngrok.bat` - отдельный скрипт для запуска только ngrok

## Проверка работы
1. Запустите `start.bat`
2. Проверьте, что в .env файле появился HTTPS URL
3. Отправьте команду /start боту в Telegram
4. Кнопка "Запустить бота" должна работать без ошибок
