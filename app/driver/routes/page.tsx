'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Users, Car, Route, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import Link from 'next/link';
import DriverPageHeader from '@/components/driver-page-header';

export default function DriverRoutesPage() {
  const router = useRouter();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  // Helper function to get localized stop name
  const getStopName = (stop: any) => {
    if (language === 'ta' && stop.tamil_name) {
      return stop.tamil_name;
    }
    return stop.stop_name;
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          router.replace('/login');
          return;
        }

        if (userType !== 'driver') {
          router.replace('/login');
          return;
        }

        if (!user || !user.id) {
          setError(t('error.driver_info_not_found'));
          setLoading(false);
          return;
        }

        // Pass both driverId and email to ensure the API can find routes
        const assignedRoutes = await driverHelpers.getAssignedRoutes(user.id, user.email);
        console.log('Fetched routes:', assignedRoutes);
        setRoutes(assignedRoutes);
      } catch (err: any) {
        console.error('❌ Error fetching routes:', err);
        setError(err.message || t('routes.error_loading'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, user, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-[#0b6d41] mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('routes.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">{t('routes.error_loading')}</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {t('routes.retry')}
          </button>
        </div>
      </div>
    );
  }

  const activeRoutes = routes.filter(route => route.status === 'active');
  const inactiveRoutes = routes.filter(route => route.status !== 'active');

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <DriverPageHeader
        titleKey="page.routes.title"
        icon={Route}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('routes.total_routes')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Route className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('routes.active_routes')}</p>
              <p className="text-xl sm:text-2xl font-bold text-[#0b6d41]">{activeRoutes.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#0b6d41]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('routes.inactive_routes')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{inactiveRoutes.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('routes.route_details')}</h2>
          <div className="text-sm text-gray-600">
            {t('routes.routes_assigned', { 
              count: routes.length, 
              plural: routes.length !== 1 ? 's' : '' 
            })}
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{t('routes.no_routes_assigned')}</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              {t('routes.no_routes_description')}
            </p>
            <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="p-4 md:p-6">
                  {/* Route Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{route.route_name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{t('common.route')} {route.route_number}</p>
                        </div>
                      </div>
                      <div className="text-sm sm:text-base md:text-lg text-gray-700 sm:ml-14 md:ml-16 font-medium break-words">
                        {route.start_location} → {route.end_location}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0">
                      <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                        route.status === 'active'
                          ? 'bg-green-100 text-[#0b6d41] border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {route.status}
                      </div>

                      <Link
                        href={`/driver/bookings?routeId=${route.id}`}
                        className="flex items-center text-[#0b6d41] text-xs sm:text-sm font-medium hover:text-[#085032] transition-colors whitespace-nowrap"
                      >
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        {t('routes.view_bookings')}
                      </Link>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="sm:ml-14 md:ml-16 space-y-3 md:space-y-4">
                    {/* Vehicle Information */}
                    {route.vehicles && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{t('routes.vehicle')}:</span>
                        <span className="ml-1 sm:ml-2 truncate">{route.vehicles.registration_number} ({route.vehicles.model})</span>
                      </div>
                    )}

                    {/* Passenger Count */}
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{t('routes.passengers')}:</span>
                      <span className="ml-1 sm:ml-2">{route.current_passengers || 0} / {route.total_capacity}</span>
                    </div>

                    {/* Route Stops */}
                    {Array.isArray(route.route_stops) && route.route_stops.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2 sm:mb-3">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-gray-700">{t('routes.route_stops')}</span>
                        </div>
                        <div className="space-y-2">
                          {route.route_stops
                            .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                            .map((stop: any, index: number) => (
                              <div key={stop.id} className="flex items-center text-xs sm:text-sm text-gray-600 gap-2 sm:gap-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-[#0b6d41] flex-shrink-0">
                                  {stop.sequence_order}
                                </div>
                                <span className="flex-1 font-medium min-w-0 truncate">{getStopName(stop)}</span>
                                <span className="text-gray-500 text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap flex-shrink-0">
                                  {stop.stop_time}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-6 sm:ml-14 md:ml-16">
                    <Link
                      href={`/driver/bookings?routeId=${route.id}`}
                      className="px-4 sm:px-6 py-2 bg-[#0b6d41] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#085032] transition-colors text-center shadow-md hover:shadow-lg"
                    >
                      {t('routes.view_bookings')}
                    </Link>
                    <Link
                      href={`/driver/routes/${route.id}`}
                      className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      {t('routes.route_details')}
                    </Link>
                    <Link
                      href="/driver/live-tracking"
                      className="px-4 sm:px-6 py-2 bg-[#0b6d41] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#085032] transition-colors text-center shadow-md hover:shadow-lg"
                    >
                      {t('routes.start_tracking')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


