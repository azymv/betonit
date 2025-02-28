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
      
      // Auth sign in
      'auth.signin.title': 'Sign In',
      'auth.signin.description': 'Enter your email and password to sign in',
      'auth.signin.email': 'Email',
      'auth.signin.password': 'Password',
      'auth.signin.forgotPassword': 'Forgot password?',
      'auth.signin.loading': 'Signing in...',
      'auth.signin.submit': 'Sign In',
      'auth.signin.noAccount': 'Don\'t have an account?',
      'auth.signin.signup': 'Sign Up',
      
      // Auth sign up
      'auth.signup.title': 'Create Account',
      'auth.signup.description': 'Enter your details to create a new account',
      'auth.signup.username': 'Username',
      'auth.signup.usernamePlaceholder': 'Enter username (min. 3 characters)',
      'auth.signup.fullName': 'Full Name',
      'auth.signup.fullNamePlaceholder': 'Enter your full name',
      'auth.signup.email': 'Email',
      'auth.signup.password': 'Password',
      'auth.signup.passwordInfo': 'At least 8 characters',
      'auth.signup.language': 'Preferred Language',
      'auth.signup.selectLanguage': 'Select language',
      'auth.signup.agreeToTerms': 'I agree to the',
      'auth.signup.terms': 'Terms of Service',
      'auth.signup.acceptTermsError': 'You must accept the Terms of Service',
      'auth.signup.loading': 'Creating account...',
      'auth.signup.submit': 'Create Account',
      'auth.signup.hasAccount': 'Already have an account?',
      'auth.signup.signin': 'Sign In',
      'auth.signup.success': 'Account created successfully! Check your email for verification link.',
      
// Auth error
'auth.error.title': 'Authentication Error',
'auth.error.description': 'There was a problem with your authentication',
'auth.error.message': 'We couldn\'t complete the authentication process. This may be due to an expired link or a server issue.',
'auth.error.tryAgain': 'Try Again',

      // Home page
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
      
      // Events
      'events.allEvents': 'All Events',
      'events.categories.politics': 'Politics',
      'events.categories.cryptocurrency': 'Cryptocurrency',
      'events.categories.economy': 'Economy',
      'events.categories.technology': 'Technology',
      'events.categories.sports': 'Sports',
      'events.categories.entertainment': 'Entertainment',
      'events.categories.science': 'Science',
      'events.categories.other': 'Other',
      'events.status.upcoming': 'Upcoming',
      'events.status.active': 'Active',
      'events.status.resolved': 'Resolved',
      'events.status.cancelled': 'Cancelled',
      'events.ends': 'Ends',
      'events.yesPercent': 'Yes',
      'events.viewDetails': 'View Details',
      'events.searchPlaceholder': 'Search events...',
      'events.selectCategory': 'Select Category',
      'events.selectStatus': 'Select Status',
      'events.allCategories': 'All Categories',
      'events.allStatuses': 'All Statuses',
      'events.sortBy': 'Sort By',
      'events.sortEndingFirst': 'Ending Soon',
      'events.sortEndingLast': 'Ending Later',
      'events.sortNewest': 'Newest First',
      'events.sortOldest': 'Oldest First',
      'events.noEventsFound': 'No events found',
      'events.tryDifferentFilters': 'Try changing your filters',
      'events.imageComingSoon': 'Image coming soon',
      
      // Common
      'common.loading': 'Loading...',
      'common.search': 'Search',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.continue': 'Continue',
      'common.back': 'Back',
      
      // Errors
      'errors.failedToLoadEvents': 'Failed to load events',
      
      // Footer
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
      
      // Auth sign in
      'auth.signin.title': 'Вход в аккаунт',
      'auth.signin.description': 'Введите ваш email и пароль для входа',
      'auth.signin.email': 'Email',
      'auth.signin.password': 'Пароль',
      'auth.signin.forgotPassword': 'Забыли пароль?',
      'auth.signin.loading': 'Вход...',
      'auth.signin.submit': 'Войти',
      'auth.signin.noAccount': 'Еще нет аккаунта?',
      'auth.signin.signup': 'Зарегистрироваться',
      
      // Auth sign up
      'auth.signup.title': 'Создание аккаунта',
      'auth.signup.description': 'Заполните информацию для создания нового аккаунта',
      'auth.signup.username': 'Имя пользователя',
      'auth.signup.usernamePlaceholder': 'Введите имя пользователя (мин. 3 символа)',
      'auth.signup.fullName': 'Полное имя',
      'auth.signup.fullNamePlaceholder': 'Введите ваше полное имя',
      'auth.signup.email': 'Email',
      'auth.signup.password': 'Пароль',
      'auth.signup.passwordInfo': 'Минимум 8 символов',
      'auth.signup.language': 'Предпочитаемый язык',
      'auth.signup.selectLanguage': 'Выберите язык',
      'auth.signup.agreeToTerms': 'Я согласен с',
      'auth.signup.terms': 'Условиями использования',
      'auth.signup.acceptTermsError': 'Вы должны принять Условия использования',
      'auth.signup.loading': 'Создание аккаунта...',
      'auth.signup.submit': 'Создать аккаунт',
      'auth.signup.hasAccount': 'Уже есть аккаунт?',
      'auth.signup.signin': 'Войти',
      'auth.signup.success': 'Аккаунт успешно создан! Проверьте email для подтверждения.',

      // Auth error
      'auth.error.title': 'Ошибка аутентификации',
      'auth.error.description': 'Возникла проблема с вашей аутентификацией',
      'auth.error.message': 'Мы не смогли завершить процесс аутентификации. Это может быть связано с истекшей ссылкой или проблемой на сервере.',
      'auth.error.tryAgain': 'Попробовать снова',
      
      // Home page
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
      
      // Events
      'events.allEvents': 'Все события',
      'events.categories.politics': 'Политика',
      'events.categories.cryptocurrency': 'Криптовалюта',
      'events.categories.economy': 'Экономика',
      'events.categories.technology': 'Технологии',
      'events.categories.sports': 'Спорт',
      'events.categories.entertainment': 'Развлечения',
      'events.categories.science': 'Наука',
      'events.categories.other': 'Другое',
      'events.status.upcoming': 'Предстоящие',
      'events.status.active': 'Активные',
      'events.status.resolved': 'Завершенные',
      'events.status.cancelled': 'Отмененные',
      'events.ends': 'Завершается',
      'events.yesPercent': 'Да',
      'events.viewDetails': 'Подробнее',
      'events.searchPlaceholder': 'Поиск событий...',
      'events.selectCategory': 'Выберите категорию',
      'events.selectStatus': 'Выберите статус',
      'events.allCategories': 'Все категории',
      'events.allStatuses': 'Все статусы',
      'events.sortBy': 'Сортировать по',
      'events.sortEndingFirst': 'Скоро завершатся',
      'events.sortEndingLast': 'Завершатся позже',
      'events.sortNewest': 'Сначала новые',
      'events.sortOldest': 'Сначала старые',
      'events.noEventsFound': 'События не найдены',
      'events.tryDifferentFilters': 'Попробуйте изменить фильтры',
      'events.imageComingSoon': 'Изображение скоро появится',
      
      // Common
      'common.loading': 'Загрузка...',
      'common.search': 'Поиск',
      'common.yes': 'Да',
      'common.no': 'Нет',
      'common.save': 'Сохранить',
      'common.cancel': 'Отмена',
      'common.delete': 'Удалить',
      'common.edit': 'Редактировать',
      'common.continue': 'Продолжить',
      'common.back': 'Назад',
      
      // Errors
      'errors.failedToLoadEvents': 'Не удалось загрузить события',
      
      // Footer
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