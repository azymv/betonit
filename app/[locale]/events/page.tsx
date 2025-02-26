"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EventsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  
  // Тестовые события для отображения
  const events = [
    {
      id: "1",
      title: "Будет ли Bitcoin выше $100k к концу года?",
      shortDescription: "Сделайте ставку на будущую стоимость Bitcoin",
      category: "Криптовалюты",
      image: "/images/events/placeholder.jpg",
      yesProbability: 65,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    },
    {
      id: "2",
      title: "Кто победит на выборах?",
      shortDescription: "Предсказывайте политические события",
      category: "Политика",
      image: "/images/events/placeholder.jpg",
      yesProbability: 48,
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 дней
    },
    {
      id: "3",
      title: "Будет ли запущена колонизация Марса в этом году?",
      shortDescription: "Космические события и запуски",
      category: "Наука",
      image: "/images/events/placeholder.jpg",
      yesProbability: 15,
      endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 дней
    },
    {
      id: "4",
      title: "Выйдет ли новая версия iOS до конца квартала?",
      shortDescription: "Технологические события и релизы",
      category: "Технологии",
      image: "/images/events/placeholder.jpg",
      yesProbability: 82,
      endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // +45 дней
    },
    {
      id: "5",
      title: "Превысит ли цена на нефть $100 за баррель?",
      shortDescription: "Экономические предсказания",
      category: "Экономика",
      image: "/images/events/placeholder.jpg",
      yesProbability: 37,
      endTime: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // +75 дней
    },
    {
      id: "6",
      title: "Будет ли лето 2025 самым жарким за всю историю?",
      shortDescription: "Климатические прогнозы",
      category: "Климат",
      image: "/images/events/placeholder.jpg",
      yesProbability: 59,
      endTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // +120 дней
    },
  ];

  // Получаем уникальные категории для фильтра
  const categories = Array.from(new Set(events.map(event => event.category)));

  // Форматирование даты
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">События</h1>
      
      {/* Фильтры */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Категории</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full">
            Все
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Список событий */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-40 w-full bg-slate-200">
              {/* Здесь будет изображение события */}
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                {event.category}
              </div>
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
  );
}