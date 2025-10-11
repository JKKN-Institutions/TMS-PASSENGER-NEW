"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, Settings } from 'lucide-react';
import { pushNotificationService } from '@/lib/push-notifications';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Reminder banner for students who haven't enabled push notifications
 * Shows in dashboard after they've dismissed the initial prompt
 */
export default function PushNotificationReminderBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkPushStatus = async () => {
      // Only check if user is authenticated
      if (!user?.id) return;

      // Set student ID
      pushNotificationService.setStudentId(user.id);

      // Check if banner was dismissed for this session
      if (sessionStorage.getItem('push-reminder-banner-dismissed')) {
        return;
      }

      // Check if permanently dismissed (last reminder was less than 7 days ago)
      const lastDismissed = localStorage.getItem('push-reminder-banner-last-dismissed');
      if (lastDismissed) {
        const daysSinceLastDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastDismissed < 7) {
          return; // Don't show if dismissed within last 7 days
        }
      }

      try {
        const status = await pushNotificationService.getSubscriptionStatus();
        
        // Show banner if:
        // 1. Push is supported
        // 2. Permission is not granted (default or denied)
        // 3. Not already subscribed
        if (status.supported && status.permission !== 'granted' && !status.subscribed) {
          // Wait a bit before showing to avoid overwhelming the user
          setTimeout(() => {
            setShowBanner(true);
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking push status for reminder banner:', error);
      }
    };

    checkPushStatus();
  }, [user]);

  const handleEnableNow = async () => {
    setIsLoading(true);
    
    try {
      const result = await pushNotificationService.requestPermissionAndSubscribe();
      
      if (result.success) {
        toast.success('🔔 Push notifications enabled successfully!');
        setShowBanner(false);
        sessionStorage.setItem('push-reminder-banner-dismissed', 'true');
      } else {
        toast.error(result.error || 'Failed to enable push notifications');
        // Still hide banner after attempt
        setShowBanner(false);
        sessionStorage.setItem('push-reminder-banner-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/dashboard/notifications');
    setShowBanner(false);
    sessionStorage.setItem('push-reminder-banner-dismissed', 'true');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      setShowBanner(false);
    }, 300);
    
    // Store dismissal timestamp
    localStorage.setItem('push-reminder-banner-last-dismissed', Date.now().toString());
    sessionStorage.setItem('push-reminder-banner-dismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div 
      className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm transition-all duration-300 ${
        isDismissed ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Bell className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            📬 Never miss important transport updates!
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Enable push notifications to get instant alerts about:
          </p>
          
          <ul className="text-xs text-gray-600 space-y-1 mb-3 ml-4">
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Booking confirmations & reminders
            </li>
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
              Route changes & schedule updates
            </li>
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Bus arrival notifications
            </li>
          </ul>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleEnableNow}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-1.5 h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3 mr-1.5" />
                  Enable Now
                </>
              )}
            </button>
            
            <button
              onClick={handleGoToSettings}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm"
            >
              <Settings className="h-3 w-3 mr-1.5" />
              Settings
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2"
            >
              Remind me later
            </button>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-3 pt-3 border-t border-blue-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>💡 Tip: You can change this anytime in notification settings</span>
          <span className="text-blue-600 font-medium">5 students already enabled</span>
        </div>
      </div>
    </div>
  );
}


