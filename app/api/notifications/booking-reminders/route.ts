import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import webpush from 'web-push';

const supabase = createClient();

// Configure web-push with VAPID keys (only if keys are available)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@tms.local',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface BookingReminderData {
  studentId: string;
  scheduleId: string;
  routeName: string;
  scheduleDate: string;
  departureTime: string;
  boardingStop: string;
}

// GET - Check for upcoming trips that need booking reminders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('targetDate') || getTomorrowDate();
    
    console.log('🔔 Checking for booking reminders for date:', targetDate);

    // Get all active schedules for tomorrow that are available for booking
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select(`
        id,
        route_id,
        schedule_date,
        departure_time,
        available_seats,
        booked_seats,
        booking_enabled,
        admin_scheduling_enabled,
        status,
        routes!route_id (
          id,
          route_name,
          route_number,
          status
        )
      `)
      .eq('schedule_date', targetDate)
      .eq('status', 'scheduled')
      .eq('booking_enabled', true)
      .eq('admin_scheduling_enabled', true);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ 
        message: 'No schedules found for booking reminders',
        date: targetDate,
        count: 0
      });
    }

    // Filter schedules with available seats and active routes
    const availableSchedules = schedules.filter(schedule => 
      schedule.routes?.status === 'active' &&
      schedule.available_seats > (schedule.booked_seats || 0)
    );

    console.log(`📊 Found ${availableSchedules.length} available schedules for ${targetDate}`);

    // Get all students who are enrolled in transport and allocated to these routes
    const routeIds = availableSchedules.map(s => s.route_id);
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        student_name,
        email,
        mobile,
        allocated_route_id,
        boarding_point,
        boarding_stop,
        transport_enrolled
      `)
      .eq('transport_enrolled', true)
      .in('allocated_route_id', routeIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ 
        message: 'No eligible students found for booking reminders',
        date: targetDate,
        schedules: availableSchedules.length
      });
    }

    // Check which students already have bookings for tomorrow
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('student_id, schedule_id, route_id, trip_date, status')
      .eq('trip_date', targetDate)
      .in('status', ['confirmed', 'pending']);

    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError);
    }

    const bookedStudentSchedules = new Set(
      (existingBookings || []).map(b => `${b.student_id}-${b.schedule_id || b.route_id}`)
    );

    // Create reminder data for students who haven't booked yet
    const reminderData: BookingReminderData[] = [];

    for (const student of students) {
      const studentSchedules = availableSchedules.filter(s => s.route_id === student.allocated_route_id);
      
      for (const schedule of studentSchedules) {
        const bookingKey = `${student.id}-${schedule.id}`;
        const routeBookingKey = `${student.id}-${schedule.route_id}`;
        
        if (!bookedStudentSchedules.has(bookingKey) && !bookedStudentSchedules.has(routeBookingKey)) {
          reminderData.push({
            studentId: student.id,
            scheduleId: schedule.id,
            routeName: schedule.routes?.route_name || 'Unknown Route',
            scheduleDate: schedule.schedule_date,
            departureTime: schedule.departure_time,
            boardingStop: student.boarding_point || student.boarding_stop || 'Default Stop'
          });
        }
      }
    }

    console.log(`🎯 Generated ${reminderData.length} booking reminders for ${targetDate}`);

    return NextResponse.json({
      success: true,
      date: targetDate,
      totalSchedules: availableSchedules.length,
      totalStudents: students.length,
      remindersGenerated: reminderData.length,
      reminders: reminderData
    });

  } catch (error) {
    console.error('Error in booking reminders GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send booking reminder notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      targetDate = getTomorrowDate(),
      sendNotifications = true,
      testMode = false 
    } = body;

    console.log('🚀 Starting booking reminder process:', { targetDate, sendNotifications, testMode });

    // Get reminder data
    const reminderResponse = await GET(new NextRequest(`${request.url}?targetDate=${targetDate}`));
    const reminderResult = await reminderResponse.json();

    if (!reminderResult.success || !reminderResult.reminders) {
      return NextResponse.json({
        success: false,
        message: 'No reminders to send',
        result: reminderResult
      });
    }

    const reminders: BookingReminderData[] = reminderResult.reminders;
    let notificationsSent = 0;
    let notificationsFailed = 0;
    const results = [];

    for (const reminder of reminders) {
      try {
        // Check booking eligibility first
        const eligibilityParams = new URLSearchParams({
          studentId: reminder.studentId,
          scheduleId: reminder.scheduleId
        });

        const eligibilityResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules/booking-eligibility?${eligibilityParams}`
        );
        
        const eligibilityData = await eligibilityResponse.json();

        // Create notification record
        const notificationTitle = `🚌 Trip Reminder - ${reminder.routeName}`;
        const notificationMessage = eligibilityData.can_book 
          ? `Your trip is tomorrow (${formatDate(reminder.scheduleDate)}) at ${reminder.departureTime}. Tap to confirm your booking!`
          : `Your trip is tomorrow (${formatDate(reminder.scheduleDate)}) at ${reminder.departureTime}. Payment required to book.`;

        const notificationData = {
          title: notificationTitle,
          message: notificationMessage,
          type: 'transport',
          category: 'booking',
          target_audience: 'students',
          specific_users: [reminder.studentId],
          enable_push_notification: true,
          actionable: true,
          primary_action: {
            text: eligibilityData.can_book ? 'Confirm Booking' : 'Pay & Book',
            url: `/dashboard/schedules?date=${reminder.scheduleDate}&schedule=${reminder.scheduleId}`,
            type: 'booking_reminder'
          },
          secondary_action: {
            text: 'View Details',
            url: `/dashboard/schedules?date=${reminder.scheduleDate}`,
            type: 'view_schedule'
          },
          tags: ['booking_reminder', 'transport', reminder.scheduleDate],
          metadata: {
            scheduleId: reminder.scheduleId,
            scheduleDate: reminder.scheduleDate,
            departureTime: reminder.departureTime,
            routeName: reminder.routeName,
            boardingStop: reminder.boardingStop,
            canBook: eligibilityData.can_book,
            paymentRequired: eligibilityData.payment_required,
            eligibilityData: eligibilityData
          },
          created_by: 'system_booking_reminder'
        };

        // Save notification to database
        const { data: notification, error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select()
          .single();

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          results.push({
            studentId: reminder.studentId,
            scheduleId: reminder.scheduleId,
            success: false,
            error: 'Failed to create notification record'
          });
          notificationsFailed++;
          continue;
        }

        // Send push notification if enabled
        if (sendNotifications && !testMode) {
          const pushResult = await sendPushNotification(reminder, eligibilityData, notification.id);
          
          results.push({
            studentId: reminder.studentId,
            scheduleId: reminder.scheduleId,
            notificationId: notification.id,
            success: pushResult.success,
            pushSent: pushResult.sent,
            error: pushResult.error
          });

          if (pushResult.success) {
            notificationsSent++;
          } else {
            notificationsFailed++;
          }
        } else {
          results.push({
            studentId: reminder.studentId,
            scheduleId: reminder.scheduleId,
            notificationId: notification.id,
            success: true,
            pushSent: false,
            testMode: testMode
          });
          notificationsSent++;
        }

      } catch (error) {
        console.error('Error processing reminder:', error);
        results.push({
          studentId: reminder.studentId,
          scheduleId: reminder.scheduleId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        notificationsFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Booking reminders processed for ${targetDate}`,
      summary: {
        totalReminders: reminders.length,
        notificationsSent,
        notificationsFailed,
        testMode
      },
      results
    });

  } catch (error) {
    console.error('Error in booking reminders POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send push notifications
async function sendPushNotification(
  reminder: BookingReminderData, 
  eligibilityData: any, 
  notificationId: string
) {
  try {
    // Get push subscriptions for the student
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', reminder.studentId)
      .eq('user_type', 'student')
      .eq('is_active', true);

    if (subscriptionError || !subscriptions || subscriptions.length === 0) {
      console.log(`No active push subscriptions found for student ${reminder.studentId}`);
      return { success: true, sent: false, error: 'No active subscriptions' };
    }

    const pushPayload = {
      title: `🚌 Trip Reminder - ${reminder.routeName}`,
      body: eligibilityData.can_book 
        ? `Your trip is tomorrow at ${reminder.departureTime}. Tap to confirm!`
        : `Your trip is tomorrow at ${reminder.departureTime}. Payment required.`,
      icon: '/icons/bus-notification.png',
      badge: '/icons/badge.png',
      tag: `booking-reminder-${reminder.scheduleId}`,
      requireInteraction: true,
      actions: [
        {
          action: 'confirm',
          title: eligibilityData.can_book ? 'Confirm Booking' : 'Pay & Book',
          icon: '/icons/confirm.png'
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Not Traveling',
          icon: '/icons/dismiss.png'
        }
      ],
      data: {
        type: 'booking_reminder',
        notificationId,
        scheduleId: reminder.scheduleId,
        scheduleDate: reminder.scheduleDate,
        departureTime: reminder.departureTime,
        routeName: reminder.routeName,
        boardingStop: reminder.boardingStop,
        canBook: eligibilityData.can_book,
        paymentRequired: eligibilityData.payment_required,
        url: `/dashboard/schedules?date=${reminder.scheduleDate}&schedule=${reminder.scheduleId}`
      }
    };

    let sentCount = 0;
    let failedCount = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(pushPayload));
        sentCount++;
        
        console.log(`✅ Push notification sent to student ${reminder.studentId}`);
      } catch (pushError) {
        console.error(`❌ Failed to send push notification:`, pushError);
        failedCount++;
        
        // If subscription is invalid, mark it as inactive
        if (pushError instanceof Error && pushError.message.includes('410')) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
      }
    }

    return { 
      success: sentCount > 0, 
      sent: sentCount > 0, 
      sentCount, 
      failedCount,
      error: failedCount > 0 ? `${failedCount} notifications failed` : null
    };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return { 
      success: false, 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper functions
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
