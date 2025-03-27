'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { sanitizeFormData } from '@/lib/utils/sanitize';

export default function EventForm() {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslation(locale);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    image_url: '/images/events/event_placeholder.png',
    category: 'other',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'active' as const
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(formData);

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.eventCreationError'));
      }

      router.push('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.eventCreationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.createEvent')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('admin.eventTitle')}</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">{t('admin.eventShortDescription')}</Label>
            <Input
              id="short_description"
              name="short_description"
              type="text"
              required
              value={formData.short_description}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('admin.eventDescription')}</Label>
            <Textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">{t('admin.eventImageUrl')}</Label>
            <Input
              id="image_url"
              name="image_url"
              type="text"
              value={formData.image_url}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">{t('admin.eventStartTime')}</Label>
            <Input
              id="start_time"
              name="start_time"
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">{t('admin.eventEndTime')}</Label>
            <Input
              id="end_time"
              name="end_time"
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('admin.creating')}
              </>
            ) : (
              t('admin.create')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}