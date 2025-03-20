'use client';

import { useState, useEffect } from 'react';

// Default placeholder image as fallback
export const PLACEHOLDER_IMAGE = '/images/events/event_placeholder.png';

/**
 * Hook to validate and normalize image URLs.
 * It ensures the URL is properly formatted for Next.js Image component,
 * and provides a fallback to a placeholder if needed.
 */
export function useImageChecker(rawImageUrl?: string) {
  const [validatedUrl, setValidatedUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let url = rawImageUrl || '';
    
    // Handle empty URL
    if (!url || url.trim() === '') {
      console.warn('Empty image URL, using placeholder');
      setValidatedUrl(PLACEHOLDER_IMAGE);
      setIsLoading(false);
      return;
    }
    
    // Fix relative paths to start with /
    if (!url.startsWith('/') && !url.startsWith('http')) {
      url = '/' + url;
      console.log('Fixed relative URL by adding leading slash:', url);
    }
    
    // Pre-load image to check if it loads successfully
    const img = new Image();
    img.onload = () => {
      console.log('Image loaded successfully:', url);
      setValidatedUrl(url);
      setHasError(false);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error('Image failed to load:', url);
      setValidatedUrl(PLACEHOLDER_IMAGE);
      setHasError(true);
      setIsLoading(false);
    };
    
    // Start loading the image
    img.src = url;
    
    // Set validated URL immediately for faster initial render
    setValidatedUrl(url);
    
    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [rawImageUrl]);
  
  return { validatedUrl, isLoading, hasError };
}

/**
 * Hook to determine media type based on URL.
 */
export function useMediaTypeDetection(url: string) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif'>('image');
  
  useEffect(() => {
    if (!url) return;
    
    const lowercaseUrl = url.toLowerCase();
    
    if (lowercaseUrl.endsWith('.mp4') || lowercaseUrl.endsWith('.webm') || lowercaseUrl.endsWith('.mov')) {
      setMediaType('video');
    } else if (lowercaseUrl.endsWith('.gif')) {
      setMediaType('gif');
    } else {
      setMediaType('image');
    }
    
    console.log(`Detected media type for URL: ${url}`, mediaType);
  }, [url]);
  
  return mediaType;
} 