import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch assigned routes for a staff member and passengers on those routes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const staffEmail = searchParams.get('email');

    if (!staffEmail) {
      return NextResponse.json({
        success: false,
        error: 'Staff email is required'
      }, { status: 400 });
    }

    // Fetch assigned routes for the staff member by email directly
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_route_assignments')
      .select(`
        id,
        route_id,
        assigned_at,
        notes,
        routes (
          id,
          route_number,
          route_name,
          start_location,
          end_location,
          start_latitude,
          start_longitude,
          end_latitude,
          end_longitude,
          departure_time,
          arrival_time,
          distance,
          duration,
          total_capacity,
          current_passengers,
          status,
          fare,
          driver_id,
          vehicle_id
        )
      `)
      .eq('staff_email', staffEmail.toLowerCase().trim())
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching staff route assignments:', assignmentsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch assigned routes'
      }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No routes assigned to this staff member',
        assignments: [],
        routesWithPassengers: []
      });
    }

    // Extract route IDs
    const routeIds = assignments.map(a => a.route_id);

    // Fetch passengers for each route along with their boarding stops
    const { data: routeAllocations, error: allocationsError } = await supabase
      .from('student_route_allocations')
      .select(`
        id,
        student_id,
        route_id,
        allocated_at,
        boarding_stop_id,
        students (
          id,
          student_name,
          roll_number,
          email,
          mobile,
          department_id,
          program_id,
          academic_year,
          semester,
          departments (
            id,
            department_name
          ),
          programs (
            id,
            program_name,
            degree_name
          )
        ),
        route_stops (
          id,
          stop_name,
          stop_time,
          sequence_order,
          latitude,
          longitude,
          is_major_stop
        )
      `)
      .in('route_id', routeIds)
      .eq('is_active', true)
      .order('route_id', { ascending: true });

    if (allocationsError) {
      console.error('Error fetching route allocations:', allocationsError);
      // Continue without passenger data rather than failing completely
    }

    // Fetch driver information for assigned routes
    const driverIds = assignments
      .map(a => a.routes?.driver_id)
      .filter(id => id != null);

    let driversMap: Record<string, any> = {};
    if (driverIds.length > 0) {
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, name, phone, license_number, status, rating')
        .in('id', driverIds);

      if (!driversError && drivers) {
        driversMap = drivers.reduce((acc, driver) => {
          acc[driver.id] = driver;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Fetch vehicle information for assigned routes
    const vehicleIds = assignments
      .map(a => a.routes?.vehicle_id)
      .filter(id => id != null);

    let vehiclesMap: Record<string, any> = {};
    if (vehicleIds.length > 0) {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, model, capacity, fuel_type, status')
        .in('id', vehicleIds);

      if (!vehiclesError && vehicles) {
        vehiclesMap = vehicles.reduce((acc, vehicle) => {
          acc[vehicle.id] = vehicle;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Group passengers by route
    const passengersByRoute: Record<string, any[]> = {};
    if (routeAllocations) {
      routeAllocations.forEach(allocation => {
        if (!passengersByRoute[allocation.route_id]) {
          passengersByRoute[allocation.route_id] = [];
        }
        passengersByRoute[allocation.route_id].push({
          allocationId: allocation.id,
          student: allocation.students,
          boardingStop: allocation.route_stops,
          allocatedAt: allocation.allocated_at
        });
      });
    }

    // Combine route assignments with passenger data
    const routesWithPassengers = assignments.map(assignment => ({
      assignmentId: assignment.id,
      assignedAt: assignment.assigned_at,
      notes: assignment.notes,
      route: {
        ...assignment.routes,
        driver: assignment.routes?.driver_id ? driversMap[assignment.routes.driver_id] : null,
        vehicle: assignment.routes?.vehicle_id ? vehiclesMap[assignment.routes.vehicle_id] : null
      },
      passengers: passengersByRoute[assignment.route_id] || [],
      passengerCount: (passengersByRoute[assignment.route_id] || []).length
    }));

    return NextResponse.json({
      success: true,
      assignments,
      routesWithPassengers,
      totalRoutes: routesWithPassengers.length,
      totalPassengers: Object.values(passengersByRoute).flat().length
    });

  } catch (error) {
    console.error('Error in staff assigned routes API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
