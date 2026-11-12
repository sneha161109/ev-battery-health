import test from 'node:test';
import assert from 'node:assert/strict';

import { extractFeatures } from '../ml/feature_engineering';
import { predictSOH, calculateMetrics, calculateSohStatus } from '../ml/models';
import { validateBatteryCsv } from '../ml/validator';
import { generateRecommendations } from '../ml/recommendations';
import { VALID_SAMPLE_CSV, INVALID_SAMPLE_CSV } from '../data/sample_csvs';
import { NASA_BATTERY_PROFILES } from '../data/nasa_battery_data';

test('Feature Engineering extracts valid normalized features', () => {
  const sampleCycle = {
    cycle: 10,
    capacity: 1.85,
    soh: 92.5,
    voltage_measured: 3.65,
    current_measured: 2.0,
    temperature_measured: 26.5,
    discharge_duration: 3330,
    internal_impedance: 0.082,
  };

  const feats = extractFeatures(sampleCycle, 2.0);
  assert.equal(feats.cycle, 10);
  assert.equal(feats.discharge_duration, 3330);
  assert.ok(feats.temp_delta >= 0, 'Temperature delta should be non-negative');
  assert.ok(feats.voltage_drop_factor >= 0, 'Voltage drop factor should be non-negative');
  assert.ok(feats.impedance > 0, 'Impedance should be positive');
});

test('ML Model predicts SOH within bounded range with SHAP breakdown', () => {
  const healthyCycle = {
    cycle: 1,
    capacity: 1.98,
    soh: 99.0,
    voltage_measured: 3.69,
    current_measured: 2.0,
    temperature_measured: 24.5,
    discharge_duration: 3500,
    internal_impedance: 0.076,
  };

  const healthyResult = predictSOH(healthyCycle, 2.0);
  assert.ok(healthyResult.predictedSoh >= 85, `Expected healthy SOH >= 85, got ${healthyResult.predictedSoh}`);
  assert.equal(healthyResult.status, 'OPTIMAL');
  assert.equal(healthyResult.shapBreakdown.length, 5);

  const agedCycle = {
    cycle: 160,
    capacity: 1.30,
    soh: 65.0,
    voltage_measured: 3.48,
    current_measured: 2.0,
    temperature_measured: 38.2,
    discharge_duration: 2340,
    internal_impedance: 0.205,
  };

  const agedResult = predictSOH(agedCycle, 2.0);
  assert.ok(agedResult.predictedSoh < healthyResult.predictedSoh, 'Aged cell should have lower SOH than fresh cell');
  assert.ok(agedResult.predictedSoh >= 25 && agedResult.predictedSoh <= 100, 'SOH should stay in reasonable bounds');
});

test('SOH status categorization works as expected', () => {
  assert.equal(calculateSohStatus(95), 'OPTIMAL');
  assert.equal(calculateSohStatus(85), 'GOOD');
  assert.equal(calculateSohStatus(75), 'FAIR');
  assert.equal(calculateSohStatus(65), 'DEGRADED');
  assert.equal(calculateSohStatus(50), 'CRITICAL');
});

test('Model metrics calculation computes accurate MAE, RMSE and R2', () => {
  const actuals = [100, 90, 80, 70];
  const predicted = [98, 91, 79, 72];
  
  const metrics = calculateMetrics(actuals, predicted);
  assert.equal(metrics.mae, 1.5);
  assert.ok(metrics.rmse > 0);
  assert.ok(metrics.r2 > 0.95);
  assert.equal(metrics.maxError, 2);
});

test('CSV Validator passes valid telemetry CSV', () => {
  const result = validateBatteryCsv(VALID_SAMPLE_CSV);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rowCount, 12);
  assert.equal(result.validCycles.length, 12);
});

test('CSV Validator catches errors on invalid CSV and empty inputs', () => {
  const emptyResult = validateBatteryCsv('');
  assert.equal(emptyResult.isValid, false);
  assert.ok(emptyResult.errors[0].message.includes('empty'));

  const invalidResult = validateBatteryCsv(INVALID_SAMPLE_CSV);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.length > 0, 'Should find multiple errors in invalid CSV');
});

import { analyzeDegradationRate, getBaselineReferenceCurve } from '../ml/degradation_warning';

test('Action recommendations generate appropriate advice for degraded cells', () => {
  const recs = generateRecommendations(68, 'DEGRADED', 32, 41, 150);
  assert.ok(recs.length >= 3);
  const warrantyRec = recs.find(r => r.category === 'warranty');
  assert.ok(warrantyRec, 'Should provide warranty recommendation for SOH <= 70%');
  assert.equal(warrantyRec?.priority, 'high');
});

test('NASA Battery datasets have consistent profiles for B0005, B0006, B0007, B0018', () => {
  assert.equal(NASA_BATTERY_PROFILES.length, 4);
  for (const prof of NASA_BATTERY_PROFILES) {
    assert.ok(prof.cycles.length > 100);
    assert.ok(prof.nominalCapacity === 2.0);
    assert.ok(prof.currentSOH < prof.cycles[0].soh, 'Battery should show degradation over cycles');
  }
});

test('Accelerated degradation analysis detects fast-degrading cell B0006', () => {
  const cellB0006 = NASA_BATTERY_PROFILES.find(p => p.id === 'nasa-b0006')!;
  assert.ok(cellB0006, 'B0006 should exist');

  const analysis = analyzeDegradationRate(cellB0006);
  assert.equal(analysis.isAccelerated, true, 'Cell B0006 should be flagged as accelerated degradation');
  assert.ok(analysis.actualRatePerCycle > 0.20, 'B0006 degradation rate should be > 0.20% per cycle');
  assert.ok(analysis.accelerationRatio > 1.3, 'B0006 acceleration ratio should exceed 1.3x baseline');
  assert.ok(analysis.warningLevel === 'CRITICAL_ACCELERATION' || analysis.warningLevel === 'ELEVATED');
  assert.ok(analysis.message.includes('ACCELERATED') || analysis.message.includes('ELEVATED'));
});

test('Accelerated degradation analysis detects nominal rate on standard retention cell', () => {
  const cellB0007 = NASA_BATTERY_PROFILES.find(p => p.id === 'nasa-b0007')!;
  assert.ok(cellB0007, 'B0007 should exist');

  const analysis = analyzeDegradationRate(cellB0007, 0.20);
  assert.equal(analysis.isAccelerated, false, 'B0007 should be nominal under 0.20% baseline rate');
  assert.equal(analysis.warningLevel, 'NOMINAL');
});

test('Custom threshold alters warning sensitivity', () => {
  const cellB0005 = NASA_BATTERY_PROFILES.find(p => p.id === 'nasa-b0005')!;
  // Very strict baseline (0.05% loss per cycle) should trigger warning
  const strictAnalysis = analyzeDegradationRate(cellB0005, 0.05);
  assert.equal(strictAnalysis.isAccelerated, true, 'Strict baseline should flag cell B0005');

  // Generous baseline (0.40% loss per cycle) should not trigger warning
  const relaxedAnalysis = analyzeDegradationRate(cellB0005, 0.40);
  assert.equal(relaxedAnalysis.isAccelerated, false, 'Relaxed baseline should not flag cell B0005');
});

test('Recommendations include accelerated degradation alert when analysis is accelerated', () => {
  const cellB0006 = NASA_BATTERY_PROFILES.find(p => p.id === 'nasa-b0006')!;
  const analysis = analyzeDegradationRate(cellB0006);
  const recs = generateRecommendations(
    cellB0006.currentSOH,
    cellB0006.currentStatus,
    41.2,
    38.5,
    168,
    analysis
  );

  const alertRec = recs.find(r => r.category === 'degradation_alert');
  assert.ok(alertRec, 'Should include degradation alert in recommendations');
  assert.equal(alertRec?.priority, 'high');
  assert.ok(alertRec?.title.includes('Accelerated') || alertRec?.title.includes('Elevated'));
});

