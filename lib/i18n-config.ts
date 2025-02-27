// Базовые настройки локализации
export const locales = ['en', 'ru'];
export const defaultLocale = 'en';

// Простой хелпер для перевода
export function getTranslation(locale: string, key: string): string {
  const translations: Record<string, Record<string, string>> = {
    en: {
      'nav.home': 'Home',
      'nav.events': 'Events',
      'nav.profile': 'Profile',
      'nav.leaderboard': 'Leaderboard',
      'nav.signin': 'Sign In',
      'nav.signup': 'Sign Up',
      'nav.signout': 'Sign Out',
      'language.english': 'English',
      'language.russian': 'Russian',
      
      // Добавляем переводы для страницы входа
      'auth.signin.title': 'Sign In',
      'auth.signin.description': 'Enter your email and password to sign in',
      'auth.signin.email': 'Email',
      'auth.signin.password': 'Password',
      'auth.signin.forgotPassword': 'Forgot password?',
      'auth.signin.loading': 'Signing in...',
      'auth.signin.submit': 'Sign In',
      'auth.signin.noAccount': 'Don\'t have an account?',
      'auth.signin.signup': 'Sign Up',
      'home.title': 'Predict. Win. Earn.',
    'home.subtitle': 'Make predictions on events and earn coins',
    'home.cta': 'Start Now',
    'home.featuredEvents': 'Featured Events',
    'home.allEvents': 'All Events',
    'home.howItWorks': 'How It Works',
    'home.step1_title': 'Choose an Event',
    'home.step1_description': 'Choose from a variety of events in different categories - from politics to cryptocurrencies',
    'home.step2_title': 'Place a Bet',
    'home.step2_description': 'Bet coins on your chosen outcome - "Yes" or "No"',
    'home.step3_title': 'Get Paid',
    'home.step3_description': 'If your prediction is correct - you will receive your winnings automatically after the event resolves',
    'footer.tagline': 'Predict and earn',
    'footer.navigation': 'Navigation',
    'footer.account': 'Account',
    'footer.myBets': 'My Bets',
    'footer.balance': 'Balance',
    'footer.legal': 'Legal Information',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.copyright': 'All rights reserved.',
    },
    ru: {
      'nav.home': 'Главная',
      'nav.events': 'События',
      'nav.profile': 'Профиль',
      'nav.leaderboard': 'Рейтинг',
      'nav.signin': 'Вход',
      'nav.signup': 'Регистрация',
      'nav.signout': 'Выход',
      'language.english': 'Английский',
      'language.russian': 'Русский',
      
      // Добавляем переводы для страницы входа
      'auth.signin.title': 'Вход в аккаунт',
      'auth.signin.description': 'Введите ваш email и пароль для входа',
      'auth.signin.email': 'Email',
      'auth.signin.password': 'Пароль',
      'auth.signin.forgotPassword': 'Забыли пароль?',
      'auth.signin.loading': 'Вход...',
      'auth.signin.submit': 'Войти',
      'auth.signin.noAccount': 'Еще нет аккаунта?',
      'auth.signin.signup': 'Зарегистрироваться',
      'home.title': 'Предсказывай. Побеждай. Зарабатывай.',
    'home.subtitle': 'Делай ставки на исходы событий и выигрывай монеты',
    'home.cta': 'Начать',
    'home.featuredEvents': 'Популярные события',
    'home.allEvents': 'Все события',
    'home.howItWorks': 'Как это работает',
    'home.step1_title': 'Выбери событие',
    'home.step1_description': 'Выбери из множества событий в разных категориях - от политики до криптовалют',
    'home.step2_title': 'Сделай ставку',
    'home.step2_description': 'Поставь монеты на выбранный исход события - "Да" или "Нет"',
    'home.step3_title': 'Получи выигрыш',
    'home.step3_description': 'Если твой прогноз верен, ты получишь выигрыш автоматически после исхода события',
    'footer.tagline': 'Предсказывай и зарабатывай',
    'footer.navigation': 'Навигация',
    'footer.account': 'Аккаунт',
    'footer.myBets': 'Мои ставки',
    'footer.balance': 'Баланс',
    'footer.legal': 'Правовая информация',
    'footer.terms': 'Условия использования',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.copyright': 'Все права защищены.',
    }
  };
  
  return translations[locale]?.[key] || key;
}

// Простой hook для перевода (клиентская сторона)
export function useTranslation(locale: string) {
  // Проверка, что локаль действительно есть и это string
  const safeLocale = locale && typeof locale === 'string' ? locale : defaultLocale;
  
  return {
    t: (key: string) => getTranslation(safeLocale, key)
  };
}