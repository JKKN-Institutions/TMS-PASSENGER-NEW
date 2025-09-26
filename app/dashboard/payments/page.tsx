'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, History, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
import EnhancedPaymentInterface from '@/components/enhanced-payment-interface';
import PaymentHistoryViewer from '@/components/payment-history-viewer';
import { EnhancedLoading, SkeletonCard } from '@/components/enhanced-loading';
import toast from 'react-hot-toast';

interface PaymentData {
  studentId: string;
  studentName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enrollmentStatus = useEnrollmentStatus();
  const [activeTab, setActiveTab] = useState('payments');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPaymentData();
    }
  }, [authLoading, isAuthenticated]);

  const fetchPaymentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call with proper error handling
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!user) {
        throw new Error('User not found');
      }

      // Mock payment data - replace with actual API call
      const mockData: PaymentData = {
        studentId: user.id,
        studentName: user.full_name || 'Student',
        totalAmount: 25000,
        paidAmount: 15000,
        pendingAmount: 10000,
        dueDate: '2024-03-15',
        status: 'pending'
      };

      setPaymentData(mockData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentInitiated = (paymentOption: any) => {
    toast.success('Payment initiated successfully!', {
      icon: '💳',
      duration: 4000
    });
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  // Enhanced loading state
  if (authLoading) {
    return (
      <EnhancedLoading
        type="auth"
        message="Authenticating..."
        submessage="Verifying your access to payment portal"
        size="lg"
      />
    );
  }

  // Authentication required
  if (!isAuthenticated) {
    return (
      <EnhancedLoading
        type="auth"
        error="Authentication required to access payments"
        size="lg"
      />
    );
  }

  // Data loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EnhancedLoading
        type="page"
        error={error}
        size="lg"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Enhanced Header with Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.25)'
          }}
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CreditCard className="w-8 h-8" />
                  <h1 className="text-2xl lg:text-3xl font-bold">Payment Portal</h1>
                </div>
                <p className="text-green-100 text-lg">
                  Secure transport fee management for {paymentData?.studentName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center lg:text-right">
                  <div className="text-sm text-green-100">Total Amount</div>
                  <div className="text-xl font-bold">₹{paymentData?.totalAmount.toLocaleString()}</div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-sm text-green-100">Paid</div>
                  <div className="text-xl font-bold text-green-200">₹{paymentData?.paidAmount.toLocaleString()}</div>
                </div>
                <div className="text-center lg:text-right col-span-2 lg:col-span-1">
                  <div className="text-sm text-yellow-100">Pending</div>
                  <div className="text-xl font-bold text-yellow-200">₹{paymentData?.pendingAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-green-100 mb-2">
                <span>Payment Progress</span>
                <span>{Math.round((paymentData?.paidAmount || 0) / (paymentData?.totalAmount || 1) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-green-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((paymentData?.paidAmount || 0) / (paymentData?.totalAmount || 1) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-yellow-300 h-2 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="brand-card border-0"
        >
          <nav className="flex space-x-1 p-1 bg-gray-50 rounded-lg">
            {[
              { id: 'payments', label: 'Make Payment', icon: CreditCard },
              { id: 'receipts', label: 'Payment History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                style={activeTab === tab.id ? {
                  background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                } : {}}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="brand-card p-6"
        >
          {activeTab === 'payments' && paymentData && (
            <EnhancedPaymentInterface
              studentId={paymentData.studentId}
              onPaymentInitiated={handlePaymentInitiated}
              onError={handleError}
            />
          )}
          
          {activeTab === 'receipts' && paymentData && (
            <PaymentHistoryViewer studentId={paymentData.studentId} />
          )}
        </motion.div>
      </div>
    </div>
  );
} 