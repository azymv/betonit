import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 24, 
  color = 'currentColor',
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div 
      className={`animate-spin ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        borderWidth: Math.max(2, size / 12),
        borderStyle: 'solid',
        borderColor: `${color} transparent transparent transparent`,
      }}
      aria-label="loading"
      role="status"
    />
  );
} 