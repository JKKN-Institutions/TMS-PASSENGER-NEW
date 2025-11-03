'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, CheckCircle, XCircle, Loader2, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface TicketScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (bookingId: string) => void;
  staffEmail?: string;
}

export default function TicketScanner({ isOpen, onClose, onScanSuccess, staffEmail }: TicketScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    bookingId?: string;
    passengerName?: string;
    routeName?: string;
  } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scanning) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanning]);

  const startCamera = async () => {
    try {
      setScannerError(null);

      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      // Start scanning with continuous mode
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 30, // Higher FPS for faster detection (like GPay)
          qrbox: { width: 250, height: 250 }, // QR box size
          aspectRatio: 1.0, // Square aspect ratio
        },
        (decodedText) => {
          // Success callback when QR code is scanned
          console.log('✅ QR Code scanned:', decodedText);

          // Don't stop camera - keep scanning for continuous mode
          // Just verify the ticket
          verifyTicket(decodedText);
        },
        (errorMessage) => {
          // Error callback (this fires frequently while searching, so we don't show it)
          // This is normal during scanning, not an actual error
        }
      );

      console.log('✅ Camera started successfully');
    } catch (error: any) {
      console.error('❌ Error starting camera:', error);
      setScannerError('Unable to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        console.log('🛑 Camera stopped');
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const verifyTicket = async (ticketCode: string) => {
    // Prevent duplicate verification while already verifying
    if (verifying) {
      console.log('⏸️ Already verifying, skipping...');
      return;
    }

    // Validate ticket code
    if (!ticketCode || ticketCode.trim() === '') {
      console.error('❌ Empty ticket code received');
      setResult({
        success: false,
        message: 'Invalid QR code - empty or malformed',
      });
      return;
    }

    setVerifying(true);
    setResult(null);

    // Pause scanning during verification to prevent multiple scans
    const wasScanningBeforeVerify = scanning;
    if (wasScanningBeforeVerify) {
      await stopCamera();
      setScanning(false);
    }

    try {
      console.log('🔍 Verifying ticket:', ticketCode);
      console.log('📏 Ticket code length:', ticketCode.length);
      console.log('👤 Staff email:', staffEmail);

      const response = await fetch('/api/staff/verify-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketCode,
          staffEmail: staffEmail || 'staff@system'
        }),
      });

      const data = await response.json();

      console.log('📊 Verification response:', data);

      if (data.success) {
        setResult({
          success: true,
          message: data.alreadyVerified
            ? 'Attendance Already Marked!'
            : 'Attendance Marked Successfully!',
          bookingId: data.booking?.id,
          passengerName: data.booking?.passenger_name,
          routeName: data.booking?.route_name,
        });
        if (onScanSuccess && data.booking?.id) {
          onScanSuccess(data.booking.id);
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Invalid ticket code',
        });
      }
    } catch (error) {
      console.error('❌ Error verifying ticket:', error);
      setResult({
        success: false,
        message: 'Error verifying ticket. Please try again.',
      });
    } finally {
      setVerifying(false);
      setManualCode('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyTicket(manualCode.trim());
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanning(false);
    setResult(null);
    setManualCode('');
    setScannerError(null);
    onClose();
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode('');
    setScannerError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-yellow-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Scan Ticket</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* Camera Scanner */}
              {scanning ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    {/* QR Reader Container */}
                    <div id="qr-reader" className="w-full"></div>
                  </div>

                  {scannerError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{scannerError}</p>
                    </div>
                  )}

                  {verifying && (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Verifying ticket...</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      stopCamera();
                      setScanning(false);
                      setScannerError(null);
                    }}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Start Camera Button */}
                  <button
                    onClick={() => setScanning(true)}
                    disabled={verifying}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Scan QR Code</span>
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter QR Code Manually
                      </label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="e.g., QR-abc123-2025-11-03"
                        disabled={verifying}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-center text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Enter the QR code exactly as shown on the ticket
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || verifying}
                      className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-xl font-semibold hover:from-yellow-700 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify Ticket</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            /* Result Display */
            <div className="space-y-6">
              <div className={`p-6 rounded-xl ${
                result.success
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
              }`}>
                <div className="flex flex-col items-center space-y-4">
                  {result.success ? (
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                      <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className={`text-xl font-bold mb-2 ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </h3>

                    {result.success && (
                      <div className="mt-4 space-y-2 text-left bg-white bg-opacity-60 p-4 rounded-lg">
                        {result.passengerName && (
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Passenger:</span>
                            <span className="text-gray-900">{result.passengerName}</span>
                          </div>
                        )}
                        {result.routeName && (
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Route:</span>
                            <span className="text-gray-900">{result.routeName}</span>
                          </div>
                        )}
                        {result.bookingId && (
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-gray-700">Booking ID:</span>
                            <span className="text-gray-900 font-mono text-xs break-all max-w-[200px]">{result.bookingId}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={resetScanner}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-md"
                >
                  Scan Another Ticket
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
