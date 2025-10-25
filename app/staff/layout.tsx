'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Bus,
  FileText,
  Calendar,
  TrendingUp,
  User,
  Menu,
  X,
  Home,
  LogOut,
  Briefcase,
  Route as RouteIcon
} from 'lucide-react';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  console.log('🔍 Staff layout auth state:', { isAuthenticated, userType, isLoading, user });

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-200 max-w-sm">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
          </div>
          <p className="text-gray-800 text-lg font-semibold mb-2">Staff Dashboard</p>
          <p className="text-gray-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not staff
  if (!isAuthenticated || userType !== 'staff') {
    router.replace('/login');
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/staff', icon: Home, current: pathname === '/staff' },
    { name: 'Assigned Routes', href: '/staff/assigned-routes', icon: RouteIcon, current: pathname === '/staff/assigned-routes' },
    { name: 'Students', href: '/staff/students', icon: Users, current: pathname === '/staff/students' },
    { name: 'Routes', href: '/staff/routes', icon: Bus, current: pathname === '/staff/routes' },
    { name: 'Grievances', href: '/staff/grievances', icon: FileText, current: pathname === '/staff/grievances' },
    { name: 'Bookings', href: '/staff/bookings', icon: Calendar, current: pathname === '/staff/bookings' },
    { name: 'Reports', href: '/staff/reports', icon: TrendingUp, current: pathname === '/staff/reports' },
    { name: 'Profile', href: '/staff/profile', icon: User, current: pathname === '/staff/profile' },
  ];

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const staffName = (user as any)?.staff_name || user?.email?.split('@')[0] || 'Staff';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-gradient-to-b from-green-600 to-yellow-600 text-white
          flex flex-col shadow-xl
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Staff Portal</h2>
                <p className="text-xs text-green-200">TMS Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-white hover:bg-opacity-10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-green-500">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{staffName}</p>
              <p className="text-xs text-green-200 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${item.current
                    ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                    : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-green-500">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
              text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white
              transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h1 className="text-lg font-bold text-gray-800">Staff Portal</h1>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
