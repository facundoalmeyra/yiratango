import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useI18n } from '@/components/contexts/I18nContext';
import Logo from '@/components/ui/Logo';

const SESSION_KEY = 'yira_welcome_shown';

export default function WelcomeModal() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show once per browser session, and only for unauthenticated users
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return; // User is logged in — never show
      } catch {}
      // Not authenticated — show after a short delay
      setTimeout(() => setIsOpen(true), 1200);
    };

    checkAuth();
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setIsOpen(false);
  };

  const handleLogin = async () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          {/* Subtle backdrop — not too intrusive */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-sm bg-[#111111] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/15 transition-colors text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-8 pt-6 pb-8 sm:pt-8">
              {/* Logo */}
              <div className="mb-5">
                <Logo width={56} height={29} />
              </div>

              <h2 className="text-xl font-bold text-white leading-snug mb-3">
                {t('welcomeModalTitle')}
              </h2>
              <p className="text-sm text-white/65 leading-relaxed mb-7">
                {t('welcomeModalBody')}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogin}
                  className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
                >
                  {t('welcomeModalCta')}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-bold text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  {t('welcomeModalExplore')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}