import { BatteryProfile, DegradationRateAnalysis, DegradationWarningLevel } from '../types/battery';

/**
 * Default baseline degradation rate thresholds (% SOH loss per cycle).
 * Calibrated against standard battery aging literature and empirical testing benchmarks.
 */
export const DEFAULT_BASELINE_RATES = {
  laboratory_nasa: 0.17, // ~17% SOH loss per 100 cycles in 18650 LCO lab tests
  vehicle_pack: 0.045,   // ~4.5% SOH loss per 100 cycles for liquid-cooled commercial EV packs
};

/**
 * Analyzes the degradation velocity of a battery profile against a baseline rate.
 * Detects accelerated degradation, knee-point breakdown, and calculates remaining cycles to warranty.
 */
export function analyzeDegradationRate(
  profile: BatteryProfile,
  customBaselineRate?: number
): DegradationRateAnalysis {
  const cycles = profile.cycles;
  if (!cycles || cycles.length < 2) {
    return {
      actualRatePerCycle: 0,
      actualRatePer100Cycles: 0,
      baselineThresholdRatePerCycle: customBaselineRate ?? DEFAULT_BASELINE_RATES[profile.type],
      recentRatePerCycle: 0,
      accelerationRatio: 1.0,
      isAccelerated: false,
      warningLevel: 'NOMINAL',
      kneePointDetected: false,
      projectedRemainingCyclesToWarranty: 9999,
      excessCapacityLossPercent: 0,
      message: 'Insufficient cycle telemetry to assess degradation rate.'
    };
  }

  const firstCycle = cycles[0];
  const lastCycle = cycles[cycles.length - 1];
  const totalCyclesDelta = Math.max(1, lastCycle.cycle - firstCycle.cycle);
  
  // Total SOH loss
  const totalSohLost = Math.max(0, firstCycle.soh - lastCycle.soh);
  
  // Overall degradation rate (% SOH / cycle)
  const actualRatePerCycle = Number((totalSohLost / totalCyclesDelta).toFixed(4));
  const actualRatePer100Cycles = Number((actualRatePerCycle * 100).toFixed(2));

  // Baseline threshold rate
  const baselineThresholdRate = customBaselineRate !== undefined && customBaselineRate > 0
    ? customBaselineRate
    : DEFAULT_BASELINE_RATES[profile.type];

  // Calculate recent window rate (last 25 cycles or 25% of total cycles)
  const windowSize = Math.min(25, Math.floor(cycles.length / 2));
  let recentRatePerCycle = actualRatePerCycle;
  if (cycles.length > windowSize) {
    const windowStartCycle = cycles[cycles.length - 1 - windowSize];
    const windowSohLost = Math.max(0, windowStartCycle.soh - lastCycle.soh);
    const windowCyclesDelta = Math.max(1, lastCycle.cycle - windowStartCycle.cycle);
    recentRatePerCycle = Number((windowSohLost / windowCyclesDelta).toFixed(4));
  }

  // Acceleration ratio comparing actual or recent rate to the baseline
  const effectiveRate = Math.max(actualRatePerCycle, recentRatePerCycle * 0.85);
  const accelerationRatio = Number((effectiveRate / baselineThresholdRate).toFixed(2));

  // Knee-point detection: recent degradation is significantly steeper than lifetime average
  const kneePointDetected = recentRatePerCycle >= actualRatePerCycle * 1.35 && totalCyclesDelta >= 40;

  // Expected SOH under baseline rate
  const expectedSohAtCurrentCycle = Math.max(0, firstCycle.soh - (baselineThresholdRate * totalCyclesDelta));
  const excessCapacityLossPercent = Number(Math.max(0, expectedSohAtCurrentCycle - lastCycle.soh).toFixed(2));

  // Determine Warning Level
  let warningLevel: DegradationWarningLevel = 'NOMINAL';
  let isAccelerated = false;

  if (accelerationRatio >= 1.45 || (recentRatePerCycle >= baselineThresholdRate * 1.5)) {
    warningLevel = 'CRITICAL_ACCELERATION';
    isAccelerated = true;
  } else if (accelerationRatio >= 1.15 || kneePointDetected) {
    warningLevel = 'ELEVATED';
    isAccelerated = true;
  }

  // Projected cycles until 70% SOH warranty threshold
  const remainingSohTo70 = Math.max(0, lastCycle.soh - 70.0);
  const projectedRemainingCycles = effectiveRate > 0.001
    ? Math.round(remainingSohTo70 / effectiveRate)
    : 9999;

  // Formulate understandable diagnostic message
  let message = '';
  if (warningLevel === 'CRITICAL_ACCELERATION') {
    message = `ACCELERATED DEGRADATION DETECTED: Your battery is losing capacity about ${accelerationRatio}× faster than normal (${actualRatePer100Cycles}% lost every 100 full charges, vs ${(baselineThresholdRate * 100).toFixed(1)}% expected). At this pace, it could reach the 70% warranty threshold in approximately ${projectedRemainingCycles} charges. We recommend having an authorized technician check cell balance and cooling.`;
  } else if (warningLevel === 'ELEVATED') {
    message = `ELEVATED DEGRADATION RATE: Your battery is losing capacity slightly faster than average (${actualRatePer100Cycles}% every 100 charges, or ${accelerationRatio}× normal pace). ${kneePointDetected ? 'Recent cycles show a noticeable steepening.' : 'It is slightly above normal factory wear.'}`;
  } else {
    message = `NOMINAL DEGRADATION RATE: Your battery is aging normally, losing ${actualRatePer100Cycles}% capacity every 100 charges. This is well within healthy factory wear expectations (${(baselineThresholdRate * 100).toFixed(1)}%).`;
  }

  return {
    actualRatePerCycle,
    actualRatePer100Cycles,
    baselineThresholdRatePerCycle: baselineThresholdRate,
    recentRatePerCycle,
    accelerationRatio,
    isAccelerated,
    warningLevel,
    kneePointDetected,
    projectedRemainingCyclesToWarranty: projectedRemainingCycles,
    excessCapacityLossPercent,
    message
  };
}

/**
 * Computes an ideal baseline reference decay curve for chart overlay.
 */
export function getBaselineReferenceCurve(
  profile: BatteryProfile,
  baselineRatePerCycle: number
): { cycle: number; baselineSoh: number }[] {
  const initialSoh = profile.cycles[0]?.soh ?? 100;
  return profile.cycles.map(c => {
    const cycleOffset = c.cycle - profile.cycles[0].cycle;
    const baselineSoh = Number(Math.max(40, initialSoh - (baselineRatePerCycle * cycleOffset)).toFixed(2));
    return {
      cycle: c.cycle,
      baselineSoh
    };
  });
}
