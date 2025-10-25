// Enhanced Push Notification Service for TMS Passenger App
// Handles subscription, sending, and interactive notifications

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
  vibrate?: number[];
  silent?: boolean;
  timestamp?: number;
}

interface BookingReminderNotification {
  title: string;
  body: string;
  scheduleId: string;
  scheduleDate: string;
  departureTime: string;
  routeName: string;
  boardingStop: string;
  canBook: boolean;
  paymentRequired: boolean;
  notificationId: string;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private studentId: string | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialize push notification service
  private async init() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.log('⚠️ Not in browser environment, skipping push notification initialization');
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered successfully');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Get existing subscription
        this.subscription = await this.registration.pushManager.getSubscription();

        if (this.subscription) {
          console.log('📱 Existing push subscription found');
        }

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Push notifications not supported');
    }
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    if (data.type === 'GET_STUDENT_ID') {
      // Send student ID back to service worker
      event.ports[0].postMessage({ studentId: this.studentId });
    }
  }

  // Set student ID for notifications
  public setStudentId(studentId: string) {
    this.studentId = studentId;
    console.log('👤 Student ID set for push notifications:', studentId);
  }

  // Check if push notifications are supported
  public isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Check current permission status
  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission:', permission);
    
    return permission;
  }

  // Ensure service worker is ready and active
  private async ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    // Get or register service worker
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔧 Service Worker registered');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('⏳ Service Worker ready');

    // Ensure there's an active service worker
    if (!this.registration.active) {
      // Wait for the service worker to become active (with timeout)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Service Worker activation timeout (10s)'));
        }, 10000); // 10 second timeout

        const checkActive = () => {
          if (this.registration?.active) {
            clearTimeout(timeout);
            console.log('✅ Service Worker is now active');
            resolve();
          } else {
            console.log('🔄 Waiting for service worker to activate...');
            setTimeout(checkActive, 100);
          }
        };
        checkActive();
      });
    }

    // Double-check that we have an active service worker
    if (!this.registration.active) {
      throw new Error('Service Worker failed to activate');
    }

    console.log('🎯 Service Worker is ready and active');
    return this.registration;
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<PushSubscription | null> {
    // Ensure service worker is ready
    await this.ensureServiceWorkerReady();

    if (!this.registration) {
      throw new Error('Service Worker not ready');
    }

    if (this.getPermissionStatus() !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    try {
      // Convert VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      console.log('✅ Push subscription created:', this.subscription);

      // Send subscription to server
      if (this.studentId) {
        await this.sendSubscriptionToServer(this.subscription);
      }

      return this.subscription;

    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success && this.studentId) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer();
      }

      this.subscription = null;
      console.log('✅ Push subscription removed');
      
      return success;
    } catch (error) {
      console.error('❌ Push unsubscription failed:', error);
      return false;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    if (!this.studentId) {
      throw new Error('Student ID not set');
    }

    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: this.studentId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Subscription saved to server:', result);

    } catch (error) {
      console.error('❌ Failed to save subscription:', error);
      throw error;
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    if (!this.studentId) {
      return;
    }

    try {
      const response = await fetch(`/api/push/subscribe?userId=${this.studentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to remove subscription from server:', response.status);
      } else {
        console.log('✅ Subscription removed from server');
      }

    } catch (error) {
      console.error('❌ Failed to remove subscription:', error);
    }
  }

  // Show local notification (for testing)
  public async showLocalNotification(title: string, options: NotificationOptions): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/icons/bus-notification.png',
      badge: options.badge || '/icons/badge.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      data: options.data,
      vibrate: options.vibrate || [200, 100, 200],
      silent: options.silent,
      timestamp: options.timestamp || Date.now()
    });

    // Handle click events
    notification.onclick = () => {
      notification.close();
      
      if (options.data?.url) {
        window.open(options.data.url, '_blank');
      }
    };

    // Auto-close after 10 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  // Create booking reminder notification
  public createBookingReminderNotification(data: BookingReminderNotification): NotificationOptions {
    const actions: NotificationAction[] = [
      {
        action: 'confirm',
        title: data.canBook ? 'Confirm Booking' : 'Pay & Book',
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
    ];

    return {
      body: data.body,
      icon: '/icons/bus-notification.png',
      badge: '/icons/badge.png',
      tag: `booking-reminder-${data.scheduleId}`,
      requireInteraction: true,
      actions,
      data: {
        type: 'booking_reminder',
        notificationId: data.notificationId,
        scheduleId: data.scheduleId,
        scheduleDate: data.scheduleDate,
        departureTime: data.departureTime,
        routeName: data.routeName,
        boardingStop: data.boardingStop,
        canBook: data.canBook,
        paymentRequired: data.paymentRequired,
        url: `/dashboard/schedules?date=${data.scheduleDate}&schedule=${data.scheduleId}`
      },
      vibrate: [200, 100, 200, 100, 200],
      timestamp: Date.now()
    };
  }

  // Test booking reminder notification
  public async testBookingReminder(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testData: BookingReminderNotification = {
      title: '🚌 Test Trip Reminder - Route 101',
      body: 'Your test trip is tomorrow at 07:30 AM. Tap to confirm your booking!',
      scheduleId: 'test-schedule-123',
      scheduleDate: tomorrow.toISOString().split('T')[0],
      departureTime: '07:30:00',
      routeName: 'Test Route 101',
      boardingStop: 'Test Stop',
      canBook: true,
      paymentRequired: false,
      notificationId: 'test-notification-123'
    };

    const options = this.createBookingReminderNotification(testData);
    await this.showLocalNotification(testData.title, options);
  }

  // Get subscription status
  public async getSubscriptionStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    const supported = this.isSupported();
    const permission = this.getPermissionStatus();
    
    let subscribed = false;
    let subscription = null;

    if (supported) {
      try {
        // Ensure service worker is ready before checking subscription
        await this.ensureServiceWorkerReady();
        
        if (this.registration) {
          subscription = await this.registration.pushManager.getSubscription();
          subscribed = !!subscription;
          
          // Update internal subscription reference
          this.subscription = subscription;
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }

    return {
      supported,
      permission,
      subscribed,
      subscription
    };
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Enable/disable booking reminders
  public async setBookingRemindersEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.subscribe();
    } else {
      await this.unsubscribe();
    }

    // Save preference to localStorage
    localStorage.setItem('bookingRemindersEnabled', enabled.toString());
  }

  // Check if booking reminders are enabled
  public isBookingRemindersEnabled(): boolean {
    const stored = localStorage.getItem('bookingRemindersEnabled');
    return stored !== 'false'; // Default to true
  }

  // Request permission and subscribe in one action (for UI convenience)
  public async requestPermissionAndSubscribe(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already subscribed
      const status = await this.getSubscriptionStatus();
      if (status.subscribed) {
        return { success: true };
      }

      // Request permission if not already granted
      if (status.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          return { 
            success: false, 
            error: permission === 'denied' 
              ? 'Push notifications are blocked. Please enable them in your browser settings.' 
              : 'Push notification permission is required.'
          };
        }
      }

      // Subscribe to push notifications
      const subscription = await this.subscribe();
      
      if (subscription) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to create push subscription' };
      }

    } catch (error) {
      console.error('❌ Request permission and subscribe failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Update service worker
  public async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('🔄 Service Worker updated');
    } catch (error) {
      console.error('❌ Service Worker update failed:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Export types
export type {
  PushSubscriptionData,
  NotificationAction,
  NotificationOptions,
  BookingReminderNotification
};