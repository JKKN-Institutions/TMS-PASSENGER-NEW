'use client';

import React, { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut,
  Bus,
  MapPin,
  Settings,
  BarChart3,
  Navigation,
  Bug,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';
import { RequireAuth } from '@/components/protected-route';
import NotificationCenter from '@/components/notification-center';
import { EnrollmentProvider, useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
import BugReportWrapper from '@/components/bug-report-wrapper';
import MobileBottomNavbar from '@/components/mobile-bottom-navbar';
import FloatingActionButton from '@/components/passenger/floating-action-button';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
  requiresEnrollment?: boolean;
  disabled?: boolean;
}

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const enrollmentStatus = useEnrollmentStatus();

  // Memoize navigation items to prevent unnecessary re-renders
  const navigation: NavigationItem[] = useMemo(() => {
    const isEnrolled = enrollmentStatus?.isEnrolled || false;
    
    return [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: Home, 
        current: pathname === '/dashboard',
        requiresEnrollment: false 
      },
      { 
        name: 'My Routes', 
        href: '/dashboard/routes', 
        icon: MapPin, 
        current: pathname === '/dashboard/routes',
        requiresEnrollment: true,
        disabled: !isEnrolled
      },
      { 
        name: 'Live Track', 
        href: '/dashboard/live-track', 
        icon: Navigation, 
        current: pathname === '/dashboard/live-track',
        requiresEnrollment: true,
        disabled: !isEnrolled
      },
      { 
        name: 'Schedules', 
        href: '/dashboard/schedules', 
        icon: Calendar, 
        current: pathname === '/dashboard/schedules',
        requiresEnrollment: true,
        disabled: !isEnrolled
      },
      { 
        name: 'Payments', 
        href: '/dashboard/payments', 
        icon: CreditCard, 
        current: pathname === '/dashboard/payments',
        requiresEnrollment: false // Always accessible for enrollment payments
      },
      { 
        name: 'Grievances', 
        href: '/dashboard/grievances', 
        icon: MessageSquare, 
        current: pathname === '/dashboard/grievances',
        requiresEnrollment: false // Always accessible for enrollment-related grievances
      },
      { 
        name: 'Notifications', 
        href: '/dashboard/notifications', 
        icon: Bell, 
        current: pathname === '/dashboard/notifications',
        requiresEnrollment: false // Always accessible
      },
      { 
        name: 'Location', 
        href: '/dashboard/location', 
        icon: MapPin, 
        current: pathname === '/dashboard/location',
        requiresEnrollment: true,
        disabled: true // Disabled as requested
      },
      { 
        name: 'Bug Reports', 
        href: '/dashboard/bug-reports', 
        icon: Bug, 
        current: pathname === '/dashboard/bug-reports',
        requiresEnrollment: false // Always accessible
      },
      { 
        name: 'Profile', 
        href: '/dashboard/profile', 
        icon: User, 
        current: pathname === '/dashboard/profile',
        requiresEnrollment: false // Always accessible
      },
    ];
  }, [pathname, enrollmentStatus]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[var(--dark-bg-primary)] overflow-hidden flex">
      {/* Simplified Desktop Sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0
          bg-white border-r border-gray-200 shadow-lg
          transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
        }`}
      >
        {/* Sidebar Header */}
        <div className="relative">
          <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${
            sidebarCollapsed ? 'flex-col space-y-3 py-4' : ''
          }`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'flex-col' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-[#0b6d41] rounded-lg flex items-center justify-center">
                <img
                  src="/app-logo.png"
                  alt="JKKN TMS Logo"
                  className="h-6 w-6"
                />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900 font-poppins">
                    Student Portal
                  </h1>
                  <p className="text-xs text-gray-600 font-inter">TMS</p>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 transition-colors ${
                sidebarCollapsed ? 'mt-0' : ''
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isDisabled = item.disabled;
              const isActive = item.current;

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className={`group relative flex items-center ${
                      sidebarCollapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'
                    } rounded-lg opacity-50 cursor-not-allowed`}
                    title={`${item.name} - Available after enrollment`}
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                      <item.icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="ml-3 text-sm font-medium text-gray-400">
                          {item.name}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="text-xs">🔒</span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                        {item.name} 🔒
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center ${
                    sidebarCollapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'
                  } rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0b6d41] text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`} strokeWidth={isActive ? 2 : 1.5} />
                    {!sidebarCollapsed && (
                      <span className="ml-3 text-sm">
                        {item.name}
                      </span>
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className={`pt-6 mt-6 border-t border-gray-200 ${sidebarCollapsed ? '' : 'space-y-1'}`}>
            <Link
              href="/dashboard/settings"
              className={`group relative flex items-center ${
                sidebarCollapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'
              } rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 font-medium`}
            >
              <Settings className="h-5 w-5 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm">
                  Settings
                </span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  Settings
                </div>
              )}
            </Link>
          </div>
        </nav>
        
        {/* User Profile Section */}
        <div className={`border-t border-gray-200 bg-gray-50 ${sidebarCollapsed ? 'p-4' : 'p-6'}`}>
          {sidebarCollapsed ? (
            <div className="group relative">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="h-11 w-11 rounded-lg bg-[#0b6d41] flex items-center justify-center cursor-pointer">
                    <span className="text-sm font-bold text-white">
                      {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-2.5 flex justify-center items-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4 text-red-600" />
              </button>
              <div className="absolute left-full ml-2 bottom-4 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="h-11 w-11 rounded-lg bg-[#0b6d41] flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'student@email.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content with Dark Theme */}
      <div className={`flex flex-col h-full flex-1 min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'
      }`}>
        {/* Top bar - Simple and Clean */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex h-16 flex-shrink-0 items-center justify-between px-4 sm:px-6 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Logo for mobile */}
            <div className="flex items-center lg:hidden">
              <img
                src="/app-logo.png"
                alt="JKKN TMS"
                className="w-8 h-8 mr-2"
              />
              <span className="text-lg font-bold text-gray-900">TMS</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Term Period Badge */}
            {enrollmentStatus?.currentTerm && (
              <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                enrollmentStatus.currentTerm.status === 'active'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {enrollmentStatus.currentTerm.status === 'active' ? 'Active Term' : 'Inactive Term'}
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto min-w-0 main-content bg-gray-50">
          <div className="container-modern py-2 sm:py-4 lg:py-6 min-w-0 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNavbar />

      {/* Floating Action Button for Quick Access */}
      <FloatingActionButton />

      {/* Floating bug report button for dashboard */}
      <BugReportWrapper />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <EnrollmentProvider>
        <DashboardContent>{children}</DashboardContent>
      </EnrollmentProvider>
    </RequireAuth>
  );
} 