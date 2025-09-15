'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  AlertCircle, 
  Shield,
  Smartphone,
  BellOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pushNotificationService } from '@/lib/push-notifications';

interface PushNotificationSetupProps {
  studentId: string;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
}

const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({
  studentId,
  onPermissionGranted,
  onPermissionDenied,
  className = ''
}) => {
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [setupStep, setSetupStep] = useState<'intro' | 'requesting' | 'success' | 'denied'>('intro');

  useEffect(() => {
    initializePushStatus();
  }, [studentId]);

  const initializePushStatus = async () => {
    try {
      // Set student ID for push service
      pushNotificationService.setStudentId(studentId);

      // Check push notification status
      const status = await pushNotificationService.getSubscriptionStatus();
      setPushSupported(status.supported);
      setPermission(status.permission);
      setIsSubscribed(status.subscribed);

      // Show permission prompt if supported but not granted
      if (status.supported && status.permission === 'default') {
        setShowPermissionPrompt(true);
      }

      console.log('📱 Push notification status:', status);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const handleEnableNotifications = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported on this device');
      return;
    }

    setIsLoading(true);
    setSetupStep('requesting');

    try {
      // Request permission
      const permission = await pushNotificationService.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        toast.success('🔔 Notification permission granted!');
        
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribe();
        
        if (subscription) {
          setIsSubscribed(true);
          setSetupStep('success');
          setShowPermissionPrompt(false);
          onPermissionGranted?.();
          
          toast.success('✅ Push notifications enabled! You\'ll now receive important updates.');
          
          // Send a test notification
          setTimeout(() => {
            sendTestNotification();
          }, 2000);
        } else {
          throw new Error('Failed to create subscription');
        }
      } else if (permission === 'denied') {
        setSetupStep('denied');
        onPermissionDenied?.();
        toast.error('❌ Notification permission denied. You can enable it later in settings.');
      } else {
        // Permission is still 'default' - user dismissed prompt
        setSetupStep('intro');
        toast.error('Please allow notifications to receive important updates');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications. Please try again.');
      setSetupStep('intro');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          testType: 'welcome'
        })
      });

      if (response.ok) {
        console.log('✅ Test notification sent');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const handleDismiss = () => {
    setShowPermissionPrompt(false);
    // Save that user dismissed this for this session
    sessionStorage.setItem('pushPromptDismissed', 'true');
  };

  // Don't show if already subscribed or permission denied
  if (isSubscribed || permission === 'denied') {
    return null;
  }

  // Don't show if user dismissed this session
  if (sessionStorage.getItem('pushPromptDismissed') === 'true' && !showPermissionPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPermissionPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-white border border-blue-200 rounded-lg shadow-lg p-4 mb-4 ${className}`}
        >
          {/* Setup Steps */}
          {setupStep === 'intro' && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Enable Push Notifications
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Stay updated with important bus schedules, booking reminders, and transport updates. 
                  You'll receive timely notifications about your trips.
                </p>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Booking reminders
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Schedule updates
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Important alerts
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isLoading || !pushSupported}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <BellRing className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Enabling...' : 'Enable Notifications'}
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="inline-flex items-center px-3 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 focus:outline-none"
                  >
                    Not now
                  </button>
                </div>

                {!pushSupported && (
                  <div className="mt-2 flex items-center text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Push notifications are not supported on this device
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {setupStep === 'requesting' && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Requesting Permission...
                </h3>
                <p className="text-sm text-gray-600">
                  Please click "Allow" when your browser asks for notification permission.
                </p>
              </div>
            </div>
          )}

          {setupStep === 'success' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-3"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  🎉 Notifications Enabled!
                </h3>
                <p className="text-sm text-green-700">
                  You're all set! You'll receive important updates about your transport bookings.
                  A test notification will be sent shortly.
                </p>
              </div>
            </motion.div>
          )}

          {setupStep === 'denied' && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <BellOff className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  Notifications Blocked
                </h3>
                <p className="text-sm text-red-700 mb-2">
                  You can enable notifications later by:
                </p>
                <ol className="text-xs text-red-600 list-decimal list-inside space-y-1">
                  <li>Clicking the lock icon in your browser's address bar</li>
                  <li>Selecting "Allow" for notifications</li>
                  <li>Refreshing this page</li>
                </ol>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationSetup;
