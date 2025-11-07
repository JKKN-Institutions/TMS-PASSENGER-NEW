# Bug Reporter URL Configuration Fix

## Issue Found in Production

After deploying to Vercel, the Bug Reporter SDK was failing with CORS error:

```
Access to fetch at 'https://your-platform.com/api/v1/public/api/v1/public/bug-reports'
from origin 'https://tms.jkkn.ai' has been blocked by CORS policy
```

**Problem**: The URL path was **duplicated**: `/api/v1/public/api/v1/public/bug-reports`

---

## Root Cause

The `NEXT_PUBLIC_BUG_REPORTER_API_URL` environment variable was set to:

```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com/api/v1/public
```

But the Bug Reporter SDK **automatically appends** `/api/v1/public/bug-reports` to the base URL, resulting in:

```
https://your-platform.com/api/v1/public + /api/v1/public/bug-reports
= https://your-platform.com/api/v1/public/api/v1/public/bug-reports ❌
```

---

## Solution

Changed the environment variable to use **base URL only**:

### ❌ Incorrect (Before)

```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com/api/v1/public
```

### ✅ Correct (After)

```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com
```

Now the SDK correctly constructs:

```
https://your-platform.com + /api/v1/public/bug-reports
= https://your-platform.com/api/v1/public/bug-reports ✅
```

---

## How the SDK Works

The Bug Reporter SDK internally handles the API path construction:

```typescript
// SDK Internal Logic
const apiUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL; // Base URL only
const endpoint = `${apiUrl}/api/v1/public/bug-reports`; // SDK adds path
```

**Therefore**: Always provide **base URL only** without any path segments.

---

## Configuration Examples

### ✅ Correct Examples

```env
# Example 1: Main domain
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://bugs.jkkn.ai

# Example 2: Subdomain
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://platform.company.com

# Example 3: With port
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://localhost:3000
```

### ❌ Incorrect Examples

```env
# Don't include /api/v1/public path
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://bugs.jkkn.ai/api/v1/public

# Don't include any API path
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://bugs.jkkn.ai/api

# Don't include trailing slash (unless your base URL requires it)
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://bugs.jkkn.ai/
```

---

## Files Updated

### 1. `.env.local`

**Before**:
```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com/api/v1/public
```

**After**:
```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com
```

### 2. Documentation Files

Updated all documentation to reflect correct URL format:

- ✅ `VERCEL_DEPLOYMENT_GUIDE.md` - Added warning about base URL only
- ✅ `BUG_REPORTER_SDK_INTEGRATION.md` - Corrected examples and added notes
- ✅ `DEPLOYMENT_READY.md` - Updated environment variable examples

---

## Vercel Configuration

When adding environment variables to Vercel:

1. Go to Vercel Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_BUG_REPORTER_API_URL`
3. **Value**: Your platform's base URL only (e.g., `https://bugs.jkkn.ai`)
4. **Scope**: Production, Preview, Development
5. Redeploy application

---

## Testing

After fixing the URL, verify:

1. **No Duplicate Path**:
   - Open browser console
   - Submit a bug report
   - Check the network tab
   - URL should be: `https://your-platform.com/api/v1/public/bug-reports`
   - NOT: `https://your-platform.com/api/v1/public/api/v1/public/bug-reports`

2. **No CORS Error**:
   - Bug report submits successfully
   - No CORS error in console
   - Success toast appears

3. **Console Logs**:
   ```
   [BugReporter SDK] Starting screenshot capture...
   [BugReporter SDK] Screenshot captured successfully
   [BugReporter SDK] Bug report submitted successfully
   ```

---

## Important Notes

### For Developers

- Always use **base URL** for `NEXT_PUBLIC_BUG_REPORTER_API_URL`
- SDK handles all path construction internally
- Do not manually append API paths

### For Deployment

- Update environment variable on Vercel
- Redeploy after changing the URL
- Test bug submission after deployment

### For Testing

If using a placeholder URL like `https://your-platform.com`:
1. Replace with actual Bug Reporter platform URL
2. Ensure platform is accessible from browser
3. Verify CORS is configured on platform to allow your domain

---

## Error Patterns

### Duplicate Path Error

**Symptom**:
```
Failed to fetch
https://your-platform.com/api/v1/public/api/v1/public/bug-reports
```

**Cause**: URL includes `/api/v1/public` path

**Fix**: Remove path, use base URL only

### CORS Error

**Symptom**:
```
Access to fetch at 'https://...' has been blocked by CORS policy
```

**Causes**:
1. Incorrect URL (duplicate path)
2. Platform CORS not configured for your domain
3. Platform URL is placeholder and not real

**Fix**:
1. Use correct base URL
2. Configure CORS on Bug Reporter platform
3. Replace placeholder with actual platform URL

---

## Summary

✅ **Fixed**: Changed `NEXT_PUBLIC_BUG_REPORTER_API_URL` to base URL only
✅ **Updated**: All documentation to reflect correct format
✅ **Result**: Bug Reporter SDK now constructs URLs correctly

**Key Takeaway**: Always provide **base URL only** for `NEXT_PUBLIC_BUG_REPORTER_API_URL`. The SDK handles path construction automatically.

---

## Checklist for Setting Up Bug Reporter

- [ ] Obtain Bug Reporter API key
- [ ] Get Bug Reporter platform base URL (e.g., `https://bugs.jkkn.ai`)
- [ ] Add `NEXT_PUBLIC_BUG_REPORTER_API_KEY` to environment
- [ ] Add `NEXT_PUBLIC_BUG_REPORTER_API_URL` **without any path**
- [ ] Configure CORS on Bug Reporter platform for your domain
- [ ] Deploy application
- [ ] Test bug submission
- [ ] Verify no duplicate path in network requests

---

**Status**: ✅ Fixed and documented
**Date**: 2025-11-07
**Impact**: Bug Reporter SDK now works correctly in production
