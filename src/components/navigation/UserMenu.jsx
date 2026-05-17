import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, MapPin, Heart, User as UserIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/components/contexts/I18nContext';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import NotificationBell from '@/components/notifications/NotificationBell';
import UserAvatar from '@/components/profile/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu({
  user,
  loadingUser,
  calculatedProfile,
  calculatedHasFanProfile,
  isSearchActive
}) {
  const { t } = useI18n();

  return (
    <div className={`pointer-events-auto flex items-center justify-center flex-shrink-0 transition-opacity duration-300 ${isSearchActive ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
      {loadingUser ? (
         <div className="w-8 h-8 rounded-full bg-[#111111] skeleton-shimmer border border-white/10 shadow-lg" />
      ) : user ? (
          <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
            <LanguageSwitcher />
            <NotificationBell user={user} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none p-2 -m-2 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer">
                  <div className="flex items-center justify-center p-1.5 pr-2.5 rounded-full hover:bg-white/10 transition-all gap-2">
                  <div className="relative">
                    <UserAvatar user={user} artistProfile={calculatedProfile} size="xs" className="border-white" />
                  </div>
                  <Menu className="w-5 h-5 text-white" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#111111] text-white border-white/10 z-[60]">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{calculatedProfile?.name || user?.full_name}</p>
                  <p className="text-xs leading-none text-white/70">{calculatedProfile?.slug ? `@${calculatedProfile.slug}` : user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {calculatedHasFanProfile ? (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                    <Link to={`${createPageUrl('FanProfile')}?tab=following`} className="w-full flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {t('followedArtists')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                    <Link to={`${createPageUrl('FanProfile')}?tab=account`} className="w-full flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      {t('myProfile')}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {calculatedProfile && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                        <Link to={`${createPageUrl('ProfileSettings')}?tab=dates`} className="w-full flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {t('myDates')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                        <Link to={`${createPageUrl('ProfileSettings')}?tab=requests`} className="w-full flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          {t('fanRequests')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                        <Link to={`${createPageUrl('ProfileSettings')}?tab=account`} className="w-full flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          {t('myProfile')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={async () => {
                  await base44.auth.logout();
                  window.location.reload();
                }}
                className="cursor-pointer text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
              >
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
          ) : (
          <div className="flex items-center gap-2 pointer-events-auto">
            <LanguageSwitcher />
            <button
              onClick={(e) => {
                e.preventDefault();
                base44.auth.redirectToLogin(window.location.origin + createPageUrl('Onboarding'));
              }}
              className="flex items-center justify-center px-4 h-8 rounded-full text-white hover:bg-white/10 transition-all font-medium text-xs pointer-events-auto cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              {t('login')}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                base44.auth.redirectToLogin(window.location.origin + createPageUrl('Onboarding'));
              }}
              className="flex items-center justify-center px-4 h-8 rounded-full bg-white text-black hover:bg-white/90 transition-all font-medium text-xs shadow-lg pointer-events-auto cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              {t('createFreeAccount')}
            </button>
          </div>
          )
      }
    </div>
  );
}