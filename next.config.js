/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'https://swhvhazwszytmveskbcq.supabase.co'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Удалите этот блок i18n, так как он конфликтует с App Router
  // i18n: {
  //   locales: ['en', 'ru'],
  //   defaultLocale: 'en',
  // }
}

module.exports = nextConfig