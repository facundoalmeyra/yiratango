import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Pencil, Check, X, Loader2, Users, Heart, User as UserIcon, Briefcase, Send
} from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import UserAvatar from '@/components/profile/UserAvatar';
import Loader from '@/components/ui/Loader';
import { Input } from '@/components/ui/input';
import CityAutocomplete from '@/components/location/CityAutocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import NotificationBell from '@/components/notifications/NotificationBell';
import ChangePasswordSection from '@/components/profile/ChangePasswordSection';
import TabBar from '@/components/ui/TabBar';

function EditFanProfileForm({ user, fanProfile, onSave, onCancel, onDelete, isSaving }) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: fanProfile?.name || user.user_metadata?.full_name || '',
    avatar_url: fanProfile?.avatar_url || user.user_metadata?.avatar_url || '',
    city: fanProfile?.city || '',
    latitude: fanProfile?.latitude || null,
    longitude: fanProfile?.longitude || null,
    discovery_radius: fanProfile?.discovery_radius || 50
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { toast.error(t('maxSize30MB')); return; }

    try {
      setUploadingImage(true);
      const resizedFile = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const MAX = 500;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } } 
            else { if (h > MAX) { w *= MAX/h; h = MAX; } }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => {
              if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() }));
              else reject(new Error('Canvas to Blob failed'));
            }, 'image/webp', 0.8);
          };
          img.onerror = () => reject(new Error('Image load failed'));
        };
        reader.onerror = () => reject(new Error('File read failed'));
      });

      const fileName = `fans/${user.id}/${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, resizedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      if (fanProfile?.id) {
        await supabase.from('fans').update({ avatar_url: publicUrl }).eq('id', fanProfile.id);
        toast.success(t('profileImageUpdated'));
      }
    } catch (err) {
      toast.error(t('failedToUpload'));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 bg-[#111111] flex items-center justify-center relative">
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            {formData.avatar_url ? (
              <>
                {!avatarLoaded && <div className="absolute inset-0 skeleton-shimmer z-0" />}
                <img src={formData.avatar_url} alt="Profile"
                  className={`relative z-10 w-full h-full object-cover transition-all duration-700 ease-in-out ${avatarLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-lg scale-110 opacity-0'}`}
                  onLoad={() => setAvatarLoaded(true)} />
              </>
            ) : (
              <span className="text-4xl font-medium text-white/80">
                {(formData.name || 'U').substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute bottom-1 right-1 z-50 p-2 bg-white rounded-full shadow-lg border-4 border-[#1A1A1A] group-hover:bg-gray-200 transition-colors">
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Pencil className="w-4 h-4 text-black" />}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 block">{t('name')}</label>
          <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-white/5 border-white/10 text-white h-12 text-lg focus:border-white/50" placeholder={t('name')} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 block">{t('currentCity')}</label>
          <CityAutocomplete value={formData.city} onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
            placeholder={t('searchCity')}
            onSelect={(loc) => setFormData(prev => ({ ...prev, city: `${loc.city}, ${loc.country}`, latitude: loc.latitude, longitude: loc.longitude }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 block">{t('discoveryRadius')}</label>
          <Select value={String(formData.discovery_radius)} onValueChange={(val) => setFormData(prev => ({ ...prev, discovery_radius: parseInt(val) }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-lg focus:ring-0">
              <SelectValue placeholder={t('selectRadius')} />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
              <SelectItem value="50">50 km</SelectItem>
              <SelectItem value="100">100 km</SelectItem>
              <SelectItem value="250">250 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
        <Button variant="ghost" onClick={onCancel} className="text-white/80 hover:text-white">{t('cancel')}</Button>
        <Button onClick={() => onSave(formData)} disabled={isSaving || !formData.name}
          className="bg-white text-black hover:bg-white/90 rounded-full px-8 font-bold">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('saveProfile')}
        </Button>
      </div>

      {onDelete && (
        <div className="mt-8 pt-6 border-t border-red-500/20">
          <div className="flex flex-col items-start">
            <h4 className="text-red-400 font-medium text-sm mb-1">{t('dangerZone')}</h4>
            <p className="text-white/80 text-xs mb-4">{t('onceDeleteAccount')}</p>
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(true)}
              className="bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors h-8 text-xs">
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#111111] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">{t('deleteAccountConfirmTitle')}</h3>
            <p className="text-white/80 mb-6 text-sm">{t('deleteAccountConfirmDesc')}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="text-white/80 hover:text-white">{t('cancel')}</Button>
              <Button onClick={() => { setShowDeleteConfirm(false); onDelete(); }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6">{t('deleteAccount')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FollowedArtistCard({ artist, user, initialFollowRecord, index }) {
  const { t } = useI18n();
  const [isFollowing, setIsFollowing] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [followId, setFollowId] = useState(initialFollowRecord?.id);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFollowToggle = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isFollowing) { setShowConfirm(true); return; }
    try {
      setIsProcessing(true);
      const { data, error } = await supabase.from('follows').insert({ artist_id: artist.id, fan_user_id: user.email }).select().single();
      if (error) throw error;
      setFollowId(data.id);
      setIsFollowing(true);
    } catch { toast.error(t('failedToFollow')); }
    finally { setIsProcessing(false); }
  };

  const handleConfirmUnfollow = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      setIsProcessing(true);
      if (followId) await supabase.from('follows').delete().eq('id', followId);
      setIsFollowing(false); setShowConfirm(false);
    } catch { toast.error(t('failedToUnfollow')); }
    finally { setIsProcessing(false); }
  };

  const handleCancelUnfollow = (e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={`${createPageUrl('ArtistProfile')}?p=${artist.slug || artist.id}`} className="group p-4 hover:bg-white/5 transition-colors block">
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-3 sm:gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 flex-shrink-0">
              <UserAvatar artistProfile={artist} size="full" className="rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg text-white/90 group-hover:text-white transition-colors truncate">
                {(!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name
                  ? `${artist.name} & ${artist.partner_name}` : artist.name}
              </h4>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="uppercase text-[10px] font-bold tracking-wider">{artist.category || 'Maestro'}</span>
                {artist.current_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {artist.current_city}</span>}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 sm:ml-2">
            <Button onClick={handleFollowToggle} disabled={isProcessing}
              className={`w-full sm:w-auto px-4 rounded-full h-9 text-xs md:text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap ${
                isFollowing ? 'bg-transparent border border-white text-white hover:bg-white/10' : 'bg-white border-0 text-black hover:bg-gray-200'}`}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? (
                <><Heart className="w-4 h-4 fill-current flex-shrink-0" /><span>{t('following')}</span></>
              ) : (
                <><Heart className="w-4 h-4 flex-shrink-0" /><span>{t('followArtist')}</span></>
              )}
            </Button>
          </div>
        </div>
      </Link>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={handleCancelUnfollow}>
            <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-2">{t('unfollowArtist')}</h3>
              <p className="text-white/70 mb-6 text-sm">{t('leaveThisArtist')}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={handleCancelUnfollow} className="text-white/80 hover:text-white flex-1">{t('stay')}</Button>
                <Button onClick={handleConfirmUnfollow} disabled={isProcessing}
                  className="bg-white text-black hover:bg-gray-200 rounded-full px-6 flex-1 font-bold">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : t('leave')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FanProfile() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(/** @type {import('@supabase/supabase-js').User|null} */ (null));
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'following';
  });

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => { const { data } = await supabase.from('artists').select('*'); return data || []; },
  });

  const { data: fans = [], isLoading: loadingFans } = useQuery({
    queryKey: ['fans', user?.id],
    queryFn: async () => { const { data } = await supabase.from('fans').select('*').eq('user_id', user?.id); return data || []; },
    enabled: !!user?.id,
  });

  const { data: follows = [], isLoading: loadingFollows } = useQuery({
    queryKey: ['follows', user?.email],
    queryFn: async () => { const { data } = await supabase.from('follows').select('*').eq('fan_user_id', user?.email); return data || []; },
    enabled: !!user?.email,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my_sent_requests', user?.email],
    queryFn: async () => { const { data } = await supabase.from('visit_requests').select('*').eq('fan_user_id', user?.email).order('created_at', { ascending: false }); return data || []; },
    enabled: !!user?.email,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await supabase.auth.updateUser({ data: { full_name: data.name, avatar_url: data.avatar_url } });
      const fanRecord = fans[0];
      if (fanRecord) {
        await supabase.from('fans').update({
          name: data.name, avatar_url: data.avatar_url,
          city: data.city, latitude: data.latitude,
          longitude: data.longitude, discovery_radius: data.discovery_radius
        }).eq('id', fanRecord.id);
      }
      const { data: { user: refreshed } } = await supabase.auth.getUser();
      return refreshed;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['fans'] });
      toast.success(t('profileUpdated'));
    }
  });

  const deleteFanMutation = useMutation({
    mutationFn: async () => {
      const email = user.email;
      await supabase.from('fans').delete().eq('user_id', user?.id);
      await supabase.from('follows').delete().eq('fan_user_id', email);
      await supabase.from('visit_requests').delete().eq('fan_user_id', email);
      await supabase.from('notifications').delete().eq('fan_user_id', email);

      const { data: artistRecords } = await supabase.from('artists').select('id').eq('created_by', email);
      for (const artist of (artistRecords || [])) {
        await supabase.from('tours').delete().eq('artist_id', artist.id);
        await supabase.from('visit_requests').delete().eq('artist_id', artist.id);
        await supabase.from('follows').delete().eq('artist_id', artist.id);
        await supabase.from('notifications').delete().eq('artist_id', artist.id);
        await supabase.from('artists').delete().eq('id', artist.id);
      }
      await supabase.rpc('delete_user');
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSuccess: () => {
      sessionStorage.setItem('yira_account_deleted', '1');
      window.location.href = '/';
    },
    onError: (err) => {
      toast.error(err?.message || t('loginError'));
    },
  });

  if (loadingUser || loadingArtists || loadingFollows || loadingFans) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;
  }

  if (!user) {
    navigate(createPageUrl('Map'));
    return null;
  }

  if (fans.length === 0) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;
  }

  const followedArtists = follows
    .map(f => { const artist = artists.find(a => a.id === f.artist_id); return artist ? { artist, followRecord: f } : null; })
    .filter(Boolean);

  const fanProfile = fans[0] || null;
  const isOrganizer = fanProfile?.role_type === 'organizer';
  const displayName = fanProfile?.name || user.user_metadata?.full_name || 'Tango Fan';
  const displayAvatar = fanProfile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      <SEO title={`${displayName} - Profile Settings`} description="Manage your fan profile and followed artists." />

      <header className="relative md:sticky md:top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Map')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{t('backToMap') || 'Back to Map'}</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            {user && <NotificationBell user={user} />}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-24">
        <section className="mb-6 md:mb-8 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 pt-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group flex-shrink-0">
            <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#1A1A1A] shadow-2xl bg-[#111111] transition-all duration-300 ring-1 ring-white/10">
              <UserAvatar user={{ ...user, avatar_url: displayAvatar, full_name: displayName }} artistProfile={null} size="full" className="w-full h-full text-4xl text-white bg-transparent" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 text-center md:text-left pt-2">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mb-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">{displayName}</h1>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/5 mb-2 md:mb-6 text-sm font-medium">
              {isOrganizer ? <Briefcase className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {isOrganizer ? t('organizerProfileBadge') : t('fanProfileBadge')}
            </div>
          </motion.div>
        </section>

        <TabBar
          className="mb-8"
          layoutId="activeTabFanProfile"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'following',   icon: <Heart className="w-4 h-4" />,   label: t('followedArtists') },
            ...(isOrganizer ? [{ key: 'my_requests', icon: <Send className="w-4 h-4" />, label: t('myRequests') }] : []),
            { key: 'account',     icon: <UserIcon className="w-4 h-4" />, label: t('myProfile') },
          ]}
        />

        {activeTab === 'following' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{t('following')} ({followedArtists.length})</h3>
            </div>
            <Card className="bg-[#111111] border-white/5 overflow-hidden">
              <div className="divide-y divide-white/5">
                {followedArtists.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-white font-medium mb-1">{t('notFollowingAnyone')}</h3>
                    <p className="text-white/80 text-sm">{t('exploreMapToFind')}</p>
                    <Link to={createPageUrl('Map')} className="inline-block mt-4">
                      <Button className="bg-white text-black hover:bg-gray-200 rounded-full font-bold">{t('exploreMap')}</Button>
                    </Link>
                  </div>
                ) : followedArtists.map((item, index) => (
                  <FollowedArtistCard key={item.artist.id} artist={item.artist} user={user} initialFollowRecord={item.followRecord} index={index} />
                ))}
              </div>
            </Card>
          </section>
        )}

        {activeTab === 'my_requests' && isOrganizer && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{t('myRequests')} ({myRequests.length})</h3>
            </div>
            <Card className="bg-[#111111] border-white/5 overflow-hidden">
              <div className="divide-y divide-white/5">
                {myRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <Send className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-white font-medium mb-1">{t('noMyRequests')}</h3>
                    <Link to={createPageUrl('Map')} className="inline-block mt-4">
                      <Button className="bg-white text-black hover:bg-gray-200 rounded-full font-bold">{t('exploreMap')}</Button>
                    </Link>
                  </div>
                ) : myRequests.map((req, index) => {
                  const artist = artists.find(a => a.id === req.artist_id);
                  return (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                        {artist?.avatar_url ? <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 font-bold text-xs">{(artist?.name || 'A').substring(0,2).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{artist?.name || req.artist_id}</p>
                        <p className="text-xs text-white/50 truncate">{req.city}</p>
                      </div>
                      <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{t('requested')}</span>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {activeTab === 'account' && (
          <section>
            <Card className="bg-[#111111] border-white/5 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <EditFanProfileForm user={user} fanProfile={fanProfile}
                  onSave={(data) => updateProfileMutation.mutate(data)}
                  onCancel={() => setActiveTab('following')}
                  onDelete={() => deleteFanMutation.mutate()}
                  isSaving={updateProfileMutation.isPending} />
                <ChangePasswordSection user={user} />
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}