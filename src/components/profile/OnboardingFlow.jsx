import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, MapPin, 
  Instagram, Facebook, MessageCircle, Globe, Loader2, Check, AlertCircle, Pencil, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import CityAutocomplete from '@/components/location/CityAutocomplete';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import Logo from '@/components/ui/Logo';

export default function OnboardingFlow({ user, onComplete, onSkip }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(-1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (step === -1) {
      const timer = setTimeout(() => {
        setStep(0);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const [formData, setFormData] = useState({
    category: 'Maestro',
    name: user?.full_name || '',
    profileType: 'Solo',
    partner_name: '',
    city: '',
    country: '',
    latitude: null,
    longitude: null,
    bio: '',
    avatar_url: user?.picture || user?.avatar_url || '',
    instagram_url: '',
    whatsapp_number: '',
    website_url: '',
    is_active: true,
  });
  
  const [locationError, setLocationError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const totalSteps = 4;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLocationSuccess = (location) => {
    setFormData(prev => ({
      ...prev,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude
    }));
    setLocationError(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setImageError('Max size 30MB');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError('');
      
      const resizedFile = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                reject(new Error('Canvas to Blob failed'));
              }
            }, 'image/webp', 0.8);
          };
          img.onerror = () => reject(new Error('Image load failed'));
        };
        reader.onerror = () => reject(new Error('File read failed'));
      });

      const fileName = `avatars/onboarding-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateFormData('avatar_url', publicUrl);
    } catch (err) {
      setImageError('Upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFinish = async () => {
    if (!formData.name) return toast.error(t('yourName') + ' requerido');

    const cleanUsername = (val, domain) => {
      if (!val) return '';
      let clean = val.trim();
      if (domain === 'facebook.com' && clean.includes('profile.php?id=')) {
        const idMatch = clean.match(/id=([^&]+)/);
        if (idMatch) return `profile.php?id=${idMatch[1]}`;
      }
      if (clean.includes(domain)) clean = clean.split(domain)[1];
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
    
    const generateSlug = (name, partnerName, type) => {
      let base = name;
      if (type === 'Couple' && partnerName) {
        base = `${name} and ${partnerName}`;
      }
      return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `user-${Date.now()}`;
    };

    setIsSaving(true);
    try {
      const uId = user?.id;

      // eslint-disable-next-line no-unused-vars
      const { city, country, latitude, longitude, ...artistData } = formData;
      const { data: newArtist, error } = await supabase
        .from('artists')
        .insert({
          ...artistData,
          user_id: uId,
          slug: generateSlug(formData.name, formData.partner_name, formData.profileType),
          instagram_url: cleanUsername(formData.instagram_url, 'instagram.com'),
          facebook_url: cleanUsername(formData.facebook_url, 'facebook.com'),
          whatsapp_number: cleanWhatsapp(formData.whatsapp_number),
          website_url: cleanWebsite(formData.website_url),
          current_city: null,
          current_latitude: null,
          current_longitude: null,
          last_checkin: null,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.setQueryData(['artists'], (old) => {
        if (!old) return [newArtist];
        return [...old, newArtist];
      });
      queryClient.invalidateQueries({ queryKey: ['artists'] });

      // Update user role in auth metadata
      await supabase.auth.updateUser({ data: { role: 'artist' } });

      toast.success(lang === 'es' ? '¡Bienvenido/a a la comunidad de artistas de Yira Tango!' : 'Welcome to the Yira Tango Artists community!');
      setTimeout(() => setStep(4), 500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create profile: ' + (err.message || 'Unknown error'));
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.category) return toast.error(lang === 'es' ? 'Seleccioná un tipo' : 'Please select a type');
    if (step === 2 && !formData.name) return toast.error(lang === 'es' ? 'Ingresá tu nombre' : 'Please enter your name');
    if (step === 2 && formData.category === 'Maestro' && formData.profileType === 'Couple' && !formData.partner_name) return toast.error(lang === 'es' ? 'El nombre de tu pareja es requerido' : 'Partner name required');
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleFanSave = async () => {
    if (!formData.city) return toast.error(lang === 'es' ? 'Seleccioná tu ciudad' : 'Please select your city');
    try {
      setIsSaving(true);
      const uId = user?.email || user?.id;

      const { data: existing } = await supabase
        .from('fans')
        .select('id')
        .eq('user_id', uId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('fans').insert({
          user_id: uId,
          email: user?.email || '',
          name: user?.full_name || 'Tango Fan',
          avatar_url: user?.picture || user?.avatar_url || '',
          role: 'fan',
          role_type: 'fan',
          city: `${formData.city}, ${formData.country}`
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fans')
          .update({ city: `${formData.city}, ${formData.country}`, role_type: 'fan' })
          .eq('id', existing.id);
        if (error) throw error;
      }

      await supabase.auth.updateUser({ data: { role: 'fan' } });
      queryClient.invalidateQueries({ queryKey: ['fans_check'] });
      sessionStorage.setItem('yira_show_fan_welcome', 'true');
      onComplete({ isFan: true });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save profile: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrganizerSave = async () => {
    if (!formData.city) return toast.error(lang === 'es' ? 'Seleccioná tu ciudad' : 'Please select your city');
    try {
      setIsSaving(true);
      const uId = user?.email || user?.id;

      const { data: existing } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', uId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('organizers').insert({
          user_id: uId,
          email: user?.email || '',
          name: user?.full_name || 'Tango Organizer',
          avatar_url: user?.picture || user?.avatar_url || '',
          city: `${formData.city}, ${formData.country}`
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organizers')
          .update({ city: `${formData.city}, ${formData.country}` })
          .eq('id', existing.id);
        if (error) throw error;
      }

      await supabase.auth.updateUser({ data: { role: 'organizer' } });
      queryClient.invalidateQueries({ queryKey: ['organizers_check'] });
      sessionStorage.setItem('yira_show_fan_welcome', 'true');
      onComplete({ isFan: true });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save profile: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex items-center justify-center p-4 bg-black relative"
    >
      <div className="hidden lg:flex absolute left-8 top-8 z-50">
        <Logo width={64} height={33} className="text-white" />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <AnimatePresence mode="wait">
        {step === -1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="absolute inset-0 flex items-center justify-center bg-black z-50 px-6"
          >
            <div className="flex flex-col items-center justify-center gap-1 md:gap-2 text-lg md:text-xl font-medium tracking-wide text-white/90 text-center">
              <motion.div
                initial={{ filter: "blur(12px)", opacity: 0, y: 10 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-white/70"
              >
                {t('yiraHub')}
              </motion.div>
              <motion.div
                initial={{ filter: "blur(12px)", opacity: 0, y: 10 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                className="text-white/70"
              >
                {t('artistsFansAnywhere')}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
        {typeof step === 'number' && step > 0 && (
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-white' : 'w-1.5 bg-white/20'
              }`} 
            />
          ))}
        </div>
        )}

        <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          {onSkip && (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="absolute top-4 right-4 z-50 text-white/50 hover:text-white/80 transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5"
            >
              {t('exit')}
            </button>
          )}

          <AnimatePresence>
            {showExitConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-[#111111] border border-white/10 p-6 rounded-2xl shadow-2xl text-center max-w-sm"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{t('areYouSureExit')}</h3>
                  <p className="text-white/80 text-sm mb-6">{t('ifYouLeaveLogOut')}</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowExitConfirm(false)}
                      className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      {t('cancel')}
                    </Button>
                    <Button 
                      onClick={() => onSkip()}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                    >
                      {t('exit')}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            
            {/* STEP 0: APP ROLE */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('howExperienceTango')}</h2>
                <div className="space-y-4 mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full p-4 text-left font-medium rounded-xl transition-all border bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10 flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-lg font-bold">{t('artist')}</div>
                      <div className="text-sm text-white/60 mt-1 font-normal">{t('maestrosMusiciansDjs')}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button
                    onClick={() => setStep('FAN_LOCATION')}
                    className="w-full p-4 text-left font-medium rounded-xl transition-all border bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10 flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-lg font-bold">{t('fan')}</div>
                      <div className="text-sm text-white/60 mt-1 font-normal">{t('followKeepUp')}</div>
                    </div>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-white/70" /> : <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />}
                  </button>

                  <button
                    onClick={() => setStep('ORGANIZER_LOCATION')}
                    className="w-full p-4 text-left font-medium rounded-xl transition-all border bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10 flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-lg font-bold">{t('organizer')}</div>
                      <div className="text-sm text-white/60 mt-1 font-normal">{t('organizerFollowKeepUp')}</div>
                    </div>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-white/70" /> : <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ORGANIZER LOCATION */}
            {step === 'ORGANIZER_LOCATION' && (
              <motion.div
                key="stepOrganizerLocation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('whereLive')}</h2>
                <p className="text-white/70 text-center mb-8 text-sm">{t('requiredToRequest')}</p>
                <div className="space-y-4">
                  <CityAutocomplete
                    value={formData.city ? `${formData.city}${formData.country ? `, ${formData.country}` : ''}` : ''}
                    onSelect={handleLocationSuccess}
                    placeholder={t('enterCityLocation')}
                  />
                  {locationError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-center text-red-400 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {locationError}
                    </motion.div>
                  )}
                  {formData.city && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold uppercase tracking-wide">{t('selectedLocation')}</p>
                        <p className="text-white font-medium">{formData.city}, {formData.country}</p>
                      </div>
                      <button onClick={() => updateFormData('city', '')} className="ml-auto p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* FAN LOCATION */}
            {step === 'FAN_LOCATION' && (
              <motion.div
                key="stepFanLocation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('whereLive')}</h2>
                <p className="text-white/70 text-center mb-8 text-sm">{t('requiredToRequest')}</p>
                <div className="space-y-4">
                  <CityAutocomplete
                    value={formData.city ? `${formData.city}${formData.country ? `, ${formData.country}` : ''}` : ''}
                    onSelect={handleLocationSuccess}
                    placeholder={t('enterCityLocation')}
                  />
                  {locationError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-center text-red-400 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {locationError}
                    </motion.div>
                  )}
                  {formData.city && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold uppercase tracking-wide">{t('selectedLocation')}</p>
                        <p className="text-white font-medium">{formData.city}, {formData.country}</p>
                      </div>
                      <button onClick={() => updateFormData('city', '')} className="ml-auto p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 1: CATEGORY */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('whatIsRole')}</h2>
                <p className="text-white/70 text-center mb-8 text-sm">{t('selectArtistType')}</p>
                <div className="space-y-4">
                  {[
                    { id: 'Maestro', label: t('maestroOrCouple') },
                    { id: 'Musician', label: t('musicianOrOrchestra') },
                    { id: 'DJ', label: 'DJ' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => updateFormData('category', type.id)}
                      className={`w-full py-4 text-lg font-medium rounded-xl transition-all border ${
                        formData.category === type.id || (type.id === 'Musician' && formData.category === 'Orchestra')
                          ? 'bg-white text-black border-white shadow-lg' 
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: IDENTITY */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('whoAreYou')}</h2>
                <p className="text-white/70 text-center mb-8 text-sm">{t('tellUsAppear')}</p>

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
                            <img 
                              src={formData.avatar_url} 
                              alt="Profile" 
                              className={`relative z-10 w-full h-full object-cover transition-all duration-700 ease-in-out ${avatarLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-lg scale-110 opacity-0'}`}
                              onLoad={() => setAvatarLoaded(true)}
                            />
                          </>
                        ) : (
                          <span className="text-4xl font-medium text-white/80">
                            {getInitials(formData.name)}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1 z-50 p-3 bg-white rounded-full shadow-lg border-4 border-[#1A1A1A] group-hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Pencil className="w-4 h-4 text-black" />}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                      {imageError && <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-red-400">{imageError}</p>}
                    </div>
                  </div>

                  {formData.category === 'Maestro' && (
                    <div className="bg-white/5 p-1 rounded-full flex mb-6">
                      {[{ id: 'Solo', labelKey: 'soloLabel' }, { id: 'Couple', labelKey: 'coupleLabel' }].map(type => (
                        <button
                          key={type.id}
                          onClick={() => updateFormData('profileType', type.id)}
                          className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                            formData.profileType === type.id ? 'bg-white text-black shadow-lg' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {t(type.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}

                  {(formData.category === 'Musician' || formData.category === 'Orchestra') && (
                    <div className="bg-white/5 p-1 rounded-full flex mb-6">
                      {[{ id: 'Musician', labelKey: 'musicianLabel' }, { id: 'Orchestra', labelKey: 'orchestraLabel' }].map(type => (
                        <button
                          key={type.id}
                          onClick={() => updateFormData('category', type.id)}
                          className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                            formData.category === type.id ? 'bg-white text-black shadow-lg' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {t(type.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 block">
                        {formData.category === 'Maestro' && formData.profileType === 'Couple' ? t('yourName') : t('name')}
                      </label>
                      <Input
                        value={formData.name}
                        onChange={e => updateFormData('name', e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-12 text-lg focus:border-white/50"
                        placeholder="e.g. Maria Rossi"
                        autoFocus
                      />
                    </div>
                    {formData.category === 'Maestro' && formData.profileType === 'Couple' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5 block">
                          {t('partnerName')}
                        </label>
                        <Input
                          value={formData.partner_name}
                          onChange={e => updateFormData('partner_name', e.target.value)}
                          className="bg-white/5 border-white/10 text-white h-12 text-lg focus:border-white/50"
                          placeholder="e.g. John Doe"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: BIO + SOCIALS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 max-h-[60vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('finalTouches')}</h2>
                <p className="text-white/70 text-center mb-8 text-sm">{t('addPhotoSocials')}</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs font-medium text-white/80 uppercase tracking-wider block">{t('bio')}</label>
                      <span className={`text-xs transition-colors ${(formData.bio || '').length > 130 ? 'text-orange-400' : 'text-white/80'}`}>
                        {(formData.bio || '').length}/150
                      </span>
                    </div>
                    <Textarea
                      value={formData.bio}
                      onChange={e => updateFormData('bio', e.target.value)}
                      placeholder={t('shortBio')}
                      className="bg-white/5 border-white/10 text-white min-h-[80px] resize-none focus:border-white/50"
                      maxLength={150}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { icon: Instagram, prefix: 'instagram.com/', key: 'instagram_url', placeholder: 'username' },
                      { icon: Facebook, prefix: 'facebook.com/', key: 'facebook_url', placeholder: 'username' },
                      { icon: MessageCircle, prefix: 'wa.me/', key: 'whatsapp_number', placeholder: '1234567890' },
                      { icon: Globe, prefix: 'https://', key: 'website_url', placeholder: 'website.com' },
                    ].map(({ icon: Icon, prefix, key, placeholder }) => (
                      <div key={key} className="flex bg-white/5 border border-white/10 rounded-md overflow-hidden focus-within:border-white/50">
                        <span className="flex items-center pl-3 pr-2 text-white/80 bg-white/5 border-r border-white/10 text-sm gap-2">
                          <Icon className="w-4 h-4 text-white/70" />
                          <span>{prefix}</span>
                        </span>
                        <Input
                          value={formData[key] || ''}
                          onChange={e => updateFormData(key, e.target.value)}
                          placeholder={placeholder}
                          className="bg-transparent border-0 text-white rounded-none focus-visible:ring-0 shadow-none h-10"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: ADD TOUR DATES */}
            {step === 4 && (
              <motion.div
                key="step4-dates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-start gap-3 bg-white/5 border border-white/20 rounded-xl p-4 mb-6">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm uppercase tracking-wider">{t('notOnMapTitle')}</p>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">{t('notOnMapDesc')}</p>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-3">{t('onboardingDatesTitle')}</h2>
                <p className="text-white/70 text-sm leading-relaxed">{t('onboardingDatesDesc')}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {typeof step === 'number' && step > 0 && (
          <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#111111]">
            {step < 4 ? (
              <Button onClick={prevStep} variant="ghost" className="text-white/70 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('back')}
              </Button>
            ) : (
              <div></div>
            )}
            {step < 3 ? (
              <Button onClick={nextStep} className="bg-white text-black hover:bg-gray-200 px-8 rounded-full font-bold">
                {t('next')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : step === 3 ? (
              <Button 
                onClick={handleFinish} 
                disabled={isSaving}
                className="bg-white text-black hover:bg-white/90 px-8 rounded-full font-bold min-w-[120px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{t('finish')}</span> <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            ) : (
              <Button 
                onClick={() => onComplete({ isFan: false })}
                className="bg-white text-black hover:bg-white/90 px-8 rounded-full font-bold"
              >
                {t('onboardingDatesGoBtn')}
              </Button>
            )}
          </div>
          )}

          {step === 'FAN_LOCATION' && (
            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#111111]">
              <Button onClick={() => setStep(0)} variant="ghost" className="text-white/70 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('back')}
              </Button>
              <Button 
                onClick={handleFanSave}
                disabled={isSaving}
                className="bg-white text-black hover:bg-gray-200 px-8 rounded-full font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('next')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 'ORGANIZER_LOCATION' && (
            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#111111]">
              <Button onClick={() => setStep(0)} variant="ghost" className="text-white/70 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('back')}
              </Button>
              <Button
                onClick={handleOrganizerSave}
                disabled={isSaving}
                className="bg-white text-black hover:bg-gray-200 px-8 rounded-full font-bold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('next')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}