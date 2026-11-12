import { BatteryHealthStatus, ActionRecommendation, DegradationRateAnalysis } from '../types/battery';

/**
 * Generates tailored, understandable recommendations for an EV owner based on current SOH and telemetry indicators.
 * Strictly adheres to safety guidelines: non-alarmist, educational, actionable, and non-prescriptive regarding safety.
 */
export function generateRecommendations(
  soh: number,
  status: BatteryHealthStatus,
  capacityLostPercent: number,
  peakTemp: number,
  cycleCount: number,
  degradationAnalysis?: DegradationRateAnalysis
): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = [];

  // Accelerated Degradation Alert
  if (degradationAnalysis && degradationAnalysis.isAccelerated) {
    recommendations.push({
      id: 'rec-degradation-alert',
      category: 'degradation_alert',
      title: degradationAnalysis.warningLevel === 'CRITICAL_ACCELERATION'
        ? 'Accelerated Degradation Alert'
        : 'Elevated Capacity Fade Rate',
      priority: 'high',
      action: `Your battery is degrading at ${degradationAnalysis.accelerationRatio}× the baseline reference rate (${degradationAnalysis.actualRatePer100Cycles}% loss per 100 cycles vs ${(degradationAnalysis.baselineThresholdRatePerCycle * 100).toFixed(1)}% expected). Avoid sustained high-current DC fast charging and check cooling airflow.`,
      rationale: degradationAnalysis.kneePointDetected
        ? 'Telemetry indicates a knee-point inflection where recent cycle wear accelerated significantly. We advise scheduling a certified BMS cell resistance diagnostic.'
        : `At this accelerated velocity, standard 70% warranty thresholds may be reached sooner than scheduled (~${degradationAnalysis.projectedRemainingCyclesToWarranty} cycles).`
    });
  }

  // Charging recommendations
  if (soh > 80) {
    recommendations.push({
      id: 'rec-charge-daily',
      category: 'charging',
      title: 'Target 80% Daily Charge Limit',
      priority: 'info',
      action: 'Set your vehicle charging target between 70% and 80% for routine daily commuting.',
      rationale: 'Holding high-nickel lithium-ion cells at 100% State of Charge (SOC) accelerates cathode oxidation and solid-electrolyte interphase (SEI) thickening. Reserving 100% charge for long road trips preserves capacity retention.'
    });
  } else if (soh > 70) {
    recommendations.push({
      id: 'rec-charge-shallow',
      category: 'charging',
      title: 'Adopt Shallow Depth-of-Discharge (DoD) Cycles',
      priority: 'medium',
      action: 'Plug in regularly and avoid letting the battery drop below 15-20% SOC before charging.',
      rationale: 'Shallow cycle depths (e.g., 30% to 70%) induce substantially less mechanical stress and micro-cracking in cathode particles than full 0% to 100% discharge sweeps.'
    });
  } else {
    recommendations.push({
      id: 'rec-charge-gentle',
      category: 'charging',
      title: 'Prioritize Level 2 AC Charging Over Ultra-Fast DC',
      priority: 'high',
      action: 'Rely on 7-11 kW Level 2 AC home or depot charging whenever practical, limiting 150kW+ DC fast charging.',
      rationale: 'High DC charging currents induce elevated localized heat and lithium concentration gradients that can stress cells with elevated internal impedance.'
    });
  }

  // Thermal management recommendations
  if (peakTemp > 38) {
    recommendations.push({
      id: 'rec-temp-high',
      category: 'temperature',
      title: 'Park in Shaded Areas & Precondition Before Departure',
      priority: 'high',
      action: 'Utilize your vehicle app to precondition the cabin and battery while still connected to grid power.',
      rationale: 'High sustained temperatures (>35°C) are the primary catalyst for parasitic chemical side-reactions in battery electrolyte. Preconditioning on grid power cools the pack before drive loads begin.'
    });
  } else {
    recommendations.push({
      id: 'rec-temp-precon',
      category: 'temperature',
      title: 'Pre-Condition Battery in Cold Weather',
      priority: 'info',
      action: 'Trigger battery pre-heating 20-30 minutes before fast charging during cold weather seasons.',
      rationale: 'Cold electrolyte increases viscosity and lithium-ion transfer resistance. Pre-warming protects the anode against lithium plating during high-current charging.'
    });
  }

  // Warranty status indicators
  if (soh <= 72) {
    recommendations.push({
      id: 'rec-warranty-audit',
      category: 'warranty',
      title: 'Schedule Manufacturer Battery Health Verification',
      priority: 'high',
      action: 'Contact your authorized EV dealership service center for an official battery capacity test under manufacturer warranty.',
      rationale: 'Most major EV manufacturers provide an 8-year / 100,000-mile warranty covering capacity loss below 70%. Laboratory model estimates serve as an early advisory indicator; only certified dealership diagnostics can initiate warranty replacement.'
    });
  } else {
    recommendations.push({
      id: 'rec-warranty-safe',
      category: 'warranty',
      title: 'Capacity Well Above Typical Warranty Threshold',
      priority: 'info',
      action: 'Your battery retention is within normal expectations for its recorded cycle life.',
      rationale: 'Industry benchmark warranties generally protect against capacity degradation exceeding 30% (below 70% SOH) within the first 8 years or 160,000 km.'
    });
  }

  // Driving & Maintenance recommendations
  recommendations.push({
    id: 'rec-bms-balance',
    category: 'driving',
    title: 'Periodic Cell Balancing (100% Calibration Session)',
    priority: 'info',
    action: 'Charge to 100% on AC once every 1–2 months and let the vehicle stay plugged in for 1–2 hours afterward.',
    rationale: 'This allows the Battery Management System (BMS) passive balancing shunt resistors to equalize minor voltage variations among individual cell bricks, giving more accurate range predictions.'
  });

  return recommendations;
}
