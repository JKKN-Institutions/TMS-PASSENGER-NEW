import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const routeNumber = searchParams.get('routeNumber');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!routeId && !routeNumber) {
      return NextResponse.json({ error: 'routeId or routeNumber is required' }, { status: 400 });
    }

    let resolvedRouteId = routeId;

    // If routeNumber is provided, resolve it to routeId
    if (!resolvedRouteId && routeNumber) {
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('route_number', routeNumber)
        .single();

      if (routeError || !route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      resolvedRouteId = route.id;
    }

    if (!resolvedRouteId) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    console.log('📋 Fetching bookings with params:', {
      resolvedRouteId,
      date,
      statuses: ['confirmed', 'completed']
    });

    // Fetch bookings for the route and date
    const { data: bookings, error } = await supabase
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
        payment_status,
        amount,
        booking_reference,
        verified_at,
        verified_by,
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
        schedules (
          departure_time,
          arrival_time,
          estimated_duration
        )
      `)
      .eq('route_id', resolvedRouteId)
      .eq('trip_date', date)
      .in('status', ['confirmed', 'completed'])
      .order('boarding_stop', { ascending: true });

    if (error) {
      console.error('❌ Staff bookings fetch error:', error);
      console.error('Query params:', { resolvedRouteId, date });
      return NextResponse.json({
        error: 'Failed to fetch bookings',
        details: error.message,
        params: { resolvedRouteId, date }
      }, { status: 500 });
    }

    console.log(`✅ Found ${bookings?.length || 0} bookings for route ${resolvedRouteId} on ${date}`);
    if (bookings && bookings.length > 0) {
      console.log('📊 Student emails:', bookings.map((b: any) => b.students?.email).filter(Boolean));
    }

    // Group bookings by stop
    const stopWise: Record<string, any[]> = {};
    (bookings || []).forEach((booking: any) => {
      const stop = booking.boarding_stop || 'Unknown Stop';
      if (!stopWise[stop]) {
        stopWise[stop] = [];
      }
      stopWise[stop].push(booking);
    });

    console.log('Bookings found for route:', resolvedRouteId, 'Date:', date, 'Count:', bookings?.length || 0);
    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      stopWise,
      date,
      routeId: resolvedRouteId
    });
  } catch (error) {
    console.error('Staff bookings API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
