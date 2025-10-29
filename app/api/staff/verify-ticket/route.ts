import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ticketCode } = await request.json();

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'Ticket code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find booking by ticket code
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        verified_at,
        verified_by,
        passenger_name,
        passenger_email,
        passenger_phone,
        pickup_point,
        route:routes(
          id,
          route_number,
          route_name,
          departure_time
        )
      `)
      .eq('booking_reference', ticketCode)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Invalid ticket code. Booking not found.' },
        { status: 404 }
      );
    }

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

    // Check if already verified
    if (booking.verified_at) {
      return NextResponse.json({
        success: true,
        message: 'Ticket already verified',
        booking: {
          id: booking.id,
          passenger_name: booking.passenger_name,
          route_name: booking.route?.route_name,
          route_number: booking.route?.route_number,
          verified_at: booking.verified_at,
          verified_by: booking.verified_by,
        },
        alreadyVerified: true,
      });
    }

    // Get staff information from session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      );
    }

    // Update booking to mark as verified
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        verified_at: new Date().toISOString(),
        verified_by: user.email,
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify ticket' },
        { status: 500 }
      );
    }

    console.log('✅ Ticket verified successfully:', {
      bookingId: booking.id,
      ticketCode,
      verifiedBy: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket verified successfully',
      booking: {
        id: updatedBooking.id,
        passenger_name: booking.passenger_name,
        passenger_email: booking.passenger_email,
        passenger_phone: booking.passenger_phone,
        pickup_point: booking.pickup_point,
        route_name: booking.route?.route_name,
        route_number: booking.route?.route_number,
        departure_time: booking.route?.departure_time,
        verified_at: updatedBooking.verified_at,
        verified_by: updatedBooking.verified_by,
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
