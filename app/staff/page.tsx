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
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StaffDashboardPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeRoutes: 0,
    pendingGrievances: 0,
    todayBookings: 0
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is authenticated and is staff
        if (isLoading) {
          return; // Wait for auth to load
        }

        if (!isAuthenticated || userType !== 'staff') {
          console.log('❌ Staff page access denied:', { isAuthenticated, userType, user });
          router.replace('/login');
          return;
        }

        console.log('✅ Staff authenticated:', { user, userType });

        // Load dashboard stats
        // TODO: Replace with actual API calls
        setStats({
          totalStudents: 0,
          activeRoutes: 0,
          pendingGrievances: 0,
          todayBookings: 0
        });

      } catch (err: any) {
        console.error('❌ Error loading staff dashboard:', err);
        setError(err.message || 'Failed to load dashboard data');
        setTimeout(() => setError(null), 10000);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, isLoading, user]);

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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {staffName}</h1>
              <p className="text-purple-100 text-lg">{department}</p>
              <p className="text-purple-200 text-sm mt-1">Manage transport operations efficiently</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-sm font-medium">Students</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
            <p className="text-gray-500 text-sm mt-1">Total enrolled students</p>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Routes</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.activeRoutes}</h3>
            <p className="text-gray-500 text-sm mt-1">Active routes</p>
          </div>

          {/* Pending Grievances */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-orange-600 text-sm font-medium">Grievances</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.pendingGrievances}</h3>
            <p className="text-gray-500 text-sm mt-1">Pending grievances</p>
          </div>

          {/* Today's Bookings */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-sm font-medium">Bookings</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.todayBookings}</h3>
            <p className="text-gray-500 text-sm mt-1">Today's bookings</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/staff/students"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Manage Students</h3>
                <p className="text-sm text-gray-600">View and manage student records</p>
              </div>
            </Link>

            <Link
              href="/staff/routes"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <Bus className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">View Routes</h3>
                <p className="text-sm text-gray-600">Monitor transport routes</p>
              </div>
            </Link>

            <Link
              href="/staff/grievances"
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              <FileText className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Grievances</h3>
                <p className="text-sm text-gray-600">Handle student complaints</p>
              </div>
            </Link>

            <Link
              href="/staff/bookings"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <Calendar className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Bookings</h3>
                <p className="text-sm text-gray-600">View booking requests</p>
              </div>
            </Link>

            <Link
              href="/staff/reports"
              className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <TrendingUp className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Reports</h3>
                <p className="text-sm text-gray-600">Generate analytics reports</p>
              </div>
            </Link>

            <Link
              href="/staff/drivers"
              className="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
            >
              <Users className="w-6 h-6 text-teal-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800">Drivers</h3>
                <p className="text-sm text-gray-600">Manage driver information</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
}
