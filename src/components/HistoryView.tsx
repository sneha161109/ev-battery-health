import React, { useState, useMemo } from 'react';
import { BatteryProfile } from '../types/battery';
import { TelemetryChart } from './TelemetryChart';
import { Activity, Thermometer, Zap, Gauge, Filter, Info } from 'lucide-react';

interface HistoryViewProps {
  profiles: BatteryProfile[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
}) => {
  const profile = profiles.find(p => p.id === selectedProfileId) || profiles[0];
  const [activeMetric, setActiveMetric] = useState<'soh' | 'capacity' | 'voltage' | 'temperature' | 'impedance'>('soh');
  const [cycleRange, setCycleRange] = useState<[number, number]>([1, profile.cyclesRecorded]);
  const [highlightedCycle, setHighlightedCycle] = useState<number | undefined>(undefined);
  const [tablePage, setTablePage] = useState<number>(1);
  const rowsPerPage = 12;

  // Filter cycles based on range
  const filteredCycles = useMemo(() => {
    return profile.cycles.filter(c => c.cycle >= cycleRange[0] && c.cycle <= cycleRange[1]);
  }, [profile.cycles, cycleRange]);

  // Paginated table rows
  const paginatedCycles = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredCycles.slice(start, start + rowsPerPage);
  }, [filteredCycles, tablePage]);

  const totalPages = Math.ceil(filteredCycles.length / rowsPerPage) || 1;

  // Explanatory copy per metric in plain language
  const metricExplanations: Record<string, { title: string; summary: string; technical: string }> = {
    soh: {
      title: 'Battery Health Over Time',
      summary: 'Shows what percentage of your original factory energy capacity remains as miles and charge cycles accumulate. A gradual, gentle slope is completely normal.',
      technical: 'Lithium ions gradually bind to protective interface layers on the battery electrodes over years of usage, slowly reducing active storage capacity.'
    },
    capacity: {
      title: 'Usable Driving Energy',
      summary: `Displays the exact usable energy (${profile.capacityUnit}) delivered on a full charge. As this slowly declines, your maximum driving range between charges decreases proportionally.`,
      technical: 'As internal resistance increases with age, cells reach lower voltage limits slightly earlier, trimming delivered kWh.'
    },
    voltage: {
      title: 'Voltage Power Delivery',
      summary: 'Measures electrical push. A healthy battery maintains high, steady voltage when overtaking, merging onto highways, or climbing steep hills.',
      technical: 'Aged cells experience slight voltage drop under peak acceleration due to internal impedance.'
    },
    temperature: {
      title: 'Operating Temperature Range',
      summary: 'Monitors battery heat during driving. Older cells naturally generate a little more heat because electrical energy encounters slightly more resistance.',
      technical: 'Internal electrical friction converts a small fraction of current into heat during aggressive driving or fast charging.'
    },
    impedance: {
      title: 'Internal Electrical Resistance',
      summary: 'Measures internal friction inside the cells. Lower resistance allows faster charging, higher motor efficiency, and cooler operation.',
      technical: 'Microscopic chemical layers gradually thicken across electrode surfaces over hundreds of cycles, creating mild resistance.'
    }
  };

  const currentExplanation = metricExplanations[activeMetric];

  return (
    <div className="space-y-6">
      {/* Target Selector & Cycle Range Filter Strip */}
      <div className="bg-[#0f131c] p-4 rounded-xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-neutral-400">LIFETIME BATTERY HISTORY</span>
          <h1 className="text-lg font-bold text-white tracking-tight">
            {profile.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="history-profile-select" className="sr-only">Select Battery</label>
          <select
            id="history-profile-select"
            value={selectedProfileId}
            onChange={(e) => {
              onSelectProfile(e.target.value);
              const p = profiles.find(item => item.id === e.target.value);
              if (p) {
                setCycleRange([1, p.cyclesRecorded]);
                setTablePage(1);
              }
            }}
            className="bg-[#151a26] text-white text-xs font-mono border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-red-500 cursor-pointer"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cyclesRecorded} cycles)
              </option>
            ))}
          </select>

          {/* Cycle filter slider / indicator */}
          <div className="flex items-center gap-2 bg-[#151a26] px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">Charges:</span>
            <span className="text-white font-bold">#{cycleRange[0]} – #{cycleRange[1]}</span>
            <button
              onClick={() => {
                setCycleRange([1, profile.cyclesRecorded]);
                setTablePage(1);
              }}
              className="text-[11px] text-red-400 hover:text-red-300 ml-1 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveMetric('soh')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeMetric === 'soh' 
              ? 'bg-red-600 text-white shadow-md shadow-red-950/40' 
              : 'bg-[#0f131c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Battery Health (%)</span>
        </button>

        <button
          onClick={() => setActiveMetric('capacity')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeMetric === 'capacity' 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40' 
              : 'bg-[#0f131c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Available Energy ({profile.capacityUnit})</span>
        </button>

        <button
          onClick={() => setActiveMetric('voltage')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeMetric === 'voltage' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40' 
              : 'bg-[#0f131c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Voltage Strength (V)</span>
        </button>

        <button
          onClick={() => setActiveMetric('temperature')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeMetric === 'temperature' 
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40' 
              : 'bg-[#0f131c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Operating Temp (°C)</span>
        </button>

        <button
          onClick={() => setActiveMetric('impedance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeMetric === 'impedance' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40' 
              : 'bg-[#0f131c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Internal Resistance (Ω)</span>
        </button>
      </div>

      {/* Primary Telemetry Chart */}
      <TelemetryChart
        cycles={filteredCycles}
        metric={activeMetric}
        capacityUnit={profile.capacityUnit}
        height={320}
        highlightCycle={highlightedCycle}
        onSelectCycle={(c) => setHighlightedCycle(c)}
      />

      {/* Plain Language Metric Interpretation Card */}
      <div className="bg-[#0f131c] p-5 rounded-xl border border-neutral-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-red-400 font-bold">
          <Info className="w-4 h-4" />
          <span>What this chart means for your daily driving</span>
        </div>
        <h3 className="text-base font-bold text-white">
          {currentExplanation.title}
        </h3>
        <p className="text-sm text-neutral-200 leading-relaxed">
          {currentExplanation.summary}
        </p>
        <p className="text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800/60 leading-relaxed">
          <strong className="text-neutral-300">BEHIND THE SCENES:</strong> {currentExplanation.technical}
        </p>
      </div>

      {/* Cycle-by-Cycle Telemetry Data Table */}
      <div className="bg-[#0f131c] rounded-xl border border-neutral-800/80 overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Charge-by-Charge History Table
            </h3>
            <p className="text-xs text-neutral-400">
              Showing {filteredCycles.length} recorded cycles in selected range (hover or click to view details)
            </p>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-400">
              Page {tablePage} of {totalPages}
            </span>
            <button
              disabled={tablePage <= 1}
              onClick={() => setTablePage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-[#151a26] text-white disabled:text-neutral-600 rounded border border-neutral-800 disabled:border-neutral-900 cursor-pointer"
            >
              Prev
            </button>
            <button
              disabled={tablePage >= totalPages}
              onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-[#151a26] text-white disabled:text-neutral-600 rounded border border-neutral-800 disabled:border-neutral-900 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[11px]">
                <th className="py-2.5 px-3">Charge #</th>
                <th className="py-2.5 px-3">Energy ({profile.capacityUnit})</th>
                <th className="py-2.5 px-3">Health (%)</th>
                <th className="py-2.5 px-3">Voltage (V)</th>
                <th className="py-2.5 px-3">Discharge (A)</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Duration (sec)</th>
                <th className="py-2.5 px-3">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {paginatedCycles.map(cycle => (
                <tr 
                  key={cycle.cycle}
                  onMouseEnter={() => setHighlightedCycle(cycle.cycle)}
                  className={`hover:bg-[#161d2d] transition-colors cursor-pointer ${
                    highlightedCycle === cycle.cycle ? 'bg-[#1b2336]' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-white">#{cycle.cycle}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{cycle.capacity.toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-bold ${
                      cycle.soh >= 80 ? 'text-emerald-400' : (cycle.soh >= 70 ? 'text-amber-400' : 'text-red-400')
                    }`}>
                      {cycle.soh.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-300">{cycle.voltage_measured.toFixed(3)}</td>
                  <td className="py-2.5 px-3 text-neutral-400">{cycle.current_measured.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-amber-300">{cycle.temperature_measured.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-neutral-400">{cycle.discharge_duration}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      cycle.soh >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : (cycle.soh >= 70 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-red-950 text-red-400 border border-red-800')
                    }`}>
                      {cycle.soh >= 80 ? 'Good' : (cycle.soh >= 70 ? 'Fair' : 'Aged')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
