import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getArtistState, getContinent } from '@/components/utils/tourUtils';
import { translateCountryToSpanish } from '@/components/utils/spanishToEnglish';
import ContinentSelectionModal from '@/components/map/ContinentSelectionModal';
import CountrySelectionModal from '@/components/map/CountrySelectionModal';
import SearchBar from '@/components/map/SearchBar';

import StatusAvatar from '@/components/profile/StatusAvatar';
import Logo from '@/components/ui/Logo';
import SEO from '@/components/seo/SEO';
import Loader from '@/components/ui/Loader';
import { useI18n } from '@/components/contexts/I18nContext';
import ArtistProfile from './ArtistProfile';
import UserMenu from '@/components/navigation/UserMenu';
import { ChevronDown, X, User, Plane, Filter, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const categories = [
  { id: 'All', label: 'Filter' },
  { id: 'Maestro', label: 'Only Maestros' },
  { id: 'DJ', label: 'Only DJ\'s' },
  { id: 'Musician', label: 'Only Musicians' },
  { id: 'Orchestra', label: 'Only Orchestras' }
];

const ArtistCard = ({ artist, tours, onClick }) => {
  const { t } = useI18n();
  const state = getArtistState(tours.filter(t => t.artist_id === artist.id));
  
  return (
    <motion.a 
      href={`${createPageUrl('ArtistProfile')}?p=${artist.slug || artist.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => {
        e.preventDefault();
        onClick(artist);
      }}
      className="relative flex flex-col items-center p-6 rounded-2xl border border-white/5 bg-white/5 md:hover:bg-white/10 transition-colors overflow-hidden group text-center w-full block [-webkit-mask-image:-webkit-radial-gradient(white,black)]"
    >
      <div className="absolute inset-0 z-0 opacity-20 transition-opacity md:group-hover:opacity-30">
        {artist.avatar_url && (
          <img 
            src={artist.avatar_url} 
            alt="" 
            className="w-full h-full object-cover blur-2xl scale-150"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 flex flex-col items-center h-full w-full">
        <StatusAvatar 
          artist={artist}
          tours={tours.filter(t => t.artist_id === artist.id)}
          size="lg"
          className="w-20 h-20 md:w-24 md:h-24 text-2xl mb-4 shadow-xl"
        />
        
        <h3 className="text-sm md:text-lg font-bold text-white mb-1">
          {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name
            ? `${artist.name} & ${artist.partner_name}`
            : artist.name}
        </h3>

        {((artist.current_city) || (state.status === 'LIVE' && state.tour) || (state.status === 'TRANSIT' && state.lastTour)) && (
          <div className="flex items-center justify-center gap-1 text-[10px] md:text-xs text-white/70 mb-3 w-full px-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {state.status === 'LIVE' ? `${state.tour?.city}, ${state.tour?.country}` :
               state.status === 'TRANSIT' ? (
                 <>{state.lastTour?.city} <span className="text-white/50 mx-1">→</span> {state.nextTour?.city}</>
               ) :
               artist.current_city}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-auto">
          {(!artist.category || artist.category === 'Maestro') ? (
            <span className="text-[9px] md:text-[10px] border border-white/20 text-white/80 px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider font-medium uppercase bg-black/40 backdrop-blur-sm">
              {artist.profileType === 'Couple' ? t('couple').toUpperCase() : 'MAESTRO'}
            </span>
          ) : (
            <span className="text-[9px] md:text-[10px] border border-white/20 text-white/80 px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider font-medium uppercase bg-black/40 backdrop-blur-sm">
              {artist.category === 'Musician' ? t('musicianLabel') : artist.category === 'Orchestra' ? t('orchestraLabel') : artist.category}
            </span>
          )}

          {state.status === 'LIVE' ? (
            <span className="text-[9px] md:text-[10px] border border-[#00C2D4]/30 text-[#00C2D4] px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider font-medium uppercase bg-[#00C2D4]/10 backdrop-blur-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2D4] shadow-[0_0_8px_rgba(0,194,212,0.8)] skeleton-shimmer" />
              LIVE
            </span>
          ) : state.status === 'TRANSIT' ? (
            <span className="text-[9px] md:text-[10px] border border-[#F2EF1D]/30 text-[#F2EF1D] px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider font-medium uppercase bg-[#F2EF1D]/10 backdrop-blur-sm flex items-center gap-1.5">
              <Plane className="w-3 h-3 text-[#F2EF1D]" />
              {t('inTransit')}
            </span>
          ) : state.status === 'UPCOMING' ? (
            <span className="text-[9px] md:text-[10px] border border-white/10 text-white/70 px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider font-medium uppercase bg-white/5 backdrop-blur-sm flex items-center gap-1.5">
              {t('upcomingTag')}
            </span>
          ) : null}
        </div>
      </div>
    </motion.a>
  );
};

export default function List() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const pParam = params.get('p');

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  // Removed showOnboarding
  const [artistProfile, setArtistProfile] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeContinent, setActiveContinent] = useState(() => {
    try {
      return sessionStorage.getItem('yira_active_continent') || null;
    } catch (e) {
      return null;
    }
  });
  const [activeCountry, setActiveCountry] = useState(() => {
    try {
      return sessionStorage.getItem('yira_active_country') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (activeContinent) {
      sessionStorage.setItem('yira_active_continent', activeContinent);
    } else {
      sessionStorage.removeItem('yira_active_continent');
    }
  }, [activeContinent]);

  useEffect(() => {
    if (activeCountry) {
      sessionStorage.setItem('yira_active_country', activeCountry);
    } else {
      sessionStorage.removeItem('yira_active_country');
    }
  }, [activeCountry]);
  const [isContinentModalOpen, setIsContinentModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      return sessionStorage.getItem('yira_active_category') || 'All';
    } catch (e) {
      return 'All';
    }
  });

  useEffect(() => {
    sessionStorage.setItem('yira_active_category', activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: artists = [], isLoading: loadingArtists, isRefetching: refetchingArtists } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const { data, error } = await supabase.from('artists').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: tours = [], isLoading: loadingTours } = useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tours').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: fans = [], isLoading: loadingFans, isRefetching: refetchingFans } = useQuery({
    queryKey: ['fans_check', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('fans').select('*').eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const calculatedProfile = user ? artists.find(m => m.created_by === user.email || m.created_by === user.id) : null;
  const calculatedHasFanProfile = user && fans.length > 0;

  const { data: unreadRequests = [] } = useQuery({
    queryKey: ['unread_visit_requests_list', calculatedProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('visit_requests').select('*').eq('artist_id', calculatedProfile.id).eq('status', 'unread');
      if (error) throw error;
      return data || [];
    },
    enabled: !!calculatedProfile?.id,
  });
  const hasUnreadRequests = unreadRequests.length > 0;

  useEffect(() => {
    if (!loadingArtists && !loadingUser && (!user || !loadingFans)) {
      const profile = user ? artists.find(m => m.created_by === user.email || m.created_by === user.id) : null;
      if (profile) setArtistProfile(profile);
    }
  }, [user, artists, loadingArtists, loadingUser, fans, loadingFans]);

  const filteredArtists = useMemo(() => {
    // Live-only model: only show artists with active or future tour dates
    let result = artists.filter(p => {
      const pTours = tours.filter(t => t.artist_id === p.id);
      return pTours.some(t => {
        const end = new Date(t.end_date || t.date);
        end.setHours(0, 0, 0, 0);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        return end >= now;
      });
    });
    if (activeCategory !== 'All') {
      result = result.filter(p => (p.category || 'Maestro') === activeCategory);
    }
    if (activeContinent || activeCountry) {
      result = result.filter(p => {
         const pTours = tours.filter(t => t.artist_id === p.id);
         const state = getArtistState(pTours);
         let lat = p.current_latitude;
         let lng = p.current_longitude;
         
         let country = null;
         
         if (state.status === 'LIVE') {
           lat = state.tour.latitude;
           lng = state.tour.longitude;
           country = state.tour.country;
         } else if (state.status === 'TRANSIT') {
           lat = state.lastTour.latitude;
           lng = state.lastTour.longitude;
           country = state.lastTour.country;
         } else if (state.status === 'UPCOMING') {
           lat = state.nextTour.latitude;
           lng = state.nextTour.longitude;
           country = state.nextTour.country;
         } else if (p.current_city) {
           const parts = p.current_city.split(',');
           if (parts.length > 1) {
             country = parts[parts.length - 1].trim();
           }
         }
         
         const continent = getContinent(lat, lng, country);
         
         const continentMatch = activeContinent ? continent === activeContinent : true;
         const countryMatch = activeCountry ? (country && country.toLowerCase() === activeCountry.toLowerCase()) : true;
         
         return continentMatch && countryMatch;
      });
    }
    return result;
  }, [artists, activeCategory, activeContinent, activeCountry, tours]);

  // Artists filtered only by continent/country (no category) — used to check which category options have results
  const baseFilteredArtists = useMemo(() => {
    if (!activeContinent && !activeCountry) return artists;
    return artists.filter(p => {
      const pTours = tours.filter(t => t.artist_id === p.id);
      const state = getArtistState(pTours);
      let lat = p.current_latitude;
      let lng = p.current_longitude;
      let country = null;
      if (state.status === 'LIVE') {
        lat = state.tour.latitude; lng = state.tour.longitude; country = state.tour.country;
      } else if (state.status === 'TRANSIT') {
        lat = state.lastTour.latitude; lng = state.lastTour.longitude; country = state.lastTour.country;
      } else if (p.current_city) {
        const parts = p.current_city.split(',');
        if (parts.length > 1) country = parts[parts.length - 1].trim();
      }
      const continent = getContinent(lat, lng, country);
      const continentMatch = activeContinent ? continent === activeContinent : true;
      const countryMatch = activeCountry ? (country && country.toLowerCase() === activeCountry.toLowerCase()) : true;
      return continentMatch && countryMatch;
    });
  }, [artists, activeContinent, activeCountry, tours]);

  useEffect(() => {
    if (!loadingUser && !loadingArtists && !refetchingArtists && !loadingFans && !refetchingFans && user && !calculatedProfile && !calculatedHasFanProfile) {
      supabase.auth.signOut();
    }
  }, [loadingUser, loadingArtists, refetchingArtists, loadingFans, refetchingFans, user, calculatedProfile, calculatedHasFanProfile]);

  // Early return AFTER all hooks
  if (pParam) return <ArtistProfile />;

  const handleSearchSelect = (result) => {
    sessionStorage.setItem('yira_return_to', 'list');
    navigate(`${createPageUrl('ArtistProfile')}?p=${result.slug || result.id}`);
  };

  const isLoading = loadingArtists || loadingTours || loadingUser || (user && loadingFans);

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence>
        {(loadingUser || (user && (loadingArtists || loadingFans)) || (user && !calculatedProfile && !calculatedHasFanProfile)) && (
          <motion.div
            key="global-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center bg-black z-[100]"
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>
      <SEO 
        title="All Artists | Yira Tango"
        description="Browse all Tango Artists, Maestros, DJs, and Musicians on Yira Tango."
        canonicalUrl={`${window.location.origin}${createPageUrl('List')}`}
      />

      {/* Header Area */}
      <div className={`fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-40 flex flex-col gap-3 md:gap-5 pointer-events-none transition-opacity duration-300`}>
        
        <div className="flex items-start justify-between w-full">
          <Link to={createPageUrl('Map')} className="pointer-events-auto flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo width={64} height={33} className="text-white" />
          </Link>
          
          {/* User Menu */}
          <UserMenu 
            user={user} 
            loadingUser={loadingUser} 
            calculatedProfile={calculatedProfile} 
            calculatedHasFanProfile={calculatedHasFanProfile} 
            isSearchActive={isSearchActive} 
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 flex-nowrap w-auto">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors shadow-xl whitespace-nowrap flex-shrink-0">
                  <Filter className="w-4 h-4 text-white/70" />
                  {t('filter')}
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#222222] border-white/10 text-white rounded-xl shadow-2xl p-2 z-[60]">
                {categories.filter(cat => cat.id !== 'All' && cat.id !== activeCategory).filter(cat =>
                  baseFilteredArtists.some(a => (a.category || 'Maestro') === cat.id)
                ).map(cat => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white"
                  >
                    <span className="text-sm">{t(cat.id === 'Maestro' ? 'onlyMaestros' : cat.id === 'DJ' ? 'onlyDjs' : cat.id === 'Orchestra' ? 'onlyOrchestras' : 'onlyMusicians')}</span>
                  </DropdownMenuItem>
                ))}
                {!activeContinent && !activeCountry && <DropdownMenuSeparator className="bg-white/10" />}
                {!activeContinent && (
                  <DropdownMenuItem
                    onClick={() => setIsContinentModalOpen(true)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white"
                  >
                    <span className="text-sm">{t('byContinent')}</span>
                  </DropdownMenuItem>
                )}
                {!activeCountry && (
                  <DropdownMenuItem
                    onClick={() => setIsCountryModalOpen(true)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white"
                  >
                    <span className="text-sm">{t('byCountry')}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          {activeCategory !== 'All' && (
            <button
              onClick={() => setActiveCategory('All')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors shadow-xl whitespace-nowrap flex-shrink-0"
            >
              {t(activeCategory === 'Maestro' ? 'onlyMaestros' : activeCategory === 'DJ' ? 'onlyDjs' : activeCategory === 'Orchestra' ? 'onlyOrchestras' : 'onlyMusicians')}
              <X className="w-4 h-4 text-black/50" />
            </button>
          )}
          {activeContinent && (
            <button
              onClick={() => setActiveContinent(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors shadow-xl whitespace-nowrap flex-shrink-0"
            >
              {activeContinent}
              <X className="w-4 h-4 text-black/50" />
            </button>
          )}
          {activeCountry && (
            <button
              onClick={() => setActiveCountry(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors shadow-xl whitespace-nowrap flex-shrink-0"
            >
              {lang === 'es' ? translateCountryToSpanish(activeCountry) : activeCountry}
              <X className="w-4 h-4 text-black/50" />
            </button>
          )}

          <SearchBar
            currentView="list"
            artists={filteredArtists}
            tours={tours}
            onSelectArtist={handleSearchSelect}
            onSearchStateChange={setIsSearchActive}
            activeCategory={activeCategory}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 md:px-8 pt-32 pb-32 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white/90 mb-8 pt-4 md:pt-8 text-left tracking-tight">
          {activeCategory === 'All' && !activeContinent && !activeCountry
            ? t('allArtistsWorld')
            : (() => {
                const parts = [
                  activeCategory !== 'All' ? t(activeCategory === 'Maestro' ? 'onlyMaestros' : activeCategory === 'DJ' ? 'onlyDjs' : activeCategory === 'Orchestra' ? 'onlyOrchestras' : 'onlyMusicians') : null,
                  activeContinent || null,
                  activeCountry ? (lang === 'es' ? translateCountryToSpanish(activeCountry) : activeCountry) : null,
                ].filter(Boolean);
                return `${t('filteredBy')} ${parts.join(', ')}`;
              })()}
        </h1>
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-[#111111] skeleton-shimmer border border-white/5 mb-4 md:mb-6 break-inside-avoid" />
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <User className="w-10 h-10 text-white/80" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">{t('noArtistsFound')}</h2>
             <p className="text-white/70 max-w-md mx-auto">{t('noArtistsMatching')}</p>
             <button onClick={() => { setActiveCategory('All'); setActiveContinent(null); setActiveCountry(null); }} className="mt-8 px-6 py-2.5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
                {t('clearFilters')}
             </button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6">
            {filteredArtists.map(artist => (
              <div key={artist.id} className="break-inside-avoid mb-4 md:mb-6">
                <ArtistCard 
                  artist={artist} 
                  tours={tours} 
                  onClick={(p) => {
                    sessionStorage.setItem('yira_return_to', 'list');
                    navigate(`${createPageUrl('ArtistProfile')}?p=${p.slug || p.id}`);
                  }} 
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <ContinentSelectionModal 
        isOpen={isContinentModalOpen}
        onClose={() => setIsContinentModalOpen(false)}
        onSelect={(continent) => {
           setActiveContinent(continent);
           setIsContinentModalOpen(false);
        }}
      />

      <CountrySelectionModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={(country) => {
           setActiveCountry(country);
           setIsCountryModalOpen(false);
        }}
        artists={artists}
        tours={tours}
      />

    </div>
  );
}