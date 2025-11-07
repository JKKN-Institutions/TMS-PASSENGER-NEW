'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import BugStatusBadge from '@/components/bug-status-badge';
import { format } from 'date-fns';

interface BugReportDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  page_url?: string;
  screenshot_url?: string;
  console_logs?: string[];
  browser_info?: {
    userAgent?: string;
    platform?: string;
    screenResolution?: string;
  };
  user_context?: {
    userId: string;
    name: string;
    email: string;
  };
  comments?: Array<{
    id: string;
    text: string;
    author: string;
    created_at: string;
  }>;
  resolution?: string;
}

const DriverBugReportDetailPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<BugReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && reportId) {
      fetchBugReportDetail();
    }
  }, [isAuthenticated, user, reportId]);

  const fetchBugReportDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || user?.sub;
      const response = await fetch(`/api/bug-reports/my-reports?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bug report');
      }

      const foundReport = data.reports?.find((r: BugReportDetail) => r.id === reportId);
      if (!foundReport) {
        throw new Error('Bug report not found');
      }

      setReport(foundReport);
    } catch (err) {
      console.error('Error fetching bug report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bug report');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'critical') return 'text-red-600 bg-red-50 border-red-200';
    if (p === 'high') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (p === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0b6d41] mx-auto" />
          <p className="text-gray-600">Loading bug report details...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error loading bug report</h3>
                <p className="text-sm text-red-700 mb-4">{error || 'Bug report not found'}</p>
                <button
                  onClick={() => router.push('/driver/my-bug-reports')}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  ← Back to bug reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/driver/my-bug-reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#0b6d41] mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to bug reports</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🐛</span>
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <BugStatusBadge status={report.status} />
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {report.priority} Priority
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  <FileText className="h-3.5 w-3.5" />
                  {report.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0b6d41] flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(report.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>

            {report.updated_at && report.updated_at !== report.created_at && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(report.updated_at), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Information */}
        {report.user_context && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{report.user_context.name}</p>
                  <p className="text-xs text-gray-500">{report.user_context.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page URL */}
        {report.page_url && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Location</h2>
            <a
              href={report.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#0b6d41] hover:text-[#095a35] transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="text-sm break-all">{report.page_url}</span>
            </a>
          </div>
        )}

        {/* Screenshot */}
        {report.screenshot_url && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Screenshot</h2>
              <button
                onClick={() => setShowScreenshot(!showScreenshot)}
                className="text-sm text-[#0b6d41] hover:text-[#095a35] font-medium"
              >
                {showScreenshot ? 'Hide' : 'Show'}
              </button>
            </div>
            {showScreenshot && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={report.screenshot_url}
                  alt="Bug screenshot"
                  className="w-full h-auto"
                />
              </div>
            )}
            {!showScreenshot && (
              <div className="flex items-center gap-2 text-gray-600">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Screenshot available</span>
              </div>
            )}
          </div>
        )}

        {/* Browser Information */}
        {report.browser_info && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Browser Information</h2>
            <div className="space-y-2 text-sm">
              {report.browser_info.userAgent && (
                <div>
                  <span className="font-medium text-gray-700">User Agent:</span>
                  <p className="text-gray-600 mt-1 break-all">{report.browser_info.userAgent}</p>
                </div>
              )}
              {report.browser_info.platform && (
                <div>
                  <span className="font-medium text-gray-700">Platform:</span>
                  <span className="text-gray-600 ml-2">{report.browser_info.platform}</span>
                </div>
              )}
              {report.browser_info.screenResolution && (
                <div>
                  <span className="font-medium text-gray-700">Screen Resolution:</span>
                  <span className="text-gray-600 ml-2">{report.browser_info.screenResolution}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Console Logs */}
        {report.console_logs && report.console_logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Console Logs</h2>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
                {report.console_logs.join('\n')}
              </pre>
            </div>
          </div>
        )}

        {/* Resolution */}
        {report.resolution && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Resolution</h2>
            <p className="text-sm text-green-800">{report.resolution}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverBugReportDetailPage;
