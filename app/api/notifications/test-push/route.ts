import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, testType = 'welcome' } = body;

    if (!studentId) {
      return NextResponse.json({ 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_name, email')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('Error fetching student:', studentError);
      return NextResponse.json({ 
        error: 'Student not found' 
      }, { status: 404 });
    }

    // Get push subscriptions for this student
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', studentId)
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions' 
      }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No active subscriptions found for this student',
        sent: 0
      });
    }

    // Prepare notification content based on test type
    let notificationContent;
    
    switch (testType) {
      case 'welcome':
        notificationContent = {
          title: '🎉 Welcome to TMS!',
          body: `Hi ${student.student_name}! Push notifications are now enabled. You'll receive important updates about your transport bookings.`,
          icon: '/icons/bus-notification.png',
          badge: '/icons/badge.png',
          tag: 'welcome-notification',
          data: {
            type: 'welcome',
            studentId: studentId,
            url: '/dashboard'
          }
        };
        break;
      
      case 'test':
        notificationContent = {
          title: '🧪 Test Notification',
          body: 'This is a test notification to verify your push notification setup is working correctly.',
          icon: '/icons/info-notification.png',
          badge: '/icons/badge.png',
          tag: 'test-notification',
          data: {
            type: 'test',
            studentId: studentId,
            url: '/dashboard'
          }
        };
        break;
      
      default:
        notificationContent = {
          title: '📱 TMS Notification',
          body: 'Your push notifications are working correctly!',
          icon: '/icons/bus-notification.png',
          badge: '/icons/badge.png',
          tag: 'default-test',
          data: {
            type: 'default',
            studentId: studentId,
            url: '/dashboard'
          }
        };
    }

    // Send notification to admin API (which handles the actual push sending)
    const adminResponse = await fetch(`${process.env.ADMIN_API_URL || 'http://localhost:3001'}/api/admin/notifications/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: notificationContent.title,
        message: notificationContent.body,
        type: 'info',
        category: 'system',
        targetAudience: 'specific_users',
        specificUsers: [studentId],
        adminId: 'system', // System-generated test notification
        sendImmediately: true,
        metadata: {
          testType: testType,
          studentName: student.student_name,
          isTestNotification: true
        }
      })
    });

    if (!adminResponse.ok) {
      console.error('Failed to send notification via admin API');
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send notification' 
      }, { status: 500 });
    }

    const result = await adminResponse.json();

    return NextResponse.json({
      success: true,
      message: `${testType} notification sent successfully`,
      student: {
        id: studentId,
        name: student.student_name,
        email: student.email
      },
      subscriptions: subscriptions.length,
      result: result
    });

  } catch (error) {
    console.error('Error in test push notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
