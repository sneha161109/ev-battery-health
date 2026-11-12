import { TelemetryCycle } from '../types/battery';

export interface EngineeredFeatures {
  cycle: number;
  discharge_duration: number;
  voltage_drop_factor: number;
  temp_delta: number;
  impedance: number;
  coulombic_decay_proxy: number;
}

/**
 * Extracts normalized electrochemical feature vectors from raw cycle telemetry.
 * Avoids data leakage by using only past and current cycle measurements.
 */
export function extractFeatures(cycle: TelemetryCycle, nominalCapacity: number = 2.0): EngineeredFeatures {
  // Reference initial conditions
  const baselineTemp = 24.0; // °C
  const baselineVoltage = 3.70; // V
  const baselineDuration = (nominalCapacity / Math.max(0.1, cycle.current_measured)) * 3600; // Expected seconds
  
  const tempDelta = Math.max(0, cycle.temperature_measured - baselineTemp);
  const voltageDropFactor = Math.max(0, (baselineVoltage - cycle.voltage_measured) / baselineVoltage);
  const durationRatio = cycle.discharge_duration / baselineDuration;
  const impedance = cycle.internal_impedance ?? (0.075 + (cycle.cycle * 0.0008));
  
  return {
    cycle: cycle.cycle,
    discharge_duration: cycle.discharge_duration,
    voltage_drop_factor: Number(voltageDropFactor.toFixed(4)),
    temp_delta: Number(tempDelta.toFixed(2)),
    impedance: Number(impedance.toFixed(4)),
    coulombic_decay_proxy: Number(durationRatio.toFixed(4)),
  };
}
