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
  ChevronDown,
  ScanLine
} from 'lucide-react';
import TicketScanner from './components/TicketScanner';
import './sidebar-styles.css';

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
  const [scannerOpen, setScannerOpen] = useState(false);

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
    { name: 'Scan Ticket', icon: ScanLine, action: () => setScannerOpen(true) },
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
          w-72 sidebar-theme-adaptive
          flex-col shadow-2xl
          backdrop-blur-xl
          border-r sidebar-border-adaptive
        `}
      >
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 sidebar-pattern-overlay pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5LTRzNC4wMSAxLjc5IDQuMDEgNGMwIDIuMjEtMS44MSA0LTQuMDEgNFMzNiAzNi4yMSAzNiAzNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        </div>

        {/* Top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>

        {/* Sidebar Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20 backdrop-blur-sm">
              <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white sidebar-text-adaptive tracking-tight">Staff Portal</h2>
              <p className="text-xs text-emerald-100 font-medium">Transport Management System</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="relative p-4 border-b border-white/10">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/10 hover:from-white/15 hover:to-white/10 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20">
                  <User className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate drop-shadow-md">{staffName}</p>
                <p className="text-xs text-emerald-100 truncate opacity-90">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 relative sidebar-nav-scroll">
          <div className="space-y-1.5">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    nav-item-animated group relative flex items-center space-x-3 px-4 py-3.5 rounded-xl
                    transition-all duration-300 ease-out
                    ${item.current
                      ? 'bg-gradient-to-r from-white/20 to-white/10 text-white font-bold shadow-xl border border-white/30 backdrop-blur-sm scale-[1.02]'
                      : 'text-white/90 font-semibold hover:bg-white/15 hover:text-white hover:shadow-lg hover:scale-[1.02] hover:border-white/20 focus:bg-white/20 focus:text-white focus:shadow-xl focus:border-white/30 focus:outline-none active:bg-white/25 active:scale-95 border border-transparent'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Active indicator */}
                  {item.current && (
                    <div className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-r-full shadow-lg"></div>
                  )}

                  {/* Icon container */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${item.current
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg scale-110'
                      : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-md'
                    }
                  `}>
                    <Icon className="w-5 h-5" strokeWidth={item.current ? 2.5 : 2} />
                  </div>

                  {/* Text */}
                  <span className={`text-sm tracking-wide ${item.current ? 'sidebar-text-adaptive' : ''}`}>
                    {item.name}
                  </span>

                  {/* Hover shimmer effect */}
                  <div className="shimmer-effect absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"></div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="relative p-4 border-t border-white/10 bg-gradient-to-t from-black/10 to-transparent">
          <button
            onClick={handleLogout}
            className="group relative w-full flex items-center justify-center space-x-3 px-4 py-4 rounded-xl
              bg-gradient-to-r from-red-500/20 to-red-600/20
              text-white font-bold
              border border-red-400/30
              hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:border-red-300 hover:scale-[1.02]
              focus:from-red-600 focus:to-red-700 focus:shadow-2xl focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-transparent
              active:from-red-700 active:to-red-800 active:scale-95
              transition-all duration-300 overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-300/20 to-red-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

            {/* Icon */}
            <div className="relative w-10 h-10 rounded-xl bg-red-500/30 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:rotate-12">
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
            </div>

            {/* Text */}
            <span className="relative text-sm tracking-wide drop-shadow-md">Sign Out</span>
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
                const isAction = 'action' in item;
                const ItemComponent = isAction ? 'button' : Link;

                return (
                  <ItemComponent
                    key={item.name}
                    {...(isAction
                      ? {
                          onClick: () => {
                            setMoreMenuOpen(false);
                            item.action?.();
                          }
                        }
                      : {
                          href: item.href!,
                          onClick: () => setMoreMenuOpen(false)
                        }
                    )}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                      item.current
                        ? 'bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 shadow-sm'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    } ${isAction && item.name === 'Scan Ticket' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.current
                        ? 'bg-gradient-to-br from-green-600 to-green-500 shadow-md'
                        : isAction && item.name === 'Scan Ticket'
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-md'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${item.current || (isAction && item.name === 'Scan Ticket') ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold ${
                        item.current
                          ? 'text-green-700'
                          : isAction && item.name === 'Scan Ticket'
                          ? 'text-blue-700'
                          : 'text-gray-900'
                      }`}>
                        {item.name}
                      </h3>
                      {isAction && item.name === 'Scan Ticket' && (
                        <p className="text-xs text-blue-600 mt-0.5">Verify passenger tickets</p>
                      )}
                    </div>
                    {item.current && (
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    )}
                  </ItemComponent>
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

        {/* Floating Action Button - Scan Ticket */}
        <button
          onClick={() => setScannerOpen(true)}
          className="fixed bottom-32 right-6 lg:bottom-24 lg:right-8 z-30 w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
          aria-label="Scan Ticket"
          title="Scan Ticket"
        >
          <ScanLine className="w-8 h-8 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />

          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></span>
        </button>

        {/* Ticket Scanner Modal */}
        <TicketScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={(bookingId) => {
            console.log('✅ Ticket verified:', bookingId);
            // Optionally refresh the bookings page if currently on it
            if (pathname === '/staff/bookings') {
              router.refresh();
            }
          }}
        />
      </div>
    </div>
  );
}
