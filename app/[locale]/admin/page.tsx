'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Database, Check, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createEvent } from '@/lib/actions/seed-events';
import EventForm from '@/components/admin/EventForm';
import { Event } from '@/lib/types/event';

// Define a type for the result state
interface AdminResult {
  success: boolean;
  message?: string;
  error?: string;
  eventsCount?: number;
  existingCount?: number;
  events?: Event[];
}

export default function AdminPage() {
  const params = useParams();
  // localeStr is kept for future localization support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdminResult | null>(null);
  
  // Функция для создания тестовых событий
  const createTestEvents = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await createEvent({
        title: 'Test Event',
        description: 'This is a test event created by the admin panel.',
        short_description: 'Test event',
        image_url: '/images/events/placeholder.jpg',
        category: 'other',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'active'
      });
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Событие успешно создано',
          eventsCount: 1,
          events: response.event ? [response.event] : undefined,
        });
      } else {
        setResult({
          success: false,
          error: response.error || 'Неизвестная ошибка',
        });
      }
    } catch (err) {
      console.error('Error creating test event:', err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Неизвестная ошибка',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Админ-панель</h1>
      
      <Tabs defaultValue="create-event" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="create-event" className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Создать событие
          </TabsTrigger>
          <TabsTrigger value="seed-data" className="flex items-center gap-1">
            <Database className="h-4 w-4" /> Тестовые данные
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create-event">
          <EventForm />
        </TabsContent>
        
        <TabsContent value="seed-data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Управление тестовыми данными
              </CardTitle>
              <CardDescription>
                Создание тестовых событий для демонстрации функциональности платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result && !result.success && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
              
              {result && result.success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Успех</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {result.message}
                    {result.eventsCount !== undefined && ` Создано событий: ${result.eventsCount}`}
                    {result.existingCount !== undefined && ` Количество существующих событий: ${result.existingCount}`}
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="mb-4">
                Эта функция создаст тестовое событие в базе данных для демонстрации платформы.
                Используйте только в тестовом или демо-окружении.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={createTestEvents} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание тестового события...
                  </>
                ) : (
                  'Создать тестовое событие'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}