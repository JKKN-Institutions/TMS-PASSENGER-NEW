'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Banknote,
  Sparkles,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import DummyPaymentGateway from './dummy-payment-gateway';

// Simple UI components using TailwindCSS
const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/95 backdrop-blur-sm rounded-2xl border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: any) => (
  <div className={`px-6 py-5 border-b border-green-100 bg-gradient-to-r from-green-50 to-yellow-50 rounded-t-2xl ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: any) => (
  <div className={`text-sm text-gray-600 mt-2 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = '', variant = 'primary' as 'primary' | 'secondary' | 'outline', size = 'md' as 'sm' | 'md' | 'lg', disabled = false, ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl';
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-green-600 to-yellow-500 text-white hover:from-green-700 hover:to-yellow-600 focus:ring-green-300',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 focus:ring-gray-400',
    outline: 'border-2 border-green-300 bg-white text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 focus:ring-green-300'
  };
  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = '', variant = 'default' as 'default' | 'secondary' | 'outline' }: any) => {
  const variants: Record<string, string> = {
    default: 'bg-gradient-to-r from-green-100 to-yellow-100 text-green-800 shadow-sm',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm',
    outline: 'border-2 border-green-300 text-green-700 bg-white shadow-sm'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface PaymentOption {
  payment_type: 'term' | 'full_year' | 'outstanding' | 'enrollment' | 'custom';
  term: string;
  amount: number;
  description: string;
  period: string;
  covers_terms: string[];
  receipt_color: string;
  is_recommended?: boolean;
  savings?: number;
  discount_percent?: number;
  is_paid?: boolean;
  is_available?: boolean;
  paid_reason?: string | null;
  is_custom?: boolean;
  max_amount?: number;
}

interface PaymentData {
  student_id: string;
  student_name: string;
  roll_number: string;
  academic_year: string;
  current_term: string;
  route: any;
  boarding_stop: string;
  fee_structure: any;
  paid_terms: string[];
  has_full_year_payment: boolean;
  available_options: PaymentOption[];
  quota_info?: {
    id: string;
    quota_name: string;
    quota_code: string;
    description: string;
    annual_fee_amount: number;
    is_government_quota: boolean;
  };
  payment_summary?: {
    annual_fee: number;
    paid_amount: number;
    outstanding_amount: number;
    payment_status: string;
  };
}

interface EnhancedPaymentInterfaceProps {
  studentId: string;
  onPaymentInitiated?: (option: PaymentOption) => void;
  onError?: (error: string) => void;
}

const EnhancedPaymentInterface: React.FC<EnhancedPaymentInterfaceProps> = ({
  studentId,
  onPaymentInitiated,
  onError
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customAmountError, setCustomAmountError] = useState<string>('');

  useEffect(() => {
    fetchPaymentOptions();
  }, [studentId]);

  const fetchPaymentOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=available`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment options');
      }
      
      const data = await response.json();
      setPaymentData(data);
      
      // Auto-select recommended option
      const recommended = data.available_options?.find((opt: PaymentOption) => opt.is_recommended);
      if (recommended) {
        setSelectedOption(recommended);
      }
      
    } catch (error: any) {
      console.error('Error fetching payment options:', error);
      onError?.('Failed to load payment options');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!selectedOption || !paymentData) return;

    // Validate custom amount if needed
    if (selectedOption.is_custom) {
      if (!customAmount || parseFloat(customAmount) <= 0) {
        onError?.('Please enter a valid amount');
        return;
      }
      if (parseFloat(customAmount) > (selectedOption.max_amount || 0)) {
        onError?.(`Amount cannot exceed ₹${selectedOption.max_amount?.toLocaleString()}`);
        return;
      }
    }

    try {
      setProcessing(true);
      
      const paymentRequest = {
        studentId: paymentData.student_id,
        paymentType: selectedOption.is_custom ? 'custom' : selectedOption.payment_type,
        termNumber: selectedOption.payment_type === 'term' ? selectedOption.term : undefined,
        routeId: paymentData.route?.id,
        stopName: paymentData.boarding_stop,
        paymentMethod: 'upi',
        amount: selectedOption.is_custom ? parseFloat(customAmount) : selectedOption.amount
      };

      const response = await fetch('/api/semester-payments-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initiation failed');
      }

      const result = await response.json();
      
      // Store payment ID and show payment gateway
      setCurrentPaymentId(result.payment_id);
      setShowPaymentGateway(true);
      
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      onError?.(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentComplete = async (paymentResult: any) => {
    // Close payment gateway
    setShowPaymentGateway(false);
    setCurrentPaymentId(null);
    
    // Notify parent component
    if (selectedOption) {
      onPaymentInitiated?.(selectedOption);
    }
    
    // Refresh payment options to show updated status
    await fetchPaymentOptions();
    
    // Show success message
    toast.success(`Payment completed! Receipt: ${paymentResult.receiptNumber}`);
  };

  const handlePaymentGatewayClose = () => {
    setShowPaymentGateway(false);
    setCurrentPaymentId(null);
  };

  const getReceiptColorStyle = (color: string) => {
    const colorMap = {
      white: 'bg-gray-50 border-gray-200 text-gray-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      green: 'bg-green-50 border-green-200 text-green-900'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
  };

  const getReceiptBadgeColor = (color: string) => {
    const colorMap = {
      white: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading payment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentData || paymentData.available_options.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All Payments Complete
            </h3>
            <p className="text-gray-600">
              {paymentData?.has_full_year_payment 
                ? 'You have completed full year payment'
                : 'All required term payments have been completed'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  <span className="block sm:inline">Transport Fee Payment</span>
                  <span className="block sm:inline sm:ml-1 text-gray-600">- Academic Year {paymentData.academic_year}</span>
                </div>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="space-y-1">
            {paymentData.route && (
              <div className="text-sm text-gray-600 break-words">
                <span className="font-medium">Route:</span> {paymentData.route.route_number} - {paymentData.route.route_name}
              </div>
            )}
            <div className="text-sm text-gray-600 break-words">
              <span className="font-medium">Boarding Stop:</span> {paymentData.boarding_stop}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1 w-fit">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="hidden sm:inline">Current Term: {paymentData.current_term}</span>
              <span className="sm:hidden">Term: {paymentData.current_term}</span>
            </Badge>
            {paymentData.paid_terms.length > 0 && (
              <Badge variant="secondary" className="w-fit">
                <span className="hidden sm:inline">Paid Terms: {paymentData.paid_terms.join(', ')}</span>
                <span className="sm:hidden">Paid: {paymentData.paid_terms.join(', ')}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentData.available_options.some(option => option.is_paid) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Payment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentData.available_options
                .filter(option => option.is_paid)
                .map((option, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${getReceiptColorStyle(option.receipt_color)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{option.description}</h3>
                        <p className="text-sm text-gray-600">{option.period}</p>
                        {option.paid_reason && (
                          <p className="text-xs text-green-600 mt-1">{option.paid_reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">₹{option.amount.toLocaleString()}</div>
                        <Badge className="mt-1 bg-green-100 text-green-800">Paid</Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Payment Options */}
      {paymentData.available_options.some(option => option.is_available) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentData.available_options
                .filter(option => option.is_available)
                .map((option, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedOption?.term === option.term 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'hover:shadow-md'
                    } ${getReceiptColorStyle(option.receipt_color)}`}
                    onClick={() => {
                      setSelectedOption(option);
                      if (!option.is_custom) {
                        setCustomAmount('');
                        setCustomAmountError('');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{option.description}</h3>
                          {/* Removed recommendation badge */}
                        </div>
                        <p className="text-sm text-gray-600">{option.period}</p>
                        
                        {/* Custom amount input for custom payment option */}
                        {option.is_custom && selectedOption?.term === option.term && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Enter Amount (₹1 - ₹{option.max_amount?.toLocaleString()})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={option.max_amount}
                              value={customAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomAmount(value);
                                
                                const amount = parseFloat(value);
                                if (value && (amount < 1 || amount > (option.max_amount || 0))) {
                                  setCustomAmountError(`Amount must be between ₹1 and ₹${option.max_amount?.toLocaleString()}`);
                                } else {
                                  setCustomAmountError('');
                                }
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                customAmountError ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter amount"
                            />
                            {customAmountError && (
                              <p className="text-red-500 text-xs mt-1">{customAmountError}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {option.is_custom 
                            ? (customAmount ? `₹${parseFloat(customAmount).toLocaleString()}` : 'Enter amount')
                            : `₹${option.amount.toLocaleString()}`
                          }
                        </div>
                        <Badge className={`mt-1 ${getReceiptBadgeColor(option.receipt_color)}`}>
                          {option.receipt_color} receipt
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quota Information */}
      {paymentData.quota_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>Quota & Payment Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quota Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quota Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quota Type:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        paymentData.quota_info.is_government_quota 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {paymentData.quota_info.quota_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Annual Fee:</span>
                      <span className="text-sm font-semibold">₹{paymentData.payment_summary.annual_fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Fee:</span>
                      <span className="text-sm font-medium">₹{paymentData.payment_summary.annual_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paid Amount:</span>
                      <span className="text-sm font-medium text-green-600">₹{paymentData.payment_summary.paid_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">Outstanding:</span>
                      <span className={`text-sm font-bold ${
                        paymentData.payment_summary.outstanding_amount > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        ₹{paymentData.payment_summary.outstanding_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                        paymentData.payment_summary.payment_status === 'current' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {paymentData.payment_summary.payment_status === 'current' ? 'Up to Date' : 'Overdue'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Payment Action */}
      {selectedOption && selectedOption.is_available && !selectedOption.is_paid && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to Pay</h3>
                <p className="text-gray-600">
                  {selectedOption.description} - {selectedOption.is_custom 
                    ? (customAmount ? `₹${parseFloat(customAmount).toLocaleString()}` : 'Enter amount above')
                    : `₹${selectedOption.amount.toLocaleString()}`
                  }
                </p>
              </div>
              <Button 
                onClick={initiatePayment}
                disabled={processing || (selectedOption.is_custom && (!customAmount || customAmountError !== ''))}
                size="lg"
                className="min-w-[120px]"
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>Pay Now</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Payment Info for Paid Options */}
      {selectedOption && selectedOption.is_paid && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Payment Already Completed</span>
                </h3>
                <p className="text-gray-600">
                  {selectedOption.description} - ₹{selectedOption.amount.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {selectedOption.paid_reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dummy Payment Gateway Modal */}
      <DummyPaymentGateway
        isOpen={showPaymentGateway}
        onClose={handlePaymentGatewayClose}
        paymentOption={selectedOption}
        paymentId={currentPaymentId}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default EnhancedPaymentInterface; 