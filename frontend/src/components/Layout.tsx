import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Compass,
  Database,
  Network,
  MapPin,
  Crosshair,
  Sliders,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const primaryNavItems = [
  { to: '/overview', label: 'Overview', icon: Compass },
  { to: '/explore', label: 'Explore', icon: Database },
  { to: '/clusters', label: 'Clusters', icon: Network },
  { to: '/map', label: 'Map', icon: MapPin },
  { to: '/optimize', label: 'Optimize', icon: Crosshair },
  { to: '/simulate', label: 'Simulate', icon: Sliders },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-slate-100 font-sans transition-colors duration-150 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center space-x-6">
              <Link to="/overview" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#0f172a] dark:bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-4 h-4 text-sky-400 dark:text-[#0f172a]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-[#0f172a] dark:text-white leading-tight">
                    ClinicMapper
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-normal">
                    Geospatial Intelligence
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Clean Primary Horizontal Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right: Secondary Actions (Methodology link, Data source badge, Theme Toggle) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <NavLink
                to="/research"
                className={({ isActive }) =>
                  `hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-sky-700 dark:text-sky-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Methodology</span>
              </NavLink>

              <div className="hidden lg:flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                162K NIN Facilities
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 pt-2 pb-4 space-y-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-[#0f172a] dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/research"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <BookOpen className="w-4 h-4" />
              <span>Methodology & Research</span>
            </NavLink>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Subtle Academic Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>ClinicMapper · AI-Powered Geospatial Accessibility & Telemedicine Hub Intelligence</span>
          <div className="flex items-center space-x-4">
            <Link to="/research" className="hover:text-slate-600 dark:hover:text-slate-300">Methodology</Link>
            <Link to="/reports" className="hover:text-slate-600 dark:hover:text-slate-300">Export Report</Link>
            <span>National Identification Number (NIN) & NFHS-5 Data</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
