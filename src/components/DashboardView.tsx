import React, { useState, useMemo } from 'react';
import { BatteryProfile } from '../types/battery';
import { BatteryGauge } from './BatteryGauge';
import { TelemetryChart } from './TelemetryChart';
import { generateRecommendations } from '../ml/recommendations';
import { 
  analyzeDegradationRate, 
  getBaselineReferenceCurve, 
  DEFAULT_BASELINE_RATES 
} from '../ml/degradation_warning';
import { 
  Zap, 
  ArrowUpRight, 
  Layers, 
  Thermometer, 
  Clock, 
  Car, 
  FlaskConical, 
  FileText,
  AlertTriangle,
  Sliders,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

interface DashboardViewProps {
  profiles: BatteryProfile[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  onOpenReport: () => void;
  onNavigateToDiagnostics: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenReport,
  onNavigateToDiagnostics,
}) => {
  const profile = profiles.find(p => p.id === selectedProfileId) || profiles[0];
  const [chartMetric, setChartMetric] = useState<'soh' | 'capacity' | 'temperature'>('soh');
  
  // Accelerated degradation threshold controls
  const [thresholdMode, setThresholdMode] = useState<'standard' | 'strict' | 'relaxed' | 'custom'>('standard');
  const [customThreshold, setCustomThreshold] = useState<number>(DEFAULT_BASELINE_RATES[profile.type]);
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);
  const [showBaselineSlope, setShowBaselineSlope] = useState<boolean>(true);

  // Compute active threshold based on mode
  const activeThresholdRate = useMemo(() => {
    const defaultRate = DEFAULT_BASELINE_RATES[profile.type];
    if (thresholdMode === 'strict') return Number((defaultRate * 0.75).toFixed(4));
    if (thresholdMode === 'relaxed') return Number((defaultRate * 1.35).toFixed(4));
    if (thresholdMode === 'custom') return customThreshold;
    return defaultRate;
  }, [profile.type, thresholdMode, customThreshold]);

  // Degradation velocity & warning analysis
  const degradationAnalysis = useMemo(() => {
    return analyzeDegradationRate(profile, activeThresholdRate);
  }, [profile, activeThresholdRate]);

  // Baseline reference curve for chart overlay
  const baselineCurve = useMemo(() => {
    return getBaselineReferenceCurve(profile, degradationAnalysis.baselineThresholdRatePerCycle);
  }, [profile, degradationAnalysis.baselineThresholdRatePerCycle]);

  const latestCycle = profile.cycles[profile.cycles.length - 1];
  const capacityLost = Number((profile.nominalCapacity - profile.currentCapacity).toFixed(2));
  const capacityLostPercent = Number(((1 - profile.currentCapacity / profile.nominalCapacity) * 100).toFixed(1));

  const recommendations = generateRecommendations(
    profile.currentSOH,
    profile.currentStatus,
    capacityLostPercent,
    latestCycle.temperature_measured,
    profile.cyclesRecorded,
    degradationAnalysis
  );

  const getConditionText = () => {
    if (degradationAnalysis.isAccelerated) {
      return `Attention needed: Your battery is losing capacity about ${degradationAnalysis.accelerationRatio}× faster than normal. It currently retains ${profile.currentSOH.toFixed(1)}% of its original capacity, but is losing about ${degradationAnalysis.actualRatePer100Cycles}% every 100 full charges. We recommend scheduling an inspection with an authorized service center.`;
    } else if (profile.currentSOH >= 90) {
      return `Excellent condition! Your battery retains ${profile.currentSOH.toFixed(1)}% of its original driving capacity. Aging is very minimal and well within optimal factory standards.`;
    } else if (profile.currentSOH >= 80) {
      return `Good condition. Your battery holds approximately ${profile.currentSOH.toFixed(1)}% of its original capacity. This is normal, expected wear over ${profile.cyclesRecorded} charge cycles.`;
    } else if (profile.currentSOH >= 70) {
      return `Fair condition. Your battery holds ${profile.currentSOH.toFixed(1)}% of its original capacity. Noticeable range loss has occurred and is nearing the standard 70% warranty review threshold.`;
    } else {
      return `Aged condition. Your battery capacity is down to ${profile.currentSOH.toFixed(1)}%. If your EV is under 8 years old, you may qualify for a free warranty battery replacement or service.`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Battery / Vehicle Profile Selector Bar */}
      <div className="bg-[#0f131c] p-4 rounded-xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-red-500">
            {profile.type === 'vehicle_pack' ? <Car className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                CURRENT VEHICLE / BATTERY
              </span>
              <span className="text-neutral-500 font-mono text-xs">·</span>
              <span className={`text-[11px] font-mono uppercase ${profile.isSynthetic ? 'text-amber-400' : 'text-emerald-400'}`}>
                {profile.isSynthetic ? 'Commercial EV Profile' : 'Genuine NASA Test Cell'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {profile.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="profile-select" className="text-xs font-mono uppercase text-neutral-400 hidden sm:inline">
            Choose EV:
          </label>
          <select
            id="profile-select"
            value={selectedProfileId}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="bg-[#151a26] text-white text-xs font-mono border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-red-500 cursor-pointer"
          >
            <optgroup label="Real-World EV Vehicle Packs">
              {profiles.filter(p => p.type === 'vehicle_pack').map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentSOH.toFixed(1)}% Health)
                </option>
              ))}
            </optgroup>
            <optgroup label="NASA Research Test Cells">
              {profiles.filter(p => p.type === 'laboratory_nasa').map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentSOH.toFixed(1)}% Health)
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              showThresholdConfig 
                ? 'bg-red-950/60 text-red-300 border-red-700' 
                : 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span>Alert Sensitivity: {thresholdMode.toUpperCase()}</span>
          </button>

          <button
            onClick={onOpenReport}
            className="px-3 py-2 text-xs font-mono font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>Health Report</span>
          </button>
        </div>
      </div>

      {/* Degradation Threshold Configuration Drawer */}
      {showThresholdConfig && (
        <div className="bg-[#121622] p-5 rounded-xl border border-neutral-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase text-red-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Battery Aging Sensitivity Settings
              </span>
              <p className="text-xs text-neutral-300 mt-0.5">
                Choose how sensitive the system is when alerting you if your battery is losing capacity faster than normal.
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              Active Benchmark: <strong className="text-white">{(activeThresholdRate * 100).toFixed(1)}%</strong> loss per 100 full charges
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setThresholdMode('standard')}
              className={`p-3 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                thresholdMode === 'standard' 
                  ? 'bg-red-950/40 border-red-500 text-white shadow-sm' 
                  : 'bg-[#151a26] border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold uppercase text-[11px] text-white">Standard Mode</div>
              <div className="text-red-400 font-bold mt-1">
                {(DEFAULT_BASELINE_RATES[profile.type] * 100).toFixed(1)}% per 100 charges
              </div>
              <p className="text-[10px] text-neutral-300 mt-1">Recommended everyday vehicle benchmark.</p>
            </button>

            <button
              onClick={() => setThresholdMode('strict')}
              className={`p-3 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                thresholdMode === 'strict' 
                  ? 'bg-red-950/40 border-red-500 text-white shadow-sm' 
                  : 'bg-[#151a26] border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold uppercase text-[11px] text-white">Early Alert Mode</div>
              <div className="text-amber-400 font-bold mt-1">
                {(DEFAULT_BASELINE_RATES[profile.type] * 0.75 * 100).toFixed(1)}% per 100 charges
              </div>
              <p className="text-[10px] text-neutral-300 mt-1">Warns you at the very first sign of speeding wear.</p>
            </button>

            <button
              onClick={() => setThresholdMode('relaxed')}
              className={`p-3 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                thresholdMode === 'relaxed' 
                  ? 'bg-red-950/40 border-red-500 text-white shadow-sm' 
                  : 'bg-[#151a26] border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold uppercase text-[11px] text-white">High Mileage / Climate</div>
              <div className="text-cyan-400 font-bold mt-1">
                {(DEFAULT_BASELINE_RATES[profile.type] * 1.35 * 100).toFixed(1)}% per 100 charges
              </div>
              <p className="text-[10px] text-neutral-300 mt-1">Tolerates frequent heavy highway driving or hot weather.</p>
            </button>

            <div className="p-3 rounded-lg border bg-[#151a26] border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white text-[11px] uppercase">Custom Slider</span>
                <span className="text-red-400 font-bold">{(customThreshold * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={profile.type === 'laboratory_nasa' ? '0.05' : '0.01'}
                max={profile.type === 'laboratory_nasa' ? '0.35' : '0.12'}
                step="0.005"
                value={customThreshold}
                onChange={(e) => {
                  setCustomThreshold(Number(e.target.value));
                  setThresholdMode('custom');
                }}
                className="w-full accent-red-500 cursor-pointer mt-1"
              />
              <span className="text-[10px] text-neutral-400 font-mono">loss % per 100 charges</span>
            </div>
          </div>
        </div>
      )}

      {/* PROMINENT ACCELERATED DEGRADATION WARNING BANNER */}
      {degradationAnalysis.isAccelerated ? (
        <div className={`p-5 rounded-xl border space-y-3 ${
          degradationAnalysis.warningLevel === 'CRITICAL_ACCELERATION'
            ? 'bg-red-950/30 border-red-600/80 shadow-lg shadow-red-950/20'
            : 'bg-amber-950/30 border-amber-600/80 shadow-lg shadow-amber-950/20'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full animate-ping shrink-0 ${
                degradationAnalysis.warningLevel === 'CRITICAL_ACCELERATION' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              <span className={`text-sm font-mono font-bold uppercase tracking-wider ${
                degradationAnalysis.warningLevel === 'CRITICAL_ACCELERATION' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {degradationAnalysis.warningLevel === 'CRITICAL_ACCELERATION'
                  ? 'ALERT: YOUR BATTERY IS AGING FASTER THAN NORMAL'
                  : 'NOTICE: SLIGHTLY ELEVATED CAPACITY LOSS'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-neutral-400">Aging Speed:</span>
              <span className="font-bold text-white tabular-nums bg-red-950 px-2 py-0.5 rounded border border-red-800">
                Losing {degradationAnalysis.actualRatePer100Cycles}% every 100 charges ({degradationAnalysis.accelerationRatio}× normal pace)
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            {degradationAnalysis.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-red-900/40 text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-300">
              <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
              <span>Extra Range Lost: <strong className="text-red-400">-{degradationAnalysis.excessCapacityLossPercent}% beyond normal</strong></span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Charges Left to 70% Warranty: <strong className="text-amber-400">~{degradationAnalysis.projectedRemainingCyclesToWarranty} charges</strong></span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Sudden Drop Pattern: <strong className={degradationAnalysis.kneePointDetected ? 'text-red-400' : 'text-neutral-400'}>
                {degradationAnalysis.kneePointDetected ? 'Yes (Recent Drop)' : 'Gradual Wear'}
              </strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-900/40 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>NORMAL AGING PACE: Losing {degradationAnalysis.actualRatePer100Cycles}% per 100 charges (Safe baseline limit: {(activeThresholdRate * 100).toFixed(1)}%)</span>
          </div>
          <span className="text-neutral-400 text-[11px] hidden sm:inline">Healthy Battery Pace</span>
        </div>
      )}

      {/* Main 2-Column Split: Telemetry Gauge & Plain Language Condition Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Prominent F1 Arc Gauge */}
        <div className="lg:col-span-5 flex flex-col">
          <BatteryGauge
            soh={profile.currentSOH}
            status={profile.currentStatus}
            currentCapacity={profile.currentCapacity}
            nominalCapacity={profile.nominalCapacity}
            capacityUnit={profile.capacityUnit}
            cycles={profile.cyclesRecorded}
          />
        </div>

        {/* Right Column: Plain Language Condition Summary & Core KPI Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Plain Language Condition Banner */}
          <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
              <span>BATTERY HEALTH OVERVIEW</span>
              <div className="flex items-center gap-2">
                {degradationAnalysis.isAccelerated && (
                  <span className="text-red-400 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800 text-[10px]">
                    ⚠ AGING FASTER
                  </span>
                )}
                <span className="text-emerald-400 font-bold">{profile.currentStatus} CONDITION</span>
              </div>
            </div>
            
            <p className="text-white text-base leading-relaxed mb-4">
              "{getConditionText()}"
            </p>

            <div className="text-xs text-neutral-400 font-mono flex flex-wrap items-center gap-y-1 gap-x-3 pt-3 border-t border-neutral-800">
              <span>Chemistry: <strong className="text-neutral-200">{profile.chemistry}</strong></span>
              <span>·</span>
              <span>Cell Model: <strong className="text-neutral-200">{profile.cellModel}</strong></span>
              <span>·</span>
              <span>Pack Voltage: <strong className="text-neutral-200">{profile.nominalVoltage}V</strong></span>
            </div>
          </div>

          {/* 5-KPI Strip: Numerical Readings in Tabular Monospace */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-[#0f131c] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Available Energy</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums mt-1">
                {profile.currentCapacity.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">{profile.capacityUnit} usable today</span>
            </div>

            <div className="bg-[#0f131c] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Total Range Lost</span>
              <span className="text-xl font-bold font-mono text-red-400 tabular-nums mt-1">
                {capacityLostPercent}%
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">-{capacityLost} {profile.capacityUnit} faded</span>
            </div>

            <div className="bg-[#0f131c] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Aging Speed</span>
              <span className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                degradationAnalysis.isAccelerated ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {degradationAnalysis.actualRatePer100Cycles}%
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">loss per 100 charges</span>
            </div>

            <div className="bg-[#0f131c] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Charge Cycles</span>
              <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">
                {profile.cyclesRecorded}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">full cycles</span>
            </div>

            <div className="bg-[#0f131c] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Highest Temp</span>
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                {latestCycle.temperature_measured.toFixed(1)}°
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">safe &lt; 35°C</span>
            </div>
          </div>

          {/* Quick Action Button Strip */}
          <div className="bg-gradient-to-r from-red-950/30 to-transparent p-4 rounded-xl border border-red-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white uppercase font-mono">Run Custom Diagnostics</p>
                <p className="text-neutral-400">Test with experimental ML models or upload CSV telemetry files.</p>
              </div>
            </div>
            <button
              onClick={onNavigateToDiagnostics}
              className="px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Test Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Degradation Telemetry Graph with Baseline Reference Overlay */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              Battery Degradation Trajectory
            </h2>
            <p className="text-xs text-neutral-400">
              Historical retention path compared against baseline expected decay rate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {chartMetric === 'soh' && (
              <button
                onClick={() => setShowBaselineSlope(!showBaselineSlope)}
                className={`px-3 py-1 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showBaselineSlope 
                    ? 'bg-neutral-800 text-white border-neutral-600 font-semibold' 
                    : 'bg-transparent text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400"></span>
                <span>{showBaselineSlope ? 'Hide Baseline Slope' : 'Compare Baseline Slope'}</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-[#0f131c] p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setChartMetric('soh')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  chartMetric === 'soh' ? 'bg-red-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                SOH (%)
              </button>
              <button
                onClick={() => setChartMetric('capacity')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  chartMetric === 'capacity' ? 'bg-red-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Capacity ({profile.capacityUnit})
              </button>
              <button
                onClick={() => setChartMetric('temperature')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  chartMetric === 'temperature' ? 'bg-red-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Temperature (°C)
              </button>
            </div>
          </div>
        </div>

        <TelemetryChart
          cycles={profile.cycles}
          metric={chartMetric}
          capacityUnit={profile.capacityUnit}
          height={280}
          baselineCurve={baselineCurve}
          showBaselineComparison={showBaselineSlope}
        />
      </div>

      {/* Actionable Recommendations: "What should I do based on the available information?" */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Recommended Action Plan
            </h2>
            <p className="text-xs text-neutral-400">
              Clear, practical driving and charging guidance calibrated for your battery's current retention.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400 uppercase">
            {recommendations.length} ADVISORIES ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map(rec => (
            <div 
              key={rec.id}
              className="bg-[#141924] p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  {rec.category === 'charging' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  {rec.category === 'temperature' && <Thermometer className="w-3.5 h-3.5 text-amber-400" />}
                  {rec.category === 'warranty' && <Clock className="w-3.5 h-3.5 text-red-400" />}
                  {rec.category === 'driving' && <Car className="w-3.5 h-3.5 text-emerald-400" />}
                  {rec.title}
                </span>
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                  rec.priority === 'high' ? 'bg-red-950/60 text-red-400 border border-red-800/60' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-neutral-200 font-medium">
                {rec.action}
              </p>
              <p className="text-[11px] text-neutral-400 leading-normal">
                {rec.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
