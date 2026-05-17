import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { getArtistState } from '@/components/utils/tourUtils';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/contexts/I18nContext';
import { normalizeSearchTerm, COUNTRY_ES_TO_EN, translateCountryToSpanish } from '@/components/utils/spanishToEnglish';

export default function CountrySelectionModal({ isOpen, onClose, onSelect, artists, tours }) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract distinct countries
  const availableCountries = useMemo(() => {
    const countries = new Set();
    if (artists && tours) {
      artists.forEach(p => {
        const pTours = tours.filter(t => t.artist_id === p.id);
        const state = getArtistState(pTours);
        let country = null;

        if (state.status === 'LIVE' && state.tour) {
          country = state.tour.country;
        } else if (state.status === 'TRANSIT' && state.lastTour) {
          country = state.lastTour.country;
        } else if (p.current_city) {
          const parts = p.current_city.split(',');
          if (parts.length > 1) {
            country = parts[parts.length - 1].trim();
          }
        }

        if (country) {
          countries.add(country);
        }
      });
    }
    return Array.from(countries).sort();
  }, [artists, tours]);

  const suggestions = useMemo(() => {
    if (debouncedSearch.length < 2) return [];
    const raw = debouncedSearch.toLowerCase();
    const normalized = normalizeSearchTerm(debouncedSearch).toLowerCase();
    
    // Find all potential English names that partially match the Spanish input
    const partialEnglishMatches = new Set();
    Object.entries(COUNTRY_ES_TO_EN).forEach(([esName, enName]) => {
      if (esName.includes(raw)) {
        partialEnglishMatches.add(enName.toLowerCase());
      }
    });

    return availableCountries.filter(c => {
      const cl = c.toLowerCase();
      if (cl.includes(raw) || cl.includes(normalized)) return true;
      
      for (const enName of partialEnglishMatches) {
        if (cl.includes(enName)) return true;
      }
      
      return false;
    });
  }, [debouncedSearch, availableCountries]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-3 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 flex-shrink-0">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">{t('selectCountry')}</h2>
              <p className="text-white/50 text-center text-sm mt-2">{t('filterArtistsCountry')}</p>
            </div>

            <Input
              autoFocus
              placeholder={t('typeCountryName')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
            />
          </div>

          <div className="overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 custom-scrollbar">
            {debouncedSearch.length < 2 ? (
              <p className="text-white/40 text-sm text-center">{t('type2Chars')}</p>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {suggestions.map(country => (
                  <button
                    key={country}
                    onClick={() => {
                      onSelect(country);
                      setSearch('');
                      setDebouncedSearch('');
                    }}
                    className="text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all text-white text-sm"
                  >
                    {lang === 'es' ? translateCountryToSpanish(country) : country}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm text-center px-4">
                {t('sceneNotArrived')}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}