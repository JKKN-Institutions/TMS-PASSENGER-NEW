# Authentication Server Migration Summary

## Overview
Successfully migrated the TMS-PASSENGER app from the old parent app authentication system to the new centralized authentication server at `https://auth.jkkn.ai/`.

## Changes Made

### 1. Environment Variables (.env.local)
- **Changed:** `NEXT_PUBLIC_PARENT_APP_URL` → `NEXT_PUBLIC_AUTH_SERVER_URL`
- **New Value:** `https://auth.jkkn.ai`
- **Changed:** `NEXT_PUBLIC_API_KEY` → `API_KEY` (now server-side only)
- **Kept:** `NEXT_PUBLIC_APP_ID` and `NEXT_PUBLIC_REDIRECT_URI` remain the same

### 2. Token Exchange API Route (`app/api/auth/token/route.ts`)
**Updated to match the new simplified OAuth 2.0 flow:**
- Removed complex caching and retry logic
- Now calls `${authServerUrl}/api/auth/token` endpoint
- Sends simplified request body:
  ```json
  {
    "grant_type": "authorization_code",
    "code": "...",
    "app_id": "...",
    "api_key": "...",
    "redirect_uri": "..."
  }
  ```
- Returns standard OAuth 2.0 token response with user data

### 3. Callback Page (`app/auth/callback/page.tsx`)
**Completely simplified:**
- Removed complex auth context dependencies
- Now directly handles OAuth callback parameters
- Validates state parameter against localStorage
- Exchanges code for tokens via `/api/auth/token`
- Stores tokens in localStorage
- Determines redirect based on user role
- Removed all workaround and fallback logic

### 4. Parent Auth Service V2 (`lib/auth/parent-auth-service-v2.ts`)
**Updated OAuth flow:**
- Changed base URL to use `NEXT_PUBLIC_AUTH_SERVER_URL`
- Removed old endpoint arrays (child-app/authorize, oauth/authorize, etc.)
- Updated `getAuthorizationUrl()` to use new auth server pattern:
  - Endpoint: `/api/auth/authorize`
  - Parameter: `client_id` instead of `app_id`
  - Saves state to localStorage (not sessionStorage)

### 5. Parent Auth Service (`lib/auth/parent-auth-service.ts`)
**Updated OAuth flow:**
- Changed base URL to use `NEXT_PUBLIC_AUTH_SERVER_URL`
- Simplified `login()` method to match new auth server
- Removed complex parameter handling
- Uses standard OAuth 2.0 parameters

## New Authentication Flow

### Step 1: User Initiates Login
```javascript
// User clicks "Login with MYJKKN"
// App calls login() which redirects to:
https://auth.jkkn.ai/api/auth/authorize?
  client_id=transport_management_system_menrm674&
  redirect_uri=https://tms.jkkn.ac.in/auth/callback&
  response_type=code&
  scope=read+write+profile&
  state=abc123
```

### Step 2: Auth Server Handles Authentication
- User authenticates on centralized auth server
- Auth server validates user credentials
- Auth server redirects back with authorization code

### Step 3: Callback Handler Receives Code
```javascript
// Callback URL: https://tms.jkkn.ac.in/auth/callback?code=xyz789&state=abc123
// App validates state matches stored value
// App calls /api/auth/token to exchange code
```

### Step 4: Token Exchange
```javascript
POST https://auth.jkkn.ai/api/auth/token
{
  "grant_type": "authorization_code",
  "code": "xyz789",
  "app_id": "transport_management_system_menrm674",
  "api_key": "app_e20655605d48ebce_cfa1ffe34268949a",
  "redirect_uri": "https://tms.jkkn.ac.in/auth/callback"
}
```

### Step 5: Store Tokens & Redirect
```javascript
// Response includes:
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": { ... }
}

// App stores tokens in localStorage
// Redirects to /dashboard or /driver based on user role
```

## Key Differences from Old System

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Auth Server** | `https://my.jkkn.ac.in` or `https://jkkn.ai` | `https://auth.jkkn.ai` |
| **Authorize Endpoint** | Multiple fallback endpoints | Single `/api/auth/authorize` |
| **Token Endpoint** | `/api/auth/child-app/token` | `/api/auth/token` |
| **Client ID Parameter** | `app_id` | `client_id` |
| **API Key Location** | URL parameter | Request body (server-side) |
| **State Storage** | sessionStorage | localStorage |
| **Callback Logic** | Complex with auth context | Simple standalone handler |

## Benefits of New System

1. **Simplicity:** Cleaner code with fewer fallback mechanisms
2. **Security:** API key no longer exposed in URL
3. **Centralization:** Single auth server for all apps
4. **Standards:** Better adherence to OAuth 2.0 standards
5. **Maintainability:** Easier to understand and debug

## Testing Checklist

- [ ] Passenger login flow works
- [ ] Driver login flow works
- [ ] State validation prevents CSRF attacks
- [ ] Tokens are properly stored
- [ ] User data is correctly retrieved
- [ ] Role-based redirects work (driver → /driver, passenger → /dashboard)
- [ ] Token validation endpoint works
- [ ] Token refresh functionality works

## Environment Variables Required

### Production
```env
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=https://tms.jkkn.ac.in/auth/callback
```

### Development
```env
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback
```

## Notes

- The auth server URL is now consistent across all child apps
- Database registration at auth server must include the correct redirect URIs
- CORS must be configured on auth server to allow requests from TMS domain
- Token validation should be done against the new auth server endpoint

## Migration Date
October 7, 2025

## References
- Sample implementation: `child-auth-test-master(new)/`
- Auth server URL: `https://auth.jkkn.ai/`
- OAuth 2.0 Authorization Code Flow: [RFC 6749](https://tools.ietf.org/html/rfc6749)


