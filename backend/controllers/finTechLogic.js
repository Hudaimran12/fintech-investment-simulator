/**
 * ─────────────────────────────────────────────────────────────
 *  CORE FINTECH LOGIC — Investment Simulator + Alert System
 *  Roll: 23i-5544 | digit1=4 (Investment Simulator) | digit2=4 (Alert System)
 * ─────────────────────────────────────────────────────────────
 *
 * SIMULATION LOGIC:
 *   Uses Compound Interest formula: FV = PV × (1 + r)^t
 *   where PV = present value, r = annual return rate (decimal), t = years
 *
 * ALERT LOGIC (Threshold-based):
 *   - STOP LOSS: if return% < -15% → CRITICAL alert
 *   - PRICE DROP: if return% < -5% → WARNING alert
 *   - PRICE SURGE: if return% > +20% → INFO alert
 *   - TARGET REACHED: if return% > +50% → WARNING (consider taking profit)
 *   - HIGH RISK: portfolio risk score > 70 → WARNING
 *   - LOW DIVERSIFICATION: only 1 asset type in portfolio → INFO
 * ─────────────────────────────────────────────────────────────
 */

const Alert = require('../models/Alert');

// ── 1. SIMULATION ENGINE ────────────────────────────────────────
/**
 * Simulates future investment value using compound interest.
 * @param {number} presentValue - Current investment value
 * @param {number} annualRatePercent - Expected annual return in %
 * @param {number} years - Number of years to project
 * @returns {number} Future value rounded to 2 decimal places
 */
function simulateFutureValue(presentValue, annualRatePercent, years) {
  const r = annualRatePercent / 100;
  return parseFloat((presentValue * Math.pow(1 + r, years)).toFixed(2));
}

/**
 * Runs full simulation for 1, 3, and 5 year horizons.
 */
function runSimulation(currentValue, expectedReturnRate) {
  return {
    simulatedValue1Y: simulateFutureValue(currentValue, expectedReturnRate, 1),
    simulatedValue3Y: simulateFutureValue(currentValue, expectedReturnRate, 3),
    simulatedValue5Y: simulateFutureValue(currentValue, expectedReturnRate, 5)
  };
}

// ── 2. RISK SCORER ─────────────────────────────────────────────
// Risk weights per asset type (higher = riskier)
const RISK_WEIGHTS = {
  crypto:      90,
  stock:       60,
  etf:         40,
  mutual_fund: 30,
  bond:        15
};

/**
 * Computes a weighted portfolio risk score (0–100).
 * Weighted average of risk weights based on each asset's value share.
 */
function computeRiskScore(investments) {
  if (!investments.length) return 0;
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  if (totalValue === 0) return 0;

  const weightedRisk = investments.reduce((sum, inv) => {
    const weight = inv.currentValue / totalValue;
    return sum + weight * (RISK_WEIGHTS[inv.assetType] || 50);
  }, 0);

  return parseFloat(weightedRisk.toFixed(1));
}

// ── 3. DIVERSIFICATION SCORER ──────────────────────────────────
/**
 * Computes diversification score (0–100).
 * More distinct asset types → higher score.
 * Formula: (uniqueTypes / 5) × 100
 */
function computeDiversificationScore(investments) {
  const types = new Set(investments.map(inv => inv.assetType));
  return parseFloat(((types.size / 5) * 100).toFixed(1));
}

// ── 4. ASSET ALLOCATION ────────────────────────────────────────
/**
 * Returns % allocation per asset type.
 */
function computeAssetAllocation(investments) {
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const allocation = { stock: 0, crypto: 0, bond: 0, mutual_fund: 0, etf: 0 };
  if (totalValue === 0) return allocation;

  investments.forEach(inv => {
    allocation[inv.assetType] = parseFloat(
      ((allocation[inv.assetType] || 0) + (inv.currentValue / totalValue) * 100).toFixed(2)
    );
  });
  return allocation;
}

// ── 5. ALERT ENGINE ────────────────────────────────────────────
/**
 * Core Alert Generation Logic (digit₂ = 4 → Alert System)
 * Evaluates each investment and portfolio-level metrics,
 * creates alerts in the DB if thresholds are breached.
 *
 * Thresholds:
 *   STOP LOSS      returnPct < -15  → CRITICAL
 *   PRICE DROP     returnPct < -5   → WARNING
 *   PRICE SURGE    returnPct > +20  → INFO
 *   TARGET REACHED returnPct > +50  → WARNING (take profit signal)
 *   HIGH RISK      riskScore > 70   → WARNING
 *   LOW DIVERS.    diversScore < 40 → INFO
 */
async function generateAlerts(userId, investments, riskScore, diversificationScore) {
  const alertsToCreate = [];

  // --- Per-investment threshold checks ---
  for (const inv of investments) {
    const returnPct = ((inv.currentValue - inv.amountInvested) / inv.amountInvested) * 100;

    if (returnPct < -15) {
      alertsToCreate.push({
        user: userId,
        investment: inv._id,
        alertType: 'stop_loss',
        severity: 'critical',
        message: `⚠️ STOP LOSS triggered for ${inv.assetName}. Loss is ${returnPct.toFixed(1)}%, which exceeds the -15% threshold. Consider exiting this position.`,
        triggerValue: -15,
        actualValue: parseFloat(returnPct.toFixed(2))
      });
    } else if (returnPct < -5) {
      alertsToCreate.push({
        user: userId,
        investment: inv._id,
        alertType: 'price_drop',
        severity: 'warning',
        message: `📉 ${inv.assetName} is down ${Math.abs(returnPct).toFixed(1)}%. Review your position.`,
        triggerValue: -5,
        actualValue: parseFloat(returnPct.toFixed(2))
      });
    }

    if (returnPct > 50) {
      alertsToCreate.push({
        user: userId,
        investment: inv._id,
        alertType: 'target_reached',
        severity: 'warning',
        message: `🎯 ${inv.assetName} has returned +${returnPct.toFixed(1)}%. Consider locking in profits.`,
        triggerValue: 50,
        actualValue: parseFloat(returnPct.toFixed(2))
      });
    } else if (returnPct > 20) {
      alertsToCreate.push({
        user: userId,
        investment: inv._id,
        alertType: 'price_surge',
        severity: 'info',
        message: `📈 ${inv.assetName} is up +${returnPct.toFixed(1)}%. Great performance!`,
        triggerValue: 20,
        actualValue: parseFloat(returnPct.toFixed(2))
      });
    }
  }

  // --- Portfolio-level threshold checks ---
  if (riskScore > 70) {
    alertsToCreate.push({
      user: userId,
      investment: null,
      alertType: 'high_risk',
      severity: 'warning',
      message: `🔴 Your portfolio risk score is ${riskScore}/100. Consider adding bonds or ETFs to reduce risk.`,
      triggerValue: 70,
      actualValue: riskScore
    });
  }

  if (diversificationScore < 40) {
    alertsToCreate.push({
      user: userId,
      investment: null,
      alertType: 'low_diversification',
      severity: 'info',
      message: `🟡 Diversification score is ${diversificationScore}/100. Spreading across more asset types reduces volatility.`,
      triggerValue: 40,
      actualValue: diversificationScore
    });
  }

  // Bulk insert (only insert if we have new alerts)
  if (alertsToCreate.length > 0) {
    await Alert.insertMany(alertsToCreate);
  }

  return alertsToCreate.length;
}

module.exports = {
  runSimulation,
  computeRiskScore,
  computeDiversificationScore,
  computeAssetAllocation,
  generateAlerts
};
