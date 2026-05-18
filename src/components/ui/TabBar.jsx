import { motion } from 'framer-motion';

/**
 * Reusable tab navigation bar.
 *
 * @param {{
 *   tabs: Array<{key: string, label: string, icon?: import('react').ReactNode, badge?: number|string}>,
 *   activeTab: string,
 *   onChange: (key: string) => void,
 *   theme?: 'dark' | 'light',
 *   layoutId?: string,
 *   className?: string,
 * }} props
 */
export default function TabBar({ tabs, activeTab, onChange, theme = 'dark', layoutId = 'tabBar', className = '' }) {
  const dark = theme === 'dark';

  return (
    <div
      role="tablist"
      className={[
        'flex w-full',
        dark ? 'border-b border-white/10' : 'border-b border-black/10',
        className,
      ].join(' ')}
    >
      {tabs.map(tab => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              // layout
              'relative flex-1 flex items-center justify-center gap-2',
              'min-h-[44px] px-3 py-3',
              // typography
              'text-sm font-semibold tracking-wide select-none',
              // transitions
              'transition-colors duration-150',
              // rounded top corners so hover bg looks contained
              'rounded-t-sm',
              // focus
              'focus-visible:outline-none',
              dark
                ? [
                    'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40',
                    isActive
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05] active:bg-white/[0.08]',
                  ].join(' ')
                : [
                    'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30',
                    isActive
                      ? 'text-black'
                      : 'text-black/40 hover:text-black/70 hover:bg-black/[0.05] active:bg-black/[0.08]',
                  ].join(' '),
            ].join(' ')}
          >
            {tab.icon && (
              <span className={['transition-opacity', isActive ? 'opacity-100' : 'opacity-60'].join(' ')}>
                {tab.icon}
              </span>
            )}

            <span>{tab.label}</span>

            {tab.badge != null && (
              <span
                className={[
                  'ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full',
                  'text-[10px] font-bold flex items-center justify-center',
                  dark ? 'bg-white/20 text-white' : 'bg-black/15 text-black',
                  isActive && (dark ? '!bg-white !text-black' : '!bg-black !text-white'),
                ].join(' ')}
              >
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.span
                layoutId={layoutId}
                className={[
                  'absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full',
                  dark ? 'bg-white' : 'bg-black',
                ].join(' ')}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
