import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Test endpoint for booking notification flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      testType = 'full_flow',
      studentId,
      scheduleId,
      targetDate,
      skipNotifications = false
    } = body;

    console.log('🧪 Testing booking notification flow:', { testType, studentId, scheduleId, targetDate });

    let results = {};

    switch (testType) {
      case 'full_flow':
        results = await testFullNotificationFlow(studentId, scheduleId, targetDate, skipNotifications);
        break;
      
      case 'reminder_generation':
        results = await testReminderGeneration(targetDate);
        break;
      
      case 'push_notification':
        results = await testPushNotification(studentId);
        break;
      
      case 'booking_action':
        results = await testBookingAction(studentId, scheduleId);
        break;
      
      case 'scheduler':
        results = await testScheduler(targetDate, true); // dry run
        break;
      
      default:
        return NextResponse.json({ 
          error: 'Invalid test type' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testType,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in booking notification test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test full notification flow
async function testFullNotificationFlow(
  studentId?: string, 
  scheduleId?: string, 
  targetDate?: string,
  skipNotifications: boolean = false
) {
  const results: any = {
    steps: [],
    success: false,
    errors: []
  };

  try {
    // Step 1: Setup test data
    results.steps.push({ step: 'setup', status: 'starting' });
    
    const testDate = targetDate || getTomorrowDate();
    let testStudentId = studentId;
    let testScheduleId = scheduleId;

    // Create test student if not provided
    if (!testStudentId) {
      const testStudent = await createTestStudent();
      testStudentId = testStudent.id;
      results.testStudent = testStudent;
    }

    // Create test schedule if not provided
    if (!testScheduleId) {
      const testSchedule = await createTestSchedule(testDate, testStudentId);
      testScheduleId = testSchedule.id;
      results.testSchedule = testSchedule;
    }

    results.steps[0].status = 'completed';

    // Step 2: Test reminder generation
    results.steps.push({ step: 'reminder_generation', status: 'starting' });
    
    const reminderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-reminders?targetDate=${testDate}`);
    const reminderData = await reminderResponse.json();
    
    results.reminderGeneration = reminderData;
    results.steps[1].status = reminderData.success ? 'completed' : 'failed';
    
    if (!reminderData.success) {
      results.errors.push('Reminder generation failed');
    }

    // Step 3: Send notifications (if not skipped)
    if (!skipNotifications) {
      results.steps.push({ step: 'send_notifications', status: 'starting' });
      
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDate: testDate,
          sendNotifications: true,
          testMode: true
        })
      });
      
      const notificationData = await notificationResponse.json();
      results.notificationSending = notificationData;
      results.steps[2].status = notificationData.success ? 'completed' : 'failed';
      
      if (!notificationData.success) {
        results.errors.push('Notification sending failed');
      }
    }

    // Step 4: Test booking confirmation
    results.steps.push({ step: 'booking_confirmation', status: 'starting' });
    
    const confirmationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm',
        notificationId: 'test-notification-123',
        scheduleId: testScheduleId,
        studentId: testStudentId,
        scheduleDate: testDate,
        departureTime: '07:30:00',
        routeName: 'Test Route',
        boardingStop: 'Test Stop'
      })
    });
    
    const confirmationData = await confirmationResponse.json();
    results.bookingConfirmation = confirmationData;
    
    const stepIndex = skipNotifications ? 2 : 3;
    results.steps[stepIndex].status = confirmationData.success ? 'completed' : 'failed';
    
    if (!confirmationData.success) {
      results.errors.push('Booking confirmation failed');
    }

    // Step 5: Test booking decline
    results.steps.push({ step: 'booking_decline', status: 'starting' });
    
    const declineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'decline',
        notificationId: 'test-notification-456',
        scheduleId: testScheduleId,
        studentId: testStudentId,
        scheduleDate: testDate,
        departureTime: '07:30:00',
        routeName: 'Test Route'
      })
    });
    
    const declineData = await declineResponse.json();
    results.bookingDecline = declineData;
    
    const finalStepIndex = skipNotifications ? 3 : 4;
    results.steps[finalStepIndex].status = declineData.success ? 'completed' : 'failed';
    
    if (!declineData.success) {
      results.errors.push('Booking decline failed');
    }

    // Overall success
    results.success = results.errors.length === 0;

    // Cleanup test data
    if (!studentId && testStudentId) {
      await cleanupTestStudent(testStudentId);
    }
    if (!scheduleId && testScheduleId) {
      await cleanupTestSchedule(testScheduleId);
    }

  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    results.success = false;
  }

  return results;
}

// Test reminder generation only
async function testReminderGeneration(targetDate?: string) {
  const testDate = targetDate || getTomorrowDate();
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-reminders?targetDate=${testDate}`);
    const data = await response.json();
    
    return {
      success: response.ok && data.success,
      data,
      testDate,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testDate
    };
  }
}

// Test push notification functionality
async function testPushNotification(studentId?: string) {
  try {
    let testStudentId = studentId;
    
    if (!testStudentId) {
      const testStudent = await createTestStudent();
      testStudentId = testStudent.id;
    }

    // Check if student has push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', testStudentId)
      .eq('is_active', true);

    const result = {
      success: !error,
      studentId: testStudentId,
      subscriptionsFound: subscriptions?.length || 0,
      subscriptions: subscriptions || [],
      error: error?.message
    };

    // Cleanup if we created a test student
    if (!studentId && testStudentId) {
      await cleanupTestStudent(testStudentId);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test booking action processing
async function testBookingAction(studentId?: string, scheduleId?: string) {
  try {
    let testStudentId = studentId;
    let testScheduleId = scheduleId;
    
    if (!testStudentId) {
      const testStudent = await createTestStudent();
      testStudentId = testStudent.id;
    }

    if (!testScheduleId) {
      const testSchedule = await createTestSchedule(getTomorrowDate(), testStudentId);
      testScheduleId = testSchedule.id;
    }

    // Test confirm action
    const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm',
        notificationId: 'test-notification-confirm',
        scheduleId: testScheduleId,
        studentId: testStudentId,
        scheduleDate: getTomorrowDate(),
        departureTime: '07:30:00',
        routeName: 'Test Route',
        boardingStop: 'Test Stop'
      })
    });

    const confirmData = await confirmResponse.json();

    // Test decline action
    const declineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/booking-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'decline',
        notificationId: 'test-notification-decline',
        scheduleId: testScheduleId,
        studentId: testStudentId,
        scheduleDate: getTomorrowDate(),
        departureTime: '07:30:00',
        routeName: 'Test Route'
      })
    });

    const declineData = await declineResponse.json();

    const result = {
      success: confirmResponse.ok && declineResponse.ok,
      confirmAction: {
        success: confirmData.success,
        data: confirmData
      },
      declineAction: {
        success: declineData.success,
        data: declineData
      }
    };

    // Cleanup
    if (!studentId && testStudentId) {
      await cleanupTestStudent(testStudentId);
    }
    if (!scheduleId && testScheduleId) {
      await cleanupTestSchedule(testScheduleId);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test scheduler functionality
async function testScheduler(targetDate?: string, dryRun: boolean = true) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/scheduler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedulerKey: process.env.SCHEDULER_SECRET_KEY || 'test-key',
        targetDate: targetDate || getTomorrowDate(),
        dryRun,
        force: true
      })
    });

    const data = await response.json();

    return {
      success: response.ok && data.success,
      data,
      dryRun
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper functions
async function createTestStudent() {
  const testStudent = {
    id: `test-student-${Date.now()}`,
    student_name: 'Test Student',
    email: `test.student.${Date.now()}@example.com`,
    mobile: '9999999999',
    transport_enrolled: true,
    allocated_route_id: await getTestRouteId(),
    boarding_point: 'Test Stop',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('students')
    .insert(testStudent)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test student: ${error.message}`);
  }

  return data;
}

async function createTestSchedule(scheduleDate: string, studentId: string) {
  const routeId = await getTestRouteId();
  
  const testSchedule = {
    id: `test-schedule-${Date.now()}`,
    route_id: routeId,
    schedule_date: scheduleDate,
    departure_time: '07:30:00',
    arrival_time: '09:30:00',
    available_seats: 60,
    booked_seats: 0,
    booking_enabled: true,
    admin_scheduling_enabled: true,
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('schedules')
    .insert(testSchedule)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test schedule: ${error.message}`);
  }

  return data;
}

async function getTestRouteId() {
  const { data: routes, error } = await supabase
    .from('routes')
    .select('id')
    .eq('status', 'active')
    .limit(1);

  if (error || !routes || routes.length === 0) {
    throw new Error('No active routes found for testing');
  }

  return routes[0].id;
}

async function cleanupTestStudent(studentId: string) {
  try {
    await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
  } catch (error) {
    console.error('Error cleaning up test student:', error);
  }
}

async function cleanupTestSchedule(scheduleId: string) {
  try {
    await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);
  } catch (error) {
    console.error('Error cleaning up test schedule:', error);
  }
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// GET endpoint for running specific tests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('testType') || 'reminder_generation';
    const targetDate = searchParams.get('targetDate');

    let results;

    switch (testType) {
      case 'reminder_generation':
        results = await testReminderGeneration(targetDate || undefined);
        break;
      
      case 'push_notification':
        results = await testPushNotification();
        break;
      
      case 'scheduler':
        results = await testScheduler(targetDate || undefined, true);
        break;
      
      default:
        return NextResponse.json({ 
          error: 'Invalid test type. Use: reminder_generation, push_notification, scheduler' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testType,
      results
    });

  } catch (error) {
    console.error('Error in booking notification test GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
