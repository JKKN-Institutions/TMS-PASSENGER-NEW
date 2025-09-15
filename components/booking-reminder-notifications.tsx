'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Bus,
  Clock,
  MapPin,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Settings,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react';
import { pushNotificationService } from '@/lib/push-notifications';
import toast from 'react-hot-toast';

interface BookingReminderNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking_reminder' | 'booking_confirmed' | 'booking_failed' | 'booking_declined';
  scheduleId: string;
  scheduleDate: string;
  departureTime: string;
  routeName: string;
  boardingStop: string;
  canBook: boolean;
  paymentRequired: boolean;
  created_at: string;
  read: boolean;
  metadata?: {
    bookingId?: string;
    errorType?: string;
    paymentOptions?: any;
  };
}

interface BookingReminderNotificationsProps {
  studentId: string;
  className?: string;
}

const BookingReminderNotifications: React.FC<BookingReminderNotificationsProps> = ({
  studentId,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<BookingReminderNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    initializePushNotifications();
    fetchBookingNotifications();
  }, [studentId]);

  const initializePushNotifications = async () => {
    try {
      // Set student ID for push service
      pushNotificationService.setStudentId(studentId);

      // Check push notification status
      const status = await pushNotificationService.getSubscriptionStatus();
      setPushSupported(status.supported);
      setPermission(status.permission);
      setPushEnabled(status.subscribed);

      console.log('📱 Push notification status:', status);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const fetchBookingNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/notifications?userId=${studentId}&category=booking&limit=50`);
      const result = await response.json();

      if (result.success && result.data.notifications) {
        const bookingNotifications = result.data.notifications.filter((n: any) => 
          n.tags?.includes('booking_reminder') || 
          n.tags?.includes('booking_confirmed') ||
          n.tags?.includes('booking_failed') ||
          n.tags?.includes('booking_declined')
        );
        
        setNotifications(bookingNotifications);
      }
    } catch (error) {
      console.error('Error fetching booking notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      if (!pushSupported) {
        toast.error('Push notifications are not supported on this device');
        return;
      }

      const subscription = await pushNotificationService.subscribe();
      
      if (subscription) {
        setPushEnabled(true);
        setPermission('granted');
        toast.success('Push notifications enabled! You\'ll receive booking reminders.');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast.error('Failed to disable push notifications');
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.testBookingReminder();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const handleBookingAction = async (notification: BookingReminderNotification, action: 'confirm' | 'decline') => {
    try {
      const response = await fetch('/api/notifications/booking-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notificationId: notification.id,
          scheduleId: notification.scheduleId,
          studentId,
          scheduleDate: notification.scheduleDate,
          departureTime: notification.departureTime,
          routeName: notification.routeName,
          boardingStop: notification.boardingStop
        })
      });

      const result = await response.json();

      if (result.success) {
        if (action === 'confirm') {
          if (result.result.success) {
            toast.success('Booking confirmed successfully!');
          } else {
            toast.error(result.result.message || 'Failed to confirm booking');
          }
        } else {
          toast.success('Thanks for letting us know!');
        }

        // Refresh notifications
        await fetchBookingNotifications();
      } else {
        toast.error('Failed to process your request');
      }
    } catch (error) {
      console.error('Error processing booking action:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: studentId })
      });

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_reminder':
        return <Bus className="w-5 h-5 text-blue-500" />;
      case 'booking_confirmed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'booking_failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'booking_declined':
        return <X className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Trip Reminders</h2>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} new reminders` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">
                  {pushEnabled ? 'Enabled - You\'ll get reminders' : 'Disabled - Enable to get reminders'}
                </p>
              </div>
            </div>
            
            {pushSupported && (
              <button
                onClick={pushEnabled ? handleDisablePushNotifications : handleEnablePushNotifications}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pushEnabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {pushEnabled ? 'Disable' : 'Enable'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Notification Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Sound notifications</span>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Daily reminders</span>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>

                {pushEnabled && (
                  <button
                    onClick={handleTestNotification}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Send Test Notification
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No trip reminders yet</p>
            <p className="text-sm text-gray-500 mt-1">
              You'll receive reminders the day before your scheduled trips
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-semibold ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {notification.message}
                    </p>
                    
                    {/* Trip Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Bus className="w-3 h-3" />
                          <span>{notification.routeName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{notification.departureTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{notification.boardingStop}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Trip Date: {new Date(notification.scheduleDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {notification.type === 'booking_reminder' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(notification, 'confirm');
                          }}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            notification.canBook
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          {notification.paymentRequired ? (
                            <>
                              <CreditCard className="w-3 h-3" />
                              <span>Pay & Book</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(notification, 'decline');
                          }}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                        >
                          <X className="w-3 h-3" />
                          <span>Not Traveling</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Status Indicators */}
                    {notification.type === 'booking_confirmed' && (
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ✅ Booking Confirmed
                        </div>
                        {notification.metadata?.bookingId && (
                          <span className="text-gray-500">
                            ID: {notification.metadata.bookingId}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {notification.type === 'booking_failed' && (
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs inline-block">
                        ❌ Booking Failed
                      </div>
                    )}
                    
                    {notification.type === 'booking_declined' && (
                      <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-block">
                        👍 Response Noted
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingReminderNotifications;
