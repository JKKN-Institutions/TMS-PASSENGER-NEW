'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Grievance {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  resolved_at?: string;
  student?: {
    student_name: string;
    roll_number: string;
    email: string;
  };
}

export default function StaffGrievancesPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [expandedGrievance, setExpandedGrievance] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadGrievances();
  }, [isAuthenticated, userType, isLoading, router]);

  useEffect(() => {
    filterGrievances();
  }, [searchQuery, statusFilter, priorityFilter, grievances]);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // First, get staff's assigned routes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('staff_route_assignments')
        .select('route_id')
        .eq('staff_email', user.email.toLowerCase().trim())
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setGrievances([]);
        setFilteredGrievances([]);
        setLoading(false);
        return;
      }

      // Get route IDs
      const routeIds = assignments.map(a => a.route_id);

      // Get students on these routes
      const { data: routeAllocations } = await supabase
        .from('student_route_allocations')
        .select('student_id')
        .in('route_id', routeIds)
        .eq('is_active', true);

      const studentIds = [...new Set(routeAllocations?.map(a => a.student_id) || [])];

      if (studentIds.length === 0) {
        setGrievances([]);
        setFilteredGrievances([]);
        setLoading(false);
        return;
      }

      // Fetch grievances only for these students
      const { data: grievancesData, error: grievancesError } = await supabase
        .from('grievances')
        .select(`
          id,
          subject,
          description,
          status,
          priority,
          category,
          created_at,
          resolved_at,
          student_id,
          students (
            student_name,
            roll_number,
            email
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (grievancesError) throw grievancesError;

      setGrievances(grievancesData || []);
      setFilteredGrievances(grievancesData || []);
    } catch (err: any) {
      console.error('Error loading grievances:', err);
      setError(err.message || 'Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const filterGrievances = () => {
    let filtered = [...grievances];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        g =>
          g.subject.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          g.student?.student_name.toLowerCase().includes(query) ||
          g.student?.roll_number.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(g => g.priority === priorityFilter);
    }

    setFilteredGrievances(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading grievances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadGrievances}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = grievances.filter(g => g.status === 'pending').length;
  const inProgressCount = grievances.filter(g => g.status === 'in_progress').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Grievances</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{grievances.length}</h3>
            <p className="text-gray-500 text-sm mt-1">All grievances</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-600 text-sm font-medium">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{pendingCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Needs attention</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-sm font-medium">In Progress</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{inProgressCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Being resolved</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Resolved</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{resolvedCount}</h3>
            <p className="text-gray-500 text-sm mt-1">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search grievances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredGrievances.length} of {grievances.length} grievances
          </div>
        </div>

        {/* Grievances List */}
        {filteredGrievances.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-gray-100">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grievances found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No grievances submitted yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-100">
            {filteredGrievances.map((grievance) => {
              const isExpanded = expandedGrievance === grievance.id;
              return (
                <div key={grievance.id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedGrievance(isExpanded ? null : grievance.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{grievance.subject}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(grievance.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                              {grievance.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
                            {grievance.priority} priority
                          </span>
                        </div>

                        {grievance.student && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{grievance.student.student_name}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="font-mono">{grievance.student.roll_number}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(grievance.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                      <div className="pt-6 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Description
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {grievance.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <span className="ml-2 font-medium text-gray-900">{grievance.category}</span>
                          </div>
                          {grievance.resolved_at && (
                            <div>
                              <span className="text-gray-600">Resolved:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(grievance.resolved_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
