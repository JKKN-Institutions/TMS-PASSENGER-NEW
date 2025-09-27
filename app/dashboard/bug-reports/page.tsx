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
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';
import BugBountyTracker from '@/components/bug-bounty-tracker';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-reports');
  const [loading, setLoading] = useState(false);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<BugReport[]>([]);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [showBugDetails, setShowBugDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  });

  useEffect(() => {
    if (user?.email) {
      loadMyBugReports();
    }
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [bugReports, filters]);

  const loadMyBugReports = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bug-reports?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        setBugReports(data.bugReports || []);
      } else {
        toast.error(data.error || 'Failed to load bug reports');
      }
    } catch (error) {
      console.error('Error loading bug reports:', error);
      toast.error('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6 bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-100 to-yellow-100 rounded-xl shadow-md">
              <Bug className="w-8 h-8 text-green-600" />
            </div>
            <span>My Bug Reports</span>
          </h1>
          <p className="text-gray-700 font-medium mt-2">Track and manage your submitted bug reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => loadMyBugReports()} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openBugReportModal} className="bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Report Bug
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-yellow-100 rounded-xl shadow-md">
                <Bug className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Open</p>
                <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl shadow-md">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-md">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Critical</p>
                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl shadow-md">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/90 backdrop-blur-sm shadow-lg border border-green-100 rounded-xl p-1">
          <TabsTrigger value="my-reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-200">My Reports</TabsTrigger>
          <TabsTrigger value="bug-bounty" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-200">Bug Bounty</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-6">
          {/* Filters */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-green-100 to-yellow-100 rounded-lg">
                    <Filter className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Filters:</span>
                </div>
                
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search bugs..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="w-32 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm">
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
                  <SelectTrigger className="w-32 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm">
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
                  <SelectTrigger className="w-40 border-gray-300 rounded-xl focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-white shadow-sm">
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
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
              <CardTitle className="text-xl font-bold text-gray-900">Your Bug Reports ({filteredReports.length})</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                {filteredReports.length === 0 && bugReports.length > 0 
                  ? "No reports match your current filters" 
                  : "Track the status of your submitted bug reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                  <span className="ml-2 text-green-700 font-medium">Loading your bug reports...</span>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full w-20 h-20 mx-auto mb-6 shadow-md">
                    <Bug className="w-12 h-12 text-green-600 mx-auto mt-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {bugReports.length === 0 ? 'No bug reports yet' : 'No reports match filters'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {bugReports.length === 0 
                      ? 'Start contributing by reporting bugs you encounter in the system.'
                      : 'Try adjusting your filters to see more results.'}
                  </p>
                  {bugReports.length === 0 && (
                    <Button onClick={openBugReportModal} className="bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
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
                      className="border border-green-100 rounded-xl p-6 hover:shadow-xl transition-all cursor-pointer bg-white/90 backdrop-blur-sm hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50"
                      whileHover={{ scale: 1.02 }}
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
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-green-100"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-50 to-yellow-50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-100 to-yellow-100 rounded-xl shadow-md">
                    <Bug className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedBug.title}</h2>
                  <Badge className={getPriorityColor(selectedBug.priority)}>
                    {selectedBug.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedBug.status)}>
                    {selectedBug.status.replace('_', ' ')}
                  </Badge>
                </div>
                <button
                  onClick={() => setShowBugDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-xl transition-all duration-200"
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
                    <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-6 border border-green-100 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Bug Information</h3>
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

