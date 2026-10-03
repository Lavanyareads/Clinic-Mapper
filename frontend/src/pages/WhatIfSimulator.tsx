import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Activity, Sliders, TrendingUp, Users, ShieldCheck, MapPin } from 'lucide-react';

export default function WhatIfSimulator() {
  const [maxHubs, setMaxHubs] = useState(5);
  const [mode, setMode] = useState<'population' | 'equity'>('equity');
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trend' | 'compare'>('trend');

  const runSimulation = useCallback(async (hubs: number, m: 'population' | 'equity') => {
    setLoading(true);
    try {
      const res = await apiService.simulateWhatIf(1, hubs, m);
      const scenarios = res.scenarios || [];
      const formatted = scenarios.map((s: any) => ({
        hubs: s.n_hubs,
        coverage: s.pop_coverage,
        improvement: s.accessibility_improvement,
        underserved: s.underserved_remaining,
        vulnerable: s.vulnerable_coverage
      }));
      setSimData(formatted);
    } catch (error) {
      console.error(error);
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const runComparison = useCallback(async (hubs: number) => {
    setLoading(true);
    try {
      const res = await apiService.compareModes(hubs);
      const comp = res.comparison || {};
      const popMode = comp.population_mode || {};
      const eqMode = comp.equity_mode || {};

      setCompareData([
        {
          metric: 'Population within coverage',
          'Population-First': popMode.total_pop_covered || 0,
          'Equity-First': eqMode.total_pop_covered || 0,
        },
        {
          metric: 'Vulnerable Population Covered',
          'Population-First': popMode.vulnerable_pop_covered || 0,
          'Equity-First': eqMode.vulnerable_pop_covered || 0,
        },
        {
          metric: 'Geographic Distance Gain (km)',
          'Population-First': popMode.avg_improvement || 0,
          'Equity-First': eqMode.avg_improvement || 0,
        }
      ]);
    } catch (error) {
      console.error(error);
      toast.error('Comparison failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'trend') {
      runSimulation(maxHubs, mode);
    } else {
      runComparison(maxHubs);
    }
  }, [maxHubs, mode, activeTab, runSimulation, runComparison]);

  const latestData = simData[simData.length - 1] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            What-If Scenario Simulation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Model marginal coverage returns, geographic distance reduction, and equity trade-offs across 1–10 hub deployments
          </p>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 space-y-2 w-full">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Simulate Hub Scale
            </label>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{maxHubs} Hubs</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={maxHubs}
            onChange={(e) => setMaxHubs(parseInt(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>1 Hub</span>
            <span>3 Hubs</span>
            <span>5 Hubs</span>
            <span>8 Hubs</span>
            <span>10 Hubs</span>
          </div>
        </div>

        {activeTab === 'trend' && (
          <div className="w-full md:w-64 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Optimization Objective
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equity">Equity-First (Vulnerability Weighted)</option>
              <option value="population">Population-First (Density Weighted)</option>
            </select>
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 md:flex-initial ${
              activeTab === 'trend'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Scaling Curve
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 md:flex-initial ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Compare Objectives
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Computing geospatial simulation for {maxHubs} hubs...</p>
        </div>
      )}

      {/* Dynamic 4 KPIs */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Population within coverage</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {latestData.coverage ? latestData.coverage.toLocaleString() : '—'}
            </p>
            <span className="text-[11px] text-slate-400">At {maxHubs} deployed candidate hubs</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vulnerable population coverage</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {latestData.vulnerable ? latestData.vulnerable.toLocaleString() : '—'}
            </p>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Elderly & low-income residents</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Geographic distance (straight-line)</span>
            </div>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {latestData.improvement ? `-${latestData.improvement.toFixed(1)} km` : '—'}
            </p>
            <span className="text-[11px] text-slate-400">Average reduction per community</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Priority communities remaining</span>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {latestData.underserved !== undefined ? latestData.underserved : '—'}
            </p>
            <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">Villages needing further access</span>
          </div>
        </div>
      )}

      {/* Trend Analysis View: 2 High-Clarity Charts */}
      {!loading && activeTab === 'trend' && simData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Population Reach Scaling (Total vs Vulnerable)
                </h3>
                <p className="text-[11px] text-slate-400">Cumulative population covered as candidate hubs expand from 1 to {maxHubs}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="hubs" label={{ value: 'Number of Hubs (K)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => [val.toLocaleString(), '']} />
                  <Legend />
                  <Line name="Total Population" type="monotone" dataKey="coverage" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line name="Vulnerable Population" type="monotone" dataKey="vulnerable" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Geographic Distance Gain & Remaining Underserved
                </h3>
                <p className="text-[11px] text-slate-400">Diminishing returns in distance reduction vs remaining priority villages</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="hubs" label={{ value: 'Number of Hubs (K)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number, name: string) => [name === 'Distance Improvement' ? `${val.toFixed(2)} km` : val, name]} />
                  <Legend />
                  <Line yAxisId="left" name="Distance Improvement" type="monotone" dataKey="improvement" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line yAxisId="right" name="Underserved Remaining" type="monotone" dataKey="underserved" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {!loading && activeTab === 'compare' && compareData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Policy Objective Comparison at {maxHubs} Hubs: Population-First vs. Equity-First
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Population-first optimizes aggregate resident count, while Equity-first targets remote and vulnerable populations with poor baseline healthcare access.
          </p>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} layout="vertical" margin={{ left: 60, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tickFormatter={(val) => val > 1000 ? `${(val / 1000000).toFixed(1)}M` : val} tick={{ fontSize: 11 }} />
                <YAxis dataKey="metric" type="category" width={190} tick={{ fontSize: 11, fontWeight: 500 }} />
                <Tooltip formatter={(val: number) => val.toLocaleString()} />
                <Legend />
                <Bar dataKey="Population-First" fill="#0284c7" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Equity-First" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
