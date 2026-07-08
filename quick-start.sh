#!/bin/bash

# GrowEasy Quick Start Script
# Initializes database, builds, and runs the application

set -e

echo "🚀 GrowEasy CSV Importer - Quick Start"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting PostgreSQL with Docker...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ PostgreSQL running${NC}"
sleep 2

echo ""
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${BLUE}Step 3: Generating Prisma Client...${NC}"
cd backend
npm exec prisma generate --schema ../prisma/schema.prisma
cd ..
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo ""
echo -e "${BLUE}Step 4: Building backend...${NC}"
npm run build --workspace backend
echo -e "${GREEN}✓ Backend built${NC}"

echo ""
echo -e "${BLUE}Step 5: Running database migrations...${NC}"
cd backend
npm exec prisma migrate dev --name init
cd ..
echo -e "${GREEN}✓ Database initialized${NC}"

echo ""
echo -e "${BLUE}Step 6: Starting application...${NC}"
echo ""
echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Backend:  http://localhost:4000${NC}"
echo -e "${YELLOW}Database: http://localhost:5432${NC}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
