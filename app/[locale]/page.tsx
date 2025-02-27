'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-config";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { HowItWorksSection } from "@/components/sections/how-it-works";

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);

  const featuredEvents = [
    {
      id: "1",
      title: locale === 'en' ? "Will Bitcoin exceed $100k by the end of the year?" : "Будет ли Bitcoin выше $100k к концу года?",
      shortDescription: locale === 'en' ? "Make a bet on the future price of Bitcoin" : "Сделайте ставку на будущую стоимость Bitcoin",
      image: "/images/events/placeholder.jpg",
      yesProbability: 65,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      title: locale === 'en' ? "Who will win the elections?" : "Кто победит на выборах?",
      shortDescription: locale === 'en' ? "Predict political events" : "Предсказывайте политические события",
      image: "/images/events/placeholder.jpg",
      yesProbability: 48,
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      title: locale === 'en' ? "Will Mars colonization begin this year?" : "Будет ли запущена колонизация Марса в этом году?",
      shortDescription: locale === 'en' ? "Space events and launches" : "Космические события и запуски",
      image: "/images/events/placeholder.jpg",
      yesProbability: 15,
      endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  ];

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ru", options);
    return formatter.format(date);
  };

  return (
    <div>
      {/* Hero секция */}
      <section className="hero-section bg-gradient-to-r from-primary to-primary/80 text-white py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-normal mb-6">
            {t('home.title')}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <Link href={`/${locale}/auth/signup`}>
            <RainbowButton>
              {t('home.cta')}
            </RainbowButton>
          </Link>
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
      <HowItWorksSection 
        title={t('home.howItWorks')}
        steps={[
          {
            number: 1,
            title: t('home.step1_title'),
            description: t('home.step1_description')
          },
          {
            number: 2,
            title: t('home.step2_title'),
            description: t('home.step2_description')
          },
          {
            number: 3,
            title: t('home.step3_title'),
            description: t('home.step3_description')
          }
        ]}
      />
    </div>
  );
}