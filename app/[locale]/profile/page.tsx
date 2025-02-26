"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  
  // Тестовые данные пользователя
  const user = {
    id: "1",
    username: "user123",
    email: "user@example.com",
    avatarUrl: null,
    joinedAt: new Date("2024-01-15"),
    language: "ru",
    balance: 500,
    totalBets: 12,
    wonBets: 8,
    lostBets: 4,
  };
  
  // Тестовые данные последних ставок
  const recentBets = [
    {
      id: "1",
      eventTitle: "Будет ли Bitcoin выше $100k к концу года?",
      prediction: true, // Да
      amount: 50,
      status: "active",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 дня назад
    },
    {
      id: "2",
      eventTitle: "Кто победит на выборах?",
      prediction: false, // Нет
      amount: 100,
      status: "won",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 дней назад
    },
    {
      id: "3",
      eventTitle: "Выйдет ли новая версия iOS до конца квартала?",
      prediction: true, // Да
      amount: 75,
      status: "lost",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 дней назад
    },
  ];
  
  // Форматирование даты
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  
  // Перевод статуса ставки
  const betStatusTranslation: Record<string, string> = {
    pending: "В ожидании",
    active: "Активна",
    won: "Выиграна",
    lost: "Проиграна",
    cancelled: "Отменена",
  };
  
  // Цвет статуса ставки
  const betStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Профиль</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основная информация о пользователе */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Профиль</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/profile/settings`}>
                  Настройки
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 text-xl font-semibold">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user.username}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Дата регистрации: {formatDate(user.joinedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Баланс пользователя */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Баланс</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/profile/balance`}>
                  Управление
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-1">Текущий баланс</p>
                <p className="text-3xl font-bold">{user.balance} <span className="text-muted-foreground text-base font-normal">монет</span></p>
              </div>
            </CardContent>
          </Card>
          
          {/* Статистика ставок */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{user.totalBets}</p>
                  <p className="text-sm text-muted-foreground">Всего ставок</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{user.wonBets}</p>
                  <p className="text-sm text-muted-foreground">Побед</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{user.lostBets}</p>
                  <p className="text-sm text-muted-foreground">Поражений</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Точность прогнозов</p>
                <div className="w-full bg-slate-200 h-2 rounded-full">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(user.wonBets / user.totalBets) * 100}%` }}
                  />
                </div>
                <p className="text-sm mt-1">
                  {Math.round((user.wonBets / user.totalBets) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Правая колонка - Последние ставки и другая информация */}
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Последние ставки</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/profile/bets`}>
                  Все ставки
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentBets.length > 0 ? (
                <div className="space-y-4">
                  {recentBets.map((bet) => (
                    <div key={bet.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{bet.eventTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(bet.createdAt)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${betStatusColors[bet.status]}`}>
                          {betStatusTranslation[bet.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span>
                          {bet.prediction ? "Да" : "Нет"} • {bet.amount} монет
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${locale}/events/${bet.id}`}>
                            Подробнее
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">У вас пока нет ставок</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/${locale}/events`}>
                      Начать делать ставки
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Реферальная программа */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Пригласите друзей</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${locale}/referral`}>
                  Подробнее
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Реферальная программа</h3>
                <p className="text-sm mb-4">
                  Пригласите друзей и получите 100 монет за каждого зарегистрировавшегося пользователя. 
                  Ваш друг также получит 50 бонусных монет при регистрации.
                </p>
                <Button className="w-full">
                  Получить реферальную ссылку
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}