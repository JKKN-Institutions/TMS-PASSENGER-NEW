'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  User,
  MapPin,
  TrendingUp,
  BadgeCheck,
  ShieldCheck,
  Route as RouteIcon
} from 'lucide-react';
import { staffHelpers } from '@/lib/staff-helpers';

interface Booking {
  id: string;
  booking_date: string;
  trip_date?: string;
  boarding_stop?: string;
  booking_reference: string;
  status: string;
  payment_status: string;
  seat_number?: string;
  verified_at?: string;
  verified_by?: string;
  students?: {
    student_name: string;
    roll_number: string;
  };
  routes?: {
    route_number: string;
    route_name: string;
  };
  schedules?: {
    departure_time: string;
    arrival_time: string;
  };
}

export default function StaffBookingsPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Booking[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffRoutes, setStaffRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadBookings();
  }, [isAuthenticated, userType, isLoading, router, selectedDate]);

  useEffect(() => {
    filterBookings();
  }, [statusFilter, bookings]);

  const loadBookings = async (targetRouteId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch staff's assigned routes if not already loaded
      if (staffRoutes.length === 0 && user?.id) {
        const routesData = await staffHelpers.getAssignedRoutes(user.id, user.email);
        setStaffRoutes(routesData);

        // If no specific route is targeted, use the first route
        if (!targetRouteId && routesData.length > 0) {
          targetRouteId = routesData[0].id;
          setSelectedRouteId(targetRouteId);
        }
      }

      // If we have a target route or selected route, fetch bookings
      const effectiveRouteId = targetRouteId || selectedRouteId || (staffRoutes.length > 0 ? staffRoutes[0].id : '');

      if (!effectiveRouteId) {
        setBookings([]);
        setFilteredBookings([]);
        setError('No routes assigned to this staff member');
        setLoading(false);
        return;
      }

      const params: any = {};
      params.routeId = effectiveRouteId;
      params.date = selectedDate;
      const data = await staffHelpers.getRouteBookings(params);
      setBookings(data);
      setFilteredBookings(data);

      // Group bookings by stop
      const byStop: Record<string, Booking[]> = {};
      (data || []).forEach((b: Booking) => {
        const key = b.boarding_stop || 'Unknown Stop';
        if (!byStop[key]) byStop[key] = [];
        byStop[key].push(b);
      });
      setGrouped(byStop);
    } catch (err: any) {
      console.error('❌ Error fetching bookings:', err);

      // Handle specific error types gracefully
      let errorMessage = 'Failed to load bookings';

      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and refresh the page.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please refresh the page and try again.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message.includes('forbidden') || err.message.includes('403')) {
          errorMessage = 'Access denied. Contact administrator for assistance.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'No bookings found for the selected date.';
        } else if (err.message.includes('server') || err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // Auto-clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadBookings}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const paidCount = bookings.filter(b => b.payment_status === 'paid').length;
  const verifiedCount = bookings.filter(b => b.verified_at).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Bookings</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Total</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{bookings.length}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Confirmed</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{confirmedCount}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Pending</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{pendingCount}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Paid</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{paidCount}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Verified</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{verifiedCount}</h3>
          </div>
        </div>

        {/* Route Selector */}
        {staffRoutes.length > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <RouteIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Select Route</h3>
            </div>
            <select
              value={selectedRouteId}
              onChange={(e) => {
                setSelectedRouteId(e.target.value);
                loadBookings(e.target.value);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {staffRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  Route {route.route_number} - {route.route_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Quick select:</span>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tomorrow
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center flex-1">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">No bookings found for the selected date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([stop, stopBookings]) => (
              <div key={stop} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#0b6d41]" />
                      <span className="font-semibold text-gray-900">{stop}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {stopBookings.length} booking{stopBookings.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Roll No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Seat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden xl:table-cell">Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stopBookings.map((booking) => (
                        <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${booking.verified_at ? 'bg-green-50 bg-opacity-30' : ''}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {booking.students?.student_name || 'Unknown Student'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {booking.students?.roll_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                            {booking.routes ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#0b6d41]" />
                                <span>{booking.routes.route_number}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                            {booking.seat_number || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            {booking.verified_at ? (
                              <div className="flex items-center gap-1.5">
                                <BadgeCheck className="w-4 h-4 text-[#0b6d41]" />
                                <span className="text-xs text-[#0b6d41] font-medium">Yes</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
