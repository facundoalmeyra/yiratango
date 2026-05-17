// Check if a tour date is active (ongoing or future)
export const isTourActive = (tour) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Support both old (date) and new (start_date/end_date) format
    if (tour.start_date && tour.end_date) {
      const startDate = new Date(tour.start_date);
      const endDate = new Date(tour.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Tour is active if today is between start and end date (inclusive) or in the future
      return endDate >= now;
    } else if (tour.date) {
      // Fallback to old format
      const eventDate = new Date(tour.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    }
    
    return false;
  } catch (err) {
    return false;
  }
};

// Check if a tour is currently ongoing (today is between start and end date)
export const isTourOngoing = (tour) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (tour.start_date && tour.end_date) {
      const startDate = new Date(tour.start_date);
      const endDate = new Date(tour.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Tour is ongoing if today is between start and end date (inclusive)
      return now >= startDate && now <= endDate;
    } else if (tour.date) {
      const eventDate = new Date(tour.date);
      eventDate.setHours(0, 0, 0, 0);
      return now.getTime() === eventDate.getTime();
    }
    
    return false;
  } catch (err) {
    return false;
  }
};

export const getArtistState = (tours) => {
  if (!tours || tours.length === 0) return { status: 'HOME' };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sorted = [...tours].sort((a, b) => new Date(a.start_date || a.date) - new Date(b.start_date || b.date));

  // 1. Check LIVE
  const liveTour = sorted.find(t => {
      const start = new Date(t.start_date || t.date);
      const end = new Date(t.end_date || t.date);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return now >= start && now <= end;
  });

  if (liveTour) return { status: 'LIVE', tour: liveTour };

  // 2. Find Next Tour
  const nextTourIndex = sorted.findIndex(t => {
      const start = new Date(t.start_date || t.date);
      start.setHours(0,0,0,0);
      return start > now;
  });

  const nextTour = nextTourIndex !== -1 ? sorted[nextTourIndex] : null;

  // 3. Check Transit (Must have a previous tour AND a next tour)
  if (nextTour && nextTourIndex > 0) {
      const lastTour = sorted[nextTourIndex - 1];
      // Ensure last tour actually ended
      const lastEnd = new Date(lastTour.end_date || lastTour.date);
      lastEnd.setHours(0,0,0,0);
      
      if (lastEnd < now) {
          const nextStart = new Date(nextTour.start_date || nextTour.date);
          nextStart.setHours(0,0,0,0);
          const diffTime = nextStart - now;
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Only show TRANSIT if the next tour starts within 15 days
          if (daysUntil <= 15) {
            return { 
                status: 'TRANSIT', 
                lastTour, 
                nextTour, 
                daysUntil 
            };
          }
      }
  }

  // If there's a next tour but not in transit from a previous one, 
  // we consider it HOME status (user is at base waiting for next tour)
  // NEXT status is effectively removed as a distinct active state override
  
  // If there's a next upcoming tour (but no live/transit), show UPCOMING state
  if (nextTour) {
    return { status: 'UPCOMING', nextTour };
  }


  return { status: 'HOME', nextTour };
};

const COUNTRY_CONTINENT_MAP = {
  // Europe
  'Germany': 'Europe', 'France': 'Europe', 'United Kingdom': 'Europe', 'UK': 'Europe', 'Belgium': 'Europe', 'Netherlands': 'Europe', 
  'Luxembourg': 'Europe', 'Ireland': 'Europe', 'Monaco': 'Europe', 'Poland': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe', 
  'Czech Republic': 'Europe', 'Slovakia': 'Europe', 'Hungary': 'Europe', 'Liechtenstein': 'Europe', 'Ukraine': 'Europe', 
  'Belarus': 'Europe', 'Moldova': 'Europe', 'Denmark': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Finland': 'Europe', 
  'Iceland': 'Europe', 'Estonia': 'Europe', 'Latvia': 'Europe', 'Lithuania': 'Europe', 'Spain': 'Europe', 'Portugal': 'Europe', 
  'Italy': 'Europe', 'Greece': 'Europe', 'Albania': 'Europe', 'Serbia': 'Europe', 'Croatia': 'Europe', 'Bosnia and Herzegovina': 'Europe', 
  'Slovenia': 'Europe', 'Montenegro': 'Europe', 'North Macedonia': 'Europe', 'Malta': 'Europe', 'Andorra': 'Europe', 
  'San Marino': 'Europe', 'Vatican City': 'Europe', 'Romania': 'Europe', 'Bulgaria': 'Europe',

  // North America (includes Central & Caribbean)
  'Canada': 'North America', 'United States': 'North America', 'USA': 'North America', 'Mexico': 'North America',
  'Guatemala': 'North America', 'Belize': 'North America', 'El Salvador': 'North America', 'Honduras': 'North America', 
  'Nicaragua': 'North America', 'Costa Rica': 'North America', 'Panama': 'North America', 'Cuba': 'North America', 
  'Dominican Republic': 'North America', 'Haiti': 'North America', 'Jamaica': 'North America', 'Bahamas': 'North America',

  // South America
  'Colombia': 'South America', 'Venezuela': 'South America', 'Ecuador': 'South America', 'Peru': 'South America', 
  'Bolivia': 'South America', 'Brazil': 'South America', 'Paraguay': 'South America', 'Uruguay': 'South America', 
  'Chile': 'South America', 'Argentina': 'South America',

  // Asia
  'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'North Korea': 'Asia', 'Mongolia': 'Asia',
  'Vietnam': 'Asia', 'Thailand': 'Asia', 'Indonesia': 'Asia', 'Philippines': 'Asia', 'Malaysia': 'Asia', 'Singapore': 'Asia',
  'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia', 'Turkmenistan': 'Asia', 'Kyrgyzstan': 'Asia', 'Tajikistan': 'Asia',
  'Turkey': 'Asia', 'Saudi Arabia': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia', 'Israel': 'Asia', 'Jordan': 'Asia', 
  'Lebanon': 'Asia', 'United Arab Emirates': 'Asia', 'UAE': 'Asia', 'India': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia',
  'Russia': 'Russia', // Special handling

  // Africa
  'Egypt': 'Africa', 'Nigeria': 'Africa', 'South Africa': 'Africa', 'Morocco': 'Africa', 'Kenya': 'Africa', 'Ethiopia': 'Africa', 
  'Democratic Republic of the Congo': 'Africa', 'Algeria': 'Africa', 'Ghana': 'Africa', 'Senegal': 'Africa', 'Tunisia': 'Africa',
  'Uganda': 'Africa', 'Sudan': 'Africa', 'Angola': 'Africa', 'Mozambique': 'Africa', 'Ivory Coast': 'Africa', 'Madagascar': 'Africa',
  'Cameroon': 'Africa', 'Niger': 'Africa', 'Mali': 'Africa', 'Burkina Faso': 'Africa', 'Malawi': 'Africa', 'Zambia': 'Africa',
  'Chad': 'Africa', 'Somalia': 'Africa', 'Zimbabwe': 'Africa', 'Guinea': 'Africa', 'Rwanda': 'Africa', 'Benin': 'Africa',
  'Burundi': 'Africa', 'South Sudan': 'Africa', 'Togo': 'Africa', 'Sierra Leone': 'Africa', 'Libya': 'Africa', 'Congo': 'Africa',
  'Liberia': 'Africa', 'Central African Republic': 'Africa', 'Mauritania': 'Africa', 'Eritrea': 'Africa', 'Namibia': 'Africa',
  'Gambia': 'Africa', 'Botswana': 'Africa', 'Gabon': 'Africa', 'Lesotho': 'Africa', 'Guinea-Bissau': 'Africa', 'Equatorial Guinea': 'Africa',
  'Mauritius': 'Africa', 'Eswatini': 'Africa', 'Djibouti': 'Africa', 'Comoros': 'Africa', 'Cabo Verde': 'Africa', 'Sao Tome and Principe': 'Africa',
  'Seychelles': 'Africa',

  // Oceania
  'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania', 'Fiji': 'Oceania', 'Solomon Islands': 'Oceania'
};

export const getContinent = (lat, lng, countryName) => {
  // 1. Try by Country Name first
  if (countryName) {
    const cleanName = countryName.trim();
    // Special handling for Russia (Split by Ural mountains approx longitude 60)
    if (cleanName === 'Russia' || cleanName === 'Russian Federation') {
      if (lng != null && lng > 60) return 'Asia';
      return 'Europe';
    }
    
    // Check map
    const mapped = COUNTRY_CONTINENT_MAP[Object.keys(COUNTRY_CONTINENT_MAP).find(k => k.toLowerCase() === cleanName.toLowerCase())];
    if (mapped) return mapped;
    
    // Direct map check
    if (COUNTRY_CONTINENT_MAP[cleanName]) return COUNTRY_CONTINENT_MAP[cleanName];
  }

  // 2. Fallback to Lat/Lng
  if (lat == null || lng == null) return null;
  
  // Refined Bounding Boxes
  // South America
  if (lat < 13 && lat > -60 && lng < -30 && lng > -95) return 'South America';
  
  // North America (Lat > 13 covering Central America)
  if (lat >= 13 && lat < 85 && lng < -30 && lng > -170) return 'North America';
  
  // Europe (Roughly)
  if (lat > 35 && lat < 72 && lng > -25 && lng < 45) return 'Europe';
  
  // Africa
  if (lat > -35 && lat <= 37 && lng > -20 && lng < 55) {
    // Exclude Europe overlap (Spain/Italy/Greece parts)
    if (lat > 35 && lng < 20) return 'Europe'; 
    return 'Africa';
  }
  
  // Asia
  if (lat > 10 && lat < 85 && lng >= 45 && lng < 180) return 'Asia'; // East/North Asia
  if (lat > -10 && lat <= 40 && lng >= 35 && lng < 150) return 'Asia'; // Middle East / SE Asia / India
  
  // Oceania
  if (lat > -50 && lat <= 10 && lng >= 110 && lng <= 180) return 'Oceania';
  
  return 'Unknown';
};