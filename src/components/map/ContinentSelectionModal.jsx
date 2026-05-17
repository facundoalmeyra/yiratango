import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2 } from 'lucide-react';
import { useI18n } from '@/components/contexts/I18nContext';

const continents = [
  { id: 'North America', labelKey: 'northAmerica', color: '#60A5FA' },
  { id: 'South America', labelKey: 'southAmerica', color: '#34D399' },
  { id: 'Europe', labelKey: 'europe', color: '#F472B6' },
  { id: 'Asia', labelKey: 'asia', color: '#FBBF24' },
  { id: 'Africa', labelKey: 'africa', color: '#A78BFA' },
  { id: 'Oceania', labelKey: 'oceania', color: '#FB923C' },
];

export default function ContinentSelectionModal({ isOpen, onClose, onSelect }) {
  const { t } = useI18n();
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
          className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-3 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white">
                <Globe2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">{t('selectContinent')}</h2>
              <p className="text-white/50 text-center text-sm mt-2">{t('filterPerformersRegion')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {continents.map((continent) => (
                <button
                  key={continent.id}
                  onClick={() => onSelect(continent.id)}
                  className="relative group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <span className="text-white font-medium text-sm group-hover:scale-105 transition-transform">
                    {t(continent.labelKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}