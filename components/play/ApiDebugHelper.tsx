'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useImageChecker } from './hooks/useImageChecker';

interface ApiResponse {
  events: Array<{
    id: string;
    title: string;
    media_url?: string;
    image_url?: string;
    short_description?: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ApiDebugHelper({ userId }: { userId: string }) {
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number>(0);
  
  // Get current event for image testing
  const currentEvent = apiResponse?.events?.[selectedEvent];
  
  // Use our image checker hook to test the image URL
  const { validatedUrl, hasError, isLoading: imageIsLoading } = useImageChecker(
    currentEvent?.media_url || currentEvent?.image_url
  );
  
  const testApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const origin = window.location.origin;
      const response = await fetch(`${origin}/api/play/events?page=1&pageSize=10&userId=${userId}`);
      console.log('Debug API call status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Debug API data:', data);
      setApiResponse(data);
      setSelectedEvent(0); // Reset to first event
    } catch (err) {
      console.error('Debug API error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to switch selected event
  const changeEvent = (delta: number) => {
    if (!apiResponse?.events) return;
    
    const newIndex = selectedEvent + delta;
    if (newIndex >= 0 && newIndex < apiResponse.events.length) {
      setSelectedEvent(newIndex);
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">API Debug Helper</h3>
      <Button 
        onClick={testApi}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing API...' : 'Test API Directly'}
      </Button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
      
      {apiResponse && (
        <div>
          <p className="mb-2">API returned {apiResponse.events?.length || 0} events</p>
          
          {apiResponse.events?.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={() => changeEvent(-1)}
                  disabled={selectedEvent === 0}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ←
                </button>
                <span>Event {selectedEvent + 1} of {apiResponse.events.length}</span>
                <button 
                  onClick={() => changeEvent(1)}
                  disabled={selectedEvent === apiResponse.events.length - 1}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  →
                </button>
              </div>
              
              <h4 className="font-bold text-base">{currentEvent?.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{currentEvent?.short_description}</p>
              
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Image URL:</span> {currentEvent?.image_url || 'None'}</p>
                <p><span className="font-semibold">Media URL:</span> {currentEvent?.media_url || 'None'}</p>
                <p><span className="font-semibold">Validated URL:</span> {validatedUrl || 'Processing...'}</p>
                <p><span className="font-semibold">Image Status:</span> {
                  imageIsLoading ? 'Loading...' : (hasError ? 'Error loading image' : 'Image loaded successfully')
                }</p>
              </div>
              
              {validatedUrl && (
                <div className="mt-4 relative h-40 overflow-hidden rounded">
                  {imageIsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      Loading image...
                    </div>
                  ) : hasError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-800">
                      Failed to load image
                    </div>
                  ) : (
                    <img 
                      src={validatedUrl} 
                      alt={currentEvent?.title} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 