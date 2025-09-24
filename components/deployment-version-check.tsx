'use client';

import React, { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  build_date: string;
  features: {
    native_screenshot: boolean;
    html2canvas_removed: boolean;
    deployment_fixes: boolean;
  };
  changes: string[];
}

const DeploymentVersionCheck: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load version info
    fetch('/version.json')
      .then(response => response.json())
      .then((data: VersionInfo) => {
        setVersionInfo(data);
        console.log('🚀 Deployment Version:', data);
      })
      .catch(error => {
        console.error('Could not load version info:', error);
      });

    // Show version check on Ctrl+Shift+V
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible || !versionInfo) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-[99999] bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg max-w-md"
      style={{ zIndex: 99999 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-green-400">🚀 Deployment Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Version:</strong> {versionInfo.version}
        </div>
        <div>
          <strong>Build Date:</strong> {new Date(versionInfo.build_date).toLocaleString()}
        </div>
        
        <div>
          <strong>Features:</strong>
          <ul className="ml-4 mt-1">
            <li className={versionInfo.features.native_screenshot ? 'text-green-400' : 'text-red-400'}>
              {versionInfo.features.native_screenshot ? '✅' : '❌'} Native Screenshot
            </li>
            <li className={versionInfo.features.html2canvas_removed ? 'text-green-400' : 'text-red-400'}>
              {versionInfo.features.html2canvas_removed ? '✅' : '❌'} html2canvas Removed
            </li>
            <li className={versionInfo.features.deployment_fixes ? 'text-green-400' : 'text-red-400'}>
              {versionInfo.features.deployment_fixes ? '✅' : '❌'} Deployment Fixes
            </li>
          </ul>
        </div>

        <div>
          <strong>Recent Changes:</strong>
          <ul className="ml-4 mt-1 text-xs">
            {versionInfo.changes.map((change, index) => (
              <li key={index} className="text-gray-300">• {change}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Press Ctrl+Shift+V to toggle this panel
      </div>
    </div>
  );
};

export default DeploymentVersionCheck;
