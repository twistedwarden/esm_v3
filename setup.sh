#!/bin/bash

# Fresh Project Setup Script
# This script sets up the entire GSPH project from scratch

set -e  # Exit on error

echo "========================================="
echo "  GSPH Fresh Project Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install root dependencies
echo -e "${BLUE}[1/6] Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Step 2: Install GSM dependencies
echo -e "${BLUE}[2/6] Installing GSM dependencies...${NC}"
cd GSM
npm install
cd ..
echo -e "${GREEN}✓ GSM dependencies installed${NC}"
echo ""

# Step 3: Install GSM API dependencies
echo -e "${BLUE}[3/6] Installing GSM API dependencies...${NC}"
cd GSM/api
npm install
cd ../..
echo -e "${GREEN}✓ GSM API dependencies installed${NC}"
echo ""

# Step 4: Install composer dependencies for all services
echo -e "${BLUE}[4/6] Installing composer dependencies for all services...${NC}"

services=("aid_service" "auth_service" "monitoring_service" "scholarship_service")

for service in "${services[@]}"; do
    echo "  → Installing dependencies for $service..."
    cd "microservices/$service"
    composer install
    cd ../..
    echo -e "${GREEN}  ✓ $service dependencies installed${NC}"
done
echo ""

# Step 5: Run migrations for all services
echo -e "${BLUE}[5/6] Running migrations for all services...${NC}"

for service in "${services[@]}"; do
    echo "  → Running migrations for $service..."
    cd "microservices/$service"
    php artisan migrate:fresh --seed
    cd ../..
    echo -e "${GREEN}  ✓ $service migrations completed${NC}"
done
echo ""

# Step 6: Summary
echo -e "${BLUE}[6/6] Setup Summary${NC}"
echo "========================================="
echo -e "${GREEN}✓ All dependencies installed${NC}"
echo -e "${GREEN}✓ All databases migrated and seeded${NC}"
echo "========================================="
echo ""
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Configure your .env files if not already done"
echo "  2. Start the GSM API: cd GSM/api && npm start"
echo "  3. Start the GSM frontend: cd GSM && npm run dev"
echo ""

