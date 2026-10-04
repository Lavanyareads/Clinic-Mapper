import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Info, ChevronDown, ChevronRight, Activity, Cpu, Map } from 'lucide-react';
import apiService from '../services/api';
import { Card } from '../components/Card';

interface Section {
  title: string;
  content: string;
}

interface EquityFormula {
  description: string;
  default_weights: Record<string, number>;
}

const ResearchMethodology: React.FC = () => {
  const [methodologySections, setMethodologySections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const [metrics, setMetrics] = useState<any>(null);
  const [equityFormula, setEquityFormula] = useState<EquityFormula | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [methodologyData, metricsData, equityData] = await Promise.all([
          apiService.getMethodology(),
          apiService.getResearchMetrics(),
          apiService.getEquityFormula()
        ]);

        setMethodologySections(methodologyData.sections || []);

        if (methodologyData.sections?.length > 0) {
          setExpandedSections({ 0: true });
        }

        setMetrics(metricsData);
        setEquityFormula(equityData);
      } catch (err: any) {
        console.error('Failed to fetch methodology data', err);
        setError(err.message || 'Failed to load research methodology data. Make sure the API is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading research methodology and metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 mb-3 text-rose-500" />
          <h2 className="text-base font-bold mb-1">Error Loading Methodology</h2>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Research Methodology & Mathematical Foundations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Peer-reviewed algorithmic specifications, distance formulas, and vulnerability weighting matrices
          </p>
        </div>
      </div>

      <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <h3 className="font-bold">Academic & Public-Health Decision-Support Framework</h3>
          <p className="mt-0.5 leading-relaxed">
            This system implements spatial optimization models (K-Means Clustering and Weighted P-Median Location-Allocation) calibrated on real Indian demographic and geocoded healthcare data for infrastructure prioritization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Methodology Documentation */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Technical Methodology Documentation
          </h2>

          {methodologySections.map((section, index) => (
            <Card key={index} noPadding className="overflow-hidden">
              <button
                className="w-full px-5 py-4 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                onClick={() => toggleSection(index)}
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm text-left">{section.title}</span>
                {expandedSections[index] ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedSections[index] && (
                <div className="p-5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br/>') }} />
                </div>
              )}
            </Card>
          ))}

          {/* Equity Formula Display */}
          {equityFormula && (
            <Card noPadding className="overflow-hidden mt-6">
              <div className="px-5 py-4 bg-teal-50/70 dark:bg-teal-950/40 border-b border-teal-100 dark:border-teal-900">
                <h3 className="font-bold text-teal-900 dark:text-teal-300 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Healthcare Vulnerability Index (HVI) Formulation
                </h3>
              </div>
              <div className="p-5">
                <p className="text-slate-600 dark:text-slate-300 mb-4 text-xs leading-relaxed">{equityFormula.description}</p>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200/80 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Default Indicator Weights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {Object.entries(equityFormula.default_weights).map(([indicator, weight]) => (
                      <div key={indicator} className="flex justify-between items-center text-xs border-b border-slate-200/80 dark:border-slate-700 py-1.5 last:border-0">
                        <span className="text-slate-600 dark:text-slate-400">{indicator.replace(/_/g, ' ')}</span>
                        <span className="font-bold bg-white dark:bg-slate-700 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600 text-teal-600 dark:text-teal-400">
                          {weight.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Research Metrics */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Current Empirical Metrics
          </h2>

          {metrics ? (
            <>
              {metrics.dataset && (
                <Card className="p-5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2 mb-3 uppercase tracking-wider">
                    <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Dataset Dimensions
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Settlements</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.dataset.n_communities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Population</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.dataset.total_population?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Distance Metric</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">Haversine GPS (Straight-line)</span>
                    </div>
                  </div>
                </Card>
              )}

              {metrics.clustering && (
                <Card className="p-5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2 mb-3 uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Clustering Model Diagnostics
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">K Clusters</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.clustering.k}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Silhouette Score</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.clustering.silhouette_score?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Inertia (SSE)</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.clustering.inertia?.toExponential(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Algorithm Runtime</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.clustering.runtime?.toFixed(2)}s</span>
                    </div>
                  </div>
                </Card>
              )}

              {metrics.equity && (
                <Card className="p-5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2 mb-3 uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Vulnerability Distribution
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Mean Score</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.equity.mean?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Median</span>
                      <span className="font-bold text-slate-900 dark:text-white">{metrics.equity.median?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Min - Max Range</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {metrics.equity.min?.toFixed(2)} - {metrics.equity.max?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs">
              Run an analysis to generate research metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchMethodology;
