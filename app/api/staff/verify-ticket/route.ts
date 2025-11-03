import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ticketCode, staffEmail } = await request.json();

    console.log('🎫 Ticket verification request:', { ticketCode, staffEmail });

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'Ticket code is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find booking by QR code
    console.log('🔍 Looking for booking with QR code:', ticketCode);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        route_id,
        schedule_id,
        trip_date,
        boarding_stop,
        seat_number,
        status,
        qr_code,
        payment_status,
        students!inner (
          id,
          student_name,
          email,
          mobile
        ),
        routes!inner (
          id,
          route_number,
          route_name
        ),
        schedules (
          departure_time,
          arrival_time
        )
      `)
      .eq('qr_code', ticketCode)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Invalid ticket code. Booking not found.' },
        { status: 404 }
      );
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      student: booking.students,
      route: booking.routes
    });

    // Handle students/routes if they're arrays (PostgREST behavior)
    const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
    const route = Array.isArray(booking.routes) ? booking.routes[0] : booking.routes;
    const schedule = Array.isArray(booking.schedules) ? booking.schedules[0] : booking.schedules;

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          error: `Ticket is ${booking.status}. Only confirmed tickets can be verified.`
        },
        { status: 400 }
      );
    }

    // Check if already marked attendance
    const { data: existingAttendance, error: attendanceCheckError } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('attendance_date', booking.trip_date)
      .single();

    if (existingAttendance) {
      console.log('⚠️ Attendance already marked:', existingAttendance);
      return NextResponse.json({
        success: true,
        message: 'Attendance already marked',
        booking: {
          id: booking.id,
          passenger_name: student?.student_name,
          route_name: route?.route_name,
          route_number: route?.route_number,
          boarding_stop: booking.boarding_stop,
          trip_date: booking.trip_date,
          scanned_at: existingAttendance.boarding_time || existingAttendance.created_at,
          scanned_by: existingAttendance.marked_by_email,
        },
        alreadyVerified: true,
      });
    }

    // Get staff email from request body or headers
    const verifyingStaffEmail = staffEmail || request.headers.get('x-staff-email') || 'staff@system';

    // Create attendance record
    console.log('📝 Creating attendance record...');

    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        booking_id: booking.id,
        student_id: booking.student_id,
        route_id: booking.route_id,
        schedule_id: booking.schedule_id,
        attendance_date: booking.trip_date,
        boarding_stop: booking.boarding_stop,
        boarding_time: new Date().toISOString(),
        status: 'present',
        marked_by_email: verifyingStaffEmail,
        qr_code: ticketCode,
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('❌ Error creating attendance record:', attendanceError);
      return NextResponse.json(
        { success: false, error: 'Failed to mark attendance: ' + attendanceError.message },
        { status: 500 }
      );
    }

    console.log('✅ Attendance marked successfully:', {
      bookingId: booking.id,
      studentName: student?.student_name,
      ticketCode,
      scannedBy: verifyingStaffEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      booking: {
        id: booking.id,
        passenger_name: student?.student_name,
        passenger_email: student?.email,
        passenger_phone: student?.mobile,
        boarding_stop: booking.boarding_stop,
        route_name: route?.route_name,
        route_number: route?.route_number,
        departure_time: schedule?.departure_time,
        trip_date: booking.trip_date,
        scanned_at: attendanceRecord.boarding_time || attendanceRecord.created_at,
        scanned_by: attendanceRecord.marked_by_email,
        seat_number: booking.seat_number,
        payment_status: booking.payment_status,
      },
    });

  } catch (error: any) {
    console.error('❌ Ticket verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
