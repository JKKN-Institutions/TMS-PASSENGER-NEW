# Push Notification Reminder Banner Integration Guide

## Overview
The `PushNotificationReminderBanner` component provides a gentle, non-intrusive reminder for students who haven't enabled push notifications yet.

## Component Location
```
TMS-PASSENGER/components/push-notification-reminder-banner.tsx
```

## Features
- ✅ Shows only to students without push notifications
- ✅ Respects user dismissals (7-day cooldown)
- ✅ Doesn't show if dismissed in current session
- ✅ One-click enable functionality
- ✅ Links to notification settings
- ✅ Beautiful gradient UI matching app theme
- ✅ Shows benefits of enabling push
- ✅ Non-intrusive design

## Integration Instructions

### Option 1: Dashboard Page (Recommended)
Add the banner to the main dashboard page where students land after login:

**File**: `TMS-PASSENGER/app/dashboard/page.tsx`

```tsx
import PushNotificationReminderBanner from '@/components/push-notification-reminder-banner';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Push Notification Reminder Banner */}
      <PushNotificationReminderBanner />
      
      {/* Rest of dashboard content */}
      {/* ... */}
    </div>
  );
}
```

### Option 2: Layout Integration
For site-wide display on all dashboard pages:

**File**: `TMS-PASSENGER/app/dashboard/layout.tsx`

```tsx
import PushNotificationReminderBanner from '@/components/push-notification-reminder-banner';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <PushNotificationReminderBanner />
      {children}
    </div>
  );
}
```

### Option 3: Specific Pages
Add to specific pages where notifications are most relevant:

#### Bookings Page
**File**: `TMS-PASSENGER/app/dashboard/bookings/page.tsx`

```tsx
import PushNotificationReminderBanner from '@/components/push-notification-reminder-banner';

export default function BookingsPage() {
  return (
    <div>
      <PushNotificationReminderBanner />
      {/* Bookings content */}
    </div>
  );
}
```

#### Schedules Page
**File**: `TMS-PASSENGER/app/dashboard/schedules/page.tsx`

```tsx
import PushNotificationReminderBanner from '@/components/push-notification-reminder-banner';

export default function SchedulesPage() {
  return (
    <div>
      <PushNotificationReminderBanner />
      {/* Schedules content */}
    </div>
  );
}
```

## Behavior

### When Banner Shows
- User is authenticated
- Push notifications are supported by browser
- User has NOT granted permission
- User is NOT subscribed to push
- Banner was not dismissed in current session
- Last dismissal was more than 7 days ago (or never dismissed)
- After 3-second delay (to avoid overwhelming user)

### When Banner Hides
- User enables push notifications
- User clicks "Remind me later"
- User clicks the X button
- User navigates to Settings
- User dismissed within last 7 days

### User Actions
1. **Enable Now**: Requests permission and subscribes immediately
2. **Settings**: Navigates to notification settings page
3. **Remind me later**: Hides for 7 days
4. **X button**: Hides for current session

## Customization

### Timing
Change the initial display delay:
```tsx
// In component, line ~60
setTimeout(() => {
  setShowBanner(true);
}, 3000); // Change to desired delay in milliseconds
```

### Cooldown Period
Change the 7-day dismissal period:
```tsx
// In component, line ~28
if (daysSinceLastDismissed < 7) {  // Change to desired days
  return;
}
```

### Styling
The banner uses Tailwind CSS classes. Customize the gradient:
```tsx
// Change background gradient
className="bg-gradient-to-r from-blue-50 to-purple-50"

// Change button gradient
className="bg-gradient-to-r from-blue-600 to-purple-600"
```

## Analytics Tracking (Optional)

Add analytics events to track user behavior:

```tsx
// After successful enable
if (result.success) {
  // Track in your analytics platform
  analytics.track('push_notifications_enabled', {
    source: 'reminder_banner',
    userId: user.id
  });
  
  toast.success('🔔 Push notifications enabled successfully!');
  setShowBanner(false);
}

// After dismiss
const handleDismiss = () => {
  // Track dismissal
  analytics.track('push_reminder_dismissed', {
    userId: user.id,
    dismissalMethod: 'remind_later'
  });
  
  // Rest of code...
};
```

## Testing

### Test the Banner
1. Clear browser data for the app
2. Login as a student
3. Dismiss the initial `AutoPushPermission` prompt
4. Wait 3 seconds to see the reminder banner

### Test Dismissal
1. Click "Remind me later"
2. Refresh the page
3. Banner should not appear

### Test Re-appearance
1. Clear `localStorage` item: `push-reminder-banner-last-dismissed`
2. Clear `sessionStorage` item: `push-reminder-banner-dismissed`
3. Refresh the page
4. Banner should appear after 3 seconds

### Test Enable
1. Click "Enable Now"
2. Accept browser permission
3. Banner should disappear
4. Check browser console for success logs

## Browser Console Commands

For debugging:

```javascript
// Check current dismissal status
console.log('Last dismissed:', localStorage.getItem('push-reminder-banner-last-dismissed'));
console.log('Session dismissed:', sessionStorage.getItem('push-reminder-banner-dismissed'));

// Reset dismissal (to test banner again)
localStorage.removeItem('push-reminder-banner-last-dismissed');
sessionStorage.removeItem('push-reminder-banner-dismissed');

// Check push subscription status
pushNotificationService.getSubscriptionStatus().then(console.log);
```

## Best Practices

1. **Don't Overload**: Only use in one place (recommend dashboard or layout, not both)
2. **Respect User Choice**: The 7-day cooldown prevents annoyance
3. **Clear Value Proposition**: Banner clearly shows benefits of enabling
4. **Easy Dismissal**: X button and "Remind later" give user control
5. **Progressive Disclosure**: Shows after initial prompt dismissal, not immediately

## Recommended Placement

**Best**: Main dashboard page (first page after login)
- High visibility
- Contextually relevant
- Doesn't block critical actions

**Good**: Bookings/Schedules pages
- Relevant to notification use cases
- Targeted context

**Avoid**: Every page via layout
- Can be too intrusive
- May annoy users who already made their choice

## Success Metrics to Track

1. **Banner Impression Rate**: How often banner is shown
2. **Enable Rate**: % of users who click "Enable Now"
3. **Permission Grant Rate**: % who actually grant permission
4. **Dismissal Rate**: % who dismiss vs enable
5. **Re-engagement**: Users who enable after multiple views

## Email Campaign Support

For students who haven't enabled push after multiple banner views, consider:
1. Email explaining benefits
2. Step-by-step guide with screenshots
3. FAQ about push notifications
4. Contact support if issues persist

Export student list from admin dashboard:
`/admin/notifications/push-subscribers` → Export "Without Push" tab

## Support

If students report issues:
1. Check browser compatibility (Chrome, Firefox, Edge, Safari 16+)
2. Ensure HTTPS (push requires secure context)
3. Check browser notification settings
4. Verify VAPID keys are configured
5. Test with browser console debugging


