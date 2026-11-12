import { TelemetryCycle, CsvValidationResult, ValidationError } from '../types/battery';
import { CSV_TEMPLATE_DOCUMENTATION } from '../data/sample_csvs';

/**
 * Validates and parses uploaded CSV battery telemetry data.
 * Produces structured, human-understandable error messages per row and column.
 */
export function validateBatteryCsv(csvText: string): CsvValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const validCycles: TelemetryCycle[] = [];
  
  if (!csvText || !csvText.trim()) {
    return {
      isValid: false,
      errors: [{ message: 'Uploaded file is completely empty. Please select a valid CSV telemetry file.', severity: 'error' }],
      warnings: [],
      rowCount: 0,
      validCycles: [],
      headersFound: []
    };
  }
  
  const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return {
      isValid: false,
      errors: [{ message: 'CSV file contains only a header or single line. At least one row of measurement data is required.', severity: 'error' }],
      warnings: [],
      rowCount: 0,
      validCycles: [],
      headersFound: []
    };
  }
  
  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  
  const requiredHeaders = CSV_TEMPLATE_DOCUMENTATION.requiredHeaders;
  const missingHeaders = requiredHeaders.filter(req => !headers.includes(req));
  
  if (missingHeaders.length > 0) {
    errors.push({
      message: `Missing required column(s): ${missingHeaders.join(', ')}. Found columns: [${headers.join(', ')}]. Download our sample template for the standard layout.`,
      severity: 'error'
    });
    return {
      isValid: false,
      errors,
      warnings,
      rowCount: lines.length - 1,
      validCycles: [],
      headersFound: headers
    };
  }
  
  const cycleIdx = headers.indexOf('cycle');
  const voltIdx = headers.indexOf('voltage_measured');
  const currIdx = headers.indexOf('current_measured');
  const tempIdx = headers.indexOf('temperature_measured');
  const durIdx = headers.indexOf('discharge_duration');
  const impIdx = headers.indexOf('internal_impedance');
  const capIdx = headers.indexOf('capacity');
  
  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-based line number in file
    const rawCols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    
    if (rawCols.length < headers.length) {
      errors.push({
        row: rowNum,
        message: `Row ${rowNum} has ${rawCols.length} columns, but header expects ${headers.length}. Missing values detected.`,
        severity: 'error'
      });
      continue;
    }
    
    // Check cycle
    const cycleVal = Number(rawCols[cycleIdx]);
    if (isNaN(cycleVal) || !Number.isInteger(cycleVal) || cycleVal < 1) {
      errors.push({
        row: rowNum,
        column: 'cycle',
        message: `Row ${rowNum}: 'cycle' must be a positive integer (received "${rawCols[cycleIdx]}").`,
        severity: 'error'
      });
      continue;
    }
    
    // Check voltage
    const voltVal = Number(rawCols[voltIdx]);
    if (isNaN(voltVal)) {
      errors.push({
        row: rowNum,
        column: 'voltage_measured',
        message: `Row ${rowNum}: 'voltage_measured' is not a valid number (received "${rawCols[voltIdx]}").`,
        severity: 'error'
      });
      continue;
    }
    if (voltVal < 2.0 || voltVal > 5.0) {
      errors.push({
        row: rowNum,
        column: 'voltage_measured',
        message: `Row ${rowNum}: 'voltage_measured' (${voltVal}V) is outside plausible lithium-ion cell bounds (2.0V – 5.0V).`,
        severity: 'error'
      });
      continue;
    }
    
    // Check current
    const currVal = Number(rawCols[currIdx]);
    if (isNaN(currVal) || currVal <= 0) {
      errors.push({
        row: rowNum,
        column: 'current_measured',
        message: `Row ${rowNum}: 'current_measured' must be a positive discharge current in Amperes (received "${rawCols[currIdx]}").`,
        severity: 'error'
      });
      continue;
    }
    
    // Check temperature
    const tempVal = Number(rawCols[tempIdx]);
    if (isNaN(tempVal)) {
      errors.push({
        row: rowNum,
        column: 'temperature_measured',
        message: `Row ${rowNum}: 'temperature_measured' is not a valid number (received "${rawCols[tempIdx]}").`,
        severity: 'error'
      });
      continue;
    }
    if (tempVal < -30 || tempVal > 90) {
      errors.push({
        row: rowNum,
        column: 'temperature_measured',
        message: `Row ${rowNum}: 'temperature_measured' (${tempVal}°C) is outside realistic operational bounds (-30°C to 90°C).`,
        severity: 'error'
      });
      continue;
    }
    
    // Check discharge duration
    const durVal = Number(rawCols[durIdx]);
    if (isNaN(durVal) || durVal <= 0) {
      errors.push({
        row: rowNum,
        column: 'discharge_duration',
        message: `Row ${rowNum}: 'discharge_duration' must be positive seconds to cutoff (received "${rawCols[durIdx]}").`,
        severity: 'error'
      });
      continue;
    }
    
    // Optional impedance
    let impVal: number | undefined = undefined;
    if (impIdx !== -1 && rawCols[impIdx]) {
      const parsedImp = Number(rawCols[impIdx]);
      if (!isNaN(parsedImp)) impVal = parsedImp;
    }
    
    // Optional capacity or calculated proxy
    let capacityVal = 0;
    if (capIdx !== -1 && rawCols[capIdx] && !isNaN(Number(rawCols[capIdx]))) {
      capacityVal = Number(rawCols[capIdx]);
    } else {
      capacityVal = Number(((durVal / 3600) * currVal).toFixed(3));
    }
    
    // SOH reference baseline
    const nominalCap = 2.0;
    const sohVal = Number(Math.min(100, Math.max(10, (capacityVal / nominalCap) * 100)).toFixed(2));
    
    validCycles.push({
      cycle: cycleVal,
      capacity: capacityVal,
      soh: sohVal,
      voltage_measured: voltVal,
      current_measured: currVal,
      temperature_measured: tempVal,
      discharge_duration: durVal,
      internal_impedance: impVal,
      energy_output: Number((voltVal * capacityVal).toFixed(3))
    });
  }
  
  return {
    isValid: errors.length === 0 && validCycles.length > 0,
    errors,
    warnings,
    rowCount: lines.length - 1,
    validCycles,
    headersFound: headers
  };
}
