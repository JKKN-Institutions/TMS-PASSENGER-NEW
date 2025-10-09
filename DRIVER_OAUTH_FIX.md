# Driver OAuth Authentication Fix

## Problem
When logging in with `ramachjandran16@jkkn.ac.in` (a driver account) through the parent MyJKKN app OAuth flow, the user was being redirected to the **student dashboard** instead of the **driver dashboard**.

## Root Causes

### Primary Issue: Cached Passenger Session
The user had an **existing passenger session** stored in `localStorage` from a previous login. On page load:
1. The unified auth service found the cached passenger session
2. Validated it as still active
3. Authenticated the user as "passenger" 
4. **NEVER checked** if they should be a driver
5. Redirected to `/dashboard` instead of `/driver`

### Secondary Issue: Duplicate Database Records
The email `ramachjandran16@jkkn.ac.in` exists in **both** the `drivers` and `students` tables in the database:
- **Driver**: C.RAMACHJANDRAN (ID: daf7b12f-59fd-4c7d-9aea-aefa6fbbd6f5) - Active
- **Student**: RAMACHJANDRAN16 (ID: 2a7f2c5e-eda3-4b9c-84ce-fdbb3d3de59d) - Active

When the user logged in through the parent MyJKKN app:
1. The parent app authenticated them as a **student** (because that record exists in the parent app)
2. The TMS-PASSENGER app only checked the `role` field from the parent app response
3. Since the role was "student", it redirected to `/dashboard` instead of `/driver`

## Solution
Implemented a **local driver verification system** that checks the TMS database's `drivers` table during OAuth authentication, regardless of what role the parent app returns.

### Changes Made

#### 1. **CRITICAL FIX**: Enhanced Unified Auth Service Auto-Login (`TMS-PASSENGER/lib/auth/unified-auth-service.ts`)
**Lines 477-538**: Added automatic driver detection and session conversion during auto-login
```typescript
// When a valid passenger session is found, check if user is actually a driver
if (passengerUser.email) {
  const driverCheckResponse = await fetch(`/api/check-driver?email=${encodeURIComponent(passengerUser.email)}`);
  if (driverCheckResponse.ok) {
    const driverCheckData = await driverCheckResponse.json();
    if (driverCheckData.isDriver && driverCheckData.isActive) {
      // User is a driver! Convert passenger session to driver session
      // 1. Get current OAuth tokens from passenger session
      // 2. Clear passenger session
      // 3. Create driver session with local driver data
      // 4. Return as authenticated driver
      
      driverAuthService.storeAuthData(driverAuthData);
      return {
        user: driverAuthData.user,
        session: driverAuthData.session,
        isAuthenticated: true,
        userType: 'driver'
      };
    }
  }
}
```

**Impact**: This is the MOST IMPORTANT fix. It ensures that even if a user has a cached passenger session, the system will:
- Check the local drivers table on every page load
- Automatically convert their session to a driver session if they're found in drivers table
- Redirect them to `/driver` dashboard instead of `/dashboard`

#### 2. Updated OAuth Callback (`TMS-PASSENGER/app/auth/callback/page.tsx`)
**Lines 108-133**: Added logic to check the local drivers table after OAuth token exchange
```typescript
// First check if role from parent app indicates driver
let isDriver = data.user?.role === 'driver';

// If not marked as driver by parent app, check local drivers table
if (!isDriver && data.user?.email) {
  const driverCheckResponse = await fetch(`/api/check-driver?email=${encodeURIComponent(data.user.email)}`);
  if (driverCheckResponse.ok) {
    const driverData = await driverCheckResponse.json();
    isDriver = driverData.isDriver;
    
    // Store driver info in localStorage if they are a driver
    if (isDriver && driverData.driver) {
      localStorage.setItem('tms_driver_info', JSON.stringify(driverData.driver));
    }
  }
}

const targetPath = isDriver ? '/driver' : '/dashboard';
```

#### 2. Enhanced Check Driver API (`TMS-PASSENGER/app/api/check-driver/route.ts`)
**Lines 4-95**: Refactored to support both GET and POST methods with consistent response format
- Added `GET` handler for query parameter-based checks
- Returns `isDriver`, `exists`, `isActive`, and full `driver` object
- Checks driver status and active state from local database

#### 3. Updated Auth Context (`TMS-PASSENGER/lib/auth/auth-context.tsx`)
**Lines 738-820**: Enhanced driver OAuth validation to check local drivers table
```typescript
// Check if user exists in local drivers table
let hasDriverRole = false;
let localDriverData = null;

try {
  const driverCheckResponse = await fetch(`/api/check-driver?email=${encodeURIComponent(authUser.email)}`);
  if (driverCheckResponse.ok) {
    const driverCheckData = await driverCheckResponse.json();
    hasDriverRole = driverCheckData.isDriver && driverCheckData.isActive;
    localDriverData = driverCheckData.driver;
  }
} catch (error) {
  console.warn('Failed to check local drivers table:', error);
}

// If not found in local drivers table, fall back to checking parent app role
if (!hasDriverRole) {
  hasDriverRole = authUser.role === 'driver' || 
                  authUser.role === 'transport_staff' || ...
}
```

**Lines 827-862**: Updated driver session creation to use local driver data when available
```typescript
// Create driver session using local driver data if available
const driverId = localDriverData?.id || authUser.id;
const driverName = localDriverData?.name || authUser.full_name || 'Driver';
const driverPhone = localDriverData?.phone || authUser.phone_number;

const driverAuthData = {
  user: {
    id: driverId,
    email: authUser.email,
    driver_name: driverName,
    phone: driverPhone,
    rating: 0,
    role: 'driver' as const,
    assigned_route_id: localDriverData?.assigned_route_id
  },
  // ... rest of driver auth data
};
```

## How It Works Now

### OAuth Driver Login Flow
1. User clicks "Sign in with MYJKKN" as a driver
2. OAuth flow completes, parent app returns user data with role (e.g., "student")
3. **NEW**: Callback page checks `/api/check-driver?email=...` to verify if user exists in local drivers table
4. **NEW**: If found in drivers table and status is "active", user is treated as driver
5. User is redirected to `/driver` dashboard (not `/dashboard`)
6. Auth context validates and creates driver session with local driver data

### Priority Order for Driver Detection
1. **Local drivers table** (primary source of truth)
2. Parent app role field (fallback)
3. Parent app permissions (fallback)

## Benefits
- ✅ Drivers can log in via OAuth even if parent app marks them as "student"
- ✅ Local database is the source of truth for driver status
- ✅ Proper driver data (name, phone, route assignment) is used from local database
- ✅ No changes needed to parent app integration
- ✅ Maintains backward compatibility with existing driver role checks

## Testing

### For Users with Existing Passenger Session (Your Case)

If you have an **existing passenger session** cached in localStorage:

**Option 1: Simply Refresh the Page** (Recommended)
1. Just refresh the page (F5 or Ctrl+R)
2. The system will automatically detect you're a driver
3. It will convert your session from passenger → driver
4. You'll be redirected to `/driver` dashboard
5. **Expected logs in console**:
   ```
   🔍 Unified auto-login: Checking if passenger is actually a driver: ramachjandran16@jkkn.ac.in
   🚨 Unified auto-login: User is actually a DRIVER! Converting passenger session to driver session.
   🚨 Driver data: {id: '...', name: 'C.RAMACHJANDRAN', email: '...', ...}
   💾 Unified auto-login: Storing driver session data
   ```

**Option 2: Clear Browser Data and Re-Login**
1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Refresh the page
4. You'll be logged out
5. Go to `/login`
6. Select "Driver" role
7. Click "Sign in with MYJKKN"
8. Complete OAuth flow
9. **Expected**: Redirect to `/driver` dashboard

### For Fresh Login (New Session)
To test this fix with `ramachjandran16@jkkn.ac.in`:
1. Go to `/login` in TMS-PASSENGER app
2. Select "Driver" role
3. Click "Sign in with MYJKKN"
4. Complete OAuth flow
5. **Expected**: Redirect to `/driver` dashboard (not `/dashboard`)
6. **Expected**: Driver name shows as "C.RAMACHJANDRAN" from local drivers table

## Database State
Current state for `ramachjandran16@jkkn.ac.in`:
```sql
-- Driver record
drivers table: 
  id: daf7b12f-59fd-4c7d-9aea-aefa6fbbd6f5
  name: C.RAMACHJANDRAN
  email: ramachjandran16@jkkn.ac.in
  status: active
  assigned_route_id: 08f3d713-e10c-4dce-bd5c-4a70c0d65e69

-- Student record
students table:
  id: 2a7f2c5e-eda3-4b9c-84ce-fdbb3d3de59d
  student_name: RAMACHJANDRAN16
  email: ramachjandran16@jkkn.ac.in
  status: active
  allocated_route_id: null
```

## Notes
- The student record for this email could be removed if the person is exclusively a driver
- Having duplicate records is supported by the system now, but driver status takes precedence for OAuth logins
- Direct driver login (username/password) was already working correctly

