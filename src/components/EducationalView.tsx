import React, { useState } from 'react';
import { 
  HelpCircle, 
  BatteryMedium, 
  Thermometer, 
  AlertTriangle, 
  Zap, 
  Layers, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Clock
} from 'lucide-react';

export const EducationalView: React.FC = () => {
  // Interactive SOH vs SOC demonstration states
  const [simSoh, setSimSoh] = useState<number>(82);
  const [simSoc, setSimSoc] = useState<number>(65);

  // Expandable cards state
  const [expandedCard, setExpandedCard] = useState<string | null>('soh-vs-soc');

  const toggleCard = (id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  };

  // Fuel tank analogy calculation
  const originalCapacity = 80; // kWh
  const currentTotalCapacity = (originalCapacity * (simSoh / 100)); // kWh
  const currentStoredEnergy = (currentTotalCapacity * (simSoc / 100)); // kWh

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500 font-bold mb-1">
          <HelpCircle className="w-4 h-4" />
          <span>EV BATTERY 101 · SIMPLE GUIDE FOR OWNERS</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Understand Your Battery in Plain English
        </h1>
        <p className="text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
          Clear explanations, intuitive analogies, and simple daily habits to help your electric vehicle battery last for hundreds of thousands of miles.
        </p>
      </div>

      {/* 4 GOLDEN HABITS CALLOUT */}
      <div className="bg-gradient-to-r from-[#121824] to-[#161d2d] p-5 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>4 Golden Habits to Keep Your Battery Healthy</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0a0d14]/70 p-3 rounded-lg border border-neutral-800/80">
            <strong className="text-white block font-mono mb-1">1. Daily 80% Limit</strong>
            <p className="text-neutral-300 leading-normal">
              For everyday driving, set your vehicle's charge limit to 80%. Save 100% full charges for long road trips.
            </p>
          </div>
          <div className="bg-[#0a0d14]/70 p-3 rounded-lg border border-neutral-800/80">
            <strong className="text-white block font-mono mb-1">2. Avoid Heat Soak</strong>
            <p className="text-neutral-300 leading-normal">
              Park in shade or garages on scorching summer days. Heat is the #1 accelerator of chemical aging.
            </p>
          </div>
          <div className="bg-[#0a0d14]/70 p-3 rounded-lg border border-neutral-800/80">
            <strong className="text-white block font-mono mb-1">3. Pre-Heat in Winter</strong>
            <p className="text-neutral-300 leading-normal">
              Turn on cabin preconditioning 15 minutes before leaving while plugged into wall power to warm cold cells.
            </p>
          </div>
          <div className="bg-[#0a0d14]/70 p-3 rounded-lg border border-neutral-800/80">
            <strong className="text-white block font-mono mb-1">4. AC Over DC Fast</strong>
            <p className="text-neutral-300 leading-normal">
              Use standard Level 2 AC charging at home or work for everyday needs; reserve DC fast chargers for highway travel.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE COMPARISON: SOH VS SOC SIMULATOR */}
      <div className="bg-[#0f131c] p-6 rounded-xl border border-neutral-800/80 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight font-mono">
            Interactive Example: Battery Health (SOH) vs Current Charge (SOC)
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Think of <strong>State of Health (SOH)</strong> as the permanent size of your coffee mug, and <strong>State of Charge (SOC)</strong> as how much coffee is in it right now.
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#141924] p-5 rounded-xl border border-neutral-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white">Battery Health (SOH) – Mug Size:</span>
              <span className="text-red-400 font-bold text-sm tabular-nums">{simSoh}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={simSoh}
              onChange={(e) => setSimSoh(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <p className="text-[11px] text-neutral-400">
              The permanent physical storage size remaining in the battery after years of driving.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white">Current Charge (SOC) – Liquid Level:</span>
              <span className="text-cyan-400 font-bold text-sm tabular-nums">{simSoc}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simSoc}
              onChange={(e) => setSimSoc(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-neutral-400">
              How full the battery is right now after your latest plug-in charge.
            </p>
          </div>
        </div>

        {/* Visual Dual-Tank Graphic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Visual Battery Tank Container */}
          <div className="flex flex-col items-center p-4 bg-[#0a0d14] rounded-xl border border-neutral-800">
            <span className="text-xs font-mono uppercase text-neutral-400 mb-3">
              Energy Container Analogy
            </span>

            {/* Container representing original 100% capacity */}
            <div className="relative w-44 h-56 bg-[#161d2d] rounded-lg border-2 border-dashed border-neutral-700 flex flex-col justify-end p-1.5 overflow-hidden">
              {/* Lost capacity top shade */}
              <div 
                className="absolute top-0 left-0 right-0 bg-red-950/40 border-b border-red-800/60 flex items-center justify-center text-[10px] font-mono text-red-400"
                style={{ height: `${100 - simSoh}%` }}
              >
                {100 - simSoh > 8 && `Lost Capacity (${100 - simSoh}%)`}
              </div>

              {/* Current Retained Tank (SOH) */}
              <div 
                className="w-full bg-[#1b253b] rounded border border-neutral-600 flex flex-col justify-end p-1 overflow-hidden"
                style={{ height: `${simSoh}%` }}
              >
                {/* Current Charged Energy (SOC) */}
                <div 
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-sm transition-all duration-300 flex items-center justify-center text-[11px] font-mono font-bold text-slate-950"
                  style={{ height: `${simSoc}%` }}
                >
                  {simSoc > 15 && `${simSoc}% Full`}
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-xs font-mono text-neutral-300 space-y-0.5">
              <p>Original Brand-New Size: <strong className="text-white">{originalCapacity} kWh</strong></p>
              <p>Maximum Retained Size: <strong className="text-white">{currentTotalCapacity.toFixed(1)} kWh</strong></p>
              <p>Ready to Drive Right Now: <strong className="text-cyan-400">{currentStoredEnergy.toFixed(1)} kWh</strong></p>
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <span className="text-xs font-bold text-white uppercase block mb-1 font-mono">
                The Golden Rule:
              </span>
              <p className="text-neutral-200">
                <strong>SOH = {simSoh}%</strong> means your battery can hold approximately {simSoh}% as much energy as when the car was brand new. It does <em>not</em> mean your battery is currently charged to {simSoh}%.
              </p>
              <p className="text-neutral-200 mt-2">
                Even with an older battery at {simSoh}% health, you can still plug in and charge it all the way to <strong>100% full</strong>—you'll just get {simSoh}% of your car's original driving range on that full charge.
              </p>
            </div>

            <div className="p-4 bg-red-950/20 rounded-xl border border-red-900/40">
              <span className="text-xs font-bold text-red-400 uppercase block mb-1 font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Important: Aging is Normal, Not Dangerous
              </span>
              <p className="text-neutral-300">
                A battery with reduced health (like 78% or 82%) is <strong>simply older, not broken or dangerous</strong>. Capacity loss is like tread wear on tires. Actual safety issues (like short circuits or cell defects) are detected by insulation monitors and heat sensors—<strong>never assume a battery is unsafe just because of health score</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDABLE EDUCATIONAL MODULES */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-tight font-mono">
          Core Battery Principles & Degradation Mechanisms
        </h2>

        {/* Module 1: Battery Capacity */}
        <div className="bg-[#0f131c] rounded-xl border border-neutral-800 overflow-hidden">
          <button
            onClick={() => toggleCard('capacity')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-[#141924] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <BatteryMedium className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Battery Capacity: Nominal vs Usable (kWh and Ah)
                </h3>
                <p className="text-xs text-neutral-400">
                  How energy is quantified and why EV manufacturers hide battery buffers.
                </p>
              </div>
            </div>
            {expandedCard === 'capacity' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {expandedCard === 'capacity' && (
            <div className="p-5 pt-0 text-xs text-neutral-300 space-y-3 border-t border-neutral-800/60 mt-2">
              <p>
                <strong>Gross (Nominal) Capacity:</strong> The total physical storage capacity of all cells combined. For example, a vehicle may have an 82 kWh gross pack.
              </p>
              <p>
                <strong>Net (Usable) Capacity:</strong> The portion accessible to the driver (e.g., 77 kWh). The remaining 5 kWh is partitioned into top and bottom "buffers" reserved by the Battery Management System (BMS) to prevent over-charging and deep over-discharge.
              </p>
              <p>
                <strong>Ah vs kWh:</strong> Ampere-hours (Ah) measure electrical charge quantity, while Kilowatt-hours (kWh) measure total energy delivered (Charge × Voltage). Laboratory cell datasets are recorded in Ah; complete EV packs are rated in kWh.
              </p>
            </div>
          )}
        </div>

        {/* Module 2: Charging Cycles */}
        <div className="bg-[#0f131c] rounded-xl border border-neutral-800 overflow-hidden">
          <button
            onClick={() => toggleCard('cycles')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-[#141924] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Equivalent Full Cycles & Depth of Discharge (DoD)
                </h3>
                <p className="text-xs text-neutral-400">
                  Why plugging in daily does not count as a full cycle.
                </p>
              </div>
            </div>
            {expandedCard === 'cycles' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {expandedCard === 'cycles' && (
            <div className="p-5 pt-0 text-xs text-neutral-300 space-y-3 border-t border-neutral-800/60 mt-2">
              <p>
                A <strong>Full Equivalent Cycle (EFC)</strong> equals 100% of cumulative battery throughput. Discharging from 80% to 30% (50% used) twice equals exactly ONE full cycle, not two.
              </p>
              <p>
                <strong>Shallow Cycles Last Longer:</strong> Lithium-ion cells exhibit non-linear cycle life. A cell subjected to 0% → 100% deep cycles may last ~800–1,200 cycles before 80% SOH. The same cell cycled between 30% → 70% can achieve 3,000–5,000+ shallow cycles.
              </p>
            </div>
          )}
        </div>

        {/* Module 3: Temperature Effects */}
        <div className="bg-[#0f131c] rounded-xl border border-neutral-800 overflow-hidden">
          <button
            onClick={() => toggleCard('temperature')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-[#141924] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Temperature: The Goldilocks Window (20°C – 25°C)
                </h3>
                <p className="text-xs text-neutral-400">
                  How extreme heat accelerates aging and sub-zero cold throttles charging.
                </p>
              </div>
            </div>
            {expandedCard === 'temperature' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {expandedCard === 'temperature' && (
            <div className="p-5 pt-0 text-xs text-neutral-300 space-y-3 border-t border-neutral-800/60 mt-2">
              <p>
                <strong>Extreme Heat (&gt;35°C):</strong> Heat exponentially accelerates parasitic side reactions between the liquid electrolyte and the active electrodes. This grows the resistive SEI layer and permanently consumes active lithium.
              </p>
              <p>
                <strong>Sub-Zero Cold (&lt;0°C):</strong> Cold slows lithium ion diffusion through the electrolyte. If forced to charge rapidly in freezing temperatures without preheating, lithium ions cannot intercalate into the graphite anode quickly enough and deposit as metallic lithium (lithium plating), causing permanent capacity loss and short circuit risks.
              </p>
            </div>
          )}
        </div>

        {/* Module 4: Battery Warning Signs */}
        <div className="bg-[#0f131c] rounded-xl border border-neutral-800 overflow-hidden">
          <button
            onClick={() => toggleCard('warnings')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-[#141924] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Genuine Warning Signs vs Normal Aging
                </h3>
                <p className="text-xs text-neutral-400">
                  When to contact your dealer and when not to panic.
                </p>
              </div>
            </div>
            {expandedCard === 'warnings' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {expandedCard === 'warnings' && (
            <div className="p-5 pt-0 text-xs text-neutral-300 space-y-3 border-t border-neutral-800/60 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg space-y-1.5">
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Normal Battery Behavior:
                  </span>
                  <ul className="list-disc list-inside text-neutral-300 space-y-1 text-[11px]">
                    <li>2-3% capacity drop during the first year (settling phase).</li>
                    <li>Reduced winter driving range due to cabin heating and air density.</li>
                    <li>Gradual 1-2% annual degradation over years 2 through 8.</li>
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg space-y-1.5">
                  <span className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Actual Warning Signs:
                  </span>
                  <ul className="list-disc list-inside text-neutral-300 space-y-1 text-[11px]">
                    <li>Sudden drop of 10%+ SOH within a matter of weeks.</li>
                    <li>Vehicle shuts down while displaying 15-20% remaining SOC.</li>
                    <li>Persistent "Check EV System" or high-voltage isolation warnings.</li>
                    <li>Excessive fan noise or thermal warnings during mild ambient charging.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
