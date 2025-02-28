'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthErrorPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  
  return (
    <div className="container max-w-md py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.error.title')}</CardTitle>
          <CardDescription>{t('auth.error.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('auth.error.message')}
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/${locale}/auth/signin`}>
              {t('auth.error.tryAgain')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}