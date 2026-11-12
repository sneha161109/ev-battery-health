import React, { useState, useId } from 'react';
import { TelemetryCycle } from '../types/battery';

interface TelemetryChartProps {
  cycles: TelemetryCycle[];
  metric: 'soh' | 'capacity' | 'voltage' | 'temperature' | 'impedance';
  capacityUnit?: 'Ah' | 'kWh';
  height?: number;
  highlightCycle?: number;
  onSelectCycle?: (cycle: number) => void;
  showWarrantyLine?: boolean;
  baselineCurve?: { cycle: number; baselineSoh: number }[];
  showBaselineComparison?: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  cycles,
  metric,
  capacityUnit = 'Ah',
  height = 260,
  highlightCycle,
  onSelectCycle,
  showWarrantyLine = true,
  baselineCurve,
  showBaselineComparison = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const filterId = useId();

  if (!cycles || cycles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 font-mono text-xs">
        NO TELEMETRY DATA AVAILABLE
      </div>
    );
  }

  // Extract values based on metric
  const getVal = (c: TelemetryCycle): number => {
    switch (metric) {
      case 'soh': return c.soh;
      case 'capacity': return c.capacity;
      case 'voltage': return c.voltage_measured;
      case 'temperature': return c.temperature_measured;
      case 'impedance': return c.internal_impedance ?? (0.075 + c.cycle * 0.0008);
      default: return c.soh;
    }
  };

  const getUnit = (): string => {
    switch (metric) {
      case 'soh': return '%';
      case 'capacity': return capacityUnit;
      case 'voltage': return 'V';
      case 'temperature': return '°C';
      case 'impedance': return 'Ω';
    }
  };

  const getColor = (): string => {
    switch (metric) {
      case 'soh': return '#ef4444'; // Racing Red
      case 'capacity': return '#06b6d4'; // Cyan
      case 'voltage': return '#3b82f6'; // Cobalt Blue
      case 'temperature': return '#f59e0b'; // Amber
      case 'impedance': return '#a855f7'; // Purple
    }
  };

  const values = cycles.map(getVal);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  // Padding domain bounds for visual elegance
  const yPadding = (maxVal - minVal) * 0.1 || 1;
  const yMin = Math.max(0, metric === 'soh' ? Math.min(60, minVal - 5) : minVal - yPadding);
  const yMax = metric === 'soh' ? 102 : maxVal + yPadding;

  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 34;

  const svgWidth = 680;
  const svgHeight = height;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (cycles.length - 1 || 1)) * plotWidth;
  const getY = (val: number) => paddingTop + plotHeight - ((val - yMin) / (yMax - yMin || 1)) * plotHeight;

  // Path generator
  const points = cycles.map((c, i) => `${getX(i)},${getY(getVal(c))}`).join(' ');
  const areaPoints = `${getX(0)},${paddingTop + plotHeight} ` + points + ` ${getX(cycles.length - 1)},${paddingTop + plotHeight}`;

  // Warranty 70% threshold line (only if SOH metric)
  const warrantyY = getY(70);

  const activeIdx = hoveredIndex !== null ? hoveredIndex : (highlightCycle ? cycles.findIndex(c => c.cycle === highlightCycle) : cycles.length - 1);
  const activeCycle = cycles[activeIdx >= 0 ? activeIdx : cycles.length - 1];

  return (
    <div className="relative w-full bg-[#0d1017] p-4 rounded-xl border border-neutral-800/80">
      {/* Top Chart Header HUD */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor() }}></span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            {metric.toUpperCase()} TELEMETRY CURVE
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            ({cycles.length} CYCLES)
          </span>
          {metric === 'soh' && showBaselineComparison && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 ml-2 border-l border-neutral-700 pl-2">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
              Baseline Slope
            </span>
          )}
        </div>

        {activeCycle && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-neutral-400">CYCLE <span className="text-white font-bold">{activeCycle.cycle}</span></span>
            <span className="text-neutral-400">VALUE: <span className="font-bold text-white tabular-nums" style={{ color: getColor() }}>{getVal(activeCycle).toFixed(2)} {getUnit()}</span></span>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${filterId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getColor()} stopOpacity="0.25" />
              <stop offset="100%" stopColor={getColor()} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = yMin + pct * (yMax - yMin);
            const y = paddingTop + plotHeight - pct * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#1c2333"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val.toFixed(metric === 'impedance' ? 3 : (metric === 'voltage' ? 2 : 1))}
                </text>
              </g>
            );
          })}

          {/* Warranty 70% threshold annotation for SOH */}
          {metric === 'soh' && showWarrantyLine && yMin <= 70 && yMax >= 70 && (
            <g>
              <line
                x1={paddingLeft}
                y1={warrantyY}
                x2={svgWidth - paddingRight}
                y2={warrantyY}
                stroke="#dc2626"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - paddingRight - 4}
                y={warrantyY - 5}
                textAnchor="end"
                fill="#ef4444"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                70% WARRANTY LIMIT
              </text>
            </g>
          )}

          {/* Shaded Area */}
          <polygon
            points={areaPoints}
            fill={`url(#grad-${filterId})`}
          />

          {/* Baseline Reference Curve (Nominal Expected Decay) */}
          {metric === 'soh' && showBaselineComparison && baselineCurve && (
            <polyline
              fill="none"
              stroke="#64748b"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              strokeLinecap="round"
              points={baselineCurve.map((bc, i) => `${getX(i)},${getY(bc.baselineSoh)}`).join(' ')}
            />
          )}

          {/* Metric Telemetry Line */}
          <polyline
            fill="none"
            stroke={getColor()}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Crosshair & Tooltip Point */}
          {activeCycle && (
            <g>
              {/* Vertical crosshair hairline */}
              <line
                x1={getX(activeIdx)}
                y1={paddingTop}
                x2={getX(activeIdx)}
                y2={paddingTop + plotHeight}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Data point circle */}
              <circle
                cx={getX(activeIdx)}
                cy={getY(getVal(activeCycle))}
                r="5"
                fill="#0a0d14"
                stroke={getColor()}
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Invisible interactive hover rects */}
          {cycles.map((c, i) => {
            const x = getX(i) - (plotWidth / cycles.length) / 2;
            const width = plotWidth / cycles.length;
            return (
              <rect
                key={c.cycle}
                x={x}
                y={paddingTop}
                width={Math.max(6, width)}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  if (onSelectCycle) onSelectCycle(c.cycle);
                }}
              />
            );
          })}

          {/* X Axis Labels */}
          <g>
            <text
              x={paddingLeft}
              y={svgHeight - 10}
              textAnchor="start"
              fill="#64748b"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              Cycle {cycles[0].cycle}
            </text>
            <text
              x={svgWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              Cycle Progression →
            </text>
            <text
              x={svgWidth - paddingRight}
              y={svgHeight - 10}
              textAnchor="end"
              fill="#64748b"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              Cycle {cycles[cycles.length - 1].cycle}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
