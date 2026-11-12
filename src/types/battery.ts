/**
 * EV Battery Telemetry & State-of-Health (SOH) Analytics Types
 */

export interface TelemetryCycle {
  cycle: number;
  capacity: number; // in Ah
  soh: number; // in %
  voltage_measured: number; // terminal voltage in V
  current_measured: number; // discharge current in A
  temperature_measured: number; // peak/avg temperature in °C
  discharge_duration: number; // duration in seconds
  internal_impedance?: number; // in Ohms
  energy_output?: number; // in Wh
}

export type BatteryHealthStatus = 'OPTIMAL' | 'GOOD' | 'FAIR' | 'DEGRADED' | 'CRITICAL';

export interface BatteryProfile {
  id: string;
  name: string;
  type: 'laboratory_nasa' | 'vehicle_pack';
  cellModel: string;
  nominalCapacity: number; // in Ah or kWh
  capacityUnit: 'Ah' | 'kWh';
  nominalVoltage: number; // in V
  cyclesRecorded: number;
  chemistry: 'NMC' | 'LCA' | 'LFP' | 'LCO';
  description: string;
  initialCapacity: number;
  currentCapacity: number;
  currentSOH: number;
  currentStatus: BatteryHealthStatus;
  cycles: TelemetryCycle[];
  isSynthetic?: boolean;
}

export interface MLModelEvaluation {
  modelName: string;
  mae: number;
  rmse: number;
  r2: number;
  maxError: number;
  trainingTimeMs: number;
  description: string;
  featuresUsed: string[];
}

export interface LoboValidationResult {
  testBatteryId: string;
  trainBatteries: string[];
  mae: number;
  rmse: number;
  r2: number;
}

export interface ShapValueItem {
  feature: string;
  displayName: string;
  value: number;
  unit: string;
  shapImpact: number; // positive increases predicted SOH, negative decreases
  description: string;
}

export interface PredictionResult {
  predictedSoh: number;
  predictedCapacity: number;
  status: BatteryHealthStatus;
  confidence: number;
  cycleCount: number;
  capacityLost: number;
  capacityLostPercent: number;
  shapBreakdown: ShapValueItem[];
  modelUsed: string;
  timestamp: string;
}

export interface ValidationError {
  row?: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  rowCount: number;
  validCycles: TelemetryCycle[];
  headersFound: string[];
}

export interface ActionRecommendation {
  id: string;
  category: 'charging' | 'temperature' | 'warranty' | 'driving' | 'degradation_alert';
  title: string;
  priority: 'high' | 'medium' | 'info';
  action: string;
  rationale: string;
}

export type DegradationWarningLevel = 'NOMINAL' | 'ELEVATED' | 'CRITICAL_ACCELERATION';

export interface DegradationRateAnalysis {
  actualRatePerCycle: number; // in % SOH per cycle
  actualRatePer100Cycles: number; // in % SOH per 100 cycles
  baselineThresholdRatePerCycle: number; // threshold rate (% SOH per cycle)
  recentRatePerCycle: number; // rate in recent 25 cycles (% SOH per cycle)
  accelerationRatio: number; // actual / baseline
  isAccelerated: boolean;
  warningLevel: DegradationWarningLevel;
  kneePointDetected: boolean;
  projectedRemainingCyclesToWarranty: number;
  excessCapacityLossPercent: number;
  message: string;
}

