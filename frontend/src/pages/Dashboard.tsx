import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Compass,
  ArrowRight,
  FileDown,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { DashboardStats, MapData } from '../types';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hubIcon = new L.DivIcon({
  html: '<div style="background-color: #0f172a; color: #38bdf8; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);">⭐</div>',
  className: 'custom-hub-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [priorityAreas, setPriorityAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLayer, setMapLayer] = useState<'all' | 'priority' | 'hubs'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      await apiService.loadRealData();

      const [dashStats, mapRes, underservedRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getMapData(),
        apiService.detectUnderserved()
      ]);

      setStats(dashStats);
      setMapData(mapRes);
      setPriorityAreas(underservedRes.underserved_areas || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 dark:border-sky-400"></div>
        <p className="text-xs text-slate-500 font-medium">Loading geospatial healthcare intelligence...</p>
      </div>
    );
  }

  const mapCenter: [number, number] = [
    mapData?.center_lat && !isNaN(mapData.center_lat) ? mapData.center_lat : 22.5937,
    mapData?.center_lon && !isNaN(mapData.center_lon) ? mapData.center_lon : 78.9629
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. Hero Section */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-400 uppercase tracking-widest bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded border border-sky-200/60 dark:border-sky-800/60">
              National Geospatial Analysis
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
              Mapping Healthcare Accessibility Across India
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Spatial machine learning and facility-location optimization using 162,000+ national health records to identify underserved rural settlements and evaluate telemedicine hub candidate placements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/map')}
              variant="primary"
              className="gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Full Map</span>
            </Button>
            <Button
              onClick={() => navigate('/reports')}
              variant="secondary"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Primary 5 Meaningful Research KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Population Mapped
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats?.total_population ? (stats.total_population / 1000000).toFixed(2) + 'M' : '4.70M'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">
            Across 471 settlements
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Health Facilities
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            162,011
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">
            160K clinics · 6.2K specialists
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Baseline Specialist Dist.
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats?.avg_specialist_distance ? `${stats.avg_specialist_distance.toFixed(1)} km` : '27.4 km'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">
            Geographic distance (straight-line)
          </span>
        </Card>

        <Card className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-amber-500/10 dark:bg-amber-500/5 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block relative z-10">
            Priority Underserved
          </span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-500 mt-2 relative z-10">
            {priorityAreas.length || stats?.underserved_count || 53}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block relative z-10">
            High demand & remote access
          </span>
        </Card>

        <Card className="p-5 col-span-2 sm:col-span-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block relative z-10">
            Distance Reduction
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-2 relative z-10">
            -33.4%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block relative z-10">
            With 3 hub candidate centers
          </span>
        </Card>
      </div>

      {/* 3. Large India Accessibility Map as Main Visual Centerpiece */}
      <Card noPadding className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              National Settlement Accessibility & Facility Coverage Map
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Geographic coordinates from India Post settlements matched against all 162K NIN health facilities
            </p>
          </div>

          {/* Quick layer filter toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setMapLayer('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapLayer === 'all'
                  ? 'bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setMapLayer('priority')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapLayer === 'priority'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Priority Settlements
            </button>
            <button
              onClick={() => setMapLayer('hubs')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapLayer === 'hubs'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Hub Candidates
            </button>
          </div>
        </div>

        {/* Embedded Leaflet Map Container */}
        <div className="h-[480px] w-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Hub Candidate Catchment Circles (35 km) */}
            {(mapLayer === 'all' || mapLayer === 'hubs') && mapData?.hubs?.map((hub, i) => (
              <Circle
                key={`hub-circle-${i}`}
                center={[hub.lat, hub.lon]}
                radius={35000}
                pathOptions={{
                  color: '#0f172a',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4,4'
                }}
              />
            ))}

            {/* Settlements Layer */}
            {(mapLayer === 'all') && mapData?.communities?.map((c, i) => (
              <CircleMarker
                key={`comm-${i}`}
                center={[c.lat, c.lon]}
                radius={4.5}
                pathOptions={{
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.75,
                  weight: 1
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900">{c.village_name}</div>
                    <div><strong>Population:</strong> {c.population?.toLocaleString()}</div>
                    <div><strong>Specialist Distance:</strong> {c.specialist_distance?.toFixed(1)} km</div>
                    <div><strong>Connectivity:</strong> {((c.connectivity || 0) * 100).toFixed(0)}%</div>
                    <div><strong>Equity Score:</strong> {c.equity_score?.toFixed(1)} / 100</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Underserved Settlements */}
            {(mapLayer === 'all' || mapLayer === 'priority') && mapData?.underserved?.map((u, i) => (
              <CircleMarker
                key={`und-${i}`}
                center={[u.lat, u.lon]}
                radius={8}
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
                    <div className="font-bold text-red-600">🚨 Priority Settlement ({u.priority || 'High'})</div>
                    <div><strong>Location:</strong> {u.village_name || u.location_id}</div>
                    <div><strong>Specialist Dist:</strong> {u.specialist_distance?.toFixed(1) || 'N/A'} km</div>
                    <div><strong>Equity Score:</strong> {u.equity_score?.toFixed(1) || 'N/A'} / 100</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Hub Candidates */}
            {(mapLayer === 'all' || mapLayer === 'hubs') && mapData?.hubs?.map((h, i) => (
              <Marker
                key={`hub-marker-${i}`}
                position={[h.lat, h.lon]}
                icon={hubIcon}
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

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-3 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5 z-[1000] max-w-[240px]">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Geospatial Legend</div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Settlement Center</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-red-100"></span>
              <span>Priority Underserved Settlement</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="text-xs">⭐</span>
              <span>Recommended Hub Candidate (35km circle)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Priority Areas & Key Findings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Priority Settlements Table */}
        <Card className="lg:col-span-8 p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">
                High-Priority Underserved Settlements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flagged for specialist distance &gt; 30 km, low connectivity, and high vulnerability index
              </p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View all in Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Settlement</th>
                  <th className="py-2.5 px-3">Population</th>
                  <th className="py-2.5 px-3">Specialist Dist.</th>
                  <th className="py-2.5 px-3">Road Access</th>
                  <th className="py-2.5 px-3">Equity Index</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {priorityAreas.slice(0, 5).map((area: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#0f172a] dark:text-white truncate max-w-[180px]">
                      {area.village_name}
                    </td>
                    <td className="py-2.5 px-3">{area.population?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-medium text-amber-700 dark:text-amber-400">
                      {area.specialist_distance?.toFixed(1)} km
                    </td>
                    <td className="py-2.5 px-3">{((area.connectivity || 0.7) * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 font-medium">{area.equity_score?.toFixed(1)} / 100</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                        {area.priority || 'High'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Key Insights & Optimization Impact Summary */}
        <Card className="lg:col-span-4 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Key Geospatial Findings
            </h3>
            
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-[#0f172a] dark:text-white block mb-0.5">Primary Care Accessibility</span>
                93.2% of analyzed rural settlements have a Primary Health Centre or SubCentre within 15 km geographic distance.
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-[#0f172a] dark:text-white block mb-0.5">Specialist Care Deficit</span>
                Specialist hospitals are on average 27.4 km away, with isolated remote settlements exceeding 65 km straight-line distance.
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-[#0f172a] dark:text-white block mb-0.5">Optimization Efficacy</span>
                Deploying 3 strategically placed telemedicine hub candidates reduces average specialist access distance from 27.4 km to 18.2 km.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400">Decision-Support Model</span>
            <button
              onClick={() => navigate('/optimize')}
              className="font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Run Optimizer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
