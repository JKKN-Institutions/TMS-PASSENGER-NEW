import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const email = searchParams.get('email');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!staffId && !email) {
      return NextResponse.json({ error: 'staffId or email is required' }, { status: 400 });
    }

    let effectiveEmail = email;

    // If staffId is provided, try to find staff by id first
    if (staffId) {
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('email')
        .eq('id', staffId)
        .single();

      if (!staffError && staffMember) {
        effectiveEmail = staffMember.email;
        console.log('Found staff by ID:', staffId, 'Email:', effectiveEmail);
      }
    }

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Find routes assigned to this staff member
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_route_assignments')
      .select('route_id')
      .eq('staff_email', effectiveEmail.toLowerCase().trim())
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('Staff route assignments fetch error:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch route assignments' }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      console.log('No routes assigned to staff:', effectiveEmail);
      return NextResponse.json({ success: true, routes: [] });
    }

    // Get route IDs
    const routeIds = assignments.map(a => a.route_id);

    // Fetch full route details with simplified query
    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        status,
        total_capacity,
        current_passengers,
        vehicle_id
      `)
      .in('id', routeIds)
      .order('route_number');

    if (error) {
      console.error('Staff routes fetch error:', error);
      console.error('Route IDs:', routeIds);
      console.error('Error details:', JSON.stringify(error));
      return NextResponse.json({
        error: 'Failed to fetch routes',
        details: error.message,
        routeIds: routeIds
      }, { status: 500 });
    }

    // Fetch vehicles separately if needed
    if (routes && routes.length > 0) {
      const vehicleIds = routes.map(r => r.vehicle_id).filter(Boolean);
      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id, registration_number, model, capacity')
          .in('id', vehicleIds);

        // Attach vehicles to routes
        if (vehicles) {
          const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
          routes.forEach(route => {
            if (route.vehicle_id) {
              route.vehicle = vehicleMap.get(route.vehicle_id);
            }
          });
        }
      }

      // Fetch route stops separately
      const { data: stops } = await supabase
        .from('route_stops')
        .select('*')
        .in('route_id', routeIds)
        .order('sequence_order');

      // Attach stops to routes
      if (stops) {
        const stopsByRoute = new Map();
        stops.forEach(stop => {
          if (!stopsByRoute.has(stop.route_id)) {
            stopsByRoute.set(stop.route_id, []);
          }
          stopsByRoute.get(stop.route_id).push(stop);
        });

        routes.forEach(route => {
          route.route_stops = stopsByRoute.get(route.id) || [];
        });
      }
    }

    console.log('Routes found for staff:', effectiveEmail, 'Count:', routes?.length || 0);
    return NextResponse.json({ success: true, routes: routes || [] });
  } catch (error) {
    console.error('Staff routes API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
