import React from 'react';

const NEW_LOGO_URL = 'https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/530951993_newyiralogo.png';

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