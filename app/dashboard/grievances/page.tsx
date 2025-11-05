'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Search,
  X,
  Send,
  Activity,
  FileText,
  Users
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { GrievanceAccessControl } from '@/components/account-access-control';
import { Grievance, Route, Student } from '@/types';
import { formatDate, getStatusColor, getStatusText, capitalizeFirst, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import GrievanceGroupChatModal from '@/components/grievance-group-chat-modal-fixed';
import PageWrapper from '@/components/page-wrapper';

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [nextDueAmount, setNextDueAmount] = useState<number | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Progress tracker state
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);

  // Group chat states
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [selectedGrievanceForChat, setSelectedGrievanceForChat] = useState<Grievance | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    routeId: '',
    driverName: '',
    category: 'complaint' as Grievance['category'],
    priority: 'medium' as Grievance['priority'],
    subject: '',
    description: ''
  });



  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
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

      const studentData = {
        id: currentStudent.student_id,
        studentName: currentStudent.student_name,
        rollNumber: currentStudent.roll_number,
        email: sessionManager.getSession()?.user?.email || '',
        mobile: '',
        firstLoginCompleted: true,
        profileCompletionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Student;
      
      setStudent(studentData);

      // Fetch payment status
      try {
        const paymentStatusData = await studentHelpers.getPaymentStatus(currentStudent.student_id);
        setPaymentStatus(paymentStatusData);
        
        // If account is inactive, fetch available fees for reactivation
        if (!paymentStatusData.isActive) {
          try {
            const feesData = await studentHelpers.getAvailableFees(currentStudent.student_id);
            const dueAmount = feesData?.available_options?.find((option: any) => 
              option.is_available && option.is_recommended
            )?.amount;
            setNextDueAmount(dueAmount);
          } catch (error) {
            console.error('Error fetching available fees:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
      }

      await Promise.all([
        fetchGrievances(currentStudent.student_id),
        fetchRoutes()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrievances = async (studentId: string) => {
    try {
      const grievancesData = await studentHelpers.getGrievances(studentId);
      setGrievances(grievancesData);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      toast.error('Failed to load grievances');
    }
  };

  const fetchRoutes = async () => {
    try {
      const routesData = await studentHelpers.getAvailableRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student || !formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await studentHelpers.submitGrievance({
        studentId: student.id,
        routeId: formData.routeId || undefined,
        driverName: formData.driverName || undefined,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      });

      toast.success('Grievance submitted successfully!');
      setShowGrievanceModal(false);
      resetForm();
      
      await fetchGrievances(student.id);
    } catch (error) {
      console.error('Grievance submission error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      driverName: '',
      category: 'complaint',
      priority: 'medium',
      subject: '',
      description: ''
    });
  };

  const handleOpenProgressTracker = (grievanceId: string) => {
    setSelectedGrievanceId(grievanceId);
    setShowProgressTracker(true);
  };

  const handleCloseProgressTracker = () => {
    setShowProgressTracker(false);
    setSelectedGrievanceId(null);
  };

  const handleOpenGroupChat = (grievance: Grievance) => {
    setSelectedGrievanceForChat(grievance);
    setShowGroupChat(true);
  };

  const handleCloseGroupChat = () => {
    setShowGroupChat(false);
    setSelectedGrievanceForChat(null);
  };

  const filteredGrievances = grievances.filter(grievance => {
    const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || grievance.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
      grievance.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getGrievanceIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/60 backdrop-blur-sm rounded-xl w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 h-32 shadow-lg"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-6 space-y-6 pb-24 lg:pb-6">
      <GrievanceAccessControl
        isActive={paymentStatus?.isActive ?? true}
        nextDueAmount={nextDueAmount ?? undefined}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Grievances & Feedback</h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium mt-1">Submit complaints, suggestions, and track their resolution</p>
          </div>
          <button
            onClick={() => setShowGrievanceModal(true)}
            className="w-full sm:w-auto bg-[#0b6d41] hover:bg-[#085032] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-semibold"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Submit Grievance</span>
          </button>
        </div>

      {/* Stats Overview - Optimized for Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: 'Total', value: grievances.length, icon: MessageSquare, color: 'bg-[#0b6d41]' },
          { label: 'Open', value: grievances.filter(g => g.status === 'open').length, icon: AlertCircle, color: 'bg-blue-600' },
          { label: 'In Progress', value: grievances.filter(g => g.status === 'in_progress').length, icon: Clock, color: 'bg-yellow-600' },
          { label: 'Resolved', value: grievances.filter(g => g.status === 'resolved').length, icon: CheckCircle, color: 'bg-green-600' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{stat.label}</p>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color} shadow-md flex-shrink-0`}>
                  <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>



      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-[#0b6d41] transition-all duration-200 bg-white shadow-sm text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-[#0b6d41] transition-all duration-200 bg-white shadow-sm text-sm"
            >
              <option value="all">All Categories</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
              <option value="technical_issue">Technical Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#0b6d41]" />
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-[#0b6d41] transition-all duration-200 bg-white shadow-sm text-sm"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
              }}
              className="w-full text-[#0b6d41] hover:text-white hover:bg-[#0b6d41] font-semibold text-sm bg-green-50 px-4 py-2.5 rounded-xl transition-all duration-200 border border-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      <div className="space-y-4">
        {filteredGrievances.length > 0 ? (
          filteredGrievances.map((grievance) => (
            <div key={grievance.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-green-50 rounded-xl shadow-sm border border-green-100">
                    {getGrievanceIcon(grievance.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{grievance.subject}</h3>
                    <p className="text-sm text-gray-500">
                      Grievance #{grievance.id.slice(0, 8)} • Submitted {formatDate(grievance.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                    {getStatusText(grievance.status)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
                    {capitalizeFirst(grievance.priority)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {capitalizeFirst(grievance.category.replace('_', ' '))}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{grievance.description}</p>
              </div>

              {(grievance.driverName || grievance.routeId) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-100">
                  {grievance.driverName && (
                    <div>
                      <p className="text-sm text-gray-500">Driver Name</p>
                      <p className="font-medium text-gray-900">{grievance.driverName}</p>
                    </div>
                  )}
                  {grievance.routeId && (
                    <div>
                      <p className="text-sm text-gray-500">Related Route</p>
                      <p className="font-medium text-gray-900">
                        {routes.find(r => r.id === grievance.routeId)?.routeName || 'Unknown Route'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {grievance.resolution && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Resolution</h4>
                    {grievance.resolvedAt && (
                      <span className="text-sm text-green-700">
                        • Resolved on {formatDate(grievance.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-green-800">{grievance.resolution}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Created: {formatDate(grievance.createdAt)}</span>
                  <span>Updated: {formatDate(grievance.updatedAt)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {grievance.assignedTo && (
                    <span className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>
                        {grievance.admin_users ? (
                          <>
                            Assigned to <span className="font-medium text-blue-600">
                              {grievance.admin_users.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                              {grievance.admin_users.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </>
                        ) : (
                          'Assigned to admin'
                        )}
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenProgressTracker(grievance.id)}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-800 hover:bg-green-50 px-4 py-2 rounded-xl transition-all duration-200 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
                  >
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-semibold">Track Progress</span>
                  </button>
                  <button
                    onClick={() => handleOpenGroupChat(grievance)}
                    className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 px-4 py-2 rounded-xl transition-all duration-200 border border-yellow-200 hover:border-yellow-300 shadow-sm hover:shadow-md"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-semibold">Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100">
            <div className="p-4 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 shadow-md">
              <MessageSquare className="h-16 w-16 text-green-600 mx-auto mt-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No grievances found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm
                ? 'Try adjusting your filters to see more results'
                : "You haven't submitted any grievances yet. Get started by submitting your first grievance."}
            </p>
            <button
              onClick={() => setShowGrievanceModal(true)}
              className="bg-gradient-to-r from-green-600 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-semibold"
            >
              Submit Your First Grievance
            </button>
          </div>
        )}
      </div>

      {/* Grievance Modal */}
      {showGrievanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-green-200">
            <div className="flex items-center justify-between p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-yellow-50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">Submit Grievance</h2>
              <button
                onClick={() => {
                  setShowGrievanceModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-xl transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Grievance['category'] }))}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="compliment">Compliment</option>
                    <option value="technical_issue">Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Grievance['priority'] }))}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Related Route (Optional)
                  </label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.routeNumber} - {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Driver Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="Enter driver name if applicable"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  placeholder="Brief summary of your grievance"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm resize-none"
                  placeholder="Provide detailed information about your grievance..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGrievanceModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-yellow-500 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-semibold"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Progress Tracker Modal */}
      {showProgressTracker && selectedGrievanceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl border border-green-200">
            <div className="flex items-center justify-between p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-yellow-50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">Progress Tracker</h2>
              <button onClick={handleCloseProgressTracker} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-xl transition-all duration-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-100">
                  <div className="p-2 bg-gradient-to-r from-green-100 to-yellow-100 rounded-full">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Grievance Submitted</h3>
                    <p className="text-sm text-gray-600">Your grievance has been received</p>
                  </div>
                </div>
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status !== 'open' && (
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                    <div className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Under Review</h3>
                      <p className="text-sm text-gray-600">Admin is reviewing your grievance</p>
                    </div>
                  </div>
                )}
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status === 'resolved' && (
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Resolved</h3>
                      <p className="text-sm text-gray-600">Your grievance has been resolved</p>
                    </div>
                  </div>
                )}
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status === 'closed' && (
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                    <div className="p-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Closed</h3>
                      <p className="text-sm text-gray-600">Your grievance has been closed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-green-100 p-6 bg-gradient-to-r from-green-50 to-yellow-50">
              <button
                onClick={handleCloseProgressTracker}
                className="w-full bg-gradient-to-r from-green-600 to-yellow-500 text-white py-3 rounded-xl hover:from-green-700 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </GrievanceAccessControl>

      {/* Group Chat Modal */}
      {showGroupChat && selectedGrievanceForChat && (
        <GrievanceGroupChatModal
          isOpen={showGroupChat}
          onClose={handleCloseGroupChat}
          grievance={selectedGrievanceForChat}
        />
      )}
    </PageWrapper>
  );
} 