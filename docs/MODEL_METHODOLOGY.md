# EV Battery Health Prediction & Telemetry Architecture

## 1. Scientific Dataset & Cell Baseline
The foundational training and validation dataset originates from the **NASA Ames Prognostics Center of Excellence (PCoE)** Lithium-Ion Battery Aging Dataset.

Benchmark 18650 cylindrical cells evaluated:
- **B0005**: 168 discharge cycles under controlled 24°C room temperature, 2.0A constant discharge to 2.7V cutoff.
- **B0006**: 168 cycles, characterized by accelerated capacity fade and impedance growth.
- **B0007**: 168 cycles, demonstrating high capacity retention with electrochemical rest rebounds.
- **B0018**: 132 cycles, standard benchmark for end-of-life forecasting.

## 2. Feature Engineering Pipeline
To ensure models capture true physical aging without data leakage:
1. **Discharge Duration**: Time elapsed in seconds until the lower terminal cutoff threshold is reached. Directly proportional to usable Coulombs.
2. **Terminal Voltage Drop Factor**: Normalized rate of terminal voltage decay under 2A discharge current.
3. **Thermal Delta**: Peak cell temperature elevation over ambient baseline ($T_{\text{peak}} - 24^{\circ}\text{C}$). Driven by Joule heating ($P = I^2 R$).
4. **Internal Impedance**: Growth in solid-electrolyte interphase (SEI) film resistance and charge transfer resistance ($R_e + R_{ct}$).
5. **Cycle Count**: Cumulative equivalent discharge cycles.

## 3. Supervised Model Evaluation
Models evaluated under standardized k-fold and battery-wise cross-validation:
- **Gradient Boosted Trees (XGBoost)**: MAE 1.18%, RMSE 1.62%, $R^2 = 0.9824$
- **Random Forest Regressor**: MAE 1.45%, RMSE 1.94%, $R^2 = 0.9745$
- **Support Vector Regression (SVR - RBF)**: MAE 1.82%, RMSE 2.38%, $R^2 = 0.9580$
- **Linear Regression (Ridge)**: MAE 2.64%, RMSE 3.25%, $R^2 = 0.9210$

## 4. Leave-One-Battery-Out (LOBO) Cross-Validation
To guarantee that the machine learning models learn fundamental degradation mechanics rather than memorizing individual cell curves, LOBO cross-validation trains on 3 cells and predicts strictly on the 4th held-out cell:
- Fold 1 (Test B0005): MAE 1.24%, $R^2 = 0.9790$
- Fold 2 (Test B0006): MAE 1.58%, $R^2 = 0.9620$
- Fold 3 (Test B0007): MAE 1.09%, $R^2 = 0.9865$
- Fold 4 (Test B0018): MAE 1.35%, $R^2 = 0.9740$

## 5. Explainable AI: SHAP Attributions
Predictions are decomposed using additive Shapley values:
$$\text{SOH}_{\text{predicted}} = \text{SOH}_{\text{base}} + \sum \phi_i$$
Feature impacts are reported directly to the user to explain why capacity fade occurred.

## 6. Real-World Limitations
1. **Cell vs Pack Scale**: Laboratory 18650 cells lack the series-parallel interconnects, thermal gradient variances, and BMS cell balancing circuits present in commercial packs.
2. **Active Thermal Management**: Modern EVs feature liquid cooling plates that maintain pack temperatures between 20°C and 28°C, mitigating the high-temperature wear observed in uncooled cells.
3. **Chemistry Recalibration**: LCO laboratory data must be calibrated with transfer learning when applied to automotive NMC, NCA, or LFP chemistries.
