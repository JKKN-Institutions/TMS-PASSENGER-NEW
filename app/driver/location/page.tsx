'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Shield, Clock, Wifi, WifiOff, Navigation } from 'lucide-react';
import DriverLocationTracker from '@/components/driver-location-tracker';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';

const DriverLocationPage = () => {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Default location settings
  const defaultSettings = {
    locationSharingEnabled: true,
    locationTrackingEnabled: true,
    updateInterval: 30000, // 30 seconds
    shareWithAdmin: true,
    shareWithPassengers: true,
    trackingStatus: 'active'
  };

  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          toast.error('Please log in to access location settings');
          setIsLoading(false);
          return;
        }

        if (userType !== 'driver') {
          toast.error('Only drivers can access location settings');
          setIsLoading(false);
          return;
        }

        if (!user || !user.id) {
          toast.error('Driver information not found');
          setIsLoading(false);
          return;
        }

        setDriverId(user.id);
        setDriverName('Unknown Driver');
        
        // Debug logging
        console.log('🔍 [DEBUG] Driver location page - user data:', {
          userId: user.id,
          userEmail: user.email
        });
        
        // More detailed debug logging
        console.log('🔍 [DEBUG] Complete user object:', user);
        console.log('🔍 [DEBUG] User type:', typeof user);
        console.log('🔍 [DEBUG] User keys:', Object.keys(user || {}));
        
      } catch (error) {
        console.error('Error fetching driver info:', error);
        toast.error('Failed to load driver information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverInfo();
  }, [isAuthenticated, userType, user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('location.loading_settings')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('location.access_denied')}</h2>
        <p className="text-gray-600">{t('location.login_required_msg')}</p>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('location.access_denied')}</h2>
        <p className="text-gray-600">{t('location.drivers_only')}</p>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('location.info_not_found')}</h2>
        <p className="text-gray-600">{t('location.unable_retrieve')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('location.location_tracking_title')}</h2>
              <p className="text-sm text-gray-600">{t('location.realtime_sharing')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-green-600">
              <Wifi className="w-4 h-4 mr-1" />
              {t('location.sharing_enabled_status')}
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{t('location.current_status')}</h3>
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {t('status.active')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">{t('location.update_interval_label')}</span>
            <span className="ml-auto font-medium">{defaultSettings.updateInterval / 1000}s</span>
          </div>
          <div className="flex items-center">
            <Navigation className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">{t('location.tracking_label')}</span>
            <span className="ml-auto font-medium text-green-600">
              {t('status.active')}
            </span>
          </div>
        </div>
      </div>

      {/* Location Tracker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{t('location.live_location')}</h3>
        </div>
        <div className="p-4">
          <DriverLocationTracker 
            driverId={driverId}
            driverName={driverName}
            driverEmail={user?.email}
            isEnabled={defaultSettings.locationTrackingEnabled}
            updateInterval={defaultSettings.updateInterval}
            settings={defaultSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverLocationPage;
