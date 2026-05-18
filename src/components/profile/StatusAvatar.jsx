import React from 'react';
import UserAvatar from '@/components/profile/UserAvatar';
import { getArtistState } from '@/components/utils/tourUtils';
import { cn } from '@/lib/utils';

export default function StatusAvatar({ 
  artist, 
  tours, 
  status: explicitStatus, 
  size = 'md', 
  className,
  avatarClassName,
  baseBorderColor = 'border-white/20',
  onClick
}) {
  // Determine status: use explicit if provided, otherwise calculate from tours
  let status = explicitStatus;
  if (!status && tours) {
    const artistTours = tours.filter(t => t.artist_id === artist.id);
    status = getArtistState(artistTours).status;
  }
  
  // Map size to UserAvatar size and wrapper dimensions
  const wrapperSizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    'full': 'w-full h-full'
  };

  // If size is not in our map (e.g. custom), default to empty string (rely on className)
  const wrapperClass = wrapperSizeClasses[size] || '';

  return (
    <div 
      className={cn("relative flex-shrink-0", wrapperClass, className)}
      onClick={onClick}
    >
      {/* Animated Ring for LIVE status */}
      {status === 'LIVE' && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-[#00C2D4] shadow-[0_0_10px_rgba(0,194,212,0.4)] pointer-events-none z-0" 
          style={{ animation: 'expandRing 2s infinite' }}
        />
      )}
      
      {/* Avatar with Status Border */}
      <UserAvatar 
        artistProfile={artist} 
        size={size}
        className={cn(
          "relative z-10 border-2 bg-[#111111] text-white w-full h-full",
          status === 'LIVE' ? 'border-[#00C2D4] shadow-[0_0_8px_rgba(0,194,212,0.6)]' : 
          status === 'TRANSIT' ? 'border-white/40' :
          status === 'UPCOMING' ? 'border-white/60' :
          baseBorderColor,
          avatarClassName
        )}
      />
    </div>
  );
}