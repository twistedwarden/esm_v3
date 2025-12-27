#!/bin/bash

echo "Setting up User Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Setting up Auth Service...${NC}"
cd microservices/auth_service

# Run migrations
echo "Running auth service migrations..."
php artisan migrate --force

# Run user seeder
echo "Seeding users in auth service..."
php artisan db:seed --class=UserSeeder

echo -e "${GREEN}✓ Auth service setup complete${NC}"

echo -e "${YELLOW}2. Setting up Scholarship Service...${NC}"
cd ../scholarship_service

# Run migrations
echo "Running scholarship service migrations..."
php artisan migrate --force

# Run user management seeder
echo "Seeding staff records in scholarship service..."
php artisan db:seed --class=UserManagementSeeder

echo -e "${GREEN}✓ Scholarship service setup complete${NC}"

echo -e "${YELLOW}3. Testing API endpoints...${NC}"

# Test auth service
echo "Testing auth service..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/users)
if [ $AUTH_RESPONSE -eq 200 ]; then
    echo -e "${GREEN}✓ Auth service is responding${NC}"
else
    echo -e "${RED}✗ Auth service not responding (HTTP $AUTH_RESPONSE)${NC}"
    echo "Make sure auth service is running on port 8001"
fi

# Test scholarship service
echo "Testing scholarship service..."
SCHOLARSHIP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/test/users)
if [ $SCHOLARSHIP_RESPONSE -eq 200 ]; then
    echo -e "${GREEN}✓ Scholarship service is responding${NC}"
else
    echo -e "${RED}✗ Scholarship service not responding (HTTP $SCHOLARSHIP_RESPONSE)${NC}"
    echo "Make sure scholarship service is running on port 8000"
fi

echo -e "${GREEN}User Management System setup complete!${NC}"
echo ""
echo "Sample users created:"
echo "- Admin: admin@caloocan.gov.ph (password: admin123)"
echo "- Staff: staff@caloocan.gov.ph (password: staff123)"
echo "- Citizens: citizen@example.com, juan.delacruz@example.com, ana.garcia@example.com (password: citizen123)"
echo "- Partner School Rep: school.rep@university.edu.ph (password: psrep123)"
echo ""
echo "You can now access the User Management dashboard in the admin panel!"
