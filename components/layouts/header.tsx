"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation, locales } from "@/lib/i18n-config";

// Определяем тип для пользователя
interface User {
  id: string;
  username?: string; // Опциональные свойства
  avatar_url?: string;
  email: string;
}

// Заглушка для аутентификации с правильной типизацией
const useAuth = () => {
  return {
    user: null as User | null, // Явно указываем тип
    signOut: async () => {
      console.log("Sign out");
    },
  };
};

export function Header({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Функция для смены языка с сохранением текущего пути
  const getLocalePath = (newLocale: string) => {
    // Удаляем текущую локаль из пути и добавляем новую
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={`/${locale}`} className="text-xl font-bold mr-8">
            BetOnIt
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href={`/${locale}`} className="hover:text-primary">
              {t("nav.home")}
            </Link>
            <Link href={`/${locale}/events`} className="hover:text-primary">
              {t("nav.events")}
            </Link>
            <Link href={`/${locale}/leaderboard`} className="hover:text-primary">
              {t("nav.leaderboard")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Переключатель языка */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {locale === "en" ? "🇺🇸 EN" : "🇷🇺 RU"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((l) => (
                <DropdownMenuItem key={l} asChild>
                  <Link href={getLocalePath(l)}>
                    {l === "en" ? "🇺🇸 English" : "🇷🇺 Русский"}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            // Аватар пользователя
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user.avatar_url || ""} alt={user.username || "User"} />
                  <AvatarFallback>
                    {user.username ? user.username[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`}>
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Кнопки входа и регистрации
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  {t("nav.signin")}
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/${locale}/auth/signup`}>
                  {t("nav.signup")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}