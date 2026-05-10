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
  activePropertyIndex?: number;
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
  onPropertyClick,
  activePropertyIndex
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Synchronize map with the active property in the carousel
  useEffect(() => {
    if (map.current && activePropertyIndex !== undefined && properties[activePropertyIndex]) {
        const prop = properties[activePropertyIndex];
        if (prop.latitude && prop.longitude) {
            map.current.flyTo({
                center: [Number(prop.longitude), Number(prop.latitude)],
                zoom: 15.5,
                pitch: 60,
                bearing: -17,
                duration: 3000,
                essential: true
            });
            setActiveProject(prop.campaign_name || null);
        }
    }
  }, [activePropertyIndex, properties]);

  const geojson: any = useMemo(() => ({
    type: 'FeatureCollection',
    features: properties
      .filter(p => p.latitude && p.longitude && Number(p.latitude) !== 0)
      .map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Number(p.longitude), Number(p.latitude)] },
        properties: {
          id: p.id,
          name: p.name,
          campaign_name: p.campaign_name || 'General',
          color: getProjectColor(p.campaign_name, primaryColor),
          min_investment: p.min_investment,
          estimated_return: p.estimated_return,
          location: p.location,
          address: p.address,
          main_image_url: p.main_image_url
        }
      }))
  }), [properties, primaryColor]);

  const projects = useMemo(() => {
    const uniqueProjects = new Set<string>();
    properties.forEach(p => {
        if (p.campaign_name && p.latitude && p.longitude && p.latitude !== 0) uniqueProjects.add(p.campaign_name);
    });
    return Array.from(uniqueProjects);
  }, [properties]);

  const goToProject = (projectName: string) => {
    if (!map.current) return;
    setActiveProject(projectName);
    const projectProperties = properties.filter(p => p.campaign_name === projectName);
    if (projectProperties.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    projectProperties.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]));
    map.current.fitBounds(bounds, { padding: 100, maxZoom: 16, duration: 2000 });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const defaultCenter: [number, number] = [-70.6483, -33.4569];
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: defaultCenter,
      zoom: 11,
      pitch: 45,
      bearing: -17,
      attributionControl: false,
      antialias: true
    });

    map.current.on('style.load', () => {
      map.current?.setFog({ 'range': [0.5, 10], 'color': '#0f172a', 'horizon-blend': 0.1, 'high-color': '#020617', 'space-color': '#020617', 'star-intensity': 0.15 });
    });

    map.current.on('load', () => {
      if (!map.current) return;
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.current.addSource('properties', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Layer for CLUSTERS
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 5, '#8b5cf6', 15, '#ec4899'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 5, 25, 15, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.8
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 12 },
        paint: { 'text-color': '#ffffff' }
      });

      // Layer for UNCLUSTERED POINTS (Solitary assets)
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Handlers
      map.current.on('click', 'clusters', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features?.[0].properties?.cluster_id;
        (map.current?.getSource('properties') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (!err) map.current?.easeTo({ center: (features?.[0].geometry as any).coordinates, zoom });
        });
      });

      map.current.on('click', 'unclustered-point', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features?.length) return;
        const prop = features[0].properties;
        const coords = (features[0].geometry as any).coordinates;

        const imageUrl = getFullImageUrl(prop.main_image_url);
        const projectColor = prop.color;

        const popupContent = `
          <div class="premium-popup">
            ${imageUrl ? `<div class="popup-image" style="background-image: url('${imageUrl}')"><div class="popup-badge" style="background: ${projectColor}dd">${prop.estimated_return || '12%'} ROI</div></div>` : `<div class="popup-image-placeholder"><span>Lead Flow Asset</span></div>`}
            <div class="popup-info">
              <span class="popup-sector" style="color: ${projectColor}">${prop.campaign_name}</span>
              <h3>${prop.name}</h3>
              <p class="popup-address">${prop.address || 'Ubicación Premium'}</p>
              <p class="popup-location">Chile</p>
              <div class="popup-actions-grid"><button class="street-view-btn" data-lat="${coords[1]}" data-lng="${coords[0]}">Street View</button></div>
              <div class="popup-meta"><div class="meta-item"><span>Inversión</span><strong>$${Number(prop.min_investment || 0).toLocaleString()}</strong></div><button class="popup-btn" data-id="${prop.id}" style="--hover-bg: ${projectColor}">Gestionar</button></div>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ offset: 15, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(popupContent)
          .addTo(map.current!);
          
        map.current?.flyTo({ center: coords, zoom: 16, pitch: 60, duration: 2000 });
      });

      map.current.on('mouseenter', 'unclustered-point', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'unclustered-point', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });

      mapContainer.current?.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          
          // Use closest to detect click on button even if clicking icon/text
          const manageBtn = target.closest('.popup-btn');
          if (manageBtn && onPropertyClick) {
              const propertyId = manageBtn.getAttribute('data-id');
              const found = properties.find(p => p.id === Number(propertyId));
              if (found) onPropertyClick(found);
          }

          const streetBtn = target.closest('.street-view-btn');
          if (streetBtn) {
              const lat = streetBtn.getAttribute('data-lat');
              const lng = streetBtn.getAttribute('data-lng');
              // More robust Street View URL
              const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
              window.open(url, '_blank');
          }
      });
    });

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (map.current && map.current.getSource('properties')) {
        (map.current.getSource('properties') as mapboxgl.GeoJSONSource).setData(geojson);
    }
  }, [geojson]);

  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group bg-[#020617]">
      <style jsx global>{`
        .mapboxgl-popup-content { background: #0f172a !important; color: white !important; border-radius: 24px !important; padding: 0 !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important; overflow: hidden; }
        .mapboxgl-popup-tip { border-top-color: #0f172a !important; }
        .premium-popup { width: 280px; }
        .popup-image { height: 130px; background-size: cover; background-position: center; position: relative; }
        .popup-image-placeholder { height: 130px; background: linear-gradient(45deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; position: relative; }
        .popup-badge { position: absolute; top: 12px; right: 12px; color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .popup-info { padding: 20px; }
        .popup-sector { display: block; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; opacity: 0.8; }
        .popup-info h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 900; color: white; }
        .popup-address { margin: 0 0 4px 0; font-size: 11px; color: white; font-weight: 600; }
        .popup-location { margin: 0 0 15px 0; font-size: 10px; color: #64748b; display: flex; align-items: center; gap: 6px; font-weight: 600; text-transform: uppercase; }
        .street-view-btn { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #94a3b8; font-size: 11px; font-weight: 700; padding: 8px; cursor: pointer; margin-bottom: 12px; }
        .popup-meta { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 15px; }
        .meta-item span { display: block; font-size: 9px; text-transform: uppercase; color: #475569; font-weight: 900; }
        .meta-item strong { font-size: 16px; color: white; font-weight: 900; }
        .popup-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 10px 18px; border-radius: 12px; cursor: pointer; }
      `}</style>
      
      {/* UI Overlay - Filters/Project list */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 lg:p-6 flex flex-col gap-4 transition-all duration-500 ${isInteracting ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
        <div className="flex items-center justify-between">
            <div className="px-5 py-2.5 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] text-blue-400 shadow-2xl flex items-center gap-4">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                Explorador de Ubicaciones
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {projects.map((projectName) => {
                const color = getProjectColor(projectName, primaryColor);
                return (
                    <button key={projectName} onClick={() => goToProject(projectName)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${activeProject === projectName ? 'bg-white text-[#020617] border-white shadow-xl scale-105' : 'bg-[#0f172a]/80 backdrop-blur-md text-white/70 border-white/10 hover:border-white/30'}`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                        {projectName}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Map Interaction Guard Overlay */}
      {!isInteracting && (
          <div 
            onClick={() => setIsInteracting(true)}
            className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer group/guard transition-all duration-700"
          >
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] group-hover/guard:backdrop-blur-none transition-all duration-700" />
              <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-1000">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover/guard:scale-110 transition-transform duration-500">
                      <div className="w-8 h-8 text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"/><path d="M12 21c-3.5 0-7-4.5-7-9 0-3.866 3.134-7 7-7s7 3.134 7 7c0 4.5-3.5 9-7 9z"/></svg>
                      </div>
                  </div>
                  <span className="px-6 py-2.5 rounded-full bg-white text-[#020617] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl group-hover/guard:tracking-[0.3em] transition-all duration-500">
                      Toca para explorar el mapa
                  </span>
              </div>
          </div>
      )}

      <div 
        ref={mapContainer} 
        className={`absolute inset-0 w-full h-full transition-all duration-1000 ${isInteracting ? 'pointer-events-auto' : 'pointer-events-none'}`} 
      />
    </div>
  );
};

export default MapSection;
