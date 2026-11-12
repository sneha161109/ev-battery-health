import React, { useState, useRef } from 'react';
import { BatteryProfile, PredictionResult, CsvValidationResult } from '../types/battery';
import { predictSOH } from '../ml/models';
import { validateBatteryCsv } from '../ml/validator';
import { VALID_SAMPLE_CSV, INVALID_SAMPLE_CSV } from '../data/sample_csvs';
import { 
  Zap, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  RefreshCw, 
  FileText,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

interface DiagnosticsViewProps {
  profiles: BatteryProfile[];
  onOpenReportWithData: (profile: BatteryProfile, prediction: PredictionResult) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  profiles,
  onOpenReportWithData,
}) => {
  const [testingMode, setTestingMode] = useState<'sample' | 'upload'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(profiles[0]?.id || 'nasa-b0005');
  const [selectedModel, setSelectedModel] = useState<string>('Gradient Boosted Trees (XGBoost)');
  
  // Execution states
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [testedProfile, setTestedProfile] = useState<BatteryProfile | null>(null);

  // Upload states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<CsvValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProfile = profiles.find(p => p.id === selectedSampleId) || profiles[0];

  const handleRunSampleDiagnostic = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      const latestCycle = selectedProfile.cycles[selectedProfile.cycles.length - 1];
      const res = predictSOH(latestCycle, selectedProfile.nominalCapacity, selectedModel);
      setPrediction(res);
      setTestedProfile(selectedProfile);
      setIsDiagnosing(false);
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const validation = validateBatteryCsv(text);
      setCsvResult(validation);
      if (validation.isValid && validation.validCycles.length > 0) {
        // Auto-run prediction on the uploaded file's final cycle
        const lastCycle = validation.validCycles[validation.validCycles.length - 1];
        const res = predictSOH(lastCycle, 2.0, selectedModel);
        setPrediction(res);
        setTestedProfile({
          id: 'custom-upload',
          name: `Uploaded Telemetry (${file.name})`,
          type: 'laboratory_nasa',
          cellModel: 'User Provided CSV Dataset',
          nominalCapacity: 2.0,
          capacityUnit: 'Ah',
          nominalVoltage: 3.7,
          cyclesRecorded: validation.validCycles.length,
          chemistry: 'NMC',
          description: 'Custom battery telemetry uploaded by user and validated against lithium-ion electrochemical bounds.',
          initialCapacity: validation.validCycles[0].capacity,
          currentCapacity: lastCycle.capacity,
          currentSOH: res.predictedSoh,
          currentStatus: res.status,
          cycles: validation.validCycles,
          isSynthetic: true
        });
      } else {
        setPrediction(null);
        setTestedProfile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemoValidCsv = () => {
    setUploadedFileName('synthetic_valid_telemetry.csv');
    const validation = validateBatteryCsv(VALID_SAMPLE_CSV);
    setCsvResult(validation);
    const lastCycle = validation.validCycles[validation.validCycles.length - 1];
    const res = predictSOH(lastCycle, 2.0, selectedModel);
    setPrediction(res);
    setTestedProfile({
      id: 'demo-valid',
      name: 'Demonstration Valid Telemetry CSV',
      type: 'laboratory_nasa',
      cellModel: 'Demonstration Test Set',
      nominalCapacity: 2.0,
      capacityUnit: 'Ah',
      nominalVoltage: 3.7,
      cyclesRecorded: validation.validCycles.length,
      chemistry: 'NMC',
      description: 'Synthetic demonstration dataset used for testing validation pipelines.',
      initialCapacity: validation.validCycles[0].capacity,
      currentCapacity: lastCycle.capacity,
      currentSOH: res.predictedSoh,
      currentStatus: res.status,
      cycles: validation.validCycles,
      isSynthetic: true
    });
  };

  const handleLoadDemoInvalidCsv = () => {
    setUploadedFileName('synthetic_invalid_demo.csv');
    const validation = validateBatteryCsv(INVALID_SAMPLE_CSV);
    setCsvResult(validation);
    setPrediction(null);
    setTestedProfile(null);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([VALID_SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'battery_telemetry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPredictions = () => {
    if (!testedProfile || !prediction) return;
    const header = 'cycle,voltage_measured,current_measured,temperature_measured,discharge_duration,predicted_soh,actual_capacity\n';
    const rows = testedProfile.cycles.map(c => {
      const pred = predictSOH(c, testedProfile.nominalCapacity, selectedModel);
      return `${c.cycle},${c.voltage_measured},${c.current_measured},${c.temperature_measured},${c.discharge_duration},${pred.predictedSoh},${c.capacity}`;
    }).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${testedProfile.id}_predictions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Method Selector Tabs: Sample vs CSV Upload */}
      <div className="bg-[#0f131c] p-4 rounded-xl border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-neutral-400">BATTERY HEALTH CHECKUP</span>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Battery Health Checkup & Scanner
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-[#151a26] p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => {
              setTestingMode('sample');
              setPrediction(null);
            }}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-md transition-colors ${
              testingMode === 'sample' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Method 1: Test Sample Battery
          </button>
          <button
            onClick={() => {
              setTestingMode('upload');
              setPrediction(null);
            }}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-md transition-colors ${
              testingMode === 'upload' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Method 2: Upload Battery File
          </button>
        </div>
      </div>

      {/* METHOD 1: BUILT-IN SAMPLE BATTERIES */}
      {testingMode === 'sample' && (
        <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase text-white">
                Select a Sample Battery to Test
              </h2>
              <p className="text-xs text-neutral-400">
                Choose a benchmark battery below to test how our prediction engine evaluates health and degradation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="model-select" className="text-xs font-mono text-neutral-400">Analysis Model:</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#151a26] text-white text-xs font-mono border border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:border-red-500"
              >
                <option value="Gradient Boosted Trees (XGBoost)">Gradient Boosted Trees (XGBoost)</option>
                <option value="Random Forest Regressor">Random Forest Regressor</option>
                <option value="Support Vector Regression (SVR - RBF)">Support Vector Regression (SVR)</option>
                <option value="Linear Regression (Ridge / OLS)">Linear Regression (Ridge)</option>
              </select>
            </div>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {profiles.slice(0, 4).map(p => {
              const isSelected = selectedSampleId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedSampleId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-[#181f2e] border-red-500 shadow-md shadow-red-950/20' 
                      : 'bg-[#121622] border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                    <span className="uppercase text-[10px] text-emerald-400">{p.type === 'laboratory_nasa' ? 'NASA Test Cell' : 'Vehicle Pack'}</span>
                    <span>{p.cyclesRecorded} cycles</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-baseline justify-between text-xs font-mono pt-2 border-t border-neutral-800">
                    <span className="text-neutral-400">Official Lab Health:</span>
                    <span className="text-white font-bold">{p.currentSOH.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Run Diagnostic Button */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
            <div className="text-xs font-mono text-neutral-400">
              Selected: <strong className="text-white">{selectedProfile.name}</strong> ({selectedProfile.cyclesRecorded} charge cycles recorded)
            </div>

            <button
              onClick={handleRunSampleDiagnostic}
              disabled={isDiagnosing}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-lg transition-all shadow-md shadow-red-950/40 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isDiagnosing ? 'Calculating Health...' : 'Run Health Checkup'}</span>
            </button>
          </div>
        </div>
      )}

      {/* METHOD 2: UPLOAD BATTERY MEASUREMENTS */}
      {testingMode === 'upload' && (
        <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase text-white">
                Upload Battery Measurements (.CSV)
              </h2>
              <p className="text-xs text-neutral-400">
                Upload battery sensor logs recorded during driving or bench testing to estimate health.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 text-xs font-mono font-semibold text-neutral-200 bg-[#151a26] hover:bg-[#1c2333] border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Sample File</span>
            </button>
          </div>

          {/* EV Screenshot / Raw history Disclaimer */}
          <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-200 font-mono uppercase">
                Why can't I upload a car screen photo or public charger receipt?
              </p>
              <p className="text-neutral-300 leading-relaxed">
                Screen photos, charging station receipts, and odometer miles only show basic session totals. Calculating internal battery health requires continuous electrical sensor readings (voltage under load, discharge time, and operating temperatures) from an OBD-II diagnostic dongle or battery test bench.
              </p>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-red-500 p-8 rounded-xl bg-[#121622] text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">
              {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click or drag a battery CSV log to inspect'}
            </p>
            <p className="text-xs text-neutral-400 font-mono">
              Requires columns: cycle, voltage_measured, current_measured, temperature_measured, discharge_duration
            </p>
          </div>

          {/* Quick Demo Dataset Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <span className="text-neutral-400">Try Quick Demos:</span>
            <button
              onClick={handleLoadDemoValidCsv}
              className="px-3 py-1 bg-[#151a26] hover:bg-[#1d2435] text-emerald-400 border border-emerald-900/60 rounded flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Load Good Sample File</span>
            </button>
            <button
              onClick={handleLoadDemoInvalidCsv}
              className="px-3 py-1 bg-[#151a26] hover:bg-[#1d2435] text-rose-400 border border-rose-900/60 rounded flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Load Broken File (See Safety Check)</span>
            </button>
          </div>

          {/* CSV Validation Feedback */}
          {csvResult && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              csvResult.isValid 
                ? 'bg-emerald-950/20 border-emerald-800/60' 
                : 'bg-rose-950/20 border-rose-800/60'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`font-bold uppercase flex items-center gap-1.5 ${
                  csvResult.isValid ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {csvResult.isValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {csvResult.isValid ? 'File Verification Passed' : 'File Issues Detected'}
                </span>
                <span className="text-neutral-400">
                  {csvResult.rowCount} rows processed · {csvResult.validCycles.length} valid cycles
                </span>
              </div>

              {csvResult.errors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-rose-900/40">
                  {csvResult.errors.map((err, idx) => (
                    <div key={idx} className="text-xs font-mono text-rose-300 flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {csvResult.isValid && (
                <p className="text-xs text-neutral-300 font-mono">
                  All column headers and safe battery physical bounds verified successfully. Health prediction has been calculated for the latest recorded charge cycle.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* DIAGNOSTIC PREDICTION RESULTS SECTION */}
      {prediction && testedProfile && (
        <div className="bg-[#0f131c] p-6 rounded-xl border border-red-900/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
                  HEALTH CHECKUP COMPLETED
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {testedProfile.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPredictions}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold text-neutral-200 bg-[#151a26] hover:bg-[#1c2333] border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Results (.CSV)</span>
              </button>

              <button
                onClick={() => onOpenReportWithData(testedProfile, prediction)}
                className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Key Estimation Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141924] p-4 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Estimated Health (SOH)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-white tabular-nums">
                  {prediction.predictedSoh.toFixed(1)}%
                </span>
                <span className={`text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                  prediction.predictedSoh >= 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {prediction.status}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
                Calculated by {prediction.modelUsed.split(' ')[0]}
              </span>
            </div>

            <div className="bg-[#141924] p-4 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Official Lab Reference</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-neutral-300 tabular-nums">
                  {testedProfile.currentSOH.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-neutral-400">actual</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 mt-1 block">
                Accuracy: within {Math.abs(prediction.predictedSoh - testedProfile.currentSOH).toFixed(2)}% of lab ground truth
              </span>
            </div>

            <div className="bg-[#141924] p-4 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Estimated Usable Energy</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-white tabular-nums">
                  {prediction.predictedCapacity.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-neutral-400">{testedProfile.capacityUnit}</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
                When brand new: {testedProfile.nominalCapacity} {testedProfile.capacityUnit}
              </span>
            </div>

            <div className="bg-[#141924] p-4 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-mono uppercase text-neutral-400">Permanent Driving Range Lost</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-red-400 tabular-nums">
                  -{prediction.capacityLostPercent.toFixed(1)}%
                </span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
                -{prediction.capacityLost.toFixed(2)} {testedProfile.capacityUnit} capacity lost over time
              </span>
            </div>
          </div>

          {/* Explainable AI: SHAP Feature Attribution Breakdown */}
          <div className="bg-[#141924] p-5 rounded-xl border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Why Did the System Calculate This Score? (Key Factors)
              </h3>
              <p className="text-xs text-neutral-400">
                Here is how each measured physical factor influenced your battery's {prediction.predictedSoh.toFixed(1)}% health score compared to a 100% brand-new factory battery.
              </p>
            </div>

            <div className="space-y-3">
              {prediction.shapBreakdown.map((item, idx) => (
                <div key={idx} className="bg-[#0f131c] p-3 rounded-lg border border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{item.displayName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400">{item.value} {item.unit}</span>
                      <span className={`font-bold ${item.shapImpact < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.shapImpact > 0 ? `+${item.shapImpact}%` : `${item.shapImpact}%`} {item.shapImpact > 0 ? 'boost' : 'aging impact'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
