'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Event } from '@/lib/types/event';
import { deleteEvents } from '@/lib/actions/seed-events';

interface EventsListProps {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export default function EventsList({ showSuccess, showError }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  // Загрузка списка событий
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Обработка выбора события
  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Выбор всех событий
  const handleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(events.map(event => event.id));
    }
  };

  // Удаление выбранных событий
  const handleDeleteEvents = async () => {
    if (selectedEvents.length === 0) {
      showError('Не выбрано ни одного события для удаления');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedEvents.length} событий? 
ВНИМАНИЕ: Все ставки, связанные с этими событиями, также будут удалены!
Это действие нельзя отменить.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteEvents(selectedEvents);

      if (result.success) {
        // Формируем сообщение на русском языке
        let message = `Успешно удалено: ${selectedEvents.length} событий`;
        if (result.deletedBetsCount && result.deletedBetsCount > 0) {
          message += ` и ${result.deletedBetsCount} связанных ставок`;
        }
        
        showSuccess(message);
        setSelectedEvents([]);
        fetchEvents(); // Обновляем список после удаления
      } else {
        showError(result.error || 'Не удалось удалить события');
      }
    } catch (err) {
      console.error('Error deleting events:', err);
      showError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsDeleting(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Управление событиями</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
            title="Обновить список"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteEvents}
            disabled={selectedEvents.length === 0 || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Удалить {selectedEvents.length > 0 ? `(${selectedEvents.length})` : ''}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Ошибка загрузки</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-2 flex items-center">
          <Checkbox
            id="select-all"
            checked={events.length > 0 && selectedEvents.length === events.length}
            onCheckedChange={handleSelectAll}
            aria-label="Выбрать все события"
          />
          <label htmlFor="select-all" className="ml-2 text-sm cursor-pointer">
            Выбрать все
          </label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет доступных событий</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-2 p-3 border rounded-lg ${
                    selectedEvents.includes(event.id) ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => handleSelectEvent(event.id)}
                    aria-label={`Выбрать событие ${event.title}`}
                  />
                  <div className="grid gap-1 flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.short_description}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <div className="text-xs px-2 py-1 bg-slate-100 rounded">
                        Статус: <span className="font-medium">{event.status}</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-slate-100 rounded">
                        Создано: <span className="font-medium">{formatDate(event.created_at)}</span>
                      </div>
                      {event.end_time && (
                        <div className="text-xs px-2 py-1 bg-slate-100 rounded">
                          Закрытие: <span className="font-medium">{formatDate(event.end_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 