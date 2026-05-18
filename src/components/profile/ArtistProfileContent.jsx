import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Globe, Instagram, Facebook, MessageCircle, ExternalLink, Radio, Plane, Calendar, Camera, Share2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import SEO from '@/components/seo/SEO';
import StatusAvatar from '@/components/profile/StatusAvatar';
import { getArtistState } from '@/components/utils/tourUtils';
import Logo from '@/components/ui/Logo';
import FollowButton from '@/components/profile/FollowButton';
import VisitRequestCard from '@/components/profile/VisitRequestCard';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import TabBar from '@/components/ui/TabBar';

export default function ArtistProfileContent({ artistIdOrSlug }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [bgLoaded, setBgLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [user, setUser] = useState(null);
  const p = artistIdOrSlug;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user)).catch(() => setUser(null));
  }, []);

  const { data: artists, isLoading: loadingArtist } = useQuery({
    queryKey: ['artist', p],
    queryFn: async () => {
      if (!p) return [];
      const { data: bySlug } = await supabase.from('artists').select('*').eq('slug', p).limit(1);
      if (bySlug && bySlug.length > 0) return bySlug;
      const { data: byId } = await supabase.from('artists').select('*').eq('id', p).limit(1);
      return byId || [];
    },
    enabled: !!p
  });

  const artist = artists?.[0];

  const { data: tours } = useQuery({
    queryKey: ['tours', artist?.id],
    queryFn: async () => {
      const [{ data: byId }, { data: bySlug }] = await Promise.all([
        supabase.from('tours').select('*').eq('artist_id', artist.id).order('start_date'),
        artist.slug
          ? supabase.from('tours').select('*').eq('artist_id', artist.slug).order('start_date')
          : Promise.resolve({ data: [] }),
      ]);
      const all = [...(byId || []), ...(bySlug || [])];
      const seen = new Set();
      return all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
    },
    enabled: !!artist?.id
  });

  const sortedTours = useMemo(() => {
    if (!tours) return [];
    return [...tours]
      .filter(t => {
        const dateToCheck = t.start_date || t.date;
        return dateToCheck && !isNaN(new Date(dateToCheck).getTime());
      })
      .sort((a, b) => new Date(a.start_date || a.date) - new Date(b.start_date || b.date));
  }, [tours]);

  const upcomingTours = useMemo(() => {
      const now = new Date();
      now.setUTCHours(0,0,0,0);
      return sortedTours.filter(t => {
        const end = new Date(t.end_date || t.date);
        end.setUTCHours(0,0,0,0);
        return end >= now;
      });
  }, [sortedTours]);

  const pastTours = useMemo(() => {
      const now = new Date();
      now.setUTCHours(0,0,0,0);
      return sortedTours.filter(t => {
        const end = new Date(t.end_date || t.date);
        end.setUTCHours(0,0,0,0);
        return end < now;
      }).reverse();
  }, [sortedTours]);

  const state = useMemo(() => getArtistState(sortedTours), [sortedTours]);

  if (loadingArtist) {
    return (
      <div className="min-h-screen bg-black text-white font-sans pb-20 relative overflow-hidden">
        <SEO 
            title="Loading Artist | Yira Tango"
            description="Discover Tango artists, workshops & milongas near you with an interactive 3D map."
        />
        <div className="absolute inset-0 z-0 bg-black">
           <div className="absolute inset-0 bg-[#111111] skeleton-shimmer" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0F0F]/60 to-[#0F0F0F] pb-32" />
        </div>
        <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center pointer-events-none">
            <div className="w-32 h-10 bg-[#111111] rounded-full border border-white/5 skeleton-shimmer" />
            <div className="w-32 h-10 bg-[#111111] rounded-full border border-white/5 skeleton-shimmer" />
        </nav>
        <main className="relative z-10 max-w-3xl mx-auto px-6 pt-20 md:pt-28">
            <div className="flex flex-col items-center mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-[#111111] border border-white/10 skeleton-shimmer mb-3 md:mb-6" />
                <div className="h-8 md:h-12 w-48 md:w-96 bg-[#111111] rounded-lg skeleton-shimmer mb-3 md:mb-6" />
                <div className="h-6 w-32 bg-[#111111] rounded-full skeleton-shimmer mb-3 md:mb-6" />
                <div className="flex flex-col items-center gap-4 mb-5 md:mb-10 w-full">
                    <div className="h-6 w-40 bg-[#111111] rounded skeleton-shimmer" />
                    <div className="flex gap-3">
                        <div className="h-10 w-32 bg-[#111111] rounded-full skeleton-shimmer" />
                        <div className="h-10 w-32 bg-[#111111] rounded-full skeleton-shimmer" />
                    </div>
                </div>
                <div className="flex gap-3 mb-4 md:mb-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-[#111111] rounded-full skeleton-shimmer" />)}
                </div>
                <div className="w-full max-w-2xl space-y-2">
                    <div className="h-4 w-full bg-[#111111] rounded skeleton-shimmer" />
                    <div className="h-4 w-5/6 bg-[#111111] rounded skeleton-shimmer mx-auto" />
                    <div className="h-4 w-4/6 bg-[#111111] rounded skeleton-shimmer mx-auto" />
                </div>
            </div>
            <div className="mt-6 md:mt-16">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-5 h-5 bg-[#111111] rounded skeleton-shimmer" />
                    <div className="h-6 w-40 bg-[#111111] rounded skeleton-shimmer" />
                 </div>
                 <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-[#111111] rounded-xl border border-white/5 skeleton-shimmer" />)}
                 </div>
            </div>
        </main>
      </div>
    );
  }

  if (!artist) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">{t('artistNotFound')}</h1>
            <p className="text-white/70 mb-8">{t('artistNotFoundDesc')}</p>
            <Link to={createPageUrl('Map')} className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors">
                {t('discoverArtists')}
            </Link>
        </div>
    )
  }

  const displayName = (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name 
    ? `${artist.name} & ${artist.partner_name}` 
    : artist.name;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": (artist.profileType === 'Couple' || artist.category === 'Orquesta') ? "MusicGroup" : "Person",
    "name": displayName,
    "image": artist.avatar_url,
    "description": artist.bio,
    "url": `${window.location.origin}${createPageUrl('ArtistProfile')}?p=${artist.slug || artist.id}`,
    "sameAs": [
      artist.instagram_url ? (artist.instagram_url.startsWith('http') ? artist.instagram_url : `https://instagram.com/${artist.instagram_url}`) : null,
      artist.facebook_url ? (artist.facebook_url.startsWith('http') ? artist.facebook_url : `https://facebook.com/${artist.facebook_url}`) : null,
      artist.website_url ? (artist.website_url.startsWith('http') ? artist.website_url : `https://${artist.website_url}`) : null
    ].filter(Boolean),
    "event": upcomingTours.map(tour => ({
      "@type": "Event",
      "name": `${displayName} in ${tour.city}`,
      "startDate": tour.start_date || tour.date,
      "endDate": tour.end_date || tour.date,
      "eventLocation": {
        "@type": "Place",
        "name": tour.city,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": tour.city,
          "addressCountry": tour.country
        }
      },
      "url": tour.event_link || window.location.href
    }))
  };

  const bgImageUrl = artist.category === 'Musician' 
    ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5deb0543e_2025_06_22_Festival-Lent_Piazzolleky-Tango-Orquesta_foto-Zan-Osim-7.jpg'
    : artist.category === 'DJ'
    ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5658e9c36_DSCF4496-e1667251122453.jpg'
    : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/9838903fb_Group313.png';

  const bgCredit = artist.category === 'Musician'
    ? { name: '@Žan Osim', link: 'https://osimzan.si/' }
    : artist.category === 'DJ'
    ? { name: '@Tango Vinyl', link: 'https://www.instagram.com/tangovinyl/' }
    : { name: '@Peter Forret', link: 'https://www.tangopaparazzo.com/' };

  const isOwnProfile = !!user && artist && (artist.created_by === user.email || artist.created_by === user.id);

  const renderTourList = (tourList, emptyMessage, isUpcomingTab = false) => (
    tourList.length > 0 ? (
        <div className="space-y-3">
          {tourList.map((tour) => {
            const CardWrapper = tour.event_link ? 'a' : 'div';
            const linkProps = tour.event_link ? {
              href: tour.event_link,
              target: "_blank",
              rel: "noopener noreferrer"
            } : {};

            return (
              <CardWrapper
                key={tour.id}
                {...linkProps}
                className={`flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/5 transition-colors group ${tour.event_link ? 'hover:bg-white/10 cursor-pointer' : ''}`}
              >
                <div className="w-16 md:w-20 text-center flex-shrink-0">
                  <div className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-widest mb-1">
                    {format(new Date(tour.start_date || tour.date), 'MMM')}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white leading-none">
                    {format(new Date(tour.start_date || tour.date), 'dd')}
                  </div>
                </div>

                <div className="flex-1 min-w-0 border-l border-wh ite/10 pl-4 md:pl-6">
                  <h4 className="font-bold text-white text-lg md:text-xl break-words mb-1">
                    {tour.city}, {tour.country}
                  </h4>
                  <div className="text-xs md:text-sm text-white/70">
                    {tour.start_date !== tour.end_date 
                      ? `${format(new Date(tour.start_date), 'MMM d')} - ${format(new Date(tour.end_date), 'MMM d, yyyy')}`
                      : format(new Date(tour.start_date), 'MMM d, yyyy')
                    }
                  </div>
                </div>

                {tour.event_link && (
                  <div className="flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity pl-2 md:pl-4 flex-shrink-0">
                    <ExternalLink className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                )}
              </CardWrapper>
            );
          })}
        </div>
    ) : (
        <div className="text-center py-12 px-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <h3 className="text-xl font-bold text-white mb-2">{t('noUpcomingDates')}</h3>
            <p className="text-white/60 text-sm mb-5">{emptyMessage}</p>
            {isUpcomingTab && isOwnProfile && (
              <button
                onClick={() => navigate(`${createPageUrl('ProfileSettings')}?tab=tours&addDate=true`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('addDate')}
              </button>
            )}
        </div>
    )
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 pb-20 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none bg-black">
            <div className={`absolute inset-0 opacity-60 transition-all duration-1000 ease-in-out grayscale ${bgLoaded ? 'blur-0 scale-100' : 'blur-xl scale-105'}`}>
                <img 
                  src={bgImageUrl}
                  alt="Background Sharp" 
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onLoad={() => setBgLoaded(true)}
                />
                <img 
                  src={bgImageUrl}
                  alt="Background Blurred" 
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                  loading="lazy"
                />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(15,15,15,0.7) 55%, #0F0F0F 75%)' }} />
        </div>

        <a 
            href={bgCredit.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 text-[10px] text-white/80 hover:text-white/80 transition-colors bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
            <Camera className="w-3 h-3" />
            {bgCredit.name}
        </a>

        <SEO 
            title={`${displayName} - Yira Tango`}
            description={artist.bio ? artist.bio.substring(0, 150) + '...' : `Descubre a ${displayName} y sus próximos tours de tango en Yira Tango.`}
            image={artist.avatar_url}
            type="profile"
            structuredData={structuredData}
            canonicalUrl={`${window.location.origin}${createPageUrl('ArtistProfile')}?p=${artist.slug || artist.id}`}
        />
        
        <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 md:gap-4">
              <Link
                 to={sessionStorage.getItem('yira_return_to') === 'list' ? createPageUrl('List') : `${createPageUrl('Map')}?m=${artist.slug || artist.id}&nomodal=true`}
                 onClick={() => sessionStorage.setItem('yira_from_profile', 'true')}
                 className="cursor-pointer flex items-center transition-all hover:opacity-80"
               >
                 <Logo className="w-16 h-8 md:w-[72px] md:h-[36px] text-white drop-shadow-md" />
               </Link>
               <Link 
                   to={sessionStorage.getItem('yira_return_to') === 'list' ? createPageUrl('List') : `${createPageUrl('Map')}?m=${artist.slug || artist.id}&nomodal=true`} 
                   onClick={() => sessionStorage.setItem('yira_from_profile', 'true')}
                   className="flex items-center gap-2 px-4 py-2.5 md:px-4 md:py-2 bg-white text-black rounded-full border border-transparent hover:bg-white/90 transition-all group shadow-2xl font-['JetBrains_Mono',_monospace] font-extrabold text-[12px] uppercase"
               >
                   <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                   <span className="hidden sm:inline">{t('findOnGlobe')}</span>
               </Link>
            </div>

            <div className="pointer-events-auto flex items-center gap-4 md:gap-6">
              <LanguageSwitcher />
            </div>
        </nav>

        <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-20 md:pt-28">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4 md:mb-8"
            >
                <div className="flex justify-center mb-6 md:mb-8">
                     <StatusAvatar 
                        artist={artist}
                        status={state.status}
                        size="full"
                        className="w-28 h-28 md:w-56 md:h-56 text-3xl md:text-5xl"
                        baseBorderColor="border-white/10"
                      />
                </div>

                <div className="flex flex-col items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <h1 className="text-3xl md:text-5xl font-bold">{displayName}</h1>
                </div>

                {((artist.current_city) || (state.status === 'LIVE' && state.tour) || (state.status === 'TRANSIT' && state.lastTour)) && (
                  <div className="flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-lg font-medium text-white/90 mb-3 md:mb-4 text-center">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                    <span className="flex items-center flex-wrap justify-center">
                      {state.status === 'LIVE' ? `${state.tour?.city}, ${state.tour?.country}` :
                       state.status === 'TRANSIT' ? (
                         <>{state.lastTour?.city} <span className="text-white/50 mx-1.5 md:mx-2 text-sm md:text-lg">→</span> {state.nextTour?.city}</>
                       ) :
                       artist.current_city}
                    </span>
                  </div>
                )}

                <div className="flex flex-row flex-wrap justify-center items-center gap-2 md:gap-3 mb-5 md:mb-6">
                    {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' ? (
                      <span className="flex items-center justify-center px-5 h-9 md:h-10 bg-white/5 border border-white/10 text-white/90 text-xs md:text-sm font-semibold rounded-full tracking-wider uppercase whitespace-nowrap backdrop-blur-sm">
                        {t('couple')}
                      </span>
                    ) : (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Solo' ? (
                      <span className="flex items-center justify-center px-5 h-9 md:h-10 bg-white/5 border border-white/10 text-white/90 text-xs md:text-sm font-semibold rounded-full tracking-wider uppercase whitespace-nowrap backdrop-blur-sm">
                        MAESTRO
                      </span>
                    ) : (
                      <span className="flex items-center justify-center px-5 h-9 md:h-10 bg-white/5 border border-white/10 text-white/90 text-xs md:text-sm font-semibold rounded-full tracking-wider uppercase whitespace-nowrap backdrop-blur-sm">
                        {artist.category === 'Musician' ? t('musicianLabel') || 'Musician' : artist.category}
                      </span>
                    )}
                    
                    {state.status === 'LIVE' ? (
                      <span className="inline-flex items-center justify-center gap-2 px-5 h-9 md:h-10 bg-[#00C2D4]/20 border border-[#00C2D4]/40 text-[#00C2D4] text-xs md:text-sm font-semibold rounded-full tracking-wide uppercase shadow-lg whitespace-nowrap">
                        <Radio className="w-3 h-3 md:w-4 md:h-4 skeleton-shimmer" />
                        {t('live')}
                      </span>
                    ) : state.status === 'TRANSIT' ? (
                      <span className="flex items-center justify-center gap-2 px-5 h-9 md:h-10 bg-white/5 border border-white/10 text-white/60 text-xs md:text-sm font-semibold rounded-full tracking-wider uppercase whitespace-nowrap backdrop-blur-sm">
                        <Plane className="w-3 h-3 md:w-4 md:h-4" />
                        {t('inTransit')} • {state.daysUntil} D
                      </span>
                    ) : state.status === 'UPCOMING' ? (
                      <span className="flex items-center justify-center gap-2 px-5 h-9 md:h-10 bg-white/5 border border-white/10 text-white/90 text-xs md:text-sm font-semibold rounded-full tracking-wider uppercase whitespace-nowrap backdrop-blur-sm">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        {t('upcomingTag')}
                      </span>
                    ) : null}
                  
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <FollowButton artistId={artist.id} />
                    <button
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/functions/go?p=${artist.slug || artist.id}`);
                        toast.success(t('linkCopied'));
                    }}
                      className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                      title={t('share')}
                    >
                        <Share2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {artist.bio && (
                   <p className="text-white/70 text-base md:text-lg leading-relaxed font-light max-w-2xl mx-auto whitespace-pre-line mb-6 md:mb-8 px-2">
                     {artist.bio}
                   </p>
                 )}

                <div className="flex flex-row flex-nowrap justify-between sm:justify-center items-center gap-1 sm:gap-6 mb-4 md:mb-6 w-full overflow-hidden px-1">
                  {artist.instagram_url && (
                    <a href={artist.instagram_url.startsWith('http') ? artist.instagram_url : `https://instagram.com/${artist.instagram_url}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-2 hover:bg-white/5 rounded-xl transition-colors flex-1 sm:flex-none min-w-0">
                      <Instagram className="w-5 h-5 md:w-6 md:h-6 text-white/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 truncate w-full text-center">Instagram</span>
                    </a>
                  )}
                  {artist.facebook_url && (
                    <a href={artist.facebook_url.startsWith('http') ? artist.facebook_url : `https://facebook.com/${artist.facebook_url}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-2 hover:bg-white/5 rounded-xl transition-colors flex-1 sm:flex-none min-w-0">
                      <Facebook className="w-5 h-5 md:w-6 md:h-6 text-white/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 truncate w-full text-center">Facebook</span>
                    </a>
                  )}
                  {artist.whatsapp_number && (
                    <a href={`https://wa.me/${artist.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-2 hover:bg-white/5 rounded-xl transition-colors flex-1 sm:flex-none min-w-0">
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 truncate w-full text-center">WhatsApp</span>
                    </a>
                  )}
                  {artist.website_url && (
                    <a href={artist.website_url.startsWith('http') ? artist.website_url : `https://${artist.website_url}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-2 hover:bg-white/5 rounded-xl transition-colors flex-1 sm:flex-none min-w-0">
                      <Globe className="w-5 h-5 md:w-6 md:h-6 text-white/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-white/80 truncate w-full text-center">Website</span>
                    </a>
                  )}
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <VisitRequestCard artist={artist} />
                </motion.div>

            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="mt-6 md:mt-8"
            >
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                   <Calendar className="w-5 h-5 text-white" />
                   <h2 className="text-xl font-bold">{t('tourDates')}</h2>
                </div>

                <TabBar
                    className="mb-6"
                    layoutId="tourTabIndicator"
                    fullWidth={false}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { key: 'upcoming', label: t('upcoming') },
                        { key: 'past',     label: t('past') },
                    ]}
                />

                {activeTab === 'upcoming' 
                   ? renderTourList(upcomingTours, t('noUpcomingToursEmpty'), true) 
                   : renderTourList(pastTours, t('noPastTours'))}
            </motion.div>
        </main>
    </div>
  );
}