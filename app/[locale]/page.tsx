'use client';

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-config";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useAuth } from "@/lib/context/auth-context";
import { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Event } from '@/lib/types/event';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const { user } = useAuth();
  
  // Состояние для хранения загруженных событий
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояние для параллакс-эффекта
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const coinsRef = useRef<HTMLDivElement>(null);
  const gatesRef = useRef<HTMLDivElement>(null);
  
  // Загрузка событий из базы данных
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setIsLoading(true);
      
      try {
        const supabase = createClientComponentClient<Database>({
          options: {
            global: {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          }
        });
        
        // Получаем три последних события, сортируя по дате создания (в обратном порядке)
        const { data, error: supabaseError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (supabaseError) {
          throw supabaseError;
        }
        
        if (data) {
          setFeaturedEvents(data as Event[]);
        }
      } catch (err) {
        console.error('Error fetching featured events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedEvents();
  }, []);
  
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

  // Получаем статистику ставок (фиксированные значения для демонстрации)
  const getEventStats = (event: Event) => {
    // Используем ID события для получения стабильного значения
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const yesProbability = (hash % 71) + 15; // Значение от 15 до 85
    
    return {
      yesProbability,
      noProbability: 100 - yesProbability
    };
  };

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ru", options);
    return formatter.format(dateObj);
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

      {/* Feature cards grid - только для неавторизованных пользователей */}
      {!user && (
        <div className="py-0">
          <div className="mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1600px] mx-auto border-2 border-[#be8eff] overflow-hidden">
              {/* Card 1 */}
              <div className="bg-[#291468] text-white p-12 relative min-h-[600px] flex flex-col border-r-2 border-b-2 border-[#be8eff]">
                <div>
                  <h2 className="text-[#a887fa] text-3xl mb-4">Profit</h2>
                  <h3 className="text-4xl font-bold mb-6">Turn Insights into Earnings</h3>
                  <p className="mb-12 text-lg">With BetOnIt, your predictions become a smart investment. Earn coins for accurate forecasts and exchange them for our exclusive token. It&apos;s a concise, rewarding way to profit from your insights.</p>
                </div>
                <div className="mt-auto flex justify-center">
                  <Image 
                    src="/images/ui/feature-cards/arc.png" 
                    alt="Earn Through Predictions" 
                    width={250}
                    height={250}
                    className="w-auto h-auto"
                    style={{ objectFit: 'contain' }}
                    quality={100}
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-black text-white p-12 relative min-h-[600px] flex flex-col border-b-2 border-[#be8eff]">
                <div>
                  <h2 className="text-[#be8eff] text-3xl mb-4">Ease</h2>
                  <h3 className="text-4xl font-bold mb-6">BetOnIt Play—Your Gateway to Quick Wins</h3>
                  <p className="mb-4 text-lg">BetOnIt Play makes predicting simple: swipe through events, choose &quot;Yes&quot; or &quot;No,&quot; and place your bet. No hassle, just you, your intuition, and a few seconds to decide. Dive in and start winning effortlessly.</p>
                </div>
                <div className="mt-auto flex justify-center">
                  <Image 
                    src="/images/ui/feature-cards/arrows.png" 
                    alt="Predict with Ease" 
                    width={300}
                    height={300}
                    className="max-w-[300px] max-h-[300px]"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-black text-white p-12 relative min-h-[600px] flex flex-col border-r-2 border-[#be8eff]">
                <div>
                  <h2 className="text-[#be8eff] text-3xl mb-4">Trust</h2>
                  <h3 className="text-4xl font-bold mb-6">Reliable Outcomes, Assured by Oracle Technology</h3>
                  <p className="mb-4 text-lg">Our Oracle technology ensures fairness and precision by sourcing data from verified providers. This guarantees transparent, trustworthy results you can rely on. Predict with confidence—your trust is well-placed.</p>
                </div>
                <div className="mt-auto flex justify-center">
                  <Image 
                    src="/images/ui/feature-cards/cells.png" 
                    alt="Built on Trust" 
                    width={250}
                    height={250}
                    className="w-auto h-auto"
                    style={{ objectFit: 'contain' }}
                    quality={100}
                  />
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#291468] text-white p-12 relative min-h-[600px] flex flex-col">
                <div>
                  <h2 className="text-[#be8eff] text-3xl mb-4">Challenge</h2>
                  <h3 className="text-4xl font-bold mb-6">Excel in Leaderboards and Tournaments</h3>
                  <p className="mb-4 text-lg">Prove your prediction skills on our leaderboard or compete in tournaments for exclusive rewards. BetOnIt offers you the chance to stand out and succeed—step up and claim your place among the best.</p>
                </div>
                <div className="mt-auto flex justify-center">
                  <Image 
                    src="/images/ui/feature-cards/figure.png" 
                    alt="Rise to the Challenge" 
                    width={300}
                    height={300}
                    className="max-w-[300px] max-h-[300px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Section - только для неавторизованных пользователей */}
      {!user && (
      <div className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-5xl font-normal mb-16">
              Predict with Ease. Earn crypto rewards.
            </h2>
            
            <div className="max-w-[800px] mx-auto">
              <div className="flex items-baseline mb-6">
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xl">Explore events in sports, politics, crypto, and more.</p>
                </div>
              </div>

              <div className="flex items-baseline mb-6">
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xl">Earn crypto rewards from your accurate predictions.</p>
                </div>
              </div>

              <div className="flex items-baseline mb-6">
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xl">Trust results powered by blockchain oracle tech.</p>
                </div>
              </div>

              <div className="flex items-baseline">
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xl">Use a simple, secure platform designed for you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Популярные события - только для авторизованных пользователей */}
      {user && (
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

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg relative overflow-hidden" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : featuredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'en' ? 'No events found' : 'События не найдены'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'en' ? 'Check back later for new prediction events.' : 'Загляните позже для новых событий для предсказаний.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredEvents.map((event) => {
                  const stats = getEventStats(event);
                  return (
                    <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
                      <div className="relative h-40 w-full bg-slate-200">
                        {event.image_url ? (
                          <Image 
                            src={event.image_url.startsWith('http') 
                              ? event.image_url 
                              : event.image_url.startsWith('/') 
                                ? event.image_url 
                                : `/${event.image_url}`}
                            alt={event.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              // If the image fails to load, replace with the placeholder
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/events/event_placeholder.png';
                            }}
                          />
                        ) : (
                          <Image 
                            src="/images/events/event_placeholder.png" 
                            alt="Placeholder image"
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.short_description}
                        </p>
                        <div className="flex justify-between text-sm mb-2">
                          <span>
                            {locale === 'en' ? 'Yes probability:' : 'Вероятность Да:'} {stats.yesProbability}%
                          </span>
                          <span>
                            {locale === 'en' ? 'Until:' : 'До:'} {formatDate(event.end_time)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${stats.yesProbability}%` }}
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
                  );
                })}
              </div>
            )}
          </div>
        </section>
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