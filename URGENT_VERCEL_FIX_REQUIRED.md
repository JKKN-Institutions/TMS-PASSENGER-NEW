# 🚨 URGENT: Vercel Environment Variable Update Required

## Issue Summary

Your production deployment is experiencing CORS errors because the Vercel environment variable for the Bug Reporter platform is still set to a placeholder URL instead of the actual platform URL.

### Current Error (Production)
```
Access to fetch at 'https://your-platform.com/api/v1/public/api/v1/public/bug-reports'
from origin 'https://tms.jkkn.ai' has been blocked by CORS policy
```

---

## Root Cause

**Problem**: The Vercel environment variable `NEXT_PUBLIC_BUG_REPORTER_API_URL` is still set to the placeholder value `https://your-platform.com`

**Why This Happens**: The local `.env.local` file has the correct URL, but Vercel's environment variables are separate and need to be updated independently.

---

## ✅ Immediate Fix Required

### Step 1: Update Vercel Environment Variable

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Project**: TMS Passenger (or your passenger app project)
3. **Navigate to Settings** → **Environment Variables**
4. **Find Variable**: `NEXT_PUBLIC_BUG_REPORTER_API_URL`
5. **Update Value**:
   - **Current Value**: `https://your-platform.com` ❌
   - **New Value**: `https://jkkn-centralized-bug-reporter.vercel.app` ✅

### Step 2: Redeploy Application

After updating the environment variable, you **must redeploy** for the changes to take effect:

**Option A - Automatic** (Recommended):
```bash
git commit --allow-empty -m "Trigger redeploy after env var update"
git push origin main
```

**Option B - Manual**:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click **Redeploy** on the latest deployment

---

## Important Notes

### ⚠️ Common Mistake to Avoid

**WRONG** ❌:
```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public
```

**CORRECT** ✅:
```env
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app
```

**Why**: The Bug Reporter SDK automatically appends `/api/v1/public/bug-reports` to the base URL. If you include the path in the environment variable, it will result in a duplicate path:
- Intended: `https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public/bug-reports`
- With Wrong Config: `https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public/api/v1/public/bug-reports` (duplicate!)

---

## Verification Steps

After redeployment, verify the fix:

### 1. Check Application Loads
- Visit: `https://tms.jkkn.ai`
- Application should load without errors

### 2. Test Bug Reporter
1. Open browser console (F12)
2. Look for the floating bug button (bottom-right corner)
3. Click the bug button
4. **Should NOT see**: CORS error in console
5. Fill out bug report form
6. Submit
7. **Should see**: Success message

### 3. Check Console for Errors
Open browser console and look for:

**Before Fix** ❌:
```
Access to fetch at 'https://your-platform.com/api/v1/public/api/v1/public/bug-reports'
from origin 'https://tms.jkkn.ai' has been blocked by CORS policy
```

**After Fix** ✅:
```
[BugReporter SDK] Starting screenshot capture...
[BugReporter SDK] Screenshot captured successfully
[BugReporter SDK] Bug report submitted successfully
```

---

## Current Configuration Status

### Local Development ✅
Your local `.env.local` file is **correctly configured**:
```env
NEXT_PUBLIC_BUG_REPORTER_API_KEY=br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app
```

### Vercel Production ❌
Vercel environment variable needs to be updated to match local config.

---

## All Vercel Environment Variables

While you're updating the Bug Reporter URL, verify these other environment variables are set correctly on Vercel:

### Required Variables
```env
# Authentication
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=https://tms.jkkn.ai/auth/callback
NEXT_PUBLIC_AUTH_DEBUG=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gsvbrytleqdxpdfbykqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]

# Bug Reporter (UPDATE THIS!)
NEXT_PUBLIC_BUG_REPORTER_API_KEY=br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app
```

---

## What's Been Fixed in Code

### ✅ Completed Updates

1. **Documentation Updated**:
   - `DEPLOYMENT_READY.md` - Shows actual platform URL
   - `BUG_REPORTER_SDK_INTEGRATION.md` - Shows actual platform URL
   - `VERCEL_DEPLOYMENT_GUIDE.md` - Shows actual platform URL
   - `BUG_REPORTER_URL_FIX.md` - Explains the URL configuration issue

2. **Bug Reports Feature Extended**:
   - ✅ Passenger users can view bug reports at `/dashboard/my-bug-reports`
   - ✅ Staff users can view bug reports at `/staff/my-bug-reports`
   - ✅ Driver users can view bug reports at `/driver/my-bug-reports`
   - ✅ All three user types have detail pages for individual bug reports

3. **Local Environment**:
   - ✅ `.env.local` has correct Bug Reporter platform URL
   - ✅ Build successful with 148 pages generated
   - ✅ No errors in local development

### ⏳ Pending (Your Action Required)

**Only ONE action needed**: Update Vercel environment variable to match local config.

---

## Timeline

| What | Status |
|------|--------|
| Local `.env.local` updated | ✅ Done |
| Bug reports feature for all users | ✅ Done |
| Documentation updated | ✅ Done |
| Vercel environment variable | ⏳ **ACTION REQUIRED** |
| Redeploy after env var update | ⏳ **ACTION REQUIRED** |

---

## Expected Results After Fix

### Before Fix (Current State)
- ❌ CORS errors in console
- ❌ Bug reports fail to submit
- ❌ Duplicate URL path in network requests
- ✅ Application still loads and works (bug reporter just disabled)

### After Fix (Expected State)
- ✅ No CORS errors
- ✅ Bug reports submit successfully
- ✅ Correct URL path in network requests
- ✅ Bug reporter fully functional
- ✅ Screenshots captured automatically
- ✅ Console logs collected
- ✅ User context tracked

---

## Support

If you encounter any issues after applying the fix:

1. **Check Vercel Deployment Logs**:
   - Vercel Dashboard → Your Project → Deployments → View Function Logs

2. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for error messages

3. **Verify Environment Variable**:
   - Vercel Dashboard → Settings → Environment Variables
   - Confirm `NEXT_PUBLIC_BUG_REPORTER_API_URL` shows correct value

4. **Test in Incognito Mode**:
   - Rules out browser cache issues
   - Open incognito window
   - Visit production URL
   - Test bug reporter

---

## Quick Action Checklist

- [ ] Go to Vercel Dashboard
- [ ] Navigate to Settings → Environment Variables
- [ ] Find `NEXT_PUBLIC_BUG_REPORTER_API_URL`
- [ ] Update value to: `https://jkkn-centralized-bug-reporter.vercel.app`
- [ ] Save changes
- [ ] Redeploy application (push or manual redeploy)
- [ ] Wait for deployment to complete (~2-3 minutes)
- [ ] Visit production site: `https://tms.jkkn.ai`
- [ ] Open browser console (F12)
- [ ] Click bug reporter button
- [ ] Verify no CORS errors
- [ ] Submit a test bug report
- [ ] Confirm success message appears

---

**Status**: ⏳ Waiting for Vercel environment variable update
**Priority**: 🔴 High - Production issue affecting bug reporting feature
**Estimated Fix Time**: 5 minutes (update var + redeploy)

---

**Date**: 2025-11-07
**Issue**: CORS error due to incorrect Vercel environment variable
**Solution**: Update `NEXT_PUBLIC_BUG_REPORTER_API_URL` to actual platform URL
