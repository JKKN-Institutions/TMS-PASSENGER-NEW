import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { canBookTrip } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, studentId } = await request.json();

    if (!bookingId || !studentId) {
      return NextResponse.json({ 
        error: 'Booking ID and Student ID are required' 
      }, { status: 400 });
    }

    const supabase = createClient();

    // First, get the booking details to check if cancellation is allowed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        schedule_id,
        status,
        created_at,
        schedules (
          id,
          schedule_date,
          departure_time,
          route_id
        )
      `)
      .eq('id', bookingId)
      .eq('student_id', studentId)
      .eq('status', 'confirmed')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found or already cancelled' 
      }, { status: 404 });
    }

    // Check if the booking can be cancelled (same 7pm cutoff rule as booking)
    const tripDate = new Date(booking.schedules.schedule_date);
    const cancellationCheck = await canBookTrip(tripDate);

    if (!cancellationCheck.canBook) {
      return NextResponse.json({
        success: false,
        error: 'Cancellation deadline has passed',
        reason: cancellationCheck.reason,
        bookingWindow: cancellationCheck.bookingWindow
      }, { status: 400 });
    }

    // Cancel the booking by updating its status
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'cancelled_by_student'
      })
      .eq('id', bookingId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      return NextResponse.json({ 
        error: 'Failed to cancel booking' 
      }, { status: 500 });
    }

    // Log the cancellation action
    try {
      await supabase
        .from('booking_actions_log')
        .insert({
          booking_id: bookingId,
          student_id: studentId,
          action: 'cancelled',
          action_details: {
            cancelled_by: 'student',
            cancellation_reason: 'cancelled_by_student',
            cancelled_at: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Error logging cancellation:', logError);
      // Don't fail the cancellation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: cancelledBooking,
      cancellation_window: cancellationCheck.bookingWindow
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
