"use client";

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const metadata = {
  title: 'Sign Up - BetOnIt',
  description: 'Create your BetOnIt account',
};

export default function SignUpPage(props) {
  const locale = props.params?.locale || 'en';
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username } // Store username in user metadata
        }
      });
      
      if (error) throw error;
      
      window.location.href = `/${locale}/auth/verify`;
    } catch (err) {
      setError("Ошибка при регистрации. Пожалуйста, попробуйте еще раз.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4 py-16">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Создать аккаунт</CardTitle>
          <CardDescription>
            Введите ваши данные для регистрации
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
              <label htmlFor="username" className="text-sm font-medium">
                Имя пользователя
              </label>
              <Input
                id="username"
                type="text"
                placeholder="username123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Минимум 3 символа, без пробелов и специальных символов
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Подтвердите пароль
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Регистрируясь, вы соглашаетесь с нашими{" "}
              <Link
                href={`/${locale}/terms`}
                className="text-blue-600 hover:underline"
              >
                Условиями использования
              </Link>{" "}
              и{" "}
              <Link
                href={`/${locale}/privacy`}
                className="text-blue-600 hover:underline"
              >
                Политикой конфиденциальности
              </Link>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href={`/${locale}/auth/signin`}
              className="text-blue-600 hover:underline"
            >
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}