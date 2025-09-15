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

interface BookingActionRequest {
  action: 'confirm' | 'decline' | 'view';
  notificationId: string;
  scheduleId: string;
  studentId: string;
  scheduleDate: string;
  departureTime: string;
  routeName: string;
  boardingStop?: string;
}

// POST - Handle booking confirmation/decline actions from push notifications
export async function POST(request: NextRequest) {
  try {
    const body: BookingActionRequest = await request.json();
    const { 
      action, 
      notificationId, 
      scheduleId, 
      studentId, 
      scheduleDate,
      departureTime,
      routeName,
      boardingStop 
    } = body;

    console.log('📱 Processing booking action:', { action, scheduleId, studentId, scheduleDate });

    if (!action || !notificationId || !scheduleId || !studentId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Mark the original notification as read
    await supabase
      .from('notifications')
      .update({ 
        read_by: supabase.raw(`COALESCE(read_by, '[]'::jsonb) || '["${studentId}"]'::jsonb`)
      })
      .eq('id', notificationId);

    let result;
    let followUpNotification;

    switch (action) {
      case 'confirm':
        result = await handleBookingConfirmation(scheduleId, studentId, scheduleDate, boardingStop);
        followUpNotification = await createConfirmationNotification(
          result, studentId, scheduleId, scheduleDate, departureTime, routeName
        );
        break;

      case 'decline':
        result = await handleBookingDecline(scheduleId, studentId, scheduleDate);
        followUpNotification = await createDeclineNotification(
          studentId, scheduleId, scheduleDate, departureTime, routeName
        );
        break;

      case 'view':
        result = { success: true, action: 'view', message: 'Redirecting to schedule details' };
        // No follow-up notification needed for view action
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Send follow-up push notification if needed
    if (followUpNotification) {
      await sendFollowUpNotification(studentId, followUpNotification);
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      followUpNotification: followUpNotification ? {
        id: followUpNotification.id,
        title: followUpNotification.title,
        message: followUpNotification.message
      } : null
    });

  } catch (error) {
    console.error('Error processing booking action:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle booking confirmation
async function handleBookingConfirmation(
  scheduleId: string, 
  studentId: string, 
  scheduleDate: string,
  boardingStop?: string
) {
  try {
    // First check if student can still book
    const eligibilityParams = new URLSearchParams({
      studentId,
      scheduleId
    });

    const eligibilityResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules/booking-eligibility?${eligibilityParams}`
    );
    
    const eligibilityData = await eligibilityResponse.json();

    if (!eligibilityData.can_book) {
      return {
        success: false,
        action: 'confirm',
        error: 'booking_not_available',
        message: eligibilityData.reason,
        paymentRequired: eligibilityData.payment_required,
        paymentOptions: eligibilityData.payment_options
      };
    }

    // Get student and schedule details
    const [studentResult, scheduleResult] = await Promise.all([
      supabase
        .from('students')
        .select('id, student_name, email, mobile, allocated_route_id, boarding_point, boarding_stop')
        .eq('id', studentId)
        .single(),
      
      supabase
        .from('schedules')
        .select(`
          id, route_id, schedule_date, departure_time, available_seats, booked_seats,
          routes!route_id (id, route_name, fare)
        `)
        .eq('id', scheduleId)
        .single()
    ]);

    if (studentResult.error || scheduleResult.error) {
      throw new Error('Failed to fetch student or schedule details');
    }

    const student = studentResult.data;
    const schedule = scheduleResult.data;

    // Check seat availability
    if (schedule.booked_seats >= schedule.available_seats) {
      return {
        success: false,
        action: 'confirm',
        error: 'no_seats_available',
        message: 'Sorry, no seats are available for this trip.'
      };
    }

    // Create booking record
    const bookingData = {
      student_id: studentId,
      route_id: schedule.route_id,
      schedule_id: scheduleId,
      trip_date: scheduleDate,
      boarding_stop: boardingStop || student.boarding_point || student.boarding_stop || 'Default Stop',
      amount: schedule.routes?.fare || 0,
      status: 'confirmed',
      payment_status: 'paid', // Assuming payment is already verified
      booking_source: 'push_notification',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return {
        success: false,
        action: 'confirm',
        error: 'booking_creation_failed',
        message: 'Failed to create booking. Please try again.'
      };
    }

    // Update schedule booked seats count
    await supabase
      .from('schedules')
      .update({ 
        booked_seats: schedule.booked_seats + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId);

    return {
      success: true,
      action: 'confirm',
      message: 'Booking confirmed successfully!',
      bookingId: booking.id,
      seatNumber: booking.seat_number,
      qrCode: booking.qr_code
    };

  } catch (error) {
    console.error('Error in booking confirmation:', error);
    return {
      success: false,
      action: 'confirm',
      error: 'internal_error',
      message: 'An error occurred while confirming your booking.'
    };
  }
}

// Handle booking decline
async function handleBookingDecline(
  scheduleId: string, 
  studentId: string, 
  scheduleDate: string
) {
  try {
    // Log the decline action for analytics
    const { error: logError } = await supabase
      .from('booking_actions_log')
      .insert({
        student_id: studentId,
        schedule_id: scheduleId,
        action: 'decline',
        action_date: scheduleDate,
        source: 'push_notification',
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging decline action:', logError);
    }

    return {
      success: true,
      action: 'decline',
      message: 'Got it! You won\'t be traveling tomorrow.'
    };

  } catch (error) {
    console.error('Error in booking decline:', error);
    return {
      success: false,
      action: 'decline',
      error: 'internal_error',
      message: 'An error occurred while processing your response.'
    };
  }
}

// Create confirmation notification
async function createConfirmationNotification(
  result: any,
  studentId: string,
  scheduleId: string,
  scheduleDate: string,
  departureTime: string,
  routeName: string
) {
  try {
    let notificationData;

    if (result.success) {
      notificationData = {
        title: '✅ Booking Confirmed!',
        message: `Your trip on ${routeName} tomorrow (${formatDate(scheduleDate)}) at ${departureTime} is confirmed. Have a safe journey!`,
        type: 'success',
        category: 'booking',
        target_audience: 'students',
        specific_users: [studentId],
        enable_push_notification: true,
        actionable: true,
        primary_action: {
          text: 'View Booking',
          url: `/dashboard/bookings?booking=${result.bookingId}`,
          type: 'view_booking'
        },
        secondary_action: {
          text: 'Track Bus',
          url: `/dashboard/live-tracking?schedule=${scheduleId}`,
          type: 'track_bus'
        },
        tags: ['booking_confirmed', 'transport', scheduleDate],
        metadata: {
          scheduleId,
          scheduleDate,
          departureTime,
          routeName,
          bookingId: result.bookingId,
          confirmationType: 'push_notification'
        },
        created_by: 'system_booking_confirmation'
      };
    } else {
      // Handle different error types
      let errorMessage = result.message || 'Unable to confirm booking';
      let actionText = 'Try Again';
      let actionUrl = `/dashboard/schedules?date=${scheduleDate}&schedule=${scheduleId}`;

      if (result.paymentRequired) {
        errorMessage = 'Payment required to confirm booking';
        actionText = 'Pay Now';
        actionUrl = `/dashboard/payments?schedule=${scheduleId}`;
      }

      notificationData = {
        title: '❌ Booking Not Confirmed',
        message: errorMessage,
        type: 'warning',
        category: 'booking',
        target_audience: 'students',
        specific_users: [studentId],
        enable_push_notification: true,
        actionable: true,
        primary_action: {
          text: actionText,
          url: actionUrl,
          type: result.paymentRequired ? 'payment_required' : 'retry_booking'
        },
        tags: ['booking_failed', 'transport', scheduleDate],
        metadata: {
          scheduleId,
          scheduleDate,
          departureTime,
          routeName,
          errorType: result.error,
          paymentRequired: result.paymentRequired,
          paymentOptions: result.paymentOptions
        },
        created_by: 'system_booking_error'
      };
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating confirmation notification:', error);
      return null;
    }

    return notification;

  } catch (error) {
    console.error('Error creating confirmation notification:', error);
    return null;
  }
}

// Create decline notification
async function createDeclineNotification(
  studentId: string,
  scheduleId: string,
  scheduleDate: string,
  departureTime: string,
  routeName: string
) {
  try {
    const notificationData = {
      title: '👍 Got It!',
      message: `We've noted that you won't be traveling on ${routeName} tomorrow (${formatDate(scheduleDate)}) at ${departureTime}. Thanks for letting us know!`,
      type: 'info',
      category: 'booking',
      target_audience: 'students',
      specific_users: [studentId],
      enable_push_notification: true,
      actionable: true,
      primary_action: {
        text: 'Change Mind?',
        url: `/dashboard/schedules?date=${scheduleDate}&schedule=${scheduleId}`,
        type: 'change_mind'
      },
      tags: ['booking_declined', 'transport', scheduleDate],
      metadata: {
        scheduleId,
        scheduleDate,
        departureTime,
        routeName,
        declineType: 'push_notification'
      },
      created_by: 'system_booking_decline'
    };

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating decline notification:', error);
      return null;
    }

    return notification;

  } catch (error) {
    console.error('Error creating decline notification:', error);
    return null;
  }
}

// Send follow-up push notification
async function sendFollowUpNotification(studentId: string, notification: any) {
  try {
    // Get push subscriptions for the student
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', studentId)
      .eq('user_type', 'student')
      .eq('is_active', true);

    if (subscriptionError || !subscriptions || subscriptions.length === 0) {
      console.log(`No active push subscriptions found for student ${studentId}`);
      return false;
    }

    const pushPayload = {
      title: notification.title,
      body: notification.message,
      icon: getNotificationIcon(notification.type),
      badge: '/icons/badge.png',
      tag: `booking-followup-${notification.id}`,
      data: {
        type: 'booking_followup',
        notificationId: notification.id,
        url: notification.primary_action?.url || '/dashboard'
      }
    };

    let sentCount = 0;

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
        
        console.log(`✅ Follow-up notification sent to student ${studentId}`);
      } catch (pushError) {
        console.error(`❌ Failed to send follow-up notification:`, pushError);
        
        // If subscription is invalid, mark it as inactive
        if (pushError instanceof Error && pushError.message.includes('410')) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
      }
    }

    return sentCount > 0;

  } catch (error) {
    console.error('Error sending follow-up notification:', error);
    return false;
  }
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'success':
      return '/icons/success-notification.png';
    case 'warning':
      return '/icons/warning-notification.png';
    case 'error':
      return '/icons/error-notification.png';
    default:
      return '/icons/info-notification.png';
  }
}
