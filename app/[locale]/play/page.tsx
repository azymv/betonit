'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import PlayFeed from "@/components/play/PlayFeed";
import { Toaster } from 'react-hot-toast';

export default function Play() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          redirect('/signin?redirectTo=/play');
        }
        
        setUserId(data.session.user.id);
      } catch (error) {
        console.error('Authentication error:', error);
        redirect('/signin?redirectTo=/play');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [supabase.auth]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      {userId && <PlayFeed userId={userId} />}
    </div>
  );
} 