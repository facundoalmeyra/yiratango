import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { useI18n } from '@/components/contexts/I18nContext';
import { translateCountryToSpanish } from '@/components/utils/spanishToEnglish';

export default function CityAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Search for a city...",
  disabled = false 
}) {
  const { lang } = useI18n();
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const searchCities = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=8&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await resp.json();

      const cities = results
        .filter((/** @type {any} */ r) => r.address)
        .map((/** @type {any} */ r) => ({
          city: r.address.city || r.address.town || r.address.village || r.address.county || r.name,
          country: r.address.country || '',
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
        }))
        .filter((/** @type {any} */ c) => c.city && c.country);

      const seen = new Set();
      const unique = cities.filter((/** @type {any} */ c) => {
        const key = `${c.city}-${c.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSuggestions(unique.slice(0, 5));
      setIsOpen(true);
    } catch (err) {
      console.error('City search error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedCity(null);
    onChange?.(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCities(newQuery);
    }, 500);
  };

  const handleSelect = (city) => {
    const displayCountry = lang === 'es' ? translateCountryToSpanish(city.country) : city.country;
    const displayName = `${city.city}, ${displayCountry}`;
    setQuery(displayName);
    setSelectedCity(city);
    setIsOpen(false);
    setSuggestions([]);
    
    setTimeout(() => {
      onSelect?.({
        city: city.city,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        displayName
      });
    }, 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Popover open={isOpen && suggestions.length > 0} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={query}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="bg-white/5 border-white/10 text-white pl-10 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4">
              {isLoading && (
                <Loader2 className="w-full h-full text-white animate-spin" />
              )}
              {selectedCity && !isLoading && (
                <Check className="w-full h-full text-white" />
              )}
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent 
          className="p-0 bg-[#1A1A1A] border-white/10 rounded-xl overflow-hidden shadow-2xl z-[2005]" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          align="start"
          side="bottom"
          avoidCollisions={false}
          sideOffset={8}
          style={{ width: wrapperRef.current ? wrapperRef.current.offsetWidth : 'auto' }}
        >
          {suggestions.map((city, index) => {
            const displayCountry = lang === 'es' ? translateCountryToSpanish(city.country) : city.country;
            return (
              <button
                key={`${city.city}-${city.country}-${index}`}
                onClick={() => handleSelect(city)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{city.city}</p>
                  <p className="text-white/50 text-sm">{displayCountry}</p>
                </div>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}