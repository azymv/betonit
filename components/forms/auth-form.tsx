// components/forms/auth-form.tsx

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/i18n-config';
import { AuthFormData } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { AlertCircle } from 'lucide-react';
import { ReferralBadge } from '@/components/referral/ReferralBadge';

interface AuthFormProps {
  type: 'signin' | 'signup';
  redirectPath?: string;
}

export function AuthForm({ type, redirectPath = '/' }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    language: 'en',
    termsAccepted: false,
    referralCode: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerUsername, setReferrerUsername] = useState<string | undefined>(undefined);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const supabase = createClientComponentClient<Database>({
    options: {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  });
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  // Получаем реферальный код из URL и сохраняем его
  useEffect(() => {
    const referralCode = searchParams.get('ref');
    console.log('Referral code from URL:', referralCode);
    if (referralCode && type === 'signup') {
      // Обновляем состояние формы с реферальным кодом из URL
      setFormData(prev => ({
        ...prev,
        referralCode: referralCode
      }));
      
      // Сохраняем код в sessionStorage для использования после подтверждения email
      sessionStorage.setItem('referralCode', referralCode);
      
      const fetchReferrer = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, username')  // Добавляем username к запросу
            .eq('referral_code', referralCode)
            .single();
            
          console.log('Referrer data:', data, 'Error:', error);
          
          if (!error && data) {
            setReferrerId(data.id);
            // Проверяем, что username существует, прежде чем устанавливать его
            if (data.username) {
              setReferrerUsername(data.username);
            }
            // Сохраняем ID реферера в sessionStorage
            sessionStorage.setItem('referrerId', data.id);
          }
        } catch (error) {
          console.error('Error fetching referrer:', error);
        }
      };
      
      fetchReferrer();
    }
  }, [searchParams, type]);
  
  // Добавляем новый useEffect для обработки изменений в URL
  useEffect(() => {
    // Если в URL есть параметр ref, сохраняем его в состоянии формы
    const refCodeFromUrl = searchParams.get('ref');
    console.log('Checking URL for referral code changes. Current URL code:', refCodeFromUrl, 'Current form code:', formData.referralCode);
    
    if (refCodeFromUrl && formData.referralCode !== refCodeFromUrl) {
      console.log('Referral code in URL changed, updating form data from:', formData.referralCode, 'to:', refCodeFromUrl);
      setFormData(prev => ({
        ...prev,
        referralCode: refCodeFromUrl
      }));
      
      // Логирование для отладки
      console.log('Updated form data with new referral code from URL');
    }
  }, [searchParams, formData.referralCode]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Add specific logging for referral code changes
    if (name === 'referralCode') {
      console.log('Referral code changed via handleChange:', value);
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLanguageChange = (value: string) => {
    setFormData({
      ...formData,
      language: value
    });
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData({
      ...formData,
      termsAccepted: checked
    });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setShowResendButton(false);

    try {
      if (type === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          // Проверяем тип ошибки
          if (error.message.includes('Email not confirmed')) {
            setError('Email not confirmed. Please check your inbox and confirm your email address.');
            
            // Добавляем кнопку для повторной отправки письма
            setShowResendButton(true);
          } else {
            setError(error.message);
          }
        } else {
          // Redirect to the specified path or home page
          router.push(`/${locale}${redirectPath}`);
        }
      } else if (type === 'signup') {
        // For signup, if terms are not accepted, show error
        if (!formData.termsAccepted) {
          setError(t('auth.signup.acceptTermsError'));
          setIsLoading(false);
          return;
        }

        console.log('Submitting signup with referral code:', formData.referralCode);
        
        // Log referral information before signup
        if (formData.referralCode) {
          console.log('Referral code provided:', formData.referralCode);
          console.log('Referrer ID from state:', referrerId);
          console.log('Referrer username from state:', referrerUsername);
        }

        const { error } = await signUp(
          formData.email, 
          formData.password,
          {
            username: formData.username,
            full_name: formData.full_name,
            language: formData.language,
            referralCode: formData.referralCode
          }
        );
        
        console.log('Signup response received, error:', error);
        
        if (error) {
          setError(error.message);
        } else {
          setIsSuccess(true);
          
          // If signup successful and we have a referral code, log it
          if (formData.referralCode) {
            console.log('Successful signup with referral code:', formData.referralCode);
          }
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция для входа через Google
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      
      const referralCode = formData.referralCode || searchParams.get('ref') || '';
      
      // Сохраняем реферальный код для использования после авторизации
      if (referralCode) {
        sessionStorage.setItem('referralCode', referralCode);
      }
      
      // Вызываем авторизацию через Google из контекста
      const { error } = await signInWithGoogle(`/auth/callback?redirect_to=/${locale}${redirectPath}`, {
        locale: locale,
        referralCode: referralCode
      });
      
      if (error) throw error;
      
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during Google authentication');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {type === 'signin' ? t('auth.signin.title') : t('auth.signup.title')}
        </CardTitle>
        <CardDescription>
          {type === 'signin' ? t('auth.signin.description') : t('auth.signup.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {referrerId && type === 'signup' && (
          <ReferralBadge locale={locale} referrerUsername={referrerUsername} />
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {showResendButton && (
          <Button 
            variant="outline" 
            className="w-full mb-4"
            disabled={resendingEmail}
            onClick={async () => {
              setResendingEmail(true);
              try {
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: formData.email,
                });
                
                if (error) {
                  setError(error.message);
                } else {
                  alert(t('auth.emailResent'));
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Error resending email');
              } finally {
                setResendingEmail(false);
              }
            }}
          >
            {resendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.resendingEmail')}
              </>
            ) : (
              t('auth.resendEmail')
            )}
          </Button>
        )}
        
        {isSuccess ? (
          <Alert className="mb-4">
            <AlertTitle>{t('auth.verifyEmailTitle')}</AlertTitle>
            <AlertDescription>{t('auth.verifyEmailDescription')}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Google Sign In Button */}
            <Button 
              variant="outline" 
              type="button" 
              className="w-full mb-4 flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                    fill="#4285F4" 
                  />
                  <path 
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                    fill="#34A853" 
                  />
                  <path 
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
                    fill="#FBBC05" 
                  />
                  <path 
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                    fill="#EA4335" 
                  />
                </svg>
              )}
              <span className="ml-2">
                {type === 'signin' 
                  ? t('auth.continueWithGoogle') || 'Continue with Google'
                  : t('auth.signupWithGoogle') || 'Sign up with Google'
                }
              </span>
            </Button>
            
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('auth.orContinueWith') || 'Or continue with'}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {type === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('auth.signup.username')}</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder={t('auth.signup.usernamePlaceholder')}
                      required
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('auth.signup.fullName')}</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder={t('auth.signup.fullNamePlaceholder')}
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.signin.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.signin.email')}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.signin.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={type === 'signin' ? t('auth.signin.password') : t('auth.signup.passwordInfo')}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {type === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('auth.signup.language')}</Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={handleLanguageChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('auth.signup.selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('language.english')}</SelectItem>
                        <SelectItem value="ru">{t('language.russian')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.termsAccepted}
                      onCheckedChange={handleTermsChange}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('auth.signup.agreeToTerms')}{' '}
                      <Link href={`/${locale}/terms`} className="text-primary hover:underline">
                        {t('auth.signup.terms')}
                      </Link>
                    </label>
                  </div>
                </>
              )}
              
              {type === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="referralCode">{t('referral.enterCode')}</Label>
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder={t('referral.enterCodePlaceholder')}
                    value={formData.referralCode}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('Referral code input changed:', newValue);
                      setFormData(prev => ({
                        ...prev,
                        referralCode: newValue
                      }));
                    }}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('referral.codeOptional')}
                  </p>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {type === 'signin' ? t('auth.signin.loading') : t('auth.signup.loading')}
                  </>
                ) : (
                  type === 'signin' ? t('auth.signin.submit') : t('auth.signup.submit')
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!isSuccess && (
          type === 'signin' ? (
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link 
                  href={`/${locale}/auth/signup${
                    searchParams.get('redirectTo') 
                      ? `?redirectTo=${searchParams.get('redirectTo')}` 
                      : ''
                  }${
                    searchParams.get('ref') 
                      ? `${searchParams.get('redirectTo') ? '&' : '?'}ref=${searchParams.get('ref')}` 
                      : ''
                  }`} 
                  className="font-medium underline underline-offset-4 hover:text-primary"
                >
                  {t('auth.createAccount')}
                </Link>
              </p>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.haveAccount')}{' '}
                <Link 
                  href={`/${locale}/auth/signin${
                    searchParams.get('redirectTo') 
                      ? `?redirectTo=${searchParams.get('redirectTo')}` 
                      : ''
                  }${
                    searchParams.get('ref') 
                      ? `${searchParams.get('redirectTo') ? '&' : '?'}ref=${searchParams.get('ref')}` 
                      : ''
                  }`} 
                  className="font-medium underline underline-offset-4 hover:text-primary"
                >
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          )
        )}
      </CardFooter>
    </Card>
  );
}