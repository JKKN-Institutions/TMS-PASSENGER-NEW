'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  X,
  Upload,
  Send,
  AlertCircle,
  Smartphone,
  Monitor,
  Wifi,
  Battery,
  Image as ImageIcon,
  FileText,
  Zap
} from 'lucide-react';
// Upload-only solution - no dependencies needed
import toast from 'react-hot-toast';

interface BugReportData {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  category: 'ui_ux' | 'functionality' | 'performance' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemInfo {
  userAgent: string;
  screenResolution: string;
  viewport: string;
  url: string;
  timestamp: string;
  deviceInfo: {
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
}

interface FloatingBugReportButtonProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  className?: string;
}

const FloatingBugReportButton: React.FC<FloatingBugReportButtonProps> = ({
  userId,
  userEmail,
  userName,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      // Cleanup any remaining object URLs when component unmounts
      screenshots.forEach(file => {
        if (file instanceof File) {
          const url = URL.createObjectURL(file);
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [screenshots]);

  const [bugReport, setBugReport] = useState<BugReportData>({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    category: 'functionality',
    severity: 'medium'
  });

  // System information collection
  const collectSystemInfo = (): SystemInfo => {
    const nav = navigator as any;
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        deviceMemory: nav.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency
      }
    };
  };

  // Upload-only solution - NO screen capture functionality
  // UPDATED: All screen capture functionality completely removed

  // Enhanced file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Define validation rules
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 5;
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    // Check current file count
    if (screenshots.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} images allowed. Current: ${screenshots.length}, Adding: ${files.length}`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        errors.push(`${file.name}: Unsupported format. Please use PNG, JPEG, GIF, or WebP`);
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push(`${file.name}: File too large (${sizeMB}MB). Maximum 10MB allowed`);
        return;
      }

      // Check for duplicate names
      const isDuplicate = screenshots.some(existing => existing.name === file.name);
      if (isDuplicate) {
        errors.push(`${file.name}: Duplicate file name`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    errors.forEach(error => toast.error(error));

    // Add valid files
    if (validFiles.length > 0) {
      setScreenshots(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} image(s) uploaded successfully!`);
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded image
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  // Get file size in human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Create preview URL for images
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // Submit bug report
  const submitBugReport = async () => {
    // Validate required fields
    if (!bugReport.title.trim() || !bugReport.description.trim()) {
      toast.error('Please fill in the title and description');
      return;
    }

    if (!userId || !userEmail) {
      toast.error('User information is required to submit a bug report');
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading('Submitting bug report...', { duration: 10000 });

      const systemInfo = collectSystemInfo();
      const allFiles = [...screenshots];

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add bug report data
      const bugReportData = {
        ...bugReport,
        reporterId: userId,
        reporterEmail: userEmail,
        reporterName: userName || userEmail,
        systemInfo
      };
      
      formData.append('bugReport', JSON.stringify(bugReportData));

      // Add files with error handling
      allFiles.forEach((file) => {
        try {
          formData.append(`files`, file);
        } catch (fileError) {
          console.error('Error adding file:', fileError);
          toast.error(`Failed to attach file: ${file.name}`);
        }
      });

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.dismiss(); // Dismiss loading toast
        toast.success('Bug report submitted successfully! Thank you for your feedback.');
        
        // Reset form state
        setBugReport({
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          category: 'functionality',
          severity: 'medium'
        });
        
        // Clear uploaded images and cleanup object URLs
        screenshots.forEach(file => {
          if (file instanceof File) {
            const url = URL.createObjectURL(file);
            URL.revokeObjectURL(url);
          }
        });
        setScreenshots([]);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setIsOpen(false);
      } else {
        toast.dismiss();
        toast.error(result.error || 'Failed to submit bug report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.dismiss();
      toast.error('Failed to submit bug report. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'ui_ux', label: 'UI/UX Issue', icon: Monitor },
    { value: 'functionality', label: 'Functional Issue', icon: AlertCircle },
    { value: 'performance', label: 'Performance Issue', icon: Zap },
    { value: 'security', label: 'Security Concern', icon: AlertCircle },
    { value: 'other', label: 'Other', icon: Bug }
  ];

  const severityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <>
      {/* Floating Bug Report Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          minWidth: '56px',
          minHeight: '56px'
        }}
      >
        <Bug className="w-6 h-6" />
      </motion.button>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-bug-report-modal
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999
            }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Header */}
              <div className="bg-red-500 text-white p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bug className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Report a Bug</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bug Title *
                      </label>
                      <input
                        type="text"
                        value={bugReport.title}
                        onChange={(e) => setBugReport({ ...bugReport, title: e.target.value })}
                        placeholder="Brief description of the issue"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        maxLength={255}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={bugReport.category}
                          onChange={(e) => setBugReport({ ...bugReport, category: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity
                        </label>
                        <select
                          value={bugReport.severity}
                          onChange={(e) => setBugReport({ ...bugReport, severity: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {severityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={bugReport.description}
                        onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
                        placeholder="Detailed description of the bug"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        maxLength={1000}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Steps to Reproduce
                      </label>
                      <textarea
                        value={bugReport.stepsToReproduce}
                        onChange={(e) => setBugReport({ ...bugReport, stepsToReproduce: e.target.value })}
                        placeholder="1. Go to...\n2. Click on...\n3. Expected result vs actual result"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Behavior
                        </label>
                        <textarea
                          value={bugReport.expectedBehavior}
                          onChange={(e) => setBugReport({ ...bugReport, expectedBehavior: e.target.value })}
                          placeholder="What should happen?"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Actual Behavior
                        </label>
                        <textarea
                          value={bugReport.actualBehavior}
                          onChange={(e) => setBugReport({ ...bugReport, actualBehavior: e.target.value })}
                          placeholder="What actually happens?"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sidebar - Screenshots & System Info */}
                  <div className="space-y-6">
                    {/* Screenshot Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshots
                      </h3>
                      
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          📸 <strong>Add Screenshots:</strong> Upload images to help us understand the issue better.
                          <br />
                          <strong>How to add screenshots:</strong>
                          <br />
                          • Take a screenshot using your device's built-in function
                          <br />
                          • Click "Upload Screenshots" below to select images from your device
                          <br />
                          • Supports PNG, JPEG, GIF, and WebP formats (max 10MB each)
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Screenshots</span>
                        </button>

                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Uploaded Images Preview */}
                        {screenshots.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600 font-medium">
                              {screenshots.length} image{screenshots.length !== 1 ? 's' : ''} uploaded
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {screenshots.map((file, index) => {
                                const previewUrl = createPreviewUrl(file);
                                return (
                                  <div key={`image-${index}`} className="bg-white p-3 rounded-lg border shadow-sm">
                                    <div className="flex items-start space-x-3">
                                      {/* Thumbnail */}
                                      <div className="flex-shrink-0">
                                        <img 
                                          src={previewUrl}
                                          alt={`Uploaded image ${index + 1}`}
                                          className="w-12 h-12 object-cover rounded border"
                                          onLoad={() => URL.revokeObjectURL(previewUrl)}
                                        />
                                      </div>
                                      
                                      {/* File Info */}
                                      <div className="flex-grow min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {file.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                                        </div>
                                      </div>
                                      
                                      {/* Remove Button */}
                                      <button
                                        onClick={() => removeScreenshot(index)}
                                        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                        title="Remove image"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* System Info Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Smartphone className="w-4 h-4 mr-2" />
                        System Information
                      </h3>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Browser: {navigator.userAgent.split(' ')[0]}</div>
                        <div>Screen: {screen.width}×{screen.height}</div>
                        <div>Viewport: {window.innerWidth}×{window.innerHeight}</div>
                        <div>Platform: {navigator.platform}</div>
                        <div>Language: {navigator.language}</div>
                        <div className="flex items-center space-x-1">
                          <Wifi className={`w-3 h-3 ${navigator.onLine ? 'text-green-500' : 'text-red-500'}`} />
                          <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    * Required fields
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitBugReport}
                      disabled={isSubmitting || !bugReport.title.trim() || !bugReport.description.trim()}
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Bug Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingBugReportButton;
