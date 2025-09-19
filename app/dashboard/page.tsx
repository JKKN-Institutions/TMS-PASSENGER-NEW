'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  PlusCircle,
  X
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/auth-context';
import EnrollmentDashboard from '@/components/enrollment-dashboard';
import EnhancedPassengerDashboard from '@/components/enhanced-passenger-dashboard';
import StaffDashboard from '@/components/staff-dashboard';
import PaymentStatusBadge from '@/components/payment-status-badge';
import { ServiceStatusBanner, AvailableServicesInfo } from '@/components/account-access-control';
import EnrollmentStatusBanner from '@/components/enrollment-status-banner';
import { useEnrollmentStatus, useEnrollment } from '@/lib/enrollment/enrollment-context';
import { StudentDashboardData } from '@/types';
import { 
  Button, 
  Card, 
  Alert, 
  Spinner, 
  ErrorState, 
  LoadingOverlay,
  SwipeHandler 
} from '@/components/modern-ui-components';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  console.log('🏁 Dashboard: Component rendering...');
  
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { enrollmentStatus, isLoading: enrollmentLoading, refreshEnrollmentStatus } = useEnrollment();
  
  console.log('🔑 Dashboard: Auth state:', { isAuthenticated, authLoading, userType });
  console.log('📋 Dashboard: Enrollment state:', { enrollmentStatus: enrollmentStatus ? 'loaded' : 'null', enrollmentLoading });
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [availableFees, setAvailableFees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [loadingStartTime] = useState(Date.now());

  // Ensure minimum loading time for better UX
  useEffect(() => {
    console.log('🚀 Dashboard: Setting up minimum loading time...');
    const timer = setTimeout(() => {
      console.log('⏰ Dashboard: Minimum loading time completed');
      setMinLoadingTime(false);
    }, 2000); // Increased to 2 seconds for better visibility

    return () => clearTimeout(timer);
  }, []);

  // Track when initial loading is complete
  useEffect(() => {
    const isAllLoaded = !authLoading && !enrollmentLoading && enrollmentStatus !== null && !isLoading && !minLoadingTime;
    console.log('🔍 Dashboard: Checking if loading complete:', {
      authLoading,
      enrollmentLoading,
      enrollmentStatusExists: enrollmentStatus !== null,
      isLoading,
      minLoadingTime,
      isAllLoaded
    });
    
    if (isAllLoaded) {
      const totalLoadTime = Date.now() - loadingStartTime;
      console.log(`✅ Dashboard: Initial load complete in ${totalLoadTime}ms`);
      setInitialLoadComplete(true);
    }
  }, [authLoading, enrollmentLoading, enrollmentStatus, isLoading, minLoadingTime, loadingStartTime]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      if (!user || !isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Create a mock student object from the authenticated user
      // Use enhanced user information from auth context (includes database integration)
      const currentStudent = {
        student_id: (user as any).studentId || user.id, // Use studentId if available from database integration
        email: user.email,
        full_name: user.full_name
      };

      console.log('📊 Dashboard received user object:', {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        studentId: (user as any).studentId,
        rollNumber: (user as any).rollNumber,
        isNewStudent: (user as any).isNewStudent,
        profileCompletionPercentage: (user as any).profileCompletionPercentage
      });
      
      console.log('📊 Dashboard fetching data for student:', {
        studentId: currentStudent.student_id,
        email: currentStudent.email,
        isNewStudent: (user as any).isNewStudent,
        rollNumber: (user as any).rollNumber
      });

      try {
        // If we have a studentId from database integration, use it directly
        if ((user as any).studentId) {
          console.log('✅ Using database student ID for data fetching:', (user as any).studentId);
          
          // Try to fetch dashboard data and payment status in parallel
          const [data, paymentStatusData] = await Promise.all([
            studentHelpers.getDashboardData((user as any).studentId),
            studentHelpers.getPaymentStatus((user as any).studentId)
          ]);

          setDashboardData(data);
          setPaymentStatus(paymentStatusData);
        } else {
          console.log('⚠️ No database student ID available, falling back to mock data');
          throw new Error('No database student ID available');
        }
      } catch (dbError) {
        console.log('Database fetch failed, creating mock data for new user:', dbError);
        
        // Create mock dashboard data for new users
        const mockDashboardData = {
          profile: {
            id: user.id,
            studentName: user.full_name,
            email: user.email,
            rollNumber: (user as any).rollNumber || `MOCK${user.id.substring(0, 8).toUpperCase()}`,
            mobile: '9876543210',
            department: { id: 'cs001', departmentName: 'Computer Science' },
            program: { id: 'btech001', programName: 'B.Tech', degreeName: 'Bachelor of Technology' },
            allocated_route_id: null,
            boarding_point: null,
            boarding_stop: null,
            transport_status: 'not_enrolled',
            transport_enrolled: false,
            transportProfile: undefined,
            firstLoginCompleted: true,
            profileCompletionPercentage: 80,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          transportStatus: {
            hasActiveRoute: false,
            routeInfo: undefined,
            pendingPayments: 0,
            totalFines: 0,
            lastTripDate: undefined
          },
          recentBookings: [],
          upcomingBookings: [],
          recentPayments: [],
          quickStats: {
            totalTrips: 0,
            totalSpent: 0,
            upcomingTrips: 0,
            activeGrievances: 0
          },
          notifications: [],
          grievances: []
        };

        const mockPaymentStatus = {
          status: 'active',
          hasOutstanding: false,
          outstandingAmount: 0,
          nextDueDate: null,
          recentPayments: []
        };

        setDashboardData(mockDashboardData);
        setPaymentStatus(mockPaymentStatus);
      }

      // Check if student has route allocation before fetching available fees
      const hasRouteFromData = dashboardData?.transportStatus?.hasActiveRoute || 
                              (dashboardData?.profile as any)?.allocated_route_id ||
                              (dashboardData?.profile as any)?.transportProfile?.transportStatus === 'active';

      // Only fetch available fees for students with route allocation AND inactive payment
      if (hasRouteFromData && paymentStatus && !paymentStatus.isActive) {
        try {
          const feesData = await studentHelpers.getAvailableFees(currentStudent.student_id);
          setAvailableFees(feesData);
        } catch (error) {
          console.error('🔍 Available fees not configured for this route/boarding point:', error);
          // Don't show error to user - fee structure may not be set up yet
          // This is normal for newly enrolled students
          setAvailableFees(null);
        }
      }

    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Refresh both dashboard data and enrollment status
      await Promise.all([
        fetchDashboardData(),
        // Refresh enrollment status to ensure latest state
        refreshEnrollmentStatus ? refreshEnrollmentStatus() : Promise.resolve()
      ]);
      
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setError('Please log in to access the dashboard');
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  // Enhanced Loading state with overlay
  if (authLoading || isLoading) {
    return (
      <>
        <LoadingOverlay 
          isVisible={true} 
          message="Loading your transport dashboard..."
        />
        <div className="min-h-screen bg-gray-50">
          <div className="container-modern py-8">
            <div className="space-y-6">
              {/* Skeleton loading for dashboard cards */}
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="modern-card" padding="lg">
                  <div className="skeleton h-6 w-32 mb-4" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render staff dashboard for staff users
  if (userType === 'staff') {
    return <StaffDashboard />;
  }

  // Enhanced Error state with recovery actions
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-modern py-8">
          <ErrorState
            title="Failed to Load Dashboard"
            message={error || 'Something went wrong. Please try refreshing the page.'}
            action={{
              label: refreshing ? 'Retrying...' : 'Try Again',
              onClick: handleRefresh
            }}
          />
        </div>
      </div>
    );
  }

  const { profile, transportStatus } = dashboardData;

  // Check if student has route allocation
  const hasRouteAllocation = transportStatus.hasActiveRoute || 
                           (profile as any)?.allocated_route_id ||
                           (profile as any)?.transportProfile?.transportStatus === 'active';

  // Get next due amount for inactive accounts
  const nextDueAmount = availableFees?.available_options?.find((option: any) => 
    option.is_available && option.is_recommended
  )?.amount;

  console.log('🔍 Dashboard Route Allocation Check:', {
    hasRouteAllocation,
    hasActiveRoute: transportStatus.hasActiveRoute,
    allocatedRouteId: (profile as any)?.allocated_route_id,
    transportStatus: (profile as any)?.transportProfile?.transportStatus,
    profileTransportEnrolled: profile?.transport_enrolled,
    profileTransportStatus: (profile as any)?.transport_status
  });

  // Use enrollment status from context to determine dashboard type
  // Show enrollment dashboard only if student is not enrolled (from enrollment context)
  // This ensures we show the main dashboard once enrollment verification is successful
  const isEnrolledFromContext = enrollmentStatus?.isEnrolled || false;
  const shouldShowEnrollmentDashboard = !hasRouteAllocation && !isEnrolledFromContext && !profile?.transport_enrolled;
  
  console.log('🔍 Dashboard Display Logic:', {
    shouldShowEnrollmentDashboard,
    hasRouteAllocation,
    isEnrolledFromContext,
    profileTransportEnrolled: profile?.transport_enrolled,
    enrollmentStatusFromContext: enrollmentStatus?.enrollmentStatus
  });

  // Show loading overlay during initial app loading and enrollment status check
  const isInitialLoading = !initialLoadComplete && (authLoading || minLoadingTime || (isAuthenticated && (enrollmentLoading || enrollmentStatus === null)));
  
  // Always log the loading state decision
  console.log('🎯 LOADING DECISION:', {
    shouldShowLoading: isInitialLoading,
    initialLoadComplete,
    authLoading,
    minLoadingTime,
    isAuthenticated,
    enrollmentLoading,
    enrollmentStatusNull: enrollmentStatus === null
  });
  
  if (isInitialLoading) {
    // Debug logging for loading states
    console.log('🎭 LOADING OVERLAY: Showing loading screen!', {
      authLoading,
      enrollmentLoading,
      enrollmentStatus: enrollmentStatus ? 'loaded' : 'null',
      minLoadingTime,
      initialLoadComplete,
      isInitialLoading
    });

    const loadingMessage = authLoading 
      ? "Authenticating..." 
      : enrollmentLoading || enrollmentStatus === null
      ? "Checking enrollment status..."
      : "Finalizing setup...";
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center z-50">
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto"
          >
            {/* TMS Logo/Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Bus className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Loading Spinner */}
            <div className="mb-4">
              <Spinner size="lg" color="green" />
            </div>
            
            {/* Loading Message */}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to TMS
            </h2>
            <p className="text-gray-600">
              {loadingMessage}
            </p>
            
            {/* Step indicator */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  {authLoading ? 'Authenticating...' : 
                   enrollmentLoading || enrollmentStatus === null ? 'Checking enrollment...' : 
                   'Setting up dashboard...'}
                </span>
                <span>
                  {authLoading ? '1/3' : 
                   enrollmentLoading || enrollmentStatus === null ? '2/3' : 
                   '3/3'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <motion.div
                  className="h-1 bg-gradient-to-r from-green-500 to-blue-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: authLoading ? "33%" : 
                           enrollmentLoading || enrollmentStatus === null ? "66%" : 
                           "100%" 
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </div>
              
              {/* Loading steps */}
              <div className="flex justify-between text-xs mt-3">
                <div className={`flex items-center space-x-1 ${!authLoading ? 'text-green-600' : 'text-gray-400'}`}>
                  {!authLoading ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-400 rounded-full" />}
                  <span>Auth</span>
                </div>
                <div className={`flex items-center space-x-1 ${!authLoading && (!enrollmentLoading && enrollmentStatus !== null) ? 'text-green-600' : 'text-gray-400'}`}>
                  {!authLoading && (!enrollmentLoading && enrollmentStatus !== null) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-400 rounded-full" />}
                  <span>Enrollment</span>
                </div>
                <div className={`flex items-center space-x-1 ${!minLoadingTime && !isLoading ? 'text-green-600' : 'text-gray-400'}`}>
                  {!minLoadingTime && !isLoading ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-400 rounded-full" />}
                  <span>Dashboard</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  if (shouldShowEnrollmentDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container-modern py-12 px-4">
          {/* Simplified Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="max-w-2xl mx-auto">
              {/* Welcome Icon */}
              <div className="mb-6">
                <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl shadow-lg">
                  <Bus className="w-12 h-12 text-white" />
                </div>
              </div>
              
              {/* Welcome Text */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to TMS Transport!
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Get started with your transport services in just a few simple steps
              </p>
            </div>
          </motion.div>

          {/* Single Main Action Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white shadow-xl border-0" padding="xl">
              <div className="text-center">
                {/* Enrollment Icon */}
                <div className="mb-6">
                  <div className="inline-flex p-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl">
                    <Bus className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                {/* Main Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Enroll for transport services to access routes, schedules, and live tracking. 
                  It only takes a few minutes to set up.
                </p>
                
                {/* Single Call-to-Action */}
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowEnrollmentForm(true)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Start Enrollment Process
                  </Button>
                  
                  <p className="text-sm text-gray-500">
                    You'll be able to choose your preferred route and boarding stop
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <Card className="bg-gray-50 border-gray-200" padding="md">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-600 text-sm">
                  Contact transport office or check the help section for guidance
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Enrollment Form Modal */}
          {showEnrollmentForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowEnrollmentForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Transport Enrollment</h2>
                    <button
                      onClick={() => setShowEnrollmentForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                  
                  <EnrollmentDashboard 
                    student={{
                      id: profile?.id || '',
                      student_name: profile?.studentName || '',
                      email: profile?.email || '',
                      transport_enrolled: profile?.transportProfile?.transportStatus === 'active',
                      enrollment_status: profile?.transportProfile?.enrollmentStatus || 'pending'
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Log the route allocation status for debugging
  console.log('🔍 Dashboard Payment Logic:');
  console.log('  - hasRouteAllocation:', hasRouteAllocation);
  console.log('  - paymentStatus?.isActive:', paymentStatus?.isActive);
  console.log('  - Should show payment restrictions:', hasRouteAllocation);

  // Show enhanced main transport dashboard with swipe support
  return (
    <>
      {/* Loading overlay for dashboard data loading (after enrollment status is checked) */}
      <LoadingOverlay
        isVisible={isLoading && !enrollmentLoading && enrollmentStatus !== null}
        message="Loading dashboard..."
        className="bg-gray-50/80"
      />
      
      {/* Refreshing indicator */}
      {refreshing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white shadow-lg rounded-full px-6 py-3 flex items-center space-x-3"
          >
            <Spinner size="sm" color="green" />
            <span className="text-sm font-medium text-gray-700">Refreshing...</span>
          </motion.div>
        </div>
      )}
      
      <SwipeHandler
        onSwipeDown={handleRefresh}
        className="min-h-screen bg-gray-50"
      >
        <div className="container-modern py-8 space-y-8">
          {/* Payment Status Components - ONLY for students with route allocation */}
          {hasRouteAllocation && paymentStatus && (
            <>
              {/* Payment Status Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PaymentStatusBadge
                  isActive={paymentStatus.isActive}
                  lastPaidTerm={paymentStatus.lastPaidTerm}
                  nextDueAmount={nextDueAmount}
                />
              </motion.div>

              {/* Service Status Banner for Inactive Accounts */}
              <ServiceStatusBanner 
                isActive={paymentStatus.isActive}
                nextDueAmount={nextDueAmount}
              />

              {/* Available Services Info for Inactive Accounts */}
              <AvailableServicesInfo isActive={paymentStatus.isActive} />
            </>
          )}

          {/* Enhanced Passenger Dashboard */}
          <EnhancedPassengerDashboard 
            data={dashboardData}
            loading={isLoading && !enrollmentLoading}
            onRefresh={handleRefresh}
          />
        </div>
      </SwipeHandler>
    </>
  );
} 