'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { EventStatus } from '@/lib/types/event';
import { createEvent } from '@/lib/actions/seed-events';
import { sanitizeFormData } from '@/lib/utils/sanitize';

// Схема для валидации формы
const formSchema = z.object({
  title: z.string().min(5, { message: 'Заголовок должен содержать минимум 5 символов' }),
  description: z.string().min(20, { message: 'Описание должно содержать минимум 20 символов' }),
  short_description: z.string().min(10, { message: 'Краткое описание должно содержать минимум 10 символов' }),
  image_url: z.string().url({ message: 'Введите корректный URL изображения' }).or(z.string().length(0)),
  category: z.string().min(1, { message: 'Выберите категорию' }),
  start_time: z.string().min(1, { message: 'Выберите дату и время начала' }),
  end_time: z.string().min(1, { message: 'Выберите дату и время окончания' }),
  status: z.enum(['upcoming', 'active', 'resolved', 'cancelled'] as const, {
    message: 'Выберите статус события',
  }),
});

// Категории событий
const categories = [
  { value: 'cryptocurrency', label: 'Криптовалюта' },
  { value: 'politics', label: 'Политика' },
  { value: 'economy', label: 'Экономика' },
  { value: 'technology', label: 'Технологии' },
  { value: 'science', label: 'Наука' },
  { value: 'sports', label: 'Спорт' },
  { value: 'entertainment', label: 'Развлечения' },
  { value: 'other', label: 'Другое' },
];

// Статусы событий
const statuses = [
  { value: 'upcoming', label: 'Предстоящее' },
  { value: 'active', label: 'Активное' },
  { value: 'resolved', label: 'Завершенное' },
  { value: 'cancelled', label: 'Отмененное' },
];

export function EventForm() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    imageUrl: '',
    maxParticipants: 0,
    entryFee: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(formData);

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.eventCreationError'));
      }

      router.push('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.eventCreationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создание нового события</CardTitle>
      </CardHeader>
      <CardContent>
        <Form>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заголовок</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите заголовок события" {...field} />
                  </FormControl>
                  <FormDescription>
                    Короткий и ясный заголовок, описывающий суть события
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Краткое описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите краткое описание" {...field} />
                  </FormControl>
                  <FormDescription>
                    Краткое описание для предпросмотра события в списке
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Введите полное описание события" 
                      rows={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Детальное описание события, которое будет отображаться на странице деталей
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL изображения</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите URL изображения" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL изображения для события. Оставьте пустым для использования изображения по умолчанию.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата и время начала</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата и время окончания</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание события...
                </>
              ) : (
                'Создать событие'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}