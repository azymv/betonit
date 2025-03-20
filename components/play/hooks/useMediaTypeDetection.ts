import { useState, useEffect } from 'react';

interface MediaTypeDetectionResult {
  mediaType: 'image' | 'video' | 'unknown';
  loading: boolean;
  error: boolean;
}

/**
 * Хук для определения типа медиафайла по URL
 * @param url URL медиафайла
 * @returns Объект с типом медиа и статусом загрузки
 */
export function useMediaTypeDetection(url?: string): MediaTypeDetectionResult {
  const [result, setResult] = useState<MediaTypeDetectionResult>({
    mediaType: 'unknown',
    loading: !!url,
    error: false,
  });
  
  useEffect(() => {
    if (!url) {
      setResult({
        mediaType: 'unknown',
        loading: false,
        error: false,
      });
      return;
    }
    
    setResult(prev => ({
      ...prev,
      loading: true,
      error: false,
    }));
    
    // Определяем тип медиа по расширению файла или URL
    const detectMediaType = () => {
      try {
        const urlLower = url.toLowerCase();
        
        // Проверяем видео-расширения
        if (
          urlLower.endsWith('.mp4') ||
          urlLower.endsWith('.webm') ||
          urlLower.endsWith('.ogg') ||
          urlLower.endsWith('.mov') ||
          urlLower.includes('/video/') ||
          urlLower.includes('video=true')
        ) {
          return 'video';
        }
        
        // Проверяем изображения
        if (
          urlLower.endsWith('.jpg') ||
          urlLower.endsWith('.jpeg') ||
          urlLower.endsWith('.png') ||
          urlLower.endsWith('.gif') ||
          urlLower.endsWith('.webp') ||
          urlLower.endsWith('.avif') ||
          urlLower.includes('/image/') ||
          urlLower.includes('image=true')
        ) {
          return 'image';
        }
        
        // По умолчанию считаем, что это изображение
        return 'image';
      } catch (error) {
        console.error('Error detecting media type:', error);
        return 'unknown';
      }
    };
    
    const mediaType = detectMediaType();
    
    setResult({
      mediaType,
      loading: false,
      error: false,
    });
  }, [url]);
  
  return result;
} 