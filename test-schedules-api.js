const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchedulesAPI() {
  const studentEmail = 'student@jkkn.ac.in';
  
  // Get student
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('email', studentEmail)
    .single();
    
  console.log('📊 Testing schedules API response...\n');
  console.log('Student ID:', student.id);
  
  // Get route allocation
  const { data: allocation } = await supabase
    .from('student_route_allocations')
    .select('route_id')
    .eq('student_id', student.id)
    .eq('is_active', true)
    .single();
    
  if (!allocation) {
    console.log('❌ No route allocation');
    return;
  }
  
  console.log('Route ID:', allocation.route_id);
  
  // Simulate what getSchedules does
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('route_id', allocation.route_id)
    .gte('schedule_date', '2025-11-01')
    .lte('schedule_date', '2025-11-30')
    .order('schedule_date');
    
  console.log('\n📅 Found', schedules?.length, 'schedules\n');
  
  // For each schedule, check booking and attendance (like the API does)
  for (const schedule of schedules || []) {
    console.log(`\n🔍 Schedule Date: ${schedule.schedule_date}`);
    console.log(`   Schedule ID: ${schedule.id}`);
    
    // Check booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, seat_number, qr_code, payment_status, trip_date')
      .eq('student_id', student.id)
      .eq('schedule_id', schedule.id)
      .eq('status', 'confirmed')
      .single();
      
    if (booking) {
      console.log(`   ✅ Booking found: ${booking.id}`);
      console.log(`      Trip date: ${booking.trip_date}`);
      
      // Check attendance (THIS IS THE KEY PART)
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id, status, boarding_time, marked_by_email')
        .eq('booking_id', booking.id)
        .eq('attendance_date', booking.trip_date)
        .maybeSingle();
        
      if (attendance) {
        console.log(`   🟣 ATTENDANCE FOUND!`);
        console.log(`      Status: ${attendance.status}`);
        console.log(`      Boarding time: ${attendance.boarding_time}`);
        console.log(`      Marked by: ${attendance.marked_by_email}`);
      } else {
        console.log(`   ⚠️ No attendance record`);
      }
      
      const userBooking = {
        id: booking.id,
        status: booking.status,
        seatNumber: booking.seat_number,
        qrCode: booking.qr_code,
        paymentStatus: booking.payment_status,
        attendanceMarked: !!attendance,
        attendanceStatus: attendance?.status,
        boardingTime: attendance?.boarding_time,
        verifiedBy: attendance?.marked_by_email
      };
      
      console.log('   📦 User booking object:', JSON.stringify(userBooking, null, 2));
    } else {
      console.log(`   ❌ No booking`);
    }
  }
}

testSchedulesAPI().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
