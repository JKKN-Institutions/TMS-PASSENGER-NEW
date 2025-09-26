'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Star,
  Award,
  Trophy,
  Send,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth/auth-context';
import { EnhancedLoading, SkeletonCard } from '@/components/enhanced-loading';
import { EmptyState } from '@/components/empty-states';
import BugBountyTracker from '@/components/bug-bounty-tracker';
import toast from 'react-hot-toast';

interface BugReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  screenshot_url?: string;
  reporter_email: string;
  reporter_name: string;
}

export default function BugReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('my-reports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<BugReport[]>([]);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [showBugDetails, setShowBugDetails] = useState(false);
  const [showNewBugForm, setShowNewBugForm] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.email) {
      loadMyBugReports();
    } else if (!authLoading && !isAuthenticated) {
      setError('Please log in to view bug reports');
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    filterReports();
  }, [bugReports, filters]);

  const loadMyBugReports = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bug-reports?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        setBugReports(data.bugReports || []);
      } else {
        setError(data.error || 'Failed to load bug reports');
        toast.error(data.error || 'Failed to load bug reports');
      }
    } catch (error) {
      console.error('Error loading bug reports:', error);
      setError('Failed to connect to server');
      toast.error('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadMyBugReports();
    toast.success('Bug reports refreshed');
  };

  const filterReports = () => {
    let filtered = [...bugReports];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(bug => 
        bug.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        bug.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bug => bug.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(bug => bug.priority === filters.priority);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(bug => bug.category === filters.category);
    }

    setFilteredReports(filtered);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openBugReportModal = () => {
    // This will trigger the floating bug report button
    const bugReportButton = document.querySelector('[data-bug-report-trigger]') as HTMLButtonElement;
    if (bugReportButton) {
      bugReportButton.click();
    } else {
      toast.error('Bug report form not available');
    }
  };

  const stats = {
    total: bugReports.length,
    open: bugReports.filter(b => b.status === 'open').length,
    resolved: bugReports.filter(b => b.status === 'resolved').length,
    critical: bugReports.filter(b => b.priority === 'critical').length
  };

  // Enhanced loading states
  if (authLoading) {
    return (
      <EnhancedLoading
        type="auth"
        message="Authenticating..."
        submessage="Verifying your access to bug reports"
        size="lg"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <EnhancedLoading
        type="auth"
        error="Authentication required to access bug reports"
        size="lg"
      />
    );
  }

  if (loading) {
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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)'
          }}>
            <Bug className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
            <p className="text-gray-600">Track and manage your submitted issues</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
            style={{
              background: loading ? '#6b7280' : 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.25)'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openBugReportModal}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Report Bug</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bug className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="bug-bounty">Bug Bounty</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search bugs..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="ui_ux">UI/UX</SelectItem>
                    <SelectItem value="functionality">Functionality</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bug Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Bug Reports ({filteredReports.length})</CardTitle>
              <CardDescription>
                {filteredReports.length === 0 && bugReports.length > 0 
                  ? "No reports match your current filters" 
                  : "Track the status of your submitted bug reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-600">Loading your bug reports...</span>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {bugReports.length === 0 ? 'No bug reports yet' : 'No reports match filters'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {bugReports.length === 0 
                      ? 'Start contributing by reporting bugs you encounter in the system.'
                      : 'Try adjusting your filters to see more results.'}
                  </p>
                  {bugReports.length === 0 && (
                    <Button onClick={openBugReportModal}>
                      <Plus className="w-4 h-4 mr-2" />
                      Report Your First Bug
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((bug) => (
                    <motion.div
                      key={bug.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedBug(bug);
                        setShowBugDetails(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{bug.title}</h3>
                            <Badge className={getPriorityColor(bug.priority)}>
                              {bug.priority}
                            </Badge>
                            <Badge className={getStatusColor(bug.status)}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(bug.status)}
                                <span>{bug.status.replace('_', ' ')}</span>
                              </span>
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bug.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Created {formatDate(bug.created_at)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Updated {formatDate(bug.updated_at)}</span>
                            </span>
                            {bug.screenshot_url && (
                              <span className="flex items-center space-x-1">
                                <ImageIcon className="w-3 h-3" />
                                <span>Screenshot</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bug Bounty Tab */}
        <TabsContent value="bug-bounty" className="space-y-6">
          {user?.email && (
            <BugBountyTracker
              userId={user.id || ''}
              userEmail={user.email}
              onReportBug={openBugReportModal}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Bug Details Modal */}
      <AnimatePresence>
        {showBugDetails && selectedBug && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bug className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">{selectedBug.title}</h2>
                  <Badge className={getPriorityColor(selectedBug.priority)}>
                    {selectedBug.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedBug.status)}>
                    {selectedBug.status.replace('_', ' ')}
                  </Badge>
                </div>
                <button
                  onClick={() => setShowBugDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{selectedBug.description}</p>
                    </div>

                    {/* Screenshot */}
                    {selectedBug.screenshot_url && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Screenshot</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={selectedBug.screenshot_url} 
                            alt="Bug Screenshot"
                            className="w-full h-auto max-h-96 object-contain bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex items-center justify-center h-32 bg-gray-100 text-gray-500">
                                    <div class="text-center">
                                      <div class="w-8 h-8 mx-auto mb-2 text-gray-400">📷</div>
                                      <p class="text-sm">Screenshot unavailable</p>
                                      <p class="text-xs mt-1">The image could not be loaded</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Bug Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Bug Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Category:</span>
                          <span className="ml-2 capitalize">{selectedBug.category.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">{new Date(selectedBug.created_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span>
                          <span className="ml-2">{new Date(selectedBug.updated_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Reporter:</span>
                          <span className="ml-2">{selectedBug.reporter_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

