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
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-6"></div>
      <p className="text-gray-600 text-lg font-medium">Loading Staff Dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const staffName = (user as any)?.staff_name || user?.email?.split('@')[0] || 'Staff Member';
  const department = (user as any)?.department || 'Transport Management';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {staffName}!</h1>
              <p className="text-white text-lg opacity-95">{department}</p>
              <p className="text-white text-sm mt-1 opacity-90">Manage your assigned routes and passengers efficiently</p>
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
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center shadow-sm">
                <RouteIcon className="w-7 h-7 text-green-600" />
              </div>
              <span className="text-green-700 text-sm font-semibold uppercase tracking-wide">Routes</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900">{stats.totalRoutes}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium">Assigned to you</p>
          </div>

          {/* Total Passengers */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-yellow-600" />
              </div>
              <span className="text-yellow-700 text-sm font-semibold uppercase tracking-wide">Passengers</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900">{stats.totalPassengers}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium">Total passengers</p>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center shadow-sm">
                <Bus className="w-7 h-7 text-green-600" />
              </div>
              <span className="text-green-700 text-sm font-semibold uppercase tracking-wide">Active</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900">{stats.activeRoutes}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium">Active routes</p>
          </div>

          {/* Total Capacity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-7 h-7 text-orange-600" />
              </div>
              <span className="text-orange-700 text-sm font-semibold uppercase tracking-wide">Capacity</span>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900">{stats.totalCapacity}</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium">Total seats</p>
          </div>
        </div>

        {/* Recent Routes */}
        {recentRoutes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Assigned Routes</h2>
              <Link
                href="/staff/assigned-routes"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-200 hover:shadow-lg transition-all hover:border-green-300 duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {route.route_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{route.route_name}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{route.passenger_count} passengers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{route.departure_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/staff/routes/${route.route_id}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/staff/assigned-routes"
              className="flex items-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all border border-green-200 hover:border-green-300 group"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <RouteIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Assigned Routes</h3>
                <p className="text-sm text-gray-700 mt-0.5">View routes and passengers</p>
              </div>
            </Link>

            <Link
              href="/staff/routes"
              className="flex items-center p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-all border border-yellow-200 hover:border-yellow-300 group"
            >
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">All Routes</h3>
                <p className="text-sm text-gray-700 mt-0.5">Browse all transport routes</p>
              </div>
            </Link>

            <Link
              href="/staff/students"
              className="flex items-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all border border-blue-200 hover:border-blue-300 group"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Students</h3>
                <p className="text-sm text-gray-700 mt-0.5">View student records</p>
              </div>
            </Link>

            <Link
              href="/staff/grievances"
              className="flex items-center p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all border border-orange-200 hover:border-orange-300 group"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Grievances</h3>
                <p className="text-sm text-gray-700 mt-0.5">Handle complaints</p>
              </div>
            </Link>

            <Link
              href="/staff/bookings"
              className="flex items-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all border border-green-200 hover:border-green-300 group"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Bookings</h3>
                <p className="text-sm text-gray-700 mt-0.5">View booking requests</p>
              </div>
            </Link>

            <Link
              href="/staff/reports"
              className="flex items-center p-5 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl hover:shadow-md transition-all border border-teal-200 hover:border-teal-300 group"
            >
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Reports</h3>
                <p className="text-sm text-gray-700 mt-0.5">Generate reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
