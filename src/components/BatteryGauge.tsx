import React from 'react';
import { BatteryHealthStatus } from '../types/battery';

interface BatteryGaugeProps {
  soh: number;
  status: BatteryHealthStatus;
  currentCapacity: number;
  nominalCapacity: number;
  capacityUnit: 'Ah' | 'kWh';
  cycles: number;
}

export const BatteryGauge: React.FC<BatteryGaugeProps> = ({
  soh,
  status,
  currentCapacity,
  nominalCapacity,
  capacityUnit,
  cycles
}) => {
  // Arc parameters (240 degree gauge sweep from 150 deg to 390 deg)
  const radius = 95;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  
  // Clamped ratio (0 to 1)
  const ratio = Math.max(0, Math.min(100, soh)) / 100;
  const strokeDashoffset = arcLength * (1 - ratio);

  // Color mapping
  const getColor = () => {
    if (soh >= 90) return '#10b981'; // Emerald
    if (soh >= 80) return '#06b6d4'; // Laser Cyan
    if (soh >= 70) return '#f59e0b'; // Telemetry Amber
    return '#ef4444'; // Racing Red
  };

  const currentColor = getColor();

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-[#0f131c] rounded-xl border border-neutral-800/80 shadow-lg shadow-black/40">
      {/* Top telemetry label */}
      <div className="w-full flex items-center justify-between text-xs font-mono tracking-wider text-neutral-400 uppercase mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentColor }}></span>
          STATE OF HEALTH (SOH)
        </span>
        <span className="text-neutral-500">CYCLE {cycles}</span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-[210deg]" viewBox="0 0 240 240">
          {/* Background track */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#1c2230"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* 70% Warranty Threshold Marker */}
          {/* 70% corresponds to 0.70 of 240 deg = 168 deg along arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth + 4}
            strokeDasharray={`3 ${circumference}`}
            strokeDashoffset={arcLength * (1 - 0.70)}
            className="opacity-70"
          />

          {/* Active colored arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Readout Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2 pointer-events-none">
          <span className="text-5xl font-extrabold tracking-tight text-white font-mono tabular-nums">
            {soh.toFixed(1)}<span className="text-2xl text-neutral-400 font-sans font-medium">%</span>
          </span>
          
          <div className="mt-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-widest uppercase border"
            style={{
              borderColor: `${currentColor}40`,
              backgroundColor: `${currentColor}15`,
              color: currentColor
            }}
          >
            STATUS: {status}
          </div>

          <span className="text-[11px] font-mono text-neutral-400 mt-2">
            {currentCapacity.toFixed(2)} / {nominalCapacity.toFixed(1)} {capacityUnit}
          </span>
        </div>
      </div>

      {/* Gauge Legend & Thresholds */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Retention</span>
          <span className="text-xs font-mono font-bold text-neutral-200">
            {((currentCapacity / nominalCapacity) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Lost Capacity</span>
          <span className="text-xs font-mono font-bold text-red-400">
            -{(nominalCapacity - currentCapacity).toFixed(2)} {capacityUnit}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Warranty Limit</span>
          <span className="text-xs font-mono font-bold text-amber-400">70.0% SOH</span>
        </div>
      </div>
    </div>
  );
};
