"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError("");
    
    try {
      // Здесь будет логика авторизации с Supabase
      console.log("Авторизация с email:", email);
      
      // Симуляция загрузки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Временная заглушка - перенаправление на главную
      window.location.href = `/${locale}`;
    } catch (err) {
      setError("Ошибка при входе. Пожалуйста, проверьте ваши данные.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4 py-16">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Вход в аккаунт</CardTitle>
          <CardDescription>
            Введите ваш email и пароль для входа
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
                Email
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
                  Пароль
                </label>
                <Link
                  href={`/${locale}/auth/reset-password`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Забыли пароль?
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
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Еще нет аккаунта?{" "}
            <Link
              href={`/${locale}/auth/signup`}
              className="text-blue-600 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}