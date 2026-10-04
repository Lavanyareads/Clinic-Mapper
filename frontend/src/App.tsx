import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataExplorer from './pages/DataExplorer';
import ClusterAnalysis from './pages/ClusterAnalysis';
import AccessibilityMap from './pages/AccessibilityMap';
import HubOptimizer from './pages/HubOptimizer';
import WhatIfSimulator from './pages/WhatIfSimulator';
import ResearchMethodology from './pages/ResearchMethodology';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="overview" element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/overview" replace />} />
        <Route path="explore" element={<DataExplorer />} />
        <Route path="data-explorer" element={<Navigate to="/explore" replace />} />
        <Route path="clusters" element={<ClusterAnalysis />} />
        <Route path="cluster-analysis" element={<Navigate to="/clusters" replace />} />
        <Route path="map" element={<AccessibilityMap />} />
        <Route path="accessibility-map" element={<Navigate to="/map" replace />} />
        <Route path="optimize" element={<HubOptimizer />} />
        <Route path="hub-optimizer" element={<Navigate to="/optimize" replace />} />
        <Route path="simulate" element={<WhatIfSimulator />} />
        <Route path="what-if" element={<Navigate to="/simulate" replace />} />
        <Route path="research" element={<ResearchMethodology />} />
        <Route path="methodology" element={<Navigate to="/research" replace />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
