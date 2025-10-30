import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

interface TelegramWebAppProps {
    children: React.ReactNode;
}

const TelegramWebApp: React.FC<TelegramWebAppProps> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Инициализируем Telegram Web App
        WebApp.ready();
        WebApp.expand();

        // Получаем данные пользователя
        const tgUser = WebApp.initDataUnsafe?.user;
        if (tgUser) {
            console.log('Telegram User:', tgUser);
        }

        // Настраиваем тему
        WebApp.setHeaderColor('#1976d2');
        WebApp.setBackgroundColor('#ffffff');

        // Включаем кнопку закрытия
        WebApp.enableClosingConfirmation();

        setIsReady(true);

        // Обработчик закрытия приложения
        const handleBackButton = () => {
            WebApp.close();
        };

        WebApp.onEvent('backButtonClicked', handleBackButton);

        return () => {
            WebApp.offEvent('backButtonClicked', handleBackButton);
        };
    }, []);

    if (!isReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '24px', marginBottom: '16px' }}>🤖</div>
                    <div>Загрузка AI Photo Analyzer...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '0'
        }}>
            {children}
        </div>
    );
};

export default TelegramWebApp;
