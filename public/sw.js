// Enhanced Service Worker for TMS Passenger App
// Handles push notifications, caching, and offline functionality

const CACHE_NAME = 'tms-passenger-v1.2.0';
const STATIC_CACHE_NAME = 'tms-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'tms-dynamic-v1.2.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/dashboard/schedules',
  '/dashboard/bookings',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/bus-notification.png',
  '/icons/success-notification.png',
  '/icons/warning-notification.png',
  '/icons/error-notification.png',
  '/icons/info-notification.png',
  '/icons/confirm.png',
  '/icons/view.png',
  '/icons/dismiss.png',
  '/icons/badge.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/routes/available',
  '/api/schedules/availability',
  '/api/notifications'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  // Skip waiting immediately for faster activation
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('📦 Caching static files');
      // Cache files in the background, don't block activation
      return cache.addAll(STATIC_FILES).catch((error) => {
        console.warn('⚠️ Failed to cache some files:', error);
        // Don't fail installation if caching fails
        return Promise.resolve();
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  // Claim clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(handleDynamicRequest(request));
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📱 Push data:', data);

    const options = {
      body: data.body || data.message,
      icon: data.icon || '/icons/bus-notification.png',
      badge: data.badge || '/icons/badge.png',
      tag: data.tag || 'tms-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TMS Notification', options)
    );

  } catch (error) {
    console.error('Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('TMS Notification', {
        body: 'You have a new notification from TMS',
        icon: '/icons/bus-notification.png',
        badge: '/icons/badge.png'
      })
    );
  }
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (data.type === 'booking_reminder') {
    event.waitUntil(handleBookingReminderAction(action, data));
  } else if (data.type === 'booking_followup') {
    event.waitUntil(handleFollowupAction(data));
  } else {
    // Default action - open the app
    event.waitUntil(openApp(data.url || '/dashboard'));
  }
});

// Handle booking reminder notification actions
async function handleBookingReminderAction(action, data) {
  console.log('🎯 Handling booking reminder action:', action, data);

  try {
    switch (action) {
      case 'confirm':
        await handleBookingConfirmation(data);
        break;
      
      case 'view':
        await openApp(data.url || `/dashboard/schedules?date=${data.scheduleDate}&schedule=${data.scheduleId}`);
        break;
      
      case 'dismiss':
        await handleBookingDecline(data);
        break;
      
      default:
        // No action clicked, just open the app
        await openApp(data.url || `/dashboard/schedules?date=${data.scheduleDate}`);
        break;
    }
  } catch (error) {
    console.error('Error handling booking reminder action:', error);
    await openApp('/dashboard');
  }
}

// Handle booking confirmation
async function handleBookingConfirmation(data) {
  try {
    console.log('✅ Processing booking confirmation');

    // Get student ID from IndexedDB or localStorage
    const studentId = await getStudentId();
    
    if (!studentId) {
      console.error('Student ID not found');
      await openApp('/login');
      return;
    }

    // Call booking action API
    const response = await fetch('/api/notifications/booking-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'confirm',
        notificationId: data.notificationId,
        scheduleId: data.scheduleId,
        studentId: studentId,
        scheduleDate: data.scheduleDate,
        departureTime: data.departureTime,
        routeName: data.routeName,
        boardingStop: data.boardingStop
      })
    });

    const result = await response.json();

    if (result.success && result.result.success) {
      // Show success notification
      await self.registration.showNotification('✅ Booking Confirmed!', {
        body: `Your trip on ${data.routeName} tomorrow is confirmed. Have a safe journey!`,
        icon: '/icons/success-notification.png',
        badge: '/icons/badge.png',
        tag: 'booking-confirmed',
        actions: [
          {
            action: 'view_booking',
            title: 'View Booking',
            icon: '/icons/view.png'
          }
        ],
        data: {
          type: 'booking_confirmed',
          bookingId: result.result.bookingId,
          url: `/dashboard/bookings?booking=${result.result.bookingId}`
        }
      });
    } else {
      // Show error notification
      const errorMessage = result.result?.message || 'Unable to confirm booking';
      await self.registration.showNotification('❌ Booking Failed', {
        body: errorMessage,
        icon: '/icons/error-notification.png',
        badge: '/icons/badge.png',
        tag: 'booking-failed',
        actions: [
          {
            action: 'retry',
            title: 'Try Again',
            icon: '/icons/confirm.png'
          }
        ],
        data: {
          type: 'booking_failed',
          url: `/dashboard/schedules?date=${data.scheduleDate}&schedule=${data.scheduleId}`
        }
      });
    }

  } catch (error) {
    console.error('Error in booking confirmation:', error);
    
    await self.registration.showNotification('❌ Connection Error', {
      body: 'Unable to confirm booking. Please check your connection and try again.',
      icon: '/icons/error-notification.png',
      badge: '/icons/badge.png',
      tag: 'connection-error'
    });
  }
}

// Handle booking decline
async function handleBookingDecline(data) {
  try {
    console.log('❌ Processing booking decline');

    const studentId = await getStudentId();
    
    if (!studentId) {
      console.error('Student ID not found');
      await openApp('/login');
      return;
    }

    // Call booking action API
    const response = await fetch('/api/notifications/booking-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'decline',
        notificationId: data.notificationId,
        scheduleId: data.scheduleId,
        studentId: studentId,
        scheduleDate: data.scheduleDate,
        departureTime: data.departureTime,
        routeName: data.routeName
      })
    });

    const result = await response.json();

    if (result.success) {
      // Show acknowledgment notification
      await self.registration.showNotification('👍 Got It!', {
        body: `We've noted that you won't be traveling tomorrow. Thanks for letting us know!`,
        icon: '/icons/info-notification.png',
        badge: '/icons/badge.png',
        tag: 'booking-declined',
        actions: [
          {
            action: 'change_mind',
            title: 'Changed Mind?',
            icon: '/icons/confirm.png'
          }
        ],
        data: {
          type: 'booking_declined',
          url: `/dashboard/schedules?date=${data.scheduleDate}&schedule=${data.scheduleId}`
        }
      });
    }

  } catch (error) {
    console.error('Error in booking decline:', error);
  }
}

// Handle follow-up notification actions
async function handleFollowupAction(data) {
  await openApp(data.url || '/dashboard');
}

// Open the app or focus existing window
async function openApp(url = '/dashboard') {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // If app is already open, focus it and navigate
  if (clients.length > 0) {
    const client = clients[0];
    await client.focus();
    
    if (client.navigate && url !== '/dashboard') {
      await client.navigate(url);
    }
    
    return client;
  }
  
  // Open new window
  return self.clients.openWindow(url);
}

// Get student ID from storage
async function getStudentId() {
  try {
    // Try to get from clients first
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length > 0) {
      // Send message to client to get student ID
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.studentId);
        };
        
        clients[0].postMessage({
          type: 'GET_STUDENT_ID'
        }, [messageChannel.port2]);
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error getting student ID:', error);
    return null;
  }
}

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );
  
  if (!shouldCache) {
    // Network only for non-cacheable APIs
    return fetch(request);
  }
  
  try {
    // Network first strategy for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch and cache
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data.type === 'GET_STUDENT_ID') {
    // This is handled by the main thread, SW just acknowledges
    event.ports[0].postMessage({ studentId: null });
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'booking-action') {
    event.waitUntil(syncBookingActions());
  }
});

// Sync pending booking actions when back online
async function syncBookingActions() {
  try {
    // This would sync any pending booking actions stored in IndexedDB
    console.log('🔄 Syncing pending booking actions...');
    // Implementation would depend on your offline storage strategy
  } catch (error) {
    console.error('Error syncing booking actions:', error);
  }
}