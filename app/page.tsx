import { redirect } from 'next/navigation';
import { defaultLocale } from '../lib/i18n-config';

export const dynamic = 'force-dynamic';

export default function Home() {
  redirect(`/${defaultLocale}`);
}