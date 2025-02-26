import { Metadata } from 'next';
import SignInForm from './components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In - BetOnIt',
  description: 'Sign in to your BetOnIt account',
};

interface PageParams {
  params: { locale: string };
}

export default function SignInPage({ params }: PageParams) {
  return <SignInForm locale={params.locale} />;
}