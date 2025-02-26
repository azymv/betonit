"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function Home({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  // Тестовые события для отображения
  const featuredEvents = [
    {
      id: "1",
      title: "Будет ли Bitcoin выше $100k к концу года?",
      shortDescription: "Сделайте ставку на будущую стоимость Bitcoin",
      image: "/images/events/placeholder.jpg",
      yesProbability: 65,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    },
    {
      id: "2",
      title: "Кто победит на выборах?",
      shortDescription: "Предсказывайте политические события",
      image: "/images/events/placeholder.jpg",
      yesProbability: 48,
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 дней
    },
    {
      id: "3",
      title: "Будет ли запущена колонизация Марса в этом году?",
      shortDescription: "Космические события и запуски",
      image: "/images/events/placeholder.jpg",
      yesProbability: 15,
      endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 дней
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

  // Остальной код компонента...
  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Предсказывайте. Побеждайте. Зарабатывайте.
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Делайте ставки на исходы событий и выигрывайте монеты. Присоединяйтесь сегодня и получите 100 бонусных монет!
          </p>
          <Button size="lg" asChild>
            <Link href={`/${locale}/auth/signup`}>
              Начать сейчас
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured events */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Популярные события</h2>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/events`}>
                Все события
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full bg-slate-200">
                  {/* Здесь будет изображение события */}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.shortDescription}
                  </p>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Вероятность Да: {event.yesProbability}%</span>
                    <span>До: {formatDate(event.endTime)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${event.yesProbability}%` }}
                    />
                  </div>
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link href={`/${locale}/events/${event.id}`}>
                        Подробнее
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Выберите событие</h3>
              <p className="text-muted-foreground">
                Выберите из множества событий в разных категориях - от политики до криптовалют
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Сделайте ставку</h3>
              <p className="text-muted-foreground">
                Поставьте монеты на выбранный исход события - Да или нет
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Получите выигрыш</h3>
              <p className="text-muted-foreground">
                Если ваш прогноз верен, получите выигрыш автоматически после разрешения события
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}