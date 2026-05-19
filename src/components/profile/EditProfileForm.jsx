import React, { useState, useEffect, useCallback, memo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Instagram, Facebook, MessageCircle, Globe, Loader2, Check, Upload, X, Pencil, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/components/contexts/I18nContext';
import { resizeToAvatar } from '@/components/utils/imageUtils';

const EditProfileForm = memo(forwardRef(function EditProfileForm({ 
  formData, 
  onSave, 
  onDelete,
  isSaving, 
  isMandatory = false 
}, ref) {
  const { t } = useI18n();
  const [localFormData, setLocalFormData] = useState(formData);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const fileInputRef = React.useRef(null);

  const { data: allArtists = [] } = useQuery({
    queryKey: ['artists_slugs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('artists').select('id, slug');
      if (error) throw error;
      return data || [];
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);
  
  const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
  
  const isFormValid = () => {
    const hasName = localFormData.name && localFormData.name.trim().length > 0;
    const hasAvatar = localFormData.avatar_url && localFormData.avatar_url.trim().length > 0;
    const hasPartnerName = (!localFormData.category || localFormData.category === 'Maestro') && localFormData.profileType === 'Couple' 
      ? (localFormData.partner_name && localFormData.partner_name.trim().length > 0)
      : true;

    if (!hasName || !hasPartnerName) return false;
    if (isMandatory && !hasAvatar) return false;

    return true;
  };

  const handleSave = useCallback((fromClose = false) => {
    const cleanUsername = (val, domain) => {
      if (!val) return '';
      let clean = val.trim();
      if (clean.includes(domain)) {
        clean = clean.split(domain)[1];
      }
      if (clean.startsWith('/')) clean = clean.substring(1);
      return clean.split('?')[0].replace(/\/$/, '');
    };

    const cleanWebsite = (url) => {
      if (!url) return '';
      return url.trim().replace(/^https?:\/\//i, '');
    };

    const cleanWhatsapp = (val) => {
      if (!val) return '';
      let clean = val.trim();
      if (clean.includes('wa.me/')) clean = clean.split('wa.me/')[1];
      return clean.replace(/[^0-9+]/g, '');
    };

    const dataToSave = {
      ...localFormData,
      instagram_url: cleanUsername(localFormData.instagram_url, 'instagram.com'),
      facebook_url: cleanUsername(localFormData.facebook_url, 'facebook.com'),
      whatsapp_number: cleanWhatsapp(localFormData.whatsapp_number),
      website_url: cleanWebsite(localFormData.website_url)
    };

    const isFromClose = fromClose === true;
    const isDifferent = Object.keys(dataToSave).some(key => {
      const val1 = dataToSave[key] || '';
      const val2 = formData[key] || '';
      return val1 !== val2;
    });

    if (isDifferent || !isFromClose) {
      onSave(dataToSave);
    }
  }, [localFormData, formData, onSave]);

  useImperativeHandle(ref, () => ({
    save: () => {
      if (isFormValid() && usernameAvailable !== false) {
        handleSave(true);
      }
    }
  }));

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError(t('pleaseUploadImage'));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`${t('imageSizeMax')} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    try {
      setUploadingImage(true);
      
      const resizedFile = await resizeToAvatar(file);

      // Upload to Supabase Storage
      const fileName = `avatars/${localFormData.id || 'new'}-${Date.now()}.webp`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLocalFormData({ ...localFormData, avatar_url: publicUrl });

      if (localFormData.id && !isMandatory) {
        const { error } = await supabase
          .from('artists')
          .update({ avatar_url: publicUrl })
          .eq('id', localFormData.id);
        if (error) throw error;
      }

      toast.success(t('profileImageUpdated'));
    } catch (error) {
      setImageError(t('uploadFailed'));
      toast.error(t('uploadFailed'));
    } finally {
      setUploadingImage(false);
    }
  }, [localFormData, isMandatory]);

  const clearImage = useCallback(() => {
    setLocalFormData({ ...localFormData, avatar_url: '' });
    setImageError('');
  }, [localFormData]);

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameError(t('usernameMinLength'));
      setUsernameAvailable(false);
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setUsernameError(t('usernameFormat'));
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');
    
    try {
      const exists = allArtists.some(p => 
        p.id !== localFormData.id && 
        p.slug?.toLowerCase() === username.toLowerCase()
      );
      setUsernameAvailable(!exists);
      if (exists) {
        setUsernameError(t('usernameTaken'));
      }
    } finally {
      setCheckingUsername(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div>
        <label className="text-sm text-white/50 mb-4 block">
          {t('profilePhoto')} {isMandatory && <span className="text-red-400">*</span>}
        </label>
        
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 bg-[#111111] flex items-center justify-center relative">
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {localFormData.avatar_url ? (
                <>
                  {!avatarLoaded && (
                    <div className="absolute inset-0 skeleton-shimmer z-0" />
                  )}
                  <img 
                    src={localFormData.avatar_url} 
                    alt="Profile" 
                    className={`relative z-10 w-full h-full object-cover transition-all duration-700 ease-in-out ${avatarLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-lg scale-110 opacity-0'}`}
                    onLoad={() => setAvatarLoaded(true)}
                  />
                </>
              ) : (
                <span className="text-4xl font-medium text-white/80">
                  {getInitials(localFormData.name)}
                </span>
              )}
            </div>

            <div className="absolute bottom-1 right-1 z-50 p-3 bg-white rounded-full shadow-lg border-4 border-[#1A1A1A] group-hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Pencil className="w-4 h-4 text-black" />
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ display: 'none' }}
            />
          </div>

          {imageError && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              {imageError}
            </p>
          )}

          {isMandatory && !localFormData.avatar_url && (
            <p className="text-xs text-red-400 mt-2">
              {t('profilePhotoRequired')}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-white/50 mb-2 block">{t('artistType')}</label>
          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg text-white/60 text-sm">
            {localFormData.category === 'Musician' ? t('musicianLabel') : localFormData.category === 'Orchestra' ? t('orchestraLabel') : (localFormData.category || 'Maestro')}
          </div>
        </div>
        {(!localFormData.category || localFormData.category === 'Maestro') && (
          <div className="flex-1">
            <label className="text-sm text-white/50 mb-2 block">{t('profileType')}</label>
            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg text-white/60 text-sm">
              {localFormData.profileType || 'Solo'}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm text-white/50 mb-2 block">
          {(!localFormData.category || localFormData.category === 'Maestro') && localFormData.profileType === 'Couple' ? t('yourName') : t('name')} <span className="text-red-400">*</span>
        </label>
        <Input
          value={localFormData.name || ''}
          onChange={(e) => {
            const name = e.target.value;
            setLocalFormData(prev => {
              const newData = { ...prev, name };
              if (!prev.slug || prev.slug === prev.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) {
                newData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              }
              return newData;
            });
          }}
          className="bg-[#222222] border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
          placeholder={t('yourNamePlaceholder')}
        />
      </div>

      {(!localFormData.category || localFormData.category === 'Maestro') && localFormData.profileType === 'Couple' && (
        <div>
          <label className="text-sm text-white/50 mb-2 block">
            {t('partnerName')} <span className="text-red-400">*</span>
          </label>
          <Input
            value={localFormData.partner_name || ''}
            onChange={(e) => {
              const partnerName = e.target.value;
              setLocalFormData(prev => {
                const newData = { ...prev, partner_name: partnerName };
                const oldAutoSlug = `${prev.name} and ${prev.partner_name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (!prev.slug || prev.slug === oldAutoSlug) {
                   newData.slug = `${prev.name} and ${partnerName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                }
                return newData;
              });
            }}
            className="bg-[#222222] border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
            placeholder={t('partnerNamePlaceholder')}
          />
        </div>
      )}

      {/* Profile URL Field */}
      <div>
        <label className="text-sm text-white/50 mb-2 flex items-center justify-between">
          <span>{t('profileUrlLink')} <span className="text-red-400">*</span></span>
          {localFormData.slug && usernameAvailable !== false && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://yiratango.com/api/functions/go?p=${localFormData.slug}`);
                toast.success(t('linkCopied'));
              }}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
            >
              <Copy className="w-3 h-3" /> {t('copyShareLink')}
            </button>
          )}
        </label>
        <div className="flex flex-col sm:flex-row bg-[#222222] border border-white/20 rounded-md overflow-hidden focus-within:border-white/40">
          <span className="flex items-center px-3 py-2 sm:py-0 text-white/50 bg-[#1A1A1A] sm:border-r border-b sm:border-b-0 border-white/20 text-sm whitespace-nowrap">
            yiratango.com/api/functions/go?p=
          </span>
          <Input
            value={localFormData.slug || ''}
            onChange={(e) => {
              let val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
              setLocalFormData({ ...localFormData, slug: val });
              if (val.length >= 3) {
                checkUsernameAvailability(val);
              } else {
                setUsernameAvailable(null);
                setUsernameError('');
              }
            }}
            className="bg-transparent border-0 text-white placeholder:text-white/50 rounded-none focus-visible:ring-0 shadow-none h-10"
            placeholder={t('usernamePlaceholder')}
          />
          {checkingUsername && (
            <span className="flex items-center pr-3">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
            </span>
          )}
          {!checkingUsername && usernameAvailable === true && localFormData.slug && (
            <span className="flex items-center pr-3">
              <Check className="w-4 h-4 text-green-400" />
            </span>
          )}
          {!checkingUsername && usernameAvailable === false && localFormData.slug && (
            <span className="flex items-center pr-3">
              <X className="w-4 h-4 text-red-400" />
            </span>
          )}
        </div>
        {usernameError && (
          <p className="text-xs text-red-400 mt-1">{usernameError}</p>
        )}
        {usernameAvailable === true && localFormData.slug && (
          <p className="text-xs text-green-400 mt-1">{t('urlPathAvailable')}</p>
        )}
        <p className="text-xs text-white/40 mt-1">
          {t('uniqueProfileLink')}
        </p>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm text-white/50 block">{t('bio')}</label>
          <span className={`text-xs transition-colors ${(localFormData.bio || '').length > 130 ? 'text-orange-400' : 'text-white/40'}`}>
            {(localFormData.bio || '').length}/150
          </span>
        </div>
        <Textarea
          value={localFormData.bio || ''}
          onChange={(e) => setLocalFormData({ ...localFormData, bio: e.target.value })}
          className="bg-[#222222] border-white/20 text-white placeholder:text-white/50 focus:border-white/40 min-h-[100px]"
          placeholder={t('shortBio')}
          maxLength={150}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-white/70" />
            Instagram
          </label>
          <div className="flex bg-[#222222] border border-white/20 rounded-md overflow-hidden focus-within:border-white/40">
           <span className="flex items-center px-3 text-white/50 bg-[#1A1A1A] border-r border-white/20 text-sm">instagram.com/</span>
           <Input
             value={localFormData.instagram_url || ''}
             onChange={(e) => setLocalFormData({ ...localFormData, instagram_url: e.target.value })}
             className="bg-transparent border-0 text-white placeholder:text-white/50 rounded-none focus-visible:ring-0 shadow-none h-10"
             placeholder={t('usernamePlaceholder')}
           />
          </div>
        </div>
        <div>
          <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
            <Facebook className="w-4 h-4 text-white/70" />
            Facebook
          </label>
          <div className="flex bg-[#222222] border border-white/20 rounded-md overflow-hidden focus-within:border-white/40">
            <span className="flex items-center px-3 text-white/50 bg-[#1A1A1A] border-r border-white/20 text-sm">facebook.com/</span>
            <Input
              value={localFormData.facebook_url || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, facebook_url: e.target.value })}
              className="bg-transparent border-0 text-white placeholder:text-white/50 rounded-none focus-visible:ring-0 shadow-none h-10"
              placeholder={t('usernamePlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-white/70" />
            WhatsApp
          </label>
          <div className="flex bg-[#222222] border border-white/20 rounded-md overflow-hidden focus-within:border-white/40">
            <span className="flex items-center px-3 text-white/50 bg-[#1A1A1A] border-r border-white/20 text-sm">wa.me/</span>
            <Input
              value={localFormData.whatsapp_number || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, whatsapp_number: e.target.value })}
              className="bg-transparent border-0 text-white placeholder:text-white/50 rounded-none focus-visible:ring-0 shadow-none h-10"
              placeholder="1234567890"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-white/70" />
            Website
          </label>
          <div className="flex bg-[#222222] border border-white/20 rounded-md overflow-hidden focus-within:border-white/40">
            <span className="flex items-center px-3 text-white/50 bg-[#1A1A1A] border-r border-white/20 text-sm">https://</span>
            <Input
              value={localFormData.website_url || ''}
              onChange={(e) => setLocalFormData({ ...localFormData, website_url: e.target.value })}
              className="bg-transparent border-0 text-white placeholder:text-white/50 rounded-none focus-visible:ring-0 shadow-none h-10"
              placeholder="website.com"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving || !isFormValid() || (localFormData.slug && usernameAvailable === false)}
        className="w-full bg-white hover:bg-white/90 text-black"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-1" />
            {t('saveProfile')}
          </>
        )}
      </Button>

      {/* Danger Zone */}
      {!isMandatory && onDelete && (
        <div className="mt-8 pt-6 border-t border-red-500/20">
          <div className="flex flex-col items-start">
            <h4 className="text-red-400 font-medium text-sm mb-1">{t('dangerZone')}</h4>
            <p className="text-white/40 text-xs mb-4">{t('onceDeleteAccount')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors h-8 text-xs"
            >
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#1A1A1A] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">{t('deleteAccountConfirmTitle')}</h3>
            <p className="text-white/60 mb-6 text-sm">
              {t('deleteAccountConfirmDesc')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white/60 hover:text-white"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
              >
                {t('deleteAccount')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}));

export default EditProfileForm;