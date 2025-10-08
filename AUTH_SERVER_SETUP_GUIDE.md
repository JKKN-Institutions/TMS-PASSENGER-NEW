# Auth Server Setup Guide for TMS-PASSENGER

## Prerequisites

Before the new authentication system will work, ensure these configurations are in place:

## 1. Auth Server Database Registration

The TMS-PASSENGER app must be registered in the auth server's database:

```sql
-- Run this SQL on the auth server database (if not already done)
INSERT INTO applications (
  app_id,
  app_name,
  api_key,
  allowed_redirect_uris,
  allowed_origins,
  is_active,
  created_at
) VALUES (
  'transport_management_system_menrm674',
  'Transport Management System - Passenger App',
  'app_e20655605d48ebce_cfa1ffe34268949a',
  ARRAY[
    'http://localhost:3003/auth/callback',
    'https://tms.jkkn.ac.in/auth/callback'
  ],
  ARRAY[
    'http://localhost:3003',
    'https://tms.jkkn.ac.in'
  ],
  true,
  NOW()
);

-- Verify the registration
SELECT app_id, app_name, allowed_redirect_uris, is_active 
FROM applications 
WHERE app_id = 'transport_management_system_menrm674';
```

## 2. Auth Server CORS Configuration

The auth server must allow CORS requests from the TMS domain.

Update the auth server's `middleware.ts` or equivalent:

```typescript
// Example CORS configuration
const allowedOrigins = [
  'http://localhost:3003',
  'https://tms.jkkn.ac.in',
  'https://auth.jkkn.ai'
];

// Allow these origins to make requests
if (allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
}
```

## 3. Environment Variables

Ensure these environment variables are set in TMS-PASSENGER:

### Production (.env.production or Vercel Environment Variables)
```env
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=https://tms.jkkn.ac.in/auth/callback
NEXT_PUBLIC_AUTH_DEBUG=false
```

### Development (.env.local)
```env
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback
NEXT_PUBLIC_AUTH_DEBUG=true
```

## 4. Testing the Integration

### Manual Test Flow

1. **Start the development server:**
   ```bash
   cd TMS-PASSENGER
   npm run dev
   ```

2. **Open browser to:** `http://localhost:3003`

3. **Click "Login with MYJKKN"**
   - Should redirect to: `https://auth.jkkn.ai/api/auth/authorize?...`
   - Check browser console for detailed logs

4. **Complete authentication on auth server**
   - Should redirect back to: `http://localhost:3003/auth/callback?code=...&state=...`

5. **Verify token exchange**
   - Check browser console for successful token exchange
   - Check localStorage for `access_token` and `refresh_token`
   - Should redirect to `/dashboard` or `/driver`

### Expected Console Output

When authentication is successful, you should see:

```
🚀 ═══════════════════════════════════════════════════════
📍 TMS-PASSENGER: Initiating OAuth Flow
🚀 ═══════════════════════════════════════════════════════
📋 Configuration:
  - Auth Server: https://auth.jkkn.ai
  - App ID: transport_management_system_menrm674
  - Redirect URI: http://localhost:3003/auth/callback
  - Scope: read write profile
  - State: abc123x

🔗 Redirecting to auth server...
📍 URL: https://auth.jkkn.ai/api/auth/authorize?...
═══════════════════════════════════════════════════════

// After callback:

🔄 ═══════════════════════════════════════════════════════
📍 TMS-PASSENGER: Callback Handler
🔄 ═══════════════════════════════════════════════════════
📋 Callback parameters: { code: "xyz789...", state: "abc123x", ... }
✅ State validated
✅ Authorization code received
🔄 Exchanging code for tokens...
✅ Tokens received successfully!
📋 User: user@example.com
💾 Tokens saved
🔄 Redirecting to /dashboard ...
✅ OAuth Flow Complete!
```

## 5. Common Issues & Solutions

### Issue: "Invalid redirect URI"
**Cause:** The redirect URI in the request doesn't match what's registered in the database.

**Solution:**
```sql
-- Update allowed redirect URIs
UPDATE applications 
SET allowed_redirect_uris = ARRAY[
  'http://localhost:3003/auth/callback',
  'https://tms.jkkn.ac.in/auth/callback'
]
WHERE app_id = 'transport_management_system_menrm674';
```

### Issue: "Application not found"
**Cause:** The app_id doesn't exist in the auth server database.

**Solution:** Run the registration SQL from step 1.

### Issue: "CORS policy error"
**Cause:** Auth server doesn't allow requests from TMS domain.

**Solution:** Update CORS configuration on auth server (step 2).

### Issue: "Token exchange failed"
**Cause:** API key mismatch or invalid authorization code.

**Solution:**
- Verify API_KEY matches the database
- Check if authorization code hasn't expired (codes are typically valid for 10 minutes)
- Ensure code hasn't been used already (codes are single-use)

### Issue: "State validation failed"
**Cause:** State parameter doesn't match stored value (possible CSRF attack or browser cleared storage).

**Solution:**
- This is a security feature working correctly
- Have user try login again
- Check if browser allows localStorage

## 6. Deployment Checklist

Before deploying to production:

- [ ] Auth server database has correct app registration
- [ ] Production redirect URI is added to allowed_redirect_uris
- [ ] CORS is configured on auth server for production domain
- [ ] Environment variables are set in deployment platform (Vercel/Netlify)
- [ ] HTTPS is enabled (OAuth requires secure connections)
- [ ] Test the full flow on production URL before announcing to users

## 7. Monitoring & Debugging

### Enable Debug Mode

Set in environment:
```env
NEXT_PUBLIC_AUTH_DEBUG=true
```

This will log detailed OAuth flow information to browser console.

### Check Auth Server Logs

Look for these endpoints being called:
1. `GET /api/auth/authorize` - Initial authorization request
2. `POST /api/auth/token` - Token exchange
3. `POST /api/auth/validate` - Token validation (if implemented)

### Check Browser Storage

After successful login, verify these exist:
- **localStorage:** `access_token`, `refresh_token`, `tms_user`, `oauth_state` (temporary)
- **sessionStorage:** May contain redirect URLs

## Support

If you encounter issues not covered here:
1. Check browser console for error messages
2. Check auth server logs
3. Verify all environment variables are correct
4. Ensure database registrations are complete
5. Test with NEXT_PUBLIC_AUTH_DEBUG=true for detailed logs

## Auth Server Contact

For issues with the auth server itself:
- **URL:** https://auth.jkkn.ai
- **Admin Panel:** (if available)
- **Support:** Contact auth server administrator


