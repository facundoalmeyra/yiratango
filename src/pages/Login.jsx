import { useState, useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useI18n } from '@/components/contexts/I18nContext';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';

const BGS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/a60633894_d1.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/af3bc4fe0_d3.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/60db9f739_d2.png',
];

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function Login() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  const bg = useMemo(() => BGS[Math.floor(Math.random() * BGS.length)], []);
  const [mode, setMode] = useState(() => searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(/** @type {string|null} */ (null));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (/** @type {'signin'|'signup'|'forgot'} */ newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleEmailAuth = async (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError(t('invalidEmail')); return; }
    if (mode !== 'forgot' && password.length < 6) { setError(t('passwordTooShort')); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError(t('passwordsDoNotMatch')); return; }

    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + createPageUrl('Map'),
        });
        if (error) throw error;
        setSuccess(t('resetEmailSent'));
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        window.location.href = `/${lang}/map`;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = `/${lang}/map`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('email not confirmed')) {
        setError(t('wrongEmailOrPassword'));
      } else {
        setError(t('loginError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (/** @type {string} */ provider) => {
    setError('');
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: /** @type {import('@supabase/supabase-js').Provider} */ (provider),
        options: { redirectTo: `${window.location.origin}/${lang}/map` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10">
      {/* Full screen background */}
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />

      {/* Top bar */}
      <div className="fixed top-4 left-6 z-50">
        <Link to={`/${lang}/map`}><Logo width={100} height={40} className="" style={{}} /></Link>
      </div>
      <div className="fixed top-4 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-10">
        <div className="w-full">
          {/* Heading */}
          {mode === 'forgot' ? (
            <div className="mb-8">
              <button onClick={() => switchMode('signin')} className="text-white/40 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
                ← {t('backToLogin')}
              </button>
              <h1 className="text-2xl font-bold text-white">{t('forgotPassword')}</h1>
            </div>
          ) : (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                {mode === 'signin' ? t('signIn') : t('signUp')}
              </h1>
              <p className="text-sm text-white/40">
                {mode === 'signin' ? (
                  <>
                    {t('noAccount')}{' '}
                    <button onClick={() => switchMode('signup')} className="text-white hover:underline transition-colors">
                      {t('signUp')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('alreadyHaveAccount')}{' '}
                    <button onClick={() => switchMode('signin')} className="text-white hover:underline transition-colors">
                      {t('signIn')}
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
              />

              {mode !== 'forgot' && (
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              )}

              {mode === 'signup' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              )}

              {mode === 'signin' && (
                <div className="text-right">
                  <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                  : mode === 'forgot' ? t('sendResetEmail')
                  : mode === 'signup' ? t('signUp')
                  : t('signIn')}
              </button>
            </form>
          )}

          {/* Social */}
          {mode !== 'forgot' && !success && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">{t('orContinueWith')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  {t('signInWithGoogle')}
                </button>
                <button
                  onClick={() => handleOAuth('facebook')}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {oauthLoading === 'facebook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FacebookIcon />}
                  {t('signInWithFacebook')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
