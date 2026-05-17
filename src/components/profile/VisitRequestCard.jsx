import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, MapPin, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import UserAvatar from '@/components/profile/UserAvatar';
import { createPageUrl } from '@/utils';
import { useI18n } from '@/components/contexts/I18nContext';

export default function VisitRequestCard({ artist }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: fans = [] } = useQuery({
    queryKey: ['fans', user?.email],
    queryFn: () => base44.entities.Fan.filter({ user_id: user?.email }),
    enabled: !!user?.email,
  });
  
  const fanProfile = fans[0];
  const isOrganizer = fanProfile?.role_type === 'organizer';

  const { data: existingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['visit_requests', artist?.id, user?.email],
    queryFn: () => base44.entities.VisitRequest.filter({ 
      artist_id: artist.id,
      fan_user_id: user?.email 
    }),
    enabled: !!user?.email && !!artist?.id,
  });

  const hasRequested = existingRequests.length > 0;

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const requestType = isOrganizer ? 'collaboration' : 'visit';
      // Create request
      const newRequest = await base44.entities.VisitRequest.create({
        artist_id: artist.id,
        fan_user_id: user.email,
        fan_name: fanProfile?.name || user.full_name || 'Tango Fan',
        fan_avatar_url: fanProfile?.avatar_url || user.avatar_url || user.picture || '',
        city: fanProfile?.city || 'Unknown',
        request_type: requestType,
        status: 'unread'
      });
      
      const artistUser = await base44.entities.Artist.get(artist.id);

      await base44.entities.Notification.create({
        fan_user_id: artistUser.created_by, // Send to the artist's email
        artist_id: artist.id,
        artist_name: fanProfile?.name || user.full_name || 'Tango Fan', // We'll re-use these fields
        artist_slug: artist.slug || artist.id, 
        artist_avatar: fanProfile?.avatar_url || user.avatar_url || user.picture || '',
        type: 'fan_request',
        message: `requested you to visit ${fanProfile?.city || 'their city'}`,
        link: `${createPageUrl('ProfileSettings')}?tab=requests`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit_requests', artist?.id, user?.email] });
      toast.success('Request sent successfully!');
    }
  });

  const handleRequestClick = () => {
    if (!user) {
      const url = new URL(window.location.href);
      base44.auth.redirectToLogin(url.toString());
      return;
    }

    if (fanProfile && (!fanProfile?.city || fanProfile.city === 'Unknown')) {
      toast.error('Please add your city to your profile first.');
      window.location.href = `${createPageUrl('FanProfile')}?tab=account`;
      return;
    }
    
    createRequestMutation.mutate();
  };

  if (loadingRequests && user) return null;

  return (
    <>
      <div className="bg-transparent border border-white/10 backdrop-blur-sm text-white rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4 justify-between w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-4 text-center sm:text-left justify-center sm:justify-start">
          <div className="hidden sm:flex flex-shrink-0">
            <UserAvatar artistProfile={artist} size="lg" />
          </div>
          <h3 className="text-sm font-medium flex items-center gap-3">
            <div className="sm:hidden flex-shrink-0">
              <UserAvatar artistProfile={artist} size="sm" />
            </div>
            {isOrganizer
              ? <>{t('wantArtistToCollaborate1')}{artist.name}{t('wantArtistToCollaborate2')}</>
              : <>{t('wantArtistToPerform1')}{artist.name}{t('wantArtistToPerform2')}</>
            }
          </h3>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          {hasRequested ? (
            <div className="flex items-center justify-center gap-2 px-5 py-2 bg-white/10 text-white/80 font-medium rounded-full w-full sm:w-auto text-sm border border-white/5">
              {t('requested')} <Check className="w-4 h-4 text-cyan-400" />
            </div>
          ) : (
            <Button 
              onClick={handleRequestClick}
              disabled={createRequestMutation.isPending}
              variant="outline"
              className="w-full sm:w-auto px-5 py-2 bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold rounded-full transition-colors text-sm h-auto"
            >
              {createRequestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isOrganizer ? (
                t('requestCollaboration')
              ) : (
                t('requestItNow')
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}