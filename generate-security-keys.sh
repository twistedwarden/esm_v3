#!/bin/bash

# ========================================
# Security Keys Generator
# ========================================
# This script generates secure random keys for microservices authentication

echo "========================================="
echo "GSM Security Keys Generator"
echo "========================================="
echo ""

# Function to generate API key (32 bytes, base64 encoded)
generate_api_key() {
    openssl rand -base64 32 | tr -d '\n'
}

# Function to generate shared secret (64 bytes, base64 encoded)
generate_shared_secret() {
    openssl rand -base64 64 | tr -d '\n'
}

echo "Generating API Keys (32 bytes each)..."
echo "========================================="
echo ""

echo "# API Keys for each service"
echo "# Add these to each service's .env file"
echo ""
echo "AUTH_SERVICE_API_KEY=$(generate_api_key)"
echo "SCHOLARSHIP_SERVICE_API_KEY=$(generate_api_key)"
echo "AID_SERVICE_API_KEY=$(generate_api_key)"
echo "MONITORING_SERVICE_API_KEY=$(generate_api_key)"
echo ""

echo "========================================="
echo "Generating Shared Secrets (64 bytes each)..."
echo "========================================="
echo ""

echo "# Shared Secrets for HMAC request signing"
echo "# Add these to each service's .env file"
echo ""
echo "AUTH_SERVICE_SHARED_SECRET=$(generate_shared_secret)"
echo "SCHOLARSHIP_SERVICE_SHARED_SECRET=$(generate_shared_secret)"
echo "AID_SERVICE_SHARED_SECRET=$(generate_shared_secret)"
echo "MONITORING_SERVICE_SHARED_SECRET=$(generate_shared_secret)"
echo ""

echo "========================================="
echo "✅ Keys generated successfully!"
echo "========================================="
echo ""
echo "IMPORTANT SECURITY NOTES:"
echo "1. Store these keys securely"
echo "2. Never commit them to version control"
echo "3. Use different keys for each environment (dev, staging, prod)"
echo "4. Rotate keys regularly (every 90 days recommended)"
echo "5. Each microservice needs ALL keys to communicate"
echo ""
echo "Next Steps:"
echo "1. Copy the keys above to each microservice's .env file"
echo "2. Make sure each service has its own unique API_KEY"
echo "3. All services should share the same keys for other services"
echo "4. Restart all services after updating .env files"
echo ""
