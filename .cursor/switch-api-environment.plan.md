# Switch API Environment (Local ↔ Production)

This prompt helps you quickly switch between local development and production API endpoints without touching .env files.

## Quick Switch Instructions

### Method 1: Update Config File (Recommended)

**Location**: `GSM/src/config/environment.ts` or `GSM/src/config/api.js`

**Switch to Local Development**:

```typescript
export const API_CONFIG = {
  AUTH_SERVICE: {
    BASE_URL: "http://localhost:8000",
    ENDPOINTS: { /* ... */ }
  },
  SCHOLARSHIP_SERVICE: {
    BASE_URL: "http://localhost:8001",
    ENDPOINTS: { /* ... */ }
  },
  AID_SERVICE: {
    BASE_URL: "http://localhost:8002",
    ENDPOINTS: { /* ... */ }
  },
  MONITORING_SERVICE: {
    BASE_URL: "http://localhost:8003",
    ENDPOINTS: { /* ... */ }
  }
};
```

**Switch to Production**:

```typescript
export const API_CONFIG = {
  AUTH_SERVICE: {
    BASE_URL: "https://auth-gsph.up.railway.app",
    ENDPOINTS: { /* ... */ }
  },
  SCHOLARSHIP_SERVICE: {
    BASE_URL: "https://scholarship-gsph.up.railway.app",
    ENDPOINTS: { /* ... */ }
  },
  AID_SERVICE: {
    BASE_URL: "https://aid.gsph.com",
    ENDPOINTS: { /* ... */ }
  },
  MONITORING_SERVICE: {
    BASE_URL: "https://monitoring.gsph.com",
    ENDPOINTS: { /* ... */ }
  }
};
```

### Method 2: Update Vite Config

**Location**: `GSM/vite.config.ts`

**Add/update the define property**:

```typescript
export default defineConfig({
  plugins: [react()],
  base: "/",
  define: {
    // Switch between 'local' and 'production'
    __API_ENV__: JSON.stringify("local"), // or 'production'
  },
});
```

Then in your code:

```typescript
const API_BASE = __API_ENV__ === "local" 
  ? "http://localhost:8000" 
  : "https://auth-gsph.up.railway.app";
```

### Method 3: Smart Auto-Detection

**Update config to auto-detect**:

```typescript
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_CONFIG = {
  AUTH_SERVICE: {
    BASE_URL: isLocalhost ? "http://localhost:8000" : "https://auth-gsph.up.railway.app",
  },
  SCHOLARSHIP_SERVICE: {
    BASE_URL: isLocalhost ? "http://localhost:8001" : "https://scholarship-gsph.up.railway.app",
  },
  // ... other services
};
```

## AI Assistant Usage

**"Switch to local APIs"** → Updates config files to use localhost URLs
**"Switch to production APIs"** → Updates config files to use production URLs
**"Use auto-detect for APIs"** → Implements smart detection based on hostname
**"Show current API configuration"** → Displays active API endpoints

## Verification

After switching, restart dev server and check:

```bash
cd GSM
npm run dev
```

## Service Ports Reference

| Service     | Local      | Production           |
| ----------- | ---------- | -------------------- |
| Auth        | :8000      | auth.gsph.com        |
| Scholarship | :8001      | scholarship.gsph.com |
| Aid         | :8002      | aid.gsph.com         |
| Monitoring  | :8003      | monitoring.gsph.com  |
