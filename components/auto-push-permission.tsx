"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle } from 'lucide-react';
import { pushNotificationService } from '@/lib/push-notifications';
import { useAuth } from '@/lib/auth/auth-context';
import toast from 'react-hot-toast';

interface AutoPushPermissionProps {
  // Delay before showing the prompt (in milliseconds)
  delay?: number;
  // Whether to show only once per session
  oncePerSession?: boolean;
}

export default function AutoPushPermission({ 
  delay = 3000, 
  oncePerSession = true 
}: AutoPushPermissionProps) {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }>({
    supported: false,
    permission: 'default',
    subscribed: false
  });

  // Check if we should show the prompt
  useEffect(() => {
    const checkAndShowPrompt = async () => {
      // Only proceed if user is authenticated
      if (!user?.id) return;

      // Set student ID for push service
      pushNotificationService.setStudentId(user.id);

      // Check session storage to avoid showing multiple times
      if (oncePerSession && sessionStorage.getItem('push-permission-prompted')) {
        return;
      }

      // Check localStorage for permanent dismissal
      const permanentlyDismissed = localStorage.getItem('push-permission-dismissed');
      if (permanentlyDismissed) {
        return;
      }

      // Check browser support and current status
      try {
        const status = await pushNotificationService.getSubscriptionStatus();
        setPushStatus(status);

        console.log('🔔 Push notification status:', status);

        // Show prompt if:
        // 1. Browser supports push notifications
        // 2. Permission is 'default' (not granted or denied)
        // 3. User is not already subscribed
        if (status.supported && status.permission === 'default' && !status.subscribed) {
          setTimeout(() => {
            setShowPrompt(true);
            console.log('📢 Showing push notification permission prompt');
          }, delay);
        } else {
          console.log('📢 Not showing push permission prompt:', {
            supported: status.supported,
            permission: status.permission,
            subscribed: status.subscribed
          });
        }
      } catch (error) {
        console.error('Error checking push notification status:', error);
      }
    };

    checkAndShowPrompt();
  }, [user, delay, oncePerSession]);

  // Function to refresh push status after changes
  const refreshPushStatus = async () => {
    try {
      const status = await pushNotificationService.getSubscriptionStatus();
      setPushStatus(status);
      console.log('🔄 Push status refreshed:', status);
    } catch (error) {
      console.error('Error refreshing push status:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔔 User clicked to enable push notifications');
      
      const result = await pushNotificationService.requestPermissionAndSubscribe();
      
      if (result.success) {
        console.log('✅ Push notifications enabled successfully');
        
        // Refresh the push status state to reflect the change
        await refreshPushStatus();
        
        toast.success('🔔 Push notifications enabled! You\'ll receive important updates about your transport.');
        
        // Send a welcome notification
        try {
          const response = await fetch('/api/notifications/test-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎉 Welcome to TMS Notifications!',
              body: 'You\'ll now receive important updates about your transport bookings and schedules.',
              data: { type: 'welcome' }
            })
          });
          
          if (response.ok) {
            console.log('✅ Welcome notification sent');
          }
        } catch (testError) {
          console.log('⚠️ Welcome notification failed (non-critical):', testError);
        }
        
        setShowPrompt(false);
        
        // Mark as prompted in session storage
        if (oncePerSession) {
          sessionStorage.setItem('push-permission-prompted', 'true');
        }
      } else {
        console.log('❌ Push notifications not enabled:', result.error);
        toast.error(result.error || 'Failed to enable push notifications');
        
        // Refresh status even on failure to get the latest permission state
        await refreshPushStatus();
        
        setShowPrompt(false);
        
        // Still mark as prompted even if denied
        if (oncePerSession) {
          sessionStorage.setItem('push-permission-prompted', 'true');
        }
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications');
      
      // Refresh status to ensure we have the latest state
      await refreshPushStatus();
      
      setShowPrompt(false);
      
      // Mark as prompted even on error
      if (oncePerSession) {
        sessionStorage.setItem('push-permission-prompted', 'true');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (permanent = false) => {
    console.log('❌ User dismissed push notification prompt', permanent ? '(permanently)' : '(session only)');
    setShowPrompt(false);
    
    if (permanent) {
      // Mark as permanently dismissed
      localStorage.setItem('push-permission-dismissed', 'true');
      toast('Push notifications disabled. You can re-enable them anytime in Settings.', {
        icon: 'ℹ️',
        duration: 4000
      });
    } else {
      // Mark as prompted in session storage
      if (oncePerSession) {
        sessionStorage.setItem('push-permission-prompted', 'true');
      }
      
      toast('You can enable notifications later in Settings → Notifications', {
        icon: 'ℹ️',
        duration: 4000
      });
    }
  };

  // Don't render anything if not showing prompt
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300 md:left-auto md:right-6 md:bottom-6 md:max-w-md">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              📱 Stay Updated with Transport Notifications
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get instant alerts about route changes, booking confirmations, and important transport updates.
            </p>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Enable Notifications
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleDismiss(false)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
              
              <button
                onClick={() => handleDismiss(true)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors text-left"
              >
                Don't ask again
              </button>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={() => handleDismiss(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Trust indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span>We respect your privacy. You can disable this anytime in settings.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
