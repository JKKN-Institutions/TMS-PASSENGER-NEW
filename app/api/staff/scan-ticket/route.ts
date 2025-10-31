import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ticketCode, staffEmail, scanLocation } = await request.json();

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'Ticket code is required' },
        { status: 400 }
      );
    }

    if (!staffEmail) {
      return NextResponse.json(
        { success: false, error: 'Staff email is required' },
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

    // Find booking by booking_reference or qr_code
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        route_id,
        schedule_id,
        trip_date,
        boarding_stop,
        booking_reference,
        qr_code,
        seat_number,
        status,
        payment_status,
        verified_at,
        verified_by,
        students (
          id,
          student_name,
          roll_number,
          email,
          phone
        ),
        routes (
          id,
          route_number,
          route_name,
          start_location,
          end_location
        ),
        schedules (
          id,
          departure_time,
          arrival_time
        )
      `)
      .or(`booking_reference.eq.${ticketCode},qr_code.eq.${ticketCode}`)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Invalid ticket code. Booking not found.' },
        { status: 404 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `Ticket is ${booking.status}. Only confirmed tickets can be scanned.`
        },
        { status: 400 }
      );
    }

    // Check if staff is assigned to this route
    const { data: assignment } = await supabase
      .from('staff_route_assignments')
      .select('id')
      .eq('route_id', booking.route_id)
      .eq('staff_email', staffEmail.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not assigned to this route. Cannot scan this ticket.'
        },
        { status: 403 }
      );
    }

    // Check if attendance already exists for this booking and date
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('trip_date', booking.trip_date)
      .single();

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        message: 'Ticket already scanned',
        attendance: {
          id: existingAttendance.id,
          student_name: booking.students?.student_name,
          roll_number: booking.students?.roll_number,
          route_number: booking.routes?.route_number,
          route_name: booking.routes?.route_name,
          boarding_stop: existingAttendance.boarding_stop,
          scanned_at: existingAttendance.scanned_at,
          scanned_by: existingAttendance.scanned_by,
          status: existingAttendance.status,
        },
        alreadyScanned: true,
      });
    }

    // Create attendance record
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        booking_id: booking.id,
        student_id: booking.student_id,
        route_id: booking.route_id,
        schedule_id: booking.schedule_id,
        trip_date: booking.trip_date,
        boarding_stop: booking.boarding_stop,
        status: 'present',
        scanned_by: staffEmail,
        scan_location: scanLocation || null,
        qr_code: booking.qr_code,
        booking_reference: booking.booking_reference,
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('❌ Error creating attendance record:', attendanceError);
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      );
    }

    // Update booking to mark as verified (if not already verified)
    if (!booking.verified_at) {
      await supabase
        .from('bookings')
        .update({
          verified_at: new Date().toISOString(),
          verified_by: staffEmail,
        })
        .eq('id', booking.id);
    }

    console.log('✅ Attendance recorded successfully:', {
      bookingId: booking.id,
      studentName: booking.students?.student_name,
      ticketCode,
      scannedBy: staffEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance: {
        id: attendanceRecord.id,
        student_name: booking.students?.student_name,
        roll_number: booking.students?.roll_number,
        student_email: booking.students?.email,
        student_phone: booking.students?.phone,
        route_number: booking.routes?.route_number,
        route_name: booking.routes?.route_name,
        boarding_stop: booking.boarding_stop,
        seat_number: booking.seat_number,
        trip_date: booking.trip_date,
        departure_time: booking.schedules?.departure_time,
        scanned_at: attendanceRecord.scanned_at,
        scanned_by: attendanceRecord.scanned_by,
        status: attendanceRecord.status,
      },
    });

  } catch (error: any) {
    console.error('❌ Ticket scan error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
