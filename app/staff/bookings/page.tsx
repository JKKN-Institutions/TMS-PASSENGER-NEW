'use client';

import React, { useEffect, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  id: string;
  booking_date: string;
  booking_reference: string;
  status: string;
  payment_status: string;
  seat_number?: string;
  verified_at?: string;
  verified_by?: string;
  student?: {
    student_name: string;
    roll_number: string;
  };
  route?: {
    route_number: string;
    route_name: string;
  };
}

export default function StaffBookingsPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // First, get staff's assigned routes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('staff_route_assignments')
        .select('route_id')
        .eq('staff_email', user.email.toLowerCase().trim())
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setBookings([]);
        setFilteredBookings([]);
        setLoading(false);
        return;
      }

      // Get route IDs
      const routeIds = assignments.map(a => a.route_id);

      // Fetch bookings only for assigned routes and selected date
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_reference,
          status,
          payment_status,
          seat_number,
          verified_at,
          verified_by,
          student_id,
          route_id,
          students (
            student_name,
            roll_number
          ),
          routes (
            route_number,
            route_name
          )
        `)
        .in('route_id', routeIds)
        .eq('booking_date', selectedDate)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      setBookings(bookingsData || []);
      setFilteredBookings(bookingsData || []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Failed to load bookings');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
              <p className="text-white opacity-95 text-lg mb-3">View and manage transport bookings</p>
              <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 rounded-lg px-4 py-2 w-fit">
                <Calendar className="w-4 h-4" />
                <span>Showing bookings for:</span>
                <span className="font-semibold">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Calendar className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium uppercase">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{bookings.length}</h3>
            <p className="text-gray-500 text-sm mt-1">All bookings</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium uppercase">Confirmed</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{confirmedCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Confirmed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-600 text-xs font-medium uppercase">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{pendingCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Pending</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium uppercase">Paid</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{paidCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Paid</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium uppercase">Verified</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{verifiedCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Scanned tickets</p>
          </div>
        </div>

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

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">No bookings found for the selected date</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className={`p-6 hover:bg-gray-50 transition-colors ${
                booking.verified_at ? 'bg-purple-50 bg-opacity-30' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {booking.student?.student_name || 'Unknown Student'}
                      </span>
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                        {booking.student?.roll_number}
                      </span>
                      {booking.verified_at && (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-3 py-1 rounded-full">
                          <BadgeCheck className="w-4 h-4" strokeWidth={2.5} />
                          <span className="text-xs font-bold">VERIFIED</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {booking.route && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.route.route_number} - {booking.route.route_name}</span>
                        </div>
                      )}
                      {booking.booking_reference && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {booking.booking_reference}
                        </span>
                      )}
                      {booking.seat_number && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Seat: {booking.seat_number}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Payment: {booking.payment_status}
                      </span>
                    </div>

                    {booking.verified_at && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-purple-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Verified {new Date(booking.verified_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {booking.verified_by && ` by ${booking.verified_by}`}
                        </span>
                      </div>
                    )}
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
