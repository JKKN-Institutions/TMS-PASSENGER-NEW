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
import { useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
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
import { DashboardLoading } from '@/components/loading-screen';

export default function DashboardPage() {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const enrollmentStatus = useEnrollmentStatus();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [availableFees, setAvailableFees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

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
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed successfully');
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
    return <DashboardLoading />;
  }

  // Render staff dashboard for staff users
  if (userType === 'staff') {
    return <StaffDashboard />;
  }

  // Enhanced Error state with recovery actions
  if (error || !dashboardData) {
    return (
      <div className="min-h-full py-8 sm:py-12">
        <ErrorState
          title="Failed to Load Dashboard"
          message={error || 'Something went wrong. Please try refreshing the page.'}
          action={{
            label: refreshing ? 'Retrying...' : 'Try Again',
            onClick: handleRefresh
          }}
        />
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
  
  if (shouldShowEnrollmentDashboard) {
    return (
      <div className="min-h-full py-8 sm:py-12 px-4">
          {/* Simplified Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="max-w-2xl mx-auto">
              {/* Welcome Icon */}
              <div className="mb-6">
                <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-yellow-500 rounded-3xl shadow-xl">
                  <Bus className="w-12 h-12 text-white drop-shadow-sm" />
                </div>
              </div>
              
              {/* Welcome Text */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-4">
                Welcome to TMS Transport!
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed font-medium">
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
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border border-green-100" padding="xl">
              <div className="text-center">
                {/* Enrollment Icon */}
                <div className="mb-6">
                  <div className="inline-flex p-6 bg-gradient-to-r from-green-500 to-yellow-500 rounded-2xl shadow-lg">
                    <Bus className="w-16 h-16 text-white drop-shadow-sm" />
                  </div>
                </div>
                
                {/* Main Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-700 mb-8 text-lg leading-relaxed font-medium">
                  Enroll for transport services to access routes, schedules, and live tracking. 
                  It only takes a few minutes to set up.
                </p>
                
                {/* Single Call-to-Action */}
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowEnrollmentForm(true)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white font-semibold py-4 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Start Enrollment Process
                  </Button>
                  
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    🚌 You'll be able to choose your preferred route and boarding stop
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
            <Card className="bg-white/70 backdrop-blur-sm border-green-100 shadow-sm" padding="md">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-600 text-sm">
                  💬 Contact transport office or check the help section for guidance
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Enrollment Form Modal */}
          {showEnrollmentForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowEnrollmentForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">Transport Enrollment</h2>
                    <button
                      onClick={() => setShowEnrollmentForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
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
    <SwipeHandler
      onSwipeDown={handleRefresh}
      className="min-h-full"
    >
      <div className="space-y-6 sm:space-y-8">
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
          loading={isLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </SwipeHandler>
  );
} 