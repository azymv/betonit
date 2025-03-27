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
import { Loader2, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Separator } from '@/components/ui/separator';
import { ReferralBadge } from '@/components/referral/ReferralBadge';
import { sanitizeFormData } from '@/lib/utils/sanitize';

interface AuthFormProps {
  type: 'signin' | 'signup';
  redirectPath?: string;
}

export function AuthForm({ type, redirectPath = '/' }: AuthFormProps) {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    language: 'en',
    termsAccepted: false,
    referralCode: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerUsername, setReferrerUsername] = useState<string | undefined>(undefined);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [twitterLoading, setTwitterLoading] = useState(false);
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
  
  const { signIn, signUp, signInWithX } = useAuth();
  
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
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(formData);

      // Validate passwords match
      if (sanitizedData.password !== sanitizedData.confirmPassword) {
        throw new Error(t('auth.passwordsDoNotMatch'));
      }

      if (type === 'signin') {
        const { error } = await signIn(sanitizedData.email, sanitizedData.password);
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
        if (!sanitizedData.termsAccepted) {
          setError(t('auth.signup.acceptTermsError'));
          setIsLoading(false);
          return;
        }

        console.log('Submitting signup with referral code:', sanitizedData.referralCode);
        
        // Log referral information before signup
        if (sanitizedData.referralCode) {
          console.log('Referral code provided:', sanitizedData.referralCode);
          console.log('Referrer ID from state:', referrerId);
          console.log('Referrer username from state:', referrerUsername);
        }

        const { error } = await signUp(
          sanitizedData.email, 
          sanitizedData.password,
          {
            username: sanitizedData.username,
            full_name: sanitizedData.full_name,
            language: sanitizedData.language,
            referralCode: sanitizedData.referralCode
          }
        );
        
        console.log('Signup response received, error:', error);
        
        if (error) {
          setError(error.message);
        } else {
          setIsSuccess(true);
          
          // If signup successful and we have a referral code, log it
          if (sanitizedData.referralCode) {
            console.log('Successful signup with referral code:', sanitizedData.referralCode);
          }
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : t('auth.signupError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleXSignIn = async () => {
    setTwitterLoading(true);
    setError(null);
    try {
      const { error } = await signInWithX(redirectPath);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      console.error('X authentication error:', err);
      setError(err instanceof Error ? err.message : t('auth.social.loadingError'));
    } finally {
      setTwitterLoading(false);
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
            className="w-full mt-2 mb-4"
            onClick={async () => {
              try {
                setResendingEmail(true);
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: formData.email,
                });
                
                if (error) {
                  setError(`Failed to resend email: ${error.message}`);
                } else {
                  setError('Verification email has been resent. Please check your inbox.');
                }
              } catch (e) {
                setError(`An error occurred: ${e instanceof Error ? e.message : 'Unknown error'}`);
              } finally {
                setResendingEmail(false);
              }
            }}
            disabled={resendingEmail}
          >
            {resendingEmail ? 'Sending...' : 'Resend verification email'}
          </Button>
        )}
        
        {isSuccess && type === 'signup' ? (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              {t('auth.signup.success')}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* X (formerly Twitter) Sign In Button */}
            <Button 
              type="button"
              className="w-full mb-4 bg-black text-white hover:bg-gray-800" 
              onClick={handleXSignIn}
              disabled={twitterLoading || isLoading}
            >
              {twitterLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.social.loading')}
                </>
              ) : (
                <>
                  {t('auth.social.continueWithX')}
                </>
              )}
            </Button>
            
            <div className="relative mb-4">
              <Separator className="my-4" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                {t('auth.social.or')}
              </div>
            </div>
          
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                    <Label htmlFor="referralCode">{t('auth.referral.enterCode')}</Label>
                    <Input
                      id="referralCode"
                      name="referralCode"
                      type="text"
                      placeholder={t('auth.referral.enterCodePlaceholder')}
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
                      {t('auth.referral.codeOptional')}
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
              </div>
            </form>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {type === 'signin' ? (
          <p className="text-sm text-muted-foreground">
            {t('auth.signin.noAccount')}{' '}
            <Link href={`/${locale}/auth/signup`} className="text-primary hover:underline">
              {t('auth.signin.signup')}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('auth.signup.hasAccount')}{' '}
            <Link href={`/${locale}/auth/signin`} className="text-primary hover:underline">
              {t('auth.signup.signin')}
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}