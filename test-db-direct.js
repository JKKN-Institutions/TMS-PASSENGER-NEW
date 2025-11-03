const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugwbtzgttqlzzuahdmis.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2J0emd0dHFsenp1YWhkbWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYzNDQ1NSwiZXhwIjoyMDUxMjEwNDU1fQ.TWAx8B0vYLMX_jVAoUVJdnqU3oG_QIW3DfaC6tjmDiE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  try {
    console.log('\n========================================');
    console.log('DATABASE TEST - November 3rd Booking');
    console.log('========================================\n');

    const studentId = '0a800954-f854-4115-a652-20254478781a';
    const scheduleId = 'b850f67e-a7a5-4a06-befb-7f94ccf7248b';
    const routeId = 'f854a895-cb60-4c95-8e28-47d6c038e573';
    const tripDate = '2025-11-03';

    console.log('📋 Test Parameters:');
    console.log('   Student ID:', studentId);
    console.log('   Schedule ID:', scheduleId);
    console.log('   Route ID:', routeId);
    console.log('   Trip Date:', tripDate);
    console.log('');

    // Test 1: Get all confirmed bookings for this student
    console.log('TEST 1: Get ALL confirmed bookings for student');
    console.log('------------------------------------------------');
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select('id, schedule_id, trip_date, route_id, status, qr_code')
      .eq('student_id', studentId)
      .eq('status', 'confirmed');

    if (allError) {
      console.log('❌ Error:', allError);
    } else {
      console.log(`✅ Found ${allBookings?.length || 0} confirmed booking(s)`);
      if (allBookings && allBookings.length > 0) {
        allBookings.forEach((b, i) => {
          console.log(`\nBooking #${i + 1}:`);
          console.log('  ID:', b.id);
          console.log('  Schedule ID:', b.schedule_id);
          console.log('  Trip Date:', b.trip_date);
          console.log('  Route ID:', b.route_id);
          console.log('  QR Code:', b.qr_code);
          console.log('  Status:', b.status);
        });
      }
    }

    console.log('\n');

    // Test 2: Find booking that matches by schedule_id
    console.log('TEST 2: Find booking by schedule_id match');
    console.log('------------------------------------------------');
    const bookingByScheduleId = allBookings?.find(b => b.schedule_id === scheduleId);
    if (bookingByScheduleId) {
      console.log('✅ Found by schedule_id:', bookingByScheduleId.id);
    } else {
      console.log('❌ NOT found by schedule_id');
    }

    console.log('\n');

    // Test 3: Find booking that matches by trip_date + route_id
    console.log('TEST 3: Find booking by trip_date + route_id match');
    console.log('------------------------------------------------');
    const bookingByDateRoute = allBookings?.find(b =>
      b.trip_date === tripDate && b.route_id === routeId
    );
    if (bookingByDateRoute) {
      console.log('✅ Found by trip_date + route_id:', bookingByDateRoute.id);
      console.log('   Trip Date:', bookingByDateRoute.trip_date);
      console.log('   Route ID:', bookingByDateRoute.route_id);
    } else {
      console.log('❌ NOT found by trip_date + route_id');
      console.log('   Looking for trip_date:', tripDate);
      console.log('   Looking for route_id:', routeId);
      if (allBookings && allBookings.length > 0) {
        console.log('   Actual booking trip_date:', allBookings[0].trip_date);
        console.log('   Actual booking route_id:', allBookings[0].route_id);
      }
    }

    console.log('\n');

    // Test 4: Simulate API logic
    console.log('TEST 4: Simulate exact API logic');
    console.log('------------------------------------------------');
    const { data: apiBookings } = await supabase
      .from('bookings')
      .select('id, schedule_id, trip_date, route_id, status as booking_status, seat_number, qr_code')
      .eq('student_id', studentId)
      .eq('status', 'confirmed');

    const existingBooking = apiBookings?.find(booking =>
      booking.schedule_id === scheduleId ||
      (booking.trip_date === tripDate && booking.route_id === routeId)
    ) || null;

    if (existingBooking) {
      console.log('✅ API logic WOULD find booking:');
      console.log('   ID:', existingBooking.id);
      console.log('   QR Code:', existingBooking.qr_code);
      console.log('   Match by schedule_id?', existingBooking.schedule_id === scheduleId);
      console.log('   Match by date+route?', existingBooking.trip_date === tripDate && existingBooking.route_id === routeId);
    } else {
      console.log('❌ API logic would NOT find booking');
    }

    console.log('\n');

    // Test 5: Check the schedule
    console.log('TEST 5: Verify schedule exists');
    console.log('------------------------------------------------');
    const { data: schedule } = await supabase
      .from('schedules')
      .select('id, schedule_date, route_id, status')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      console.log('✅ Schedule found:');
      console.log('   ID:', schedule.id);
      console.log('   Date:', schedule.schedule_date);
      console.log('   Route ID:', schedule.route_id);
      console.log('   Status:', schedule.status);
    } else {
      console.log('❌ Schedule NOT found');
    }

    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
})();
