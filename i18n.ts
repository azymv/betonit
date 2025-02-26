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
      // добавьте другие переводы по необходимости
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
      // добавьте другие переводы по необходимости
    }
  };
  
  return translations[locale]?.[key] || key;
}

// Простой hook для перевода
export function useTranslation(locale: string) {
  return {
    t: (key: string) => getTranslation(locale, key)
  };
}