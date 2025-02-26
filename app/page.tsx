import { defaultLocale } from '../lib/i18n-config';
import LocalizedHome from './[locale]/page';

export default function Home() {
  return <LocalizedHome params={{ locale: defaultLocale }} />;
}