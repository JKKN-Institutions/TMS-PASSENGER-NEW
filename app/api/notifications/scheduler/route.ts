import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Manual trigger for booking reminder scheduler (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('targetDate');
    const dryRun = searchParams.get('dryRun') === 'true';
    
    console.log('🕐 Manual scheduler trigger:', { targetDate, dryRun });

    const result = await runBookingReminderScheduler(targetDate, dryRun);

    return NextResponse.json({
      success: true,
      message: 'Booking reminder scheduler executed',
      result,
      manual: true,
      dryRun
    });

  } catch (error) {
    console.error('Error in manual scheduler trigger:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Automated scheduler endpoint (called by cron job or external scheduler)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      schedulerKey,
      targetDate,
      dryRun = false,
      force = false
    } = body;

    // Verify scheduler key for security
    if (schedulerKey !== process.env.SCHEDULER_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('🤖 Automated scheduler execution:', { targetDate, dryRun, force });

    // Check if scheduler has already run today (unless forced)
    if (!force) {
      const today = new Date().toISOString().split('T')[0];
      const { data: lastRun, error: lastRunError } = await supabase
        .from('scheduler_runs')
        .select('*')
        .eq('scheduler_type', 'booking_reminders')
        .eq('run_date', today)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastRunError && lastRun) {
        return NextResponse.json({
          success: true,
          message: 'Scheduler already ran today',
          skipped: true,
          lastRun: lastRun.created_at
        });
      }
    }

    // Log scheduler run start
    const { data: schedulerRun, error: runError } = await supabase
      .from('scheduler_runs')
      .insert({
        scheduler_type: 'booking_reminders',
        run_date: new Date().toISOString().split('T')[0],
        target_date: targetDate,
        status: 'running',
        dry_run: dryRun,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (runError) {
      console.error('Error logging scheduler run:', runError);
    }

    const result = await runBookingReminderScheduler(targetDate, dryRun);

    // Update scheduler run status
    if (schedulerRun) {
      await supabase
        .from('scheduler_runs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          result_summary: result.summary,
          error_details: result.error || null
        })
        .eq('id', schedulerRun.id);
    }

    return NextResponse.json({
      success: result.success,
      message: 'Automated booking reminder scheduler executed',
      result,
      schedulerRunId: schedulerRun?.id,
      dryRun
    });

  } catch (error) {
    console.error('Error in automated scheduler:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Main scheduler function
async function runBookingReminderScheduler(targetDate?: string | null, dryRun: boolean = false) {
  try {
    const reminderDate = targetDate || getTomorrowDate();
    
    console.log(`🚀 Running booking reminder scheduler for ${reminderDate}`, { dryRun });

    // Call the booking reminders API
    const reminderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetDate: reminderDate,
        sendNotifications: !dryRun,
        testMode: dryRun
      })
    });

    if (!reminderResponse.ok) {
      throw new Error(`Booking reminders API failed: ${reminderResponse.status}`);
    }

    const reminderResult = await reminderResponse.json();

    // Additional processing: Clean up old notifications
    if (!dryRun) {
      await cleanupOldNotifications();
      await cleanupInactiveSubscriptions();
    }

    // Log summary
    const summary = {
      date: reminderDate,
      totalReminders: reminderResult.summary?.totalReminders || 0,
      notificationsSent: reminderResult.summary?.notificationsSent || 0,
      notificationsFailed: reminderResult.summary?.notificationsFailed || 0,
      dryRun,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Scheduler execution summary:', summary);

    return {
      success: reminderResult.success,
      summary,
      details: reminderResult.results,
      error: reminderResult.error || null
    };

  } catch (error) {
    console.error('Error in booking reminder scheduler:', error);
    return {
      success: false,
      summary: {
        date: targetDate || getTomorrowDate(),
        totalReminders: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        dryRun,
        timestamp: new Date().toISOString()
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Cleanup old notifications (older than 30 days)
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .in('category', ['booking', 'transport'])
      .neq('type', 'emergency'); // Keep emergency notifications longer

    if (error) {
      console.error('Error cleaning up old notifications:', error);
    } else {
      console.log('✅ Cleaned up old notifications');
    }
  } catch (error) {
    console.error('Error in notification cleanup:', error);
  }
}

// Cleanup inactive push subscriptions
async function cleanupInactiveSubscriptions() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('is_active', false)
      .lt('updated_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up inactive subscriptions:', error);
    } else {
      console.log('✅ Cleaned up inactive push subscriptions');
    }
  } catch (error) {
    console.error('Error in subscription cleanup:', error);
  }
}

// Helper function to get tomorrow's date
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
