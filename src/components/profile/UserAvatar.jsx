import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserAvatar({ user, artistProfile, size = 'md', className, loading = 'lazy' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    full: 'w-full h-full text-4xl md:text-5xl',
  };

  const getDimensions = (s) => {
      switch(s) {
          case 'xs': return 24;
          case 'sm': return 32;
          case 'md': return 40;
          case 'lg': return 48;
          case 'full': return 160;
          default: return 40;
      }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarUrl = artistProfile?.avatar_url || user?.avatar_url || user?.picture;
  const displayName = artistProfile?.name || user?.full_name;

  return (
    <div className={cn(sizeClasses[size], "relative rounded-full overflow-hidden border border-white/20 flex items-center justify-center flex-shrink-0", avatarUrl ? "bg-[#111111]" : "bg-[#111111] text-white", className)}>
      {avatarUrl ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 skeleton-shimmer z-0" />
          )}
          <img
            src={avatarUrl}
            alt={displayName || 'User'}
            className={cn(
              "relative z-10 w-full h-full object-cover transition-all duration-700 ease-in-out",
              isLoaded ? "blur-0 scale-100 opacity-100" : "blur-lg scale-110 opacity-0"
            )}
            loading={loading}
            width={getDimensions(size)}
            height={getDimensions(size)}
            onLoad={() => setIsLoaded(true)}
          />
        </>
      ) : (
        <span className="font-medium text-inherit">
          {getInitials(displayName)}
        </span>
      )}
    </div>
  );
}