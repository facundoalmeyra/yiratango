import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, X, Filter, Menu, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isTourActive, getArtistState, getContinent } from '@/components/utils/tourUtils';
import { translateCountryToSpanish } from '@/components/utils/spanishToEnglish';
import Globe3D from '@/components/map/Globe3D';
import ContinentSelectionModal from '@/components/map/ContinentSelectionModal';
import CountrySelectionModal from '@/components/map/CountrySelectionModal';
import ArtistBottomSheet from '@/components/map/ArtistBottomSheet';
import ClusterBottomSheet from '@/components/map/ClusterBottomSheet';
import SearchBar from '@/components/map/SearchBar';


import Logo from '@/components/ui/Logo';
import Loader from '@/components/ui/Loader';
import SEO from '@/components/seo/SEO';
import { useI18n } from '@/components/contexts/I18nContext';
import { toast } from 'sonner';
import ArtistProfile from './ArtistProfile';
import UserMenu from '@/components/navigation/UserMenu';
import WelcomeModal from '@/components/map/WelcomeModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { id: 'All', label: 'Filter' },
  { id: 'Maestro', label: 'Only Maestros' },
  { id: 'DJ', label: "Only DJ's" },
  { id: 'Musician', label: 'Only Musicians' },
  { id: 'Orchestra', label: 'Only Orchestras' }
];

export default function Map() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const pParam = params.get('p');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [bgLoaded, setBgLoaded] = useState(false);

  // All hooks must be declared before any early return
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [isClusterSheetOpen, setIsClusterSheetOpen] = useState(false);
  const [zoomToArtistTrigger, setZoomToArtistTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [artistProfile, setArtistProfile] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hasInitialZoomed, setHasInitialZoomed] = useState(false);
  const [resetZoomTrigger, setResetZoomTrigger] = useState(0);
  const [zoomToUserTrigger, setZoomToUserTrigger] = useState(0);
  const [zoomToContinentTrigger, setZoomToContinentTrigger] = useState(0);
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

  const [zoomToCountryTrigger, setZoomToCountryTrigger] = useState(0);
  const [isContinentModalOpen, setIsContinentModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [hasFanProfile, setHasFanProfile] = useState(false);
  const [showFanWelcome, setShowFanWelcome] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('yira_show_fan_welcome') === 'true') {
      setShowFanWelcome(true);
      sessionStorage.removeItem('yira_show_fan_welcome');
    }
    if (sessionStorage.getItem('yira_account_deleted') === '1') {
      sessionStorage.removeItem('yira_account_deleted');
      toast.success(t('accountDeleted'));
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate(`/${lang}/ProfileSettings?tab=account&changePassword=true`);
      }
    });
    return () => subscription.unsubscribe();
  }, [lang, navigate]);

  // Detect mobile/desktop and preload background
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Preload background image
    const bgUrl = isMobile 
      ? 'https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/9444476b4_mobile.jpeg'
      : 'https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/aa96e200c_newdesktop.jpeg';
    
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = bgUrl;
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

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
    sessionStorage.setItem('yira_return_to', 'globe');
  }, []);

  const handleLogoClick = useCallback(() => {
    setResetZoomTrigger(prev => prev + 1);
    setSelectedArtist(null);
    setIsSheetOpen(false);
    setIsClusterSheetOpen(false);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
        // Not logged in → show the map anyway (public access)
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const queryClient = useQueryClient();

  const { data: fans = [], isLoading: loadingFans, isRefetching: refetchingFans } = useQuery({
    queryKey: ['fans_check', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('fans').select('*').eq('user_id', user?.id);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('zoomToProfile') === 'true' || params.get('refetch') === 'true' || params.get('zoomToUser') === 'true') {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    }
  }, [queryClient]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('zoomToUser') === 'true') {
      setZoomToUserTrigger(prev => prev + 1);
      // Don't set hasInitialZoomed here - let it be managed separately
    }
  }, []);

  // Refetch tours when returning from ProfileSettings after adding a date
  useEffect(() => {
    const hasZoomed = sessionStorage.getItem('yira_has_zoomed_to_user');
    if (!hasZoomed) {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    }
  }, [queryClient]);

  const { data: artists = [], isLoading: loadingArtists, isRefetching: refetchingArtists } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
  const { data } = await supabase.from('artists').select('*');
  return data || [];
},
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('m') || params.get('maestroId') || params.get('artistId');

    if (paramId && !loadingArtists && artists.length > 0 && !hasInitialZoomed) {
      const targetArtist = artists.find(m => m.id === paramId || m.slug === paramId);
      if (targetArtist) {
        setSelectedArtist(targetArtist);
        if (activeCategory !== 'All' && activeCategory !== (targetArtist.category || 'Maestro')) {
          setActiveCategory(targetArtist.category || 'Maestro');
        }
        setZoomToArtistTrigger(prev => prev + 1);
        if (params.get('nomodal') !== 'true') {
          setIsSheetOpen(true);
        }
        setHasInitialZoomed(true);
      }
    }
  }, [artists, loadingArtists, hasInitialZoomed]);

  const structuredData = selectedArtist ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": selectedArtist.name,
    "description": selectedArtist.bio,
    "image": selectedArtist.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/d74c463db_favicon2.png",
    "jobTitle": "Artist"
  } : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Yira Tango",
    "applicationCategory": "TravelApplication",
    "operatingSystem": "Web",
    "description": "Interactive 3D map to find Tango Artists, Workshops & Milongas Near You.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const { data: tours = [], isRefetching: refetchingTours } = useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
  const { data } = await supabase.from('tours').select('*');
  return data || [];
},
    staleTime: 1000 * 60 * 5,
  });

  const calculatedProfile = user ? artists.find(m => 
    m.created_by === (user.email || user.id) || 
    m.claimed_by_user_id === (user.email || user.id)
  ) : null;
  const calculatedHasFanProfile = user && fans.length > 0;

  const { data: unreadRequests = [] } = useQuery({
    queryKey: ['unread_visit_requests_map', calculatedProfile?.id],
    queryFn: async () => {
  const { data } = await supabase.from('visit_requests').select('*').eq('artist_id', calculatedProfile.id).eq('status', 'unread');
  return data || [];
},
    enabled: !!calculatedProfile?.id,
  });
  const hasUnreadRequests = unreadRequests.length > 0;

  useEffect(() => {
    const isDataReady = !loadingUser && !loadingArtists && !refetchingArtists && !refetchingTours && (!user || !loadingFans);
    if (isDataReady) {
      const profile = user ? artists.find(m => m.created_by === user.email || m.created_by === user.id) : null;
      if (profile) setArtistProfile(profile);
      if (user && !profile && fans.length > 0) setHasFanProfile(true);

      if (!hasInitialZoomed) {
        const fromProfile = sessionStorage.getItem('yira_from_profile') === 'true';
        const hasZoomed = sessionStorage.getItem('yira_has_zoomed_to_user') === 'true';
        const refetch = new URLSearchParams(window.location.search).get('refetch') === 'true';
        const paramId = new URLSearchParams(window.location.search).get('m') || new URLSearchParams(window.location.search).get('maestroId') || new URLSearchParams(window.location.search).get('artistId');

        if (fromProfile) {
          sessionStorage.removeItem('yira_from_profile');
          if (!paramId) setZoomToUserTrigger(prev => prev + 1);
          setHasInitialZoomed(true);
        } else if (!hasZoomed || refetch) {
          sessionStorage.setItem('yira_has_zoomed_to_user', 'true');
          if (profile) {
            const hasActiveTour = tours.some(t => (t.artist_id === profile.id || t.artist_id === profile.slug) && isTourActive(t));
            const hasLocation = (profile.current_latitude != null && profile.current_longitude != null) || hasActiveTour;
            if (hasLocation) {
              if (activeCategory !== 'All' && activeCategory !== (profile.category || 'Maestro')) {
                setActiveCategory(profile.category || 'Maestro');
              }
            }
          }
          if (!paramId) setZoomToUserTrigger(prev => prev + 1);
          setHasInitialZoomed(true);
        }
      }
    }
  }, [user, artists, loadingArtists, refetchingArtists, refetchingTours, tours, hasInitialZoomed, activeCategory]);

  const selectedArtistTours = useMemo(() => {
    if (!selectedArtist) return [];
    return tours.filter(t => t.artist_id === selectedArtist.id || t.artist_id === selectedArtist.slug);
  }, [selectedArtist, tours]);

  const filteredArtists = useMemo(() => {
    // Live-only model: only show artists with active or future tour dates
    let result = artists.filter(p => {
      const pTours = tours.filter(t => t.artist_id === p.id || t.artist_id === p.slug);
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
        const pTours = tours.filter(t => t.artist_id === p.id || t.artist_id === p.slug);
        const state = getArtistState(pTours);
        let lat = p.current_latitude;
        let lng = p.current_longitude;
        let country = null;
        if (state.status === 'LIVE') {
          lat = state.tour.latitude; lng = state.tour.longitude; country = state.tour.country;
        } else if (state.status === 'TRANSIT') {
          lat = state.lastTour.latitude; lng = state.lastTour.longitude; country = state.lastTour.country;
        } else if (state.status === 'UPCOMING') {
          lat = state.nextTour.latitude; lng = state.nextTour.longitude; country = state.nextTour.country;
        } else if (p.current_city) {
          const parts = p.current_city.split(',');
          if (parts.length > 1) country = parts[parts.length - 1].trim();
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
    // Apply live-only pre-filter
    const liveArtists = artists.filter(p => {
      const pTours = tours.filter(t => t.artist_id === p.id || t.artist_id === p.slug);
      return pTours.some(t => {
        const end = new Date(t.end_date || t.date);
        end.setHours(0, 0, 0, 0);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        return end >= now;
      });
    });
    if (!activeContinent && !activeCountry) return liveArtists;
    return liveArtists.filter(p => {
      const pTours = tours.filter(t => t.artist_id === p.id || t.artist_id === p.slug);
      const state = getArtistState(pTours);
      let lat = p.current_latitude;
      let lng = p.current_longitude;
      let country = null;
      if (state.status === 'LIVE') {
        lat = state.tour.latitude; lng = state.tour.longitude; country = state.tour.country;
      } else if (state.status === 'TRANSIT') {
        lat = state.lastTour.latitude; lng = state.lastTour.longitude; country = state.lastTour.country;
      } else if (state.status === 'UPCOMING') {
        lat = state.nextTour.latitude; lng = state.nextTour.longitude; country = state.nextTour.country;
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

  const handleArtistSelect = (artist) => {
    setSelectedArtist(artist);
    setIsSheetOpen(true);
    setIsClusterSheetOpen(false);
  };

  const handleClusterSelect = (artists) => {
    setSelectedCluster(artists);
    setIsClusterSheetOpen(true);
  };

  const handleSearchSelect = (result) => {
    setSelectedArtist(result);
    setZoomToArtistTrigger(prev => prev + 1);
    if (result.type !== 'place') {
      setTimeout(() => setIsSheetOpen(true), 1100);
    }
  };

  useEffect(() => {
    if (loadingUser || loadingArtists || refetchingArtists || loadingFans || refetchingFans) return;
    if (!user) return;

    // Only redirect users with no profile — everyone else (artists + fans) stays on the map
    if (!calculatedProfile && !calculatedHasFanProfile) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [loadingUser, loadingArtists, refetchingArtists, loadingFans, refetchingFans, user, calculatedProfile, calculatedHasFanProfile, navigate]);

  // Early return AFTER all hooks
  if (pParam) return <ArtistProfile />;

  const bgUrl = isMobile 
    ? 'https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/9444476b4_mobile.jpeg'
    : 'https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/aa96e200c_newdesktop.jpeg';

  return (
    <div 
      className="fixed inset-0 overflow-hidden transition-opacity duration-700"
      style={{ 
        background: `url(${bgUrl}) center/cover no-repeat`,
        opacity: bgLoaded ? 1 : 0.1,
      }}
    >
      <AnimatePresence>
        {(loadingUser || (user && (loadingArtists || loadingFans || (!calculatedProfile && !calculatedHasFanProfile)))) && (
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
        title={selectedArtist ? `${selectedArtist.name} | Yira Tango` : "Yira Tango – Find Milongas, Workshops & Artists"} 
        description={selectedArtist ? `Check out ${selectedArtist.name}'s profile and tour dates on Yira Tango.` : "Discover Tango artists, workshops & milongas near you with an interactive 3D map. Explore the global tango community and never miss an event."}
        image={selectedArtist?.avatar_url}
        canonicalUrl={selectedArtist ? `${window.location.origin}${createPageUrl('ArtistProfile')}?p=${selectedArtist.slug || selectedArtist.id}` : `${window.location.origin}${createPageUrl('Map')}`}
        structuredData={structuredData}
      />

      {/* Halo Background */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, rgba(15,15,15,0) 50%)'
        }}
      />

      {/* 3D Globe Layer */}
      <div className="absolute inset-0 z-0">
        <Globe3D
          artists={filteredArtists}
          selectedArtist={selectedArtist}
          onArtistSelect={handleArtistSelect}
          onClusterSelect={handleClusterSelect}
          tours={tours}
          zoomToArtistTrigger={zoomToArtistTrigger}
          resetZoomTrigger={resetZoomTrigger}
          zoomToUserTrigger={zoomToUserTrigger}
          zoomToContinentTrigger={zoomToContinentTrigger}
          zoomToCountryTrigger={zoomToCountryTrigger}
          userProfile={artistProfile}
          activeContinent={activeContinent}
          activeCountry={activeCountry}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-40 md:h-80 bg-gradient-to-b from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 md:h-64 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent pointer-events-none z-10" />

      {/* UI Layer */}
      <div className={`absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-4 right-4 z-50 flex flex-col gap-3 md:gap-5 pointer-events-none transition-opacity duration-300`}>
        <div className="flex items-start justify-between w-full">
          <div
            className="pointer-events-auto cursor-pointer flex items-center gap-3"
            onClick={handleLogoClick}
            title="Reset View"
          >
            <Logo width={64} height={33} className="text-white hover:opacity-80 transition-opacity" />
          </div>

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
            currentView="globe"
            artists={filteredArtists}
            tours={tours}
            onSelectArtist={handleSearchSelect}
            onSearchStateChange={setIsSearchActive}
            activeCategory={activeCategory}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-end w-full">
          <span className="font-['JetBrains_Mono',_monospace] font-medium text-[9px] uppercase text-white/40 leading-tight">
            {lang === 'es' ? 'Que al mundo nada le importa. Yira, yira.' : 'Let the world keep turning. Yira, yira.'}
          </span>
          <span className="font-['JetBrains_Mono',_monospace] font-medium text-[9px] uppercase text-white/40 leading-tight text-right">
            {lang === 'es' ? '2026 | Copyright | yira, Todos los derechos reservados' : '2026 | Copyright | yira, All rights reserved'}
          </span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <ArtistBottomSheet
        artist={selectedArtist}
        tours={selectedArtistTours}
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setSelectedArtist(null);
        }}
      />

      {/* Cluster Bottom Sheet */}
      <ClusterBottomSheet
        artists={selectedCluster}
        tours={tours}
        isOpen={isClusterSheetOpen}
        onClose={() => {
          setIsClusterSheetOpen(false);
          setSelectedCluster(null);
        }}
        onArtistSelect={handleArtistSelect}
      />

      <ContinentSelectionModal 
        isOpen={isContinentModalOpen}
        onClose={() => setIsContinentModalOpen(false)}
        onSelect={(continent) => {
          setActiveContinent(continent);
          setZoomToContinentTrigger(prev => prev + 1);
          setIsContinentModalOpen(false);
        }}
      />

      <WelcomeModal />

      <CountrySelectionModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={(country) => {
          setActiveCountry(country);
          setZoomToCountryTrigger(prev => prev + 1);
          setIsCountryModalOpen(false);
        }}
        artists={artists}
        tours={tours}
      />

      {/* SEO Internal Linking Directory */}
      <section className="sr-only">
        <h2>Tango Artists and Maestros Directory</h2>
        <ul>
          {artists.map(p => (
            <li key={p.id}>
              <Link to={`${createPageUrl('ArtistProfile')}?p=${p.slug || p.id}`}>
                {p.name} {p.partner_name ? `& ${p.partner_name}` : ''} - {p.category || 'Maestro'} {p.current_city ? `in ${p.current_city}` : ''}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AnimatePresence>
        {showFanWelcome && (
          <motion.div
            key="fan-welcome-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center bg-[#111111] border border-white/10 rounded-2xl shadow-2xl relative max-w-sm w-full"
            >
              <div className="w-16 h-16 bg-[#00C2D4]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-[#00C2D4]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{t('amazing')}</h2>
              <p className="text-white/70 mb-8 leading-relaxed text-lg">
                {t('worldAtFingertips')}
              </p>
              <button 
                onClick={() => setShowFanWelcome(false)}
                className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                {t('letsGo')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}