'use client';

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';
import EnhancedPaymentInterface from '@/components/enhanced-payment-interface';
import PaymentHistoryViewer from '@/components/payment-history-viewer';
import toast from 'react-hot-toast';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-200">
          <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please login to access payments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-2 sm:p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-yellow-500 rounded-2xl p-6 sm:p-8 text-white shadow-2xl border border-green-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm">Payment Center</h1>
                  <p className="text-green-100 mt-1 text-sm sm:text-base">Secure transport fee management system</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-green-100 mb-1">Student</div>
                <div className="text-lg sm:text-xl font-bold truncate text-white drop-shadow-sm">{student.name}</div>
                <div className="text-xs sm:text-sm text-green-100 mt-1">Academic Year 2025-26</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200">
          <div className="border-b border-green-100">
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
                      ? 'bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{tab.icon}</span>
                  <div className="text-left min-w-0">
                    <div className="truncate font-bold">{tab.label}</div>
                    <div className={`text-xs truncate ${activeTab === tab.id ? 'text-green-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-white/10 rounded-xl border border-white/20"></div>
                  )}
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
    </div>
  );
} 