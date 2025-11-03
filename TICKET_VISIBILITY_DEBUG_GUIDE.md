# Ticket Visibility Debug Guide

## Problem
The booking exists in the database but doesn't show in the passenger calendar despite the header showing "Detected bookings: 1 | Schedules with bookings: 1".

## Enhanced Debugging

I've added comprehensive logging to the API at `app/api/schedules/availability/route.ts`. Follow these steps to debug:

### Step 1: Check Browser Console Logs

1. Open the passenger application as `student@jkkn.ac.in`
2. Navigate to Schedules page
3. Open browser console (F12)
4. Look for logs starting with `🔍 BOOKING LOAD:` and `🔍 BOOKING DEBUG:`

You should see:
```
🔍 BOOKING LOAD: Loading existing bookings for student: 0a800954-f854-4115-a652-20254478781a
🔍 BOOKING LOAD: Received schedules: X
🔍 BOOKING LOAD: Total existing bookings found: Y
```

If `Y` is 0, the API is not returning bookings.

### Step 2: Check Server Console Logs

Start the dev server and watch for API logs:

```bash
cd D:\other matters\jicate\TMS-ADMIN\TMS-PASSENGER
npm run dev
```

When you load the schedules page, you should see in server console:

```
🔍 API DEBUG: *** UPDATED VERSION v2.0 *** Availability API called with: {
  routeId: 'f854a895-cb60-4c95-8e28-47d6c038e573',
  startDate: '2025-11-03',
  endDate: '2025-12-03',
  studentId: '0a800954-f854-4115-a652-20254478781a'
}
🔍 API DEBUG: Fetching bookings for studentId: 0a800954-f854-4115-a652-20254478781a
🔍 API DEBUG: Student bookings found: 1
🔍 API DEBUG: Bookings data: [{
  "id": "8fb2e6e9-372b-44e6-aba2-a086ee39fd78",
  "student_id": "0a800954-f854-4115-a652-20254478781a",
  "schedule_id": "b850f67e-a7a5-4a06-befb-7f94ccf7248b",
  ...
}]
🔍 API DEBUG: Matching bookings to schedules...
🔍 API DEBUG: ✅ Found booking for schedule b850f67e-a7a5-4a06-befb-7f94ccf7248b (2025-11-03)
```

### Step 3: Common Issues and Fixes

#### Issue 1: Student ID Mismatch
**Symptom**: API receives `null` or different studentId
**Solution**:
1. Logout completely
2. Clear browser data (Ctrl+Shift+Delete)
3. Login as `student@jkkn.ac.in`

#### Issue 2: Date Format Mismatch
**Symptom**: Booking has trip_date='2025-11-03' but schedule has schedule_date='2025-11-03T00:00:00'
**Check**: Look at the API logs for date comparison
**Solution**: Already handled in code by comparing date strings

#### Issue 3: Schedule ID Mismatch
**Symptom**: `booking.schedule_id` doesn't match `schedule.id`
**Solution**: Verify in database:
```sql
SELECT
  b.id as booking_id,
  b.schedule_id,
  s.id as schedule_id_from_table,
  b.trip_date,
  s.schedule_date
FROM bookings b
LEFT JOIN schedules s ON b.schedule_id = s.id
WHERE b.student_id = '0a800954-f854-4115-a652-20254478781a'
  AND b.trip_date = '2025-11-03';
```

#### Issue 4: RLS (Row Level Security) Blocking Query
**Symptom**: API shows 0 bookings found despite booking existing in database
**Solution**: The API uses anon key which might have RLS restrictions. Check if RLS policies allow reading bookings:

```sql
-- Check RLS policies on bookings table
SELECT * FROM pg_policies WHERE tablename = 'bookings';
```

If RLS is blocking, temporarily disable it for testing:
```sql
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

(Re-enable after testing with proper policies)

### Step 4: Force Refresh

After verifying logs, try forcing a refresh:

1. Click the "Refresh" button on the schedules page
2. Check if booking appears
3. If not, clear cache and reload:
   - Settings → Clear browsing data
   - Or use Incognito mode

### Step 5: Database Verification

Verify the booking exists and matches expected format:

```sql
SELECT
  b.id,
  b.student_id,
  b.schedule_id,
  b.trip_date,
  b.status,
  b.qr_code,
  b.seat_number,
  b.payment_status,
  s.id as schedule_exists,
  s.schedule_date,
  s.route_id
FROM bookings b
LEFT JOIN schedules s ON b.schedule_id = s.id
WHERE b.student_id = '0a800954-f854-4115-a652-20254478781a'
  AND b.trip_date = '2025-11-03';
```

Expected result:
- `status` = 'confirmed'
- `schedule_exists` = not null
- `schedule_date` = '2025-11-03'
- `route_id` = 'f854a895-cb60-4c95-8e28-47d6c038e573'

## Quick Test API

Test the API directly:

```bash
# Replace with your dev server URL
curl "http://localhost:3000/api/schedules/availability?routeId=f854a895-cb60-4c95-8e28-47d6c038e573&startDate=2025-11-03&endDate=2025-12-03&studentId=0a800954-f854-4115-a652-20254478781a"
```

Check the response for `user_booking` field in the November 3rd schedule.

## Next Steps

1. Run the application and check server console logs
2. Check browser console logs
3. Report back what you see in the logs
4. We can then identify the exact point of failure
