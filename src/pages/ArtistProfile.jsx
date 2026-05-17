import React from 'react';
import { useLocation } from 'react-router-dom';
import ArtistProfileContent from '@/components/profile/ArtistProfileContent.jsx';

export default function ArtistProfile() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const p = searchParams.get('p') || searchParams.get('slug') || searchParams.get('id');

  return <ArtistProfileContent artistIdOrSlug={p} />;
}A