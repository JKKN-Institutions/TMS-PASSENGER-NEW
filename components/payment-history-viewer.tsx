'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Star,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceReceipt from './invoice-receipt';

interface PaymentRecord {
  id: string;
  amount_paid: number;
  payment_status: string;
  payment_type: string;
  covers_terms: string[];
  transaction_id: string;
  receipt_number: string;
  payment_date: string;
  valid_from: string;
  valid_until: string;
  academic_year: string;
  semester: string;
  stop_name: string;
}

interface StudentInfo {
  id: string;
  name: string;
  route?: {
    route_number: string;
    route_name: string;
    start_location: string;
    end_location: string;
  };
}

interface PaymentHistoryViewerProps {
  studentId: string;
}

const PaymentHistoryViewer: React.FC<PaymentHistoryViewerProps> = ({ studentId }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
    fetchStudentInfo();
  }, [studentId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const data = await response.json();
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentInfo = async () => {
    try {
      // Get student info from session or API
      const { sessionManager } = await import('@/lib/session');
      const currentStudent = sessionManager.getCurrentStudent();
      
      if (currentStudent) {
        setStudentInfo({
          id: currentStudent.student_id,
          name: currentStudent.student_name,
          route: {
            route_number: 'Route Number',
            route_name: 'Route Name',
            start_location: 'Start Location',
            end_location: 'End Location'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const getReceiptColorClass = (paymentType: string, semester: string) => {
    // ⭐ UPDATED: Using brand color #0b6d41 for consistent styling
    if (paymentType === 'full_year') {
      return 'border-[#0b6d41] text-[#0b6d41] bg-gradient-to-r from-green-50 to-green-100';
    }

    switch (semester) {
      case '1': return 'border-[#0b6d41] text-[#0b6d41] bg-gradient-to-r from-green-50 to-green-100';
      case '2': return 'border-[#0b6d41] text-[#0b6d41] bg-gradient-to-r from-green-50 to-green-100';
      case '3': return 'border-[#0b6d41] text-[#0b6d41] bg-gradient-to-r from-green-50 to-green-100';
      default: return 'border-[#0b6d41] text-gray-800 bg-gradient-to-r from-gray-50 to-green-50';
    }
  };

  const getStatusIcon = (status: string) => {
    // ⭐ UPDATED: Using brand color for confirmed status
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-[#0b6d41]" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Paid';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getPaymentTypeLabel = (paymentType: string, coversTerms: string[]) => {
    if (paymentType === 'full_year') {
      return 'Full Academic Year';
    }
    return `Term ${coversTerms.join(', ')}`;
  };



  const showReceiptDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-[#0b6d41] mx-auto mb-4"></div>
          <span className="text-[#0b6d41] font-medium">Loading payment history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header - ⭐ UPDATED: Brand color styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-[#0b6d41]/30">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-[#0b6d41] rounded-xl flex items-center justify-center shadow-md">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
              <p className="text-[#0b6d41] font-medium">Your transport fee payment records</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPaymentHistory}
          className="bg-[#0b6d41] text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-[#0a5c37] transition-all duration-300 flex items-center space-x-2 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Enhanced Payment Records - ⭐ UPDATED: Brand color styling */}
      {payments.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-[#0b6d41]/30">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="h-10 w-10 text-[#0b6d41]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Payment History</h3>
          <p className="text-gray-600 mb-2">You haven't made any payments yet.</p>
          <p className="text-sm text-gray-500">Your payment records will appear here once you make a payment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-6 rounded-2xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm ${getReceiptColorClass(payment.payment_type, payment.semester)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {getStatusIcon(payment.payment_status)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">
                      {getPaymentTypeLabel(payment.payment_type, payment.covers_terms)}
                    </h3>
                    <p className="text-sm opacity-75 truncate">
                      {getStatusText(payment.payment_status)} • {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold">₹{payment.amount_paid}</div>
                  <div className="text-sm opacity-75">{payment.academic_year}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="flex items-center space-x-2 min-w-0">
                  <MapPin className="w-4 h-4 opacity-60 flex-shrink-0" />
                  <span className="text-sm truncate">{payment.stop_name}</span>
                </div>
                <div className="flex items-center space-x-2 min-w-0">
                  <Calendar className="w-4 h-4 opacity-60 flex-shrink-0" />
                  <span className="text-sm truncate">
                    {new Date(payment.valid_from).toLocaleDateString()} - {new Date(payment.valid_until).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 min-w-0 sm:col-span-2 lg:col-span-1">
                  <FileText className="w-4 h-4 opacity-60 flex-shrink-0" />
                  <span className="text-sm font-mono truncate">{payment.receipt_number}</span>
                </div>
              </div>

              {payment.payment_status === 'confirmed' && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-current/20">
                  <button
                    onClick={() => showReceiptDetails(payment)}
                    className="flex-1 bg-current/10 hover:bg-current/20 transition-colors px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View Receipt</span>
                    <span className="sm:hidden">View</span>
                  </button>
                  <button
                    onClick={() => showReceiptDetails(payment)}
                    className="flex-1 bg-current/10 hover:bg-current/20 transition-colors px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Download</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

            {/* Professional Invoice Receipt Modal */}
      {selectedPayment && (
        <InvoiceReceipt
          payment={selectedPayment}
          student={studentInfo || undefined}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentHistoryViewer; 