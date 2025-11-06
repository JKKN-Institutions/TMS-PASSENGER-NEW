'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Wifi, WifiOff, AlertCircle, Play, Pause, Map, Satellite, Activity, Target } from 'lucide-react';
import DriverLocationTracker from '@/components/driver-location-tracker';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { useLocationSharing } from '@/lib/location-sharing-context';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const DriverLiveTrackingPage = () => {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { isSharing: isTracking, setIsSharing: setIsTracking } = useLocationSharing();
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          toast.error(t('tracking.login_access'));
          setIsLoading(false);
          return;
        }

        if (userType !== 'driver') {
          toast.error(t('tracking.drivers_only_access'));
          setIsLoading(false);
          return;
        }

        if (!user || !user.id) {
          toast.error(t('error.driver_info_not_found'));
          setIsLoading(false);
          return;
        }

        setDriverId(user.id);
        setDriverName(user.driver_name || user.full_name || user.name || 'Unknown Driver');
        
      } catch (error) {
        console.error('Error fetching driver info:', error);
        
        // Handle specific error types gracefully
        let errorMessage = 'Failed to load driver information';
        
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and refresh the page.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please refresh the page and try again.';
          } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (error.message.includes('forbidden') || error.message.includes('403')) {
            errorMessage = 'Access denied. Contact administrator for assistance.';
          } else if (error.message.includes('not found') || error.message.includes('404')) {
            errorMessage = 'Driver profile not found. Please contact support.';
          } else if (error.message.includes('server') || error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later or contact support.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverInfo();
  }, [isAuthenticated, userType, user, authLoading]);

  const handleLocationUpdate = (location: LocationData) => {
    setCurrentLocation(location);
  };

  const handleTrackingToggle = () => {
    setIsTracking(!isTracking);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-[#0b6d41] mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('tracking.loading_live')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">{t('location.access_denied')}</h2>
          <p className="text-red-600">{t('tracking.login_access')}</p>
        </div>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">{t('location.access_denied')}</h2>
          <p className="text-red-600">{t('tracking.drivers_only_access')}</p>
        </div>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">{t('location.info_not_found')}</h2>
          <p className="text-red-600">{t('location.unable_retrieve')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="bg-[#0b6d41] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{t('tracking.live_location_tracking_header')}</h1>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Satellite className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('tracking.tracking_status')}</p>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${
                isTracking ? 'text-[#0b6d41]' : 'text-gray-600'
              }`}>
                {isTracking ? t('tracking.active_status') : t('tracking.inactive_status')}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isTracking ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isTracking ? (
                <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b6d41]" />
              ) : (
                <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('tracking.location_status')}</p>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${
                currentLocation ? 'text-[#0b6d41]' : 'text-gray-600'
              }`}>
                {currentLocation ? t('tracking.available') : t('tracking.not_available')}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              currentLocation ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b6d41]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('tracking.driver')}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{driverName}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b6d41]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Controls */}
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{t('tracking.controls')}</h2>
          </div>
          <button
            onClick={handleTrackingToggle}
            className={`flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              isTracking
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                : 'bg-[#0b6d41] text-white hover:bg-[#085032] shadow-lg hover:shadow-xl'
            }`}
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{t('tracking.pause')}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{t('tracking.play')}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg min-w-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm text-gray-600 block truncate">{t('tracking.status_label')}</span>
              <span className={`text-sm sm:text-base font-medium block truncate ${
                isTracking ? 'text-[#0b6d41]' : 'text-gray-500'
              }`}>
                {isTracking ? t('tracking.active') : t('tracking.stopped')}
              </span>
            </div>
          </div>

          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg min-w-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm text-gray-600 block truncate">{t('tracking.location_label')}</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 block truncate">
                {currentLocation ? t('tracking.gps_available') : t('tracking.gps_not_available')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b6d41] flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{t('tracking.current_location_header')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2 gap-2">
                <MapPin className="w-4 h-4 text-[#0b6d41] flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-800 truncate">{t('tracking.coordinates')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{t('tracking.latitude')}</span>
                  <span className="font-mono text-xs sm:text-sm font-medium text-gray-900">
                    {currentLocation.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{t('tracking.longitude')}</span>
                  <span className="font-mono text-xs sm:text-sm font-medium text-gray-900">
                    {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2 gap-2">
                <Activity className="w-4 h-4 text-[#0b6d41] flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-green-800 truncate">{t('tracking.details')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{t('tracking.accuracy')}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    ±{currentLocation.accuracy.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{t('tracking.updated')}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Tracker Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{t('tracking.location_tracker_header')}</h2>
        </div>
        <div className="p-4 sm:p-5 md:p-6">
          <DriverLocationTracker
            driverId={driverId}
            driverName={driverName}
            isEnabled={isTracking}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverLiveTrackingPage;
