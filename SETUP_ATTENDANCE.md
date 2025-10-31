# Quick Setup Guide - Attendance System

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `migrations/create_attendance_table.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success message

### Option B: Using Supabase CLI
```bash
# Make sure you're in the project directory
cd TMS-PASSENGER

# Push the migration
npx supabase db push migrations/create_attendance_table.sql
```

## Step 2: Verify Database Setup

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if attendance table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'attendance'
);

-- Check table structure
\d attendance

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'attendance';
```

Expected: All should return results showing the table exists with proper structure and policies.

## Step 3: Test the System

### Test Scan Endpoint
```bash
curl -X POST http://localhost:3000/api/staff/scan-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticketCode": "BOOKING123",
    "staffEmail": "staff@example.com"
  }'
```

### Test Attendance History
```bash
curl "http://localhost:3000/api/staff/attendance?date=2025-10-31&staffEmail=staff@example.com"
```

## Step 4: Access the UI

1. Log in as a staff member at `/staff-login`
2. Click **Attendance** in the sidebar
3. Click **Open Scanner** to test camera
4. Or enter a booking reference manually

## Common Issues & Solutions

### Issue: "Table already exists"
**Solution:** The table is already created. Skip migration.

### Issue: "Permission denied for table attendance"
**Solution:** Check RLS policies are properly created. Re-run the policy section of the migration.

### Issue: Camera not working
**Solution:**
- Ensure HTTPS is enabled (required for camera API)
- Grant camera permissions in browser settings
- Use manual entry as fallback

### Issue: "Staff not assigned to route"
**Solution:**
- Verify staff has active assignment in `staff_route_assignments` table
- Check `is_active = true` for the assignment

### Issue: "Booking not found"
**Solution:**
- Verify the booking exists with status 'confirmed'
- Check the ticket code matches `booking_reference` or `qr_code` field

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Attendance table exists in database
- [ ] RLS policies active and working
- [ ] Staff can access `/staff/attendance` page
- [ ] Camera opens when clicking "Open Scanner"
- [ ] Manual entry works with test booking code
- [ ] Statistics display correctly
- [ ] Attendance records show after scanning
- [ ] Duplicate scan prevention works
- [ ] Only assigned staff can scan their routes

## Production Deployment

Before deploying to production:

1. **Backup Database**
   ```sql
   -- Export current database structure
   pg_dump -U postgres -h your-host -d your-db > backup.sql
   ```

2. **Test in Staging**
   - Apply migration to staging environment first
   - Test all functionality with real data
   - Verify performance with expected load

3. **Deploy to Production**
   - Schedule maintenance window if needed
   - Apply migration during low-traffic period
   - Monitor logs for any issues
   - Have rollback plan ready

4. **Post-Deployment**
   - Test core functionality
   - Monitor error logs
   - Verify attendance recording works
   - Train staff on new feature

## Rollback (If Needed)

If you need to remove the attendance system:

```sql
-- Drop the attendance table and related objects
DROP TABLE IF EXISTS attendance CASCADE;
DROP VIEW IF EXISTS attendance_summary;
DROP FUNCTION IF EXISTS update_attendance_updated_at();
```

⚠️ **Warning:** This will delete all attendance records permanently!

## Support Contacts

- Database Issues: Check Supabase Dashboard logs
- API Issues: Check server logs at `/api/staff/scan-ticket`
- UI Issues: Check browser console for errors
- For help: Refer to ATTENDANCE_SYSTEM_COMPLETE.md

---

✅ **System Ready:** Once all checklist items are complete, the attendance system is ready for use!
