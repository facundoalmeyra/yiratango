import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Plane } from 'lucide-react';
import { getArtistState } from '@/components/utils/tourUtils';
import UserAvatar from '@/components/profile/UserAvatar';
import StatusAvatar from '@/components/profile/StatusAvatar';
import { useI18n } from '@/components/contexts/I18nContext';

export default function ClusterBottomSheet({ isOpen, onClose, artists, tours, onArtistSelect }) {
  const { t } = useI18n();
  const sortedArtists = useMemo(() => {
    if (!artists) return [];

    return [...artists].sort((a, b) => {
      const aTours = tours.filter(t => t.artist_id === a.id);
      const bTours = tours.filter(t => t.artist_id === b.id);
      
      const aState = getArtistState(aTours);
      const bState = getArtistState(bTours);

      const statusOrder = { 'LIVE': 1, 'TRANSIT': 2, 'HOME': 3 };
      
      if (statusOrder[aState.status] !== statusOrder[bState.status]) {
        return statusOrder[aState.status] - statusOrder[bState.status];
      }

      // Alphabetical
      return (a.name || '').localeCompare(b.name || '');
    }).map(artist => {
      const pTours = tours.filter(t => t.artist_id === artist.id);
      return { artist, state: getArtistState(pTours) };
    });
  }, [artists, tours]);

  const locationName = useMemo(() => {
    if (sortedArtists.length === 0) return '';
    const { artist, state } = sortedArtists[0];
    
    if (state.status === 'LIVE' && state.tour) {
      return state.tour.city + (state.tour.country ? `, ${state.tour.country}` : '');
    } else if (state.status === 'TRANSIT' && state.lastTour) {
      return state.lastTour.city + (state.lastTour.country ? `, ${state.lastTour.country}` : '');
    } else if (artist.current_city) {
      return artist.current_city;
    }
    return 'Location';
  }, [sortedArtists]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 10 || info.velocity.y > 50) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-[#111111] rounded-t-3xl shadow-xl max-h-[85vh] flex flex-col border-t border-white/10"
          >
            <div className="flex justify-center p-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 flex-shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-white" />
                {locationName}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
              {sortedArtists.map(({ artist, state }) => (
                <div
                  key={artist.id}
                  onClick={() => onArtistSelect(artist)}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <StatusAvatar 
                    artist={artist} 
                    status={state.status}
                    size="lg"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base truncate">
                      {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name 
                        ? `${artist.name} & ${artist.partner_name}` 
                        : artist.name}
                    </h3>
                    <p className="text-white/50 text-sm truncate">{artist.category === 'Musician' ? t('musicianLabel') || 'Musician' : (artist.category || 'Maestro')}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {state.status === 'LIVE' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C2D4] bg-[#00C2D4]/10 px-2 py-1 rounded-full whitespace-nowrap">
                        <MapPin className="w-3 h-3" /> LIVE
                      </span>
                    ) : state.status === 'TRANSIT' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded-full">
                        <Plane className="w-3 h-3" /> {t('inTransit').toUpperCase()}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}