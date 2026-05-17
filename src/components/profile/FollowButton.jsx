import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/components/contexts/I18nContext';

export default function FollowButton({ artistId, className, theme = 'dark' }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: follows, isLoading: loadingFollows } = useQuery({
    queryKey: ['follows', artistId, user?.email],
    queryFn: () => base44.entities.Follow.filter({ artist_id: artistId, fan_user_id: user.email }),
    enabled: !!user?.email && !!artistId,
  });

  const isFollowing = follows && follows.length > 0;
  const followRecord = isFollowing ? follows[0] : null;

  const followMutation = useMutation({
    mutationFn: () => base44.entities.Follow.create({
      artist_id: artistId,
      fan_user_id: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: () => base44.entities.Follow.delete(followRecord.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
    }
  });

  const handleFollowClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = loadingUser || loadingFollows || followMutation.isPending || unfollowMutation.isPending;

  return (
    <>
      <Button
        onClick={handleFollowClick}
        disabled={isLoading}
        className={`w-max px-5 rounded-full h-9 md:h-10 text-xs md:text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
          isFollowing
            ? theme === 'dark' 
                ? 'bg-transparent border border-white text-white hover:bg-white/10' 
                : 'bg-transparent border border-black text-black hover:bg-black/10'
            : theme === 'dark'
                ? 'bg-white border-0 text-black hover:bg-white/90'
                : 'bg-black border-0 text-white hover:bg-black/90'
        } ${className || ''}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <Heart className="w-4 h-4 fill-current" />
            <span>{t('following')}</span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" />
            <span>{t('followArtist')}</span>
          </>
        )}
      </Button>

      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowLoginModal(false);
            }}
          >
            <div 
              className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">{t('loginRequired')}</h3>
              <p className="text-white/70 mb-6 text-sm">
                {t('loginToFollow')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowLoginModal(false)}
                  className="text-white/60 hover:text-white flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('access_token');
                    url.searchParams.delete('is_new_user');
                    url.hash = '';
                    base44.auth.redirectToLogin(url.toString());
                  }}
                  className="bg-white text-black hover:bg-gray-200 rounded-full px-6 flex-1 font-bold"
                >
                  Log In
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}