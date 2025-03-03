"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation, locales } from "@/lib/i18n-config";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Home, Trophy, Calendar, LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export function Header({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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
    try {
      await signOut();
      
      // После выхода обновляем страницу для сброса состояния
      router.refresh();
      router.push(`/${locale}`);
    } catch (e) {
      console.error("Exception during sign out handling:", e);
      
      // Даже при ошибке перенаправляем на главную
      router.push(`/${locale}`);
    }
  };

  return (
    <header className="border-b relative">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-xl font-bold z-10">
          BetOnIt
        </Link>

        <NavBar items={navItems} className="absolute left-1/2 -translate-x-1/2" />

        <div className="flex items-center space-x-4 z-10">
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

          {isLoading ? (
            // Показываем заглушку во время загрузки
            <div className="h-9 w-20 bg-slate-200 animate-pulse rounded" />
          ) : user ? (
            // Аватар пользователя
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url || ""} 
                    alt={user.user_metadata?.username || "User"} 
                  />
                  <AvatarFallback>
                    {user.user_metadata?.username 
                      ? user.user_metadata.username[0].toUpperCase() 
                      : user.email ? user.email[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`}>
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile/bets`}>
                    {t("profile.myBets")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile/balance`}>
                    {t("profile.balance")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Кнопки входа и регистрации
            <div className="flex space-x-2">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  {t("nav.signin")}
                </Link>
              </Button>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
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