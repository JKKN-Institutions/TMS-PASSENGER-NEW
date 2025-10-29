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
  Route as RouteIcon,
  MoreHorizontal,
  ChevronDown
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

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

  // Bottom navbar items (first 4 main items + More)
  const bottomNavItems = [
    { name: 'Home', href: '/staff', icon: Home, current: pathname === '/staff' },
    { name: 'Routes', href: '/staff/assigned-routes', icon: RouteIcon, current: pathname === '/staff/assigned-routes' },
    { name: 'Students', href: '/staff/students', icon: Users, current: pathname === '/staff/students' },
    { name: 'Bookings', href: '/staff/bookings', icon: Calendar, current: pathname === '/staff/bookings' },
  ];

  // More menu items (remaining items)
  const moreMenuItems = [
    { name: 'All Routes', href: '/staff/routes', icon: Bus, current: pathname === '/staff/routes' },
    { name: 'Grievances', href: '/staff/grievances', icon: FileText, current: pathname === '/staff/grievances' },
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
      {/* Bottom sheet overlay for More menu */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside
        className={`
          hidden lg:flex
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-green-600 to-yellow-600 text-white
          flex-col shadow-xl
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-green-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Staff Portal</h2>
              <p className="text-xs text-white opacity-90">TMS Admin</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-green-500">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white ring-opacity-30">
              <User className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{staffName}</p>
              <p className="text-xs text-white opacity-90 truncate">{user?.email}</p>
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
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${item.current
                    ? 'bg-white bg-opacity-25 text-white font-semibold shadow-lg border border-white border-opacity-30'
                    : 'text-white font-medium hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:border hover:border-white hover:border-opacity-20 focus:bg-white focus:bg-opacity-25 focus:shadow-lg focus:border focus:border-white focus:border-opacity-30 focus:outline-none active:bg-white active:bg-opacity-30 active:scale-95'
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
              text-white font-medium
              hover:bg-red-500 hover:bg-opacity-90 hover:shadow-md hover:border hover:border-white hover:border-opacity-30
              focus:bg-red-600 focus:bg-opacity-90 focus:shadow-lg focus:border focus:border-white focus:border-opacity-40 focus:outline-none
              active:bg-red-700 active:bg-opacity-95 active:scale-95
              transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Bottom Navigation Bar - Mobile Only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                    item.current
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={item.current ? 2.5 : 2} />
                  <span className={`text-xs ${item.current ? 'font-semibold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <button
              onClick={() => setMoreMenuOpen(true)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                moreMenuItems.some(item => item.current)
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <MoreHorizontal className="w-6 h-6" strokeWidth={moreMenuItems.some(item => item.current) ? 2.5 : 2} />
              <span className={`text-xs ${moreMenuItems.some(item => item.current) ? 'font-semibold' : 'font-medium'}`}>
                More
              </span>
            </button>
          </div>
        </nav>

        {/* Bottom Sheet Menu for More Options */}
        <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out ${
            moreMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Menu Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">More Options</h2>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-4 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                      item.current
                        ? 'bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 shadow-sm'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.current
                        ? 'bg-gradient-to-br from-green-600 to-green-500 shadow-md'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${item.current ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${item.current ? 'text-green-700' : 'text-gray-900'}`}>
                        {item.name}
                      </h3>
                    </div>
                    {item.current && (
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}

              {/* Logout in More Menu */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl hover:bg-red-50 active:bg-red-100 transition-all mt-4 border-t border-gray-200 pt-6"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-red-600">Logout</h3>
                  <p className="text-xs text-red-500 mt-0.5">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-6"></div>
        </div>
      </div>
    </div>
  );
}
