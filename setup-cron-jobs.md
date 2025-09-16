# 🕐 Automated Booking Notification Setup

## Daily Cron Jobs for 5 PM and 6 PM Notifications

### Method 1: Server Cron Jobs (Linux/macOS)

Add these cron jobs to your server:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Send booking reminders at 5:00 PM daily
0 17 * * * curl -X POST https://tms.jkkn.ac.in/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"YOUR_SCHEDULER_SECRET_KEY","targetDate":null,"dryRun":false}' \
  >> /var/log/tms-scheduler-5pm.log 2>&1

# Send booking reminders at 6:00 PM daily
0 18 * * * curl -X POST https://tms.jkkn.ac.in/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"YOUR_SCHEDULER_SECRET_KEY","targetDate":null,"dryRun":false,"force":true}' \
  >> /var/log/tms-scheduler-6pm.log 2>&1
```

### Method 2: GitHub Actions (Cloud-based)

Create `.github/workflows/booking-notifications.yml`:

```yaml
name: Daily Booking Notifications

on:
  schedule:
    # 5:00 PM UTC (adjust timezone as needed)
    - cron: '0 17 * * *'
    # 6:00 PM UTC
    - cron: '0 18 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Booking Reminders
        run: |
          HOUR=$(date +%H)
          if [ "$HOUR" = "17" ]; then
            echo "Sending 5 PM notifications"
            FORCE="false"
          else
            echo "Sending 6 PM notifications"
            FORCE="true"
          fi
          
          curl -X POST ${{ secrets.APP_URL }}/api/notifications/scheduler \
            -H "Content-Type: application/json" \
            -d "{\"schedulerKey\":\"${{ secrets.SCHEDULER_SECRET_KEY }}\",\"targetDate\":null,\"dryRun\":false,\"force\":\"$FORCE\"}"
```

### Method 3: Vercel Cron Jobs

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/scheduler",
      "schedule": "0 17 * * *"
    },
    {
      "path": "/api/notifications/scheduler", 
      "schedule": "0 18 * * *"
    }
  ]
}
```

### Method 4: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** 
- **SetCronJob**

Configure two jobs:
1. **5:00 PM**: `POST https://tms.jkkn.ac.in/api/notifications/scheduler`
2. **6:00 PM**: `POST https://tms.jkkn.ac.in/api/notifications/scheduler` (with force=true)

## Environment Variables Required

```bash
# In .env.local
SCHEDULER_SECRET_KEY=your-secure-random-key-here
NEXT_PUBLIC_BASE_URL=https://tms.jkkn.ac.in
```

## Testing

```bash
# Test 5 PM notification
curl -X POST http://localhost:3000/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"your-secret-key","dryRun":true}'

# Test 6 PM notification (forced)
curl -X POST http://localhost:3000/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"schedulerKey":"your-secret-key","dryRun":true,"force":true}'
```

## Monitoring

- Check logs in `/var/log/tms-scheduler-*.log`
- Monitor the `scheduler_runs` table in your database
- Set up alerts for failed notifications

## Timezone Considerations

Adjust cron times based on your server timezone:
- **IST (India)**: Use `30 11 * * *` for 5:00 PM and `30 12 * * *` for 6:00 PM
- **UTC**: Use `0 17 * * *` for 5:00 PM and `0 18 * * *` for 6:00 PM
