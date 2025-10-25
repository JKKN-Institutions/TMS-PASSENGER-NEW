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
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-6"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {staffName}!</h1>
              <p className="text-purple-100 text-lg">{department}</p>
              <p className="text-purple-200 text-sm mt-1">Manage your assigned routes and passengers efficiently</p>
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
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <RouteIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-sm font-medium">Routes</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalRoutes}</h3>
            <p className="text-gray-500 text-sm mt-1">Assigned to you</p>
          </div>

          {/* Total Passengers */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-sm font-medium">Passengers</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalPassengers}</h3>
            <p className="text-gray-500 text-sm mt-1">Total passengers</p>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.activeRoutes}</h3>
            <p className="text-gray-500 text-sm mt-1">Active routes</p>
          </div>

          {/* Total Capacity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-orange-600 text-sm font-medium">Capacity</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalCapacity}</h3>
            <p className="text-gray-500 text-sm mt-1">Total seats</p>
          </div>
        </div>

        {/* Recent Routes */}
        {recentRoutes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Assigned Routes</h2>
              <Link
                href="/staff/assigned-routes"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {route.route_number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{route.route_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{route.passenger_count} passengers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{route.departure_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/staff/routes/${route.route_id}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/staff/assigned-routes"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <RouteIcon className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Assigned Routes</h3>
                <p className="text-sm text-gray-600">View routes and passengers</p>
              </div>
            </Link>

            <Link
              href="/staff/routes"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <Bus className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">All Routes</h3>
                <p className="text-sm text-gray-600">Browse all transport routes</p>
              </div>
            </Link>

            <Link
              href="/staff/students"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Students</h3>
                <p className="text-sm text-gray-600">View student records</p>
              </div>
            </Link>

            <Link
              href="/staff/grievances"
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              <FileText className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Grievances</h3>
                <p className="text-sm text-gray-600">Handle complaints</p>
              </div>
            </Link>

            <Link
              href="/staff/bookings"
              className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <Calendar className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Bookings</h3>
                <p className="text-sm text-gray-600">View booking requests</p>
              </div>
            </Link>

            <Link
              href="/staff/reports"
              className="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
            >
              <TrendingUp className="w-6 h-6 text-teal-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Reports</h3>
                <p className="text-sm text-gray-600">Generate reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
