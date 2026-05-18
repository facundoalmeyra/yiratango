import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { isTourActive, isTourOngoing, getArtistState } from '@/components/utils/tourUtils';
import StatusAvatar from '@/components/profile/StatusAvatar';

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat, lng, radius) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  
  // Natural Earth vector points align perfectly with this formulation
  // This matches standard THREE.SphereGeometry UV mapping automatically.
  const phi = (90 - numLat) * (Math.PI / 180);
  const theta = (numLng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return [x, y, z];
}

// Country borders from GeoJSON
function CountryBorders({ activeContinent, activeCountry }) {
  const [borders, setBorders] = useState([]);
  const [lineWidth, setLineWidth] = useState(0.5);
  const { camera } = useThree();
  const lastWidthRef = useRef(0.5);

  useFrame(() => {
    const dist = camera.position.length();
    // dist ~6 = zoomed out, ~2.5 = zoomed in
    const w = Math.round(Math.max(0.4, Math.min(2.0, (6.5 - dist) * 0.6)) * 10) / 10;
    if (w !== lastWidthRef.current) {
      lastWidthRef.current = w;
      setLineWidth(w);
    }
  });

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        const lines = [];
        data.features.forEach(feature => {
          const continent = feature.properties.CONTINENT;
          const country = feature.properties.NAME || feature.properties.ADMIN;
          const coords = feature.geometry.type === 'Polygon'
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;
          coords.forEach(polygon => {
            polygon.forEach(ring => {
              const points = ring.map(([lng, lat]) => {
                const vec = latLngToVector3(lat, lng, 2.002);
                return new THREE.Vector3(...vec);
              });
              if (points.length >= 2) lines.push({ points, continent, country });
            });
          });
        });
        setBorders(lines);
      });
  }, []);

  const hasFilter = !!(activeContinent || activeCountry);

  return (
    <group>
      {borders.map((line, idx) => {
        let isActive = false;
        if (activeCountry) {
          const c1 = line.country ? line.country.toLowerCase() : '';
          const c2 = activeCountry.toLowerCase();
          isActive = c1 === c2 ||
            (c1 === 'united states of america' && c2 === 'united states') ||
            (c1 === 'united states' && c2 === 'usa') ||
            (c1 === 'united kingdom' && c2 === 'uk');
        } else if (activeContinent) {
          isActive = line.continent === activeContinent;
        }
        const opacity = hasFilter ? (isActive ? 0.9 : 0.05) : 0.12;
        return (
          <Line
            key={idx}
            points={line.points}
            color="#ffffff"
            transparent
            opacity={opacity}
            lineWidth={lineWidth}
          />
        );
      })}
    </group>
  );
}



// Cluster marker for multiple maestros
const ClusterMarker3D = React.memo(({ count, position, onClusterClick, status, visibility = 'always' }) => {
  const groupRef = useRef();
  const divRef = useRef();
  const { camera } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  
  useFrame((state) => {
    if (!groupRef.current || !divRef.current) return;

    const distance = camera.position.length();
    const isZoomedIn = distance < 4.0;

    let shouldShowBasedOnZoom = true;
    if (visibility === 'zoomedOut' && isZoomedIn) shouldShowBasedOnZoom = false;
    if (visibility === 'zoomedIn' && !isZoomedIn) shouldShowBasedOnZoom = false;

    if (!shouldShowBasedOnZoom) {
      if (divRef.current.style.display !== 'none') {
        divRef.current.style.display = 'none';
        divRef.current.style.pointerEvents = 'none';
      }
      return;
    }

    // Visibility Check
    groupRef.current.getWorldPosition(vec);
    camera.getWorldDirection(cameraDirection);
    const markerDirection = vec.normalize();
    
    // dotProduct is 1 when facing camera directly, 0 when on the edge, -1 when behind
    const dotProduct = markerDirection.dot(cameraDirection.negate());
    
    // Wider transition zone: Start at 0.6, end at 0.15
    const isVisible = dotProduct > 0.15;
    
    // FIX: Use 'flex' instead of 'block' to keep centering working
    const targetDisplay = isVisible ? 'flex' : 'none';
    if (divRef.current.style.display !== targetDisplay) {
      divRef.current.style.display = targetDisplay;
      divRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
    }

    if (isVisible) {
      // Smooth fade out and scale down at edges
      // Map range [0.15, 0.6] to [0, 1]
      const edgeFactor = Math.max(0, Math.min(1, (dotProduct - 0.15) / 0.45));
      
      // Apply scale animation + edge scaling
      const sizeFactor = 0.5 + (0.5 * edgeFactor); 
      
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      const finalScale = pulseScale * sizeFactor;
      
      groupRef.current.scale.setScalar(finalScale);
      
      // Apply opacity fade
      if (divRef.current.style.opacity !== edgeFactor.toString()) {
        divRef.current.style.opacity = edgeFactor;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        zIndexRange={[30, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div 
          ref={divRef}
          onClick={(e) => {
            e.stopPropagation();
            onClusterClick();
          }}
          className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 bg-black cursor-pointer shadow-md transition-all duration-200 ${
            status === 'LIVE' ? 'border-[#00C2D4] shadow-[0_0_15px_rgba(0,194,212,0.5)]' :
            status === 'TRANSIT' ? 'border-white/40' :
            status === 'UPCOMING' ? 'border-white/40' :
            'border-white/60'
          }`}
          style={{ 
            pointerEvents: 'auto',
            display: 'flex' // Ensure flex is set initially
          }}
        >
          {status === 'LIVE' && (
            <div className="absolute inset-0 rounded-full border-2 border-[#00C2D4]/50 pointer-events-none" 
                 style={{ animation: 'expandRing 2s cubic-bezier(0.2, 0, 0.8, 1) infinite' }} />
          )}
          <span className="text-white font-bold text-sm select-none relative z-10">{count}</span>
        </div>
      </Html>
    </group>
  );
});

// Helper for initials
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Individual maestro marker
const ArtistMarker3D = React.memo(({ artist, position, isSelected, onClick, onInteract, status, daysUntil, visibility = 'always' }) => {
  const groupRef = useRef();
  const divRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);

  const displayName = (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name 
    ? `${artist.name} & ${artist.partner_name}` 
    : artist.name;

  useFrame(() => {
    if (!groupRef.current || !divRef.current) return;

    const distance = camera.position.length();
    const isZoomedIn = distance < 4.0;

    let shouldShowBasedOnZoom = true;
    if (visibility === 'zoomedOut' && isZoomedIn) shouldShowBasedOnZoom = false;
    if (visibility === 'zoomedIn' && !isZoomedIn) shouldShowBasedOnZoom = false;

    if (!shouldShowBasedOnZoom) {
      if (divRef.current.style.display !== 'none') {
        divRef.current.style.display = 'none';
        divRef.current.style.pointerEvents = 'none';
      }
      return;
    }

    // Visibility Check
    groupRef.current.getWorldPosition(vec);
    camera.getWorldDirection(cameraDirection);
    const markerDirection = vec.normalize();
    
    const dotProduct = markerDirection.dot(cameraDirection.negate());
    const isVisible = dotProduct > 0.15;

    const targetDisplay = isVisible ? 'block' : 'none';
    if (divRef.current.style.display !== targetDisplay) {
      divRef.current.style.display = targetDisplay;
      divRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
    }
    
    if (isVisible) {
      const edgeFactor = Math.max(0, Math.min(1, (dotProduct - 0.15) / 0.45));
      const sizeFactor = 0.5 + (0.5 * edgeFactor);
      groupRef.current.scale.setScalar(sizeFactor);
      
      if (divRef.current.style.opacity !== edgeFactor.toString()) {
        divRef.current.style.opacity = edgeFactor;
      }

      // Scale up avatars slightly when zoomed in on desktop
      // distance ranges: ~10 (far) to ~2.1 (max zoom)
      // We map [10, 2.1] -> [1.0, 1.5] for a subtle grow effect
      const zoomScale = Math.max(1.0, Math.min(1.5, 1.0 + (10 - distance) / (10 - 2.1) * 0.5));
      const newTransform = `scale(${zoomScale})`;
      if (divRef.current.style.transform !== newTransform) {
        divRef.current.style.transform = newTransform;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        zIndexRange={[100, 50]}
        style={{ pointerEvents: 'none' }} // Wrapper doesn't block events, inner div does
      >
        <div ref={divRef}>
          <div 
            className="relative"
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
              onClick(artist);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ 
              transform: `scale(${hovered || isSelected ? 1.2 : 1})`,
              transition: 'transform 0.2s',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            <StatusAvatar 
              artist={artist}
              status={status}
              size="sm" // Globe markers are small
              className={isSelected || hovered ? 'border-white scale-105 transition-transform' : 'transition-transform'}
              avatarClassName="bg-[#111111] text-white"
            />
          </div>
          {(hovered || isSelected) && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-2 py-1 bg-[#0F0F0F]/90 text-white text-xs rounded-lg border border-white/30">
                {displayName}
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
});

// Globe sphere with Earth texture and overlays
function GlobeSphere({ globeRef, autoRotate, activeContinent, activeCountry, isInteracting, children }) {
  const [textureState, setTextureState] = useState({
    texture1: null,
    texture2: null,
    isTransitioning: false
  });
  
  // Load and convert Earth texture to grayscale
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    // 1. Load blurred low-res first using an image proxy
    loader.load('https://wsrv.nl/?url=unpkg.com/three-globe/example/img/earth-blue-marble.jpg&w=256&blur=10', (lowResTex) => {
      lowResTex.wrapS = THREE.RepeatWrapping;
      lowResTex.offset.x = 0;
      
      setTextureState(prev => ({ ...prev, texture1: lowResTex }));
      
      // 2. Then load high-res
      loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', (highResTex) => {
        highResTex.wrapS = THREE.RepeatWrapping;
        highResTex.offset.x = 0;
        
        setTextureState(prev => ({ ...prev, texture2: highResTex, isTransitioning: true }));
      });
    });
  }, []);
  
  // Create geometries using useMemo
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(2, 48, 48), []);
  const dotsGeometry = useMemo(() => new THREE.SphereGeometry(2.01, 48, 48), []);
  
  // Grayscale shader material for Earth texture
  const earthMaterial = useMemo(() => {
    if (!textureState.texture1) {
      return new THREE.MeshBasicMaterial({ 
        color: '#1a1a1a',
        depthTest: true,
        depthWrite: true
      });
    }
    
    return new THREE.ShaderMaterial({
      uniforms: {
        texture1: { value: textureState.texture1 },
        texture2: { value: textureState.texture2 || textureState.texture1 },
        mixRatio: { value: 0.0 },
        dimFactor: { value: (activeContinent || activeCountry) ? 0.7 : 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform float mixRatio;
        uniform float dimFactor;
        varying vec2 vUv;
        void main() {
          vec4 texel1 = texture2D(texture1, vUv);
          vec4 texel2 = texture2D(texture2, vUv);
          
          vec4 texel = mix(texel1, texel2, mixRatio);
          float gray = dot(texel.rgb, vec3(0.299, 0.587, 0.114));

          // Mask approach: lift dark lands, keep oceans black, boost relief contrast
          // First: gentle lift to shadows (land) while preserving ocean blacks
          float shadowLift = 0.35; // Raises dark areas
          float lifted = gray + (1.0 - gray) * shadowLift * (1.0 - gray); // Selective lift
          
          // Then: aggressive contrast to define country borders + relief
          float contrast = 3.2;
          float boosted = (lifted - 0.5) * contrast + 0.5;
          boosted = clamp(boosted, 0.0, 1.0);

          vec3 finalColor = vec3(boosted);
          if (dimFactor > 0.0) {
            finalColor *= (1.0 - dimFactor);
          }
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      depthTest: true,
      depthWrite: true
    });
  }, [textureState.texture1, textureState.texture2, activeContinent, activeCountry]);
  
  // Background dots material (land mesh layer)
  const dotsMaterial = useMemo(() => new THREE.PointsMaterial({ 
    color: '#aaaaaa', 
    size: 0.014, 
    transparent: true, 
    opacity: 0.55,
    sizeAttenuation: true,
    depthTest: true
  }), []);
  
  useFrame((state, delta) => {
    if (textureState.isTransitioning && earthMaterial.uniforms?.mixRatio) {
      if (earthMaterial.uniforms.mixRatio.value < 1.0) {
        earthMaterial.uniforms.mixRatio.value = Math.min(1.0, earthMaterial.uniforms.mixRatio.value + delta * 0.8);
      }
    }
    
    // Smooth globe scale on interaction (only when zoomed out)
    if (globeRef?.current && state.camera) {
      // Calculate distance from camera to globe center
      const cameraDistance = state.camera.position.length();
      // Only apply effect when zoomed out (camera distance > 3.5)
      const isZoomedOut = cameraDistance > 3.5;
      const shouldScale = isInteracting && isZoomedOut;
      
      const targetScale = shouldScale ? 1.08 : 1.0;
      const lerpFactor = delta * 6.67; // 150ms transition time
      globeRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpFactor);
    }
  });

  return (
    <group ref={globeRef}>
      {/* Layer 1: Base Earth texture (grayscale) */}
      <mesh material={earthMaterial} geometry={sphereGeometry} />
      
      {/* Layer 2: Background dots (land mesh) */}
      <points geometry={dotsGeometry}>
        <pointsMaterial color="#bbbbbb" size={0.014} transparent opacity={(activeContinent || activeCountry) ? 0.15 : 0.5} sizeAttenuation depthTest />
      </points>
      
      {/* Layer 3: Country Borders */}
      <group>
        <CountryBorders activeContinent={activeContinent} activeCountry={activeCountry} />
      </group>
      
      {/* Layer 5: Markers (children) - top layer */}
      {children}
    </group>
  );
}

// Stars background
function StarsBackground() {
  const starsRef = useRef();
  
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < 500; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);
  
  const starsMaterial = useMemo(() => new THREE.PointsMaterial({ 
    color: '#ffffff', 
    size: 0.5, 
    transparent: true, 
    opacity: 0.8,
    sizeAttenuation: true
  }), []);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
    }
  });

  return <points ref={starsRef} geometry={starsGeometry} material={starsMaterial} />;
}

// Main scene
function Scene({ isInteracting, setIsInteracting, isZoomedOut, setIsZoomedOut, artists, selectedArtist, onArtistSelect, onClusterSelect, tours, zoomToArtistTrigger, resetZoomTrigger, zoomToUserTrigger, zoomToContinentTrigger, zoomToCountryTrigger, userProfile, activeContinent, activeCountry }) {
  const globeRef = useRef();
  const controlsRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);
  const { camera, viewport } = useThree();
  
  // Monitor camera distance to determine zoom state
  useFrame(() => {
    if (camera) {
      const cameraDistance = camera.position.length();
      setIsZoomedOut(cameraDistance > 3.5);
    }
  });

  // Animation state
  const animationRef = useRef({
    active: false,
    startTime: 0,
    duration: 0,
    startPos: null,
    endPos: null,
    targetPoint: null
  });

  const spinRef = useRef({
    active: false,
    startTime: 0,
    duration: 0,
    startRotation: 0,
    targetRotation: 0
  });

  // Initial camera adjustment
  useEffect(() => {
    const aspectRatio = viewport.width / viewport.height;
    if (aspectRatio < 1) {
       camera.position.set(0, 0, 13.5); // Mobile (Portrait)
    } else {
       camera.position.set(0, 0, 10.0); // Desktop (Landscape)
    }
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) controlsRef.current.update();
  }, []);

  const lastDistanceRef = useRef(5);

  // Handle Zoom to Continent
  useEffect(() => {
    if (zoomToContinentTrigger > 0 && activeContinent) {
      const continentCenters = {
        'North America': { lat: 45, lng: -100, zoom: 9.0 },
        'South America': { lat: -20, lng: -60, zoom: 9.0 },
        'Europe': { lat: 51, lng: 10, zoom: 9.0 },
        'Asia': { lat: 35, lng: 90, zoom: 9.0 },
        'Africa': { lat: 0, lng: 20, zoom: 9.0 },
        'Oceania': { lat: -25, lng: 135, zoom: 9.0 },
      };

      const target = continentCenters[activeContinent];
      if (target) {
        const { lat, lng, zoom } = target;
        
        // Stop rotation
        setAutoRotate(false);

        // Calculate target position
        const localPoint = new THREE.Vector3(...latLngToVector3(lat, lng, 2));
        const worldPoint = localPoint.clone();
        
        if (globeRef.current) {
           // We need to rotate the globe/camera to look at this point.
           // However, applying current rotation might be tricky if we want a standard view.
           // Let's use the same logic as zooming to artist: apply current rotation to world point
           worldPoint.applyEuler(globeRef.current.rotation);
        }

        const direction = worldPoint.clone().normalize();
        
        // Adjust zoom distance based on continent size/preference
        const targetDist = zoom;
        const endPos = direction.clone().multiplyScalar(targetDist);
        
        const startPos = camera.position.clone();
        
        // Curve the path
        const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        if (midPos.length() < targetDist + 2) {
            midPos.normalize().multiplyScalar(targetDist + 4);
        }

        animationRef.current = {
            active: true,
            startTime: Date.now(),
            duration: 1500,
            startPos: startPos,
            midPos: midPos,
            endPos: endPos,
            targetPoint: new THREE.Vector3(0, 0, 0)
        };
      }
    }
  }, [zoomToContinentTrigger, activeContinent, camera]);

  // Handle Zoom to Country
  useEffect(() => {
    if (zoomToCountryTrigger > 0 && activeCountry && artists.length > 0) {
      let lat = 0;
      let lng = 0;
      let count = 0;
      
      artists.forEach(artist => {
        const artistTours = tours.filter(t => t.artist_id === artist.id || t.artist_id === artist.slug);
        const state = getArtistState(artistTours);
        
        let aLat, aLng;
        if (state.status === 'LIVE' && state.tour) {
          aLat = state.tour.latitude;
          aLng = state.tour.longitude;
        } else if (state.status === 'TRANSIT' && state.lastTour) {
          aLat = state.lastTour.latitude;
          aLng = state.lastTour.longitude;
        } else {
          aLat = artist.current_latitude;
          aLng = artist.current_longitude;
        }
        
        if (aLat != null && aLng != null && !isNaN(Number(aLat)) && !isNaN(Number(aLng))) {
          lat += Number(aLat);
          lng += Number(aLng);
          count++;
        }
      });

      if (count > 0) {
        lat /= count;
        lng /= count;
        
        setAutoRotate(false);

        const localPoint = new THREE.Vector3(...latLngToVector3(lat, lng, 2));
        const worldPoint = localPoint.clone();
        
        if (globeRef.current) {
           worldPoint.applyEuler(globeRef.current.rotation);
        }

        const direction = worldPoint.clone().normalize();
        
        // Closer zoom for countries than continents
        const targetDist = 4.0; 
        const endPos = direction.clone().multiplyScalar(targetDist);
        
        const startPos = camera.position.clone();
        
        const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        if (midPos.length() < targetDist + 1) {
            midPos.normalize().multiplyScalar(targetDist + 3);
        }

        animationRef.current = {
            active: true,
            startTime: Date.now(),
            duration: 1500,
            startPos: startPos,
            midPos: midPos,
            endPos: endPos,
            targetPoint: new THREE.Vector3(0, 0, 0)
        };
      }
    }
  }, [zoomToCountryTrigger, activeCountry, artists, tours, camera]);

  // Handle animation in render loop for smoothness and exact positioning
  useFrame(() => {
    // 1. Update rotate speed dynamically without React state
    const distance = camera.position.length();
    if (controlsRef.current) {
        controlsRef.current.rotateSpeed = distance < 3.0 ? 0.1 :
                                          distance < 5.0 ? 0.5 :
                                          distance < 7.0 ? 1.2 :
                                          distance < 10.0 ? 2.5 : 4.0;
    }

    // 2. Handle Zoom Animation
    if (animationRef.current.active) {
      const { startTime, duration, startPos, midPos, endPos, targetPoint } = animationRef.current;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeInOutCubic for a smoother curve
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Disable controls during animation
      if (controlsRef.current) controlsRef.current.enabled = false;

      // Solución simple y óptima: Rotación esférica primero, luego el zoom
      const startDist = startPos.length();
      const endDist = endPos.length();
      
      const startDir = startPos.clone().normalize();
      const endDir = endPos.clone().normalize();

      // Evitar que la interpolación pase por el centro si los puntos son diametralmente opuestos
      if (startDir.distanceTo(endDir) > 1.99) {
        startDir.x += 0.01;
        startDir.normalize();
      }

      // 1. Primero rotamos (0 a 0.6 del progreso)
      const rotateProgress = Math.min(eased / 0.6, 1.0);
      const currentDir = startDir.lerp(endDir, rotateProgress).normalize();

      // 2. Después hacemos el zoom (0.6 a 1.0 del progreso)
      const zoomProgress = Math.max(0, (eased - 0.6) / 0.4);
      const currentDist = startDist + (endDist - startDist) * zoomProgress;

      camera.position.copy(currentDir).multiplyScalar(currentDist);
      
      // Ensure camera looks exactly at the target
      camera.lookAt(targetPoint);
      
      // End animation
      if (progress >= 1) {
        animationRef.current.active = false;
        if (controlsRef.current) {
            controlsRef.current.enabled = true;
        }
      }
    }

    // 3. Handle Spin Animation
    if (spinRef.current.active && globeRef.current) {
      const { startTime, duration, startRotation, targetRotation } = spinRef.current;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quartic ease out for "wow" effect (fast start, slow stop)
      const eased = 1 - Math.pow(1 - progress, 4);
      
      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      globeRef.current.rotation.y = currentRotation;
      
      if (progress >= 1) {
        spinRef.current.active = false;
        setAutoRotate(false);
      }
    }
  });

  // Calculate zoom position based on viewport size to keep markers centered and visible
  const getZoomDistance = (isCluster = false, isMacro = false) => {
    // Determine screen aspect ratio
    const isMobile = viewport.width < 768 / 100; // rough approximation or just use width
    // If viewport is small (mobile), zoom out slightly more to provide context
    let baseDist = isCluster ? 3.2 : 2.5; 
    if (isMacro) baseDist = 2.15; // Maximum zoom for large clusters (minDistance is 2.1)
    
    // Adjust distance based on screen size (viewport.width is in three.js units)
    // Small viewport -> larger distance needed to see same area? 
    // Actually, in perspective camera, smaller viewport width with fixed FOV means less visible horizontally.
    // So to see the same context, we might need to be farther back on narrow screens.
    
    // Simple heuristic: if width is small relative to height, pull back
    const aspectRatio = viewport.width / viewport.height;
    const distanceMultiplier = aspectRatio < 1 ? 1.05 : 1.0; // Reduced multiplier to ensure deeper zoom on mobile too
    
    return baseDist * distanceMultiplier;
  };

  // Handle Zoom to User (Initial Load or Profile return)
  useEffect(() => {
    if (zoomToUserTrigger > 0) {
      const startPos = camera.position.clone();
      const aspectRatio = viewport.width / viewport.height;
      const targetDist = aspectRatio < 1 ? 13.5 : 10.0;
      
      if (!userProfile) {
        setAutoRotate(true);
        const currentDist = startPos.length();
        if (Math.abs(currentDist - targetDist) > 0.1) {
          const currentDir = startPos.clone().normalize();
          if (currentDir.lengthSq() < 0.1) currentDir.set(0, 0, 1);
          const endPos = currentDir.multiplyScalar(targetDist);
          animationRef.current = {
            active: true,
            startTime: Date.now(),
            duration: 2000,
            startPos: startPos,
            midPos: null,
            endPos: endPos,
            targetPoint: new THREE.Vector3(0, 0, 0)
          };
        }
        return;
      }

      let targetDirection = new THREE.Vector3(0, 0, 1);
      
      let lat = -34.6037; // Default to Buenos Aires, Argentina
      let lng = -58.3816;
      
      let hasLocation = false;
      if (userProfile) {
        let uLat = userProfile.current_latitude;
        let uLng = userProfile.current_longitude;
        const artistTours = tours.filter(t => t.artist_id === userProfile.id || t.artist_id === userProfile.slug);
        const state = getArtistState(artistTours);
        if (state.status === 'LIVE') {
            uLat = state.tour.latitude;
            uLng = state.tour.longitude;
        } else if (state.status === 'TRANSIT') {
            uLat = state.lastTour.latitude;
            uLng = state.lastTour.longitude;
        } else if (state.status === 'UPCOMING') {
            uLat = state.nextTour.latitude;
            uLng = state.nextTour.longitude;
        }

        if (uLat != null && uLng != null && !isNaN(Number(uLat)) && !isNaN(Number(uLng))) {
            lat = Number(uLat);
            lng = Number(uLng);
            hasLocation = true;
        }
      }

      const spins = 0.15; // Mini discreet spin
      const localPoint = new THREE.Vector3(...latLngToVector3(lat, lng, 2));
      const worldPoint = localPoint.clone();
      worldPoint.applyEuler(new THREE.Euler(0, globeRef.current ? globeRef.current.rotation.y + (Math.PI * 2 * spins) : 0, 0));
      targetDirection = worldPoint.normalize();

      // If user is an artist with a location, zoom in — keep globe visible
      const finalDist = hasLocation ? 3.8 : targetDist;
      const endPos = targetDirection.multiplyScalar(finalDist);
      
      animationRef.current = {
        active: true,
        startTime: Date.now(),
        duration: 3000, // Smooth slow animation
        startPos: startPos,
        midPos: null,
        endPos: endPos,
        targetPoint: new THREE.Vector3(0, 0, 0)
      };
      
      setAutoRotate(false);
      
      if (globeRef.current) {
        spinRef.current = {
          active: true,
          startTime: Date.now(),
          duration: 3000,
          startRotation: globeRef.current.rotation.y,
          targetRotation: globeRef.current.rotation.y + (Math.PI * 2 * spins)
        };
      }
    }
  }, [zoomToUserTrigger, camera, viewport, userProfile, tours]);

  // Handle Reset Zoom (Logo Click)
  useEffect(() => {
    if (resetZoomTrigger > 0) {
      // Reset to initial view
      const startPos = camera.position.clone();
      
      // Determine initial position based on viewport (same logic as initial load)
      const aspectRatio = viewport.width / viewport.height;
      const targetDist = aspectRatio < 1 ? 13.5 : 10.0;
      
      let targetDirection = new THREE.Vector3(0, 0, 1);
      
      if (userProfile) {
        let lat = userProfile.current_latitude;
        let lng = userProfile.current_longitude;
        const artistTours = tours.filter(t => t.artist_id === userProfile.id || t.artist_id === userProfile.slug);
        const state = getArtistState(artistTours);
        if (state.status === 'LIVE') {
            lat = state.tour.latitude;
            lng = state.tour.longitude;
        } else if (state.status === 'TRANSIT') {
            lat = state.lastTour.latitude;
            lng = state.lastTour.longitude;
        }

        if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
            lat = Number(lat);
            lng = Number(lng);
            const localPoint = new THREE.Vector3(...latLngToVector3(lat, lng, 2));
            const worldPoint = localPoint.clone();
            worldPoint.applyEuler(new THREE.Euler(0, globeRef.current ? globeRef.current.rotation.y + (Math.PI * 2 * 3) : 0, 0));
            targetDirection = worldPoint.normalize();
        }
      }

      const endPos = targetDirection.multiplyScalar(targetDist);
      
      // Calculate control point to arc over the globe
      const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      const maxDist = Math.max(startPos.length(), endPos.length());
      const arcTargetDist = maxDist < 5 ? 10 : maxDist + 5;
      
      if (midPos.length() < 0.1) {
        midPos.set(startPos.y, startPos.z, startPos.x).normalize().multiplyScalar(arcTargetDist);
      } else {
        midPos.normalize().multiplyScalar(arcTargetDist);
      }

      // Start reset animation
      animationRef.current = {
        active: true,
        startTime: Date.now(),
        duration: 2500,
        startPos: startPos,
        midPos: midPos,
        endPos: endPos,
        targetPoint: new THREE.Vector3(0, 0, 0)
      };
      
      // Start spin animation
      if (globeRef.current) {
        setAutoRotate(false);
        spinRef.current = {
          active: true,
          startTime: Date.now(),
          duration: 2500,
          startRotation: globeRef.current.rotation.y,
          targetRotation: globeRef.current.rotation.y + (Math.PI * 2 * 3) // 3 full fast spins
        };
      }
    }
  }, [resetZoomTrigger, camera, viewport, userProfile, tours]);

  // Zoom to artist when selected from search
  useEffect(() => {
    if (zoomToArtistTrigger > 0 && selectedArtist) {
      let lat, lng;
      
      // Determine target coordinates (Tour vs Home Base)
      if (selectedArtist.type === 'place') {
          lat = selectedArtist.current_latitude;
          lng = selectedArtist.current_longitude;
      } else {
        const artistTours = tours.filter(t => t.artist_id === selectedArtist.id || t.artist_id === selectedArtist.slug);
        const state = getArtistState(artistTours);
        
        if (state.status === 'LIVE') {
            lat = state.tour.latitude;
            lng = state.tour.longitude;
        } else if (state.status === 'TRANSIT') {
            lat = state.lastTour.latitude;
            lng = state.lastTour.longitude;
        } else if (state.status === 'UPCOMING') {
            lat = state.nextTour.latitude;
            lng = state.nextTour.longitude;
        } else {
            lat = selectedArtist.current_latitude;
            lng = selectedArtist.current_longitude;
        }
      }
      
      if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        lat = Number(lat);
        lng = Number(lng);
        // Stop rotation FIRST to ensure coordinates are stable
        setAutoRotate(false);

        // 1. Calculate Local position on the sphere
        const localPoint = new THREE.Vector3(...latLngToVector3(lat, lng, 2));
        
        // 2. Convert to World position by applying current globe rotation
        // This is critical because the globe rotates, shifting the actual 3D position of markers
        const worldPoint = localPoint.clone();
        if (globeRef.current) {
             worldPoint.applyEuler(globeRef.current.rotation);
        }

        // To center the point in the viewport, we need to position the camera
        // on the line extending from the center of the globe through the point.
        const direction = worldPoint.clone().normalize();
        
        // Zoom distance: close enough to see avatar but globe still visible
        const zoomDist = 3.8;
        const endPos = direction.clone().multiplyScalar(zoomDist);
        
        // Calculate control point to arc over the globe
        const startPos = camera.position.clone();
        const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const maxDist = Math.max(startPos.length(), endPos.length());
        
        // Push the mid-point outwards based on how far we need to move
        const distBetween = startPos.distanceTo(endPos);
        const targetDist = Math.max(maxDist + 1, Math.min(12, maxDist + distBetween * 0.6));
        
        if (midPos.length() < 0.1) {
          midPos.set(startPos.y, startPos.z, startPos.x).normalize().multiplyScalar(targetDist);
        } else {
          midPos.normalize().multiplyScalar(targetDist);
        }

        // Start animation
        animationRef.current = {
            active: true,
            startTime: Date.now(),
            duration: 1100, // Smooth zoom
            startPos: startPos,
            midPos: midPos,
            endPos: endPos,
            targetPoint: new THREE.Vector3(0, 0, 0) // Look at origin to avoid camera jump
        };
      }
    }
  }, [zoomToArtistTrigger, selectedArtist, tours, camera, viewport]);

  const handleClusterClick = (clusterCenterLat, clusterCenterLng, clusterArtists, isMacro) => {
    // Stop rotation FIRST
    setAutoRotate(false);
    
    if (!isMacro) {
      if (onClusterSelect) {
        onClusterSelect(clusterArtists);
      }
      return; // Do not move camera when clicking micro clusters
    }

    // 1. Local position
    const localPoint = new THREE.Vector3(...latLngToVector3(clusterCenterLat, clusterCenterLng, 2));
    
    // 2. World position (account for globe rotation)
    const worldPoint = localPoint.clone();
    if (globeRef.current) {
        worldPoint.applyEuler(globeRef.current.rotation);
    }

    const direction = worldPoint.clone().normalize();
    
    // Calculate dynamic zoom distance for cluster
    const zoomDist = getZoomDistance(true, isMacro);
    const endPos = direction.clone().multiplyScalar(zoomDist);
    
    // Calculate control point to arc over the globe
    const startPos = camera.position.clone();
    const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const maxDist = Math.max(startPos.length(), endPos.length());
    
    // Push the mid-point outwards based on how far we need to move
    const distBetween = startPos.distanceTo(endPos);
    const targetDist = Math.max(maxDist + 1, Math.min(12, maxDist + distBetween * 0.6));
    
    if (midPos.length() < 0.1) {
      midPos.set(startPos.y, startPos.z, startPos.x).normalize().multiplyScalar(targetDist);
    } else {
      midPos.normalize().multiplyScalar(targetDist);
    }

    // Start animation
    animationRef.current = {
        active: true,
        startTime: Date.now(),
        duration: 1100, // Smooth zoom
        startPos: startPos,
        midPos: midPos,
        endPos: endPos,
        targetPoint: new THREE.Vector3(0, 0, 0)
    };
  };
  
  // Calculate positions with data for clustering
  const artistData = useMemo(() => {
    return artists.map(artist => {
      const artistTours = tours.filter(t => t.artist_id === artist.id || t.artist_id === artist.slug);
      const state = getArtistState(artistTours);
      
      let lat, lng, city;
      
      if (state.status === 'LIVE') {
        lat = state.tour.latitude;
        lng = state.tour.longitude;
        city = state.tour.city;
      } else if (state.status === 'TRANSIT') {
        lat = state.lastTour.latitude;
        lng = state.lastTour.longitude;
        city = state.lastTour.city;
      } else if (state.status === 'UPCOMING') {
        lat = state.nextTour.latitude;
        lng = state.nextTour.longitude;
        city = state.nextTour.city;
      } else {
        // HOME or fallback
        lat = artist.current_latitude;
        lng = artist.current_longitude;
        city = artist.current_city;
      }
      
      if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null;
      
      return {
        artist,
        lat: Number(lat),
        lng: Number(lng),
        city: city ? city.trim().toLowerCase() : '',
        state // Pass state to renderer
      };
    }).filter(Boolean);
  }, [artists, tours]);
  
  // Cluster nearby maestros and add scatter when zoomed in
  const markers = useMemo(() => {
    const MICRO_THRESHOLD = 0.05; // same as original
    const MACRO_THRESHOLD = 0.5; // for zoomed out
    
    // 1. Micro Clustering (original logic)
    const microClusters = [];
    const processedMicro = new Set();
    
    artistData.forEach((data, idx) => {
      if (processedMicro.has(idx)) return;
      
      const nearby = [data];
      processedMicro.add(idx);
      
      artistData.forEach((other, otherIdx) => {
        if (processedMicro.has(otherIdx)) return;
        
        const sameCity = data.city && other.city && data.city === other.city;
        const latDiff = Math.abs(data.lat - other.lat);
        const lngDiff = Math.abs(data.lng - other.lng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        if (sameCity || distance < MICRO_THRESHOLD) {
          nearby.push(other);
          processedMicro.add(otherIdx);
        }
      });
      
      microClusters.push({
        artists: nearby.map(d => d.artist),
        states: nearby.map(d => d.state),
        centerLat: data.lat,
        centerLng: data.lng,
        count: nearby.length,
      });
    });

    // 2. Macro Clustering (grouping micro clusters based on distance)
    const macroClusters = [];
    const processedMacro = new Set();

    microClusters.forEach((micro, idx) => {
      if (processedMacro.has(idx)) return;
      const nearbyMicro = [micro];
      processedMacro.add(idx);
      
      microClusters.forEach((otherMicro, otherIdx) => {
        if (processedMacro.has(otherIdx)) return;
        const latDiff = Math.abs(micro.centerLat - otherMicro.centerLat);
        const lngDiff = Math.abs(micro.centerLng - otherMicro.centerLng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        if (distance < MACRO_THRESHOLD) {
          nearbyMicro.push(otherMicro);
          processedMacro.add(otherIdx);
        }
      });
      
      const totalCount = nearbyMicro.reduce((sum, m) => sum + m.count, 0);
      const centerLat = nearbyMicro.reduce((sum, m) => sum + m.centerLat * m.count, 0) / totalCount;
      const centerLng = nearbyMicro.reduce((sum, m) => sum + m.centerLng * m.count, 0) / totalCount;
      
      macroClusters.push({
        count: totalCount,
        artists: nearbyMicro.flatMap(m => m.artists),
        states: nearbyMicro.flatMap(m => m.states),
        centerLat,
        centerLng,
        microClusters: nearbyMicro
      });
    });

    return macroClusters.map((macro, idx) => {
      // If macro cluster only contains 1 micro cluster, show it always
      if (macro.microClusters.length === 1) {
        const micro = macro.microClusters[0];
        const position = latLngToVector3(micro.centerLat, micro.centerLng, 2.0);
        if (micro.count === 1) {
          return [{
            type: 'single',
            artist: micro.artists[0],
            state: micro.states[0],
            position,
            visibility: 'always'
          }];
        } else {
          let microStatus = 'HOME';
          if (micro.states.some(s => s?.status === 'LIVE')) microStatus = 'LIVE';
          else if (micro.states.some(s => s?.status === 'TRANSIT')) microStatus = 'TRANSIT';
          else if (micro.states.some(s => s?.status === 'UPCOMING')) microStatus = 'UPCOMING';
          return [{
            type: 'cluster',
            count: micro.count,
            artists: micro.artists,
            position,
            centerLat: micro.centerLat,
            centerLng: micro.centerLng,
            status: microStatus,
            visibility: 'always'
          }];
        }
      }

      // If macro cluster has multiple micro clusters
      const items = [];
      
      let macroStatus = 'HOME';
      if (macro.states.some(s => s?.status === 'LIVE')) macroStatus = 'LIVE';
      else if (macro.states.some(s => s?.status === 'TRANSIT')) macroStatus = 'TRANSIT';
      else if (macro.states.some(s => s?.status === 'UPCOMING')) macroStatus = 'UPCOMING';
      
      items.push({
        type: 'cluster',
        count: macro.count,
        artists: macro.artists,
        position: latLngToVector3(macro.centerLat, macro.centerLng, 2.0),
        centerLat: macro.centerLat,
        centerLng: macro.centerLng,
        status: macroStatus,
        visibility: 'zoomedOut'
      });

      macro.microClusters.forEach(micro => {
        const position = latLngToVector3(micro.centerLat, micro.centerLng, 2.0);
        if (micro.count === 1) {
          items.push({
            type: 'single',
            artist: micro.artists[0],
            state: micro.states[0],
            position,
            visibility: 'zoomedIn'
          });
        } else {
          let microStatus = 'HOME';
          if (micro.states.some(s => s?.status === 'LIVE')) microStatus = 'LIVE';
          else if (micro.states.some(s => s?.status === 'TRANSIT')) microStatus = 'TRANSIT';
          else if (micro.states.some(s => s?.status === 'UPCOMING')) microStatus = 'UPCOMING';
          items.push({
            type: 'cluster',
            count: micro.count,
            artists: micro.artists,
            position,
            centerLat: micro.centerLat,
            centerLng: micro.centerLng,
            status: microStatus,
            visibility: 'zoomedIn'
          });
        }
      });

      return items;
    }).flat();
  }, [artistData]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <StarsBackground />
      
      <GlobeSphere globeRef={globeRef} autoRotate={autoRotate} activeContinent={activeContinent} activeCountry={activeCountry} isInteracting={isInteracting}>
        {markers.map((marker, idx) => {
          if (marker.type === 'cluster') {
            return (
              <ClusterMarker3D
                key={`cluster-${idx}`}
                count={marker.count}
                position={marker.position}
                status={marker.status}
                visibility={marker.visibility}
                onClusterClick={() => handleClusterClick(marker.centerLat, marker.centerLng, marker.artists, marker.visibility === 'zoomedOut')}
              />
            );
          } else {
            // State is now pre-calculated in maestroData and passed in marker
            const state = marker.state || { status: 'HOME' };

            return (
              <ArtistMarker3D
                key={`artist-${marker.artist.id}-${idx}`}
                artist={marker.artist}
                position={marker.position}
                isSelected={selectedArtist?.id === marker.artist.id}
                status={state.status}
                daysUntil={state.daysUntil}
                visibility={marker.visibility}
                onClick={onArtistSelect}
                onInteract={() => setAutoRotate(false)}
              />
            );
          }
        })}
      </GlobeSphere>
      
      <OrbitControls
        ref={controlsRef}
        makeDefault
        regress
        enableZoom={true}
        enablePan={false}
        minDistance={2.1}
        maxDistance={15}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        rotateSpeed={0.8}
        onStart={() => {
          setAutoRotate(false);
          setIsInteracting(true);
        }}
        onEnd={() => setIsInteracting(false)}
      />
    </>
  );
}

export default function Globe3D({ artists, selectedArtist, onArtistSelect, onClusterSelect, tours, zoomToArtistTrigger, resetZoomTrigger, zoomToUserTrigger, zoomToContinentTrigger, zoomToCountryTrigger, userProfile, activeContinent, activeCountry }) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isZoomedOut, setIsZoomedOut] = useState(true);
  
  return (
    <div 
      className="absolute inset-0 bg-transparent cursor-grab active:cursor-grabbing transition-all duration-150"
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      {/* Dynamic halo background with smooth transition (only when zoomed out) */}
      {isZoomedOut && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, rgba(255,255,255,${isInteracting ? 0.25 : 0.12}) 0%, rgba(15,15,15,0) 50%)`,
            transition: 'all 150ms cubic-bezier(0.2, 0, 0.8, 1)',
          }}
        />
      )}
      
      <Canvas
        camera={{ position: [0, 0, 10.0], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <Scene 
          isInteracting={isInteracting}
          setIsInteracting={setIsInteracting}
          isZoomedOut={isZoomedOut}
          setIsZoomedOut={setIsZoomedOut}
          artists={artists} 
          selectedArtist={selectedArtist}
          onArtistSelect={onArtistSelect}
          onClusterSelect={onClusterSelect}
          tours={tours}
          zoomToArtistTrigger={zoomToArtistTrigger}
          resetZoomTrigger={resetZoomTrigger}
          zoomToUserTrigger={zoomToUserTrigger}
          zoomToContinentTrigger={zoomToContinentTrigger}
          zoomToCountryTrigger={zoomToCountryTrigger}
          userProfile={userProfile}
          activeContinent={activeContinent}
          activeCountry={activeCountry}
        />
      </Canvas>
    </div>
  );
}