import React from 'react';
import { BatteryProfile, PredictionResult } from '../types/battery';
import { analyzeDegradationRate } from '../ml/degradation_warning';
import { X, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown, Clock } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BatteryProfile;
  prediction?: PredictionResult | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  prediction,
}) => {
  if (!isOpen) return null;

  const degradationAnalysis = analyzeDegradationRate(profile);
  const effectiveSoh = prediction ? prediction.predictedSoh : profile.currentSOH;
  const effectiveStatus = prediction ? prediction.status : profile.currentStatus;
  const effectiveCapacity = prediction ? prediction.predictedCapacity : profile.currentCapacity;
  const capacityLost = (profile.nominalCapacity - effectiveCapacity).toFixed(2);
  const capacityLostPct = (100 - effectiveSoh).toFixed(1);
  const analysisDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const header = 'parameter,value,unit\n';
    const rows = [
      `battery_name,"${profile.name}",text`,
      `cell_model,"${profile.cellModel}",text`,
      `chemistry,"${profile.chemistry}",text`,
      `analysis_timestamp,"${new Date().toISOString()}",iso8601`,
      `state_of_health,${effectiveSoh.toFixed(2)},percent`,
      `health_status,"${effectiveStatus}",text`,
      `estimated_usable_capacity,${effectiveCapacity.toFixed(2)},${profile.capacityUnit}`,
      `reference_nominal_capacity,${profile.nominalCapacity.toFixed(2)},${profile.capacityUnit}`,
      `capacity_lost,${capacityLost},${profile.capacityUnit}`,
      `capacity_lost_percent,${capacityLostPct},percent`,
      `cycles_recorded,${profile.cyclesRecorded},count`,
      `degradation_velocity_per_100c,${degradationAnalysis.actualRatePer100Cycles},percent`,
      `baseline_threshold_per_100c,${(degradationAnalysis.baselineThresholdRatePerCycle * 100).toFixed(2)},percent`,
      `accelerated_degradation_flag,${degradationAnalysis.isAccelerated},boolean`,
      `acceleration_ratio,${degradationAnalysis.accelerationRatio},multiplier`,
      `model_architecture,"${prediction?.modelUsed || 'Gradient Boosted Trees (XGBoost)'}",text`,
      `warranty_limit,70.0,percent`
    ].join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${profile.id}_diagnostic_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0c0f17] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar (hidden during print) */}
        <div className="no-print bg-[#131824] px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              VEHICLE BATTERY HEALTH DIAGNOSTIC REPORT
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 text-xs font-mono font-semibold text-neutral-200 bg-[#1b2233] hover:bg-[#232c42] rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 space-y-6 text-neutral-200 print:text-black print:p-0">
          {/* Header Strip */}
          <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-red-500 font-bold tracking-widest block">
                EV BATTERY TELEMETRY · OFFICIAL REPORT
              </span>
              <h1 className="text-2xl font-bold text-white print:text-black tracking-tight mt-1">
                {profile.name}
              </h1>
              <p className="text-xs text-neutral-400 print:text-neutral-600 font-mono mt-0.5">
                Target Model: {profile.cellModel} ({profile.chemistry}) · Voltage: {profile.nominalVoltage}V
              </p>
            </div>

            <div className="text-right text-xs font-mono space-y-1">
              <p className="text-neutral-400">Analysis Date: <strong className="text-white print:text-black">{analysisDate}</strong></p>
              <p className="text-neutral-400">Report Reference: <strong className="text-white print:text-black">REP-{profile.id.toUpperCase()}-{Math.floor(Date.now() / 1000)}</strong></p>
              <p className="text-neutral-400">Data Origin: <strong className={profile.isSynthetic ? 'text-amber-400' : 'text-emerald-400'}>
                {profile.isSynthetic ? 'Synthetic Calibrated Pack' : 'Genuine NASA Lab Cell'}
              </strong></p>
            </div>
          </div>

          {/* SOH Key Findings Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#121622] print:border print:border-neutral-300 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Battery Health (SOH)</span>
              <div className="my-2">
                <span className="text-4xl font-extrabold text-white print:text-black font-mono tabular-nums">
                  {effectiveSoh.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  effectiveSoh >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  Condition: {effectiveStatus}
                </span>
              </div>
            </div>

            <div className="bg-[#121622] print:border print:border-neutral-300 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Usable Energy Remaining</span>
              <div className="my-2">
                <span className="text-4xl font-extrabold text-cyan-400 font-mono tabular-nums">
                  {effectiveCapacity.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-neutral-400 ml-1.5">{profile.capacityUnit} usable</span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                When brand new: {profile.nominalCapacity} {profile.capacityUnit}
              </p>
            </div>

            <div className="bg-[#121622] print:border print:border-neutral-300 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Permanent Range Lost</span>
              <div className="my-2">
                <span className="text-4xl font-extrabold text-red-400 font-mono tabular-nums">
                  -{capacityLostPct}%
                </span>
                <span className="text-xs font-mono text-neutral-400 ml-1.5">(-{capacityLost} {profile.capacityUnit})</span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Lifetime charges: {profile.cyclesRecorded}
              </p>
            </div>
          </div>

          {/* Detailed Observations */}
          <div className="bg-[#121622] print:border print:border-neutral-300 p-5 rounded-xl border border-neutral-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-white print:text-black">
              Vehicle Battery Health Summary
            </h3>
            <p className="text-xs leading-relaxed text-neutral-300 print:text-black">
              Across {profile.cyclesRecorded} recorded full charge cycles, your battery currently retains approximately {effectiveSoh.toFixed(1)}% of its original factory energy capacity. That means you have experienced about {capacityLostPct}% total range loss over time. This rate of aging is standard for lithium-ion vehicle packs and represents ordinary everyday wear.
            </p>
            <div className="pt-2 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-400">
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span>Warranty Line: <strong>70% Health</strong></span>
                <span className={effectiveSoh > 70 ? 'text-emerald-400' : 'text-red-400'}>
                  {effectiveSoh > 70 ? '✓ Above 70% Warranty Limit' : '⚠ Below 70% Warranty Boundary'}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:gap-3">
                <span>Aging Speed: <strong className={degradationAnalysis.isAccelerated ? 'text-red-400' : 'text-neutral-200'}>{degradationAnalysis.actualRatePer100Cycles}% per 100 charges</strong></span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  degradationAnalysis.isAccelerated 
                    ? 'bg-red-950 text-red-400 border border-red-800' 
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {degradationAnalysis.isAccelerated ? '⚠ Accelerated Aging' : '✓ Normal Aging Speed'}
                </span>
              </div>
            </div>
          </div>

          {/* Model Prediction Details */}
          {prediction && (
            <div className="bg-[#121622] print:border print:border-neutral-300 p-5 rounded-xl border border-neutral-800 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-white print:text-black">
                Why Did the System Calculate This Score? (Key Factors)
              </h3>
              <p className="text-xs text-neutral-400">
                Calculated by <strong>{prediction.modelUsed}</strong>. Here is how each physical factor influenced the final rating:
              </p>
              <div className="space-y-1.5 pt-1">
                {prediction.shapBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono border-b border-neutral-800/60 pb-1">
                    <span className="text-neutral-300 print:text-black">{item.displayName}:</span>
                    <span className="text-neutral-400">{item.value} {item.unit}</span>
                    <span className={item.shapImpact < 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {item.shapImpact > 0 ? `+${item.shapImpact}%` : `${item.shapImpact}%`} impact
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Disclaimer & Safety Statement */}
          <div className="bg-red-950/20 print:bg-transparent print:border print:border-neutral-400 p-4 rounded-xl border border-red-900/40 text-xs text-neutral-400 print:text-neutral-700 space-y-1.5 leading-relaxed">
            <span className="font-bold text-red-400 font-mono uppercase block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              Engineering & Operational Disclaimer
            </span>
            <p>
              This report is generated by an experimental battery telemetry companion for educational and wear-monitoring purposes. Predictions are derived from laboratory cell datasets and statistical regression models. They do <strong>not</strong> substitute for official manufacturer diagnostics conducted with OEM-certified service tools. Never discontinue driving, replace a high-voltage battery pack, or ignore vehicle safety warnings based solely on model estimates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
