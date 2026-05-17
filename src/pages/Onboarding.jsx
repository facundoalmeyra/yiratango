import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
// Organizer entity is now separate from Fan
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Loader from '@/components/ui/Loader';
import OnboardingFlow from '@/components/profile/OnboardingFlow';
import SEO from '@/components/seo/SEO';

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const trackedRef = useRef(false);
  // Prevent redirect-to-Map when artist profile was just created in this session
  const profileJustCreatedRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Map');
          return;
        }
        setUser(currentUser);
      } catch (err) {
        window.location.href = createPageUrl('Map');
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list(),
    enabled: !!user,
  });

  const { data: fans = [], isLoading: loadingFans } = useQuery({
    queryKey: ['fans_check', user?.email || user?.id],
    queryFn: () => base44.entities.Fan.filter({ user_id: user?.email || user?.id }),
    enabled: !!user,
  });

  const { data: organizers = [], isLoading: loadingOrganizers } = useQuery({
    queryKey: ['organizers_check', user?.email || user?.id],
    queryFn: () => base44.entities.Organizer.filter({ user_id: user?.email || user?.id }),
    enabled: !!user,
  });

  useEffect(() => {
    // If profile was just created this session, do nothing — the button handles navigation
    if (profileJustCreatedRef.current) return;
    if (!loadingUser && !loadingArtists && !loadingFans && !loadingOrganizers && user) {
      // Check for claimed profile first (bypass onboarding)
      const claimedProfile = artists.find(m => m.claimed_by_user_id === user.email || m.claimed_by_user_id === user.id);
      const profile = artists.find(m => m.created_by === user.email || m.created_by === user.id);
      const hasFan = fans.length > 0;
      const hasOrganizer = organizers.length > 0;
      
      if (claimedProfile || profile) {
        navigate(createPageUrl('ProfileSettings') + '?tab=dates', { replace: true });
      } else if (hasFan || hasOrganizer) {
        navigate(createPageUrl('Map'));
      }
    }
  }, [loadingUser, loadingArtists, loadingFans, loadingOrganizers, user, artists, fans, organizers, navigate]);

  if (loadingUser || loadingArtists || loadingFans || loadingOrganizers) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      <SEO title="Onboarding | Yira Tango" />
      <OnboardingFlow
        user={user}
        onComplete={(opts = {}) => {
          profileJustCreatedRef.current = true;
          if (!opts.isFan) {
            navigate(createPageUrl('ProfileSettings') + '?tab=dates', { replace: true });
          } else {
            navigate(createPageUrl('Map'), { replace: true });
          }
        }}
        onSkip={async () => {
          await base44.auth.logout();
          window.location.href = createPageUrl('Map');
        }}
      />
    </div>
  );
}