import React, { useState } from 'react';
import { KeyRound, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useI18n } from '@/components/contexts/I18nContext';

export default function ChangePasswordSection({ user }) {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Only show for email/password accounts. Hide for Google, Apple, Facebook, etc.
  // We show it ONLY when provider is explicitly 'email'. Unknown/missing provider = hide (safe default).
  if (user?.provider !== 'email') return null;

  const isValid = currentPassword.length >= 6 && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSaving(true);
    try {
      // Verify current password by attempting to re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(t('currentPasswordIncorrect'));
        setIsSaving(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(t('passwordChangeFailed'));
      } else {
        toast.success(t('passwordChanged'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(t('passwordChangeFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-4 h-4 text-white/50" />
        <h4 className="text-sm font-medium text-white/70">{t('changePassword')}</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t('currentPassword')}
            className="bg-white/5 border-white/10 text-white pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('newPassword')}
            className="bg-white/5 border-white/10 text-white pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('confirmNewPassword')}
          className="bg-white/5 border-white/10 text-white"
          autoComplete="new-password"
        />

        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-400">{t('passwordsDoNotMatch')}</p>
        )}

        <Button
          type="submit"
          disabled={!isValid || isSaving}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              {t('changePassword')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}