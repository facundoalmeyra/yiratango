import React from 'react';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { useI18n } from '@/components/contexts/I18nContext';

export default function NotificationBell({ user }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email || user?.id],
    queryFn: () => base44.entities.Notification.filter({ fan_user_id: user?.email || user?.id }, '-created_date'),
    enabled: !!user,
    refetchInterval: 30000
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-all flex items-center justify-center text-white pointer-events-auto cursor-pointer">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-black"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-[#1A1A1A] border-white/10 p-0 text-white z-[60]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="font-semibold text-sm">{t('notificationsTitle')}</h3>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              {t('markAllRead')}
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/50 text-sm">
              {t('noNotifications')}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => {
                const isFollowerNotification = n.type === 'new_follower';
                const isFanRequest = n.type === 'fan_request';
                
                const translateMessage = (msg) => {
                  if (lang !== 'es') return msg;
                  let translated = msg;
                  translated = translated.replace('has scheduled a new tour', 'agendó una nueva gira');
                  translated = translated.replace('added a new date in', 'sumó una fecha en');
                  translated = translated.replace('updated their base location to', 'actualizó su ciudad base a');
                  translated = translated.replace('started following you!', '¡te empezó a seguir!');
                  translated = translated.replace('started following you', 'te empezó a seguir');
                  translated = translated.replace('wants you to visit', 'quiere que vayas a');
                  translated = translated.replace('requested you to visit their city', 'te pidió que visites su ciudad');
                  translated = translated.replace('requested you to visit', 'te pidió que visites');
                  return translated;
                };

                const translatedMsg = translateMessage(n.message);

                const NotificationContent = () => (
                  <div className={`p-3 flex gap-3 ${!n.is_read ? 'bg-white/5' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                      {n.artist_avatar ? (
                        <img src={n.artist_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-[#222]">
                          {n.artist_name?.substring(0,2).toUpperCase() || 'A'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs hover:text-white transition-colors block text-white/90 leading-tight">
                        {!isFollowerNotification ? (
                          <><span className="font-semibold text-white">{n.artist_name}</span> {translatedMsg.replace(n.artist_name, '').trim()}</>
                        ) : (
                          <>{translatedMsg}</>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1.5">
                        {n.created_date 
                          ? formatDistanceToNow(new Date(n.created_date), { 
                              addSuffix: true, 
                              locale: lang === 'es' ? es : undefined 
                            }) 
                          : t('justNow')}
                      </div>
                    </div>
                  </div>
                );

                const getLinkUrl = () => {
                  if (isFanRequest && n.link) return n.link;
                  if (n.link && n.link.startsWith('/artist')) {
                     return `${createPageUrl('ArtistProfile')}?p=${n.artist_slug}`;
                  }
                  return n.link || null;
                };

                const url = getLinkUrl();

                if (isFollowerNotification || !url) {
                   return (
                     <div key={n.id} onClick={() => { if(!n.is_read) markAsReadMutation.mutate(n.id); }} className="cursor-pointer">
                       <NotificationContent />
                     </div>
                   );
                }

                return (
                  <Link 
                    key={n.id}
                    to={url} 
                    onClick={() => { if(!n.is_read) markAsReadMutation.mutate(n.id); }}
                    className="block"
                  >
                    <NotificationContent />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}