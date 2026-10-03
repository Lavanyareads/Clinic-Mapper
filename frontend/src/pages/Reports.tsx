import React, { useState } from 'react';
import { FileText, Download, Loader2, AlertTriangle, CheckCircle, FileOutput, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

const Reports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<{ filename: string; download_url?: string } | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReportResult(null);
    try {
      const response = await apiService.generateReport();
      setReportResult({
        filename: response.filename,
        download_url: response.download_url
      });
      toast.success(response.message || 'Report generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (reportResult?.filename) {
      apiService.downloadReport(reportResult.filename);
    }
  };

  const reportContents = [
    "Executive Summary",
    "Dataset Statistics & Geographic Bounds",
    "Cluster Analysis (K-Means Implementation)",
    "Healthcare Equity Index Calculation",
    "Underserved Area Identification",
    "Hub Placement Recommendations",
    "Before/After Impact Analysis",
    "Methodology & Limitations"
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-sky-500" />
        <h1 className="text-3xl font-bold text-gray-800">Generate Research Report</h1>
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex gap-3">
        <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-800">Academic Use Only</h3>
          <p className="text-sm text-red-700 mt-1">
            This report is an academic decision-support prototype. It is NOT for clinical, 
            administrative, or policy use without independent validation by qualified professionals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Generation Control */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FileOutput className="w-5 h-5 text-sky-500" />
              Comprehensive Analysis
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Generate a full PDF report containing all current methodology, maps, cluster analysis, 
              equity scoring, and recommended hub locations.
            </p>
            
            <div className="mt-auto space-y-4">
              {!reportResult ? (
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-sky-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Compiling Analysis...
                    </>
                  ) : (
                    <>
                      <FileText className="w-6 h-6" />
                      Generate Full Research Report
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center justify-between border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Report Ready</span>
                    </div>
                    <span className="text-sm font-mono truncate max-w-[150px]">{reportResult.filename}</span>
                  </div>
                  
                  <button
                    onClick={handleDownload}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-200"
                  >
                    <Download className="w-6 h-6" />
                    Download PDF Report
                  </button>
                  
                  <button
                    onClick={() => setReportResult(null)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Generate New Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview of contents */}
        <div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 h-full">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Report Contents</h3>
            <ul className="space-y-3">
              {reportContents.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="bg-sky-100 text-sky-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex gap-2 items-start text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  Report generation may take up to 30 seconds depending on the complexity of the maps and charts being rendered.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Reports;
