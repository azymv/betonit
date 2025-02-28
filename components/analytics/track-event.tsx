'use client';

import { useEffect } from 'react';
import { useAnalytics } from './analytics-provider';

interface TrackEventProps {
  eventName: string;
  properties?: Record<string, unknown>;
  children?: React.ReactNode;
  onMount?: boolean;
}

// Component that tracks an event either on mount or when rendered
export function TrackEvent({ 
  eventName, 
  properties, 
  children, 
  onMount = true 
}: TrackEventProps) {
  const { track } = useAnalytics();

  useEffect(() => {
    if (onMount) {
      track(eventName, properties);
    }
  }, [eventName, properties, onMount, track]);

  if (!onMount && children) {
    return <span onClick={() => track(eventName, properties)}>{children}</span>;
  }

  return <>{children}</>;
}