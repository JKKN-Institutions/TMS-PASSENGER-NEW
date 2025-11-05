'use client';

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';
import EnhancedPaymentInterface from '@/components/enhanced-payment-interface';
import PaymentHistoryViewer from '@/components/payment-history-viewer';
import PageWrapper from '@/components/page-wrapper';
import PassengerPageHeader from '@/components/passenger-page-header';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentLoading } from '@/components/loading-screen';

export default function PaymentsPage() {
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Check authentication using session manager
      if (!sessionManager.isAuthenticated()) {
        toast.error('Please login to continue');
        window.location.href = '/login';
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        toast.error('Invalid session data');
        window.location.href = '/login';
        return;
      }

      // Set student data from session
      setStudent({
        id: currentStudent.student_id,
        name: currentStudent.student_name
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentInitiated = (paymentOption: any) => {
    toast.success('Payment initiated successfully!');
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  if (isLoading) {
    return <PaymentLoading />;
  }

  if (!student) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please login to access payments</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 py-4 sm:py-6">
        {/* Header */}
        <PassengerPageHeader
          title="Payments"
          icon={CreditCard}
        />

        {/* Student Info Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Student</div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{student.name}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Academic Year 2025-26</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-2 p-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'payments', label: 'Make Payment', icon: '💳', description: 'Pay fees securely' },
                { id: 'receipts', label: 'Payment History', icon: '🧾', description: 'View receipts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center space-x-2 sm:space-x-3 whitespace-nowrap flex-shrink-0 min-w-0 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-[#0b6d41] text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-green-50 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{tab.icon}</span>
                  <div className="text-left min-w-0">
                    <div className="truncate font-bold">{tab.label}</div>
                    <div className={`text-xs truncate ${activeTab === tab.id ? 'text-green-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === 'payments' && (
              <EnhancedPaymentInterface
                studentId={student.id}
                onPaymentInitiated={handlePaymentInitiated}
                onError={handleError}
              />
            )}
            
            {activeTab === 'receipts' && (
              <PaymentHistoryViewer studentId={student.id} />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
} 