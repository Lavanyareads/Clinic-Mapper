import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Play, Layers, Clock, Sparkles, CheckCircle2, Info } from 'lucide-react';

const CLUSTER_COLORS = ['#0284c7', '#0d9488', '#d97706', '#e11d48', '#7c3aed', '#db2777', '#059669', '#4f46e5'];

export default function ClusterAnalysis() {
  const [loading, setLoading] = useState(false);
  const [kValue, setKValue] = useState<number>(3);
  const [optimalK, setOptimalK] = useState<any>(null);
  const [clusterResult, setClusterResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    initClustering();
  }, []);

  const initClustering = async () => {
    try {
      setLoading(true);
      await apiService.loadRealData();
      
      const optRes = await apiService.getOptimalK();
      setOptimalK(optRes);
      
      const suggested = optRes.suggested_k || 3;
      setKValue(suggested);
      
      const runRes = await apiService.runClustering(suggested);
      setClusterResult(runRes);
      setProfiles(runRes.profiles || []);
    } catch (err: any) {
      console.error('Clustering init error:', err);
      toast.error('Failed to initialize clustering analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectK = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOptimalK();
      setOptimalK(res);
      const suggested = res.suggested_k || 3;
      setKValue(suggested);
      toast.success(`Optimal K suggested: ${suggested}`);
      
      const runRes = await apiService.runClustering(suggested);
      setClusterResult(runRes);
      setProfiles(runRes.profiles || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to detect optimal K');
    } finally {
      setLoading(false);
    }
  };

  const handleRunClustering = async () => {
    try {
      setLoading(true);
      const res = await apiService.runClustering(kValue);
      setClusterResult(res);
      setProfiles(res.profiles || []);
      toast.success(`Clustering completed for K = ${kValue}`);
    } catch (err: any) {
      toast.error(err.message || 'Clustering execution failed');
    } finally {
      setLoading(false);
    }
  };

  const elbowChartData = optimalK?.k_values?.map((k: number, i: number) => ({
    k: k,
    inertia: optimalK.elbow_scores ? optimalK.elbow_scores[i] : 0,
    silhouette: optimalK.silhouette_scores ? optimalK.silhouette_scores[i] : 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Healthcare Accessibility Cluster Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Unsupervised K-Means segmentation on 12 multidimensional healthcare, vulnerability, and infrastructure features
          </p>
        </div>
      </div>

      {/* Interactive Configuration Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label className="uppercase tracking-wider">Number of Clusters (K)</label>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">K = {kValue}</span>
          </div>
          <input
            type="range"
            min="2"
            max="8"
            value={kValue}
            onChange={(e) => setKValue(parseInt(e.target.value) || 2)}
            className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>K = 2</span>
            <span>K = 4</span>
            <span>K = 6</span>
            <span>K = 8</span>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleDetectK}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
            Auto-Detect Optimal K
          </button>
          <button
            onClick={handleRunClustering}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center disabled:opacity-50 shadow-sm shadow-blue-500/20"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
            ) : (
              <Play className="w-4 h-4 mr-1.5" />
            )}
            Run Clustering
          </button>
        </div>
      </div>

      {loading && !clusterResult && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Standardizing 12 features & computing K-Means inertia...</p>
        </div>
      )}

      {/* Elbow & Silhouette Evaluation Curves */}
      {elbowChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Elbow Method (Inertia vs. K)</h3>
                <p className="text-[11px] text-slate-400">Sum of Squared Errors across cluster centroids</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Elbow Point: K = {optimalK?.suggested_k || 3}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={elbowChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="k" label={{ value: 'Clusters (K)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => v.toFixed(0)} tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(val: number) => [val.toFixed(1), 'Inertia']} labelFormatter={(l) => `K = ${l}`} />
                  <Line type="monotone" dataKey="inertia" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4, fill: '#0284c7' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
              Identifies the point of diminishing marginal return where variance explained stabilizes.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Silhouette Analysis</h3>
                <p className="text-[11px] text-slate-400">Inter-cluster separation vs. intra-cluster cohesion</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Optimal: K = {optimalK?.suggested_k || 3}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={elbowChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="k" label={{ value: 'Clusters (K)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(val: number) => [val.toFixed(3), 'Silhouette Score']} labelFormatter={(l) => `K = ${l}`} />
                  <Bar dataKey="silhouette" radius={[4, 4, 0, 0]}>
                    {elbowChartData.map((entry: any, idx: number) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.k === (optimalK?.suggested_k || 3) ? '#0284c7' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
              Higher score indicates well-separated, distinct community accessibility archetypes.
            </p>
          </div>
        </div>
      )}

      {/* Clustering Results & Summary Banner */}
      {clusterResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Segmentation Results for K = {clusterResult.k || kValue}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Clusters Formed</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{clusterResult.k || kValue}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Silhouette Score</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{clusterResult.silhouette_score?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Inertia (SSE)</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{clusterResult.inertia?.toFixed(0) || 'N/A'}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Convergence Time
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {clusterResult.runtime_seconds ? `${clusterResult.runtime_seconds.toFixed(2)}s` : '< 1s'}
                </span>
              </div>
            </div>

            {/* Cluster Profiles Cards */}
            {profiles && profiles.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Accessibility Archetypes & Profiles
                  </h3>
                  <span className="text-xs text-slate-400">Multi-feature cluster descriptions</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {profiles.map((profile: any, idx: number) => {
                    const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-xl border transition-all bg-white dark:bg-slate-800/80 shadow-sm"
                        style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cluster {profile.cluster_id}</h4>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {profile.size} areas ({profile.percentage ? profile.percentage.toFixed(1) : 0}%)
                          </span>
                        </div>

                        <p className="text-xs font-bold mb-2" style={{ color: color }}>
                          {profile.label}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {profile.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Cluster Distribution Horizontal Bar Chart */}
                <div className="h-64 mt-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 text-center uppercase tracking-wider">
                    Community Count Distribution by Cluster
                  </h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={profiles} margin={{ left: 50, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="cluster_id" type="category" tickFormatter={(val) => `Cluster ${val}`} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(val: number) => [val, 'Communities']} />
                      <Bar dataKey="size" radius={[0, 4, 4, 0]}>
                        {profiles.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Methodology & Practical Interpretation Guide */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">How to use this segmentation in public health planning:</p>
          <p>
            Clusters with high vulnerability scores and large straight-line distances to specialist hospitals represent prime candidates for mobile outreach clinics and telemedicine hub deployment. High-density clusters with moderate access can be served by strengthening existing Primary Health Centres (PHCs).
          </p>
        </div>
      </div>
    </div>
  );
}
