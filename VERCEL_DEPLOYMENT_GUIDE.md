# Vercel Deployment Guide - Bug Reporter SDK

## Overview

This guide covers deploying the TMS Passenger application to Vercel with the Bug Reporter SDK integration. The application will gracefully handle missing environment variables and build successfully on Vercel.

---

## Build Error Fix

### Problem

When deploying to Vercel without setting the Bug Reporter environment variables, the build would fail with:
```
TypeError: Cannot read properties of undefined (reading 'NEXT_PUBLIC_BUG_REPORTER_API_KEY')
```

### Solution

Updated `components/bug-report-wrapper.tsx` to gracefully handle missing environment variables:

```typescript
// Get environment variables with fallbacks
const apiKey = process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY || '';
const apiUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL || '';

// Only enable if both API key and URL are provided
const isEnabled = Boolean(apiKey && apiUrl);

// If not enabled, just render children without bug reporter
if (!isEnabled) {
  console.warn('Bug Reporter SDK: Missing API key or URL. Bug reporting disabled.');
  return children ? <>{children}</> : null;
}
```

**Result**: Application builds and runs successfully even without Bug Reporter environment variables. The bug reporter feature simply won't be available.

---

## Vercel Environment Variables Setup

### Step 1: Access Vercel Project Settings

1. Go to your Vercel dashboard
2. Select your project (TMS Passenger)
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following environment variables to Vercel:

#### Bug Reporter SDK Variables

```env
NEXT_PUBLIC_BUG_REPORTER_API_KEY=br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.com/api/v1/public
```

#### Other Required Variables

Make sure all other environment variables from `.env.local` are also added to Vercel:

**Authentication**:
```env
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=https://tms.jkkn.ai/auth/callback
NEXT_PUBLIC_AUTH_DEBUG=false
```

**Supabase**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gsvbrytleqdxpdfbykqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Push Notifications**:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

**Scheduler**:
```env
SCHEDULER_SECRET_KEY=your_scheduler_secret_key
```

### Step 3: Set Environment Scope

For each environment variable, select the appropriate scope:

- **Production**: For production deployment
- **Preview**: For preview deployments (PR previews)
- **Development**: For local development (optional)

**Recommendation**: Add variables to all three scopes for consistency.

---

## Deployment Options

### Option 1: Deploy WITH Bug Reporter (Recommended)

**Steps**:
1. Add all environment variables to Vercel (including Bug Reporter variables)
2. Deploy the application
3. Bug reporter button will appear in bottom-right corner
4. Users can submit bugs to centralized platform

**Result**: Full functionality including bug reporting

### Option 2: Deploy WITHOUT Bug Reporter

**Steps**:
1. Add all environment variables EXCEPT Bug Reporter variables to Vercel
2. Deploy the application
3. Bug reporter will be disabled automatically

**Result**: Application works normally, but bug reporter feature unavailable

**Console Warning**:
```
Bug Reporter SDK: Missing API key or URL. Bug reporting disabled.
```

---

## Vercel Build Configuration

### Current Build Settings

**File**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // Skip type checking during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip linting during build
  },
  // ... other configurations
};
```

**Why**: Speeds up build time on Vercel by skipping type checking and linting (run these locally before committing).

### Vercel Build Command

Default: `npm run build`

**No changes needed** - Uses standard Next.js build process.

### Vercel Install Command

Default: `npm install`

**Important**: The Bug Reporter SDK requires `--legacy-peer-deps` flag due to lucide-react version conflict.

**Vercel Install Command Setting**:
1. Go to Vercel Project Settings → General
2. Set Install Command to:
   ```bash
   npm install --legacy-peer-deps
   ```

Or create `.npmrc` file in project root:
```
legacy-peer-deps=true
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables added to Vercel
- [ ] Install command set to `npm install --legacy-peer-deps` OR `.npmrc` file created
- [ ] Local build test passed: `npm run build`
- [ ] TypeScript check passed: `npm run type-check`
- [ ] ESLint check passed: `npm run lint`

### Post-Deployment

- [ ] Deployment successful on Vercel
- [ ] Application loads without errors
- [ ] Authentication works correctly
- [ ] Bug reporter button appears (if variables set)
- [ ] Bug submission works (if variables set)
- [ ] No console errors in browser

---

## Testing Deployment

### 1. Test Application Loads

Visit your Vercel deployment URL:
```
https://your-project.vercel.app
```

Check:
- Application loads successfully
- No white screen errors
- No JavaScript console errors

### 2. Test Authentication

1. Click login button
2. Complete OAuth flow
3. Verify dashboard loads

### 3. Test Bug Reporter (if enabled)

1. Look for floating button in bottom-right corner
2. Click bug report button
3. Fill out form
4. Submit bug report
5. Check for success toast

### 4. Test Without Bug Reporter (if disabled)

1. Application loads normally
2. No bug reporter button visible
3. Check console for warning:
   ```
   Bug Reporter SDK: Missing API key or URL. Bug reporting disabled.
   ```

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `npm install` fails with peer dependency error

**Solution**: Set install command to `npm install --legacy-peer-deps`

**Where**: Vercel Project Settings → General → Install Command

---

### Bug Reporter Not Appearing

**Check**:
1. Environment variables set on Vercel:
   - `NEXT_PUBLIC_BUG_REPORTER_API_KEY`
   - `NEXT_PUBLIC_BUG_REPORTER_API_URL`

2. Variables are in correct scope (Production, Preview, Development)

3. Application was redeployed after adding variables

**Fix**: Redeploy after adding environment variables

---

### Application Works But Bug Reporter Missing

**This is expected behavior** if environment variables are not set.

**To enable**:
1. Add Bug Reporter environment variables to Vercel
2. Trigger a new deployment (or redeploy)

---

### Environment Variables Not Working

**Check**:
1. Variable names are exactly:
   - `NEXT_PUBLIC_BUG_REPORTER_API_KEY` (with `NEXT_PUBLIC_` prefix)
   - `NEXT_PUBLIC_BUG_REPORTER_API_URL` (with `NEXT_PUBLIC_` prefix)

2. Variables are in correct scope

3. Application was redeployed after adding variables

**Note**: Environment variables only take effect after redeployment, not on running deployments.

---

## Vercel Project Settings Summary

### General Settings

**Framework Preset**: Next.js
**Build Command**: `npm run build`
**Install Command**: `npm install --legacy-peer-deps`
**Output Directory**: `.next`
**Node Version**: 18.x or higher

### Environment Variables Required

**Essential for Application**:
- `NEXT_PUBLIC_AUTH_SERVER_URL`
- `NEXT_PUBLIC_APP_ID`
- `API_KEY`
- `NEXT_PUBLIC_REDIRECT_URI`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional for Bug Reporter**:
- `NEXT_PUBLIC_BUG_REPORTER_API_KEY`
- `NEXT_PUBLIC_BUG_REPORTER_API_URL`

**Optional for Features**:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `SCHEDULER_SECRET_KEY`
- `NEXT_PUBLIC_AUTH_DEBUG`

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to:
- **Main branch** → Production deployment
- **Other branches** → Preview deployment
- **Pull requests** → Preview deployment

### Manual Deployments

1. Go to Vercel dashboard
2. Select your project
3. Click **Deployments** tab
4. Click **Redeploy** on any deployment
5. Or click **Create Deployment** for new deployment

---

## Production Checklist

Before going to production:

- [ ] All environment variables set correctly
- [ ] Bug Reporter API key is production key (not test key)
- [ ] Bug Reporter API URL points to production platform
- [ ] `NEXT_PUBLIC_AUTH_DEBUG` set to `false`
- [ ] All API keys are production keys
- [ ] Supabase URLs point to production instance
- [ ] Test authentication flow end-to-end
- [ ] Test bug submission end-to-end
- [ ] Monitor Vercel logs for errors
- [ ] Set up error monitoring (Sentry, etc.)

---

## Monitoring

### Vercel Logs

Access real-time logs:
1. Go to Vercel dashboard
2. Select your project
3. Click **Logs** tab
4. Filter by deployment environment

### Bug Reporter Logs

Check browser console for:
```
Bug Reporter SDK: Missing API key or URL. Bug reporting disabled.
```

This indicates bug reporter is disabled (expected if variables not set).

### Performance Monitoring

Monitor in Vercel:
- Build times
- Function execution times
- Edge cache hit rates
- Bandwidth usage

---

## Security Notes

### Environment Variables

- Never commit `.env.local` to git
- Keep API keys secure
- Rotate keys regularly
- Use different keys for dev/staging/production

### Bug Reporter API Key

- The API key `br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC` is public (sent to browser)
- Backend validates key against authorized domains
- Limit key to specific domains in platform settings
- Regenerate if compromised

---

## Support

### Vercel Issues
- Check Vercel status: https://www.vercel-status.com/
- Vercel docs: https://vercel.com/docs
- Contact Vercel support through dashboard

### Bug Reporter SDK Issues
- Check SDK documentation
- Contact platform administrator
- Report SDK bugs to SDK repository

### Application Issues
- Check Vercel logs
- Check browser console
- Use the bug reporter! 🐛

---

## Summary

✅ **Fixed**: Build error handling for missing environment variables
✅ **Build**: Succeeds with or without Bug Reporter variables
✅ **Deploy**: Ready for Vercel deployment
✅ **Fallback**: Graceful degradation if Bug Reporter unavailable

**Next Steps**:
1. Add environment variables to Vercel
2. Set install command to `npm install --legacy-peer-deps`
3. Deploy to Vercel
4. Test deployment
5. Monitor logs

The application is now production-ready for Vercel deployment!
