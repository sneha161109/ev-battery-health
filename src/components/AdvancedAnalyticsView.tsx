import React, { useState } from 'react';
import { 
  MODEL_EVALUATIONS, 
  LOBO_CROSS_VALIDATION_RESULTS, 
  FEATURE_IMPORTANCE 
} from '../ml/models';
import { NASA_BATTERY_PROFILES } from '../data/nasa_battery_data';
import { predictSOH } from '../ml/models';
import { 
  Cpu, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  Crosshair 
} from 'lucide-react';

export const AdvancedAnalyticsView: React.FC = () => {
  const [selectedEvaluationCell, setSelectedEvaluationCell] = useState<string>('nasa-b0005');
  const [selectedModel, setSelectedModel] = useState<string>('Gradient Boosted Trees (XGBoost)');

  const targetCell = NASA_BATTERY_PROFILES.find(p => p.id === selectedEvaluationCell) || NASA_BATTERY_PROFILES[0];

  // Generate Actual vs Predicted pairs across cycles
  const actualVsPredicted = targetCell.cycles.map(c => {
    const pred = predictSOH(c, targetCell.nominalCapacity, selectedModel);
    return {
      cycle: c.cycle,
      actualSoh: c.soh,
      predictedSoh: pred.predictedSoh,
      residual: Number((pred.predictedSoh - c.soh).toFixed(2))
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
          <Cpu className="w-4 h-4" />
          <span>RESEARCH & DEVELOPER BENCHMARK</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Machine Learning Architecture & Validation Suite
        </h1>
        <p className="text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
          Comprehensive benchmark comparing ensemble regressors against empirical NASA Ames battery degradation data, evaluated via battery-wise Leave-One-Battery-Out (LOBO) cross-validation to guarantee zero data leakage.
        </p>
      </div>

      {/* 1. MODEL COMPARISON MATRIX TABLE */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Supervised Model Comparison (NASA Battery Benchmark)
            </h2>
            <p className="text-xs text-neutral-400">
              Evaluated on 4 independent 18650 LiCoO2 cells (B0005, B0006, B0007, B0018) totaling 636 discharge cycles.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[11px]">
                <th className="py-2.5 px-3">Algorithm Model</th>
                <th className="py-2.5 px-3">MAE (%)</th>
                <th className="py-2.5 px-3">RMSE (%)</th>
                <th className="py-2.5 px-3">R² Score</th>
                <th className="py-2.5 px-3">Max Error (%)</th>
                <th className="py-2.5 px-3">Train Latency</th>
                <th className="py-2.5 px-3">Architecture Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {MODEL_EVALUATIONS.map(m => (
                <tr key={m.modelName} className="hover:bg-[#141a27] transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    {m.modelName.includes('XGBoost') && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                    {m.modelName}
                  </td>
                  <td className="py-3 px-3 text-cyan-400 font-bold">{m.mae.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-neutral-300">{m.rmse.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{m.r2.toFixed(4)}</td>
                  <td className="py-3 px-3 text-red-400">{m.maxError.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-neutral-400">{m.trainingTimeMs} ms</td>
                  <td className="py-3 px-3 text-neutral-300 text-[11px] max-w-xs">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. LEAVE-ONE-BATTERY-OUT (LOBO) VALIDATION SECTION */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Leave-One-Battery-Out (LOBO) Cross-Validation
            </h2>
            <p className="text-xs text-neutral-400">
              Crucial methodology preventing data leakage: models are trained on 3 cells and evaluated strictly on the 4th held-out cell.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LOBO_CROSS_VALIDATION_RESULTS.map(res => (
            <div key={res.testBatteryId} className="bg-[#141924] p-4 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white uppercase">TEST CELL {res.testBatteryId}</span>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Independent Fold</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Trained on: {res.trainBatteries.join(', ')}
              </p>
              <div className="pt-2 border-t border-neutral-800 grid grid-cols-3 gap-1 text-center font-mono tabular-nums">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block">MAE</span>
                  <span className="text-xs font-bold text-cyan-400">{res.mae}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block">RMSE</span>
                  <span className="text-xs font-bold text-neutral-200">{res.rmse}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block">R²</span>
                  <span className="text-xs font-bold text-emerald-400">{res.r2}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ACTUAL VS PREDICTED REGRESSION SCATTER & RESIDUALS */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Actual vs Predicted Trajectory Overlay
            </h2>
            <p className="text-xs text-neutral-400">
              Comparing reference ground truth against model estimate across all cycles of selected test battery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEvaluationCell}
              onChange={(e) => setSelectedEvaluationCell(e.target.value)}
              className="bg-[#151a26] text-white text-xs font-mono border border-neutral-700 rounded-lg px-3 py-1.5 outline-none"
            >
              {NASA_BATTERY_PROFILES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#151a26] text-white text-xs font-mono border border-neutral-700 rounded-lg px-3 py-1.5 outline-none"
            >
              {MODEL_EVALUATIONS.map(m => (
                <option key={m.modelName} value={m.modelName}>{m.modelName.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SVG Dual-Trajectory Chart */}
        <div className="w-full bg-[#0d1017] p-4 rounded-xl border border-neutral-800">
          <svg viewBox="0 0 680 220" className="w-full h-auto">
            {/* Gridlines */}
            {[60, 70, 80, 90, 100].map(val => {
              const y = 180 - ((val - 55) / 50) * 150;
              return (
                <g key={val}>
                  <line x1="50" y1={y} x2="650" y2={y} stroke="#1b2333" strokeDasharray="3 3" />
                  <text x="42" y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">{val}%</text>
                </g>
              );
            })}

            {/* Actual Ground Truth Line (Solid White) */}
            <polyline
              fill="none"
              stroke="#f8fafc"
              strokeWidth="2"
              points={actualVsPredicted.map((p, i) => {
                const x = 50 + (i / (actualVsPredicted.length - 1)) * 600;
                const y = 180 - ((p.actualSoh - 55) / 50) * 150;
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Predicted Model Line (Dashed Red) */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 3"
              points={actualVsPredicted.map((p, i) => {
                const x = 50 + (i / (actualVsPredicted.length - 1)) * 600;
                const y = 180 - ((p.predictedSoh - 55) / 50) * 150;
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Legend inside SVG */}
            <g transform="translate(480, 25)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#f8fafc" strokeWidth="2" />
              <text x="26" y="4" fill="#f8fafc" fontSize="10" fontFamily="monospace">Ground Truth</text>
              <line x1="110" y1="0" x2="130" y2="0" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
              <text x="136" y="4" fill="#ef4444" fontSize="10" fontFamily="monospace">Model Prediction</text>
            </g>
          </svg>
        </div>
      </div>

      {/* 4. FEATURE IMPORTANCE & SHAP INSIGHTS */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-white font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Global Feature Importance (Gini / Split Gain)
          </h2>
          <p className="text-xs text-neutral-400">
            Relative contribution of each electrochemical telemetry signal in determining battery state of health.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURE_IMPORTANCE.map(feat => (
            <div key={feat.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-neutral-200">{feat.label}</span>
                <span className="text-cyan-400 font-bold">{(feat.importance * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-[#171d2b] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-cyan-500 rounded-full"
                  style={{ width: `${feat.importance * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 leading-tight">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SCIENTIFIC HONESTY & RESEARCH LIMITATIONS */}
      <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Scientific Disclosure & Operational Limitations</span>
        </div>
        <h3 className="text-base font-bold text-white">
          Why Laboratory Cell Predictions Differ From Production EV Packs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300 leading-relaxed">
          <div className="space-y-1.5">
            <strong className="text-white block font-mono uppercase">1. Single Cell vs Multi-Brick Topology:</strong>
            <p>
              NASA Ames benchmark cells are single 18650 cylindrical cells cycled under constant 2.0A laboratory benches. Production automotive batteries comprise thousands of cells wired in complex series-parallel matrix arrangements (e.g. 96s46p), introducing cell-to-cell thermal gradients and string balancing variances that laboratory models do not encounter.
            </p>
          </div>
          <div className="space-y-1.5">
            <strong className="text-white block font-mono uppercase">2. Active Thermal Regulation:</strong>
            <p>
              NASA lab cells experience unrestricted Joule self-heating in a 24°C chamber. Modern commercial EVs utilize glycol-based active liquid cooling plates and heat pumps that actively clamp cell temperatures to 22–28°C during driving and pre-warm them in winter, drastically reducing the thermal degradation observed in uncooled cells.
            </p>
          </div>
          <div className="space-y-1.5">
            <strong className="text-white block font-mono uppercase">3. Chemical Diversity:</strong>
            <p>
              Early NASA cells utilize Lithium Cobalt Oxide (LiCoO2) chemistry. Contemporary automotive vehicles employ high-nickel NMC (Nickel-Manganese-Cobalt), NCA (Nickel-Cobalt-Aluminum), or ultra-durable LFP (Lithium Iron Phosphate). Applying an LCO-trained model directly to an LFP chemistry requires transfer learning and chemistry-specific recalibration.
            </p>
          </div>
          <div className="space-y-1.5">
            <strong className="text-white block font-mono uppercase">4. Advisory Nature:</strong>
            <p>
              Model estimates provide high-level educational telemetry and wear monitoring. They do <strong>not</strong> replace OEM-certified dealer diagnostic scanners or high-precision Coulometric integration conducted by the vehicle's onboard BMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
