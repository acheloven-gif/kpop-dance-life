@echo off
setlocal enabledelayedexpansion

echo ================================================
echo K-Cover Dance Life - Full Setup
echo ================================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js detected: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if errorlevel 1 (
    echo npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm detected: %NPM_VERSION%
echo.

REM Setup game
echo Setting up K-Cover Dance Life Game...
cd game
if not exist "node_modules" (
    echo Installing game dependencies...
    call npm install
)
echo [OK] Game setup complete
cd ..
echo.

REM Setup bot
echo Setting up Telegram Bot...
cd bot
if not exist "node_modules" (
    echo Installing bot dependencies...
    call npm install
)

REM Copy .env.example to .env if not exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [WARNING] Please edit .env and add your TELEGRAM_BOT_TOKEN
)

echo [OK] Bot setup complete
cd ..
echo.

REM Summary
echo ================================================
echo Setup Complete! [OK]
echo ================================================
echo.
echo Next steps:
echo 1. Edit bot\.env and add your TELEGRAM_BOT_TOKEN
echo 2. Run: npm run dev:all (to start both game and bot)
echo.
echo Or run separately:
echo - Game only: cd game ^&^& npm run dev
echo - Bot only: cd bot ^&^& npm run dev
echo.
echo For deployment, see:
echo - TELEGRAM_DEPLOYMENT.md
echo - TELEGRAM_INTEGRATION.md
echo.

pause
