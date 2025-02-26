"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function EventPage({ 
  params 
}: { 
  params: { locale: string; eventId: string } 
}) {
  const { locale, eventId } = params;
  
  // Тестовое событие для отображения (в реальном приложении мы бы получили данные из базы)
  const event = {
    id: eventId,
    title: "Будет ли Bitcoin выше $100k к концу года?",
    description: "Криптовалюта Bitcoin продолжает оставаться одним из самых волатильных активов на рынке. Последние годы показали значительные колебания курса, и многие аналитики предсказывают новый рекордный пик в этом году. Вопрос в том, преодолеет ли курс психологическую отметку в $100,000 до 31 декабря 2025 года по данным CoinMarketCap.",
    shortDescription: "Сделайте ставку на будущую стоимость Bitcoin",
    category: "Криптовалюты",
    image: "/images/events/placeholder.jpg",
    yesProbability: 65,
    noProbability: 35,
    yesAmount: 6500,
    noAmount: 3500,
    startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // -15 дней
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    status: "active", // upcoming, active, resolved, cancelled
  };

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
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {event.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="bg-slate-200 h-56 w-full rounded-lg mb-6">
            {/* Здесь будет изображение события */}
          </div>
          
          <div className="prose max-w-none mb-8">
            <p>{event.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Детали события</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Начало</p>
                <p className="font-medium">{formatDate(event.startTime)}</p>
              </div>
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Окончание</p>
                <p className="font-medium">{formatDate(event.endTime)}</p>
              </div>
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Статус</p>
                <p className="font-medium capitalize">{event.status}</p>
              </div>
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Всего поставлено</p>
                <p className="font-medium">{event.yesAmount + event.noAmount} монет</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Сделать ставку</h2>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Да: {event.yesProbability}%</span>
                  <span>Нет: {event.noProbability}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${event.yesProbability}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full h-16 text-lg" asChild>
                  <Link href={`/${locale}/events/${eventId}/bet?prediction=yes`}>
                    Да ({event.yesProbability}%)
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full h-16 text-lg" asChild>
                  <Link href={`/${locale}/events/${eventId}/bet?prediction=no`}>
                    Нет ({event.noProbability}%)
                  </Link>
                </Button>
              </div>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Коэффициент: x2.0</p>
                <p>Минимальная ставка: 10 монет</p>
                <p>Максимальная ставка: 1000 монет</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}