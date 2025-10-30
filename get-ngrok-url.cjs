const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function getNgrokUrl() {
    try {
        // Получаем список туннелей ngrok
        const response = await axios.get('http://localhost:4040/api/tunnels');
        const tunnels = response.data.tunnels;

        // Ищем HTTPS туннель
        const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');

        if (httpsTunnel) {
            const ngrokUrl = httpsTunnel.public_url;
            console.log('🌐 Найден ngrok URL:', ngrokUrl);

            // Читаем .env файл
            const envPath = path.join(__dirname, '.env');
            let envContent = '';

            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            } else {
                // Создаем .env из .env.example если его нет
                const examplePath = path.join(__dirname, 'env.example');
                if (fs.existsSync(examplePath)) {
                    envContent = fs.readFileSync(examplePath, 'utf8');
                }
            }

            // Обновляем или добавляем WEBAPP_URL
            const lines = envContent.split('\n');
            let updated = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('WEBAPP_URL=')) {
                    lines[i] = `WEBAPP_URL=${ngrokUrl}`;
                    updated = true;
                    break;
                }
            }

            if (!updated) {
                lines.push(`WEBAPP_URL=${ngrokUrl}`);
            }

            // Записываем обновленный .env файл
            fs.writeFileSync(envPath, lines.join('\n'));
            console.log('✅ .env файл обновлен с ngrok URL');

            return ngrokUrl;
        } else {
            console.log('❌ HTTPS туннель не найден');
            return null;
        }
    } catch (error) {
        console.log('❌ Ошибка получения ngrok URL:', error.message);
        return null;
    }
}

// Запускаем функцию
getNgrokUrl();
