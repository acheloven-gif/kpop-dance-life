#!/usr/bin/env bash

# K-Cover Dance Life - Telegram Bot Launcher
# Скрипт для запуска игры и бота одновременно

set -e

echo "🎮 K-Cover Dance Life - Telegram Bot"
echo "====================================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    echo "Установите Node.js 18+ с https://nodejs.org/"
    exit 1
fi

# Проверка .env файла в боте
if [ ! -f "bot/.env" ]; then
    echo "⚠️  bot/.env не найден"
    echo "Создаю из .env.example..."
    cp bot/.env.example bot/.env
    echo ""
    echo "⚠️  ВАЖНО: Отредактируйте bot/.env и добавьте TELEGRAM_BOT_TOKEN"
    echo ""
fi

# Проверка токена в .env
if ! grep -q "YOUR_BOT_TOKEN_HERE\|^TELEGRAM_BOT_TOKEN=" bot/.env; then
    if grep -q "^TELEGRAM_BOT_TOKEN=" bot/.env; then
        TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" bot/.env | cut -d '=' -f 2)
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "YOUR_BOT_TOKEN_HERE" ]; then
            echo "✅ Токен найден в bot/.env"
        fi
    fi
fi

# Проверка node_modules в game
if [ ! -d "game/node_modules" ]; then
    echo "📦 Установка зависимостей игры..."
    cd game
    npm install
    cd ..
    echo "✅ Игра готова"
    echo ""
fi

# Проверка node_modules в bot
if [ ! -d "bot/node_modules" ]; then
    echo "📦 Установка зависимостей бота..."
    cd bot
    npm install
    cd ..
    echo "✅ Бот готов"
    echo ""
fi

# Построение игры для production (опционально)
if [ "$1" = "--build" ]; then
    echo "🔨 Сборка игры для production..."
    cd game
    npm run build
    cd ..
    echo "✅ Игра собрана"
    echo ""
fi

echo "🚀 Запуск сервисов..."
echo ""
echo "📌 Игра запустится на:  http://localhost:5173"
echo "📌 Бот запустится на:   http://localhost:3000"
echo ""
echo "Telegram: @BotFather → создайте бота → добавьте токен в bot/.env"
echo ""

# Запуск с использованием GNU parallel если доступна
if command -v parallel &> /dev/null; then
    echo "▶️  Запуск параллельно..."
    parallel --halt soon,fail=1 ::: \
        "cd game && npm run dev" \
        "cd bot && npm run dev"
else
    # Или используем npm scripts если они настроены
    if grep -q "dev:all" package.json 2>/dev/null; then
        npm run dev:all
    else
        # Иначе предлагаем запустить в двух окнах
        echo "⚠️  Запустите в двух отдельных терминалах:"
        echo ""
        echo "Терминал 1 (Игра):"
        echo "  cd game && npm run dev"
        echo ""
        echo "Терминал 2 (Бот):"
        echo "  cd bot && npm run dev"
        echo ""
        echo "Затем откройте Telegram и найдите вашего бота"
    fi
fi
