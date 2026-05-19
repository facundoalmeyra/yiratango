import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useI18n } from '@/components/contexts/I18nContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChangePasswordSection({ user }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (searchParams.get('changePassword') === 'true') {
      setOpen(true);
      setIsRecovery(true);
      searchParams.delete('changePassword');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (user?.app_metadata?.provider !== 'email') return null;

  const isValid = (isRecovery || currentPassword.length >= 6) && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleOpen = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setError(''); setOpen(true);
  };

  const handleClose = () => {
    setOpen(false); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    setError('');
    try {
      if (!isRecovery) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) { setError(t('currentPasswordIncorrect')); return; }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setError(t('passwordChangeFailed')); return; }

      toast.success(t('passwordChanged'));
      handleClose();
    } catch {
      setError(t('passwordChangeFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-4 border-t border-white/10 mt-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-4 h-4 text-white/40" />
          <div>
            <p className="text-sm text-white/70">{t('changePassword')}</p>
            <p className="text-sm text-white/30 tracking-widest mt-0.5">••••••••</p>
          </div>
        </div>
        <button
          onClick={handleOpen}
          className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full transition-colors"
        >
          {t('change')}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-sm w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-5">{t('changePassword')}</h3>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {!isRecovery && (
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder={t('currentPassword')}
                      className="bg-white/5 border-white/10 text-white pr-10"
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={t('newPassword')}
                    className="bg-white/5 border-white/10 text-white pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmNewPassword')}
                  className="bg-white/5 border-white/10 text-white"
                  autoComplete="new-password"
                />

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">{t('passwordsDoNotMatch')}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 text-white/60 hover:text-white">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={!isValid || isSaving} className="flex-1 bg-white text-black hover:bg-white/90">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('changePassword')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
