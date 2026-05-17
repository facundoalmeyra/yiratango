import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useI18n } from '@/components/contexts/I18nContext';

export default function Login() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + createPageUrl('Map') }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Login error', err);
      alert(err.message || t('loginError') || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0f0f0f] p-8 rounded-lg text-center border border-white/10">
        <h1 className="text-2xl font-bold mb-4">{t('login') || 'Login'}</h1>
        <p className="text-sm text-white/70 mb-6">{t('loginWithGoogle') || 'Sign in with Google'}</p>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-white text-black font-medium hover:opacity-90 transition"
        >
          {loading ? (t('loading') || 'Loading...') : (t('signInWithGoogle') || 'Sign in with Google')}
        </button>
      </div>
      <p className="mt-4 text-xs text-white/60">{t('loginNote') || 'You will be redirected to Google to authenticate.'}</p>
    </div>
  );
}
