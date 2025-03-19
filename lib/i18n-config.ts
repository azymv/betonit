// Базовые настройки локализации
export const locales = ['en', 'ru'];
export const defaultLocale = 'en';

// Простой хелпер для перевода
export function getTranslation(locale: string, key: string, params?: Record<string, string | number>): string {
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

// Auth success
'auth.success.title': 'Account Verified!',
'auth.success.description': 'Your email has been successfully verified. You can now sign in to your account.',
'auth.signup.referralApplied': 'Referral bonus will be applied after registration!',
'auth.success.goToProfile': 'Go to Profile',

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
      'events.status.label': 'Status',
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
      'events.categoriesFilter': 'Categories',
      'events.details': 'Event Details',
      'events.startDate': 'Start Date',
      'events.endDate': 'End Date',
      'events.totalBets': 'Total Bets',
      'events.placeBet': 'Place a Bet',
      'events.alreadyBet': 'You already placed a bet',
      'events.yourBet': 'Your bet',
      'events.amount': 'Amount',
      'events.odds': 'Odds',
      'events.minBet': 'Minimum bet',
      'events.maxBet': 'Maximum bet',
      'events.yourPrediction': 'Your prediction',
      'events.currentBalance': 'Current balance',
      'events.betAmount': 'Bet amount',
      'events.potentialWinnings': 'Potential winnings',
      'events.placeBetButton': 'Place Bet',
      'events.betSuccess': 'Bet Placed Successfully',
      'events.betPlacedSuccess': 'Your bet has been successfully placed!',
      'events.backToEvent': 'Back to Event',
    
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
      'common.coins': 'coins',
      'common.processing': 'Processing...',
      
      // Errors
      'errors.failedToLoadEvents': 'Failed to load events',
      'errors.eventNotFound': 'Event not found',
      'errors.eventNotActive': 'Event is not active',
      'errors.dataLoadError': 'Failed to load data',
      'errors.insufficientBalance': 'Insufficient balance',
      'errors.betError': 'Failed to place bet',
      'errors.title': 'Error',
      
      // Profile
      'profile.title': 'My Profile',
      'profile.dashboard': 'My Dashboard',
      'profile.social': 'Social',
      'profile.settings': 'Settings',
      'profile.personalInfo': 'Personal Information',
      'profile.account': 'Account actions',
      'profile.email': 'Email',
      'profile.username': 'Username',
      'profile.fullName': 'Full Name',
      'profile.balance': 'Balance',
      'profile.myBets': 'My Bets',
      'profile.transactions': 'Transactions',
      'profile.viewEvent': 'View event',
      'profile.delete_account': 'Delete account',
      'profile.delete_warning': 'Are you sure? This action cannot be undone and you\'ll lost all your earnings',
      'profile.social_features': 'Community',
      'profile.betsHistory': 'Betting History',
      'profile.transactionsHistory': 'Transaction History',
      'profile.notSet': 'Not set',
      'profile.noBets': 'You haven\'t placed any bets yet',
      'profile.comingSoon': 'This feature is coming soon',
      'profile.bets.won': 'Won',
      'profile.bets.lost': 'Lost',
      'profile.bets.waiting': 'Pending Resolution',
      'profile.bets.active': 'Active',
      'profile.stats.title': 'Betting Statistics',
'profile.stats.total': 'Total Bets',
'profile.stats.won': 'Won',
'profile.stats.lost': 'Lost',
'profile.stats.accuracy': 'Forecast Accuracy',
'profile.activity': 'Activity',
'profile.achievements': 'Achievements',
'profile.winRate': 'Win Rate',
'profile.yourAchievements': 'Your Achievements',
'profile.noAchievementsYet': 'No achievements yet',
'profile.makeMoreBets': 'Keep betting to earn achievements',
'referral.title': 'Referral Program',
'referral.yourCode': 'Your unique code',
'referral.description': 'Share your unique code with friends to earn more coins! When they sign up and place their first bet, you\'ll get 100 coins, and they\'ll get 50. Win-win!',
'referral.yourLink': 'Your Referral Link',
'referral.copyLink': 'Copy Link',
'referral.linkCopied': 'Link copied to clipboard!',
'referral.invitedByUser': 'You were invited by {username}',
'referral.bonusApplied': 'Referral bonus will be applied after registration',
'referral.joinBonus': 'You\'ll receive 50 coins after your first bet',
'referral.stats.title': 'Your Referrals',
'referral.stats.invited': 'People Invited',
'referral.stats.active': 'Active Referrals',
'referral.stats.earned': 'Coins Earned',
'referral.howItWorks': 'How It Works',
'referral.inviterBonus': 'You get 100 coins for each friend',
'referral.invitedBonus': 'Your friend gets 50 coins',
'referral.noReferrals': 'You haven\'t invited anyone yet',
'referral.shareNow': 'Share your link now',
'referral.invitedByUsername': 'You were invited by {username}',
'referral.enterCode': 'Referral Code',
'referral.enterCodePlaceholder': 'Enter referral code (optional)',
'referral.codeOptional': 'Optional: Enter the code if someone referred you',
'referral.errorLoading': 'Error loading referral data',
'referral.noData': 'No referral data available',
      
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
      
      // Leaderboard
      'leaderboard.title': 'Leaderboard',
      'leaderboard.allTime': 'All Time',
      'leaderboard.monthly': 'This Month',
      'leaderboard.rank': 'Rank',
      'leaderboard.user': 'User',
      'leaderboard.score': 'Score',
      'leaderboard.bets': 'Bets',
      'leaderboard.winRate': 'Win Rate',
      'leaderboard.noData': 'No data available',
      'leaderboard.anonymous': 'Anonymous',
      'leaderboard.you': 'You',
      'leaderboard.yourStats': 'Your Stats',
      'leaderboard.yourPosition': 'Your position',
      'leaderboard.outOf': 'out of {total}',
      'leaderboard.yourScore': 'Your Score',
      'leaderboard.yourRank': 'Your Rank',
      'leaderboard.topPredictors': 'Top Predictors',
      'leaderboard.allTimeLeaders': 'All Time Leaders',
      'leaderboard.monthlyLeaders': 'This Month Leaders',
      'leaderboard.tableDescription': 'See who has the most accurate predictions on the platform',
      'leaderboard.howToEarnPoints': 'How to Earn Points',
      'leaderboard.points': 'points',
      'leaderboard.rules.placeBets': 'Place Bets',
      'leaderboard.rules.placeBetsDescription': 'Earn points for each bet you place',
      'leaderboard.rules.winBets': 'Win Bets',
      'leaderboard.rules.winBetsDescription': 'Earn additional points when your predictions are correct',
      'leaderboard.rules.referFriends': 'Refer Friends',
      'leaderboard.rules.referFriendsDescription': 'Earn bonus points when your referred friends make their first bet',
      'leaderboard.rankLabels.first': 'Champion',
      'leaderboard.rankLabels.top3': 'Top 3',
      'leaderboard.rankLabels.top10': 'Top 10',
      'leaderboard.rankLabels.top1percent': 'Top 1%',
      'leaderboard.rankLabels.top5percent': 'Top 5%',
      'leaderboard.rankLabels.top10percent': 'Top 10%',
      'leaderboard.rankLabels.top25percent': 'Top 25%',
      'leaderboard.rankLabels.top50percent': 'Top 50%',
      'leaderboard.rankLabels.other': 'Challenger',
    },
    ru: {
      'nav.home': 'Главная',
      'nav.events': 'События',
      'nav.profile': 'Профиль',
      'nav.leaderboard': 'Рейтинг',
      'nav.signin': 'Войти',
      'nav.signup': 'Регистрация',
      'nav.signout': 'Выйти',
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

      // Auth success
      'auth.success.title': 'Аккаунт подтвержден!',
      'auth.success.description': 'Ваш email успешно подтвержден. Теперь вы можете войти в свой аккаунт.',
      'auth.signup.referralApplied': 'Реферальный бонус будет применен после регистрации!',
      'auth.success.goToProfile': 'Перейти в профиль',

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
      'events.status.label': 'Статус',
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
      'events.categoriesFilter': 'Категории',
      'events.details': 'Детали события',
      'events.startDate': 'Дата начала',
      'events.endDate': 'Дата окончания',
      'events.totalBets': 'Всего ставок',
      'events.placeBet': 'Сделать ставку',
      'events.alreadyBet': 'Вы уже сделали ставку',
      'events.yourBet': 'Ваша ставка',
      'events.amount': 'Сумма',
      'events.odds': 'Коэффициент',
      'events.minBet': 'Минимальная ставка',
      'events.maxBet': 'Максимальная ставка',
      'events.yourPrediction': 'Ваш прогноз',
      'events.currentBalance': 'Текущий баланс',
      'events.betAmount': 'Сумма ставки',
      'events.potentialWinnings': 'Потенциальный выигрыш',
      'events.placeBetButton': 'Разместить ставку',
      'events.betSuccess': 'Ставка успешно размещена',
      'events.betPlacedSuccess': 'Ваша ставка была успешно размещена!',
      'events.backToEvent': 'Вернуться к событию',
      
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
      'common.coins': 'монет',
      'common.processing': 'Обработка...',
      
      // Errors
      'errors.failedToLoadEvents': 'Не удалось загрузить события',
      'errors.eventNotFound': 'Событие не найдено',
      'errors.eventNotActive': 'Событие не активно',
      'errors.dataLoadError': 'Не удалось загрузить данные',
      'errors.insufficientBalance': 'Недостаточно средств',
      'errors.betError': 'Не удалось разместить ставку',
      'errors.title': 'Ошибка',
      
      // Profile
      'profile.title': 'Мой профиль',
      'profile.dashboard': 'Личный кабинет',
      'profile.social': 'Сеть',
      'profile.settings': 'Настройки',
      'profile.personalInfo': 'Персональная информация',
      'profile.account': 'Действия',
      'profile.email': 'Email',
      'profile.username': 'Имя пользователя',
      'profile.fullName': 'Полное имя',
      'profile.balance': 'Баланс',
      'profile.myBets': 'Мои ставки',
      'profile.transactions': 'Транзакции',
      'profile.viewEvent': 'К событию',
      'profile.delete_account': 'Удалить профиль',
      'profile.delete_warning': 'Вы уверены? Это действие необратимо, и вы потеряете все ваши накопления',
      'profile.social_features': 'Сообщество',
      'profile.betsHistory': 'История ставок',
      'profile.transactionsHistory': 'История транзакций',
      'profile.notSet': 'Не указано',
      'profile.noBets': 'Вы еще не сделали ни одной ставки',
      'profile.comingSoon': 'Эта функция скоро появится',
      'profile.bets.won': 'Выиграно',
      'profile.bets.lost': 'Проиграно',
      'profile.bets.waiting': 'Ожидается решение',
      'profile.bets.active': 'Активно',
      'profile.stats.title': 'Статистика ставок',
'profile.stats.total': 'Всего ставок',
'profile.stats.won': 'Выиграно',
'profile.stats.lost': 'Проиграно',
'profile.stats.accuracy': 'Точность прогнозов',
'profile.activity': 'Активность',
'profile.achievements': 'Достижения',
'profile.winRate': 'Процент побед',
'profile.yourAchievements': 'Ваши достижения',
'profile.noAchievementsYet': 'Пока нет достижений',
'profile.makeMoreBets': 'Продолжайте делать ставки, чтобы получить достижения',
'referral.title': 'Реферальная программа',
'referral.description': 'Поделись своим уникальным кодом с друзьями, чтобы заработать больше монет. Когда они зарегистрируются и сделают первую ставку, ты получишь 100 монет, а они — 50. Win-win!',
'referral.yourLink': 'Ваша реферальная ссылка',
'referral.copyLink': 'Копировать ссылку',
'referral.yourCode': 'Ваш уникальный код',
'referral.linkCopied': 'Ссылка скопирована в буфер обмена!',
'referral.invitedByUser': 'Вас пригласил {username}',
'referral.bonusApplied': 'Реферальный бонус будет применен после регистрации',
'referral.joinBonus': 'Вы получите 50 монет после вашей первой ставки',
'referral.stats.title': 'Ваши рефералы',
'referral.stats.invited': 'Приглашено людей',
'referral.stats.active': 'Активных рефералов',
'referral.stats.earned': 'Заработано монет',
'referral.howItWorks': 'Как это работает',
'referral.inviterBonus': 'Вы получаете 100 монет за каждого друга',
'referral.invitedBonus': 'Ваш друг получает 50 монет',
'referral.noReferrals': 'Вы еще никого не пригласили',
'referral.shareNow': 'Поделитесь своей ссылкой сейчас',
'referral.invitedByUsername': 'Вас пригласил {username}',
'referral.enterCode': 'Реферальный код',
'referral.enterCodePlaceholder': 'Введите реферальный код (опционально)',
'referral.codeOptional': 'Опционально: Введите код, если вас кто-то пригласил',
'referral.errorLoading': 'Ошибка загрузки данных о рефералах',
'referral.noData': 'Данные о рефералах недоступны',
      
      // Footer
      'footer.tagline': 'Предсказывай и зарабатывай',
      'footer.navigation': 'Навигация',
      'footer.account': 'Аккаунт',
      'footer.myBets': 'Мои ставки',
      'footer.balance': 'Баланс',
      'footer.legal': 'Юридическая информация',
      'footer.terms': 'Условия использования',
      'footer.privacy': 'Политика конфиденциальности',
      'footer.copyright': 'Все права защищены.',
      
      // Leaderboard
      'leaderboard.title': 'Таблица лидеров',
      'leaderboard.allTime': 'За все время',
      'leaderboard.monthly': 'Этот месяц',
      'leaderboard.rank': 'Ранг',
      'leaderboard.user': 'Пользователь',
      'leaderboard.score': 'Очки',
      'leaderboard.bets': 'Ставки',
      'leaderboard.winRate': 'Процент побед',
      'leaderboard.noData': 'Нет данных',
      'leaderboard.anonymous': 'Аноним',
      'leaderboard.you': 'Вы',
      'leaderboard.yourStats': 'Ваша статистика',
      'leaderboard.yourPosition': 'Ваша позиция',
      'leaderboard.outOf': 'из {total}',
      'leaderboard.yourScore': 'Ваши очки',
      'leaderboard.yourRank': 'Ваш ранг',
      'leaderboard.topPredictors': 'Лучшие прогнозисты',
      'leaderboard.allTimeLeaders': 'Лидеры за все время',
      'leaderboard.monthlyLeaders': 'Лидеры месяца',
      'leaderboard.tableDescription': 'Посмотрите, у кого самые точные прогнозы на платформе',
      'leaderboard.howToEarnPoints': 'Как зарабатывать очки',
      'leaderboard.points': 'очков',
      'leaderboard.rules.placeBets': 'Делайте ставки',
      'leaderboard.rules.placeBetsDescription': 'Получайте очки за каждую сделанную ставку',
      'leaderboard.rules.winBets': 'Выигрывайте ставки',
      'leaderboard.rules.winBetsDescription': 'Получайте дополнительные очки, когда ваши прогнозы сбываются',
      'leaderboard.rules.referFriends': 'Приглашайте друзей',
      'leaderboard.rules.referFriendsDescription': 'Получайте бонусные очки, когда ваши друзья делают свою первую ставку',
      'leaderboard.rankLabels.first': 'Чемпион',
      'leaderboard.rankLabels.top3': 'Топ 3',
      'leaderboard.rankLabels.top10': 'Топ 10',
      'leaderboard.rankLabels.top1percent': 'Лучший 1%',
      'leaderboard.rankLabels.top5percent': 'Лучшие 5%',
      'leaderboard.rankLabels.top10percent': 'Лучшие 10%',
      'leaderboard.rankLabels.top25percent': 'Лучшие 25%',
      'leaderboard.rankLabels.top50percent': 'Лучшие 50%',
      'leaderboard.rankLabels.other': 'Претендент',
    }
  };
  
  let result = translations[locale]?.[key] || key;
  
  // Replace parameters in the string if they exist
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
    });
  }
  
  return result;
}

// Простой hook для перевода (клиентская сторона)
export function useTranslation(locale: string) {
  // Проверка, что локаль действительно есть и это string
  const safeLocale = locale && typeof locale === 'string' ? locale : defaultLocale;
  
  return {
    t: (key: string, params?: Record<string, string | number>) => getTranslation(safeLocale, key, params)
  };
}