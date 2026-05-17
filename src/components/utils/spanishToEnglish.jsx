// Spanish → English translations for countries and continents
// Used to normalize user input so Spanish speakers can search in their language

export const COUNTRY_ES_TO_EN = {
  // Common Spanish country names → English
  'alemania': 'Germany',
  'francia': 'France',
  'reino unido': 'United Kingdom',
  'bélgica': 'Belgium',
  'belgica': 'Belgium',
  'países bajos': 'Netherlands',
  'paises bajos': 'Netherlands',
  'holanda': 'Netherlands',
  'luxemburgo': 'Luxembourg',
  'irlanda': 'Ireland',
  'mónaco': 'Monaco',
  'monaco': 'Monaco',
  'polonia': 'Poland',
  'austria': 'Austria',
  'suiza': 'Switzerland',
  'república checa': 'Czech Republic',
  'republica checa': 'Czech Republic',
  'eslovaquia': 'Slovakia',
  'hungría': 'Hungary',
  'hungria': 'Hungary',
  'liechtenstein': 'Liechtenstein',
  'ucrania': 'Ukraine',
  'bielorrusia': 'Belarus',
  'moldavia': 'Moldova',
  'dinamarca': 'Denmark',
  'suecia': 'Sweden',
  'noruega': 'Norway',
  'finlandia': 'Finland',
  'islandia': 'Iceland',
  'estonia': 'Estonia',
  'letonia': 'Latvia',
  'lituania': 'Lithuania',
  'españa': 'Spain',
  'espana': 'Spain',
  'portugal': 'Portugal',
  'italia': 'Italy',
  'grecia': 'Greece',
  'albania': 'Albania',
  'serbia': 'Serbia',
  'croacia': 'Croatia',
  'eslovenia': 'Slovenia',
  'montenegro': 'Montenegro',
  'macedonia del norte': 'North Macedonia',
  'malta': 'Malta',
  'andorra': 'Andorra',
  'rumania': 'Romania',
  'rumanía': 'Romania',
  'bulgaria': 'Bulgaria',
  'canadá': 'Canada',
  'canada': 'Canada',
  'estados unidos': 'United States',
  'eeuu': 'United States',
  'usa': 'United States',
  'méxico': 'Mexico',
  'mexico': 'Mexico',
  'guatemala': 'Guatemala',
  'belice': 'Belize',
  'el salvador': 'El Salvador',
  'honduras': 'Honduras',
  'nicaragua': 'Nicaragua',
  'costa rica': 'Costa Rica',
  'panamá': 'Panama',
  'panama': 'Panama',
  'cuba': 'Cuba',
  'república dominicana': 'Dominican Republic',
  'republica dominicana': 'Dominican Republic',
  'haití': 'Haiti',
  'haiti': 'Haiti',
  'jamaica': 'Jamaica',
  'bahamas': 'Bahamas',
  'colombia': 'Colombia',
  'venezuela': 'Venezuela',
  'ecuador': 'Ecuador',
  'perú': 'Peru',
  'peru': 'Peru',
  'bolivia': 'Bolivia',
  'brasil': 'Brazil',
  'brazil': 'Brazil',
  'paraguay': 'Paraguay',
  'uruguay': 'Uruguay',
  'chile': 'Chile',
  'argentina': 'Argentina',
  'china': 'China',
  'japón': 'Japan',
  'japon': 'Japan',
  'corea del sur': 'South Korea',
  'corea del norte': 'North Korea',
  'mongolia': 'Mongolia',
  'vietnam': 'Vietnam',
  'tailandia': 'Thailand',
  'indonesia': 'Indonesia',
  'filipinas': 'Philippines',
  'malasia': 'Malaysia',
  'singapur': 'Singapore',
  'turquía': 'Turkey',
  'turquia': 'Turkey',
  'arabia saudita': 'Saudi Arabia',
  'irán': 'Iran',
  'iran': 'Iran',
  'irak': 'Iraq',
  'israel': 'Israel',
  'jordania': 'Jordan',
  'líbano': 'Lebanon',
  'libano': 'Lebanon',
  'emiratos árabes unidos': 'United Arab Emirates',
  'emiratos arabes unidos': 'United Arab Emirates',
  'india': 'India',
  'pakistán': 'Pakistan',
  'pakistan': 'Pakistan',
  'bangladés': 'Bangladesh',
  'banglades': 'Bangladesh',
  'rusia': 'Russia',
  'egipto': 'Egypt',
  'nigeria': 'Nigeria',
  'sudáfrica': 'South Africa',
  'sudafrica': 'South Africa',
  'marruecos': 'Morocco',
  'kenia': 'Kenya',
  'etiopía': 'Ethiopia',
  'etiopia': 'Ethiopia',
  'argelia': 'Algeria',
  'ghana': 'Ghana',
  'senegal': 'Senegal',
  'túnez': 'Tunisia',
  'tunez': 'Tunisia',
  'australia': 'Australia',
  'nueva zelanda': 'New Zealand',
};

export const CONTINENT_ES_TO_EN = {
  'america del norte': 'North America',
  'américa del norte': 'North America',
  'norteamerica': 'North America',
  'norteamérica': 'North America',
  'america central': 'North America',
  'américa central': 'North America',
  'america del sur': 'South America',
  'América del sur': 'South America',
  'sudamerica': 'South America',
  'sudamérica': 'South America',
  'europa': 'Europe',
  'asia': 'Asia',
  'africa': 'Africa',
  'áfrica': 'Africa',
  'oceania': 'Oceania',
  'oceanía': 'Oceania',
};

/**
 * Normalize a search term: try Spanish→English mapping, fallback to original.
 * Works for both countries and continents.
 */
export function normalizeSearchTerm(term) {
  const lower = term.toLowerCase().trim();
  return COUNTRY_ES_TO_EN[lower] || CONTINENT_ES_TO_EN[lower] || term;
}

// Generate English → Spanish mapping dynamically from the primary map
// We only keep the first occurrence to avoid duplicates like eeuu/usa mapping to United States
export const COUNTRY_EN_TO_ES = Object.entries(COUNTRY_ES_TO_EN).reduce((acc, [es, en]) => {
  if (!acc[en]) {
    // Capitalize first letter of each word for the Spanish display name
    const formattedEs = es.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    acc[en] = formattedEs;
  }
  return acc;
}, {});

/**
 * Translate an English country name to Spanish for display.
 */
export function translateCountryToSpanish(englishName) {
  if (!englishName) return englishName;
  return COUNTRY_EN_TO_ES[englishName] || englishName;
}