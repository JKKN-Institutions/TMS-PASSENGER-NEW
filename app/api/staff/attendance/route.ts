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
        student_id,
        route_id,
        schedule_id,
        attendance_date,
        boarding_time,
        alighting_time,
        status,
        marked_by,
        created_at,
        students (
          student_name,
          roll_number,
          email,
          mobile
        ),
        routes (
          route_number,
          route_name,
          start_location,
          end_location
        )
      `)
      .eq('attendance_date', date)
      .order('created_at', { ascending: false });

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
    };

    // Group by route
    attendance?.forEach(a => {
      const route = Array.isArray(a.routes) ? a.routes[0] : a.routes;
      const routeKey = route?.route_number || 'Unknown';
      stats.byRoute[routeKey] = (stats.byRoute[routeKey] || 0) + 1;
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
