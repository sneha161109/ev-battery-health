/**
 * Sample CSV datasets for testing Battery Diagnostic uploads.
 * Distinctly synthetic, clearly documented with proper column schemas.
 */

export const VALID_SAMPLE_CSV = `cycle,voltage_measured,current_measured,temperature_measured,discharge_duration,internal_impedance
1,3.682,2.000,24.3,3420,0.0765
5,3.674,2.000,24.6,3395,0.0782
10,3.668,2.000,24.9,3360,0.0810
20,3.655,2.000,25.4,3310,0.0865
35,3.639,2.000,26.1,3240,0.0940
50,3.621,2.000,26.9,3160,0.1030
70,3.601,2.000,28.2,3050,0.1165
90,3.582,2.000,29.8,2940,0.1310
110,3.561,2.000,31.4,2820,0.1475
130,3.539,2.000,33.2,2700,0.1660
150,3.518,2.000,35.1,2570,0.1870
168,3.497,2.000,37.3,2430,0.2090`;

export const INVALID_SAMPLE_CSV = `cycle,voltage_measured,current_measured,temperature_measured,discharge_duration
1,3.682,2.000,24.3,3420
2,9.850,2.000,24.5,3400
3,3.670,INVALID_CURR,24.8,3380
4,3.662,2.000,145.0,3350
5,,2.000,25.2,3320
6,-3.500,2.000,25.5,3300`;

export const CSV_TEMPLATE_DOCUMENTATION = {
  requiredHeaders: ['cycle', 'voltage_measured', 'current_measured', 'temperature_measured', 'discharge_duration'],
  optionalHeaders: ['internal_impedance', 'capacity'],
  description: 'BMS cycle telemetry logging format. Cycle corresponds to complete equivalent discharge cycle. Voltage is nominal discharge terminal average (V), current is discharge rate (A), temperature is peak cell/pack temperature (°C), and discharge duration is time in seconds to cutoff.',
  bounds: {
    voltage_measured: { min: 2.0, max: 5.0, unit: 'V' },
    current_measured: { min: 0.05, max: 500.0, unit: 'A' },
    temperature_measured: { min: -30.0, max: 90.0, unit: '°C' },
    discharge_duration: { min: 10, max: 86400, unit: 'seconds' },
    cycle: { min: 1, max: 10000, unit: 'integer' }
  }
};
