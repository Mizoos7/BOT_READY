# 🚀 Деплой на VPS

## Требования к VPS
- Ubuntu 20.04+ или Debian 11+
- Минимум 1GB RAM
- Минимум 10GB диска
- Домен (для HTTPS)

## Быстрый деплой

### 1. Подготовка VPS
```bash
# Подключитесь к VPS
ssh root@your-vps-ip

# Скачайте и запустите скрипт деплоя
wget https://raw.githubusercontent.com/your-repo/ai-photo-analyzer/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 2. Ручной деплой

#### Установка зависимостей
```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Устанавливаем PM2
sudo npm install -g pm2

# Устанавливаем Nginx
sudo apt install -y nginx
```

#### Загрузка проекта
```bash
# Создаем директорию
sudo mkdir -p /var/www/ai-photo-analyzer
sudo chown -R $USER:$USER /var/www/ai-photo-analyzer

# Загружаем файлы (через git или scp)
cd /var/www/ai-photo-analyzer
git clone https://github.com/your-repo/ai-photo-analyzer.git .

# Или через scp с локальной машины:
# scp -r d:\web3\gemblyshka/* user@your-vps-ip:/var/www/ai-photo-analyzer/
```

#### Установка зависимостей
```bash
cd /var/www/ai-photo-analyzer
npm install
cd server
npm install
cd ..
```

#### Настройка .env
```bash
nano server/.env
```

Содержимое:
```
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Web App URL (замените на ваш домен)
WEBAPP_URL=https://your-domain.com

# Server Configuration
PORT=3001
```

#### Настройка Nginx
```bash
# Копируем конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/ai-photo-analyzer

# Заменяем домен в конфигурации
sudo sed -i 's/your-domain.com/your-actual-domain.com/g' /etc/nginx/sites-available/ai-photo-analyzer

# Включаем сайт
sudo ln -s /etc/nginx/sites-available/ai-photo-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Запуск приложения
```bash
# Запускаем через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Проверяем статус
pm2 status
pm2 logs
```

### 3. Настройка SSL (Let's Encrypt)
```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем сертификат
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Настройка BotFather
1. Откройте [@BotFather](https://t.me/BotFather)
2. `/mybots` → выберите бота → "Bot Settings" → "Menu Button"
3. Введите ваш домен: `https://your-domain.com`

## Мониторинг

### PM2 команды
```bash
pm2 status          # Статус приложений
pm2 logs            # Логи
pm2 restart all     # Перезапуск
pm2 stop all        # Остановка
pm2 delete all      # Удаление
```

### Nginx команды
```bash
sudo systemctl status nginx    # Статус
sudo systemctl restart nginx   # Перезапуск
sudo nginx -t                  # Проверка конфигурации
```

### Логи
```bash
# Логи приложения
pm2 logs ai-photo-analyzer

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -u nginx -f
```

## Обновление приложения
```bash
cd /var/www/ai-photo-analyzer
git pull origin main
npm run build
pm2 restart ai-photo-analyzer
```

## Резервное копирование
```bash
# Создаем бэкап
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/ai-photo-analyzer

# Восстанавливаем
tar -xzf backup-20231201.tar.gz -C /
```

## Безопасность
- Настройте firewall: `sudo ufw enable`
- Отключите root SSH: `sudo nano /etc/ssh/sshd_config`
- Установите fail2ban: `sudo apt install fail2ban`
- Регулярно обновляйте систему

## Производительность
- Настройте swap файл
- Оптимизируйте Nginx
- Используйте CDN для статики
- Мониторьте использование ресурсов
