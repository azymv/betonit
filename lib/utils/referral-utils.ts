/**
 * Генерирует уникальный реферальный код
 * 
 * @param userId ID пользователя для создания более уникального кода
 * @param length Длина кода (по умолчанию 8 символов)
 * @returns Уникальный реферальный код
 */
export function generateReferralCode(userId: string, length: number = 8): string {
  // Используем первые 4 символа ID пользователя как основу
  const userIdBase = userId.substring(0, 4);
  
  // Добавляем случайные символы для уникальности
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = userIdBase;
  
  // Добавляем случайные символы до достижения нужной длины
  const remainingLength = Math.max(0, length - userIdBase.length);
  for (let i = 0; i < remainingLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Генерирует полную реферальную ссылку
 * 
 * @param code Реферальный код пользователя
 * @param locale Локаль для ссылки
 * @returns Полная реферальная ссылка
 */
export function generateReferralLink(code: string, locale: string = 'en'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://betonit-sepia.vercel.app';
  return `${baseUrl}/${locale}/auth/signup?ref=${code}`;
}