import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, status, staffEmail, notes } = await request.json();

    if (!bookingId || !status || !staffEmail) {
      return NextResponse.json(
        { success: false, error: 'Booking ID, status, and staff email are required' },
        { status: 400 }
      );
    }

    if (!['present', 'absent'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "present" or "absent"' },
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

    // Get booking details
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
        status as booking_status,
        students (
          student_name,
          roll_number,
          email
        ),
        routes (
          route_number,
          route_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify staff is assigned to this route
    const { data: assignment } = await supabase
      .from('staff_route_assignments')
      .select('id')
      .eq('route_id', booking.route_id)
      .eq('staff_email', staffEmail.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this route' },
        { status: 403 }
      );
    }

    // Check if attendance record exists
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('trip_date', booking.trip_date)
      .single();

    let result;

    if (existingAttendance) {
      // Update existing attendance
      const updateData: any = {
        status,
        attendance_method: 'manual_entry',
        notes: notes || existingAttendance.notes
      };

      if (status === 'present') {
        updateData.scanned_at = new Date().toISOString();
        updateData.scanned_by = staffEmail;
        updateData.boarding_time = new Date().toISOString();
      } else {
        updateData.marked_absent_at = new Date().toISOString();
        updateData.marked_absent_by = staffEmail;
      }

      const { data: updated, error: updateError } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('id', existingAttendance.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating attendance:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update attendance' },
          { status: 500 }
        );
      }

      result = updated;
    } else {
      // Create new attendance record
      const insertData: any = {
        booking_id: bookingId,
        student_id: booking.student_id,
        route_id: booking.route_id,
        schedule_id: booking.schedule_id,
        trip_date: booking.trip_date,
        boarding_stop: booking.boarding_stop,
        status,
        booking_reference: booking.booking_reference,
        attendance_method: 'manual_entry',
        notes: notes || null
      };

      if (status === 'present') {
        insertData.scanned_at = new Date().toISOString();
        insertData.scanned_by = staffEmail;
        insertData.boarding_time = new Date().toISOString();
      } else {
        insertData.marked_absent_at = new Date().toISOString();
        insertData.marked_absent_by = staffEmail;
        insertData.scanned_by = staffEmail; // Required field
      }

      const { data: created, error: createError } = await supabase
        .from('attendance')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating attendance:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create attendance record' },
          { status: 500 }
        );
      }

      result = created;
    }

    console.log(`✅ Marked ${status}:`, {
      bookingId,
      studentName: booking.students?.student_name,
      markedBy: staffEmail
    });

    return NextResponse.json({
      success: true,
      message: `Student marked as ${status}`,
      attendance: {
        id: result.id,
        status: result.status,
        student_name: booking.students?.student_name,
        roll_number: booking.students?.roll_number,
        route_number: booking.routes?.route_number,
        boarding_stop: booking.boarding_stop,
        marked_at: status === 'present' ? result.scanned_at : result.marked_absent_at,
        marked_by: status === 'present' ? result.scanned_by : result.marked_absent_by
      }
    });

  } catch (error: any) {
    console.error('❌ Mark presence error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
