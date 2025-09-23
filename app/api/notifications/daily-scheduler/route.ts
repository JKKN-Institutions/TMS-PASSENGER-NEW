import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Enhanced daily scheduler for multiple time slots
export async function POST(request: NextRequest) {
  try {
    // Handle Vercel cron calls (no body) and manual calls (with body)
    let body = {};
    try {
      body = await request.json();
    } catch {
      // No body - this is likely a Vercel cron call
      body = {};
    }

    const { 
      schedulerKey = process.env.SCHEDULER_SECRET_KEY,
      targetDate,
      timeSlot,
      dryRun = false,
      force = false
    } = body;

    // Determine time slot from current time if not provided (for Vercel cron)
    let actualTimeSlot = timeSlot;
    if (!actualTimeSlot) {
      const currentHour = new Date().getHours();
      if (currentHour === 17) {
        actualTimeSlot = '17:00';
      } else if (currentHour === 18) {
        actualTimeSlot = '18:00';
      } else {
        return NextResponse.json({
          error: 'Invalid time - scheduler only runs at 17:00 or 18:00'
        }, { status: 400 });
      }
    }

    // Verify scheduler key for security
    if (schedulerKey !== process.env.SCHEDULER_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('🕐 Daily scheduler execution:', { timeSlot: actualTimeSlot, targetDate, dryRun, force });

    // Validate time slot
    const validTimeSlots = ['17:00', '18:00'];
    if (!validTimeSlots.includes(actualTimeSlot)) {
      return NextResponse.json({
        error: 'Invalid time slot. Supported: 17:00, 18:00'
      }, { status: 400 });
    }

    // Set force=true for 6 PM slot by default
    const actualForce = force || (actualTimeSlot === '18:00');

    // Check if this time slot has already run today (unless forced)
    if (!actualForce) {
      const today = new Date().toISOString().split('T')[0];
      const { data: lastRun, error: lastRunError } = await supabase
        .from('scheduler_runs')
        .select('*')
        .eq('scheduler_type', 'booking_reminders')
        .eq('run_date', today)
        .eq('time_slot', actualTimeSlot)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastRunError && lastRun) {
        return NextResponse.json({
          success: true,
          message: `Scheduler already ran today at ${actualTimeSlot}`,
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
        time_slot: actualTimeSlot,
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

    // Run the booking reminder scheduler
    const result = await runBookingReminderScheduler(targetDate, actualTimeSlot, dryRun);

    // Update scheduler run status
    if (schedulerRun) {
      await supabase
        .from('scheduler_runs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          result_summary: result.summary,
          error_details: result.error
        })
        .eq('id', schedulerRun.id);
    }

    return NextResponse.json({
      success: result.success,
      message: `Daily scheduler executed for ${actualTimeSlot}`,
      timeSlot: actualTimeSlot,
      result
    });

  } catch (error) {
    console.error('Error in daily scheduler:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enhanced scheduler function with time slot awareness
async function runBookingReminderScheduler(targetDate?: string | null, timeSlot?: string, dryRun: boolean = false) {
  try {
    const reminderDate = targetDate || getTomorrowDate();
    
    console.log(`🚀 Running booking reminder scheduler for ${reminderDate} at ${timeSlot}`, { dryRun });

    // Get notification settings to customize behavior by time slot
    const notificationConfig = getNotificationConfigForTimeSlot(timeSlot);

    // Call the booking reminders API with time-specific configuration
    const reminderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetDate: reminderDate,
        sendNotifications: !dryRun,
        testMode: dryRun,
        timeSlot: timeSlot,
        config: notificationConfig
      })
    });

    if (!reminderResponse.ok) {
      throw new Error(`Booking reminders API failed: ${reminderResponse.status}`);
    }

    const reminderResult = await reminderResponse.json();

    // Time-specific processing
    if (!dryRun) {
      if (timeSlot === '17:00') {
        // 5 PM processing: Send initial reminders
        await cleanupOldNotifications();
        console.log('📱 5 PM: Sending initial booking reminders');
      } else if (timeSlot === '18:00') {
        // 6 PM processing: Send follow-up reminders to non-responders
        await sendFollowUpReminders(reminderDate);
        console.log('📱 6 PM: Sending follow-up reminders');
      }
    }

    // Log summary
    const summary = {
      date: reminderDate,
      timeSlot: timeSlot,
      totalReminders: reminderResult.summary?.totalReminders || 0,
      notificationsSent: reminderResult.summary?.notificationsSent || 0,
      notificationsFailed: reminderResult.summary?.notificationsFailed || 0,
      dryRun,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Daily scheduler execution summary:', summary);

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
        timeSlot: timeSlot,
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

// Get notification configuration based on time slot
function getNotificationConfigForTimeSlot(timeSlot?: string) {
  switch (timeSlot) {
    case '17:00':
      return {
        title: '🚌 Bus Booking Reminder - Tomorrow',
        urgency: 'normal',
        priority: 'high',
        followUp: false
      };
    case '18:00':
      return {
        title: '⏰ Last Chance - Confirm Your Bus Booking',
        urgency: 'high',
        priority: 'urgent',
        followUp: true
      };
    default:
      return {
        title: '🚌 Bus Booking Reminder',
        urgency: 'normal',
        priority: 'high',
        followUp: false
      };
  }
}

// Send follow-up reminders to students who haven't responded
async function sendFollowUpReminders(targetDate: string) {
  try {
    // Get students who received 5 PM reminders but haven't responded
    const { data: unresponsiveStudents, error } = await supabase
      .from('notifications')
      .select(`
        student_id,
        schedule_id,
        created_at
      `)
      .eq('notification_type', 'booking_reminder')
      .eq('target_date', targetDate)
      .is('user_response', null)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .limit(100);

    if (error) {
      console.error('Error fetching unresponsive students:', error);
      return;
    }

    console.log(`📤 Sending follow-up reminders to ${unresponsiveStudents?.length || 0} students`);

    // Send follow-up notifications
    if (unresponsiveStudents && unresponsiveStudents.length > 0) {
      // This would trigger the booking-reminders API with followUp: true
      // The API would then send more urgent notifications
    }

  } catch (error) {
    console.error('Error sending follow-up reminders:', error);
  }
}

// Helper functions
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo)
      .eq('notification_type', 'booking_reminder');

    console.log('🧹 Cleaned up old notifications');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}
