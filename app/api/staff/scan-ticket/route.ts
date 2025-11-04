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

    // First, validate the ticket using our database function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_ticket', {
      p_qr_code: ticketCode
    });

    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate ticket' },
        { status: 500 }
      );
    }

    const validation = typeof validationResult === 'string' ? JSON.parse(validationResult) : validationResult;

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.message || 'Invalid ticket' },
        { status: 400 }
      );
    }

    const booking = {
      id: validation.booking.id,
      student_id: validation.student.id,
      route_id: validation.route.id,
      trip_date: validation.booking.trip_date,
      boarding_stop: validation.booking.boarding_stop,
      qr_code: ticketCode,
      seat_number: validation.booking.seat_number,
      students: validation.student,
      routes: validation.route
    };

    // Check if already marked (validation returns this info)
    if (validation.already_marked) {
      // Fetch the existing attendance record
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select(`
          id,
          boarding_time,
          boarding_stop,
          status,
          marked_by
        `)
        .eq('student_id', booking.student_id)
        .eq('attendance_date', booking.trip_date)
        .eq('route_id', booking.route_id)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Ticket already scanned',
        attendance: {
          id: existingAttendance?.id,
          student_name: booking.students?.name,
          roll_number: booking.students?.roll_number,
          route_number: booking.routes?.route_number,
          route_name: booking.routes?.route_name,
          boarding_stop: existingAttendance?.boarding_stop,
          scanned_at: existingAttendance?.boarding_time,
          scanned_by: existingAttendance?.marked_by,
          status: existingAttendance?.status,
        },
        alreadyScanned: true,
      });
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

    // Get staff ID for marking attendance
    const { data: staffData } = await supabase
      .from('staff')
      .select('id')
      .eq('email', staffEmail.toLowerCase())
      .single();

    // Use the database function to mark attendance
    const { data: markResult, error: markError } = await supabase.rpc('mark_student_attendance', {
      p_qr_code: ticketCode,
      p_staff_id: staffData?.id || null,
      p_scan_location: scanLocation ? {
        lat: scanLocation.lat,
        lng: scanLocation.lng,
        accuracy: scanLocation.accuracy,
        timestamp: new Date().toISOString()
      } : null,
      p_marker_email: staffEmail || null
    });

    if (markError) {
      console.error('❌ Error marking attendance:', markError);
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      );
    }

    const result = typeof markResult === 'string' ? JSON.parse(markResult) : markResult;

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    // Get staff information from admin_users
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('name, email')
      .eq('email', staffEmail.toLowerCase())
      .single();

    // Update attendance record with staff information
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        marked_by_staff_email: staffEmail,
        marked_by_staff_name: adminUser?.name || staffEmail.split('@')[0]
      })
      .eq('id', result.attendance_id);

    if (updateError) {
      console.error('⚠️ Warning: Could not update staff info:', updateError);
    }

    // Fetch the complete attendance record
    const { data: attendanceRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', result.attendance_id)
      .single();

    console.log('✅ Attendance recorded successfully:', {
      bookingId: booking.id,
      studentName: booking.students?.name,
      ticketCode,
      scannedBy: adminUser?.name || staffEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance: {
        id: attendanceRecord?.id,
        student_name: booking.students?.name,
        roll_number: booking.students?.roll_number,
        student_email: booking.students?.email,
        student_phone: booking.students?.mobile,
        route_number: booking.routes?.route_number,
        route_name: booking.routes?.route_name,
        boarding_stop: booking.boarding_stop,
        seat_number: booking.seat_number,
        trip_date: booking.trip_date,
        scanned_at: attendanceRecord?.boarding_time,
        scanned_by: staffEmail,
        status: attendanceRecord?.status || 'present',
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
