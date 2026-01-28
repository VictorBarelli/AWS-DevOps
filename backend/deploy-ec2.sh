#!/bin/bash

# Configuration
APP_DIR="/home/ec2-user/app"
REPO_URL="https://github.com/VictorBarelli/AWS-DevOps.git"
BRANCH="main"

# Text Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting GameSwipe Backend Deployment...${NC}"

# Create app directory if not exists
mkdir -p $APP_DIR

# Navigate to app directory
cd $APP_DIR

# Check if git repo exists
if [ -d ".git" ]; then
    echo -e "${GREEN}⬇️ Pulling latest changes from GitHub...${NC}"
    git pull origin $BRANCH
else
    echo -e "${GREEN}📥 Cloning repository...${NC}"
    git clone $REPO_URL .
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
cd backend
npm install

# Setup env if needed (Copy example if no .env exists)
if [ ! -f .env ]; then
    echo -e "${GREEN}⚙️ Creating .env file from example...${NC}"
    cp .env.example .env
    echo "⚠️ Please check .env file and add your secrets (DB credentials, etc.)"
fi

# Start/Restart application with PM2
echo -e "${GREEN}🔄 Restarting application with PM2...${NC}"
pm2 restart gameswipe-backend || pm2 start src/index.js --name gameswipe-backend

echo -e "${GREEN}✅ Deployment Complete!${NC}"
pm2 list
