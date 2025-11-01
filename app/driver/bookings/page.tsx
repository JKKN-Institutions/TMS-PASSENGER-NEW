'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { driverHelpers } from '@/lib/supabase';
import { Users, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, AlertTriangle, TrendingUp, User, Phone, Mail, BadgeCheck, Filter, Route as RouteIcon } from 'lucide-react';
import DriverPageHeader from '@/components/driver-page-header';

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [driverRoutes, setDriverRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  const routeId = searchParams?.get('routeId') || '';

  const load = async (targetRouteId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch driver's assigned routes if not already loaded
      if (driverRoutes.length === 0 && user?.id) {
        const routesData = await driverHelpers.getAssignedRoutes(user.id, user.email);
        setDriverRoutes(routesData);

        // If no specific route is targeted, use the first route
        if (!targetRouteId && routesData.length > 0) {
          targetRouteId = routesData[0].id;
          setSelectedRouteId(targetRouteId);
        }
      }

      // If we have a target route or selected route, fetch bookings
      const effectiveRouteId = targetRouteId || selectedRouteId || (driverRoutes.length > 0 ? driverRoutes[0].id : '');

      if (!effectiveRouteId) {
        setBookings([]);
        setFilteredBookings([]);
        setError('No routes assigned to this driver');
        setLoading(false);
        return;
      }

      const params: any = {};
      params.routeId = effectiveRouteId;
      params.date = date;
      const data = await driverHelpers.getRouteBookings(params);
      setBookings(data);
      setFilteredBookings(data);

      const byStop: Record<string, any[]> = {};
      (data || []).forEach((b: any) => {
        const key = b.boarding_stop || 'Unknown Stop';
        if (!byStop[key]) byStop[key] = [];
        byStop[key].push(b);
      });
      setGrouped(byStop);
    } catch (err: any) {
      console.error('❌ Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      setError('Driver information not found');
      setLoading(false);
      return;
    }

    load(routeId || undefined);
  }, [routeId, router, isAuthenticated, userType, user, authLoading, date]);

  // Filter bookings when status filter changes
  useEffect(() => {
    let filtered = [...bookings];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    setFilteredBookings(filtered);

    // Re-group filtered bookings
    const byStop: Record<string, any[]> = {};
    filtered.forEach((b: any) => {
      const key = b.boarding_stop || 'Unknown Stop';
      if (!byStop[key]) byStop[key] = [];
      byStop[key].push(b);
    });
    setGrouped(byStop);
  }, [statusFilter, bookings]);

  const total = useMemo(() => bookings.length, [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === 'confirmed').length, [bookings]);
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending').length, [bookings]);
  const paidBookings = useMemo(() => bookings.filter(b => b.payment_status === 'paid').length, [bookings]);
  const verifiedBookings = useMemo(() => bookings.filter(b => b.verified_at).length, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => load(routeId || undefined)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <DriverPageHeader
        titleKey="page.bookings.title"
        icon={Calendar}
        iconColor="text-indigo-600"
        iconBgColor="bg-indigo-50"
      />

      {/* Date & Route Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold break-words">
            <RouteIcon className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">
              Passenger Bookings
              {driverRoutes.length > 0 && selectedRouteId && (
                <span className="ml-2 font-normal">
                  - {driverRoutes.find(r => r.id === selectedRouteId)?.route_number} {driverRoutes.find(r => r.id === selectedRouteId)?.route_name}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">{t('bookings.total_bookings')}</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">{t('bookings.confirmed')}</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{confirmedBookings}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">{t('bookings.pending')}</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-600">{pendingBookings}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">{t('bookings.paid')}</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{paidBookings}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">{t('bookings.verified')}</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">{verifiedBookings}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Date Selection</h2>
              <p className="text-sm text-gray-600">Bookings automatically update when date changes</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick Date Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Quick select:</span>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDate(yesterday.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tomorrow
            </button>
          </div>

          {/* Date Picker and Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Route Selector (if driver has multiple routes) */}
            {driverRoutes.length > 1 && (
              <div className="flex items-center">
                <RouteIcon className="w-5 h-5 text-gray-400 mr-3" />
                <select
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    load(e.target.value);
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {driverRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      Route {route.route_number} - {route.route_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center flex-1">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-400 mr-3" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">{t('bookings.all_status')}</option>
                <option value="confirmed">{t('bookings.confirmed')}</option>
                <option value="pending">{t('bookings.pending')}</option>
                <option value="cancelled">{t('bookings.cancelled')}</option>
              </select>
            </div>

            <button
              onClick={() => load(selectedRouteId || routeId || undefined)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {loading ? t('common.loading') : t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Bookings Found</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            No bookings available for the selected date. Try selecting a different date or check your route assignments.
          </p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([stop, list]) => (
            <div key={stop} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="font-semibold text-gray-900 text-lg">{stop}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      {list.length} booking{list.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {list.map((booking: any) => (
                  <div
                    key={booking.id}
                    className={`px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${booking.verified_at ? 'bg-purple-50/30' : ''}`}
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-900 text-base md:text-lg truncate">
                            {booking.students?.student_name || 'Student'}
                          </span>
                          <span className="text-gray-500 text-xs md:text-sm bg-gray-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                            {t('bookings.roll')}: {booking.students?.roll_number || '—'}
                          </span>
                          {booking.verified_at && (
                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-2 md:px-3 py-1 rounded-full">
                              <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase">{t('bookings.verified')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                          <div className="flex items-center text-xs md:text-sm text-gray-600">
                            <span className="font-medium mr-1.5 md:mr-2">{t('bookings.seat')}:</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {booking.seat_number || '—'}
                            </span>
                          </div>

                          <div className="flex items-center text-xs md:text-sm text-gray-600">
                            {getStatusIcon(booking.status)}
                            <span className={`ml-1.5 md:ml-2 px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {t(`bookings.${booking.status}`)}
                            </span>
                          </div>

                          <div className="flex items-center text-xs md:text-sm text-gray-600">
                            {getPaymentStatusIcon(booking.payment_status)}
                            <span className={`ml-1.5 md:ml-2 px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {t(`bookings.${booking.payment_status}`)}
                            </span>
                          </div>

                          <div className="flex items-center text-xs md:text-sm text-gray-500 bg-gray-100 px-2 md:px-3 py-1.5 md:py-2 rounded-lg">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                            <span className="font-medium">{booking.schedules?.departure_time || '—'}</span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedBooking === booking.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {booking.students?.email && (
                                <div className="flex items-center text-gray-600">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="truncate">{booking.students.email}</span>
                                </div>
                              )}
                              {booking.students?.phone && (
                                <div className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{booking.students.phone}</span>
                                </div>
                              )}
                              {booking.booking_reference && (
                                <div className="flex items-center text-gray-600">
                                  <BadgeCheck className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="font-mono text-xs">{booking.booking_reference}</span>
                                </div>
                              )}
                              {booking.routes && (
                                <div className="flex items-center text-gray-600">
                                  <RouteIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{booking.routes.route_number}: {booking.routes.route_name}</span>
                                </div>
                              )}
                            </div>
                            {booking.verified_at && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {t('bookings.verified_at')} {new Date(booking.verified_at).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                  {booking.verified_by && ` ${t('common.by')} ${booking.verified_by}`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading bookings...</p>
      </div>
    </div>
  );
}

export default function DriverBookingsPage() {
  return (
    <Suspense fallback={<BookingsFallback />}>
      <BookingsContent />
    </Suspense>
  );
}


