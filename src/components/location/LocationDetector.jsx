import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function LocationDetector({ onLocationDetected, disabled = false }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city/country
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `What city and country are at coordinates latitude ${latitude}, longitude ${longitude}? Return the exact city name and country.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                city: { type: "string" },
                country: { type: "string" },
                formatted_address: { type: "string" }
              }
            }
          });

          if (result?.city && result?.country) {
            onLocationDetected({
              city: result.city,
              country: result.country,
              latitude,
              longitude,
              displayName: `${result.city}, ${result.country}`
            });
          } else {
            setError('Could not determine your city');
          }
        } catch (err) {
          setError('Failed to get location details');
          console.error('Reverse geocoding error:', err);
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An error occurred while getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2 w-full">
      <Button
        onClick={detectLocation}
        disabled={disabled || isDetecting}
        className="w-full bg-white hover:bg-white/90 text-black font-semibold gap-2"
      >
        {isDetecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Detecting Location...
          </>
        ) : (
          <>
             <Navigation className="w-5 h-5" />
             Find me automatically
           </>
          )}
          </Button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
}