import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const staffEmail = searchParams.get('staffEmail');

    console.log('📋 Attendance overview request:', { routeId, date, staffEmail });

    if (!routeId || !staffEmail) {
      return NextResponse.json(
        { error: 'Route ID and staff email are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify staff assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('staff_route_assignments')
      .select('id')
      .eq('route_id', routeId)
      .eq('staff_email', staffEmail.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (assignmentError || !assignment) {
      console.error('❌ Staff not assigned to route:', { routeId, staffEmail, assignmentError });
      return NextResponse.json(
        { error: 'Not authorized for this route' },
        { status: 403 }
      );
    }

    console.log('✅ Staff assignment verified');

    // Get all bookings for the route and date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        boarding_stop,
        seat_number,
        booking_reference,
        students (
          student_name,
          roll_number,
          email
        )
      `)
      .eq('route_id', routeId)
      .eq('trip_date', date)
      .in('status', ['confirmed', 'completed']);

    console.log(`📊 Found ${bookings?.length || 0} bookings for route ${routeId} on ${date}`);

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log('⚠️ No bookings found for route', routeId, 'on date', date);
      return NextResponse.json({
        success: true,
        date,
        routeId,
        stats: {
          total_bookings: 0,
          present: 0,
          absent: 0,
          not_marked: 0,
          attendance_rate: 0
        },
        students: [],
        byStop: {}
      });
    }

    console.log('📊 Booking details:', bookings.map(b => ({
      id: b.id,
      student_name: b.students?.student_name,
      email: b.students?.email,
      stop: b.boarding_stop
    })));

    // Get attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('booking_id, status, scanned_at, boarding_time, attendance_method')
      .eq('route_id', routeId)
      .eq('trip_date', date);

    console.log(`📊 Found ${attendance?.length || 0} attendance records`);

    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance', details: attendanceError.message },
        { status: 500 }
      );
    }

    // Create attendance map
    const attendanceMap = new Map();
    attendance?.forEach(a => {
      attendanceMap.set(a.booking_id, a);
    });

    // Combine bookings with attendance
    const studentsWithAttendance = bookings.map(booking => {
      const att = attendanceMap.get(booking.id);
      return {
        booking_id: booking.id,
        student_id: booking.student_id,
        student_name: booking.students?.student_name,
        roll_number: booking.students?.roll_number,
        email: booking.students?.email,
        boarding_stop: booking.boarding_stop,
        seat_number: booking.seat_number,
        booking_reference: booking.booking_reference,
        attendance_status: att?.status || 'not_marked',
        scanned_at: att?.scanned_at,
        boarding_time: att?.boarding_time,
        attendance_method: att?.attendance_method
      };
    });

    // Calculate statistics
    const stats = {
      total_bookings: bookings.length,
      present: studentsWithAttendance.filter(s => s.attendance_status === 'present').length,
      absent: studentsWithAttendance.filter(s => s.attendance_status === 'absent').length,
      not_marked: studentsWithAttendance.filter(s => s.attendance_status === 'not_marked').length,
      attendance_rate: bookings.length > 0
        ? Math.round((studentsWithAttendance.filter(s => s.attendance_status === 'present').length / bookings.length) * 100)
        : 0
    };

    // Group by stop
    const byStop: Record<string, any> = {};
    studentsWithAttendance.forEach(student => {
      const stop = student.boarding_stop || 'Unknown';
      if (!byStop[stop]) {
        byStop[stop] = {
          total: 0,
          present: 0,
          absent: 0,
          not_marked: 0,
          students: []
        };
      }
      byStop[stop].total++;
      if (student.attendance_status === 'present') byStop[stop].present++;
      if (student.attendance_status === 'absent') byStop[stop].absent++;
      if (student.attendance_status === 'not_marked') byStop[stop].not_marked++;
      byStop[stop].students.push(student);
    });

    return NextResponse.json({
      success: true,
      date,
      routeId,
      stats,
      students: studentsWithAttendance,
      byStop
    });

  } catch (error: any) {
    console.error('❌ Attendance overview error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
