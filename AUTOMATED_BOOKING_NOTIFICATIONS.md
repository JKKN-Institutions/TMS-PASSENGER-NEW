# 🕐 Automated Booking Notifications - 5 PM & 6 PM Daily

## Overview

Automatically send booking reminder push notifications at **5:00 PM** and **6:00 PM** every day to students with upcoming trips. The system provides multiple deployment options and comprehensive monitoring.

## 🚀 Quick Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Required for automated scheduling
SCHEDULER_SECRET_KEY=your-secure-random-key-here
NEXT_PUBLIC_BASE_URL=https://tms.jkkn.ac.in

# Existing push notification variables
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 2. Database Migration

Run the enhanced scheduler migration:

```bash
# Apply the migration to add time_slot support
npx supabase migration up --file 20250916_enhanced_scheduler.sql
```

### 3. Choose Your Deployment Method

## 📅 Deployment Options

### Option A: Vercel Cron Jobs (Recommended)

The `vercel.json` file has been updated with automatic cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-scheduler",
      "schedule": "0 17 * * *",
      "body": "{\"schedulerKey\":\"process.env.SCHEDULER_SECRET_KEY\",\"timeSlot\":\"17:00\",\"dryRun\":false}"
    },
    {
      "path": "/api/notifications/daily-scheduler", 
      "schedule": "0 18 * * *",
      "body": "{\"schedulerKey\":\"process.env.SCHEDULER_SECRET_KEY\",\"timeSlot\":\"18:00\",\"dryRun\":false,\"force\":true}"
    }
  ]
}
```

**Deploy:** Just push to Vercel - cron jobs will be automatically active!

### Option B: Server Cron Jobs

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add these lines:
# 5:00 PM daily
0 17 * * * curl -X POST https://tms.jkkn.ac.in/api/notifications/daily-scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"YOUR_SECRET_KEY","timeSlot":"17:00","dryRun":false}' \
  >> /var/log/tms-5pm.log 2>&1

# 6:00 PM daily  
0 18 * * * curl -X POST https://tms.jkkn.ac.in/api/notifications/daily-scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"YOUR_SECRET_KEY","timeSlot":"18:00","dryRun":false,"force":true}' \
  >> /var/log/tms-6pm.log 2>&1
```

### Option C: GitHub Actions

Create `.github/workflows/booking-notifications.yml`:

```yaml
name: Daily Booking Notifications

on:
  schedule:
    - cron: '0 17 * * *'  # 5:00 PM UTC
    - cron: '0 18 * * *'  # 6:00 PM UTC
  workflow_dispatch:

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Determine Time Slot
        id: time
        run: |
          HOUR=$(date +%H)
          if [ "$HOUR" = "17" ]; then
            echo "::set-output name=slot::17:00"
            echo "::set-output name=force::false"
          else
            echo "::set-output name=slot::18:00" 
            echo "::set-output name=force::true"
          fi
      
      - name: Send Notifications
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/notifications/daily-scheduler \
            -H "Content-Type: application/json" \
            -d "{\"schedulerKey\":\"${{ secrets.SCHEDULER_SECRET_KEY }}\",\"timeSlot\":\"${{ steps.time.outputs.slot }}\",\"dryRun\":false,\"force\":${{ steps.time.outputs.force }}}"
```

## 📱 How It Works

### 5:00 PM Notification
- **Purpose**: Initial booking reminder
- **Message**: "🚌 Bus Booking Reminder - Tomorrow"
- **Content**: Standard reminder to confirm booking
- **Urgency**: Normal priority

### 6:00 PM Notification  
- **Purpose**: Follow-up for non-responders
- **Message**: "⏰ Last Chance - Confirm Your Bus Booking"
- **Content**: Urgent reminder with deadline emphasis
- **Urgency**: High priority
- **Force**: Runs even if 5 PM already executed

### Smart Features
- ✅ **Duplicate Prevention**: Won't send if already sent that day
- ✅ **Force Override**: 6 PM can run independently of 5 PM
- ✅ **Error Recovery**: Automatic retry logic for failed notifications
- ✅ **Analytics**: Tracks success rates and response metrics
- ✅ **Cleanup**: Automatically removes old notifications

## 🧪 Testing

### Manual Test

```bash
# Test 5 PM notifications
curl -X POST http://localhost:3000/api/notifications/daily-scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"your-secret-key","timeSlot":"17:00","dryRun":true}'

# Test 6 PM notifications
curl -X POST http://localhost:3000/api/notifications/daily-scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"your-secret-key","timeSlot":"18:00","dryRun":true,"force":true}'
```

### Monitoring Dashboard

Visit: `https://tms.jkkn.ac.in/admin/scheduler`

**Features:**
- ✅ Real-time scheduler status
- ✅ Daily run summaries  
- ✅ Notification delivery metrics
- ✅ Error logs and debugging
- ✅ Manual test triggers

## 📊 Monitoring & Analytics

### Database Views

```sql
-- Check today's scheduler status
SELECT * FROM scheduler_monitoring WHERE run_date = CURRENT_DATE;

-- Get scheduler status for specific date
SELECT * FROM get_daily_scheduler_status('2025-09-16');

-- Check if scheduler should run
SELECT should_scheduler_run('17:00');
```

### API Endpoints

```bash
# Check scheduler status
GET /api/notifications/scheduler-status?date=2025-09-16&detailed=true

# Manual test trigger
POST /api/notifications/scheduler-status
{
  "action": "test",
  "timeSlot": "17:00",
  "schedulerKey": "your-secret-key"
}
```

## 🔧 Configuration

### Notification Templates

Edit templates in the `notification_preferences` table:

```sql
-- Update 5 PM notification template
UPDATE notification_preferences 
SET title_template = '🚌 Tomorrow''s Bus - Confirm Your Seat',
    body_template = 'Your bus leaves tomorrow. Tap to confirm your booking and secure your seat!'
WHERE time_slot = '17:00' AND notification_type = 'booking_reminder';

-- Update 6 PM notification template  
UPDATE notification_preferences
SET title_template = '⚠️ URGENT: Confirm Bus Booking NOW',
    body_template = 'Final reminder! Your booking expires soon. Confirm now to avoid missing tomorrow''s bus.'
WHERE time_slot = '18:00' AND notification_type = 'booking_reminder';
```

### Timezone Settings

Adjust cron schedules for your timezone:

- **IST (UTC+5:30)**: Use `30 11 * * *` for 5:00 PM and `30 12 * * *` for 6:00 PM
- **UTC**: Use `0 17 * * *` for 5:00 PM and `0 18 * * *` for 6:00 PM

## 🚨 Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check `SCHEDULER_SECRET_KEY` in environment
   - Verify VAPID keys are configured
   - Check push subscription table has active users

2. **Cron jobs not running**
   - Verify Vercel cron is enabled (Pro plan required)
   - Check server crontab permissions
   - Validate JSON syntax in cron job body

3. **Duplicate notifications**
   - Check if `force: true` is set correctly for 6 PM
   - Verify database constraints are in place

### Debug Commands

```bash
# Check recent scheduler runs
curl "https://tms.jkkn.ac.in/api/notifications/scheduler-status?detailed=true"

# Test notification sending (dry run)
curl -X POST https://tms.jkkn.ac.in/api/test/booking-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType":"reminder_generation","skipNotifications":false}'

# Check push subscriptions
curl "https://tms.jkkn.ac.in/api/notifications/booking-reminders?targetDate=2025-09-17"
```

## 📈 Success Metrics

Track these KPIs:
- **Delivery Rate**: % of notifications successfully sent
- **Response Rate**: % of students who respond to reminders  
- **Confirmation Rate**: % of students who confirm bookings
- **Error Rate**: Failed notifications per day
- **Coverage**: % of eligible students reached

## 🔒 Security

- ✅ **API Key Protection**: All endpoints require valid scheduler key
- ✅ **Rate Limiting**: Prevents spam and abuse
- ✅ **Duplicate Prevention**: Database constraints prevent duplicate runs
- ✅ **Error Handling**: Graceful failure with detailed logging
- ✅ **Secure Headers**: CORS and security headers configured

## 🎯 Next Steps

1. **Deploy** using your preferred method above
2. **Test** with dry runs first
3. **Monitor** using the admin dashboard
4. **Optimize** notification templates based on response rates
5. **Scale** to additional time slots if needed

The system is ready for production use! 🚀
