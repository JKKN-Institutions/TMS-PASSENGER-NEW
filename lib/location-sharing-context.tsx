'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationSharingContextType {
  isSharing: boolean;
  setIsSharing: (sharing: boolean) => void;
  lastUpdate: Date | null;
  setLastUpdate: (date: Date | null) => void;
}

const LocationSharingContext = createContext<LocationSharingContextType | undefined>(undefined);

interface LocationSharingProviderProps {
  children: ReactNode;
}

export function LocationSharingProvider({ children }: LocationSharingProviderProps) {
  const [isSharing, setIsSharingState] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load sharing state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tms-location-sharing');
      if (saved === 'true') {
        setIsSharingState(true);
      }
    }
  }, []);

  // Save sharing state to localStorage when changed
  const setIsSharing = (sharing: boolean) => {
    setIsSharingState(sharing);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms-location-sharing', sharing ? 'true' : 'false');
      if (!sharing) {
        setLastUpdate(null);
      }
    }
  };

  return (
    <LocationSharingContext.Provider value={{ isSharing, setIsSharing, lastUpdate, setLastUpdate }}>
      {children}
    </LocationSharingContext.Provider>
  );
}

export function useLocationSharing() {
  const context = useContext(LocationSharingContext);
  if (!context) {
    throw new Error('useLocationSharing must be used within a LocationSharingProvider');
  }
  return context;
}
