import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/components/contexts/I18nContext';

export default function Layout({ children }) {
  useEffect(() => {
    // Document title is managed by SEO component
    
    // Set favicon
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/dc714b033_newfavi.png';
    link.type = 'image/png';
    
    // Fix Safari viewport issues
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';

    // Disable pinch-to-zoom on iOS Safari
    const preventPinchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    // Disable double-tap-to-zoom on iOS Safari
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventPinchZoom);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  return (
    <I18nProvider>
      <div className="min-h-screen bg-[#0F0F0F]">
        <header className="sr-only" aria-hidden="true">
        <h1>Yira Tango – Find Milongas, Workshops & Artists</h1>
      </header>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@800&display=swap');
        
        @keyframes expandRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.05) 80%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
          pointer-events: none;
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }

        body {
          background-color: #000000;
          margin: 0;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        ::selection {
          background: rgba(150, 150, 150, 0.3);
        }

        button {
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        a, button, input, [role="button"] {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      <main>
        {children}
      </main>
      <footer className="sr-only" aria-hidden="true">
        <p>Discover Tango artists, workshops & milongas near you with an interactive 3D map. Explore the global tango community and never miss an event.</p>
        <p>Last Updated: <time dateTime={new Date().toISOString().split('T')[0]}>{new Date().toLocaleDateString()}</time></p>
      </footer>
      <Toaster 
        theme="dark"
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          },
        }}
      />
      </div>
    </I18nProvider>
  );
}