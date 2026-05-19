import React, { useEffect } from 'react';

/**
 * SEO Component for Dynamic Meta Tags and JSON-LD
 * Handles document title, meta description, Open Graph, and Structured Data
 */
export default function SEO({ 
  title, 
  description = "Discover Tango artists, workshops & milongas near you with an interactive 3D map. Explore the global tango community and never miss an event.", 
  image, 
  type = 'website', 
  structuredData,
  canonicalUrl
}) {
  // Default: Yira logo. Landing page passes hero illustration. Artist profiles pass avatar_url.
  const finalImage = image || "https://ajljhfxvkmxcmmsfuknj.supabase.co/storage/v1/object/public/assets/logo.png";

  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = 'Yira Tango – Find Milongas, Workshops & Artists';
    document.title = title ? `${title} | Yira Tango` : baseTitle;

    // 2. Helper to update or create meta tags
    const updateMeta = (attributeName, attributeValue, content) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // 3. Update Standard Meta Tags
    updateMeta('name', 'description', description);
    updateMeta('name', 'robots', 'index, follow, max-image-preview:large');
    updateMeta('name', 'theme-color', '#0F0F0F');
    updateMeta('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');

    // 4. Update Open Graph Tags
    updateMeta('property', 'og:site_name', baseTitle);
    updateMeta('property', 'og:title', title || baseTitle);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:image', finalImage);
    updateMeta('property', 'og:type', type);
    updateMeta('property', 'og:url', window.location.href);
    updateMeta('property', 'fb:app_id', '899332766331592');

    // 5. Add Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || window.location.href.split('#')[0]);

    // 6. Inject JSON-LD Structured Data
    if (structuredData) {
      let script = document.querySelector('#seo-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'seo-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, finalImage, type, structuredData, canonicalUrl]);

  return null;
}