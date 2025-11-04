'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
  Users,
  Bus,
  AlertCircle,
  FileText,
  TrendingUp,
  Calendar,
  Route as RouteIcon,
  MapPin,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface RouteStats {
  totalRoutes: number;
  totalPassengers: number;
  activeRoutes: number;
  totalCapacity: number;
}

interface RecentRoute {
  route_id: string;
  route_number: string;
  route_name: string;
  passenger_count: number;
  departure_time: string;
}

export default function StaffDashboardPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RouteStats>({
    totalRoutes: 0,
    totalPassengers: 0,
    activeRoutes: 0,
    totalCapacity: 0
  });
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        if (isLoading) {
          return;
        }

        if (!isAuthenticated || userType !== 'staff') {
          console.log('❌ Staff page access denied:', { isAuthenticated, userType, user });
          router.replace('/staff-login');
          return;
        }

        console.log('✅ Staff authenticated:', { user, userType });
        await loadDashboardData();

      } catch (err: any) {
        console.error('❌ Error loading staff dashboard:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, isLoading, user]);

  const loadDashboardData = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    try {
      const response = await fetch(`/api/staff/assigned-routes?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success && data.routesWithPassengers) {
        const routes = data.routesWithPassengers;

        // Calculate stats
        const totalRoutes = routes.length;
        const totalPassengers = data.totalPassengers || 0;
        const activeRoutes = routes.filter((r: any) => r.route?.status === 'active').length;
        const totalCapacity = routes.reduce((sum: number, r: any) => sum + (r.route?.total_capacity || 0), 0);

        setStats({
          totalRoutes,
          totalPassengers,
          activeRoutes,
          totalCapacity
        });

        // Set recent routes (first 3) with route IDs
        const recent = routes.slice(0, 3).map((r: any) => ({
          route_id: r.route?.id || '',
          route_number: r.route?.route_number || 'N/A',
          route_name: r.route?.route_name || 'Unknown Route',
          passenger_count: r.passengerCount || 0,
          departure_time: r.route?.departure_time || '00:00'
        }));

        setRecentRoutes(recent);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    }
  };

  if (isLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0b6d41]/20 border-t-[#0b6d41] mb-6"></div>
      <p className="text-gray-600 text-lg font-medium font-inter">Loading Staff Dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-red-800 font-semibold text-lg mb-2 font-poppins">Error</h3>
        <p className="text-red-600 mb-4 font-inter">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium font-inter"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const staffName = (user as any)?.staff_name || user?.email?.split('@')[0] || 'Staff Member';
  const department = (user as any)?.department || 'Transport Management';

  return (
    <div className="min-h-screen bg-[#fbfbee] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-[#0b6d41] rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 font-poppins">Welcome back, {staffName}!</h1>
              <p className="text-white text-base md:text-lg opacity-95 font-inter">{department}</p>
              <p className="text-white text-sm mt-1 opacity-90 font-inter">Manage your assigned routes and passengers efficiently</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#0b6d41]/10 rounded-xl flex items-center justify-center shadow-sm">
                <RouteIcon className="w-7 h-7 text-[#0b6d41]" />
              </div>
              <span className="text-[#0b6d41] text-sm font-semibold uppercase tracking-wide font-inter">Routes</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 font-poppins">{stats.totalRoutes}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium font-inter">Assigned to you</p>
          </div>

          {/* Total Passengers */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#ffde59]/20 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-[#e6c64d]" />
              </div>
              <span className="text-[#ccae3d] text-sm font-semibold uppercase tracking-wide font-inter">Passengers</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 font-poppins">{stats.totalPassengers}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium font-inter">Total passengers</p>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#0b6d41]/10 rounded-xl flex items-center justify-center shadow-sm">
                <Bus className="w-7 h-7 text-[#0b6d41]" />
              </div>
              <span className="text-[#0b6d41] text-sm font-semibold uppercase tracking-wide font-inter">Active</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 font-poppins">{stats.activeRoutes}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium font-inter">Active routes</p>
          </div>

          {/* Total Capacity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-7 h-7 text-[#f59e0b]" />
              </div>
              <span className="text-[#f59e0b] text-sm font-semibold uppercase tracking-wide font-inter">Capacity</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 font-poppins">{stats.totalCapacity}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium font-inter">Total seats</p>
          </div>
        </div>

        {/* Recent Routes */}
        {recentRoutes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-poppins">Your Assigned Routes</h2>
              <Link
                href="/staff/assigned-routes"
                className="flex items-center gap-2 text-[#0b6d41] hover:text-[#0f8f56] focus:text-[#085032] focus:underline focus:outline-none active:text-[#085032] font-semibold text-sm transition-colors font-inter"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 bg-[#0b6d41]/10 rounded-xl border border-[#0b6d41]/30 hover:shadow-lg hover:bg-[#0b6d41]/20 transition-all hover:border-[#0b6d41] duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#0b6d41] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md font-poppins">
                      {route.route_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-gray-900 font-inter">{route.route_name}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#0b6d41]" />
                          <span className="font-semibold font-inter">{route.passenger_count} passengers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#e6c64d]" />
                          <span className="font-semibold font-inter">{route.departure_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/staff/routes/${route.route_id}`}
                    className="px-5 py-2.5 bg-[#0b6d41] text-white rounded-xl hover:bg-[#085032] focus:bg-[#085032] focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:ring-offset-2 active:bg-[#085032] active:scale-95 transition-all text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 font-inter"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/staff/assigned-routes"
              className="flex items-center p-5 bg-[#0b6d41]/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:ring-offset-2 active:scale-100 transition-all border border-[#0b6d41]/20 hover:border-[#0b6d41] focus:border-[#0b6d41] group"
            >
              <div className="w-12 h-12 bg-[#0b6d41] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <RouteIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#0b6d41] font-inter">Assigned Routes</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">View routes and passengers</p>
              </div>
            </Link>

            <Link
              href="/staff/routes"
              className="flex items-center p-5 bg-[#ffde59]/20 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#e6c64d] focus:ring-offset-2 active:scale-100 transition-all border border-[#ffde59]/30 hover:border-[#e6c64d] focus:border-[#e6c64d] group"
            >
              <div className="w-12 h-12 bg-[#e6c64d] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#ccae3d] font-inter">All Routes</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">Browse all transport routes</p>
              </div>
            </Link>

            <Link
              href="/staff/students"
              className="flex items-center p-5 bg-[#3b82f6]/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 active:scale-100 transition-all border border-[#3b82f6]/20 hover:border-[#3b82f6] focus:border-[#3b82f6] group"
            >
              <div className="w-12 h-12 bg-[#3b82f6] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#3b82f6] font-inter">Students</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">View student records</p>
              </div>
            </Link>

            <Link
              href="/staff/grievances"
              className="flex items-center p-5 bg-[#f59e0b]/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 active:scale-100 transition-all border border-[#f59e0b]/20 hover:border-[#f59e0b] focus:border-[#f59e0b] group"
            >
              <div className="w-12 h-12 bg-[#f59e0b] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#f59e0b] font-inter">Grievances</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">Handle complaints</p>
              </div>
            </Link>

            <Link
              href="/staff/bookings"
              className="flex items-center p-5 bg-[#0b6d41]/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:ring-offset-2 active:scale-100 transition-all border border-[#0b6d41]/20 hover:border-[#0b6d41] focus:border-[#0b6d41] group"
            >
              <div className="w-12 h-12 bg-[#0b6d41] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#0b6d41] font-inter">Bookings</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">View booking requests</p>
              </div>
            </Link>

            <Link
              href="/staff/reports"
              className="flex items-center p-5 bg-[#14b8a6]/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2 active:scale-100 transition-all border border-[#14b8a6]/20 hover:border-[#14b8a6] focus:border-[#14b8a6] group"
            >
              <div className="w-12 h-12 bg-[#14b8a6] rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-[#14b8a6] font-inter">Reports</h3>
                <p className="text-sm text-gray-700 mt-0.5 font-medium font-inter">Generate reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
