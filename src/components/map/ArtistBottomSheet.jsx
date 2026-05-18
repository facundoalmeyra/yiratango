import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, Instagram, Facebook, MessageCircle, Globe, MapPin, Calendar, User, Users, Plane, Radio, ExternalLink, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { isTourActive, isTourOngoing, getArtistState } from '@/components/utils/tourUtils';
import StatusAvatar from '@/components/profile/StatusAvatar';
import FollowButton from '@/components/profile/FollowButton';
import { useI18n } from '@/components/contexts/I18nContext';
import TabBar from '@/components/ui/TabBar';

export default function ArtistBottomSheet({ artist, tours, isOpen, onClose }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Early return AFTER all hooks
  if (!artist) return null;

  const sortedTours = tours ? [...tours]
    .filter(t => {
      const dateToCheck = t.start_date || t.date;
      return dateToCheck && !isNaN(new Date(dateToCheck).getTime());
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_date || a.date);
      const dateB = new Date(b.start_date || b.date);
      return dateA - dateB;
    }) : [];

  const state = getArtistState(sortedTours);

  const upcomingTours = sortedTours.filter(t => {
      const now = new Date();
      now.setHours(0,0,0,0);
      const end = new Date(t.end_date || t.date);
      end.setHours(0,0,0,0);
      return end >= now;
  });

  const pastTours = sortedTours.filter(t => {
      const now = new Date();
      now.setHours(0,0,0,0);
      const end = new Date(t.end_date || t.date);
      end.setHours(0,0,0,0);
      return end < now;
  }).reverse();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 10 || info.velocity.y > 50) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[50vh] flex flex-col overflow-hidden"
          >
            <div className="bg-white text-black rounded-t-3xl flex flex-col h-full overflow-hidden">
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-black/20 rounded-full" />
              </div>

              {/* Header: full-height avatar + artist info */}
              <div className="flex items-stretch gap-0 flex-shrink-0 px-4 pt-1 pb-3">
                {/* Avatar fills full height of header block */}
                <div className="flex-shrink-0 mr-4">
                  {artist.avatar_url ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={artist.avatar_url}
                        alt={artist.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    <StatusAvatar
                      artist={artist}
                      status={state.status}
                      size="xl"
                      baseBorderColor="border-black/10"
                    />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-0.5">
                      {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name 
                        ? `${artist.name} & ${artist.partner_name}` 
                        : artist.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-black/60" />
                      <span className="text-sm text-black/70">
                        {state.status === 'LIVE' ? state.tour.city : 
                         state.status === 'TRANSIT' ? `${state.lastTour?.city} → ${state.nextTour?.city}` : 
                         state.status === 'UPCOMING' ? state.nextTour?.city :
                         artist.current_city || 'No location set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-white shadow-sm border border-black/10 text-black/80 text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <Users className="w-3 h-3" />
                          {t('couple')}
                        </span>
                      ) : (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Solo' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-white shadow-sm border border-black/10 text-black/80 text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <User className="w-3 h-3" />
                          MAESTRO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-white shadow-sm border border-black/10 text-black/80 text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <User className="w-3 h-3" />
                          {artist.category === 'Musician' ? t('musicianLabel') || 'Musician' : artist.category}
                        </span>
                      )}
                      {state.status === 'LIVE' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00C2D4]/20 border border-[#00C2D4]/50 text-black text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <Radio className="w-3 h-3" />
                          LIVE
                        </span>
                      ) : state.status === 'TRANSIT' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-black/10 border border-black/20 text-black/60 text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <Plane className="w-3 h-3" />
                          {t('inTransit')} • {state.daysUntil} D
                        </span>
                      ) : state.status === 'UPCOMING' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-white shadow-sm border border-black/10 text-black/80 text-[9px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                          <Calendar className="w-3 h-3" />
                          {t('upcomingTag')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-shrink-0 ml-2">
                  <div className="hidden md:flex items-center gap-2">
                    <FollowButton artistId={artist.id} theme="light" />
                    <button
                      onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/functions/go?p=${artist.slug || artist.id}`);
                          toast.success(t('linkCopied'));
                      }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 transition-colors"
                      title={t('share')}
                    >
                        <Share2 className="w-4 h-4 text-black" />
                    </button>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-black/10 transition-colors -mr-2"
                  >
                    <X className="w-5 h-5 text-black/60" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto flex-1">

                <div className="mb-3 md:hidden flex items-center gap-2">
                  <FollowButton artistId={artist.id} theme="light" className="!w-full flex-1" />
                  <button
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/functions/go?p=${artist.slug || artist.id}`);
                        toast.success(t('linkCopied'));
                    }}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-black/5 active:bg-black/10 border border-black/10 transition-colors flex-shrink-0"
                    title={t('share')}
                  >
                      <Share2 className="w-5 h-5 text-black" />
                  </button>
                </div>

                {artist.bio && (
                  <p className="text-black/70 text-sm leading-relaxed mb-4 font-light">
                    {artist.bio}
                  </p>
                )}

                <div className="flex flex-row flex-nowrap justify-between md:justify-start items-center gap-1 md:gap-6 mb-1 w-full overflow-hidden px-1">
                  {artist.instagram_url && (
                    <a
                      href={artist.instagram_url.startsWith('http') ? artist.instagram_url : `https://instagram.com/${artist.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-1 sm:p-2 hover:bg-black/5 transition-colors flex-1 md:flex-none min-w-0"
                    >
                      <Instagram className="w-4 h-4 text-black/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-black/60 truncate w-full text-center">Instagram</span>
                    </a>
                  )}
                  {artist.facebook_url && (
                    <a
                      href={artist.facebook_url.startsWith('http') ? artist.facebook_url : `https://facebook.com/${artist.facebook_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-1 sm:p-2 hover:bg-black/5 transition-colors flex-1 md:flex-none min-w-0"
                    >
                      <Facebook className="w-4 h-4 text-black/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-black/60 truncate w-full text-center">Facebook</span>
                    </a>
                  )}
                  {artist.whatsapp_number && (
                    <a
                      href={`https://wa.me/${artist.whatsapp_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-1 sm:p-2 hover:bg-black/5 transition-colors flex-1 md:flex-none min-w-0"
                    >
                      <MessageCircle className="w-4 h-4 text-black/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-black/60 truncate w-full text-center">WhatsApp</span>
                    </a>
                  )}
                  {artist.website_url && (
                    <a
                      href={artist.website_url.startsWith('http') ? artist.website_url : `https://${artist.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-1 sm:p-2 hover:bg-black/5 transition-colors flex-1 md:flex-none min-w-0"
                    >
                      <Globe className="w-4 h-4 text-black/70 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-black/60 truncate w-full text-center">Website</span>
                    </a>
                  )}
                  <Link
                    to={createPageUrl('ArtistProfile') + `?p=${artist.slug || artist.id}`}
                    className="flex flex-col items-center gap-1 p-1 sm:p-2 hover:bg-black/5 transition-colors flex-1 md:flex-none min-w-0"
                  >
                    <ExternalLink className="w-4 h-4 text-black/70 flex-shrink-0" />
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-black/60 truncate w-full text-center">{t('fullProfile')}</span>
                  </Link>
                </div>

                {(upcomingTours.length > 0 || pastTours.length > 0) && (
                  <div className="pt-4 border-t border-black/10 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                       <Calendar className="w-4 h-4 text-black" />
                       <h3 className="text-sm font-semibold text-black">{t('tourDates')}</h3>
                    </div>
                    
                    <TabBar
                        className="mb-4"
                        theme="light"
                        fullWidth={false}
                        layoutId="tourTabIndicatorBottomSheet"
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { key: 'upcoming', label: t('upcoming') },
                            { key: 'past',     label: t('past') },
                        ]}
                    />

                    <div className="space-y-3">
                      {(activeTab === 'upcoming' ? upcomingTours : pastTours).length > 0 ? (
                        (activeTab === 'upcoming' ? upcomingTours : pastTours).map((tour) => {
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
                              className={`flex items-center gap-4 p-4 rounded-xl bg-black/5 border border-black/5 transition-colors group ${tour.event_link ? 'hover:bg-black/10 cursor-pointer' : ''}`}
                            >
                              <div className="w-14 text-center flex-shrink-0">
                                <div className="text-xs font-bold text-black/50 uppercase tracking-wide">
                                  {format(new Date(tour.start_date || tour.date), 'MMM')}
                                </div>
                                <div className="text-xl font-bold text-black">
                                  {format(new Date(tour.start_date || tour.date), 'dd')}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 border-l border-black/10 pl-4">
                                <h4 className="font-bold text-black text-base truncate">
                                  {tour.city}, {tour.country}
                                </h4>
                                <div className="text-xs text-black/50 mt-0.5">
                                  {tour.start_date !== tour.end_date 
                                    ? `${format(new Date(tour.start_date), 'MMM d')} - ${format(new Date(tour.end_date), 'MMM d, yyyy')}`
                                    : format(new Date(tour.start_date), 'MMM d, yyyy')
                                  }
                                </div>
                              </div>

                              {tour.event_link && (
                                <div className="flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity pl-2">
                                  <ExternalLink className="w-5 h-5 text-black" />
                                </div>
                              )}
                            </CardWrapper>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 px-4 border border-dashed border-black/10 rounded-xl bg-black/5">
                            <p className="text-black/50 text-xs">
                              {activeTab === 'upcoming' ? t('noUpcomingTours') : t('noPastTours')}
                            </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>{/* end scrollable body */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}