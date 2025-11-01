import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode) {
      return NextResponse.json({
        error: 'QR code is required'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to validate ticket
    const { data, error } = await supabase.rpc('validate_ticket', {
      p_qr_code: qrCode
    });

    if (error) {
      console.error('Ticket validation error:', error);
      return NextResponse.json({
        error: 'Failed to validate ticket',
        details: error.message
      }, { status: 500 });
    }

    // Parse the JSONB result
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
        message: result.message,
        ticketDate: result.ticket_date,
        currentDate: result.current_date,
        status: result.status
      }, { status: 200 });
    }

    // Return validation result with booking and student details
    return NextResponse.json({
      valid: true,
      alreadyMarked: result.already_marked,
      booking: result.booking,
      student: result.student,
      route: result.route,
      message: result.already_marked
        ? 'Attendance already marked for this student today'
        : 'Ticket is valid and ready for attendance marking'
    });

  } catch (error) {
    console.error('Validate ticket API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal server error',
      details: message
    }, { status: 500 });
  }
}
