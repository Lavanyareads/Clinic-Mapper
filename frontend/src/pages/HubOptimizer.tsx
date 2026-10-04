import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { HubOptimizationResult, HubExplanation } from '../types';
import toast from 'react-hot-toast';
import { Play, ChevronDown, ChevronUp, MapPin, Users, TrendingUp, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function HubOptimizer() {
  const [nHubs, setNHubs] = useState(3);
  const [mode, setMode] = useState<'population' | 'equity'>('equity');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HubOptimizationResult | null>(null);
  const [explanations, setExplanations] = useState<Record<number, HubExplanation>>({});
  const [loadingExp, setLoadingExp] = useState<Record<number, boolean>>({});

  useEffect(() => {
    initOptimizer();
  }, []);

  const initOptimizer = async () => {
    try {
      setLoading(true);
      await apiService.loadRealData();
      const res = await apiService.optimizeHubs(3, 'equity');
      setResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    try {
      setLoading(true);
      const res = await apiService.optimizeHubs(nHubs, mode);
      setResult(res);
      setExplanations({});
      toast.success(`Optimized ${nHubs} candidate hubs using ${mode}-first model`);
    } catch (error) {
      console.error(error);
      toast.error('Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const loadExplanation = async (index: number) => {
    if (explanations[index]) {
      const newExp = { ...explanations };
      delete newExp[index];
      setExplanations(newExp);
      return;
    }
    try {
      setLoadingExp(prev => ({ ...prev, [index]: true }));
      const exp = await apiService.getHubExplanation(index);
      setExplanations(prev => ({ ...prev, [index]: exp }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load candidate justification');
    } finally {
      setLoadingExp(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Telemedicine Hub Optimization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Geospatial facility-location optimization (p-median candidate centers with vulnerability weights)
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 space-y-2 w-full">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="uppercase tracking-wider">Number of Hub Candidates</span>
            <span className="text-accent-blue font-bold text-sm">{nHubs} Hubs</span>
          </div>
          <input 
            type="range" min="1" max="10" value={nHubs} 
            onChange={(e) => setNHubs(parseInt(e.target.value))}
            className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>1 Hub</span>
            <span>3 Hubs</span>
            <span>5 Hubs</span>
            <span>8 Hubs</span>
            <span>10 Hubs</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Optimization Priority Mode
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'equity' 
                  ? 'bg-white dark:bg-slate-700 text-accent-blue shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setMode('equity')}
            >
              Equity-First (Vulnerability)
            </button>
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'population' 
                  ? 'bg-white dark:bg-slate-700 text-accent-blue shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setMode('population')}
            >
              Population-First (Density)
            </button>
          </div>
        </div>

        <Button
          onClick={runOptimization}
          disabled={loading}
          variant="primary"
          className="w-full md:w-auto justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Play size={15} />
          )}
          <span>{loading ? 'Optimizing...' : 'Run Optimization'}</span>
        </Button>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Top Summary Concise KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-accent-blue rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Population within coverage</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.overall_metrics?.total_pop_covered?.toLocaleString() || 0}
                </p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vulnerable population covered</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {result.overall_metrics?.vulnerable_pop_covered?.toLocaleString() || 0}
                </p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Geographic distance reduction</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.overall_metrics?.avg_improvement ? `-${result.overall_metrics.avg_improvement.toFixed(1)} km` : 'N/A'}
                </p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Convergence Time</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.runtime_seconds ? `${result.runtime_seconds.toFixed(2)}s` : '< 1s'}
                </p>
              </div>
            </Card>
          </div>

          {/* Recommended Candidates Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Recommended Hub Candidates ({result.hub_locations?.length || 0})
              </h2>
              <span className="text-xs text-slate-400">Straight-line Voronoi catchment allocation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.hub_locations?.map((hub, idx) => (
                <Card key={idx} noPadding className="overflow-hidden flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-200 dark:border-blue-800">
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recommended Hub Candidate #{idx + 1}</h3>
                          <span className="text-[11px] text-slate-400">GPS: {hub.lat.toFixed(3)}°N, {hub.lon.toFixed(3)}°E</span>
                        </div>
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                        -{hub.accessibility_improvement?.toFixed(1)} km gain
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Communities</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hub.communities_served} BOs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pop Coverage</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hub.population_covered?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Vulnerable Pop</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hub.vulnerable_pop_covered?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Distance (Straight-line)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          {hub.avg_distance_before?.toFixed(1)}km → <span className="text-emerald-600 dark:text-emerald-400">{hub.avg_distance_after?.toFixed(1)}km</span>
                        </span>
                      </div>
                    </div>

                    {/* Expandable Why This Candidate Explanation */}
                    <div className="pt-2">
                      <button 
                        onClick={() => loadExplanation(idx)}
                        className="w-full text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-between py-1.5 px-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        <span>Why this candidate?</span>
                        {explanations[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {loadingExp[idx] && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 p-2">Computing dynamic justification...</div>
                      )}
                      
                      {explanations[idx] && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 leading-relaxed">
                          <p>{explanations[idx].explanation}</p>
                          {explanations[idx].nearby_communities && explanations[idx].nearby_communities.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                              <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Catchment Settlements:</span>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {explanations[idx].nearby_communities.slice(0, 4).map((c, i) => (
                                  <li key={i}>{c.village_name} (Pop: {c.population?.toLocaleString()}, ~{c.distance_to_hub} km straight-line)</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
