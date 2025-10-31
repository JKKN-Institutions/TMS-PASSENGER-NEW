import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const staffEmail = searchParams.get('staffEmail');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!staffEmail) {
      return NextResponse.json({ error: 'Staff email is required' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        id,
        booking_id,
        student_id,
        route_id,
        schedule_id,
        trip_date,
        boarding_stop,
        status,
        scanned_at,
        scanned_by,
        scan_location,
        qr_code,
        booking_reference,
        notes,
        students (
          student_name,
          roll_number,
          email,
          phone
        ),
        routes (
          route_number,
          route_name,
          start_location,
          end_location
        ),
        bookings (
          seat_number,
          payment_status
        )
      `)
      .eq('trip_date', date)
      .order('scanned_at', { ascending: false });

    // Filter by route if specified
    if (routeId) {
      query = query.eq('route_id', routeId);
    } else {
      // If no route specified, only show routes assigned to this staff member
      const { data: assignments } = await supabase
        .from('staff_route_assignments')
        .select('route_id')
        .eq('staff_email', staffEmail.toLowerCase().trim())
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) {
        return NextResponse.json({ success: true, attendance: [], stats: {} });
      }

      const routeIds = assignments.map(a => a.route_id);
      query = query.in('route_id', routeIds);
    }

    const { data: attendance, error } = await query;

    if (error) {
      console.error('Attendance fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: attendance?.length || 0,
      present: attendance?.filter(a => a.status === 'present').length || 0,
      absent: attendance?.filter(a => a.status === 'absent').length || 0,
      cancelled: attendance?.filter(a => a.status === 'cancelled').length || 0,
      byRoute: {} as Record<string, number>,
      byStop: {} as Record<string, number>,
    };

    // Group by route
    attendance?.forEach(a => {
      const routeKey = a.routes?.route_number || 'Unknown';
      stats.byRoute[routeKey] = (stats.byRoute[routeKey] || 0) + 1;
    });

    // Group by stop
    attendance?.forEach(a => {
      const stopKey = a.boarding_stop || 'Unknown';
      stats.byStop[stopKey] = (stats.byStop[stopKey] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      attendance: attendance || [],
      stats,
      date,
      routeId
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
