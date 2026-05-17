import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center when location changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function MiniMap({ 
  latitude, 
  longitude, 
  markerColor = '#D4AF37',
  className,
  zoom = 12,
  interactive = false
}) {
  const hasLocation = latitude && longitude;
  // Default to a world view if no location
  const position = hasLocation ? [latitude, longitude] : [20, 0];
  const currentZoom = hasLocation ? zoom : 2;
  
  // Custom marker with branding color
  const customIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className={cn("w-full h-full relative", className)}>
      <MapContainer
        center={position}
        zoom={currentZoom}
        scrollWheelZoom={interactive}
        zoomControl={false}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#1A1A1A' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {hasLocation && <Marker position={position} icon={customIcon} />}
        <MapUpdater center={position} zoom={currentZoom} />
      </MapContainer>
      
      <style jsx>{`
        :global(.leaflet-container) {
          background: #1A1A1A;
        }
        :global(.leaflet-control-attribution) {
          display: none !important;
        }
      `}</style>
    </div>
  );
}