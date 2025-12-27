# Brevo OTP System Setup Guide

## Overview
This guide explains how to set up the Brevo OTP (One-Time Password) system for GoServePH using the Brevo API.

## Prerequisites
1. Brevo account (sign up at https://www.brevo.com/)
2. Brevo API key from https://app.brevo.com/settings/keys/api

## Setup Instructions

### 1. Get Your Brevo API Key
1. Go to https://app.brevo.com/settings/keys/api
2. Create a new API key or use an existing one
3. Copy the API key (it looks like: `xkeys-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Environment Configuration
Create a `.env` file in your project root with:

```env
# Brevo Email Service Configuration
VITE_BREVO_API_KEY=your_brevo_api_key_here

# Google OAuth Configuration  
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Development Configuration
VITE_DEBUG_MODE=true
VITE_SHOW_OTP_IN_DEV=true
```

### 3. Features Included

#### Email Templates
- **OTP Verification**: Professional HTML email with security warnings
- **Welcome Email**: Post-registration welcome message
- **Password Reset**: Secure password reset with token

#### OTP System Features
- 6-digit numeric OTP codes
- 5-minute expiration time
- 3 maximum verification attempts
- 1-minute cooldown between resend requests
- Automatic cleanup of expired OTPs

#### Security Features
- Rate limiting on OTP requests
- Attempt tracking and blocking
- Secure token generation
- Email validation

### 4. Usage Examples

#### Send OTP
```typescript
import { apiService } from './services/apiService';

const result = await apiService.sendOtp('user@example.com', 'John Doe');
if (result.success) {
  console.log('OTP sent successfully');
}
```

#### Verify OTP
```typescript
const result = await apiService.verifyOtp('user@example.com', '123456');
if (result.success) {
  console.log('OTP verified successfully');
}
```

### 5. Integration with Existing Code

The system integrates seamlessly with your existing GatewayLogin component:

- OTP generation during registration
- Email verification flow
- Resend OTP functionality
- Timer-based UI updates

### 6. Testing

In development mode, OTP codes are logged to console for testing:
```typescript
// Check console for: "OTP Code: 123456"
```

### 7. Production Considerations

- Set `VITE_DEBUG_MODE=false` in production
- Use environment-specific API keys
- Monitor email delivery rates
- Set up proper error handling

## Support

For issues with:
- Brevo API: Check https://developers.brevo.com/
- OTP System: Review the service files in `/src/services/`
- Email Templates: Customize templates in `brevoService.ts`
