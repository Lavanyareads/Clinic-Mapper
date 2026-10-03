import React, { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, GitCompare, RefreshCw, AlertCircle, BarChart3, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/api';
import { ScenarioSummary } from '../types';

interface ComparisonMetric {
  name: string;
  n_hubs: number;
  mode: string;
  total_pop_covered: number;
  vulnerable_pop_covered: number;
  avg_improvement: number;
}

const ScenarioComparison: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);
  const [errorScenarios, setErrorScenarios] = useState<string | null>(null);

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonMetric[]>([]);
  const [comparing, setComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const [newScenarioName, setNewScenarioName] = useState<string>('');
  const [newScenarioHubs, setNewScenarioHubs] = useState<number>(5);
  const [newScenarioMode, setNewScenarioMode] = useState<string>('balanced');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    setErrorScenarios(null);
    try {
      const data = await apiService.listScenarios();
      setScenarios(data.scenarios || []);
      
      // Update selection to only include existing scenarios
      setSelectedScenarios(prev => 
        prev.filter(name => (data.scenarios || []).some((s: ScenarioSummary) => s.name === name))
      );
    } catch (err: any) {
      setErrorScenarios(err.message || 'Failed to fetch scenarios');
      toast.error('Failed to fetch scenarios');
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) {
      toast.error('Scenario name is required');
      return;
    }
    
    setSaving(true);
    try {
      const response = await apiService.saveScenario(newScenarioName, newScenarioHubs, newScenarioMode);
      toast.success(response.message || 'Scenario saved successfully');
      setNewScenarioName('');
      fetchScenarios();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete scenario "${name}"?`)) return;
    
    try {
      const response = await apiService.deleteScenario(name);
      toast.success(response.message || 'Scenario deleted');
      if (selectedScenarios.includes(name)) {
        setSelectedScenarios(prev => prev.filter(s => s !== name));
      }
      fetchScenarios();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete scenario');
    }
  };

  const toggleSelection = (name: string) => {
    setSelectedScenarios(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleCompare = async () => {
    if (selectedScenarios.length < 2) {
      toast.error('Select at least two scenarios to compare');
      return;
    }

    setComparing(true);
    setCompareError(null);
    try {
      const data = await apiService.compareScenarios(selectedScenarios);
      setComparisonData(data.comparison_table || []);
    } catch (err: any) {
      setCompareError(err.message || 'Failed to compare scenarios');
      toast.error('Failed to compare scenarios');
    } finally {
      setComparing(false);
    }
  };

  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-sky-500" />
          Scenario Comparison
        </h1>
        <button 
          onClick={fetchScenarios} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loadingScenarios}
        >
          <RefreshCw className={`w-4 h-4 ${loadingScenarios ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Save Scenario & List */}
        <div className="space-y-6 lg:col-span-1">
          {/* Save Scenario Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Save className="w-5 h-5 text-teal-500" />
              Save Current Analysis
            </h2>
            <form onSubmit={handleSaveScenario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. High Budget Optimistic"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hubs</label>
                  <input
                    type="number"
                    value={newScenarioHubs}
                    onChange={(e) => setNewScenarioHubs(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 p-2"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={newScenarioMode}
                    onChange={(e) => setNewScenarioMode(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="equity">Equity First</option>
                    <option value="efficiency">Efficiency</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || !newScenarioName.trim()}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Scenario
              </button>
            </form>
          </div>

          {/* Scenarios List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-800">Saved Scenarios</h3>
              <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full font-medium">
                {scenarios.length} Total
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {loadingScenarios ? (
                <div className="flex justify-center items-center h-full">
                  <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
              ) : errorScenarios ? (
                <div className="text-center p-4 text-red-500 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{errorScenarios}</p>
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <p>No scenarios saved yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scenarios.map((scenario) => (
                    <div 
                      key={scenario.name}
                      className={`p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                        selectedScenarios.includes(scenario.name) 
                          ? 'border-sky-500 bg-sky-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <button 
                        onClick={() => toggleSelection(scenario.name)}
                        className="text-gray-400 hover:text-sky-500 focus:outline-none"
                      >
                        {selectedScenarios.includes(scenario.name) ? (
                          <CheckSquare className="w-5 h-5 text-sky-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0" onClick={() => toggleSelection(scenario.name)}>
                        <h4 className="font-medium text-sm text-gray-900 truncate cursor-pointer">{scenario.name}</h4>
                        <p className="text-xs text-gray-500 cursor-pointer">
                          {scenario.summary?.n_hubs || scenario.params?.n_hubs || 'N/A'} hubs • {scenario.summary?.mode || scenario.params?.mode || 'N/A'}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteScenario(scenario.name)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCompare}
                disabled={selectedScenarios.length < 2 || comparing}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Compare Selected ({selectedScenarios.length})
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Comparison Results */}
        <div className="lg:col-span-2 space-y-6">
          {compareError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{compareError}</p>
            </div>
          )}

          {!comparisonData.length ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <GitCompare className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Comparison Generated</h3>
              <p className="max-w-md">
                Select at least two saved scenarios from the list on the left and click "Compare Selected" to view side-by-side metrics.
              </p>
            </div>
          ) : (
            <>
              {/* Metrics Table */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Comparison Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-medium">Scenario Name</th>
                        <th className="px-6 py-3 font-medium">Hubs / Mode</th>
                        <th className="px-6 py-3 font-medium text-right">Total Covered</th>
                        <th className="px-6 py-3 font-medium text-right">Vulnerable Covered</th>
                        <th className="px-6 py-3 font-medium text-right">Avg Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comparisonData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {row.n_hubs} / {row.mode}
                          </td>
                          <td className="px-6 py-4 text-right">{formatNumber(row.total_pop_covered)}</td>
                          <td className="px-6 py-4 text-right">{formatNumber(row.vulnerable_pop_covered)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-teal-600 font-medium">
                              +{row.avg_improvement.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-6">Population Coverage</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <RechartsTooltip 
                        formatter={(value: number) => formatNumber(value)}
                        labelStyle={{ color: '#374151', fontWeight: 600 }}
                      />
                      <Legend />
                      <Bar dataKey="total_pop_covered" name="Total Covered" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vulnerable_pop_covered" name="Vulnerable Covered" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioComparison;
