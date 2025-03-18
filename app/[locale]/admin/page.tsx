'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Database, Check, Plus, RefreshCcw, Trophy, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createEvent } from '@/lib/actions/seed-events';
import { updateLeaderboardRanksAdmin } from '@/lib/actions/leaderboard-actions';
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
  timestamp?: string;
}

export default function AdminPage() {
  const params = useParams();
  // localeStr is kept for future localization support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [isRankUpdateLoading, setIsRankUpdateLoading] = useState(false);
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
        image_url: '/images/events/event_placeholder.png',
        category: 'other',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'active'
      });
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Тестовое событие успешно создано!',
          eventsCount: 1
        });
      } else {
        setResult({
          success: false,
          error: response.error || 'Не удалось создать тестовое событие'
        });
      }
    } catch (error) {
      console.error('Error creating test event:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для заполнения базы тестовыми событиями через API
  const seedTestEvents = async () => {
    setIsSeedLoading(true);
    setResult(null);
    
    try {
      // Получаем ключ из переменных окружения (в реальном приложении это должно быть безопасно хранимое значение)
      const seedKey = process.env.NEXT_PUBLIC_SEED_API_KEY || 'your_super_secret_seed_key_change_this';
      
      // Вызываем API для заполнения данными
      const response = await fetch(`/api/admin/seed?key=${seedKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось заполнить базу тестовыми событиями');
      }
      
      setResult({
        success: true,
        message: 'База успешно заполнена тестовыми событиями',
        eventsCount: data.events?.length,
        events: data.events
      });
    } catch (error) {
      console.error('Error seeding test events:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsSeedLoading(false);
    }
  };
  
  // Новая функция для обновления рангов лидерборда
  const updateLeaderboardRanks = async () => {
    setIsRankUpdateLoading(true);
    setResult(null);
    
    try {
      const response = await updateLeaderboardRanksAdmin();
      
      if (response.success) {
        setResult({
          success: true,
          message: response.message || 'Ранги лидерборда успешно обновлены',
          timestamp: response.timestamp
        });
      } else {
        setResult({
          success: false,
          error: response.error || 'Не удалось обновить ранги лидерборда'
        });
      }
    } catch (error) {
      console.error('Error updating leaderboard ranks:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsRankUpdateLoading(false);
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
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" /> Лидерборд
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
                    {result.eventsCount && (
                      <span className="block mt-1">
                        Количество созданных событий: <strong>{result.eventsCount}</strong>
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Создать одно тестовое событие</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создает одно тестовое событие с базовыми параметрами. Используйте для быстрого тестирования.
                  </p>
                  <Button 
                    onClick={createTestEvents} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Создать тестовое событие
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Заполнить базу тестовыми событиями</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создает несколько разнообразных тестовых событий. Используйте для заполнения пустой базы данных.
                  </p>
                  <Button 
                    onClick={seedTestEvents} 
                    disabled={isSeedLoading}
                    className="w-full"
                    variant="secondary"
                  >
                    {isSeedLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Заполнение...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Заполнить базу тестовыми событиями
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Управление лидербордом
              </CardTitle>
              <CardDescription>
                Обновление рангов пользователей и другие операции с таблицей лидеров
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
                    {result.timestamp && (
                      <span className="block mt-1">
                        Время обновления: <strong>{new Date(result.timestamp).toLocaleString()}</strong>
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Обновить ранги лидерборда</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Пересчитывает ранги пользователей на основе их текущих очков и обновляет таблицы лидеров.
                  </p>
                  <Button 
                    onClick={updateLeaderboardRanks} 
                    disabled={isRankUpdateLoading}
                    className="w-full"
                  >
                    {isRankUpdateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обновление рангов...
                      </>
                    ) : (
                      <>
                        <BarChart className="mr-2 h-4 w-4" />
                        Обновить ранги лидерборда
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/10">
                  <h3 className="text-lg font-medium mb-2">Статистика лидерборда</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Последнее обновление:</span>
                      <span className="font-medium">
                        {result?.timestamp 
                          ? new Date(result.timestamp).toLocaleString() 
                          : 'Неизвестно'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Ранги лидерборда обновляются автоматически при размещении ставок, но глобальное обновление 
                      позволяет синхронизировать все таблицы рейтингов.</p>
                      <p className="mt-2">Рекомендуется выполнять обновление:</p>
                      <ul className="list-disc ml-5 mt-1">
                        <li>В начале нового месяца</li>
                        <li>После массового обновления данных</li>
                        <li>При несоответствиях в таблице лидеров</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}