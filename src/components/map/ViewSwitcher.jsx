import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Map, LayoutGrid } from 'lucide-react';
import { useI18n } from '@/components/contexts/I18nContext';

export default function ViewSwitcher({ currentView }) {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex-shrink-0">
        <div className="inline-flex bg-[#222222]/90 backdrop-blur-xl rounded-full border border-white/5 p-1 h-10 shadow-lg">
          <Link
            to={createPageUrl('Map')}
            className={`px-6 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 tracking-wide ${
              currentView === 'globe'
                ? 'bg-white text-black shadow-lg' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            {t('viewGlobe')}
          </Link>
          <Link
            to={createPageUrl('List')}
            className={`px-6 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 tracking-wide ${
              currentView === 'list' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t('viewList')}
          </Link>
        </div>
      </div>
    </div>
  );
}