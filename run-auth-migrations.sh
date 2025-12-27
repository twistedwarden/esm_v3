#!/bin/bash

# Script to run migrations on Railway auth service
# Usage: ./run-auth-migrations.sh

echo "=========================================="
echo "Auth Service Migration Runner"
echo "=========================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✓ Railway CLI is installed"
echo ""

# Navigate to auth service directory
cd microservices/auth_service

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: artisan file not found. Make sure you're running this from the project root."
    exit 1
fi

echo "✓ Found auth service directory"
echo ""

# Check if logged in to Railway
echo "Checking Railway login status..."
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Not logged in to Railway. Logging in..."
    railway login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to login to Railway"
        exit 1
    fi
fi

echo "✓ Logged in to Railway"
echo ""

# Link to project if not already linked
echo "Linking to Railway project..."
railway link
if [ $? -ne 0 ]; then
    echo "❌ Failed to link to Railway project"
    exit 1
fi

echo "✓ Linked to Railway project"
echo ""

# Show current migration status
echo "Current migration status:"
echo "----------------------------------------"
railway run php artisan migrate:status
echo "----------------------------------------"
echo ""

# Ask for confirmation
read -p "Do you want to run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Running migrations..."
    echo "----------------------------------------"
    railway run php artisan migrate --force
    echo "----------------------------------------"
    echo ""
    
    if [ $? -eq 0 ]; then
        echo "✓ Migrations completed successfully!"
        echo ""
        echo "New migration status:"
        echo "----------------------------------------"
        railway run php artisan migrate:status
        echo "----------------------------------------"
    else
        echo "❌ Migrations failed!"
        exit 1
    fi
else
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "Migration process completed!"
echo "=========================================="
echo ""
echo "You can now try creating users with SSC roles."

