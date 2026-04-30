const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const Portfolio = require('../models/Portfolio');
const { protect } = require('../middleware/authMiddleware');
const { validate, investmentRules } = require('../middleware/validateMiddleware');
const {
  runSimulation,
  computeRiskScore,
  computeDiversificationScore,
  computeAssetAllocation,
  generateAlerts
} = require('../controllers/finTechLogic');

// Helper: recalculate and save portfolio stats
async function syncPortfolio(userId) {
  const investments = await Investment.find({ user: userId, status: 'active' });

  const totalInvested     = investments.reduce((s, i) => s + i.amountInvested, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const riskScore         = computeRiskScore(investments);
  const diversScore       = computeDiversificationScore(investments);
  const allocation        = computeAssetAllocation(investments);

  await Portfolio.findOneAndUpdate(
    { user: userId },
    {
      totalInvested,
      totalCurrentValue,
      riskScore,
      diversificationScore: diversScore,
      assetAllocation: allocation
    },
    { upsert: true, new: true }
  );

  // Run alert engine after every portfolio change
  await generateAlerts(userId, investments, riskScore, diversScore);

  return { investments, riskScore, diversScore };
}

// ── POST /api/investments ─── Add Investment ─────────────────
router.post('/', protect, investmentRules, validate, async (req, res) => {
  try {
    const {
      assetName, assetType, quantity, purchasePrice,
      currentPrice, expectedReturnRate, riskLevel
    } = req.body;

    const amountInvested = quantity * purchasePrice;
    const currentValue   = quantity * currentPrice;

    // Run simulation logic
    const sim = runSimulation(currentValue, expectedReturnRate || 8);

    const investment = await Investment.create({
      user: req.user._id,
      assetName,
      assetType,
      quantity,
      purchasePrice,
      currentPrice,
      amountInvested,
      currentValue,
      expectedReturnRate: expectedReturnRate || 8,
      riskLevel: riskLevel || 'medium',
      ...sim
    });

    await syncPortfolio(req.user._id);

    res.status(201).json({ success: true, investment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/investments ─── List all investments ────────────
router.get('/', protect, async (req, res) => {
  try {
    const { assetType, riskLevel, sort } = req.query;
    const filter = { user: req.user._id, status: 'active' };

    // Filtering query
    if (assetType) filter.assetType = assetType;
    if (riskLevel) filter.riskLevel = riskLevel;

    let query = Investment.find(filter);

    // Sorting
    if (sort === 'return_desc') query = query.sort({ currentValue: -1 });
    else if (sort === 'return_asc') query = query.sort({ currentValue: 1 });
    else query = query.sort({ createdAt: -1 });

    const investments = await query;
    res.json({ success: true, count: investments.length, investments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/investments/simulate/:id ─── Simulate returns ──
router.get('/simulate/:id', protect, async (req, res) => {
  try {
    const inv = await Investment.findOne({ _id: req.params.id, user: req.user._id });
    if (!inv) return res.status(404).json({ success: false, message: 'Investment not found' });

    // Re-run simulation with possibly different rate scenarios
    const conservative = runSimulation(inv.currentValue, 4);
    const moderate     = runSimulation(inv.currentValue, 8);
    const aggressive   = runSimulation(inv.currentValue, 14);

    res.json({
      success: true,
      investment: inv,
      scenarios: {
        conservative: { rate: '4%', ...conservative },
        moderate:     { rate: '8%', ...moderate },
        aggressive:   { rate: '14%', ...aggressive }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/investments/:id ─── Update current price ────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { currentPrice, expectedReturnRate } = req.body;
    const inv = await Investment.findOne({ _id: req.params.id, user: req.user._id });
    if (!inv) return res.status(404).json({ success: false, message: 'Investment not found' });

    inv.currentPrice = currentPrice || inv.currentPrice;
    inv.currentValue = inv.quantity * inv.currentPrice;

    const rate = expectedReturnRate || inv.expectedReturnRate;
    const sim = runSimulation(inv.currentValue, rate);
    Object.assign(inv, sim, { expectedReturnRate: rate });

    await inv.save();
    await syncPortfolio(req.user._id);

    res.json({ success: true, investment: inv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/investments/:id ─── Sell/remove investment ───
router.delete('/:id', protect, async (req, res) => {
  try {
    const inv = await Investment.findOne({ _id: req.params.id, user: req.user._id });
    if (!inv) return res.status(404).json({ success: false, message: 'Investment not found' });

    inv.status = 'sold';
    await inv.save();
    await syncPortfolio(req.user._id);

    res.json({ success: true, message: 'Investment marked as sold' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/investments/stats/aggregated ── Aggregation Query ─
// Query 1: Aggregation — performance by asset type
router.get('/stats/aggregated', protect, async (req, res) => {
  try {
    const stats = await Investment.aggregate([
      { $match: { user: req.user._id, status: 'active' } },
      {
        $group: {
          _id: '$assetType',
          totalInvested:     { $sum: '$amountInvested' },
          totalCurrentValue: { $sum: '$currentValue' },
          count:             { $sum: 1 },
          avgReturnRate:     { $avg: '$expectedReturnRate' }
        }
      },
      {
        $addFields: {
          profitLoss:       { $subtract: ['$totalCurrentValue', '$totalInvested'] },
          returnPercentage: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalCurrentValue', '$totalInvested'] }, '$totalInvested'] },
              100
            ]
          }
        }
      },
      { $sort: { returnPercentage: -1 } }
    ]);

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
