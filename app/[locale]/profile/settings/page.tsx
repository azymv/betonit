'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-config';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, 
  AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, User, LogOut, AlertTriangle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';

export default function SettingsPage() {
  const params = useParams();
  const localeStr = typeof params.locale === 'string' ? params.locale : 'en';
  const { t } = useTranslation(localeStr);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const handleSignOut = async () => {
    await signOut();
    router.push(`/${localeStr}`);
  };
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username }
      });
      
      if (error) {
        console.error('Error updating profile:', error);
        setSaveMessage(t("profile.save_error") || "Error saving profile");
      } else {
        setSaveMessage(t("profile.save_success") || "Profile saved successfully");
      }
    } catch (err) {
      console.error('Exception updating profile:', err);
      setSaveMessage(t("profile.save_error") || "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t("profile.settings") || "Settings"}</h1>
      
      <Card className="bg-gray-900 text-white border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-lg flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            {t("profile.personal_info") || "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("profile.email") || "Email"}</Label>
            <Input 
              id="email" 
              value={user?.email || ''} 
              disabled 
              className="bg-gray-800 border-gray-700 text-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">{t("profile.username") || "Username"}</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:ring-primary"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-800 flex justify-between pt-4">
          <div className={`text-sm ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {saveMessage}
          </div>
          <Button 
            onClick={handleUpdateProfile} 
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSaving ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-gray-900 text-white border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-lg flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            {t("profile.account") || "Account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full border-gray-700 text-white hover:bg-gray-800 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.signout") || "Sign Out"}
            </Button>
          </div>
          
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-900 hover:bg-red-800 text-white border-none"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t("profile.delete_account") || "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 text-white border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    {t("profile.confirm_delete") || "Are you sure?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    {t("profile.delete_warning") || "This action cannot be undone. This will permanently delete your account and remove your data from our servers."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
                    {t("common.cancel") || "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700">
                    {t("common.delete") || "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 