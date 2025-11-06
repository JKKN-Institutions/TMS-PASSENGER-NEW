'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Clock, Users, Car, TrendingUp, AlertCircle, CheckCircle, MapPinned, Play, Square } from 'lucide-react';
import Link from 'next/link';
import DriverLocationTracker from '@/components/driver-location-tracker';

export default function DriverHomePage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [allStops, setAllStops] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is authenticated and is a driver
        if (isLoading) {
          return; // Wait for auth to load
        }
        
        if (!isAuthenticated || userType !== 'driver') {
          console.log('❌ Driver page access denied:', { isAuthenticated, userType, user });
          router.replace('/login');
          return;
        }
        
        console.log('✅ Driver authenticated:', { user, userType });
        
        // Get driver ID from user object - use database driver_id if available
        const driverId = (user as any)?.driver_id || user?.id;
        if (!driverId) {
          setError(t('error.driver_id_not_found'));
          return;
        }
        
        console.log('🔍 Using driver ID for API calls:', { 
          driverId, 
          userDriverId: (user as any)?.driver_id, 
          userId: user?.id,
          email: user?.email 
        });
        
        // Load assigned routes
        setRoutesLoading(true);
        const assignedRoutes = await driverHelpers.getAssignedRoutes(driverId, user?.email);
        setRoutes(assignedRoutes);
        console.log('✅ Routes loaded:', assignedRoutes);
        
        // Load all stops from assigned routes
        if (assignedRoutes.length > 0) {
          // Set the first route as selected by default
          setSelectedRoute(assignedRoutes[0]);
          
          // Collect all stops from all routes
          const stops: any[] = [];
          for (const route of assignedRoutes) {
            if (route.route_stops && route.route_stops.length > 0) {
              const routeStops = route.route_stops.map((stop: any) => ({
                ...stop,
                route_id: route.id,
                route_name: route.route_name,
                route_number: route.route_number
              }));
              stops.push(...routeStops);
            }
          }
          setAllStops(stops);
        }
      } catch (err: any) {
        console.error('❌ Error loading driver data:', err);
        setError(err.message || 'Failed to load driver data');
      } finally {
        setLoading(false);
        setRoutesLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, isLoading, user]);

  if (isLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-[#0b6d41] mb-6"></div>
      <p className="text-gray-600 text-lg font-medium">{t('dashboard.loading')}</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          {t('common.retry')}
        </button>
      </div>
    </div>
  );

  const currentDriver = user;
  const activeRoutes = routes.filter(route => route.status === 'active');
  const totalPassengers = routes.reduce((sum, route) => sum + (route.current_passengers || 0), 0);
  
  // Get driver ID for location tracking
  const driverId = (user as any)?.driver_id || user?.id;
  
  // Get stops for the selected route, sorted by sequence order
  const currentStops = selectedRoute?.route_stops
    ? [...selectedRoute.route_stops].sort((a: any, b: any) => a.sequence_order - b.sequence_order)
    : [];

  // Helper function to get localized stop name
  const getStopName = (stop: any) => {
    if (language === 'ta' && stop.tamil_name) {
      return stop.tamil_name;
    }
    return stop.stop_name;
  };

  return (
    <div className="w-full overflow-hidden space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-[#0b6d41] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 break-words">
              {t('dashboard.welcome', { name: currentDriver?.email?.split('@')[0] || 'Driver' })}
            </h1>
            <p className="text-green-100 text-sm sm:text-base md:text-lg break-words">
              {t('driver.journey_start')}
            </p>
          </div>
          <div className="hidden sm:block flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 md:w-10 md:h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Sharing Toggle - TOP PRIORITY */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-green-50 px-4 md:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                locationSharingEnabled
                  ? 'bg-[#0b6d41] shadow-lg shadow-green-200'
                  : 'bg-gray-400'
              }`}>
                <MapPinned className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{t('driver.location_sharing_title')}</h2>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {locationSharingEnabled
                    ? t('driver.location_sharing_active')
                    : t('driver.location_sharing_inactive')}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setLocationSharingEnabled(!locationSharingEnabled)}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105 flex-shrink-0 ${
                locationSharingEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-[#0b6d41] hover:bg-[#085032] text-white shadow-lg shadow-green-200'
              }`}
            >
              {locationSharingEnabled ? (
                <>
                  <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{t('driver.stop_sharing')}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{t('driver.start_sharing')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Location Tracker Component */}
        {locationSharingEnabled && driverId && (
          <div className="p-4 md:p-6 bg-gray-50">
            <DriverLocationTracker
              driverId={driverId}
              driverName={currentDriver?.email?.split('@')[0] || 'Driver'}
              driverEmail={user?.email}
              isEnabled={locationSharingEnabled}
              updateInterval={30000}
            />
          </div>
        )}
      </div>

      {/* Route Stops - Vertical Stepper Design */}
      {selectedRoute && currentStops.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-green-50 px-4 md:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{t('driver.route_stops')}</h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {t('common.route')} {selectedRoute.route_number}: {selectedRoute.route_name}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="px-2.5 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                  {currentStops.length} {t('driver.stops_count')}
                </div>
              </div>
            </div>

            {/* Route Selector if multiple routes */}
            {routes.length > 1 && (
              <div className="mt-4">
                <select
                  value={selectedRoute.id}
                  onChange={(e) => {
                    const route = routes.find(r => r.id === e.target.value);
                    setSelectedRoute(route || null);
                  }}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {t('common.route')} {route.route_number} - {route.route_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6">
            {/* Vertical Stepper */}
            <div className="relative">
              {currentStops.map((stop: any, index: number) => {
                const isFirst = index === 0;
                const isLast = index === currentStops.length - 1;
                const isMajor = stop.is_major_stop;
                
                return (
                  <div key={stop.id} className="relative flex items-start mb-6 last:mb-0">
                    {/* Vertical Line */}
                    {!isLast && (
                      <div className={`absolute left-[19px] top-10 bottom-0 w-1 ${
                        isMajor ? 'bg-green-200' : 'bg-gray-300'
                      }`} style={{ height: 'calc(100% + 24px)' }} />
                    )}

                    {/* Stop Circle/Marker */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all ${
                        isFirst
                          ? 'bg-[#0b6d41] border-green-200 text-white shadow-lg shadow-green-200'
                          : isLast
                          ? 'bg-red-500 border-red-200 text-white shadow-lg shadow-red-200'
                          : isMajor
                          ? 'bg-[#0b6d41] border-green-200 text-white shadow-lg shadow-green-200'
                          : 'bg-white border-gray-300 text-gray-700 shadow'
                      }`}>
                        {isFirst ? (
                          <Navigation className="w-5 h-5" />
                        ) : isLast ? (
                          <MapPin className="w-5 h-5" />
                        ) : (
                          <span>{stop.sequence_order}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Stop Details */}
                    <div className="ml-4 flex-1">
                      <div className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        isFirst
                          ? 'bg-green-50 border-green-200'
                          : isLast
                          ? 'bg-red-50 border-red-200'
                          : isMajor
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start flex-wrap gap-2 mb-1">
                              <h3 className={`text-base sm:text-lg font-semibold break-words ${
                                isFirst
                                  ? 'text-green-900'
                                  : isLast
                                  ? 'text-red-900'
                                  : isMajor
                                  ? 'text-green-900'
                                  : 'text-gray-900'
                              }`}>
                                {getStopName(stop)}
                              </h3>
                              {isFirst && (
                                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                                  START
                                </span>
                              )}
                              {isLast && (
                                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-semibold">
                                  END
                                </span>
                              )}
                              {isMajor && !isFirst && !isLast && (
                                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                                  MAJOR STOP
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mt-2">
                              <div className="flex items-center flex-shrink-0">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                <span className="font-medium">{stop.stop_time}</span>
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                <span>Stop #{stop.sequence_order}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('stats.active_routes')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeRoutes.length}</p>
            <div className="mt-2">
              <TrendingUp className="w-5 h-5 text-[#0b6d41]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('stats.passengers')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalPassengers}</p>
            <div className="mt-2">
              <Users className="w-5 h-5 text-[#0b6d41]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('stats.total_routes')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{routes.length}</p>
            <div className="mt-2">
              <MapPin className="w-5 h-5 text-[#0b6d41]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('stats.status')}</p>
            <p className="text-xl sm:text-2xl font-bold text-[#0b6d41]">{t('stats.active')}</p>
            <div className="mt-2">
              <CheckCircle className="w-5 h-5 text-[#0b6d41]" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t('quick_actions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/driver/routes" className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group-hover:border-green-200 group-hover:bg-green-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MapPin className="w-6 h-6 text-[#0b6d41]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-[#0b6d41] transition-colors">{t('quick_actions.my_routes')}</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">{t('quick_actions.view_routes')}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/driver/bookings" className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group-hover:border-green-200 group-hover:bg-green-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Users className="w-6 h-6 text-[#0b6d41]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-[#0b6d41] transition-colors">{t('quick_actions.bookings')}</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">{t('quick_actions.view_bookings')}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Assigned Routes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('dashboard.assigned_routes')}</h2>
          {routesLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              {t('dashboard.loading_routes_text')}
            </div>
          )}
        </div>
        
        {routesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{t('common.route')} {route.route_number}</div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900">{route.route_name}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      route.status === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {route.status}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">{route.start_location} → {route.end_location}</span>
                    </div>
                    
                    {route.vehicles && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="w-4 h-4 mr-3 text-gray-400" />
                        <span>{route.vehicles.registration_number} ({route.vehicles.model})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{route.current_passengers || 0} / {route.total_capacity} passengers</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link
                      href={`/driver/bookings?routeId=${route.id}`}
                      className="flex-1 text-center px-4 py-2 bg-[#0b6d41] text-white text-sm font-medium rounded-lg hover:bg-[#085032] transition-colors shadow-md hover:shadow-lg"
                    >
                      {t('routes.view_bookings_button')}
                    </Link>
                    <Link
                      href={`/driver/routes/${route.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t('routes.route_details_button')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {routes.length === 0 && !routesLoading && (
              <div className="col-span-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{t('routes.no_routes')}</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    {t('dashboard.no_routes_message')}
                  </p>
                  <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


