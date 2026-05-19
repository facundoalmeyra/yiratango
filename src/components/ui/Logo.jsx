import React from 'react';

const NEW_LOGO_URL = 'https://ajljhfxvkmxcmmsfuknj.supabase.co/storage/v1/object/public/assets/logo.png';

export default function Logo({ className, width = 120, height = 50, style }) {
  return (
    <img
      src={NEW_LOGO_URL}
      alt="Yira Tango"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain', filter: 'invert(1)', ...style }}
    />
  );
}