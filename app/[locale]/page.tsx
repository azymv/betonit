'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-config";

export default function HomePage() {
  // Получаем параметры маршрута, включая локаль
  const params = useParams();
  const locale = params.locale as string;
  
  // Используем хук локализации для получения функции перевода
  const { t } = useTranslation(locale);
  
  // Тестовые события для отображения на главной странице
  const featuredEvents = [
    {
      id: "1",
      title: locale === 'en' ? 
        "Will Bitcoin exceed $100k by the end of the year?" : 
        "Будет ли Bitcoin выше $100k к концу года?",
      shortDescription: locale === 'en' ? 
        "Make a bet on the future price of Bitcoin" : 
        "Сделайте ставку на будущую стоимость Bitcoin",
      image: "/images/events/placeholder.jpg",
      yesProbability: 65,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    },
    {
      id: "2",
      title: locale === 'en' ? 
        "Who will win the elections?" : 
        "Кто победит на выборах?",
      shortDescription: locale === 'en' ? 
        "Predict political events" : 
        "Предсказывайте политические события",
      image: "/images/events/placeholder.jpg",
      yesProbability: 48,
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 дней
    },
    {
      id: "3",
      title: locale === 'en' ? 
        "Will Mars colonization begin this year?" : 
        "Будет ли запущена колонизация Марса в этом году?",
      shortDescription: locale === 'en' ? 
        "Space events and launches" : 
        "Космические события и запуски",
      image: "/images/events/placeholder.jpg",
      yesProbability: 15,
      endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 дней
    },
  ];

  // Форматирование даты в соответствии с выбранной локалью
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Hero секция */}
      <section className="hero-section bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-normal mb-6">
            {t('home.title')}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" size="lg" asChild>
            <Link href={`/${locale}/auth/signup`}>
              {t('home.cta')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Популярные события */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">{t('home.featuredEvents')}</h2>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/events`}>
                {t('home.allEvents')}
              </Link>
            </Button>
          </div>


<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {featuredEvents.map((event) => (
    <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
      <div className="relative h-40 w-full bg-slate-200">
        {/* Здесь будет изображение события */}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {event.shortDescription}
        </p>
        <div className="flex justify-between text-sm mb-2">
          <span>
            {locale === 'en' ? 'Yes probability:' : 'Вероятность Да:'} {event.yesProbability}%
          </span>
          <span>
            {locale === 'en' ? 'Until:' : 'До:'} {formatDate(event.endTime)}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${event.yesProbability}%` }}
          />
        </div>
        <div className="mt-4">
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
            <Link href={`/${locale}/events/${event.id}`}>
              {locale === 'en' ? 'Details' : 'Подробнее'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
        </div>
      </section>

      {/* Как это работает */}
<section className="py-16">
  <div className="container mx-auto px-4">
    <h2 className="text-2xl font-bold mb-8 text-center">{t('home.howItWorks')}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center">
        <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
        <h3 className="text-xl font-semibold mb-2">{t('home.step1_title')}</h3>
        <p className="text-muted-foreground">
          {t('home.step1_description')}
        </p>
      </div>
      <div className="text-center">
        <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
        <h3 className="text-xl font-semibold mb-2">{t('home.step2_title')}</h3>
        <p className="text-muted-foreground">
          {t('home.step2_description')}
        </p>
      </div>
      <div className="text-center">
        <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
        <h3 className="text-xl font-semibold mb-2">{t('home.step3_title')}</h3>
        <p className="text-muted-foreground">
          {t('home.step3_description')}
        </p>
      </div>
    </div>
  </div>
</section>
    </div>
  );
}