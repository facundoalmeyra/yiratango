import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Globe, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import UserAvatar from '@/components/profile/UserAvatar';
import StatusAvatar from '@/components/profile/StatusAvatar';
import { getArtistState } from '@/components/utils/tourUtils';
import { useI18n } from '@/components/contexts/I18nContext';

export default function SearchBar({ artists, tours = [], onSelectArtist, onSearchStateChange, currentView = 'globe', activeCategory = 'All' }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    
    // 1. Filter Artists
    const matchedArtists = artists
      .filter(artist => {
        // Check if artist has a defined position (current)
        const hasPosition = artist.current_latitude != null && artist.current_longitude != null;
        
        // Check if artist has active tours (LIVE or TRANSIT)
        const artistTours = tours.filter(t => t.artist_id === artist.id);
        const state = getArtistState(artistTours);
        const hasActiveTour = state.status === 'LIVE' || state.status === 'TRANSIT' || state.status === 'UPCOMING';

        if (!hasPosition && !hasActiveTour) return false;

        const fullName = (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name
          ? `${artist.name} ${artist.partner_name}`.toLowerCase()
          : artist.name.toLowerCase();
        
        return fullName.includes(searchTerm);
      })
      .slice(0, 10);

    return matchedArtists;
  }, [query, artists]);

  const handleSelectResult = (result) => {
    onSelectArtist(result);
    setQuery('');
    setIsFocused(false);
    searchInputRef.current?.blur();
  };

  const showSuggestions = query.trim() && filteredResults.length > 0;
  const isInteracting = isFocused || query.trim() !== '';
  const positionTop = isDesktop || isInteracting;
  useEffect(() => {
    onSearchStateChange?.(isInteracting);
  }, [isInteracting, onSearchStateChange]);

  return (
    <>
      {/* Dark overlay when suggestions shown or focused - prevents map interaction */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setQuery('');
              setIsFocused(false);
              searchInputRef.current?.blur();
            }}
            className={`fixed inset-0 z-[60] ${isDesktop ? 'bg-black/40 backdrop-blur-sm' : 'bg-[#0F0F0F]'}`}
          />
        )}
      </AnimatePresence>

      <div className={
        isInteracting && !isDesktop
          ? "fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-[70] pointer-events-auto"
          : `relative z-[70] pointer-events-auto transition-all duration-300 ease-in-out ${isInteracting ? 'flex-1 min-w-0 md:max-w-[320px]' : 'w-[38px]'}`
      }>
        <div 
          onClick={() => {
            if (!isInteracting) {
              searchInputRef.current?.focus();
            }
          }}
          className={`flex items-center h-[38px] w-full ${isInteracting && !isDesktop ? 'bg-[#222222] border-white/20' : 'bg-black/40 border-white/10'} backdrop-blur-xl rounded-full border ${isInteracting ? 'px-4' : 'justify-center cursor-pointer'} shadow-xl hover:bg-white/10 focus-within:bg-white/10 transition-all duration-300 ease-in-out`}
        >
              <Search className="w-4 h-4 text-white flex-shrink-0" />
              <input
              ref={searchInputRef}
              type="text"
              placeholder={activeCategory === 'Maestro' ? t('searchMaestros') : activeCategory === 'DJ' ? t('searchDjs') : activeCategory === 'Musician' ? t('searchMusicians') : t('searchArtists')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                // Fix for iOS Safari scroll bug when element moves to top
                setTimeout(() => window.scrollTo(0, 0), 10);
                setTimeout(() => window.scrollTo(0, 0), 300);
              }}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className={`bg-transparent text-white placeholder-white/50 outline-none text-sm font-medium h-full transition-all duration-300 ease-in-out ${isInteracting ? 'flex-1 ml-2 min-w-0 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
              />
              {query && isInteracting && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuery('');
                    setIsFocused(false);
                    searchInputRef.current?.blur();
                  }}
                  className="text-white/50 hover:text-white transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions dropdown - absolutely positioned below search */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-full left-0 mt-2 max-h-[60vh] overflow-y-auto bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-xl flex flex-col ${isDesktop ? 'right-0' : 'w-[calc(100vw-2rem)] max-w-[360px]'}`}
                >
                  {filteredResults.map((result, idx) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-4 py-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 group last:border-b-0"
                    >
                      {result.type === 'place' ? (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-white" />
                          </div>
                      ) : (
                          <StatusAvatar
                              artist={result}
                              tours={tours}
                              size="md"
                          />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {result.type === 'place' ? result.name : (
                              (!result.category || result.category === 'Maestro') && result.profileType === 'Couple' && result.partner_name
                              ? `${result.name} & ${result.partner_name}`
                              : result.name
                          )}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {result.type === 'place' ? (result.subtype === 'country' ? 'Country' : 'City') : result.current_city}
                        </p>
                      </div>

                      {result.type !== 'place' && (
                          (!result.category || result.category === 'Maestro') && result.profileType === 'Couple' ? (
                          <span className="text-[10px] border border-white/20 text-white/60 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 tracking-wide font-medium uppercase">COUPLE</span>
                          ) : (!result.category || result.category === 'Maestro') && result.profileType === 'Solo' ? (
                          <span className="text-[10px] border border-white/20 text-white/60 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 tracking-wide font-medium uppercase">MAESTRO</span>
                          ) : (
                          <span className="text-[10px] border border-white/20 text-white/60 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 tracking-wide font-medium uppercase">{result.category}</span>
                          )
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
      </div>
    </>
  );
}