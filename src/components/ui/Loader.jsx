import React, { useEffect, useRef, useState } from 'react';

export default function Loader({ className, variant = 'dark' }) {
  const containerRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const numLines = 10;
  const fontSizePx = 54; 

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });
  }, []);
  
  useEffect(() => {
    if (!fontsLoaded || !containerRef.current) return;

    let animationFrameId;
    let currentRotation = 0;
    
    const lines = containerRef.current.querySelectorAll('.loader-line');
    const radius = (fontSizePx / 2) / Math.sin((180 / numLines) * (Math.PI / 180));
    
    const animate = () => {
      currentRotation += 1; // Velocidad de rotación
      
      lines.forEach((line, i) => {
        const baseAngle = -(360 / numLines) * i;
        const currentAngle = baseAngle + currentRotation;
        
        line.style.transform = `translate(-50%, -50%) rotateX(${currentAngle}deg) translateZ(${radius}px)`;
        
        let radians = currentAngle * (Math.PI / 180);
        let conversion = Math.abs(Math.cos(radians) / 2 + 0.5); 
        
        let fontW = 200 + 700 * conversion;
        let fontS = `${100 + 700 * conversion}%`;
        
        line.style.opacity = conversion + 0.1;
        line.style.fontWeight = fontW;
        line.style.fontStretch = fontS;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [fontsLoaded]);

  return (
    <div className={`flex items-center justify-center relative ${className || ''}`} style={{ perspective: '800px', height: '120px', width: '120px' }}>
      <style>{`
        @font-face {
            font-family: 'Bigger';
            src: url('data:font/woff2;charset=utf-8;base64,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') format('woff2'),
        url('data:font/woff;charset=utf-8;base64,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') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
        .loader-line {
            position: absolute;
            top: 50%;
            left: 50%;
            margin: 0;
            font-family: 'Bigger', sans-serif;
            font-size: ${fontSizePx}px;
            text-transform: uppercase;
            line-height: 1;
            transform-style: preserve-3d;
            color: ${variant === 'light' ? 'black' : 'white'};
            white-space: nowrap;
            will-change: transform, opacity, font-weight, font-stretch;
        }
      `}</style>

      {/* Esqueleto invisible hasta que cargue la fuente */}
      {!fontsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center opacity-50">
          <div className={`w-8 h-8 border-2 ${variant === 'light' ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'} rounded-full animate-spin`}></div>
        </div>
      )}

      {/* Contenedor del texto que se muestra suavemente */}
      <div 
        ref={containerRef} 
        className={`relative w-full h-full transition-opacity duration-300 ${fontsLoaded ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transformStyle: 'preserve-3d' }}
      >
        {Array.from({ length: numLines }).map((_, i) => (
          <h1 key={i} className="loader-line">yira</h1>
        ))}
      </div>
    </div>
  );
}