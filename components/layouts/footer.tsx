import Link from "next/link";

export function Footer({ locale }: { locale: string }) {
  const currentYear = new Date().getFullYear();
  // Удаляем повторное объявление переменной locale
  
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">BetOnIt</h3>
            <p className="text-sm text-muted-foreground">
              Предсказывайте исходы событий и зарабатывайте монеты
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm hover:underline">
                  Главная
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/events`} className="text-sm hover:underline">
                  События
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/leaderboard`} className="text-sm hover:underline">
                  Лидерборд
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Аккаунт</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/profile`} className="text-sm hover:underline">
                  Профиль
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/bets`} className="text-sm hover:underline">
                  Мои ставки
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile/balance`} className="text-sm hover:underline">
                  Баланс
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Правовая информация</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/terms`} className="text-sm hover:underline">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-sm hover:underline">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          &copy; {currentYear} BetOnIt. Все права защищены.
        </div>
      </div>
    </footer>
  );
}