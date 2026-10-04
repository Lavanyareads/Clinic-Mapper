import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // ==================== Data Endpoints ====================
  loadDemoData: async () => {
    const res = await api.get('/data/demo');
    return res.data;
  },
  loadRealData: async () => {
    const res = await api.get('/data/real');
    return res.data;
  },
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getPreview: async () => {
    const res = await api.get('/data/preview');
    return res.data;
  },
  getDataQuality: async () => {
    const res = await api.get('/data/quality');
    return res.data;
  },
  getDataStats: async () => {
    const res = await api.get('/data/stats');
    return res.data;
  },
  downloadSampleCSV: async () => {
    const res = await api.get('/data/download-sample', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // ==================== Clustering Endpoints ====================
  runClustering: async (k?: number) => {
    const params = k ? { k } : {};
    const res = await api.post('/clustering/run', null, { params });
    return res.data;
  },
  getOptimalK: async () => {
    const res = await api.get('/clustering/optimal-k');
    return res.data;
  },
  getClusterProfiles: async () => {
    const res = await api.get('/clustering/profiles');
    return res.data;
  },

  // ==================== Equity Endpoints ====================
  computeEquity: async (weights?: Record<string, number>) => {
    const res = await api.post('/equity/compute', weights || null, {
      params: weights ? {} : {},
    });
    return res.data;
  },
  getEquityFormula: async () => {
    const res = await api.get('/equity/formula');
    return res.data;
  },
  getEquityBreakdown: async (locationId: string) => {
    const res = await api.get(`/equity/breakdown/${locationId}`);
    return res.data;
  },

  // ==================== Underserved Endpoints ====================
  detectUnderserved: async (thresholds?: { equity_threshold?: number; specialist_dist_threshold?: number; connectivity_threshold?: number }) => {
    const res = await api.post('/underserved/detect', null, { params: thresholds || {} });
    return res.data;
  },
  getUnderservedSummary: async () => {
    const res = await api.get('/underserved/summary');
    return res.data;
  },

  // ==================== Hub Optimization Endpoints ====================
  optimizeHubs: async (nHubs: number, mode: 'population' | 'equity') => {
    const res = await api.post('/hubs/optimize', null, { params: { n_hubs: nHubs, mode } });
    return res.data;
  },
  getHubExplanation: async (hubIndex: number) => {
    const res = await api.get(`/hubs/explain/${hubIndex}`);
    return res.data;
  },
  getBeforeAfter: async () => {
    const res = await api.post('/hubs/before-after');
    return res.data;
  },

  // ==================== What-If Simulation Endpoints ====================
  simulateWhatIf: async (hubMin: number, hubMax: number, mode: 'population' | 'equity') => {
    const res = await api.post('/whatif/simulate', null, {
      params: { hub_min: hubMin, hub_max: hubMax, mode },
    });
    return res.data;
  },
  compareModes: async (nHubs: number) => {
    const res = await api.post('/whatif/compare-modes', null, { params: { n_hubs: nHubs } });
    return res.data;
  },

  // ==================== Scenario Endpoints ====================
  saveScenario: async (name: string, nHubs: number, mode: string) => {
    const res = await api.post('/scenarios/save', null, { params: { name, n_hubs: nHubs, mode } });
    return res.data;
  },
  listScenarios: async () => {
    const res = await api.get('/scenarios/list');
    return res.data;
  },
  compareScenarios: async (names: string[]) => {
    const res = await api.post('/scenarios/compare', names);
    return res.data;
  },
  deleteScenario: async (name: string) => {
    const res = await api.delete(`/scenarios/${name}`);
    return res.data;
  },

  // ==================== Dashboard ====================
  getDashboardStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  // ==================== Map ====================
  getMapData: async () => {
    const res = await api.get('/map/data');
    return res.data;
  },

  // ==================== Research ====================
  getMethodology: async () => {
    const res = await api.get('/research/methodology');
    return res.data;
  },
  getResearchMetrics: async () => {
    const res = await api.get('/research/metrics');
    return res.data;
  },

  // ==================== Reports ====================
  generateReport: async () => {
    const res = await api.post('/reports/generate');
    return res.data;
  },
  downloadReport: (filename: string) => {
    // Native browser download instead of fetching a blob
    const downloadUrl = `/api/reports/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default apiService;
