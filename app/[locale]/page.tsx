'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-config";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { useAuth } from "@/lib/context/auth-context";
import { useEffect, useState, useRef } from "react";

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const { user } = useAuth();
  
  // Состояние для параллакс-эффекта
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const coinsRef = useRef<HTMLDivElement>(null);
  const gatesRef = useRef<HTMLDivElement>(null);
  
  // Обработчик движения мыши для параллакс-эффекта
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Вычисляем положение мыши относительно центра экрана
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // Смещение по X
      const y = (e.clientY / window.innerHeight - 0.5) * 20; // Смещение по Y
      
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Применяем параллакс-эффект к изображениям
  useEffect(() => {
    if (coinsRef.current) {
      coinsRef.current.style.transform = `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)`;
    }
    
    if (gatesRef.current) {
      gatesRef.current.style.transform = `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)`;
    }
  }, [mousePosition]);

  const featuredEvents = [
    {
      id: "1",
      title: locale === 'en' ? "Will Bitcoin exceed $100k by the end of the year?" : "Будет ли Bitcoin выше $100k к концу года?",
      shortDescription: locale === 'en' ? "Make a bet on the future price of Bitcoin" : "Сделайте ставку на будущую стоимость Bitcoin",
      image: "/images/events/event_placeholder.png",
      yesProbability: 65,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      title: locale === 'en' ? "Who will win the elections?" : "Кто победит на выборах?",
      shortDescription: locale === 'en' ? "Predict political events" : "Предсказывайте политические события",
      image: "/images/events/event_placeholder.png",
      yesProbability: 48,
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      title: locale === 'en' ? "Will Mars colonization begin this year?" : "Будет ли запущена колонизация Марса в этом году?",
      shortDescription: locale === 'en' ? "Space events and launches" : "Космические события и запуски",
      image: "/images/events/event_placeholder.png",
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
      <section 
        className="hero-section text-white py-32 relative overflow-hidden"
      >
        {/* Видео фон */}
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay 
          muted 
          loop 
          playsInline
          style={{
            objectPosition: "center 20%"
          }}
        >
          <source src="/videos/wave.mp4" type="video/mp4" />
        </video>
        
        {/* Затемнение для лучшей читаемости текста */}
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Слой с изображением монет для авторизованных пользователей */}
        {user && (
          <div 
            className="absolute inset-0 z-[1] flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.35)"
            }}
          >
            <div
              ref={coinsRef}
              className="w-[95%] max-w-[1000px] h-[95%] max-h-[800px] transition-transform duration-200 ease-out"
              style={{
                backgroundImage: "url('/images/ui/coins.png')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            ></div>
          </div>
        )}
        
        {/* Слой с изображением ворот для неавторизованных пользователей */}
        {!user && (
          <div 
            className="absolute inset-0 z-[1] flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)"
            }}
          >
            <div
              ref={gatesRef}
              className="w-[95%] max-w-[1000px] h-[95%] max-h-[800px] relative transition-transform duration-200 ease-out"
              style={{
                backgroundImage: "url('/images/ui/gates.png')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {/* Дополнительное затемнение для изображения ворот */}
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 text-center relative z-20">
          <h1 className="text-4xl md:text-5xl font-normal mb-6">
            {user ? (locale === 'en' ? "The journey begins." : "Твой путь начинается здесь.") : t('home.title')}
          </h1>
          {!user && (
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          )}
          {user ? (
            <Link href={`/${locale}/events`}>
              <RainbowButton>
                {locale === 'en' ? 'Make a prediction' : 'Сделать предсказание'}
              </RainbowButton>
            </Link>
          ) : (
            <Link href={`/${locale}/auth/signup`}>
              <RainbowButton>
                {t('home.cta')}
              </RainbowButton>
            </Link>
          )}
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

      {/* Как это работает - только для неавторизованных пользователей */}
      {!user && (
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
      )}

      {/* Видео секция - только для неавторизованных пользователей */}
      {!user && (
        <section className="relative h-[500px] overflow-hidden hero-section"
          style={{
            backgroundImage: user ? "url('/images/ui/hero2.jpg')" : "url('/images/ui/hero3.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            backgroundRepeat: "no-repeat"
          }}
        >
          {/* Минимальное затемнение для лучшей читаемости текста */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          
          {/* Контент */}
          <div className="container mx-auto px-4 h-full flex flex-col items-center justify-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-normal mb-8 text-white text-center">
              {locale === 'en' ? 'Join a new generation of investors.' : 'Присоединяйся к новому поколению инвесторов.'}
            </h1>
            
            <Link href={`/${locale}/auth/signup`}>
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-black font-medium px-8 py-6 text-lg"
              >
                {locale === 'en' ? 'Sign up now' : 'Пройти регистрацию'}
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}