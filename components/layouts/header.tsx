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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation, locales } from "@/lib/i18n-config";
import { Home, Trophy, Calendar, LogOut, ChevronDown, Menu, Globe, Coins, Play } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/types/supabase";

export function Header({ locale }: { locale: string }) {
  const { t } = useTranslation(locale);
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();

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
      name: t("nav.play"),
      url: `/${locale}/play`,
      icon: Play,
    },
    {
      name: t("nav.leaderboard"),
      url: `/${locale}/leaderboard`,
      icon: Trophy,
    },
  ];

  // Функция для загрузки баланса пользователя
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user || isLoading) return;
      
      setIsBalanceLoading(true);
      try {
        const { data, error } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .eq('currency', 'coins')
          .single();
        
        if (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        } else {
          setBalance(data?.amount || 0);
        }
      } catch (err) {
        console.error('Exception fetching balance:', err);
        setBalance(null);
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchUserBalance();
  }, [user, isLoading, supabase]);

  // Функция для форматирования числа с разделителями
  const formatNumber = (num: number | null) => {
    if (num === null) return "0";
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU').format(num);
  };

  // Функция для смены языка с сохранением текущего пути
  const getLocalePath = (newLocale: string) => {
    // Удаляем текущую локаль из пути и добавляем новую
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return `/${newLocale}${pathWithoutLocale}`;
  };

  // Обработчик выхода
  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  // Закрыть мобильное меню при переходе
  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`bg-black text-white fixed top-0 left-0 right-0 z-50 ${user ? 'shadow-none' : ''}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Логотип и десктопная навигация */}
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

        {/* Центральная кнопка Sign Up для мобильной версии - убираем */}
        <div className="md:hidden flex-1">
          {/* Пустой div для сохранения flex-структуры */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Имя пользователя для мобильной версии */}
          {!isLoading && user && (
            <Link 
              href={`/${locale}/profile`}
              className="md:hidden flex items-center space-x-2 text-white"
              onClick={handleNavigation}
            >
              <span className="text-sm font-medium truncate max-w-[100px]">
                {user.user_metadata?.username || user.email?.split('@')[0] || "User"}
              </span>
            </Link>
          )}

          {/* Sign Up кнопка для мобильной версии */}
          {!isLoading && !user && (
            <Button className="md:hidden bg-secondary text-black hover:bg-primary hover:text-white" asChild>
              <Link href={`/${locale}/auth/signup`}>
                {t("nav.signup")}
              </Link>
            </Button>
          )}

          {/* Переключатель языка - только для десктопа */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:text-secondary hover:bg-transparent">
                  <Globe className="h-4 w-4 mr-1" />
                  {locale === "en" ? "EN" : "RU"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                {locales.map((l) => (
                  <DropdownMenuItem key={l} asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                    <Link href={getLocalePath(l)}>
                      {l === "en" ? "EN" : "RU"}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            // Показываем заглушку во время загрузки
            <div className="h-9 w-20 bg-gray-700 animate-pulse rounded" />
          ) : (
            <>
              {/* Десктопное меню пользователя */}
              <div className="hidden md:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 hover:text-secondary rounded-md px-2 py-1">
                        <span className="text-sm font-medium">
                          {user.user_metadata?.username || user.email?.split('@')[0] || "User"}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                      <DropdownMenuItem asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                        <Link href={`/${locale}/profile`}>
                          <Avatar className="h-4 w-4 mr-2">
                            <AvatarFallback className="bg-gray-700 text-white text-xs">
                              {user.user_metadata?.username 
                                ? user.user_metadata.username[0].toUpperCase() 
                                : user.email ? user.email[0].toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                          {t("nav.profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-gray-800 hover:text-primary focus:text-primary">
                        <Link href={`/${locale}/profile`}>
                          <Coins className="h-4 w-4 mr-2 text-yellow-400" />
                          <span>Balance: {isBalanceLoading ? 
                            <span className="inline-block w-10 h-4 bg-gray-700 animate-pulse rounded ml-1"></span> : 
                            formatNumber(balance)}
                          </span>
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
                  // Кнопки входа и регистрации для десктопа
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

              {/* Бургер-меню для мобильной версии */}
              <div className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:text-secondary hover:bg-transparent"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </Button>

                {/* Мобильное меню */}
                {isMobileMenuOpen && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-90" onClick={() => setIsMobileMenuOpen(false)}>
                    <div 
                      className="absolute right-0 top-0 h-full w-2/3 max-w-xs bg-gray-900 p-4 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex justify-end mb-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:text-secondary hover:bg-transparent"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-2xl">&times;</span>
                          </Button>
                        </div>

                        {/* Переключатель языка в мобильном меню */}
                        <div className="mb-6 flex justify-center">
                          {locales.map((l) => (
                            <Link 
                              key={l} 
                              href={getLocalePath(l)}
                              className={`px-4 py-2 rounded-md ${locale === l ? 'bg-gray-800 text-white' : 'text-gray-300'}`}
                              onClick={handleNavigation}
                            >
                              {l === "en" ? "EN" : "RU"}
                            </Link>
                          ))}
                        </div>

                        {/* Навигационные ссылки в мобильном меню */}
                        <div className="space-y-4 mb-6">
                          {navItems.map((item) => {
                            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                            return (
                              <Link 
                                key={item.url} 
                                href={item.url}
                                className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                                  isActive 
                                    ? 'bg-gray-800 text-white' 
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                                onClick={handleNavigation}
                              >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Профиль пользователя в мобильном меню */}
                        {user ? (
                          <div className="space-y-4 mb-6">
                            <Link 
                              href={`/${locale}/profile`}
                              className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
                              onClick={handleNavigation}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                  {user.user_metadata?.username 
                                    ? user.user_metadata.username[0].toUpperCase() 
                                    : user.email ? user.email[0].toUpperCase() : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{t("nav.profile")}</span>
                            </Link>
                            <div className="flex items-center space-x-3 p-2 rounded-md text-gray-300">
                              <Coins className="h-5 w-5 text-yellow-400" />
                              <Link 
                                href={`/${locale}/profile`}
                                className="text-gray-300 hover:text-white"
                                onClick={handleNavigation}
                              >
                                {isBalanceLoading ? 
                                  <span className="inline-block w-16 h-5 bg-gray-700 animate-pulse rounded"></span> : 
                                  formatNumber(balance)
                                }
                              </Link>
                            </div>
                            <button 
                              onClick={handleSignOut}
                              className="flex items-center space-x-3 p-2 rounded-md text-red-400 hover:bg-gray-800 hover:text-red-300 w-full text-left"
                            >
                              <LogOut className="h-5 w-5" />
                              <span>{t("nav.signout")}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 mb-6">
                            <Link 
                              href={`/${locale}/auth/signin`}
                              className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
                              onClick={handleNavigation}
                            >
                              <span>{t("nav.signin")}</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}