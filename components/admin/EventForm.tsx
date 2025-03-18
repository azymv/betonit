'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const router = useRouter();

  // Инициализация формы с хуком useForm
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      short_description: '',
      image_url: '/images/events/event_placeholder.png', // Значение по умолчанию
      category: '',
      start_time: new Date().toISOString().slice(0, 16), // Текущая дата в формате YYYY-MM-DDTHH:MM
      end_time: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 16), // +30 дней
      status: 'active' as EventStatus,
    },
  });

  // Обработчик отправки формы
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await createEvent(values);
      
      if (response.success) {
        setResult({ 
          success: true, 
          message: 'Событие успешно создано!' 
        });
        form.reset(); // Сбрасываем форму после успешного создания
        router.refresh(); // Обновляем страницу для отображения нового события
      } else {
        setResult({ 
          success: false, 
          error: response.error || 'Не удалось создать событие' 
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создание нового события</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {result && (
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {result.success ? result.message : result.error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
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