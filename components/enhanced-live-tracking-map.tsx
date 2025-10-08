'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation2 } from 'lucide-react';

interface Stop {
  id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
  estimated_arrival?: string;
  isPassed?: boolean;
}

interface EnhancedLiveTrackingMapProps {
  latitude: number;
  longitude: number;
  routeName: string;
  driverName: string;
  vehicleNumber: string;
  heading?: number | null;
  speed?: number | null;
  stops?: Stop[];
  currentStopIndex?: number;
}

// Fix for default markers in Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export default function EnhancedLiveTrackingMap({ 
  latitude, 
  longitude, 
  routeName, 
  driverName, 
  vehicleNumber,
  heading,
  speed,
  stops = [],
  currentStopIndex = 0
}: EnhancedLiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map with better view
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([latitude, longitude], 14);
      
      mapInstanceRef.current = map;

      // Add custom zoom control on the right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Add tile layer with better styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Create animated bus marker with rotation
      const rotation = heading || 0;
      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `
          <div class="relative">
            <div class="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
            <div class="relative" style="
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border-radius: 50%;
              width: 56px;
              height: 56px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              border: 4px solid white;
              box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5), 0 0 0 8px rgba(16, 185, 129, 0.1);
              transform: rotate(${rotation}deg);
              transition: transform 0.5s ease;
            ">
              🚌
            </div>
            <div style="
              position: absolute;
              bottom: -28px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              color: #059669;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              white-space: nowrap;
            ">
              ${speed ? `${speed} km/h` : 'Moving'}
            </div>
          </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
        popupAnchor: [0, -35]
      });

      // Add bus marker with pulse animation
      const busMarker = L.marker([latitude, longitude], { 
        icon: busIcon,
        zIndexOffset: 1000 
      }).addTo(map);
      
      busMarkerRef.current = busMarker;

      // Enhanced popup with better design
      busMarker.bindPopup(`
        <div style="min-width: 280px; padding: 8px;">
          <div style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px;
            margin: -8px -8px 12px -8px;
            border-radius: 8px 8px 0 0;
          ">
            <h3 style="margin: 0 0 8px 0; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              🚌 ${routeName}
            </h3>
            ${speed ? `<div style="font-size: 12px; opacity: 0.9;">Speed: ${speed} km/h</div>` : ''}
          </div>
          <div style="padding: 0 4px;">
            <div style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
              <span style="font-size: 16px;">👨‍✈️</span>
              <div>
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Driver</div>
                <div style="font-weight: 600; color: #111827;">${driverName}</div>
              </div>
            </div>
            <div style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
              <span style="font-size: 16px;">🚐</span>
              <div>
                <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle</div>
                <div style="font-weight: 600; color: #111827;">${vehicleNumber}</div>
              </div>
            </div>
            <div style="margin: 12px 0 4px 0; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 10px; color: #9ca3af; font-family: monospace;">
                📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      `, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      setMapReady(true);

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          busMarkerRef.current = null;
          stopMarkersRef.current = [];
          routeLineRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Update route line and stop markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || stops.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing stop markers and route line
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Create route line with all stops
    const routeCoordinates: [number, number][] = stops
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map(stop => [stop.latitude, stop.longitude]);

    if (routeCoordinates.length > 0) {
      // Add current bus location to route if not at a stop
      const allCoordinates = [...routeCoordinates];
      
      // Draw the complete route
      const routeLine = L.polyline(allCoordinates, {
        color: '#10b981',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
        dashArray: '10, 10',
        dashOffset: '0'
      }).addTo(map);

      routeLineRef.current = routeLine;

      // Animate the dash
      let offset = 0;
      const animateDash = () => {
        offset += 1;
        if (offset > 20) offset = 0;
        routeLine.setStyle({ dashOffset: String(offset) });
        requestAnimationFrame(animateDash);
      };
      animateDash();
    }

    // Add stop markers
    stops.forEach((stop, index) => {
      const isPassed = index < currentStopIndex;
      const isCurrent = index === currentStopIndex;
      const isUpcoming = index > currentStopIndex;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="position: relative;">
            <div style="
              background: ${isPassed ? '#10b981' : isCurrent ? '#f59e0b' : '#e5e7eb'};
              color: ${isPassed || isCurrent ? 'white' : '#6b7280'};
              border-radius: 50%;
              width: ${isCurrent ? '40px' : '32px'};
              height: ${isCurrent ? '40px' : '32px'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: ${isCurrent ? '16px' : '14px'};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              transition: all 0.3s ease;
              ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
            ">
              ${isPassed ? '✓' : index + 1}
            </div>
            <div style="
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              margin-top: 8px;
              background: white;
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              color: ${isPassed ? '#10b981' : isCurrent ? '#f59e0b' : '#6b7280'};
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              white-space: nowrap;
              max-width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${stop.stop_name}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25]
      });

      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: stopIcon,
        zIndexOffset: isPassed ? 100 : isCurrent ? 500 : 50
      }).addTo(map);

      // Add popup for stop
      marker.bindPopup(`
        <div style="min-width: 200px; padding: 4px;">
          <div style="
            background: ${isPassed ? '#10b981' : isCurrent ? '#f59e0b' : '#6b7280'};
            color: white;
            padding: 12px;
            margin: -4px -4px 8px -4px;
            border-radius: 6px 6px 0 0;
          ">
            <h4 style="margin: 0; font-weight: 700; font-size: 15px;">
              ${isPassed ? '✓ ' : ''}Stop ${index + 1}${isCurrent ? ' (Current)' : ''}
            </h4>
          </div>
          <div style="padding: 0 4px 4px 4px;">
            <p style="margin: 4px 0; font-weight: 600; color: #111827;">${stop.stop_name}</p>
            ${stop.estimated_arrival ? `
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                🕐 ${stop.estimated_arrival}
              </p>
            ` : ''}
            <p style="margin: 4px 0; font-size: 10px; color: #9ca3af; font-family: monospace;">
              ${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      `);

      stopMarkersRef.current.push(marker);
    });

    // Fit bounds to show all stops and bus
    try {
      const allPoints: [number, number][] = [
        [latitude, longitude],
        ...routeCoordinates
      ];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15
      });
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [mapReady, stops, currentStopIndex]);

  // Update bus marker position and rotation
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !busMarkerRef.current) return;

    const map = mapInstanceRef.current;
    const busMarker = busMarkerRef.current;
    const newLatLng = L.latLng(latitude, longitude);

    // Smoothly animate to new position
    busMarker.setLatLng(newLatLng);
    map.panTo(newLatLng, {
      animate: true,
      duration: 1,
      easeLinearity: 0.5
    });

    // Update bus icon with rotation
    const rotation = heading || 0;
    const busIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div class="relative">
          <div class="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
          <div class="relative" style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: 4px solid white;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.5), 0 0 0 8px rgba(16, 185, 129, 0.1);
            transform: rotate(${rotation}deg);
            transition: transform 0.5s ease;
          ">
            🚌
          </div>
          <div style="
            position: absolute;
            bottom: -28px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            color: #059669;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            white-space: nowrap;
          ">
            ${speed ? `${speed} km/h` : 'Moving'}
          </div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
      popupAnchor: [0, -35]
    });

    busMarker.setIcon(busIcon);

    // Update popup content
    busMarker.setPopupContent(`
      <div style="min-width: 280px; padding: 8px;">
        <div style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px;
          margin: -8px -8px 12px -8px;
          border-radius: 8px 8px 0 0;
        ">
          <h3 style="margin: 0 0 8px 0; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 8px;">
            🚌 ${routeName}
          </h3>
          ${speed ? `<div style="font-size: 12px; opacity: 0.9;">Speed: ${speed} km/h</div>` : ''}
        </div>
        <div style="padding: 0 4px;">
          <div style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
            <span style="font-size: 16px;">👨‍✈️</span>
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Driver</div>
              <div style="font-weight: 600; color: #111827;">${driverName}</div>
            </div>
          </div>
          <div style="margin: 8px 0; display: flex; align-items: start; gap: 8px;">
            <span style="font-size: 16px;">🚐</span>
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle</div>
              <div style="font-weight: 600; color: #111827;">${vehicleNumber}</div>
            </div>
          </div>
          <div style="margin: 12px 0 4px 0; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 10px; color: #9ca3af; font-family: monospace;">
              📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    `);
  }, [mapReady, latitude, longitude, routeName, driverName, vehicleNumber, heading, speed]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
      <div 
        ref={mapRef} 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      {/* Map overlay styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}
