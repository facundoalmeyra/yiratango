import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Plus, Trash2,
  Loader2, Pencil, Clock, Plane, AlertCircle, Copy, ExternalLink, MessageCircle, User as UserIcon, Map
} from 'lucide-react';
import TabBar from '@/components/ui/TabBar';
import SEO from '@/components/seo/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { isTourOngoing, getArtistState } from '@/components/utils/tourUtils';
import MiniMap from '@/components/map/MiniMap';
import EditProfileForm from '@/components/profile/EditProfileForm';
import ChangePasswordSection from '@/components/profile/ChangePasswordSection';
import TourFormModal from '@/components/tour/TourFormModal';
import Loader from '@/components/ui/Loader';
import UserAvatar from '@/components/profile/UserAvatar';
import ArtistVisitRequests from '@/components/profile/ArtistVisitRequests';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function ProfileSettings() {
  const { t, lang } = useI18n();
  const dateLocale = lang === 'es' ? es : enUS;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [artistProfile, setArtistProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dates';
  });
  const [editForm, setEditForm] = useState({});
  const [showDateForm, setShowDateForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('addDate') === 'true';
  });
  const [editingDate, setEditingDate] = useState(null);
  const [dateToDelete, setDateToDelete] = useState(null);
  const editFormRef = useRef(null);

  const handleTabChange = (tab) => {
    const scrollPos = window.scrollY;
    setActiveTab(tab);
    setTimeout(() => window.scrollTo(0, scrollPos), 0);
  };

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => setUser(user))
      .catch(() => setProfileChecked(true))
      .finally(() => setLoadingUser(false));
  }, []);

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => { const { data } = await supabase.from('artists').select('*'); return data || []; },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const profileStructuredData = artistProfile ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": artistProfile.name,
    "jobTitle": "Artist",
    "image": artistProfile.avatar_url,
    "description": artistProfile.bio,
    "url": window.location.href
  } : null;

  const { data: dates = [], refetch: refetchDates, isLoading: loadingDates } = useQuery({
    queryKey: ['dates', artistProfile?.id],
    queryFn: async () => {
      if (!artistProfile?.id) return [];
      const [{ data: byId }, { data: bySlug }] = await Promise.all([
        supabase.from('tours').select('*').eq('artist_id', artistProfile.id),
        artistProfile.slug
          ? supabase.from('tours').select('*').eq('artist_id', artistProfile.slug)
          : Promise.resolve({ data: [] }),
      ]);
      const all = [...(byId || []), ...(bySlug || [])];
      const seen = new Set();
      return all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
    },
    enabled: !!artistProfile?.id,
  });

  const generateShortId = () => Math.random().toString(36).substring(2, 7);

  const updateArtistMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updated, error } = await supabase.from('artists').update(data).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    },
    onSuccess: (updatedData, variables) => {
      setArtistProfile(updatedData);
      setEditForm(updatedData);
      if (!variables._silent) toast.success(t('profileUpdated'));
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (id) => {
      const email = user.email;
      await supabase.from('tours').delete().eq('artist_id', id);
      await supabase.from('visit_requests').delete().eq('artist_id', id);
      await supabase.from('follows').delete().eq('artist_id', id);
      await supabase.from('notifications').delete().eq('artist_id', id);
      await supabase.from('artists').delete().eq('id', id);
      await supabase.from('fans').delete().eq('user_id', user.id);
      await supabase.from('follows').delete().eq('fan_user_id', email);
      await supabase.from('visit_requests').delete().eq('fan_user_id', email);
      await supabase.from('notifications').delete().eq('fan_user_id', email);
      await supabase.rpc('delete_user');
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSuccess: () => {
      window.location.href = '/';
    },
    onError: (err) => {
      toast.error(err?.message || t('loginError'));
    },
  });

  useEffect(() => {
    if (user && !loadingArtists) {
      const userIdentifier = user.email || user.id;
      const profile = artists.find(m =>
        m.created_by === userIdentifier || m.claimed_by_user_id === userIdentifier
      );
      setArtistProfile(profile || null);
      setProfileChecked(true);
      if (profile) {
        setEditForm(profile);
        if (!profile.slug) {
          const generateSlug = (name, partnerName, type) => {
            let base = name;
            if (type === 'Couple' && partnerName) base = `${name} and ${partnerName}`;
            return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || generateShortId();
          };
          let newSlug = generateSlug(profile.name, profile.partner_name, profile.profileType);
          let counter = 1, tempSlug = newSlug;
          while (artists.some(m => m.id !== profile.id && m.slug === tempSlug)) {
            tempSlug = `${newSlug}-${counter}`; counter++;
          }
          updateArtistMutation.mutate({ id: profile.id, data: { slug: tempSlug }, _silent: true });
        }
      }
    }
  }, [user, artists, loadingArtists]);

  const createDateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('tours').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDates();
      queryClient.invalidateQueries({ queryKey: ['dates'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      sessionStorage.removeItem('yira_has_zoomed_to_user');
      toast.success(t('dateAdded'));
    },
    onError: (err) => {
      toast.error(err?.message || t('loginError'));
    },
  });

  const updateDateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('tours').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setShowDateForm(false);
      setEditingDate(null);
      refetchDates();
      toast.success(t('dateUpdated'));
    },
    onError: (err) => {
      toast.error(err?.message || t('loginError'));
    },
  });

  const deleteDateMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tours').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDateToDelete(null);
      refetchDates();
      sessionStorage.removeItem('yira_has_zoomed_to_user');
      toast.success(t('dateRemoved'));
    },
    onError: (err) => {
      toast.error(err?.message || t('loginError'));
    },
  });

  useEffect(() => {
    if (profileChecked && user && !artistProfile) {
      supabase.auth.signOut().then(() => navigate(createPageUrl('Map')));
    }
  }, [profileChecked, user, artistProfile]);

  const isPageLoading = loadingUser || !profileChecked || (artistProfile && loadingDates);

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pt-8 md:pt-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 skeleton-shimmer flex-shrink-0" />
            <div className="space-y-4 flex-1 w-full text-center md:text-left mt-2">
              <div className="h-10 bg-white/5 rounded-lg w-3/4 mx-auto md:mx-0 skeleton-shimmer" />
              <div className="flex flex-col md:flex-row gap-2 justify-center md:justify-start">
                <div className="h-10 bg-white/5 rounded-lg w-full md:w-32 skeleton-shimmer" />
                <div className="h-10 bg-white/5 rounded-lg w-full md:w-32 skeleton-shimmer" />
              </div>
            </div>
          </div>
          <div className="w-full h-[140px] md:h-[220px] bg-white/5 rounded-2xl skeleton-shimmer" />
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <div className="h-8 bg-white/5 rounded w-1/3 skeleton-shimmer" />
            <div className="h-8 bg-white/5 rounded w-1/3 skeleton-shimmer" />
            <div className="h-8 bg-white/5 rounded w-1/3 skeleton-shimmer" />
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-white/5 rounded-xl skeleton-shimmer" />
            <div className="h-20 bg-white/5 rounded-xl skeleton-shimmer" />
            <div className="h-20 bg-white/5 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) { navigate(createPageUrl('Map')); return null; }
  if (!artistProfile) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

  const tourState = getArtistState(dates);
  const activeMode = tourState.status === 'LIVE' ? 'current' : tourState.status === 'TRANSIT' ? 'transit' : 'manual';
  const currentTour = tourState.status === 'LIVE' ? tourState.tour : null;
  const nextTour = tourState.nextTour;
  const lastTour = tourState.status === 'TRANSIT' ? tourState.lastTour : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      <SEO
        title={artistProfile ? `${artistProfile.name} - Profile Settings` : "Profile Settings"}
        description="Manage your tour dates and profile."
        structuredData={profileStructuredData}
        type="profile"
      />

      <header className="relative md:sticky md:top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={`${createPageUrl('Map')}?refetch=true`}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['artists'] });
              queryClient.invalidateQueries({ queryKey: ['dates'] });
            }}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{t('backToMap')}</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            {user && <NotificationBell user={user} />}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-2 md:py-8 pb-24">

        <section className="mb-6 md:mb-8 pt-2 md:pt-4">
          <div className="flex flex-row items-center gap-4 md:gap-8 mb-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group flex-shrink-0">
              {activeMode === 'current' && (
                <div className="absolute inset-0 rounded-full border-2 border-[#00C2D4] shadow-[0_0_20px_rgba(0,194,212,0.4)] z-0"
                  style={{ animation: 'expandRing 2s infinite' }} />
              )}
              <div className={`relative z-10 w-12 h-12 md:w-20 md:h-20 rounded-full overflow-hidden border-3 border-[#1A1A1A] shadow-lg bg-[#111111] transition-all duration-300
                ${activeMode === 'current' ? 'ring-2 ring-[#00C2D4] shadow-[0_0_15px_rgba(0,194,212,0.3)]' :
                  activeMode === 'transit' ? 'ring-1 ring-white/20' :
                  'ring-1 ring-white/10'}`}>
                <UserAvatar artistProfile={artistProfile} size="full" className="w-full h-full text-2xl text-black bg-white" />
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 flex flex-col justify-center">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                {(!artistProfile.category || artistProfile.category === 'Maestro') && artistProfile.profileType === 'Couple' && artistProfile.partner_name
                  ? `${artistProfile.name} & ${artistProfile.partner_name}` : artistProfile.name}
              </h1>
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-3 mb-6 w-full">
            <div
              className="flex-1 inline-flex items-center justify-between gap-3 md:gap-4 px-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] transition-colors group cursor-pointer"
              onClick={() => {
                const identifier = artistProfile.slug || artistProfile.id;
                const url = `${window.location.origin}/api/functions/go?p=${identifier}`;
                navigator.clipboard.writeText(url);
                toast.success(t('linkCopied'));
              }}
            >
              <span role="img" aria-label="party popper" className="text-sm shrink-0">🎉</span>
              <div className="flex flex-col items-start gap-1 flex-1">
                <span className="text-sm font-medium text-white leading-none">{t('shareYourProfile')}</span>
              </div>
              <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors shrink-0" />
            </div>

            <Link
              to={`${createPageUrl('ArtistProfile')}?p=${artistProfile.slug || artistProfile.id}`}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-['JetBrains_Mono',_monospace] font-extrabold text-[12px] uppercase text-white border border-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="inline">{t('viewProfilePage')}</span>
            </Link>
          </div>
        </section>

        {(() => {
          const now = new Date(); now.setHours(0,0,0,0);
          const futureDates = dates.filter(t => { const end = new Date(t.end_date || t.date); end.setHours(0,0,0,0); return end >= now; });
          if (futureDates.length === 0) return (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <motion.div animate={{ x: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
                className="w-full px-6 md:px-8 py-8 md:py-12 rounded-2xl bg-gradient-to-r from-[#00C2D4]/20 via-[#00C2D4]/10 to-transparent border border-[#00C2D4]/40 shadow-[0_0_40px_rgba(0,194,212,0.3)]">
                <button onClick={() => { setShowDateForm(true); setEditingDate(null); }}
                  className="flex items-center gap-3 md:gap-6 w-full hover:opacity-90 transition-opacity">
                  <Plus className="w-10 h-10 md:w-12 md:h-12 text-[#00C2D4] flex-shrink-0" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight text-center md:text-left flex-1">{t('addDatesForFans')}</h2>
                </button>
              </motion.div>
            </motion.div>
          );
          return null;
        })()}

        {(() => {
          const now = new Date(); now.setHours(0,0,0,0);
          const futureDates = dates.filter(t => { const end = new Date(t.end_date || t.date); end.setHours(0,0,0,0); return end >= now; });
          if (futureDates.length === 0) return null;
          return (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 md:mb-8">
              <div className="rounded-2xl relative bg-[#111111] border border-white/5 shadow-2xl min-h-[120px] md:min-h-[160px] flex items-center">
                <div className="absolute inset-0 z-0 opacity-60 overflow-hidden rounded-2xl">
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent z-10 pointer-events-none" />
                    <MiniMap
                      latitude={activeMode === 'current' ? currentTour?.latitude : activeMode === 'transit' ? lastTour?.latitude : artistProfile.current_latitude}
                      longitude={activeMode === 'current' ? currentTour?.longitude : activeMode === 'transit' ? lastTour?.longitude : artistProfile.current_longitude}
                      markerColor="#ffffff"
                      className="w-full h-full grayscale opacity-80"
                      zoom={activeMode === 'manual' && !artistProfile.current_latitude ? 2 : 12}
                    />
                  </div>
                </div>

                <div className="relative z-10 p-4 md:p-6 flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-center md:items-center w-full">
                  <div className="w-full flex-1">
                    {activeMode === 'current' ? (
                      <div className="flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 w-full">
                        <div className="flex flex-col items-center md:items-start space-y-1.5 md:space-y-2 flex-1">
                          <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00C2D4]/10 text-[#00C2D4] border border-[#00C2D4]/20 mb-1">
                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C2D4] opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00C2D4]"></span></span>
                            <span className="text-[9px] font-bold tracking-wide uppercase">{t('happeningNow')}</span>
                          </div>
                          <h2 className="text-2xl md:text-xl font-bold text-white tracking-tight">{currentTour.city}</h2>
                          <p className="text-white/70 flex items-center justify-center md:justify-start gap-1.5 text-xs md:text-sm font-light">
                            <Clock className="w-3.5 h-3.5" />{t('until')} {format(new Date(currentTour.end_date || currentTour.date), "d 'de' MMMM", { locale: dateLocale })}
                          </p>
                        </div>
                        <Link to={createPageUrl('Map')} className="flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-['JetBrains_Mono',_monospace] font-extrabold text-[12px] uppercase text-white border border-white/10">
                          <Map className="w-4 h-4" />{t('viewOnMap')}
                        </Link>
                      </div>
                    ) : activeMode === 'transit' ? (
                      <div className="flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 w-full">
                        <div className="flex flex-col items-center md:items-start space-y-1.5 md:space-y-2 flex-1">
                          <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 mb-1">
                            <Plane className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-bold tracking-wide uppercase">{t('inTransit')} • {tourState.daysUntil} {lang === 'es' ? 'días' : 'days'}</span>
                          </div>
                          <h2 className="text-2xl md:text-xl font-bold text-white tracking-tight">
                            {lastTour.city} <span className="text-white/50 text-sm md:text-base mx-1.5">→</span> {nextTour.city}
                          </h2>
                          <p className="text-white/70 flex items-center justify-center md:justify-start gap-1.5 text-xs md:text-sm font-light">
                            <Calendar className="w-3.5 h-3.5" />{t('nextStopStarts')} {format(new Date(nextTour.start_date || nextTour.date), "d 'de' MMMM", { locale: dateLocale })}
                          </p>
                        </div>
                        <Link to={`${createPageUrl('Map')}?zoomToUser=true`} className="flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-['JetBrains_Mono',_monospace] font-extrabold text-[12px] uppercase text-white border border-white/10">
                          <Map className="w-4 h-4" />{t('viewOnMap')}
                        </Link>
                      </div>
                    ) : (
                      <button onClick={() => { setShowDateForm(true); setEditingDate(null); }} className="w-full text-left flex flex-col items-center md:items-start space-y-1.5 md:space-y-2 hover:opacity-80 transition-opacity">
                        {(() => {
                          const now = new Date(); now.setHours(0,0,0,0);
                          const futureDates = dates.filter(t => { const end = new Date(t.end_date || t.date); end.setHours(0,0,0,0); return end >= now; }).sort((a, b) => new Date(a.start_date || a.date) - new Date(b.start_date || b.date));
                          if (futureDates.length === 0) return null;
                          const next = futureDates[0];
                          const nextStart = new Date(next.start_date || next.date); nextStart.setHours(0,0,0,0);
                          const isUpcoming = nextStart > now;
                          return (
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 w-full">
                              <div className="flex flex-col items-center md:items-start flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap justify-center md:justify-start">
                                  <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span></span>
                                    <span className="text-[9px] font-bold tracking-wide uppercase">{t('visibilityStatus')}</span>
                                  </div>
                                  {isUpcoming && (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                                      <span className="text-[9px] font-bold tracking-wide uppercase">{t('upcomingTag')}</span>
                                    </div>
                                  )}
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                                  {isUpcoming ? t('visibilityUpcoming') : t('visibilityVisible')} {next.city}
                                </h2>
                                <p className="text-white/60 text-xs mt-0.5">
                                  {isUpcoming ? t('visibilityUpcomingOn') : t('visibilityVisibleUntil')} {format(new Date(isUpcoming ? (next.start_date || next.date) : (next.end_date || next.date)), "d MMM yyyy", { locale: dateLocale })}
                                </p>
                              </div>
                              <Link to={createPageUrl('Map')} className="flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-['JetBrains_Mono',_monospace] font-extrabold text-[12px] uppercase text-white border border-white/10">
                                <Map className="w-4 h-4" />{t('viewOnMap')}
                              </Link>
                            </div>
                          );
                        })()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })()}

        <TabBar
          className="mb-8"
          layoutId="activeTabProfileSettings"
          activeTab={activeTab}
          onChange={handleTabChange}
          tabs={[
            { key: 'dates',    icon: <Calendar className="w-4 h-4" />,    label: t('myDates') },
            { key: 'requests', icon: <MessageCircle className="w-4 h-4" />, label: t('requestsTab') },
            { key: 'account',  icon: <UserIcon className="w-4 h-4" />,     label: t('profile') },
          ]}
        />

        <div className="min-h-[60vh]">
          {activeTab === 'dates' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl md:text-xl font-bold text-white">{t('myDates')}</h3>
                <Button onClick={() => { setEditingDate(null); setShowDateForm(true); }}
                  className="bg-white text-black border-transparent hover:bg-gray-200 rounded-full transition-all shadow-md">
                  <Plus className="w-4 h-4 mr-2" />{t('addDate')}
                </Button>
              </div>
              <Card className="bg-[#111111] border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {dates.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-white/20" />
                      </div>
                      <h3 className="text-white font-medium mb-3">{t('noUpcomingDates')}</h3>
                      <p className="text-white/70 text-sm max-w-xs mx-auto">{t('noUpcomingToursEmpty')}</p>
                    </div>
                  ) : (
                    [...dates].sort((a, b) => new Date(a.start_date || a.date) - new Date(b.start_date || b.date)).map((date, index) => {
                      const isActive = isTourOngoing(date);
                      const now = new Date(); now.setHours(0,0,0,0);
                      const endDate = new Date(date.end_date || date.date); endDate.setHours(0,0,0,0);
                      const isPast = endDate < now;
                      return (
                        <motion.div key={date.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                          className={`group p-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${isActive ? 'bg-white/5' : isPast ? 'bg-black/20' : ''} ${isPast ? 'opacity-40 grayscale' : ''}`}>
                          <div className="w-16 text-center flex-shrink-0">
                            <div className={`text-sm font-medium uppercase tracking-wide ${isPast ? 'text-white/50' : 'text-white/70'}`}>
                              {format(new Date(date.start_date || date.date), 'MMM', { locale: dateLocale })}
                            </div>
                            <div className={`text-2xl font-bold ${isPast ? 'text-white/80 line-through decoration-white/40' : 'text-white'}`}>
                              {format(new Date(date.start_date || date.date), 'dd')}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-lg truncate ${isActive ? 'text-white' : isPast ? 'text-white/80 line-through decoration-white/40' : 'text-white/90'}`}>
                              {date.city}, {date.country}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-white/70">
                              <span className={isPast ? 'line-through decoration-white/40' : ''}>
                                {date.start_date !== date.end_date
                                  ? `${format(new Date(date.start_date), 'MMM d', { locale: dateLocale })} - ${format(new Date(date.end_date), 'MMM d, yyyy', { locale: dateLocale })}`
                                  : format(new Date(date.start_date), 'MMM d, yyyy', { locale: dateLocale })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingDate(date); setShowDateForm(true); }} className="p-2 text-white/80 hover:text-white transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDateToDelete(date)} className="p-2 text-white/80 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </Card>
            </section>
          )}

          {activeTab === 'account' && (
            <section>
              <Card className="bg-[#111111] border-white/5 overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <EditProfileForm
                    ref={editFormRef}
                    formData={editForm}
                    onSave={(data) => updateArtistMutation.mutate({ id: artistProfile.id, data })}
                    onDelete={() => deleteArtistMutation.mutate(artistProfile.id)}
                    isSaving={updateArtistMutation.isPending}
                    isMandatory={false}
                  />
                  <ChangePasswordSection user={user} />
                </CardContent>
              </Card>
            </section>
          )}

          {activeTab === 'requests' && (
            <section>
              <ArtistVisitRequests artistId={artistProfile.id} />
            </section>
          )}
        </div>

        <TourFormModal
          isOpen={showDateForm}
          onClose={() => { setShowDateForm(false); setEditingDate(null); }}
          onSubmit={(data) => {
            if (editingDate) updateDateMutation.mutate({ id: editingDate.id, data });
            else createDateMutation.mutate({ ...data, artist_id: artistProfile.id });
          }}
          onCreated={() => {
            setShowDateForm(false); setEditingDate(null);
            queryClient.invalidateQueries({ queryKey: ['dates'] });
            queryClient.invalidateQueries({ queryKey: ['artists'] });
          }}
          initialData={editingDate}
          isSubmitting={createDateMutation.isPending || updateDateMutation.isPending}
          isSuccess={createDateMutation.isSuccess}
        />

        <AnimatePresence>
          {dateToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
              onClick={() => setDateToDelete(null)}>
              <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">{t('removeDateTitle')}</h3>
                <p className="text-white/80 mb-6 text-sm">{t('removeDateDesc')} {dateToDelete.city} {t('removeDateDesc2')}</p>
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setDateToDelete(null)} className="text-white/80 hover:text-white">{t('cancelBtn')}</Button>
                  <Button onClick={() => deleteDateMutation.mutate(dateToDelete.id)} disabled={deleteDateMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6">
                    {deleteDateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('removeBtn')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}