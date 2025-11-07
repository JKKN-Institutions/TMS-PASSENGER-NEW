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
  ScanLine,
  UserCheck,
  Bug
} from 'lucide-react';
import TicketScanner from './components/TicketScanner';
import './sidebar-styles.css';
import { LanguageProvider, useLanguage } from '@/lib/i18n/language-context';
import LanguageSwitcher from '@/components/language-switcher';

// Inner layout component that uses language context
function StaffLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading, user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  console.log('🔍 Staff layout auth state:', { isAuthenticated, userType, isLoading, user });

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbee]">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#0b6d41]/20 max-w-sm">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0b6d41]/20 border-t-[#0b6d41]"></div>
          </div>
          <p className="text-gray-800 text-lg font-semibold mb-2 font-poppins">Staff Dashboard</p>
          <p className="text-gray-600 text-sm font-inter">Loading your dashboard...</p>
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
    { name: 'Attendance', href: '/staff/attendance', icon: UserCheck, current: pathname === '/staff/attendance' },
    { name: 'Assigned Routes', href: '/staff/assigned-routes', icon: RouteIcon, current: pathname === '/staff/assigned-routes' },
    { name: 'Students', href: '/staff/students', icon: Users, current: pathname === '/staff/students' },
    { name: 'Routes', href: '/staff/routes', icon: Bus, current: pathname === '/staff/routes' },
    { name: 'Grievances', href: '/staff/grievances', icon: FileText, current: pathname === '/staff/grievances' },
    { name: 'Bookings', href: '/staff/bookings', icon: Calendar, current: pathname === '/staff/bookings' },
    { name: 'Reports', href: '/staff/reports', icon: TrendingUp, current: pathname === '/staff/reports' },
    { name: 'My Bug Reports', href: '/staff/my-bug-reports', icon: Bug, current: pathname.startsWith('/staff/my-bug-reports') },
    { name: 'Profile', href: '/staff/profile', icon: User, current: pathname === '/staff/profile' },
  ];

  // Bottom navbar items (first 4 main items + More)
  const bottomNavItems = [
    { name: 'Home', href: '/staff', icon: Home, current: pathname === '/staff' },
    { name: 'Attendance', href: '/staff/attendance', icon: UserCheck, current: pathname === '/staff/attendance' },
    { name: 'Students', href: '/staff/students', icon: Users, current: pathname === '/staff/students' },
    { name: 'Bookings', href: '/staff/bookings', icon: Calendar, current: pathname === '/staff/bookings' },
  ];

  // More menu items (remaining items)
  const moreMenuItems = [
    { name: 'Scan Ticket', icon: ScanLine, action: () => setScannerOpen(true) },
    { name: 'Assigned Routes', href: '/staff/assigned-routes', icon: RouteIcon, current: pathname === '/staff/assigned-routes' },
    { name: 'Grievances', href: '/staff/grievances', icon: FileText, current: pathname === '/staff/grievances' },
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
      <aside className="hidden lg:flex fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white flex-col shadow-lg border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0b6d41] rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-poppins">Staff Portal</h2>
              <p className="text-xs text-gray-600 font-inter">TMS</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#0b6d41] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate font-inter">{staffName}</p>
                <p className="text-xs text-gray-600 truncate font-inter">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group relative flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${item.current
                    ? 'bg-[#0b6d41] text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.current ? 'text-white' : 'text-gray-500'}`} strokeWidth={item.current ? 2 : 1.5} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg
              bg-red-50 text-red-600 font-medium
              hover:bg-red-100 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Mobile only */}
        <div className="lg:hidden sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile: App Logo & Name */}
            <div className="flex items-center space-x-2">
              <img
                src="/app-logo.png"
                alt="TMS Logo"
                className="w-8 h-8 drop-shadow-md"
              />
              <h1 className="text-lg font-bold text-gray-900">TMS</h1>
            </div>
          </div>
        </div>

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
                      ? 'text-[#0b6d41] bg-[#0b6d41]/10'
                      : 'text-gray-600 hover:text-[#0b6d41] hover:bg-gray-50 active:bg-gray-100'
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
                  ? 'text-[#0b6d41] bg-[#0b6d41]/10'
                  : 'text-gray-600 hover:text-[#0b6d41] hover:bg-gray-50 active:bg-gray-100'
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
                        ? 'bg-[#0b6d41]/10 border border-[#0b6d41]/30 shadow-sm'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    } ${isAction && item.name === 'Scan Ticket' ? 'bg-[#ffde59]/10 border border-[#ffde59]/30' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.current
                        ? 'bg-[#0b6d41] shadow-md'
                        : isAction && item.name === 'Scan Ticket'
                        ? 'bg-[#ffde59] shadow-md'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${item.current || (isAction && item.name === 'Scan Ticket') ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className={`font-semibold font-inter truncate ${
                        item.current
                          ? 'text-[#0b6d41]'
                          : isAction && item.name === 'Scan Ticket'
                          ? 'text-[#0b6d41]'
                          : 'text-gray-900'
                      }`}>
                        {item.name}
                      </h3>
                      {isAction && item.name === 'Scan Ticket' && (
                        <p className="text-xs text-[#0b6d41]/80 mt-0.5 font-inter truncate">Verify passenger tickets</p>
                      )}
                    </div>
                    {item.current && (
                      <div className="w-2 h-2 bg-[#0b6d41] rounded-full"></div>
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

        {/* Floating Action Button - Scan Ticket (positioned above bug report button) */}
        <button
          onClick={() => setScannerOpen(true)}
          className="fixed bottom-[200px] right-6 lg:bottom-[104px] lg:right-8 z-30 w-16 h-16 bg-[#0b6d41] text-white rounded-full shadow-2xl hover:shadow-xl hover:scale-110 hover:bg-[#085032] active:scale-95 transition-all flex items-center justify-center group"
          aria-label="Scan Ticket"
          title="Scan Ticket"
        >
          <ScanLine className="w-8 h-8 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />

          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-[#0b6d41] animate-ping opacity-20"></span>
        </button>

        {/* Ticket Scanner Modal */}
        <TicketScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          staffEmail={user?.email}
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

// Main layout component with providers
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider defaultLanguage="en">
      <StaffLayoutInner>
        {children}
      </StaffLayoutInner>
    </LanguageProvider>
  );
}
