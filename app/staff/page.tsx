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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Dashboard</h1>
        </div>

        <div className="p-4 md:p-6">
          {/* Statistics Cards - Minimal Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Assigned Routes */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <RouteIcon className="w-5 h-5 text-[#0b6d41]" />
                <span className="text-xs text-gray-600 font-medium font-inter">Routes</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.totalRoutes}</h3>
            </div>

            {/* Total Passengers */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#0b6d41]" />
                <span className="text-xs text-gray-600 font-medium font-inter">Passengers</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.totalPassengers}</h3>
            </div>

            {/* Active Routes */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Bus className="w-5 h-5 text-[#0b6d41]" />
                <span className="text-xs text-gray-600 font-medium font-inter">Active</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.activeRoutes}</h3>
            </div>

            {/* Total Capacity */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#0b6d41]" />
                <span className="text-xs text-gray-600 font-medium font-inter">Capacity</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.totalCapacity}</h3>
            </div>
          </div>

          {/* Your Assigned Routes */}
          {recentRoutes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 font-poppins">Your Assigned Routes</h2>
                <Link
                  href="/staff/assigned-routes"
                  className="flex items-center gap-1 text-[#0b6d41] hover:text-[#085032] text-sm font-medium font-inter"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#0b6d41] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-[#0b6d41] rounded-lg flex items-center justify-center text-white font-bold text-sm font-poppins flex-shrink-0">
                          {route.route_number}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 font-inter truncate">{route.route_name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#0b6d41]" />
                              <span className="font-inter">{route.passenger_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#0b6d41]" />
                              <span className="font-inter">{route.departure_time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/staff/routes/${route.route_id}`}
                        className="px-4 py-2 bg-[#0b6d41] text-white rounded-lg hover:bg-[#085032] text-sm font-medium font-inter text-center flex-shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
