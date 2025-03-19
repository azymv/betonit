'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AdminAuthProps {
  onAuthenticated: () => void;
}

// Схема для валидации формы
const formSchema = z.object({
  password: z.string().min(1, { message: 'Пароль обязателен' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Инициализация формы с помощью react-hook-form и zod валидацией
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Проверка через переменную окружения
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (adminPassword && values.password === adminPassword) {
        // Успешная аутентификация
        onAuthenticated();
        return;
      }
      
      // Если пароль не совпадает с переменной окружения, пробуем аутентифицировать через Supabase
      // Используем специальный email для админа
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@betonit.app';
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: values.password,
      });

      if (signInError) {
        throw new Error('Неверный пароль');
      }
      
      // Проверяем, есть ли у пользователя права администратора
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin = session?.user?.app_metadata?.role === 'admin';
      
      if (!isAdmin) {
        throw new Error('У вас нет прав администратора');
      }
      
      // Если всё проверки пройдены, считаем аутентификацию успешной
      onAuthenticated();
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка аутентификации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Вход в панель администратора
          </CardTitle>
          <CardDescription>
            Для доступа к админ-панели введите пароль администратора
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль администратора</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Введите пароль" 
                        autoComplete="off"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Войти в панель администратора'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 