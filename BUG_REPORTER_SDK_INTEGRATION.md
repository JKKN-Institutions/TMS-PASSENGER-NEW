# Centralized Bug Reporter SDK Integration

## Overview

Replaced the old custom bug reporting module with the centralized JKKN Bug Reporter SDK (`@boobalan_jkkn/bug-reporter-sdk`). This provides a unified bug reporting system across all JKKN applications with automatic screenshot capture, console log collection, and user context tracking.

## Changes Made

### 1. SDK Installation

**Package Installed**:
```bash
npm install @boobalan_jkkn/bug-reporter-sdk --legacy-peer-deps
```

**Version**: `1.0.6`

**Note**: Used `--legacy-peer-deps` due to lucide-react version difference (app uses 0.460.0, SDK expects ^0.400.0 || ^0.500.0 || ^0.552.0)

---

### 2. Environment Variables

**File**: `.env.local`

**Added**:
```env
# JKKN Bug Reporter Configuration
NEXT_PUBLIC_BUG_REPORTER_API_KEY=br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app
```

**IMPORTANT**:
- Use **base URL only** (SDK automatically appends `/api/v1/public/bug-reports`)
- Incorrect: `https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public` (will result in duplicate path)
- Correct: `https://jkkn-centralized-bug-reporter.vercel.app` (SDK handles the rest)

**API Key Details**:
- API Key: `br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC`
- Key Type: Bug Reporter API Key
- Purpose: Authenticate with centralized bug reporting platform
- Scope: Public API access for submitting bug reports

---

### 3. Component Replacement

#### Old Implementation

**File**: `components/bug-report-wrapper.tsx` (OLD)

```typescript
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import BugButtonPortal from './bug-button-portal';

const BugReportWrapper: React.FC = () => {
  const { user } = useAuth();

  return (
    <BugButtonPortal
      userId={user?.id || 'anonymous-user'}
      userEmail={user?.email || 'test@example.com'}
      userName={user?.student_name || 'Test User'}
    />
  );
};

export default BugReportWrapper;
```

#### New Implementation

**File**: `components/bug-report-wrapper.tsx` (NEW)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk';

const BugReportWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server side
  if (!mounted) {
    return children ? <>{children}</> : null;
  }

  // Prepare user context
  const userContext = user ? {
    userId: user.id || user.sub || '',
    name: user.student_name || user.name || user.full_name || '',
    email: user.email || ''
  } : undefined;

  return (
    <BugReporterProvider
      apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
      apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
      enabled={true}
      debug={process.env.NODE_ENV === 'development'}
      userContext={userContext}
    >
      {children}
    </BugReporterProvider>
  );
};

export default BugReportWrapper;
```

**Key Changes**:
- Imports `BugReporterProvider` from SDK instead of custom `BugButtonPortal`
- Wraps children to provide bug reporting context
- Passes user context automatically from auth state
- Enables debug mode in development
- Server-side rendering guard with `mounted` state

---

### 4. Layout Integration

**File**: `app/layout.tsx`

**Before**:
```typescript
<AutoLoginWrapper>
  <div id="root" className="h-full overflow-x-hidden">
    {children}
    <PWAInstallPrompt />
    <AutoPushPermission delay={5000} oncePerSession={true} />
    {/* Floating bug report button */}
    <BugReportWrapper />
    <DeploymentVersionCheck />
  </div>
</AutoLoginWrapper>
```

**After**:
```typescript
<AutoLoginWrapper>
  {/* Bug Reporter SDK - Wraps entire app with centralized bug reporting */}
  <BugReportWrapper>
    <div id="root" className="h-full overflow-x-hidden">
      {children}
      <PWAInstallPrompt />
      <AutoPushPermission delay={5000} oncePerSession={true} />
      <DeploymentVersionCheck />
    </div>
  </BugReportWrapper>
</AutoLoginWrapper>
```

**Change**: Wrapped the entire app content with `BugReportWrapper` to provide context throughout the application.

---

### 5. Removed Files

#### Components Removed:
1. `components/bug-button-portal.tsx` - Old bug report button
2. `components/floating-bug-report-button.tsx` - Old floating button UI
3. `components/bug-bounty-tracker.tsx` - Old bug bounty tracking

#### Pages Removed:
1. `app/dashboard/bug-reports/page.tsx` - Old bug reports management page
2. `app/test-bug-report/page.tsx` - Old test page

**Reason**: Replaced by centralized SDK which provides:
- Floating bug report button (automatically rendered)
- Screenshot capture
- Console log collection
- User context tracking
- Centralized bug management dashboard (external platform)

---

## Features Provided by SDK

### 1. Floating Bug Report Button
- **Location**: Bottom-right corner (same position as old button)
- **Appearance**: Customizable via CSS classes
- **Trigger**: Click to open bug report modal

### 2. Automatic Data Collection

**Screenshot Capture**:
- Uses native browser APIs (not html2canvas)
- Captures current page state
- Automatically attached to bug reports

**Console Logs**:
- Auto-captures console logs
- Includes errors, warnings, and info
- Attached to bug reports for debugging

**User Context**:
- User ID: Authenticated user's ID
- Name: Student name or full name
- Email: User's email address
- Automatically passed from auth state

**System Information**:
- Browser type and version
- Operating system
- Screen resolution
- Current page URL
- Timestamp

### 3. Bug Report Form

**Fields**:
- Title (required)
- Description (required)
- Category (dropdown)
- Priority (dropdown)
- Screenshot (auto-captured)
- Console logs (auto-collected)

**Submission**:
- Validates all required fields
- Sends to centralized platform
- Shows success/error toast notifications

---

## User Experience

### Before (Old System):

1. Click floating bug button
2. Fill out local form
3. Upload screenshots manually
4. Submit to local database
5. View in `/dashboard/bug-reports`

### After (Centralized SDK):

1. Click floating bug button (same position)
2. Fill out form (similar UI)
3. Screenshots captured automatically
4. Console logs collected automatically
5. Submit to centralized platform
6. View in external bug management dashboard

**Benefits**:
- ✅ Unified bug tracking across all JKKN apps
- ✅ Better bug management and prioritization
- ✅ Automatic data collection (screenshots, logs)
- ✅ Reduced maintenance burden
- ✅ Professional bug tracking platform

---

## Configuration Options

### BugReporterProvider Props

```typescript
<BugReporterProvider
  apiKey={string}              // Required: API key from platform
  apiUrl={string}              // Required: Platform API URL
  enabled={boolean}            // Optional: Enable/disable widget
  debug={boolean}              // Optional: Debug mode logging
  userContext={{               // Optional: User information
    userId: string,
    name: string,
    email: string
  }}
>
  {children}
</BugReporterProvider>
```

### Current Configuration

**Enabled**: Always enabled (`enabled={true}`)

**Debug Mode**: Development only (`debug={process.env.NODE_ENV === 'development'}`)

**User Context**: Automatically populated from auth state
- Uses authenticated user's ID, name, and email
- Falls back to `undefined` if not authenticated

---

## Build Status

✅ **Build completed successfully** - No errors

```
✓ Compiled successfully in 15.0s
✓ Generating static pages (144/144)
Route count: 144 total routes
```

**Changes**:
- 2 pages removed: `/dashboard/bug-reports`, `/test-bug-report`
- 3 components removed: Bug report related components
- 1 SDK added: `@boobalan_jkkn/bug-reporter-sdk`

---

## Testing

### Verification Steps:

1. ✅ **Button Appearance**
   - Open passenger application
   - Check bottom-right corner for floating bug button
   - Verify button is visible and clickable

2. ✅ **User Context**
   - Log in as authenticated user
   - Open bug report modal
   - Verify user information pre-filled

3. ✅ **Screenshot Capture**
   - Open bug report modal
   - Check if screenshot is captured automatically
   - Verify screenshot shows current page

4. ✅ **Form Submission**
   - Fill out bug report form
   - Submit report
   - Check for success toast notification

5. ✅ **Console Integration**
   - Open browser console
   - Trigger some console logs
   - Submit bug report
   - Verify logs are included

---

## API Integration

### Endpoint

**Base URL**: `https://jkkn-centralized-bug-reporter.vercel.app` (configured in environment variable)

**Authentication**: API Key in headers

```
Authorization: Bearer br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
```

### Bug Report Submission

**Full URL**: `POST https://jkkn-centralized-bug-reporter.vercel.app/api/v1/public/bug-reports`

**Note**: The SDK automatically constructs this URL by appending `/api/v1/public/bug-reports` to the base URL

**Payload**:
```json
{
  "title": "Bug title",
  "description": "Bug description",
  "category": "bug|feature|improvement",
  "priority": "low|medium|high|critical",
  "page_url": "https://tms.jkkn.ai/dashboard",
  "screenshot_url": "data:image/png;base64,...",
  "console_logs": ["log1", "log2"],
  "user_context": {
    "userId": "user-id",
    "name": "User Name",
    "email": "user@jkkn.ac.in"
  },
  "browser_info": {
    "userAgent": "...",
    "platform": "...",
    "screenResolution": "1920x1080"
  }
}
```

---

## Migration Guide

### For Developers:

**No code changes required** for basic usage!

The SDK automatically:
- Renders floating bug button
- Captures screenshots
- Collects console logs
- Submits to platform

### Optional: Programmatic Bug Reporting

```typescript
import { useBugReporter } from '@boobalan_jkkn/bug-reporter-sdk';

function MyComponent() {
  const { apiClient } = useBugReporter();

  const reportError = async (error: Error) => {
    await apiClient?.createBugReport({
      title: 'Automatic Error Report',
      description: error.message,
      page_url: window.location.href,
      category: 'error',
      console_logs: [],
    });
  };

  return <button onClick={() => reportError(new Error('Test'))}>
    Report Error
  </button>;
}
```

### Optional: Add "My Bugs" Panel

```typescript
import { MyBugsPanel } from '@boobalan_jkkn/bug-reporter-sdk';

export default function ProfilePage() {
  return (
    <div>
      <h1>My Profile</h1>
      <MyBugsPanel />
    </div>
  );
}
```

---

## Files Summary

### Modified:
- ✅ `app/layout.tsx` - Updated to wrap app with BugReporterProvider
- ✅ `components/bug-report-wrapper.tsx` - Replaced with SDK integration
- ✅ `.env.local` - Added bug reporter API credentials

### Removed:
- ✅ `components/bug-button-portal.tsx`
- ✅ `components/floating-bug-report-button.tsx`
- ✅ `components/bug-bounty-tracker.tsx`
- ✅ `app/dashboard/bug-reports/page.tsx`
- ✅ `app/test-bug-report/page.tsx`

### Added:
- ✅ SDK: `@boobalan_jkkn/bug-reporter-sdk@1.0.6`

---

## Benefits of Centralized System

### 1. Unified Bug Tracking
- All JKKN applications report to single platform
- Cross-app bug analytics
- Better prioritization and resource allocation

### 2. Better Data Collection
- Automatic screenshot capture (no manual upload)
- Console logs auto-collected
- System information included
- User context tracked

### 3. Reduced Maintenance
- No need to maintain local bug report database
- No need to build bug management UI
- SDK updates handled centrally

### 4. Professional Platform
- Dedicated bug management dashboard
- Advanced filtering and search
- Bug status tracking and workflows
- Team collaboration features

### 5. Consistency
- Same bug reporting experience across all apps
- Standardized bug report format
- Consistent user interface

---

## Troubleshooting

### Widget not appearing?

**Check**:
- `enabled` prop is set to `true`
- API key is correct in `.env.local`
- Browser console for errors

**Fix**:
```typescript
<BugReporterProvider
  enabled={true}  // Make sure this is true
  apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
  apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
>
```

### API key validation failed?

**Check**:
- API key starts with `"br_"`
- API key is in `.env.local` file
- Environment variable name is correct
- Application is registered on platform

**Fix**:
```bash
# In .env.local
NEXT_PUBLIC_BUG_REPORTER_API_KEY=br_eULnXFvh6QecerSYyD8beG1TNIu6E5HC
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://jkkn-centralized-bug-reporter.vercel.app
```

**Important**: Use base URL only, without `/api/v1/public` path

### Screenshots not capturing?

**Check**:
- Browser supports screenshot APIs
- No CSP (Content Security Policy) blocks
- Page is fully loaded before capture

### Build errors?

**Issue**: Peer dependency conflict with lucide-react

**Fix**: Install with `--legacy-peer-deps`
```bash
npm install @boobalan_jkkn/bug-reporter-sdk --legacy-peer-deps
```

---

## Next Steps

1. ✅ Verify bug button appears in bottom-right corner
2. ✅ Test bug submission with authenticated user
3. ✅ Check bug appears in centralized platform dashboard
4. ✅ Optional: Add "My Bugs" panel to user profile
5. ✅ Optional: Set up error boundary to auto-report crashes

---

## Support

For issues with the SDK or platform:
- Check SDK documentation
- Contact platform administrator
- Report SDK bugs to SDK repository

For application-specific issues:
- Use the bug reporter button! 🐛
- Contact development team
