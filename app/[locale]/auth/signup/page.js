import SignUpForm from './SignUpForm';

// Metadata for the page
export const metadata = {
  title: 'Sign Up - BetOnIt',
  description: 'Create your BetOnIt account',
};

// Server Component that renders the Client Component
export default function SignUpPage(props) {
  const locale = props.params?.locale || 'en';
  return <SignUpForm locale={locale} />;
}