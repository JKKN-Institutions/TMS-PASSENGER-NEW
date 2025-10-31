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
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mb-6"></div>
      <p className="text-gray-600 font-inter text-lg font-medium">Loading Staff Dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-poppins mb-2">Welcome back, {staffName}!</h1>
              <p className="text-white font-inter text-lg opacity-95">{department}</p>
              <p className="text-white font-inter text-sm mt-1 opacity-90">Manage your assigned routes and passengers efficiently</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserCheck className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-lighter to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                <RouteIcon className="w-7 h-7 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-primary-dark font-semibold font-inter text-sm uppercase tracking-wide">Routes</span>
            </div>
            <h3 className="text-4xl font-extrabold font-poppins text-gray-900">{stats.totalRoutes}</h3>
            <p className="text-gray-600 font-inter text-sm mt-2 font-medium">Assigned to you</p>
          </div>

          {/* Total Passengers */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary-light to-secondary/10 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-secondary-darker" strokeWidth={2.5} />
              </div>
              <span className="text-secondary-darker font-semibold font-inter text-sm uppercase tracking-wide">Passengers</span>
            </div>
            <h3 className="text-4xl font-extrabold font-poppins text-gray-900">{stats.totalPassengers}</h3>
            <p className="text-gray-600 font-inter text-sm mt-2 font-medium">Total passengers</p>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-success-light to-success/10 rounded-xl flex items-center justify-center shadow-sm">
                <Bus className="w-7 h-7 text-success" strokeWidth={2.5} />
              </div>
              <span className="text-success-dark font-semibold font-inter text-sm uppercase tracking-wide">Active</span>
            </div>
            <h3 className="text-4xl font-extrabold font-poppins text-gray-900">{stats.activeRoutes}</h3>
            <p className="text-gray-600 font-inter text-sm mt-2 font-medium">Active routes</p>
          </div>

          {/* Total Capacity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-lighter to-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-7 h-7 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-primary-dark font-semibold font-inter text-sm uppercase tracking-wide">Capacity</span>
            </div>
            <h3 className="text-4xl font-extrabold font-poppins text-gray-900">{stats.totalCapacity}</h3>
            <p className="text-gray-600 font-inter text-sm mt-2 font-medium">Total seats</p>
          </div>
        </div>

        {/* Recent Routes */}
        {recentRoutes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-poppins text-gray-900">Your Assigned Routes</h2>
              <Link
                href="/staff/assigned-routes"
                className="flex items-center gap-2 text-primary hover:text-primary-dark focus:text-primary-600 focus:underline focus:outline-none active:text-primary-900 font-semibold font-inter text-sm transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-lighter to-secondary-light rounded-xl border border-primary/30 hover:shadow-lg hover:border-primary transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-bold font-poppins text-lg shadow-md">
                      {route.route_number}
                    </div>
                    <div>
                      <h3 className="font-bold font-poppins text-gray-900 text-lg">{route.route_name}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" strokeWidth={2.5} />
                          <span className="font-semibold font-inter">{route.passenger_count} passengers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-secondary-darker" strokeWidth={2.5} />
                          <span className="font-semibold font-inter">{route.departure_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/staff/routes/${route.route_id}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary-600 focus:from-primary-600 focus:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 transition-all text-sm font-semibold font-inter shadow-md hover:shadow-xl hover:scale-105"
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
          <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/staff/assigned-routes"
              className="flex items-center p-5 bg-gradient-to-br from-primary-lighter to-primary/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-100 transition-all border border-primary/30 hover:border-primary focus:border-primary group"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <RouteIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-primary-dark">Assigned Routes</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">View routes and passengers</p>
              </div>
            </Link>

            <Link
              href="/staff/routes"
              className="flex items-center p-5 bg-gradient-to-br from-secondary-light to-secondary/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 active:scale-100 transition-all border border-secondary/40 hover:border-secondary-dark focus:border-secondary-darker group"
            >
              <div className="w-12 h-12 bg-secondary-darker rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Bus className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-secondary-darker">All Routes</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">Browse all transport routes</p>
              </div>
            </Link>

            <Link
              href="/staff/students"
              className="flex items-center p-5 bg-gradient-to-br from-primary-lighter to-primary/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-100 transition-all border border-primary/30 hover:border-primary focus:border-primary group"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-primary-dark">Students</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">View student records</p>
              </div>
            </Link>

            <Link
              href="/staff/grievances"
              className="flex items-center p-5 bg-gradient-to-br from-secondary-light to-secondary/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 active:scale-100 transition-all border border-secondary/40 hover:border-secondary-dark focus:border-secondary-darker group"
            >
              <div className="w-12 h-12 bg-secondary-darker rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-secondary-darker">Grievances</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">Handle complaints</p>
              </div>
            </Link>

            <Link
              href="/staff/bookings"
              className="flex items-center p-5 bg-gradient-to-br from-success-light to-success/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 active:scale-100 transition-all border border-success/30 hover:border-success focus:border-success-dark group"
            >
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-success-dark">Bookings</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">View booking requests</p>
              </div>
            </Link>

            <Link
              href="/staff/reports"
              className="flex items-center p-5 bg-gradient-to-br from-primary-lighter to-primary/10 rounded-xl hover:shadow-lg hover:scale-[1.02] focus:shadow-xl focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-100 transition-all border border-primary/30 hover:border-primary focus:border-primary group"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold font-poppins text-gray-900 text-base group-hover:text-primary-dark">Reports</h3>
                <p className="text-sm font-inter text-gray-700 mt-0.5 font-medium">Generate reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
