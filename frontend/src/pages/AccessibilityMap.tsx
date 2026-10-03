import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Circle,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiService } from '../services/api';
import { MapData } from '../types';
import toast from 'react-hot-toast';
import {
  Layers,
  MapPin,
  Minimize2,
  Filter,
  X
} from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CLUSTER_COLORS = ['#0284c7', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#059669', '#4f46e5'];

const hubIcon = new L.DivIcon({
  html: '<div style="background-color: #0f172a; color: #38bdf8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">⭐</div>',
  className: 'custom-hub-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function AccessibilityMap() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOptimized, setIsOptimized] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [layers, setLayers] = useState({
    communities: true,
    facilities: true,
    specialists: true,
    priorityAreas: true,
    hubs: true,
    serviceCatchment: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await apiService.loadRealData();
      const data = await apiService.getMapData();
      setMapData(data);
    } catch (error) {
      console.error('Error loading map data:', error);
      toast.error('Failed to load geospatial map data');
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 dark:border-sky-400"></div>
        <p className="text-xs text-slate-500 font-medium">Loading geospatial layers (471 settlements & health facilities)...</p>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Unable to load map layers</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-900 text-white text-xs rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  const mapCenter: [number, number] = [
    mapData.center_lat && !isNaN(mapData.center_lat) ? mapData.center_lat : 22.5937,
    mapData.center_lon && !isNaN(mapData.center_lon) ? mapData.center_lon : 78.9629
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a] dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Interactive Geospatial Accessibility Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any settlement or hub candidate to inspect accessibility scores, facility tiers, and coverage metrics
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              !isOptimized
                ? 'bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
            onClick={() => setIsOptimized(false)}
          >
            Baseline State
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isOptimized
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
            onClick={() => setIsOptimized(true)}
          >
            Optimized Hubs
          </button>
        </div>
      </div>

      {/* Main Full-Visual Map Container */}
      <div className="relative h-[calc(100vh-14rem)] min-h-[580px] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800">
        <MapContainer
          center={mapCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapRecenter center={mapCenter} zoom={5} />
          
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* 1. Hub Service Catchment Area Circles (35km radius) */}
          {layers.serviceCatchment && isOptimized && mapData.hubs?.map((hub, i) => (
            <Circle
              key={`catchment-${i}`}
              center={[hub.lat, hub.lon]}
              radius={35000}
              pathOptions={{
                color: '#0f172a',
                fillColor: '#38bdf8',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '5,5'
              }}
            />
          ))}

          {/* 2. Priority Underserved Settlements */}
          {layers.priorityAreas && mapData.underserved?.map((u, i) => (
            <CircleMarker
              key={`pri-${i}`}
              center={[u.lat, u.lon]}
              radius={8}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'priority', data: u })
              }}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#fecaca',
                fillOpacity: 0.8,
                weight: 2,
                dashArray: '3,3'
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-red-600">🚨 Priority Underserved Settlement</div>
                  <div><strong>Settlement:</strong> {u.village_name || u.location_id}</div>
                  <div><strong>Geographic distance to specialist:</strong> {u.specialist_distance?.toFixed(1) || 'N/A'} km</div>
                  <div><strong>Equity Index:</strong> {u.equity_score ? u.equity_score.toFixed(1) : 'N/A'} / 100</div>
                  <div><strong>Priority Tier:</strong> {u.priority || 'High'}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 3. Settlements Layer */}
          {layers.communities && mapData.communities?.map((c, i) => {
            const color = c.cluster >= 0 ? CLUSTER_COLORS[c.cluster % CLUSTER_COLORS.length] : '#0284c7';
            return (
              <CircleMarker
                key={`comm-${i}`}
                center={[c.lat, c.lon]}
                radius={4.5}
                eventHandlers={{
                  click: () => setSelectedEntity({ type: 'community', data: c })
                }}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.75,
                  weight: 1
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[#0f172a]">{c.village_name}</div>
                    <div><strong>Population:</strong> {c.population?.toLocaleString()}</div>
                    <div><strong>Geographic distance to specialist:</strong> {c.specialist_distance?.toFixed(1)} km</div>
                    <div><strong>Connectivity:</strong> {((c.connectivity || 0) * 100).toFixed(0)}%</div>
                    <div><strong>Healthcare Equity Index:</strong> {c.equity_score ? c.equity_score.toFixed(1) : 'N/A'} / 100</div>
                    {c.cluster >= 0 && (
                      <div className="text-[11px] font-semibold text-sky-700">Cluster {c.cluster}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 4. Primary Healthcare Facilities (PHCs & SubCentres) */}
          {layers.facilities && mapData.facilities?.map((f, i) => (
            <CircleMarker
              key={`fac-${i}`}
              center={[f.lat, f.lon]}
              radius={4.5}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'facility', data: f })
              }}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.85,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sky-900">🏥 {f.facility_name}</div>
                  <div><strong>Facility Tier:</strong> {f.facility_type}</div>
                  <div><strong>Doctors Available (Est):</strong> {f.doctors || 2}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 5. Specialist Hospitals */}
          {layers.specialists && mapData.specialists?.map((s, i) => (
            <CircleMarker
              key={`spec-${i}`}
              center={[s.lat, s.lon]}
              radius={6.5}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'specialist', data: s })
              }}
              pathOptions={{
                color: '#7c3aed',
                fillColor: '#c084fc',
                fillOpacity: 0.85,
                weight: 2
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-purple-900">🏛️ {s.center_name}</div>
                  <div><strong>Specialty Center:</strong> {s.specialty}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 6. Recommended Hub Candidates */}
          {layers.hubs && isOptimized && mapData.hubs?.map((h, i) => (
            <Marker
              key={`hub-${i}`}
              position={[h.lat, h.lon]}
              icon={hubIcon}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'hub', data: h, index: i + 1 })
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 p-0.5">
                  <div className="font-bold text-[#0f172a] flex items-center gap-1">
                    <span>⭐</span> Recommended Hub Candidate #{i + 1}
                  </div>
                  <div><strong>Settlements Covered:</strong> {h.communities_served}</div>
                  <div><strong>Population within coverage:</strong> {h.population_covered?.toLocaleString() || 0}</div>
                  <div><strong>Vulnerable population:</strong> {h.vulnerable_pop_covered?.toLocaleString() || 0}</div>
                  <div><strong>Distance reduction:</strong> {h.accessibility_improvement ? `${h.accessibility_improvement.toFixed(1)} km closer` : 'N/A'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Compact Floating Layer Controls Panel (Top-Right) */}
        {panelOpen ? (
          <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg z-[1000] w-64 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-sky-600" /> Map Layer Filters
              </span>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Settlements ({mapData.communities?.length || 0})
                </span>
                <input
                  type="checkbox"
                  checked={layers.communities}
                  onChange={() => toggleLayer('communities')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  Clinics / PHCs ({mapData.facilities?.length || 0})
                </span>
                <input
                  type="checkbox"
                  checked={layers.facilities}
                  onChange={() => toggleLayer('facilities')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Specialist Hospitals ({mapData.specialists?.length || 0})
                </span>
                <input
                  type="checkbox"
                  checked={layers.specialists}
                  onChange={() => toggleLayer('specialists')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-100"></span>
                  Priority Settlements ({mapData.underserved?.length || 0})
                </span>
                <input
                  type="checkbox"
                  checked={layers.priorityAreas}
                  onChange={() => toggleLayer('priorityAreas')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              {isOptimized && (
                <>
                  <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="text-xs">⭐</span>
                      Hub Candidates ({mapData.hubs?.length || 0})
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.hubs}
                      onChange={() => toggleLayer('hubs')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full border border-dashed border-sky-500 bg-sky-50"></span>
                      Catchment (35 km)
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.serviceCatchment}
                      onChange={() => toggleLayer('serviceCatchment')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 z-[1000] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Layers</span>
          </button>
        )}

        {/* Floating Detail Drawer (when entity is clicked) */}
        {selectedEntity && (
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-[1000] max-w-sm w-full border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-start mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-[#0f172a] dark:text-white">
                {selectedEntity.type === 'hub' ? `Recommended Hub Candidate #${selectedEntity.index}` :
                 selectedEntity.type === 'priority' ? `🚨 Priority Settlement` :
                 selectedEntity.type === 'community' ? selectedEntity.data.village_name :
                 selectedEntity.data.facility_name || selectedEntity.data.center_name}
              </span>
              <button onClick={() => setSelectedEntity(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedEntity.type === 'hub' && (
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedEntity.data.explanation || 'Optimal candidate location identified via weighted facility-location optimization.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                  <div>Settlements: <strong className="text-slate-900 dark:text-white">{selectedEntity.data.communities_served}</strong></div>
                  <div>Coverage: <strong className="text-slate-900 dark:text-white">{selectedEntity.data.population_covered?.toLocaleString()}</strong></div>
                  <div>Vulnerable: <strong className="text-slate-900 dark:text-white">{selectedEntity.data.vulnerable_pop_covered?.toLocaleString()}</strong></div>
                  <div>Distance Gain: <strong className="text-emerald-600">{selectedEntity.data.accessibility_improvement?.toFixed(1)} km</strong></div>
                </div>
              </div>
            )}

            {selectedEntity.type === 'community' && (
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div>Population: <strong className="text-slate-900 dark:text-white">{selectedEntity.data.population?.toLocaleString()}</strong></div>
                <div>Straight-line distance to specialist: <strong className="text-amber-700 dark:text-amber-400">{selectedEntity.data.specialist_distance?.toFixed(1)} km</strong></div>
                <div>Connectivity index: <strong>{((selectedEntity.data.connectivity || 0) * 100).toFixed(0)}%</strong></div>
                <div>Equity Score: <strong>{selectedEntity.data.equity_score?.toFixed(1)} / 100</strong></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
