import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ShieldCheck, Activity, Users, ArrowRight, Play, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 selection:bg-accent-blue/30 overflow-x-hidden transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-accent-blue text-white flex items-center justify-center shadow-sm transition-colors duration-300">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ClinicMapper</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <Button variant="primary" onClick={() => navigate('/login')} className="gap-2 shadow-lg shadow-accent-blue/20">
              Access Platform <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-accent-blue/20 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-teal/10 rounded-full blur-[150px] -z-10 mix-blend-screen"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8 relative z-10">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight transition-colors duration-300">
              Mapping Healthcare <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-teal">
                Accessibility
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-light max-w-xl transition-colors duration-300">
              ClinicMapper is a decision-support platform that uses advanced spatial modeling and machine learning to identify healthcare deserts and optimize telemedicine infrastructure deployment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="primary" onClick={() => navigate('/login')} className="py-4 px-8 text-base justify-center gap-2 shadow-lg shadow-accent-blue/20 group">
                Enter Demo Platform 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="pt-8 flex items-center gap-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 mt-8 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <span>162K+ Facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <span>Real-time Optimization</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 lg:h-[600px] flex items-center justify-center perspective-1000">
            {/* Hero Image / Map Visualization Container */}
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-accent-blue/20 border border-slate-700/50 transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
              <img 
                src="/hero-map.jpg" 
                alt="Geospatial Telemedicine Map Visualization" 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Overlay gradient to blend borders */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/90 dark:from-slate-900/80 via-transparent to-transparent transition-colors duration-300"></div>
              
              {/* Floating UI Elements */}
              <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent-teal shadow-[0_0_10px_rgba(13,148,136,0.8)]"></div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Active Hub Network</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optimizing 4.2M coverage area</p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-20 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2026 ClinicMapper Project. Academic prototype for demonstration purposes only.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
