import React, { useState } from 'react';
import { NASA_BATTERY_PROFILES } from './data/nasa_battery_data';
import { COMMERCIAL_VEHICLE_PROFILES } from './data/vehicle_profiles';
import { BatteryProfile, PredictionResult } from './types/battery';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { EducationalView } from './components/EducationalView';
import { AdvancedAnalyticsView } from './components/AdvancedAnalyticsView';
import { ReportModal } from './components/ReportModal';
import { predictSOH } from './ml/models';
import { 
  Activity, 
  History, 
  Zap, 
  BookOpen, 
  Cpu, 
  ShieldAlert 
} from 'lucide-react';

export default function App() {
  const allProfiles = [...NASA_BATTERY_PROFILES, ...COMMERCIAL_VEHICLE_PROFILES];
  const [selectedProfileId, setSelectedProfileId] = useState<string>('nasa-b0005');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'diagnostics' | 'education' | 'analytics'>('dashboard');

  // Report Modal states
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportProfile, setReportProfile] = useState<BatteryProfile>(allProfiles[0]);
  const [reportPrediction, setReportPrediction] = useState<PredictionResult | null>(null);

  const currentProfile = allProfiles.find(p => p.id === selectedProfileId) || allProfiles[0];

  const handleOpenReport = () => {
    const latestCycle = currentProfile.cycles[currentProfile.cycles.length - 1];
    const pred = predictSOH(latestCycle, currentProfile.nominalCapacity);
    setReportProfile(currentProfile);
    setReportPrediction(pred);
    setReportOpen(true);
  };

  const handleOpenReportWithData = (profile: BatteryProfile, prediction: PredictionResult) => {
    setReportProfile(profile);
    setReportPrediction(prediction);
    setReportOpen(true);
  };

  const handleQuickDiagnostic = () => {
    setActiveTab('diagnostics');
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-neutral-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Motorsport Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickDiagnostic={handleQuickDiagnostic}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            profiles={allProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onOpenReport={handleOpenReport}
            onNavigateToDiagnostics={() => setActiveTab('diagnostics')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            profiles={allProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsView
            profiles={allProfiles}
            onOpenReportWithData={handleOpenReportWithData}
          />
        )}

        {activeTab === 'education' && (
          <EducationalView />
        )}

        {activeTab === 'analytics' && (
          <AdvancedAnalyticsView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (<md screens) */}
      <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0f17]/95 backdrop-blur-md border-t border-neutral-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono tracking-wider uppercase ${
            activeTab === 'dashboard' ? 'text-red-500 font-bold' : 'text-neutral-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono tracking-wider uppercase ${
            activeTab === 'history' ? 'text-red-500 font-bold' : 'text-neutral-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono tracking-wider uppercase ${
            activeTab === 'diagnostics' ? 'text-red-500 font-bold' : 'text-neutral-400'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Diagnostic</span>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono tracking-wider uppercase ${
            activeTab === 'education' ? 'text-red-500 font-bold' : 'text-neutral-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Learn</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono tracking-wider uppercase ${
            activeTab === 'analytics' ? 'text-red-500 font-bold' : 'text-neutral-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>ML Suite</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="no-print border-t border-neutral-800/80 bg-[#080a0f] py-6 px-4 sm:px-8 text-neutral-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase font-sans">EV Battery Telemetry</span>
            <span>·</span>
            <span>NASA Ames Prognostics Data & LOBO Machine Learning</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>Experimental SOH Companion</span>
            <span>·</span>
            <span>Non-OEM Telemetry Estimator</span>
          </div>
        </div>
      </footer>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        profile={reportProfile}
        prediction={reportPrediction}
      />
    </div>
  );
}
