'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let isRecovery = false;
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash);
          
          if (searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
            isRecovery = true;
          }

          const code = searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=callback_failed');
          return;
        }

        if (isRecovery) {
          router.push('/auth/reset-password');
          return;
        }

        if (session) {
          router.push('/dashboard?verified=true');
        } else {
          router.push('/auth/login?verified=true');
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        router.push('/auth/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <CategoryCycleLoader fullPage={true} message="Verifying authentication session..." />
  );
}
