import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { action, routeId, date, staffEmail, bookingIds } = await request.json();

    if (!action || !routeId || !date || !staffEmail) {
      return NextResponse.json(
        { success: false, error: 'Action, route ID, date, and staff email are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify staff is assigned to this route
    const { data: assignment } = await supabase
      .from('staff_route_assignments')
      .select('id')
      .eq('route_id', routeId)
      .eq('staff_email', staffEmail.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this route' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'mark_all_absent':
        // Mark all unscanned bookings as absent
        result = await markAllAbsent(supabase, routeId, date, staffEmail);
        break;

      case 'mark_selected_present':
        // Mark selected bookings as present
        if (!bookingIds || !Array.isArray(bookingIds)) {
          return NextResponse.json(
            { success: false, error: 'Booking IDs array is required for this action' },
            { status: 400 }
          );
        }
        result = await markSelectedPresent(supabase, bookingIds, date, staffEmail);
        break;

      case 'mark_selected_absent':
        // Mark selected bookings as absent
        if (!bookingIds || !Array.isArray(bookingIds)) {
          return NextResponse.json(
            { success: false, error: 'Booking IDs array is required for this action' },
            { status: 400 }
          );
        }
        result = await markSelectedAbsent(supabase, bookingIds, date, staffEmail);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: mark_all_absent, mark_selected_present, or mark_selected_absent' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Bulk mark attendance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function markAllAbsent(supabase: any, routeId: string, date: string, staffEmail: string) {
  // Get all bookings that don't have attendance records
  const { data: bookings, error: bookingsError } = await supabase
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
      students (student_name, roll_number)
    `)
    .eq('route_id', routeId)
    .eq('trip_date', date)
    .in('status', ['confirmed', 'completed']);

  if (bookingsError) {
    throw new Error('Failed to fetch bookings');
  }

  // Filter out bookings that already have attendance
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('booking_id')
    .eq('trip_date', date)
    .in('booking_id', bookings.map((b: any) => b.id));

  const existingBookingIds = new Set(existingAttendance?.map((a: any) => a.booking_id) || []);
  const bookingsToMark = bookings.filter((b: any) => !existingBookingIds.has(b.id));

  if (bookingsToMark.length === 0) {
    return {
      success: true,
      message: 'All students already have attendance marked',
      marked_count: 0
    };
  }

  // Create attendance records for absent students
  const attendanceRecords = bookingsToMark.map((booking: any) => ({
    booking_id: booking.id,
    student_id: booking.student_id,
    route_id: booking.route_id,
    schedule_id: booking.schedule_id,
    trip_date: booking.trip_date,
    boarding_stop: booking.boarding_stop,
    status: 'absent',
    scanned_by: staffEmail,
    marked_absent_at: new Date().toISOString(),
    marked_absent_by: staffEmail,
    qr_code: booking.qr_code,
    booking_reference: booking.booking_reference,
    attendance_method: 'bulk_mark',
    notes: 'Auto-marked absent - no scan recorded'
  }));

  const { data: created, error: createError } = await supabase
    .from('attendance')
    .insert(attendanceRecords)
    .select();

  if (createError) {
    console.error('Error creating absence records:', createError);
    throw new Error('Failed to mark absences');
  }

  console.log(`✅ Marked ${created.length} students as absent`);

  return {
    success: true,
    message: `Marked ${created.length} students as absent`,
    marked_count: created.length,
    students: bookingsToMark.map((b: any) => ({
      name: b.students?.student_name,
      roll_number: b.students?.roll_number
    }))
  };
}

async function markSelectedPresent(supabase: any, bookingIds: string[], date: string, staffEmail: string) {
  const results = [];
  const errors = [];

  for (const bookingId of bookingIds) {
    try {
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, students(student_name, roll_number)')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        errors.push({ bookingId, error: 'Booking not found' });
        continue;
      }

      // Check if attendance exists
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('trip_date', date)
        .single();

      if (existing) {
        // Update to present
        await supabase
          .from('attendance')
          .update({
            status: 'present',
            scanned_at: new Date().toISOString(),
            scanned_by: staffEmail,
            boarding_time: new Date().toISOString(),
            attendance_method: 'bulk_mark'
          })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('attendance')
          .insert({
            booking_id: bookingId,
            student_id: booking.student_id,
            route_id: booking.route_id,
            schedule_id: booking.schedule_id,
            trip_date: date,
            boarding_stop: booking.boarding_stop,
            status: 'present',
            scanned_at: new Date().toISOString(),
            scanned_by: staffEmail,
            boarding_time: new Date().toISOString(),
            booking_reference: booking.booking_reference,
            attendance_method: 'bulk_mark'
          });
      }

      results.push({
        bookingId,
        studentName: booking.students?.student_name,
        rollNumber: booking.students?.roll_number
      });
    } catch (err) {
      errors.push({ bookingId, error: String(err) });
    }
  }

  return {
    success: true,
    message: `Marked ${results.length} students as present`,
    marked_count: results.length,
    students: results,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function markSelectedAbsent(supabase: any, bookingIds: string[], date: string, staffEmail: string) {
  const results = [];
  const errors = [];

  for (const bookingId of bookingIds) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, students(student_name, roll_number)')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        errors.push({ bookingId, error: 'Booking not found' });
        continue;
      }

      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('trip_date', date)
        .single();

      if (existing) {
        await supabase
          .from('attendance')
          .update({
            status: 'absent',
            marked_absent_at: new Date().toISOString(),
            marked_absent_by: staffEmail,
            attendance_method: 'bulk_mark'
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('attendance')
          .insert({
            booking_id: bookingId,
            student_id: booking.student_id,
            route_id: booking.route_id,
            schedule_id: booking.schedule_id,
            trip_date: date,
            boarding_stop: booking.boarding_stop,
            status: 'absent',
            scanned_by: staffEmail,
            marked_absent_at: new Date().toISOString(),
            marked_absent_by: staffEmail,
            booking_reference: booking.booking_reference,
            attendance_method: 'bulk_mark'
          });
      }

      results.push({
        bookingId,
        studentName: booking.students?.student_name,
        rollNumber: booking.students?.roll_number
      });
    } catch (err) {
      errors.push({ bookingId, error: String(err) });
    }
  }

  return {
    success: true,
    message: `Marked ${results.length} students as absent`,
    marked_count: results.length,
    students: results,
    errors: errors.length > 0 ? errors : undefined
  };
}
