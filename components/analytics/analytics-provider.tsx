'use client';

import { createContext, useContext, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import * as mixpanel from '@/lib/analytics/mixpanel';

// Define analytics context type
type AnalyticsContextType = {
  track: typeof mixpanel.track;
  identify: typeof mixpanel.identify;
  trackPageView: typeof mixpanel.trackPageView;
  setUserProperties: typeof mixpanel.setUserProperties;
  reset: typeof mixpanel.reset;
};

// Create context with default values
const AnalyticsContext = createContext<AnalyticsContextType>({
  track: mixpanel.track,
  identify: mixpanel.identify,
  trackPageView: mixpanel.trackPageView,
  setUserProperties: mixpanel.setUserProperties,
  reset: mixpanel.reset,
});

// Provider component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      mixpanel.trackPageView(pathname);
    }
  }, [pathname, searchParams]);

  return (
    <AnalyticsContext.Provider
      value={{
        track: mixpanel.track,
        identify: mixpanel.identify,
        trackPageView: mixpanel.trackPageView,
        setUserProperties: mixpanel.setUserProperties,
        reset: mixpanel.reset,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook to use analytics
export const useAnalytics = () => useContext(AnalyticsContext);