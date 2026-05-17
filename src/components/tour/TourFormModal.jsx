import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import CityAutocomplete from '@/components/location/CityAutocomplete';
import { useI18n } from '@/components/contexts/I18nContext';

const parseDate = (dateStr) => {
  if (!dateStr) return undefined;
  let cleanDateStr = dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    cleanDateStr = dateStr.split('T')[0];
  }
  if (!cleanDateStr || typeof cleanDateStr !== 'string') return undefined;
  
  const parts = cleanDateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

export default function TourFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCreated,
  initialData, 
  isSubmitting,
  isSuccess
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    city: '',
    country: '',
    event_link: '',
    start_date: '',
    end_date: '',
    latitude: null,
    longitude: null
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isStartPopoverOpen, setIsStartPopoverOpen] = useState(false);
  const [isEndPopoverOpen, setIsEndPopoverOpen] = useState(false);

  // When a new tour is successfully created, notify parent to close and switch tab
  useEffect(() => {
    if (isSuccess && !initialData && onCreated) {
      onCreated();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          city: initialData.city || '',
          country: initialData.country || '',
          event_link: initialData.event_link || '',
          start_date: initialData.start_date || initialData.date || '',
          end_date: initialData.end_date || initialData.date || '',
          latitude: initialData.latitude || null,
          longitude: initialData.longitude || null
        });
      } else {
        setFormData({
          city: '',
          country: '',
          event_link: '',
          start_date: '',
          end_date: '',
          latitude: null,
          longitude: null
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, initialData]);

  const handleCitySelect = (location) => {
    setFormData(prev => ({
      ...prev,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude
    }));
    if (validationErrors.city) {
      setValidationErrors(prev => ({ ...prev, city: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.city || !formData.latitude) {
      errors.city = t('selectCityFromSuggestions');
    }
    if (!formData.start_date) {
      errors.start_date = t('startDateRequired');
    }
    if (!formData.end_date) {
      errors.end_date = t('endDateRequired');
    }
    // event_link is now optional
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = t('endDateAfterStart');
    }
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const normalizeUrl = (url) => {
      if (!url) return '';
      let cleanUrl = url.trim();
      if (!cleanUrl) return '';
      if (!/^https?:\/\//i.test(cleanUrl)) {
        return `https://${cleanUrl}`;
      }
      return cleanUrl;
    };

    const dataToSubmit = {
      ...formData,
      event_link: normalizeUrl(formData.event_link)
    };

    onSubmit(dataToSubmit);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-start md:items-center justify-center p-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-lg w-full max-h-[calc(100dvh-3rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                {initialData ? t('editTourDate') : t('addTourDate')}
              </CardTitle>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white/60"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 pb-32 md:pb-6 space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-2 block">
                  {t('eventCity')} <span className="text-red-500">*</span>
                </label>
                <CityAutocomplete
                  value={formData.city ? `${formData.city}${formData.country ? `, ${formData.country}` : ''}` : ''}
                  onSelect={handleCitySelect}
                  placeholder={t('searchEventLocation')}
                />
                {formData.latitude && formData.longitude && !validationErrors.city && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t('locationConfirmedMsg')} {formData.city}, {formData.country}
                  </p>
                )}
                {validationErrors.city && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.city}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">
                    {t('startDate')} <span className="text-red-500">*</span>
                  </label>
                  <Popover open={isStartPopoverOpen} onOpenChange={setIsStartPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-medium bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/50 px-4 py-3 h-auto",
                          !formData.start_date && "text-white/50",
                          validationErrors.start_date && "border-red-500 text-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                        {formData.start_date ? (
                          format(parseDate(formData.start_date), "PPP")
                        ) : (
                          <span className="text-white/50">{t('pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10 z-[2002]" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDate(formData.start_date)}
                        onSelect={(date) => {
                          if (date) {
                            const dateString = format(date, 'yyyy-MM-dd');
                            setFormData({ ...formData, start_date: dateString });
                            if (validationErrors.start_date) {
                              setValidationErrors((prev) => ({ ...prev, start_date: null }));
                            }
                            setIsStartPopoverOpen(false);
                          }
                        }}
                        initialFocus
                        className="bg-[#1A1A1A] text-white"
                        classNames={{
                          day_selected: "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black",
                          day_today: "bg-white/10 text-white",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.start_date && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/50 mb-2 block">
                    {t('endDate')} <span className="text-red-500">*</span>
                  </label>
                  <Popover open={isEndPopoverOpen} onOpenChange={setIsEndPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-medium bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/50 px-4 py-3 h-auto",
                          !formData.end_date && "text-white/50",
                          validationErrors.end_date && "border-red-500 text-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                        {formData.end_date ? (
                          format(parseDate(formData.end_date), "PPP")
                        ) : (
                          <span className="text-white/50">{t('pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10 z-[2002]" align="start">
                      <Calendar
                        mode="single"
                        defaultMonth={parseDate(formData.end_date) || parseDate(formData.start_date)}
                        selected={parseDate(formData.end_date)}
                        onSelect={(date) => {
                          if (date) {
                            const dateString = format(date, 'yyyy-MM-dd');
                            setFormData({ ...formData, end_date: dateString });
                            if (validationErrors.end_date) {
                              setValidationErrors((prev) => ({ ...prev, end_date: null }));
                            }
                            setIsEndPopoverOpen(false);
                          }
                        }}
                        initialFocus
                        className="bg-[#1A1A1A] text-white"
                        classNames={{
                          day_selected: "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black",
                          day_today: "bg-white/10 text-white",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.end_date && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-2 block">
                  {t('eventLink')}
                </label>
                <Input
                  placeholder="https://..."
                  value={formData.event_link}
                  onChange={(e) => {
                    setFormData({ ...formData, event_link: e.target.value });
                    if (validationErrors.event_link) {
                      setValidationErrors({ ...validationErrors, event_link: null });
                    }
                  }}
                  className={`bg-white/5 border-white/10 text-white ${
                    validationErrors.event_link ? 'border-red-500' : ''
                  }`}
                />
                {validationErrors.event_link && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.event_link}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-white/60"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-white/90 text-black"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : initialData ? (
                    t('saveChanges')
                  ) : (
                    t('addDate')
                  )}
                </Button>
              </div>
            </CardContent>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}