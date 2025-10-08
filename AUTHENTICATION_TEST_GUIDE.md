# Authentication Flow Test Guide

## Pre-Testing Setup

### 1. Clear Browser Data
Before testing, clear all cached data:
```
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Or manually clear:
   - localStorage (all tms_* keys)
   - Cookies (all tms_* cookies)
   - Session Storage
```

### 2. Verify Environment Variables
Check `TMS-PASSENGER/.env.local`:
```bash
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.jkkn.ai
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=https://tms.jkkn.ac.in/auth/callback
```

**For Local Testing:**
If testing on localhost, comment out production redirect and use:
```bash
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback
```

### 3. Start Development Server
```bash
cd TMS-PASSENGER
npm run dev
```

Server should start on: `http://localhost:3003`

---

## Test Scenarios

### ✅ Test 1: Basic Login Flow

#### Steps:
1. Navigate to `http://localhost:3003` (or your production URL)
2. Click "Login" button
3. Should redirect to `https://auth.jkkn.ai/oauth/authorize`
4. Enter credentials (test user: `student@jkkn.ac.in`)
5. Should redirect back to `/auth/callback`
6. Then redirect to `/dashboard`

#### What to Check in Console:
```
🔄 ═══════════════════════════════════════════════════════
📍 TMS-PASSENGER: Callback Handler
🔄 ═══════════════════════════════════════════════════════
✅ Authorization code received
✅ Tokens received successfully!
👤 User: student@jkkn.ac.in
💾 Saving tokens to localStorage and cookies...
✅ Tokens saved to localStorage and cookies
🧹 OAuth state cleared
🔄 Preparing redirect to /dashboard...
✅ ═══════════════════════════════════════════════════════
📍 OAuth Flow Complete!
✅ ═══════════════════════════════════════════════════════
```

#### What to Check in localStorage:
```javascript
// Check in Console → Application → Local Storage
localStorage.getItem('tms_access_token') // Should have JWT token
localStorage.getItem('tms_refresh_token') // Should have refresh token
localStorage.getItem('tms_user') // Should have user object JSON
localStorage.getItem('tms_token_expires') // Should have timestamp
localStorage.getItem('tms_refresh_expires') // Should have timestamp
```

#### What to Check in Network Tab:
1. `/api/auth/token` POST request - Status 200
2. Response should include:
   - `access_token`
   - `refresh_token`
   - `user` object with email, full_name, etc.

---

### ✅ Test 2: User Enhancement with Database Integration

#### Steps:
1. After login, check console for enhancement logs
2. Dashboard should load without errors
3. User profile should show complete information

#### What to Check in Console:
```
🔄 Auth initialization - checking unified auth state...
🔧 Passenger user needs database enhancement, fetching local student record...
🔍 Finding or creating student for parent app user: student@jkkn.ac.in
✅ Found existing student: student@jkkn.ac.in
✅ Enhanced user object during initialization: {
  studentId: '15808b62-a18a-41bc-89f8-c237c5913ce0',
  email: 'student@jkkn.ac.in',
  rollNumber: 'PAF2362481',
  isNewStudent: false
}
✅ Session stored in sessionManager during initialization for student: 15808b62-a18a-41bc-89f8-c237c5913ce0
```

#### What to Check in User Object:
```javascript
// In Console
const user = JSON.parse(localStorage.getItem('tms_user'));
console.log(user);

// Should include:
{
  id: "...",
  email: "student@jkkn.ac.in",
  full_name: "STUDENT",
  role: "student",
  studentId: "15808b62-a18a-41bc-89f8-c237c5913ce0",  // ✅ Database ID
  rollNumber: "PAF2362481",                           // ✅ Roll Number
  isNewStudent: false,                                // ✅ Student Status
  transportEnrolled: false,                           // ✅ Enrollment Status
  enrollmentStatus: "pending",                        // ✅ Enrollment Status
  // ... other fields
}
```

---

### ✅ Test 3: Dashboard Data Display

#### Steps:
1. After login, dashboard should load
2. Check enrollment status card
3. Check route allocation (if enrolled)

#### What to Check in Console:
```
📊 Dashboard received user object: {
  id: '...',
  email: 'student@jkkn.ac.in',
  full_name: 'STUDENT',
  studentId: '15808b62-a18a-41bc-89f8-c237c5913ce0',
  rollNumber: 'PAF2362481',
  ...
}
📊 Dashboard fetching data for student: {
  studentId: '15808b62-a18a-41bc-89f8-c237c5913ce0',
  email: 'student@jkkn.ac.in',
  rollNumber: 'PAF2362481'
}
✅ Enrollment status retrieved
🔍 Dashboard Route Allocation Check
```

#### What to Check in Network Tab:
1. `/api/enrollment/status?studentId=...` - Status 200
   - Should return enrollment information
   - Should include route allocation if enrolled
2. `/api/student/route-allocation?studentId=...` - Status 200
   - Should return route information if allocated

#### What to Check on UI:
- ✅ Dashboard shows proper enrollment status
- ✅ No "No routes allocated" error if enrolled
- ✅ User name displayed correctly
- ✅ Enrollment cards show correct data

---

### ✅ Test 4: Navigation to Other Pages

#### Steps:
1. From dashboard, navigate to:
   - Profile page
   - Routes page
   - Notifications page
   - Any other protected page

#### What to Check:
- ✅ All pages load without redirecting to login
- ✅ User data is available on all pages
- ✅ No console errors about missing `studentId`
- ✅ API calls include proper authentication

---

### ✅ Test 5: Page Refresh (Session Persistence)

#### Steps:
1. After successful login, refresh the page (F5)
2. Should stay logged in
3. Should not redirect to login

#### What to Check in Console:
```
🔄 Auth initialization - checking unified auth state...
✅ User already enhanced with studentId: 15808b62-a18a-41bc-89f8-c237c5913ce0
✅ Auto-login: Already authenticated via context
```

#### What to Check:
- ✅ User stays logged in after refresh
- ✅ Auth state loads from localStorage
- ✅ Enhanced user data persists
- ✅ No re-authentication required

---

### ✅ Test 6: Logout Flow

#### Steps:
1. Click logout button
2. Should redirect to login page
3. localStorage and cookies should be cleared

#### What to Check in Console:
```
🔍 Logout initiated, userType: passenger, redirectToParent: false
✅ Logout completed successfully
```

#### What to Check in localStorage:
```javascript
// All should be null after logout
localStorage.getItem('tms_access_token') // null
localStorage.getItem('tms_refresh_token') // null
localStorage.getItem('tms_user') // null
```

---

## Common Issues & Solutions

### Issue 1: "No routes allocated" on Dashboard
**Cause:** User object not enhanced with `studentId`  
**Solution:** Check console for enhancement logs. If missing, verify:
- `ParentAppIntegrationService.findOrCreateStudentFromParentApp()` is called
- Database has student record with matching email
- User object is updated with `studentId` field

### Issue 2: Redirect Loop (Login → Dashboard → Login)
**Cause:** Tokens not stored correctly or auth context not reading them  
**Solution:** Check:
- localStorage has `tms_access_token` and `tms_refresh_token`
- Cookies are set (`tms_access_token`, `tms_refresh_token`)
- `window.location.href` redirect happens (not `router.push`)

### Issue 3: API Calls Return 401 Unauthorized
**Cause:** Access token not included in API requests  
**Solution:** Verify:
- Token is in localStorage as `tms_access_token`
- API calls include `Authorization: Bearer ${token}` header
- Token is not expired

### Issue 4: User Object Missing Fields
**Cause:** Enhancement not running or failing silently  
**Solution:** Check:
- Console for "🔧 Passenger user needs database enhancement..." message
- `ParentAppIntegrationService` successfully finds or creates student
- Enhanced user object is stored via `parentAuthService.updateUser()`

### Issue 5: CORS Errors from Auth Server
**Cause:** Auth server not allowing requests from your origin  
**Solution:**
- Verify `NEXT_PUBLIC_REDIRECT_URI` matches registered redirect URI
- Check auth server allows your origin (localhost or production URL)
- Ensure API_KEY is correct

---

## Success Criteria

All tests should pass with these results:

✅ **Authentication:**
- User can log in via new auth server
- OAuth callback handles tokens correctly
- Tokens stored in localStorage and cookies
- User redirected to dashboard

✅ **User Enhancement:**
- User object enhanced with local database IDs
- `studentId` and `rollNumber` present in user object
- Enhancement logs visible in console
- SessionManager has complete user data

✅ **Data Display:**
- Dashboard shows correct enrollment status
- Route allocation displays (if enrolled)
- No "student not found" errors
- API calls succeed with proper authentication

✅ **Navigation:**
- All pages accessible after login
- User data available across pages
- No unexpected redirects
- Session persists across page refreshes

✅ **Security:**
- Logout clears all auth data
- Protected routes require authentication
- Tokens expire appropriately
- Refresh token works for session renewal

---

## Test User Credentials

### Student User:
- Email: `student@jkkn.ac.in`
- Expected Database ID: `15808b62-a18a-41bc-89f8-c237c5913ce0`
- Expected Roll Number: `PAF2362481`
- Expected Role: `student`

### Staff User:
- Test with staff credentials if available
- Should have staff-specific permissions
- Should access staff features

### Driver User:
- Test driver login flow separately
- Should redirect to `/driver` dashboard
- Should have driver-specific features

---

## Debugging Tips

### Enable Debug Mode:
Add to `.env.local`:
```bash
NEXT_PUBLIC_AUTH_DEBUG=true
```

### Console Logging:
Look for these prefixes:
- 🔄 - Authentication flow steps
- ✅ - Successful operations
- ❌ - Errors
- 🔧 - Enhancement operations
- 📍 - Important checkpoints
- 💾 - Storage operations

### Network Tab:
Monitor these endpoints:
1. `/api/auth/token` - Token exchange
2. `/api/enrollment/status` - Enrollment data
3. `/api/student/route-allocation` - Route data
4. `/api/auth/validate` - Token validation (if called)

### React DevTools:
Check AuthContext state:
- `user` - Should have complete user object
- `isAuthenticated` - Should be `true`
- `userType` - Should be `'passenger'` or `'driver'` or `'staff'`
- `isLoading` - Should be `false` after init

---

## Next Steps After Testing

1. ✅ Document any failing test cases
2. ✅ Check console logs for error details
3. ✅ Verify database records exist for test users
4. ✅ Test with multiple user types (student, staff, driver)
5. ✅ Test enrollment and route allocation features
6. ✅ Verify all pages work correctly
7. ✅ Test on different browsers
8. ✅ Test on production environment

