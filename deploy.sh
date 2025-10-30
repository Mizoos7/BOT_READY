#!/bin/bash

# Скрипт для деплоя на VPS
echo "🚀 Начинаем деплой AI Photo Analyzer на VPS..."

# Обновляем систему
echo "📦 Обновляем систему..."
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js
echo "📦 Устанавливаем Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Устанавливаем PM2
echo "📦 Устанавливаем PM2..."
sudo npm install -g pm2

# Устанавливаем Nginx
echo "📦 Устанавливаем Nginx..."
sudo apt install -y nginx

# Создаем директорию проекта
echo "📁 Создаем директорию проекта..."
sudo mkdir -p /var/www/ai-photo-analyzer
sudo chown -R $USER:$USER /var/www/ai-photo-analyzer

# Копируем файлы проекта
echo "📋 Копируем файлы проекта..."
cp -r . /var/www/ai-photo-analyzer/

# Переходим в директорию проекта
cd /var/www/ai-photo-analyzer

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install
cd server
npm install
cd ..

# Создаем .env файл
echo "⚙️ Создаем .env файл..."
cat > server/.env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Web App URL (замените на ваш домен)
WEBAPP_URL=https://your-domain.com

# Server Configuration
PORT=3001
EOF

# Создаем PM2 конфигурацию
echo "⚙️ Создаем PM2 конфигурацию..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ai-photo-analyzer',
    script: 'server/index.js',
    cwd: '/var/www/ai-photo-analyzer',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Настраиваем Nginx
echo "⚙️ Настраиваем Nginx..."
sudo cat > /etc/nginx/sites-available/ai-photo-analyzer << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Статические файлы фронтенда
    location / {
        root /var/www/ai-photo-analyzer/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API запросы к серверу
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Загрузка файлов
    location /uploads/ {
        alias /var/www/ai-photo-analyzer/uploads/;
    }
}
EOF

# Включаем сайт
sudo ln -s /etc/nginx/sites-available/ai-photo-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Запускаем приложение через PM2
echo "🚀 Запускаем приложение..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Деплой завершен!"
echo "📝 Не забудьте:"
echo "1. Обновить .env файл с вашими токенами"
echo "2. Настроить домен в Nginx конфигурации"
echo "3. Установить SSL сертификат (Let's Encrypt)"
echo "4. Обновить URL в BotFather"
