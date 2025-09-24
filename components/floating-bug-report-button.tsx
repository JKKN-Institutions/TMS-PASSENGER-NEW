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
// Removed html2canvas import - using only native screen capture APIs
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

  // Debug logging
  useEffect(() => {
    console.log('🐛 FloatingBugReportButton rendered with props:', {
      userId,
      userEmail,
      userName,
      className
    });
    console.log('🐛 Component version: NATIVE_SCREENSHOT_ONLY - No html2canvas');
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

  // Native screen capture only - NO html2canvas
  // Enhanced mobile device detection
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    
    // Check multiple indicators
    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
    
    // Additional mobile indicators
    const isPortraitOrientation = window.innerHeight > window.innerWidth;
    const hasDevicePixelRatio = window.devicePixelRatio > 1;
    
    console.log('🐛 Mobile detection:', {
      userAgent: userAgent,
      isMobileUA,
      isTouchDevice,
      isSmallScreen,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      isPortraitOrientation,
      devicePixelRatio: window.devicePixelRatio
    });
    
    // Return true if ANY mobile indicator is present
    return isMobileUA || (isTouchDevice && isSmallScreen) || 
           (userAgent.includes('Mobile') || userAgent.includes('mobile'));
  };

  const captureScreenshot = async () => {
    try {
      console.log('🐛 Starting native screen capture - VERSION: MOBILE_SAFE_NO_CAMERA');
      console.log('🐛 html2canvas should NOT be available:', typeof window !== 'undefined' ? !!(window as any).html2canvas : 'server-side');
      
      // Ensure we're in a browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error('Screen capture is only available in browser environment');
      }

      // AGGRESSIVE MOBILE DETECTION AND BLOCKING
      const mobile = isMobileDevice();
      
      // Additional safety checks
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = userAgent.includes('mobile') || userAgent.includes('android') || 
                                userAgent.includes('iphone') || userAgent.includes('ipad');
      const isTouchscreen = 'ontouchstart' in window;
      
      console.log('🐛 Device detection results:', {
        mobile,
        isMobileUserAgent,
        isTouchscreen,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      });
      
      // BLOCK ALL MEDIA APIs ON MOBILE - MULTIPLE SAFETY CHECKS
      if (mobile || isMobileUserAgent || isTouchscreen) {
        console.log('🐛 MOBILE DETECTED - COMPLETELY BLOCKING ALL MEDIA CAPTURE');
        toast.error('📱 Mobile Device: Screen capture disabled. Please use "Upload Screenshot" button below to select an image from your photos.');
        return; // EARLY EXIT - NO FURTHER PROCESSING
      }
      
      console.log('🐛 Desktop confirmed - proceeding with screen capture');
      
      // Hide the bug report modal temporarily for clean capture
      const modal = document.querySelector('[data-bug-report-modal]');
      if (modal) {
        (modal as HTMLElement).style.display = 'none';
      }

      // Wait for modal to hide
      await new Promise(resolve => setTimeout(resolve, 300));

      // Method 1: Screen Capture API (Desktop Only - Double check mobile blocking)
      if (!isMobileDevice() && !isTouchscreen && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          console.log('🐛 Using Screen Capture API...');
          toast('Please select the browser window to capture your screen');
          
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              mediaSource: 'screen',
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            },
            audio: false
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          return new Promise<void>((resolve) => {
            video.addEventListener('loadedmetadata', () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    try {
                      const file = new File([blob], `screen-capture-${Date.now()}.png`, {
                        type: 'image/png'
                      });
                      setScreenshots(prev => {
                        const newScreenshots = [...prev, file];
                        console.log('🐛 Screenshot added, total count:', newScreenshots.length);
                        return newScreenshots;
                      });
                      toast.success('Screenshot captured successfully!');
                    } catch (fileError) {
                      console.error('🐛 Error creating screenshot file:', fileError);
                      toast.error('Failed to create screenshot file');
                    }
                  } else {
                    console.error('🐛 No blob created from canvas');
                    toast.error('Failed to capture screenshot');
                  }
                  
                  // Clean up
                  try {
                    stream.getTracks().forEach(track => track.stop());
                  } catch (cleanupError) {
                    console.warn('🐛 Error cleaning up stream:', cleanupError);
                  }
                  
                  // Show modal again
                  if (modal) {
                    (modal as HTMLElement).style.display = 'block';
                  }
                  
                  resolve();
                }, 'image/png', 0.9);
              } else {
                throw new Error('Could not get canvas context');
              }
            });
          });
          
        } catch (screenError) {
          console.log('🐛 Screen Capture API failed:', screenError);
          // Continue to fallback methods
        }
      }

      // REMOVED: All getUserMedia fallback methods to prevent camera access
      console.log('🐛 Skipping getUserMedia fallback to prevent camera activation');

      // Show modal again if all methods failed
      if (modal) {
        (modal as HTMLElement).style.display = 'block';
      }

      // If we reach here, all native methods failed
      throw new Error('Native screen capture not supported');
      
    } catch (error) {
      console.error('🐛 Error capturing screenshot:', error);
      
      // Ensure modal is visible again
      const modal = document.querySelector('[data-bug-report-modal]');
      if (modal) {
        (modal as HTMLElement).style.display = 'block';
      }
      
      // Show user-friendly message
      toast.error('Screen capture not available in your browser. Please use the "Upload Screenshot" button to manually add a screenshot.');
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
    console.log('🐛 Starting bug report submission...');
    
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
      console.log('🐛 Collecting system info and files...');

      const systemInfo = collectSystemInfo();
      const allFiles = [...screenshots];
      console.log('🐛 Files to upload:', allFiles.length);

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
      
      console.log('🐛 Bug report data:', bugReportData);
      formData.append('bugReport', JSON.stringify(bugReportData));

      // Add files with error handling
      allFiles.forEach((file, index) => {
        try {
          formData.append(`files`, file);
          console.log(`🐛 Added file ${index + 1}:`, file.name, file.size, 'bytes');
        } catch (fileError) {
          console.error(`🐛 Error adding file ${index + 1}:`, fileError);
        }
      });

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('🐛 Bug report submitted successfully:', result);
        toast.success('Bug report submitted successfully! Thank you for your feedback.');
        
        // Reset form with comprehensive state clearing
        try {
          setBugReport({
            title: '',
            description: '',
            stepsToReproduce: '',
            expectedBehavior: '',
            actualBehavior: '',
            category: 'functionality',
            severity: 'medium'
          });
          
          setScreenshots([]);
          console.log('🐛 Form state reset successfully');
          
          // Clear file input if it exists
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          setIsOpen(false);
        } catch (resetError) {
          console.error('🐛 Error resetting form:', resetError);
          // Still close the modal even if reset fails
          setIsOpen(false);
        }
      } else {
        console.error('🐛 Bug report submission failed:', result);
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
                      
                      {typeof window !== 'undefined' && isMobileDevice() && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            📱 <strong>Mobile tip:</strong> Take a screenshot using your device's built-in screenshot function 
                            (usually Power + Volume Down), then use "Upload Screenshot" below to select it.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={captureScreenshot}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2"
                          >
                            <Camera className="w-4 h-4" />
                            <span>
                              {typeof window !== 'undefined' && isMobileDevice() 
                                ? 'Capture Screen (Use Upload Below on Mobile)' 
                                : 'Capture Screen'
                              }
                            </span>
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
