"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Property {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  main_image_url?: string;
  min_investment?: string | number;
  estimated_return?: string;
  location?: string;
  address?: string;
  campaign_name?: string;
}

interface MapSectionProps {
  latitude?: number;
  longitude?: number;
  properties?: Property[];
  primaryColor?: string;
  onPropertyClick?: (property: Property) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getFullImageUrl = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
};

const getProjectColor = (projectName: string | undefined, defaultColor: string) => {
    if (!projectName || projectName === "Sin Proyecto" || projectName === "General") return defaultColor;
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
        hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 85%, 60%)`;
};

const MapSection: React.FC<MapSectionProps> = ({ 
  latitude, 
  longitude, 
  properties = [], 
  primaryColor = '#3b82f6',
  onPropertyClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Extract unique projects for navigation
  const projects = useMemo(() => {
    const uniqueProjects = new Set<string>();
    properties.forEach(p => {
        if (p.campaign_name && p.latitude && p.longitude && p.latitude !== 0) {
            uniqueProjects.add(p.campaign_name);
        }
    });
    return Array.from(uniqueProjects);
  }, [properties]);

  const goToProject = (projectName: string) => {
    if (!map.current) return;
    setActiveProject(projectName);
    
    const projectProperties = properties.filter(p => p.campaign_name === projectName);
    if (projectProperties.length === 0) return;

    if (projectProperties.length === 1) {
        map.current.flyTo({
            center: [Number(projectProperties[0].longitude), Number(projectProperties[0].latitude)],
            zoom: 15,
            pitch: 60,
            duration: 2000
        });
    } else {
        const bounds = new mapboxgl.LngLatBounds();
        projectProperties.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
        map.current.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 2000 });
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const defaultCenter: [number, number] = [-70.6483, -33.4569];
    let center = defaultCenter;

    if (latitude && longitude) {
        center = [Number(longitude), Number(latitude)];
    } else if (properties.length > 0 && properties[0].latitude && properties[0].longitude) {
        center = [Number(properties[0].longitude), Number(properties[0].latitude)];
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: center,
        zoom: 12,
        pitch: 45,
        bearing: -17,
        attributionControl: false,
        antialias: true
      });

      map.current.on('style.load', () => {
        map.current?.setFog({
            'range': [0.5, 10],
            'color': '#0f172a',
            'horizon-blend': 0.1,
            'high-color': '#020617',
            'space-color': '#020617',
            'star-intensity': 0.15
        });
      });

      map.current.on('load', () => {
        map.current?.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        mapContainer.current?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('popup-btn')) {
                const propertyId = target.getAttribute('data-id');
                if (propertyId && onPropertyClick) {
                    const prop = properties.find(p => p.id === Number(propertyId));
                    if (prop) onPropertyClick(prop);
                }
            }
        });

        if (properties.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          let hasMarkers = false;

          properties.forEach(prop => {
            const lat = Number(prop.latitude);
            const lng = Number(prop.longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              const projectColor = getProjectColor(prop.campaign_name, primaryColor);
              const imageUrl = getFullImageUrl(prop.main_image_url);
              
              const el = document.createElement('div');
              el.className = 'custom-marker';
              el.innerHTML = `
                <div class="marker-pulse" style="background-color: ${projectColor}33"></div>
                <div class="marker-dot" style="background-color: ${projectColor}"></div>
              `;

              const popupContent = `
                <div class="premium-popup">
                  ${imageUrl ? `
                    <div class="popup-image" style="background-image: url('${imageUrl}')">
                       <div class="popup-badge" style="background: ${projectColor}dd">${prop.estimated_return || '12%'} ROI</div>
                    </div>
                  ` : `
                    <div class="popup-image-placeholder">
                       <div class="popup-badge" style="background: ${projectColor}dd">${prop.estimated_return || '12%'} ROI</div>
                       <span>Lead Flow Asset</span>
                    </div>
                  `}
                  <div class="popup-info">
                    <span class="popup-sector" style="color: ${projectColor}">${prop.campaign_name || 'Inversión Directa'}</span>
                    <h3>${prop.name}</h3>
                    <p class="popup-address">${prop.address || 'Ubicación Premium'}</p>
                    <p class="popup-location"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${prop.location || 'Chile'}</p>
                    <div class="popup-meta">
                      <div class="meta-item">
                        <span>Desde</span>
                        <strong>$${Number(prop.min_investment || 0).toLocaleString()}</strong>
                      </div>
                      <button class="popup-btn" data-id="${prop.id}" style="--hover-bg: ${projectColor}">Explorar</button>
                    </div>
                  </div>
                </div>
              `;

              new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(popupContent))
                .addTo(map.current!);
              
              el.addEventListener('click', () => {
                map.current?.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    pitch: 60,
                    duration: 2000,
                    essential: true
                });
              });

              bounds.extend([lng, lat]);
              hasMarkers = true;
            }
          });

          if (hasMarkers && !latitude) {
            if (properties.length > 1) {
                map.current?.fitBounds(bounds, { padding: 100, maxZoom: 14, duration: 2500 });
            } else {
                const first = properties.find(p => p.latitude && p.longitude);
                if (first) {
                    map.current?.flyTo({ center: [Number(first.longitude), Number(first.latitude)], zoom: 14, duration: 2500 });
                }
            }
          }
        }
      });
    } catch (err) {
      console.error("Critical error initializing Mapbox:", err);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, properties, primaryColor, onPropertyClick]);

  return (
    <div className="w-full h-full min-h-[600px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group bg-[#020617]">
      <style jsx global>{`
        .custom-marker { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .marker-dot { width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.8); z-index: 2; }
        .marker-pulse { position: absolute; width: 50px; height: 50px; border-radius: 50%; animation: pulse 2s infinite; z-index: 1; }
        @keyframes pulse { 0% { transform: scale(0.4); opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        .mapboxgl-popup-content { background: #0f172a !important; color: white !important; border-radius: 24px !important; padding: 0 !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important; overflow: hidden; }
        .mapboxgl-popup-tip { border-top-color: #0f172a !important; }
        .premium-popup { width: 280px; }
        .popup-image { height: 150px; background-size: cover; background-position: center; position: relative; }
        .popup-image-placeholder { height: 150px; background: linear-gradient(45deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; position: relative; }
        .popup-image-placeholder span { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 2px; }
        .popup-badge { position: absolute; top: 12px; right: 12px; color: white; padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .popup-info { padding: 20px; }
        .popup-sector { display: block; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; opacity: 0.8; }
        .popup-info h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .popup-address { margin: 0 0 4px 0; font-size: 11px; color: white; font-weight: 600; }
        .popup-location { margin: 0 0 20px 0; font-size: 10px; color: #64748b; display: flex; align-items: center; gap: 6px; font-weight: 600; text-transform: uppercase; }
        .popup-meta { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 15px; }
        .meta-item span { display: block; font-size: 9px; text-transform: uppercase; color: #475569; font-weight: 900; margin-bottom: 2px; }
        .meta-item strong { font-size: 16px; color: white; font-weight: 900; }
        .popup-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 10px 18px; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
        .popup-btn:hover { background: var(--hover-bg); border-color: transparent; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
      `}</style>
      
      {/* Map Header with Sector Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex flex-col gap-4 pointer-events-none">
        <div className="flex items-center justify-between">
            <div className="px-5 py-2.5 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] text-blue-400 shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                Red Global de Activos
            </div>
        </div>

        {/* Project/Sector Shortcuts */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar pointer-events-auto">
            {projects.map((projectName) => {
                const color = getProjectColor(projectName, primaryColor);
                return (
                    <button
                        key={projectName}
                        onClick={() => goToProject(projectName)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                            activeProject === projectName 
                            ? 'bg-white text-[#020617] border-white shadow-xl scale-105' 
                            : 'bg-[#0f172a]/80 backdrop-blur-md text-white/70 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                        {projectName}
                    </button>
                );
            })}
        </div>
      </div>

      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default MapSection;
