'use client';

import React, { useState, useEffect } from 'react';
import { MapPinned, MapPinOff, AlertCircle, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { useLocationSharing } from '@/lib/location-sharing-context';
import DriverLocationTracker from './driver-location-tracker';

interface LocationError {
  type: 'permission' | 'network' | 'timeout' | 'unavailable' | 'unknown';
  message: string;
}

export default function DriverLocationHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isSharing, setIsSharing, setLastUpdate } = useLocationSharing();
  const [error, setError] = useState<LocationError | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showError, setShowError] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error?.type === 'network') {
        setError(null);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError({
        type: 'network',
        message: t('location.error_offline')
      });
      setIsSharing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, t]);

  const handleToggleSharing = async () => {
    setError(null);

    if (isSharing) {
      setIsSharing(false);
      setLastUpdate(null);
      return;
    }

    // Check if offline
    if (!isOnline) {
      setError({
        type: 'network',
        message: t('location.error_offline')
      });
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError({
        type: 'unavailable',
        message: t('location.error_not_supported')
      });
      return;
    }

    // Request permission
    try {
      const result = await requestLocationPermission();
      if (result) {
        setIsSharing(true);
      }
    } catch (err: any) {
      handleLocationError(err);
    }
  };

  const requestLocationPermission = (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted');
          resolve(true);
        },
        (error) => {
          handleLocationError(error);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleLocationError = (error: any) => {
    console.error('❌ Location error:', error);

    if (error.code === 1 || error.message?.includes('denied')) {
      setError({
        type: 'permission',
        message: t('location.error_permission_denied')
      });
    } else if (error.code === 2 || error.message?.includes('unavailable')) {
      setError({
        type: 'unavailable',
        message: t('location.error_position_unavailable')
      });
    } else if (error.code === 3 || error.message?.includes('timeout')) {
      setError({
        type: 'timeout',
        message: t('location.error_timeout')
      });
    } else {
      setError({
        type: 'unknown',
        message: t('location.error_unknown')
      });
    }

    setIsSharing(false);
  };

  const handleLocationUpdate = (location: any) => {
    setLastUpdate(new Date());
    setError(null);
  };

  const getErrorIcon = () => {
    if (!error) return null;

    switch (error.type) {
      case 'network':
        return <WifiOff className="w-4 h-4" />;
      case 'permission':
        return <AlertCircle className="w-4 h-4" />;
      case 'timeout':
      case 'unavailable':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Compact Toggle Button */}
      <button
        onClick={handleToggleSharing}
        disabled={!isOnline && !isSharing}
        onMouseEnter={() => error && setShowError(true)}
        onMouseLeave={() => setShowError(false)}
        className={`relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
          isSharing
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : error
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
        }`}
      >
        {isSharing ? (
          <>
            <MapPinned className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{t('location.sharing')}</span>
          </>
        ) : error ? (
          <>
            {getErrorIcon()}
            <span className="hidden sm:inline whitespace-nowrap">{t('location.error')}</span>
          </>
        ) : (
          <>
            <MapPinOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{t('location.start')}</span>
          </>
        )}
      </button>

      {/* Error Tooltip (on hover) */}
      {error && showError && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-900 mb-1">
                {t('location.error_title')}
              </p>
              <p className="text-xs text-red-700 break-words">
                {error.message}
              </p>
              {error.type === 'permission' && (
                <p className="text-xs text-red-600 mt-2">
                  {t('location.error_permission_help')}
                </p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Hidden Location Tracker Component */}
      {isSharing && user?.id && (
        <div className="hidden">
          <DriverLocationTracker
            driverId={user.id}
            driverName={user.email?.split('@')[0]}
            driverEmail={user.email}
            isEnabled={isSharing}
            updateInterval={30000}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      )}
    </>
  );
}
