import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Metadata
export const metadata = {
  title: 'Sign In - BetOnIt',
  description: 'Sign in to your BetOnIt account',
};

// Simple SignInForm component
const SignInForm = ({ locale }) => {
  const handleSignIn = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Sign-in failed: ' + error.message);
    } else {
      alert('Signed in successfully!');
    }
  };

  return (
    <div>
      <h1>Sign In ({locale})</h1>
      <form onSubmit={handleSignIn}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

// Page component
export default function SignInPage(props) {
  const locale = props.params?.locale || 'en';
  return <SignInForm locale={locale} />;
}