import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'history' | 'diagnostics' | 'education' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'history' | 'diagnostics' | 'education' | 'analytics') => void;
  onQuickDiagnostic: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onQuickDiagnostic }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#080a0f]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element Brand Zone */}
      <div 
        onClick={() => setActiveTab('dashboard')} 
        className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-sm shadow-red-900/30 group-hover:scale-105 transition-transform">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white uppercase font-sans">
          EV BATTERY TELEMETRY
        </span>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider uppercase text-neutral-400">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'dashboard' ? 'text-white border-red-500' : 'border-transparent'
          }`}
        >
          My EV Dashboard
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'history' ? 'text-white border-red-500' : 'border-transparent'
          }`}
        >
          Battery History
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'diagnostics' ? 'text-white border-red-500' : 'border-transparent'
          }`}
        >
          Battery Checkup
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'education' ? 'text-white border-red-500' : 'border-transparent'
          }`}
        >
          EV Battery 101
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'analytics' ? 'text-white border-red-500' : 'border-transparent'
          }`}
        >
          Pro Tech Lab
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickDiagnostic}
          className="px-4 py-2 text-xs font-bold tracking-wider uppercase text-white bg-red-600 hover:bg-red-500 rounded-md transition-all shadow-md shadow-red-950/40 flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Quick Checkup</span>
        </button>
      </div>
    </header>
  );
};
