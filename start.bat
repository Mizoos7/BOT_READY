@echo off
echo Starting AI Photo Analyzer...

echo Installing dependencies...
call npm install
cd server
call npm install
cd ..

echo Starting ngrok tunnel for HTTPS...
start "ngrok" cmd /k "ngrok http 5173"

timeout /t 10 /nobreak > nul

echo Getting ngrok URL and updating .env...
node get-ngrok-url.js

timeout /t 2 /nobreak > nul

echo Starting Backend Server...
start "Backend" cmd /k "cd server && node index.js"

timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo HTTPS URL автоматически обновлен!
echo ========================================
echo ngrok URL автоматически добавлен в .env файл
echo Теперь Telegram бот будет работать с HTTPS
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /f /im node.exe
taskkill /f /im cmd.exe
taskkill /f /im ngrok.exe
