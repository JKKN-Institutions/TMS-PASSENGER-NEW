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
import { ThemeToggle } from '@/components/modern-ui-components';
import { useTheme } from '@/components/theme-provider';
import { EnrollmentProvider, useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
import BugReportWrapper from '@/components/bug-report-wrapper';
import MobileBottomNavbar from '@/components/mobile-bottom-navbar';

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
  const { theme, setTheme, actualTheme } = useTheme();
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
    <div className="h-screen bg-gray-50 overflow-hidden flex">
      {/* Enhanced Collapsible Desktop Sidebar */}
      <div 
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-white via-white to-gray-50 border-r border-gray-200/80 shadow-xl transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
        }`}
      >
        {/* Modern Header with Gradient */}
        <div className="relative">
          <div className={`flex items-center justify-between p-6 border-b border-gray-100/80 bg-gradient-to-r from-green-50/50 to-yellow-50/50 backdrop-blur-sm ${
            sidebarCollapsed ? 'flex-col space-y-3 py-4' : ''
          }`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'flex-col' : 'space-x-3'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-green-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Bus className="h-7 w-7 text-white drop-shadow-md" />
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fadeIn">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent">
                    TMS Student
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Transport Management</p>
                </div>
              )}
            </div>
            
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2.5 rounded-xl bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 group ${
                sidebarCollapsed ? 'mt-0' : ''
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
              )}
            </button>
          </div>
        </div>
        
        {/* Enhanced Navigation with Modern Design */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <div className="mb-6">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
            </div>
          )}
          
          <div className="space-y-1">
            {navigation.map((item) => {
              const isDisabled = item.disabled;
              const isActive = item.current;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className={`group relative flex items-center ${
                      sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                    } rounded-xl opacity-50 cursor-not-allowed`}
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
                    sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                  } rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-yellow-500 shadow-lg shadow-green-200/50 scale-[1.02]'
                      : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 hover:shadow-md'
                  }`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                      isActive 
                        ? 'text-white drop-shadow-sm' 
                        : 'text-gray-600 group-hover:text-green-600'
                    }`} />
                    {!sidebarCollapsed && (
                      <span className={`ml-3 text-sm font-semibold transition-colors duration-200 ${
                        isActive 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-700 group-hover:text-green-700'
                      }`}>
                        {item.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                    </div>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && !sidebarCollapsed && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className={`pt-6 mt-6 border-t border-gray-200/50 ${sidebarCollapsed ? '' : 'space-y-1'}`}>
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Settings
              </p>
            )}
            <Link
              href="/dashboard/settings"
              className={`group relative flex items-center ${
                sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
              } rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 hover:shadow-md`}
            >
              <Settings className="h-5 w-5 text-gray-600 group-hover:text-green-600 flex-shrink-0 transition-colors" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
                  Settings
                </span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                  Settings
                </div>
              )}
            </Link>
          </div>
        </nav>
        
        {/* Enhanced User Profile Section */}
        <div className={`border-t border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-gray-100/50 ${
          sidebarCollapsed ? 'p-4' : 'p-6'
        }`}>
          {sidebarCollapsed ? (
            <div className="group relative">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-green-600 to-yellow-500 flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                    <span className="text-sm font-bold text-white drop-shadow-sm">
                      {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-2.5 flex justify-center items-center rounded-xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                <LogOut className="h-4 w-4 text-red-600" />
              </button>
              <div className="absolute left-full ml-2 bottom-4 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                {user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-green-600 to-yellow-500 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white drop-shadow-sm">
                      {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate font-medium">
                    {user?.email || 'student@email.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col h-full flex-1 min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'
      }`}>
        {/* Enhanced Top bar */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-green-100 shadow-sm flex h-16 flex-shrink-0 items-center justify-between px-4 sm:px-6 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Logo for mobile - hamburger menu removed, using More menu in bottom nav instead */}
            <div className="flex items-center lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-yellow-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Bus className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">TMS Student</span>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-4 flex-1 max-w-2xl mx-8">
            <div className="flex items-center space-x-4 w-full">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search transport services..."
                  className="w-full pl-4 pr-12 py-2.5 border border-green-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-green-600 bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded shadow-sm">
                    ⌘ F
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle
                isDark={actualTheme === 'dark'}
                onToggle={(isDark) => setTheme(isDark ? 'dark' : 'light')}
                className="p-2 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
            
            {/* Notification Center */}
            {user?.id && (
              <div className="relative">
                <NotificationCenter 
                  userId={user.id} 
                  userType="student" 
                  className="p-2 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
            )}
            
            {/* Enhanced User Avatar */}
            <div className="relative group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-green-600 to-yellow-500 flex items-center justify-center cursor-pointer hover:from-green-700 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <span className="text-sm font-bold text-white drop-shadow-sm">
                  {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
              
              {/* User info tooltip on hover */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-green-100 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[110]">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 truncate">{user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}</p>
                  <p className="text-green-600 text-xs mt-1">{user?.email}</p>
                  <div className="mt-2 pt-2 border-t border-green-100">
                    <p className="text-xs text-gray-500">Transport Management System</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 min-w-0 main-content">
          <div className="container-modern py-2 sm:py-4 lg:py-6 min-w-0 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNavbar />
      
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