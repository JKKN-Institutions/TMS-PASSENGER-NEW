import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, staffId, staffEmail, location } = body;

    // Validate required fields
    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: 'QR_CODE_REQUIRED',
        message: 'QR code is required'
      }, { status: 400 });
    }

    if (!staffId && !staffEmail) {
      return NextResponse.json({
        success: false,
        error: 'STAFF_INFO_REQUIRED',
        message: 'Staff ID or email is required'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'SERVER_CONFIG_ERROR',
        message: 'Server configuration error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve staff ID if only email is provided
    let resolvedStaffId = staffId;
    if (!resolvedStaffId && staffEmail) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('email', staffEmail.toLowerCase())
        .single();

      if (staffData) {
        resolvedStaffId = staffData.id;
      } else {
        // If no staff record found, use the auth user ID as fallback
        // This allows staff members who are in auth but not in staff table to mark attendance
        console.log('Staff not found in staff table, will use auth user ID');
      }
    }

    // Prepare location data if provided
    const scanLocation = location ? {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString()
    } : null;

    // Call the database function to mark attendance
    const { data, error } = await supabase.rpc('mark_student_attendance', {
      p_qr_code: qrCode,
      p_staff_id: resolvedStaffId || null,
      p_scan_location: scanLocation,
      p_marker_email: staffEmail || null
    });

    if (error) {
      console.error('Mark attendance error:', error);
      return NextResponse.json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to mark attendance',
        details: error.message
      }, { status: 500 });
    }

    // Parse the JSONB result
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      // Return appropriate status code based on error type
      const statusCode = result.error === 'ALREADY_MARKED' ? 409 : 400;

      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message,
        ticketDate: result.ticket_date,
        currentDate: result.current_date
      }, { status: statusCode });
    }

    // Fetch complete attendance details for response
    const { data: attendanceDetails } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        route_id,
        attendance_date,
        boarding_time,
        boarding_stop,
        status,
        students (
          student_name,
          roll_number,
          email,
          mobile
        ),
        routes (
          route_number,
          route_name,
          start_location,
          end_location
        )
      `)
      .eq('id', result.attendance_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: {
        id: result.attendance_id,
        studentId: result.student_id,
        routeId: result.route_id,
        boardingTime: result.boarding_time,
        ...attendanceDetails
      }
    });

  } catch (error) {
    console.error('Mark attendance API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: message
    }, { status: 500 });
  }
}
