const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendance() {
  console.log('🔍 Checking attendance records for student@jkkn.ac.in...\n');
  
  // Get student ID
  const { data: student } = await supabase
    .from('students')
    .select('id, student_name, email')
    .eq('email', 'student@jkkn.ac.in')
    .single();
    
  if (!student) {
    console.log('❌ Student not found');
    return;
  }
  
  console.log('✅ Student found:', student);
  
  // Get bookings for November 2025
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, trip_date, status, qr_code')
    .eq('student_id', student.id)
    .gte('trip_date', '2025-11-01')
    .lte('trip_date', '2025-11-30')
    .order('trip_date');
    
  console.log('\n📅 Bookings for November 2025:');
  console.table(bookings);
  
  // Get attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, booking_id, attendance_date, status, boarding_time, marked_by_email')
    .eq('student_id', student.id)
    .gte('attendance_date', '2025-11-01')
    .lte('attendance_date', '2025-11-30')
    .order('attendance_date');
    
  console.log('\n✅ Attendance records for November 2025:');
  console.table(attendance);
  
  // Check specific date
  const { data: nov5Booking } = await supabase
    .from('bookings')
    .select('id, trip_date, status, qr_code')
    .eq('student_id', student.id)
    .eq('trip_date', '2025-11-05')
    .single();
    
  console.log('\n🔍 November 5th booking:');
  console.log(nov5Booking);
  
  if (nov5Booking) {
    const { data: nov5Attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', nov5Booking.id)
      .maybeSingle();
      
    console.log('\n✅ November 5th attendance:');
    console.log(nov5Attendance);
  }
}

checkAttendance().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
