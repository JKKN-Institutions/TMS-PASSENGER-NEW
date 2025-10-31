// Helper functions for stop name translations

export interface RouteStop {
  id: string;
  stop_name: string;
  stop_name_ta?: string;
  stop_time?: string;
  sequence_order?: number;
  is_major_stop?: boolean;
}

/**
 * Get the localized stop name based on current language
 * @param stop - Route stop object
 * @param language - Current language ('en' or 'ta')
 * @returns Localized stop name
 */
export function getLocalizedStopName(
  stop: RouteStop | { stop_name: string; stop_name_ta?: string },
  language: 'en' | 'ta'
): string {
  if (language === 'ta' && stop.stop_name_ta) {
    return stop.stop_name_ta;
  }
  return stop.stop_name;
}

/**
 * Get Tamil stop name from a text stop name by matching with route stops
 * This is useful when boarding_stop is stored as text in bookings
 * @param stopName - English stop name
 * @param routeStops - Array of route stops with Tamil names
 * @param language - Current language
 * @returns Localized stop name
 */
export function getStopNameFromList(
  stopName: string,
  routeStops: RouteStop[],
  language: 'en' | 'ta'
): string {
  if (language === 'en' || !stopName) {
    return stopName;
  }

  // Find matching stop in route stops
  const matchingStop = routeStops.find(
    (stop) => stop.stop_name === stopName
  );

  if (matchingStop && matchingStop.stop_name_ta) {
    return matchingStop.stop_name_ta;
  }

  // Fallback to English name
  return stopName;
}

/**
 * Format stop time with proper localization
 * @param stopTime - Stop time in HH:mm format
 * @param language - Current language
 * @returns Formatted stop time
 */
export function formatStopTime(
  stopTime: string | undefined,
  language: 'en' | 'ta'
): string {
  if (!stopTime) return '-';

  if (language === 'ta') {
    // Convert to 12-hour format with Tamil period indicators
    const [hours, minutes] = stopTime.split(':').map(Number);
    const period = hours >= 12 ? 'பிற்பகல்' : 'காலை';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  return stopTime;
}
