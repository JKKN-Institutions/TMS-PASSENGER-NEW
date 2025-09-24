'use client';

import React from 'react';
import FloatingBugReportButton from '@/components/floating-bug-report-button';

export default function TestBugReportPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bug Report Component Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Look for the red bug report button in the bottom-right corner</li>
            <li>Click the bug report button to open the modal</li>
            <li>Try the "Upload Screenshots" button (upload-only functionality)</li>
            <li>Fill out the form and try to submit</li>
            <li>Check the browser console for logs starting with "🐛"</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Expected Console Logs</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            <div className="text-green-600">✅ 🐛 Component version: UPLOAD_ONLY - No screen capture</div>
            <div className="text-green-600">✅ 🐛 File upload working correctly</div>
            <div className="text-green-600">✅ 🐛 No screen capture functionality</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Errors That Should NOT Appear</h2>
          <div className="bg-red-50 p-4 rounded font-mono text-sm">
            <div className="text-red-600">❌ Error capturing screenshot: Error: Attempting to parse an unsupported color function "oklch"</div>
            <div className="text-red-600">❌ Error submitting bug report: ReferenceError: setUploadedFiles is not defined</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Content with Modern CSS</h2>
          <div 
            className="p-4 rounded-lg"
            style={{
              background: 'oklch(0.7 0.15 180)',
              color: 'color-mix(in srgb, blue 50%, white)',
              border: '2px solid lch(50% 50 180)'
            }}
          >
            This element uses modern CSS functions (oklch, color-mix, lch) that would break html2canvas.
            If the screenshot capture works without errors, it means we're using native APIs successfully.
          </div>
        </div>
      </div>

      {/* Bug Report Component */}
      <FloatingBugReportButton 
        userId="test-user-123"
        userEmail="test@example.com"
        userName="Test User"
      />
    </div>
  );
}

