/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-supabase-project.supabase.co'],
  },
  experimental: {
    // Изменяем с boolean на объект
    serverActions: {
      bodySizeLimit: '2mb' // Можно настроить лимит размера данных
    }
  },
  i18n: {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig