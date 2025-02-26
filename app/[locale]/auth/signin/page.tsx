import SignInForm from './components/SignInForm';

export default async function SignInPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <SignInForm locale={locale} />;
}