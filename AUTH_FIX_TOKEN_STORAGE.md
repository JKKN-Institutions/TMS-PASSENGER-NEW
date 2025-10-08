# Authentication Fix: Token Storage Keys

## Issue Description

After successful OAuth authentication, users were being redirected back to the login page instead of the dashboard. The console logs showed:

```
✅ Tokens received successfully!
✅ Tokens saved
🔄 Redirecting to /dashboard ...
✅ OAuth Flow Complete!

// But then immediately:
❌ Unified auto-login: No valid sessions found
🔄 Auto-login: No valid session, redirecting to login...
```

## Root Cause

The callback page was saving tokens with incorrect localStorage keys:
- **Wrong:** `access_token`, `refresh_token`
- **Expected:** `tms_access_token`, `tms_refresh_token`

The auto-login service and other parts of the app look for tokens with the `tms_` prefix, so they couldn't find the newly saved tokens.

Additionally, tokens were not being stored in cookies, which are also checked by various parts of the application.

## The Fix

Updated `app/auth/callback/page.tsx` to:

### 1. Use Correct localStorage Keys

```javascript
// Before (WRONG):
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);

// After (CORRECT):
localStorage.setItem('tms_access_token', data.access_token);
localStorage.setItem('tms_refresh_token', data.refresh_token);
localStorage.setItem('tms_user', JSON.stringify(data.user));
localStorage.setItem('tms_token_expires', tokenExpiresAt.toString());
localStorage.setItem('tms_refresh_expires', refreshExpiresAt.toString());
```

### 2. Also Store in Cookies

```javascript
// Added cookie storage for server-side access:
const isSecure = window.location.protocol === 'https:';
const cookieOptions = `path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;

document.cookie = `tms_access_token=${data.access_token}; ${cookieOptions}; max-age=${data.expires_in || 3600}`;
document.cookie = `tms_refresh_token=${data.refresh_token}; ${cookieOptions}; max-age=${30 * 24 * 60 * 60}`;
```

## Token Storage Locations

After successful authentication, tokens are now stored in both places:

### localStorage
- `tms_access_token` - Access token for API calls
- `tms_refresh_token` - Refresh token for getting new access tokens
- `tms_user` - User profile data (JSON string)
- `tms_token_expires` - Access token expiry timestamp
- `tms_refresh_expires` - Refresh token expiry timestamp

### Cookies
- `tms_access_token` - Same as localStorage (for server-side access)
- `tms_refresh_token` - Same as localStorage (for server-side access)

## How Auto-Login Checks Work

The auto-login service checks for authentication in this order:

1. **Check Cookies:** `Cookies.get('tms_access_token')`
2. **Check localStorage:** `localStorage.getItem('tms_access_token')`
3. **Verify Expiry:** Compare `tms_token_expires` with current time
4. **Validate User Data:** Check `tms_user` exists

If all checks pass, the user is considered authenticated and redirected to their dashboard.

## Testing the Fix

After this fix, the console should show:

```
✅ Tokens received successfully!
📋 User: student@jkkn.ac.in
💾 Saving tokens to localStorage and cookies...
✅ Tokens saved to localStorage and cookies
🧹 OAuth state cleared
🔄 Redirecting to /dashboard ...
✅ OAuth Flow Complete!

// Dashboard page loads successfully
🔄 Auth initialization result: {isAuthenticated: true, userType: 'passenger', userEmail: 'student@jkkn.ac.in'}
```

## Files Modified

- `TMS-PASSENGER/app/auth/callback/page.tsx` - Updated token storage logic

## Impact

✅ Users can now successfully log in via OAuth
✅ Auto-login works correctly after authentication
✅ Tokens persist across page reloads
✅ Server-side components can access tokens via cookies
✅ No more redirect loop to login page

## Related Services That Use These Keys

These parts of the app rely on the correct token storage keys:

1. **parent-auth-service.ts** - `getAccessToken()`, `getRefreshToken()`
2. **parent-auth-service-v2.ts** - Token validation and refresh
3. **auto-login-service.ts** - Automatic authentication on page load
4. **unified-auth-service.ts** - Unified authentication state
5. **auth-context.tsx** - React context for authentication
6. **middleware.ts** - Server-side authentication checks

All these services expect tokens with the `tms_` prefix.

## Date Fixed
October 8, 2025

