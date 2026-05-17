import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import Logo from '@/components/ui/Logo';
import SEO from '@/components/seo/SEO';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';

export default function ClaimProfile() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistPreview, setArtistPreview] = useState(null); // { name, avatar_url }
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Pre-fill code from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, []);

  // Check auth status
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setCheckingAuth(false);
    }).catch(() => {
      setCheckingAuth(false);
    });
  }, []);

  // When code reaches full length, preview which artist will be claimed
  const handleCodeChange = async (value) => {
    const upper = value.toUpperCase();
    setCode(upper);
    if (status === 'error') setStatus('idle');

    if (upper.trim().length === 8) {
      setLoadingPreview(true);
      try {
        const { data, error } = await supabase.functions.invoke('lookupArtistByCode', {
          body: { claim_code: upper.trim() }
        });
        if (error) throw error;
        setArtistPreview(data?.found ? { name: data.name, avatar_url: data.avatar_url } : null);
      } catch {
        setArtistPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    } else {
      setArtistPreview(null);
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}?code=${code}`
      }
    });
  };

  const handleClaim = async () => {
    if (!code.trim()) return;
    setStatus('loading');
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('claimArtistProfile', {
        body: { claim_code: code.trim() }
      });
      if (error) throw error;
      setArtistName(data?.artist_name);
      setStatus('success');

      // Redirect to ProfileSettings after 2 seconds (bypass onboarding)
      setTimeout(() => {
        navigate(createPageUrl('ProfileSettings') + '?tab=dates', { replace: true });
      }, 2000);
    } catch (err) {
      const errMsg = err?.message || 'Invalid code. Please try again.';
      setMessage(errMsg);
      setStatus('error');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center px-4">
      <SEO title="Claim Artist Profile | Yira Tango" />

      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo width={120} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-3">{t('claimTitle')}</h1>

          {/* Artist preview — shown between title and subtitle once code is valid */}
          {loadingPreview && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
              <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
            </div>
          )}
          {!loadingPreview && artistPreview && (
            <div className="flex items-center gap-3 mb-3">
              {artistPreview.avatar_url ? (
                <img src={artistPreview.avatar_url} alt={artistPreview.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {artistPreview.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-white font-semibold">{artistPreview.name}</span>
            </div>
          )}

          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            {t('claimSubtitle')}
          </p>

          {status === 'success' ? (
            /* Success state */
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-1">{t('claimProfileLinked')}</p>
              <p className="text-white/50 text-sm">
                <strong className="text-white">{artistName}</strong> {t('claimProfileLinkedDesc')}
              </p>
              <p className="text-white/30 text-xs mt-4">{t('claimRedirecting')}</p>
            </div>
          ) : (
            /* Claim form — always visible */
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2 block">
                  {t('claimCodeLabel')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && user && handleClaim()}
                  placeholder={t('claimCodePlaceholder')}
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-[0.3em] uppercase placeholder:text-white/20 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* CTA: login if not authenticated, claim if authenticated */}
              {!user ? (
                <>
                  <p className="text-white/40 text-xs text-center">{t('claimLoginRequired')}</p>
                  <button
                    onClick={handleLogin}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-colors"
                  >
                    {t('claimLoginBtn')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleClaim}
                    disabled={!code.trim() || code.trim().length < 6 || status === 'loading'}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('claimVerifying')}</>
                    ) : (
                      t('claimBtn')
                    )}
                  </button>
                  <p className="text-white/30 text-xs text-center">
                    {t('claimLoggedInAs')} <span className="text-white/50">{user.email}</span>
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Back to map */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            {t('claimBackToMap')}
          </button>
        </div>
      </div>
    </div>
  );
}