import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Check scheduler status and monitoring
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const detailed = searchParams.get('detailed') === 'true';

    console.log('📊 Checking scheduler status for:', date);

    // Get today's scheduler runs
    const { data: schedulerRuns, error: runsError } = await supabase
      .from('scheduler_runs')
      .select('*')
      .eq('scheduler_type', 'booking_reminders')
      .eq('run_date', date)
      .order('time_slot', { ascending: true });

    if (runsError) {
      console.error('Error fetching scheduler runs:', runsError);
      return NextResponse.json({ error: 'Failed to fetch scheduler status' }, { status: 500 });
    }

    // Get overall statistics if detailed view requested
    let statistics = null;
    if (detailed) {
      const { data: stats, error: statsError } = await supabase
        .from('scheduler_runs')
        .select('*')
        .eq('scheduler_type', 'booking_reminders')
        .gte('run_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 7 days
        .order('run_date', { ascending: false });

      if (!statsError && stats) {
        statistics = {
          totalRuns: stats.length,
          successfulRuns: stats.filter(r => r.status === 'completed').length,
          failedRuns: stats.filter(r => r.status === 'failed').length,
          totalNotificationsSent: stats.reduce((sum, r) => sum + (r.result_summary?.notificationsSent || 0), 0),
          avgResponseTime: calculateAverageResponseTime(stats)
        };
      }
    }

    // Format the response
    const timeSlots = ['17:00', '18:00'];
    const status = timeSlots.map(slot => {
      const run = schedulerRuns?.find(r => r.time_slot === slot);
      return {
        timeSlot: slot,
        status: run?.status || 'not_run',
        lastRun: run?.completed_at,
        startedAt: run?.started_at,
        notificationsSent: run?.result_summary?.notificationsSent || 0,
        notificationsFailed: run?.result_summary?.notificationsFailed || 0,
        error: run?.error_details,
        dryRun: run?.dry_run || false
      };
    });

    // Check if scheduler should run for each time slot
    const currentHour = new Date().getHours();
    const recommendations = {
      shouldRun5PM: currentHour >= 17 && !schedulerRuns?.find(r => r.time_slot === '17:00' && r.status === 'completed'),
      shouldRun6PM: currentHour >= 18 && !schedulerRuns?.find(r => r.time_slot === '18:00' && r.status === 'completed'),
      nextScheduledRun: getNextScheduledRun(currentHour)
    };

    return NextResponse.json({
      date,
      status,
      recommendations,
      statistics,
      summary: {
        totalRuns: schedulerRuns?.length || 0,
        completedRuns: schedulerRuns?.filter(r => r.status === 'completed').length || 0,
        totalNotificationsSent: schedulerRuns?.reduce((sum, r) => sum + (r.result_summary?.notificationsSent || 0), 0) || 0
      }
    });

  } catch (error) {
    console.error('Error in scheduler status API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, 
      timeSlot = '17:00',
      schedulerKey,
      dryRun = true,
      force = false 
    } = body;

    if (action === 'test') {
      // Verify scheduler key for security
      if (schedulerKey !== process.env.SCHEDULER_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.log(`🧪 Testing scheduler for time slot: ${timeSlot}`);

      // Call the daily scheduler API
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/daily-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedulerKey,
          timeSlot,
          dryRun: true,
          force: true
        })
      });

      if (!testResponse.ok) {
        throw new Error(`Test failed: ${testResponse.status}`);
      }

      const testResult = await testResponse.json();

      return NextResponse.json({
        success: true,
        message: `Test completed for ${timeSlot}`,
        result: testResult
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in scheduler test:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function calculateAverageResponseTime(runs: any[]): number {
  const completedRuns = runs.filter(r => r.status === 'completed' && r.started_at && r.completed_at);
  if (completedRuns.length === 0) return 0;

  const totalTime = completedRuns.reduce((sum, run) => {
    const start = new Date(run.started_at).getTime();
    const end = new Date(run.completed_at).getTime();
    return sum + (end - start);
  }, 0);

  return Math.round(totalTime / completedRuns.length / 1000); // Return in seconds
}

function getNextScheduledRun(currentHour: number): string {
  if (currentHour < 17) {
    return 'Today at 5:00 PM';
  } else if (currentHour < 18) {
    return 'Today at 6:00 PM';
  } else {
    return 'Tomorrow at 5:00 PM';
  }
}
