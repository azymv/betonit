"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-config";

export default function SignInPage() {
  // Получаем параметры из URL
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || `/${locale}`;
  
  // Настройка перевода (будет использоваться, когда добавим переводы в UI)
  const { t } = useTranslation(locale);
  
  // Состояние формы
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError("");
    
    try {
      // Здесь будет логика авторизации с Supabase
      console.log("Авторизация с email:", email);
      
      // Пример кода для Supabase (раскомментируйте и адаптируйте при интеграции)
      /*
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      */
      
      // Симуляция загрузки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Перенаправление после успешного входа
      router.push(redirectTo);
    } catch (err: unknown) {
      // Исправляем any на unknown и делаем безопасное преобразование
      const errorMessage = err instanceof Error ? err.message : "Ошибка при входе. Пожалуйста, проверьте ваши данные.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4 py-16">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {t('auth.signin.title') || 'Вход в аккаунт'}
          </CardTitle>
          <CardDescription>
            {t('auth.signin.description') || 'Введите ваш email и пароль для входа'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auth.signin.email') || 'Email'}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  {t('auth.signin.password') || 'Пароль'}
                </label>
                <Link
                  href={`/${locale}/auth/reset-password`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('auth.signin.forgotPassword') || 'Забыли пароль?'}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (t('auth.signin.loading') || 'Вход...') 
                : (t('auth.signin.submit') || 'Войти')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            {t('auth.signin.noAccount') || 'Еще нет аккаунта?'}{" "}
            <Link
              href={`/${locale}/auth/signup`}
              className="text-blue-600 hover:underline"
            >
              {t('auth.signin.signup') || 'Зарегистрироваться'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}