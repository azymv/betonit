"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation, locales } from "@/lib/i18n-config";
import { Home, Trophy, Calendar, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export function Header({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = [
    {
      name: t("nav.home"),
      url: `/${locale}`,
      icon: Home,
    },
    {
      name: t("nav.events"),
      url: `/${locale}/events`,
      icon: Calendar,
    },
    {
      name: t("nav.leaderboard"),
      url: `/${locale}/leaderboard`,
      icon: Trophy,
    },
  ];

  // Функция для смены языка с сохранением текущего пути
  const getLocalePath = (newLocale: string) => {
    // Удаляем текущую локаль из пути и добавляем новую
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return `/${newLocale}${pathWithoutLocale}`;
  };

  // Обработчик выхода
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-black text-white fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={`/${locale}`} className="text-xl font-bold text-white mr-6">
            BetOnIt
          </Link>

          {/* Десктопная навигация - только текст */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link 
                  key={item.url} 
                  href={item.url}
                  className={`flex items-center py-1 px-2 rounded-md transition-colors ${
                    isActive 
                      ? 'text-white font-medium hover:text-secondary' 
                      : 'text-gray-300 hover:text-secondary'
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Мобильная навигация - только иконки */}
          <nav className="flex md:hidden items-center space-x-3 mr-2">
            {navItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link 
                  key={item.url} 
                  href={item.url}
                  className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
                    isActive 
                      ? 'text-white hover:text-secondary' 
                      : 'text-gray-300 hover:text-secondary'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
          
          {/* Переключатель языка */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:text-secondary hover:bg-transparent">
                {locale === "en" ? "🇺🇸 EN" : "🇷🇺 RU"}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
              {locales.map((l) => (
                <DropdownMenuItem key={l} asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                  <Link href={getLocalePath(l)}>
                    {l === "en" ? "🇺🇸 English" : "🇷🇺 Русский"}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoading ? (
            // Показываем заглушку во время загрузки
            <div className="h-9 w-20 bg-gray-700 animate-pulse rounded" />
          ) : user ? (
            // Аватар пользователя
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 hover:text-secondary rounded-md px-2 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || ""} 
                      alt={user.user_metadata?.username || "User"} 
                    />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {user.user_metadata?.username 
                        ? user.user_metadata.username[0].toUpperCase() 
                        : user.email ? user.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">
                    {user.user_metadata?.username || user.email?.split('@')[0] || "User"}
                  </span>
                  <span className="text-sm font-medium md:hidden">
                    {user.user_metadata?.username 
                      ? user.user_metadata.username[0].toUpperCase() 
                      : user.email ? user.email[0].toUpperCase() : "U"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                <DropdownMenuItem asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                  <Link href={`/${locale}/profile`}>
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                  <Link href={`/${locale}/profile/bets`}>
                    {t("profile.myBets")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                  <Link href={`/${locale}/profile/balance`}>
                    {t("profile.balance")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:bg-gray-800 hover:text-red-300 focus:text-red-300">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Кнопки входа и регистрации
            <div className="flex space-x-2">
              <Button variant="ghost" className="text-white hover:text-secondary hover:bg-transparent" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  {t("nav.signin")}
                </Link>
              </Button>
              <Button className="bg-secondary text-black hover:bg-primary hover:text-white" asChild>
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