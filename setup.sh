#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}K-Cover Dance Life - Full Setup${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js detected: $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm detected: $(npm -v)${NC}"
echo ""

# Setup game
echo -e "${YELLOW}Setting up K-Cover Dance Life Game...${NC}"
cd game
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing game dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✓ Game setup complete${NC}"
cd ..
echo ""

# Setup bot
echo -e "${YELLOW}Setting up Telegram Bot...${NC}"
cd bot
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing bot dependencies...${NC}"
    npm install
fi

# Copy .env.example to .env if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env and add your TELEGRAM_BOT_TOKEN${NC}"
fi

echo -e "${GREEN}✓ Bot setup complete${NC}"
cd ..
echo ""

# Summary
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Setup Complete! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit bot/.env and add your TELEGRAM_BOT_TOKEN"
echo "2. Run: npm run dev:all (to start both game and bot)"
echo ""
echo -e "${YELLOW}Or run separately:${NC}"
echo "- Game only: cd game && npm run dev"
echo "- Bot only: cd bot && npm run dev"
echo ""
echo -e "${YELLOW}For deployment, see:${NC}"
echo "- TELEGRAM_DEPLOYMENT.md"
echo "- TELEGRAM_INTEGRATION.md"
echo ""
