'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, CheckCircle, XCircle, Loader2, ScanLine } from 'lucide-react';

interface TicketScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (bookingId: string) => void;
}

export default function TicketScanner({ isOpen, onClose, onScanSuccess }: TicketScannerProps) {
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const verifyTicket = async (ticketCode: string) => {
    setVerifying(true);
    setResult(null);

    try {
      const response = await fetch('/api/staff/verify-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketCode }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: 'Ticket Verified Successfully!',
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
      console.error('Error verifying ticket:', error);
      setResult({
        success: false,
        message: 'Error verifying ticket. Please try again.',
      });
    } finally {
      setVerifying(false);
      setManualCode('');
      if (scanning) {
        stopCamera();
        setScanning(false);
      }
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
    onClose();
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode('');
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
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-4 border-green-500 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    Position the QR code within the frame
                  </p>
                  <button
                    onClick={() => {
                      stopCamera();
                      setScanning(false);
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
                        Enter Ticket Code Manually
                      </label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="e.g., TMS-12345678"
                        disabled={verifying}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-center text-lg"
                      />
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
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Booking ID:</span>
                            <span className="text-gray-900 font-mono text-sm">{result.bookingId}</span>
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
