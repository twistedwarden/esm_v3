# Document Upload Fix - Deployment Guide

## Problem Summary

Students were encountering a **404 error** when uploading documents, with the error:

```
Failed to load resource: the server responded with a status of 404
Upload error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This occurred because:

1. The frontend was using a **relative URL** (`/api/forms/upload-document`)
2. This meant requests went to the frontend domain instead of the scholarship service API
3. The web server returned an HTML 404 page instead of JSON

## Fixes Applied

### 1. Backend Fixes (Scholarship Service)

#### File: `microservices/scholarship_service/bootstrap/app.php`

**Added JSON error handling for all API routes:**

```php
->withExceptions(function (Exceptions $exceptions): void {
    // Ensure all API routes return JSON responses for errors
    $exceptions->shouldRenderJsonWhen(function ($request, $exception) {
        return $request->is('api/*') || $request->expectsJson();
    });
})
```

**Why**: This ensures that even if a route doesn't exist, the API returns a JSON error instead of HTML.

#### File: `microservices/scholarship_service/routes/api.php`

The document upload route already exists at line 423:

```php
Route::prefix('forms')->middleware(['auth.auth_service'])->group(function () {
    // ...
    Route::post('/upload-document', [DocumentController::class, 'store']);
    // ...
});
```

**Note**: This is the correct route. The issue was in the frontend, not the backend.

### 2. Frontend Fixes (GSM)

#### File: `GSM/src/components/ui/SecureDocumentUpload.tsx`

**Added API config import:**

```typescript
import { API_CONFIG, getScholarshipServiceUrl } from "../../config/api";
```

**Updated fetch call to use full API URL:**

```typescript
// Before (WRONG - relative URL)
const response = await fetch('/api/forms/upload-document', {

// After (CORRECT - full API URL)
const uploadUrl = getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.FORM_UPLOAD_DOCUMENT);
const response = await fetch(uploadUrl, {
```

**Why**: The `getScholarshipServiceUrl` helper function constructs the full URL to the scholarship service API (e.g., `https://scholarship-gsph.up.railway.app/api/forms/upload-document`).

## Deployment Steps

### Step 1: Deploy Backend Changes

1. **SSH into your scholarship service server** or use your deployment platform
2. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```
3. **Clear Laravel caches:**
   ```bash
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   php artisan optimize
   ```
4. **Restart the PHP service** (if applicable):
   ```bash
   # For Railway, this happens automatically on deploy
   # For traditional servers:
   sudo systemctl restart php-fpm
   # or
   sudo service php8.2-fpm restart
   ```

### Step 2: Deploy Frontend Changes

1. **Build the frontend with the updated component:**
   ```bash
   cd GSM
   npm run build
   ```
2. **Deploy the build to your hosting platform**
   - For Railway: Push to your repository
   - For manual deployment: Upload the `dist` folder

### Step 3: Verify the Fix

1. **Open your browser's Developer Tools** (F12)
2. **Go to the Network tab**
3. **Log in as a student**
4. **Navigate to the application form**
5. **Try uploading a document**
6. **Verify in the Network tab:**
   - Request URL should be: `https://scholarship-gsph.up.railway.app/api/forms/upload-document`
   - Method should be: `POST`
   - Status should be: `200` or `201` (success)
   - Response should be JSON with `success: true`

## Testing Checklist

- [ ] Backend routes are cached and cleared
- [ ] Frontend is rebuilt with new changes
- [ ] Document upload shows correct API URL in Network tab
- [ ] Upload returns JSON response (not HTML)
- [ ] Successful upload shows success message
- [ ] Failed upload shows proper error message (not JSON parse error)
- [ ] Uploaded document appears in the document list

## Expected API Behavior

### Successful Upload

**Request:**

```
POST https://scholarship-gsph.up.railway.app/api/forms/upload-document
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  file: <file>
  student_id: 123
  application_id: 456
  document_type_id: 1
```

**Response (200/201):**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 789,
    "student_id": 123,
    "application_id": 456,
    "document_type_id": 1,
    "file_name": "transcript.pdf",
    "file_path": "documents/abc-123.pdf",
    "status": "pending",
    "created_at": "2025-10-18T12:34:56.000000Z"
  }
}
```

### Failed Upload (Validation Error)

**Response (422):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "file": ["The file field is required."],
    "student_id": ["The student id field is required."]
  }
}
```

### Failed Upload (Authentication Error)

**Response (401):**

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Failed Upload (Server Error)

**Response (500):**

```json
{
  "success": false,
  "message": "Failed to upload document",
  "error": "Detailed error message"
}
```

## Common Issues & Solutions

### Issue 1: Still getting 404 errors

**Solution**: Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue 2: CORS errors

**Solution**: Verify CORS configuration in `microservices/scholarship_service/config/cors.php`:

```php
'allowed_origins' => [
    'https://educ.goserveph.com',
    'http://localhost:3000',
    'http://localhost:5173',
],
```

### Issue 3: Authentication errors

**Solution**: Check that the auth token is being sent correctly:

```javascript
localStorage.getItem("auth_token"); // Should return a valid token
```

### Issue 4: Route not found even after cache clear

**Solution**: Check if the route is registered:

```bash
php artisan route:list | grep upload-document
```

Expected output:

```
POST      api/forms/upload-document ... DocumentController@store
```

## Files Changed

### Backend

- `microservices/scholarship_service/bootstrap/app.php`
- `microservices/scholarship_service/routes/api.php` (clarification only)

### Frontend

- `GSM/src/components/ui/SecureDocumentUpload.tsx`

## Rollback Plan

If issues occur after deployment:

1. **Revert the frontend changes:**

   ```bash
   git revert <commit-hash>
   npm run build
   ```

2. **Revert the backend changes:**

   ```bash
   git revert <commit-hash>
   php artisan route:clear
   php artisan config:clear
   ```

3. **Deploy the previous version**

## Support

If you encounter issues after following this guide:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Check the browser console for detailed error messages
3. Verify the Network tab shows the correct API URL
4. Ensure authentication token is valid and not expired

---

**Last Updated**: October 18, 2025
**Version**: 1.0
**Status**: ✅ Ready for Deployment
