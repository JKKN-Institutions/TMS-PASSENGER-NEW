'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Settings, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Bus,
  CreditCard,
  Shield,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import { pushNotificationService } from '@/lib/push-notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'transport' | 'payment' | 'system' | 'emergency';
  actionable: boolean;
  primary_action?: {
    text: string;
    url: string;
  };
  secondary_action?: {
    text: string;
    url: string;
  };
  tags?: string[];
  created_at: string;
  read: boolean;
  important?: boolean;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    transport: boolean;
    payment: boolean;
    system: boolean;
    emergency: boolean;
  };
  types: {
    info: boolean;
    warning: boolean;
    error: boolean;
    success: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    categories: {
      transport: true,
      payment: true,
      system: true,
      emergency: true
    },
    types: {
      info: true,
      warning: true,
      error: true,
      success: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00'
    },
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  // Student state management
  const [student, setStudent] = useState<any>(null);
  
  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Memoized student ID to prevent unnecessary re-renders
  const studentId = useMemo(() => student?.student_id || '', [student?.student_id]);

  // Initialize student data once
  useEffect(() => {
    const initializeStudent = () => {
      try {
        if (!sessionManager.isAuthenticated()) {
          toast.error('Please login to continue');
          window.location.href = '/login';
          return;
        }

        const currentStudent = sessionManager.getCurrentStudent();
        if (!currentStudent) {
          toast.error('Invalid session data');
          window.location.href = '/login';
          return;
        }

        // Set student data once
        setStudent(currentStudent);
      } catch (error) {
        console.error('Error initializing student:', error);
        toast.error('Failed to load user data');
      }
    };

    initializeStudent();
  }, []); // Only run once on mount

  // Fetch initial data when student is loaded
  useEffect(() => {
    if (studentId) {
      fetchNotifications();
      fetchSettings();
      initializePushStatus();
    }
  }, [studentId]); // Only when student ID changes

  // Fetch notifications when filters or pagination change
  useEffect(() => {
    if (studentId) {
      fetchNotifications();
    }
  }, [currentPage, selectedCategory, selectedType, showUnreadOnly, studentId]);

  const fetchNotifications = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: studentId,
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(showUnreadOnly && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data.notifications || []);
        setTotalPages(Math.ceil((result.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [studentId, currentPage, pageSize, selectedCategory, selectedType, showUnreadOnly]);

  const fetchSettings = useCallback(async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/notifications/settings?userId=${studentId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [studentId]);

  const initializePushStatus = useCallback(async () => {
    if (!studentId) return;
    
    try {
      // Set student ID for push service
      pushNotificationService.setStudentId(studentId);

      // Check push notification status
      const status = await pushNotificationService.getSubscriptionStatus();
      setPushSupported(status.supported);
      setPushPermission(status.permission);
      setIsSubscribed(status.subscribed);

      console.log('📱 Push notification status:', status);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }, [studentId]);

  const handlePushNotificationToggle = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported on this device');
      return;
    }

    if (pushPermission === 'denied') {
      toast.error('Push notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    setPushLoading(true);

    try {
      if (!isSubscribed && pushPermission !== 'granted') {
        // Request permission first
        const permission = await pushNotificationService.requestPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
          toast.error('Push notification permission is required to enable notifications');
          return;
        }
      }

      if (!isSubscribed) {
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribe();
        
        if (subscription) {
          setIsSubscribed(true);
          await updateSettings({ pushEnabled: true });
          toast.success('✅ Push notifications enabled! You\'ll now receive important updates.');
          
          // Send a test notification
          setTimeout(() => {
            sendTestNotification();
          }, 2000);
        } else {
          throw new Error('Failed to create subscription');
        }
      } else {
        // Unsubscribe from push notifications
        const unsubscribed = await pushNotificationService.unsubscribe();
        
        if (unsubscribed) {
          setIsSubscribed(false);
          await updateSettings({ pushEnabled: false });
          toast.success('Push notifications disabled');
        } else {
          throw new Error('Failed to unsubscribe');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to update push notification settings. Please try again.');
    } finally {
      setPushLoading(false);
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

  const markAsRead = async (notificationId: string) => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId })
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!studentId) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, settings: updatedSettings })
      });
      
      if (response.ok) {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleManualRefresh = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchSettings()]);
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return Bus;
      case 'payment': return CreditCard;
      case 'system': return Settings;
      case 'emergency': return Shield;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleActionClick = (action: { text: string; url: string }) => {
    if (action.url.startsWith('http')) {
      window.open(action.url, '_blank');
    } else {
      window.location.href = action.url;
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const clearAllSelections = () => {
    setSelectedNotifications([]);
  };

  // Show loading state while student is being initialized
  if (!student) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-green-200 to-yellow-200 rounded-xl w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-r from-green-100 to-yellow-100 rounded-xl h-32 shadow-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 min-w-0 bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 min-h-screen">
              {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">Notifications</h1>
              <p className="text-sm sm:text-base text-gray-700 font-medium mt-1">
                Stay updated with your transport and payment notifications
              </p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-5 py-2 text-xs sm:text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-5 py-2 text-xs sm:text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-yellow-500 rounded-xl hover:from-green-700 hover:to-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full mr-3 shadow-md">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">Total</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mr-3 shadow-md">
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex-shrink-0"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">Unread</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mr-3 shadow-md">
                <Bus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">Transport</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {notifications.filter(n => n.category === 'transport').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-yellow-100 to-green-100 rounded-full mr-3 shadow-md">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">Payment</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {notifications.filter(n => n.category === 'payment').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100 p-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-6">Notification Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">General</h4>
              <div className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">Push notifications</label>
                      <p className="text-xs text-gray-500 mt-1">
                        {!pushSupported ? 'Not supported on this device' :
                         pushPermission === 'denied' ? 'Blocked by browser settings' :
                         !isSubscribed ? 'Click to enable browser notifications' :
                         'Enabled - you\'ll receive important updates'}
                      </p>
                    </div>
                    <button
                      onClick={handlePushNotificationToggle}
                      disabled={!pushSupported || pushLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isSubscribed ? 'bg-gradient-to-r from-green-500 to-yellow-500' : 'bg-gray-200'
                      } ${(!pushSupported || pushLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isSubscribed ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                      {pushLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-white"></div>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {pushPermission === 'denied' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-700">
                          <p className="font-medium">Push notifications are blocked</p>
                          <p className="mt-1">To enable:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-0.5">
                            <li>Click the lock icon in your browser's address bar</li>
                            <li>Select "Allow" for notifications</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {pushSupported && pushPermission === 'granted' && isSubscribed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="text-xs text-green-700">
                          <p className="font-medium">Push notifications are active</p>
                          <p className="mt-1">You'll receive booking reminders and important updates</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {pushSupported && isSubscribed && (
                    <button
                      onClick={sendTestNotification}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Send test notification
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Sound notifications</label>
                  <button
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-gradient-to-r from-green-500 to-yellow-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Categories</h4>
              <div className="space-y-3">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 capitalize">{category}</label>
                    <button
                      onClick={() => updateSettings({
                        categories: { ...settings.categories, [category]: !enabled }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-gradient-to-r from-green-500 to-yellow-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-sm bg-white shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="transport">Transport</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
              <option value="emergency">Emergency</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-sm bg-white shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
            
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                showUnreadOnly 
                  ? 'bg-gradient-to-r from-green-100 to-yellow-100 text-green-800 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              Unread only
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-green-100">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
            <p className="text-green-700 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="p-4 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full w-20 h-20 mx-auto mb-6 shadow-md">
              <Bell className="w-12 h-12 text-green-600 mx-auto mt-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No notifications found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || showUnreadOnly
                ? 'Try adjusting your filters to see more results'
                : 'You\'re all caught up! No new notifications at the moment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const TypeIcon = getNotificationIcon(notification.type);
              const CategoryIcon = getCategoryIcon(notification.category);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 lg:p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 transition-all duration-300 ${
                    !notification.read ? 'bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-green-400' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                    <div className="flex-shrink-0">
                      <TypeIcon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                        notification.type === 'error' ? 'text-red-500' :
                        notification.type === 'warning' ? 'text-yellow-500' :
                        notification.type === 'success' ? 'text-green-500' :
                        'text-blue-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <CategoryIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 break-words ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getCategoryColor(notification.category)}`}>
                            {notification.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {notification.actionable && notification.primary_action && (
                            <button
                              onClick={() => handleActionClick(notification.primary_action!)}
                              className="inline-flex items-center space-x-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full transition-all duration-200 border border-green-200"
                            >
                              <span className="truncate font-medium">{notification.primary_action.text}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </button>
                          )}
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-all duration-200 border border-green-200"
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, notifications.length)} of {notifications.length} notifications
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-green-600 to-yellow-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 