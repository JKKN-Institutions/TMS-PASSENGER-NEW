'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  X,
  Camera,
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
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface BugReportData {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  category: 'ui_bug' | 'functional_bug' | 'performance_issue' | 'crash' | 'security_issue' | 'feature_request' | 'other';
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

  // Debug logging
  useEffect(() => {
    console.log('🐛 FloatingBugReportButton rendered with props:', {
      userId,
      userEmail,
      userName,
      className
    });
  }, [userId, userEmail, userName, className]);

  // Debug modal state
  useEffect(() => {
    console.log('🐛 Modal state changed:', { isOpen });
  }, [isOpen]);

  const [bugReport, setBugReport] = useState<BugReportData>({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    category: 'other',
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

  // Screenshot functionality
  const captureScreenshot = async () => {
    try {
      toast.info('Capturing screenshot...');
      
      // Hide the bug report modal temporarily
      const modal = document.querySelector('[data-bug-report-modal]');
      if (modal) {
        (modal as HTMLElement).style.display = 'none';
      }

      // Wait a moment for the modal to hide
      await new Promise(resolve => setTimeout(resolve, 300));

      // Configure html2canvas with more robust options
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        scale: 0.7, // Better quality while keeping file size reasonable
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        ignoreElements: (element) => {
          // Ignore any problematic elements
          return element.tagName === 'SCRIPT' || 
                 element.tagName === 'STYLE' ||
                 element.hasAttribute('data-html2canvas-ignore');
        },
        onclone: (clonedDoc) => {
          // Replace problematic CSS colors in the cloned document
          const styleSheets = clonedDoc.styleSheets;
          try {
            for (let i = 0; i < styleSheets.length; i++) {
              const styleSheet = styleSheets[i];
              if (styleSheet.cssRules) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                  const rule = styleSheet.cssRules[j];
                  if (rule instanceof CSSStyleRule) {
                    // Replace oklch colors with fallback colors
                    rule.style.cssText = rule.style.cssText
                      .replace(/oklch\([^)]+\)/g, '#000000')
                      .replace(/color-mix\([^)]+\)/g, '#000000');
                  }
                }
              }
            }
          } catch (e) {
            // Ignore CSS parsing errors and continue
            console.log('CSS processing skipped due to CORS or parsing issues');
          }
          
          // Add fallback styles to cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: inherit !important;
              background-color: inherit !important;
            }
            body {
              background-color: #ffffff !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Show the modal again
      if (modal) {
        (modal as HTMLElement).style.display = 'block';
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, {
            type: 'image/png'
          });
          setScreenshots(prev => [...prev, file]);
          toast.success('Screenshot captured successfully!');
        } else {
          throw new Error('Failed to create screenshot blob');
        }
      }, 'image/png', 0.8);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      
      // Show the modal again if it was hidden
      const modal = document.querySelector('[data-bug-report-modal]');
      if (modal) {
        (modal as HTMLElement).style.display = 'block';
      }
      
      // Offer alternative screenshot method
      toast.error('Failed to capture automatic screenshot. Please upload a manual screenshot instead.');
      
      // Try fallback method using screen capture API if available
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' }
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `screen-capture-${Date.now()}.png`, {
                  type: 'image/png'
                });
                setScreenshots(prev => [...prev, file]);
                toast.success('Screen capture completed!');
              }
              stream.getTracks().forEach(track => track.stop());
            }, 'image/png', 0.8);
          });
        }
      } catch (fallbackError) {
        console.log('Screen capture API not available');
      }
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.error(`${file.name}: Only image files are allowed for screenshots`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name}: File size must be less than 10MB`);
        return false;
      }
      
      return true;
    });

    // Add images as screenshots
    setScreenshots(prev => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} screenshot(s) uploaded successfully!`);
    }
  };

  // Remove screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  // Submit bug report
  const submitBugReport = async () => {
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

      const systemInfo = collectSystemInfo();
      const allFiles = [...screenshots];

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add bug report data
      formData.append('bugReport', JSON.stringify({
        ...bugReport,
        reporterId: userId,
        reporterEmail: userEmail,
        reporterName: userName || userEmail,
        systemInfo
      }));

      // Add files
      allFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bug report submitted successfully! Thank you for your feedback.');
        
        // Reset form
        setBugReport({
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          category: 'other',
          severity: 'medium'
        });
        setScreenshots([]);
        setUploadedFiles([]);
        setIsOpen(false);
      } else {
        toast.error(result.error || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'ui_bug', label: 'UI/Visual Bug', icon: Monitor },
    { value: 'functional_bug', label: 'Functional Issue', icon: AlertCircle },
    { value: 'performance_issue', label: 'Performance Issue', icon: Zap },
    { value: 'crash', label: 'App Crash/Error', icon: X },
    { value: 'security_issue', label: 'Security Concern', icon: AlertCircle },
    { value: 'feature_request', label: 'Feature Request', icon: FileText },
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
        onClick={() => {
          console.log('🐛 Main bug button clicked, opening modal...');
          setIsOpen(true);
        }}
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
                        <Camera className="w-4 h-4 mr-2" />
                        Screenshots
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={captureScreenshot}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Auto Screenshot</span>
                          </button>
                          
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload Screenshot</span>
                          </button>
                        </div>

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

                        {/* File List */}
                        {screenshots.length > 0 && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {screenshots.map((file, index) => (
                              <div key={`screenshot-${index}`} className="flex items-center justify-between bg-white p-2 rounded border">
                                <div className="flex items-center space-x-2">
                                  <Camera className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <button
                                  onClick={() => removeScreenshot(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
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
