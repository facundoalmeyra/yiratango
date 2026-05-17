import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Trash2, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/contexts/I18nContext';

function RequestGroup({ title, icon: Icon, requests, emptyMessage, onDeleteAll, onDeleteOne, confirmingDeleteAll, setConfirmingDeleteAll, isPendingDeleteAll, isPendingDeleteOne }) {
  const { t } = useI18n();

  const groupedByCity = requests.reduce((acc, req) => {
    if (!acc[req.city]) acc[req.city] = [];
    acc[req.city].push(req);
    return acc;
  }, {});
  const sortedCities = Object.keys(groupedByCity).sort((a, b) => groupedByCity[b].length - groupedByCity[a].length);

  if (confirmingDeleteAll) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 py-16">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-2">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-white">{t('deleteAllTitle')}</h3>
        <p className="text-white/60">{t('deleteAllDesc')}</p>
        <div className="flex gap-4 w-full max-w-sm mt-8">
          <Button variant="outline" className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5" onClick={() => setConfirmingDeleteAll(false)}>
            {t('cancelBtn')}
          </Button>
          <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={onDeleteAll} disabled={isPendingDeleteAll}>
            {t('confirmBtn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4 px-6 pt-5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/60" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold text-white/70">{requests.length}</span>
        </div>
        {requests.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDeleteAll(true)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
            {t('deleteAll')}
          </Button>
        )}
      </div>

      <div className="px-6 pb-4">
        {requests.length === 0 ? (
          <p className="text-white/40 text-sm">{emptyMessage}</p>
        ) : (
          sortedCities.map(city => (
            <div key={city} className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <MapPin className="w-4 h-4 text-white" />
                <h5 className="font-bold text-white">{city}</h5>
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold text-white/70 ml-1">{groupedByCity[city].length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {groupedByCity[city].map(req => (
                  <div key={req.id} className={`flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors ${req.status === 'unread' ? 'ring-1 ring-white/20' : ''}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                      {req.fan_avatar_url ? (
                        <img src={req.fan_avatar_url} alt={req.fan_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 font-bold text-xs">
                          {(req.fan_name || 'U').substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{req.fan_name}</p>
                      <p className="text-xs text-white/40 truncate">{t('requested')}</p>
                    </div>
                    <button
                      onClick={() => onDeleteOne(req.id)}
                      disabled={isPendingDeleteOne}
                      className="p-2 text-white/40 md:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-white md:hover:text-red-300 hover:bg-white/10 md:hover:bg-red-500/20 rounded-full transition-all flex-shrink-0"
                      title="Delete request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ArtistVisitRequests({ artistId }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [confirmingDeleteFans, setConfirmingDeleteFans] = useState(false);
  const [confirmingDeleteOrganizers, setConfirmingDeleteOrganizers] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['visit_requests_for_artist', artistId],
    queryFn: () => base44.entities.VisitRequest.filter({ artist_id: artistId }, '-created_date'),
    enabled: !!artistId,
  });

  // Split by request_type — default to 'visit' for legacy records without request_type
  const fanRequests = requests.filter(r => !r.request_type || r.request_type === 'visit');
  const organizerRequests = requests.filter(r => r.request_type === 'collaboration');

  const unreadRequests = requests.filter(r => r.status === 'unread');

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unreadRequests.map(req =>
        base44.entities.VisitRequest.update(req.id, { status: 'read' })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visit_requests_for_artist', artistId] })
  });

  useEffect(() => {
    if (unreadRequests.length > 0) markAsReadMutation.mutate();
  }, [unreadRequests.length]);

  const deleteAllFansMutation = useMutation({
    mutationFn: async () => { await Promise.all(fanRequests.map(r => base44.entities.VisitRequest.delete(r.id))); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visit_requests_for_artist', artistId] }); setConfirmingDeleteFans(false); }
  });

  const deleteAllOrganizersMutation = useMutation({
    mutationFn: async () => { await Promise.all(organizerRequests.map(r => base44.entities.VisitRequest.delete(r.id))); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visit_requests_for_artist', artistId] }); setConfirmingDeleteOrganizers(false); }
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id) => { await base44.entities.VisitRequest.delete(id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visit_requests_for_artist', artistId] })
  });

  if (isLoading) return null;

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden mb-8">
      <div className="p-6 border-b border-white/10 flex-shrink-0">
        <h3 className="text-xl font-bold text-white">{t('requestsTab')}</h3>
        <p className="text-white/50 text-sm mt-1">{requests.length} {t('totalRequests')}</p>
      </div>

      {/* Fan Requests Section */}
      <RequestGroup
        title={t('fanRequests')}
        icon={Users}
        requests={fanRequests}
        emptyMessage={t('noVisitRequests')}
        onDeleteAll={() => deleteAllFansMutation.mutate()}
        onDeleteOne={(id) => deleteOneMutation.mutate(id)}
        confirmingDeleteAll={confirmingDeleteFans}
        setConfirmingDeleteAll={setConfirmingDeleteFans}
        isPendingDeleteAll={deleteAllFansMutation.isPending}
        isPendingDeleteOne={deleteOneMutation.isPending}
      />

      {/* Divider */}
      <div className="border-t border-white/10 mx-6" />

      {/* Organizer Requests Section */}
      <RequestGroup
        title={t('organizerRequests')}
        icon={Briefcase}
        requests={organizerRequests}
        emptyMessage={t('noOrganizerRequests')}
        onDeleteAll={() => deleteAllOrganizersMutation.mutate()}
        onDeleteOne={(id) => deleteOneMutation.mutate(id)}
        confirmingDeleteAll={confirmingDeleteOrganizers}
        setConfirmingDeleteAll={setConfirmingDeleteOrganizers}
        isPendingDeleteAll={deleteAllOrganizersMutation.isPending}
        isPendingDeleteOne={deleteOneMutation.isPending}
      />
    </div>
  );
}