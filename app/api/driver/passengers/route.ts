import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const email = searchParams.get('email');
    const routeId = searchParams.get('routeId');

    console.log('📋 Driver passengers request:', { driverId, email, routeId });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId && !email) {
      return NextResponse.json({ error: 'driverId or email is required' }, { status: 400 });
    }

    let effectiveEmail = email;

    // If driverId is provided, try to find driver by id first
    if (driverId) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('email')
        .eq('id', driverId)
        .single();

      if (!driverError && driver) {
        effectiveEmail = driver.email;
        console.log('Found driver by ID:', driverId, 'Email:', effectiveEmail);
      }
    }

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Find routes assigned to this driver
    const { data: assignments, error: assignmentsError } = await supabase
      .from('driver_assignments')
      .select('route_id')
      .eq('driver_email', effectiveEmail.toLowerCase().trim())
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('❌ Driver route assignments fetch error:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch route assignments' }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      console.log('⚠️ No routes assigned to driver:', effectiveEmail);
      return NextResponse.json({ success: true, passengers: [], stats: { total: 0, active: 0, inactive: 0 } });
    }

    // Get route IDs
    const routeIds = routeId
      ? [routeId]
      : assignments.map(a => a.route_id);

    console.log('📊 Fetching passengers for routes:', routeIds);

    // Get all students who have bookings on these routes
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        route_id,
        boarding_stop,
        status,
        created_at,
        students (
          id,
          student_name,
          roll_number,
          email,
          phone,
          department,
          year,
          section,
          profile_image
        ),
        routes (
          id,
          route_number,
          route_name,
          start_location,
          end_location
        )
      `)
      .in('route_id', routeIds)
      .in('status', ['confirmed', 'completed'])
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('❌ Error fetching passenger bookings:', bookingsError);
      return NextResponse.json({
        error: 'Failed to fetch passengers',
        details: bookingsError.message
      }, { status: 500 });
    }

    // Create a unique list of passengers with their route info
    const passengersMap = new Map();

    bookings?.forEach((booking: any) => {
      const studentId = booking.student_id;

      if (!passengersMap.has(studentId)) {
        passengersMap.set(studentId, {
          student_id: studentId,
          student_name: booking.students?.student_name,
          roll_number: booking.students?.roll_number,
          email: booking.students?.email,
          phone: booking.students?.phone,
          department: booking.students?.department,
          year: booking.students?.year,
          section: booking.students?.section,
          profile_image: booking.students?.profile_image,
          routes: [],
          boarding_stops: new Set(),
          total_bookings: 0,
          latest_booking_date: booking.created_at
        });
      }

      const passenger = passengersMap.get(studentId);

      // Add route info if not already added
      const routeExists = passenger.routes.find((r: any) => r.route_id === booking.route_id);
      if (!routeExists) {
        passenger.routes.push({
          route_id: booking.route_id,
          route_number: booking.routes?.route_number,
          route_name: booking.routes?.route_name,
          start_location: booking.routes?.start_location,
          end_location: booking.routes?.end_location
        });
      }

      // Add boarding stop
      if (booking.boarding_stop) {
        passenger.boarding_stops.add(booking.boarding_stop);
      }

      passenger.total_bookings++;
    });

    // Convert to array and format boarding stops
    const passengers = Array.from(passengersMap.values()).map((p: any) => ({
      ...p,
      boarding_stops: Array.from(p.boarding_stops),
      route_count: p.routes.length
    }));

    // Sort by student name
    passengers.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));

    // Calculate statistics
    const stats = {
      total: passengers.length,
      active: passengers.filter(p => p.total_bookings > 0).length,
      routes_count: routeIds.length,
      total_bookings: bookings?.length || 0
    };

    console.log(`✅ Found ${passengers.length} unique passengers across ${routeIds.length} routes`);

    return NextResponse.json({
      success: true,
      passengers,
      stats,
      routeIds
    });
  } catch (error) {
    console.error('❌ Driver passengers API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
