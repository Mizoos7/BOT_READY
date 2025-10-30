@echo off
echo Uploading AI Photo Analyzer to VPS...

set /p VPS_IP="Enter VPS IP address: "
set /p VPS_USER="Enter VPS username (default: root): "
if "%VPS_USER%"=="" set VPS_USER=root

echo.
echo Uploading files to VPS...
echo VPS: %VPS_USER%@%VPS_IP%
echo.

echo Creating directory on VPS...
ssh %VPS_USER%@%VPS_IP% "mkdir -p /var/www/ai-photo-analyzer"

echo Uploading project files...
scp -r . %VPS_USER%@%VPS_IP%:/var/www/ai-photo-analyzer/

echo.
echo Files uploaded successfully!
echo.
echo Next steps:
echo 1. SSH to VPS: ssh %VPS_USER%@%VPS_IP%
echo 2. Run: cd /var/www/ai-photo-analyzer
echo 3. Run: chmod +x deploy.sh
echo 4. Run: ./deploy.sh
echo.
pause
