const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Investment = require('../models/Investment');
const { protect } = require('../middleware/authMiddleware');

// ── GET /api/portfolio ─── Get user's portfolio summary ──────
router.get('/', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    res.json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/portfolio/rankings ── Query 2: Ranking query ────
// Aggregation: Rank all users by portfolio return % (descending)
router.get('/rankings', protect, async (req, res) => {
  try {
    const rankings = await Portfolio.aggregate([
      {
        $match: { totalInvested: { $gt: 0 } }
      },
      {
        $addFields: {
          returnPercentage: {
            $multiply: [
              { $divide: [
                { $subtract: ['$totalCurrentValue', '$totalInvested'] },
                '$totalInvested'
              ]},
              100
            ]
          }
        }
      },
      { $sort: { returnPercentage: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          'userInfo.password': 0,
          'userInfo.email': 0
        }
      }
    ]);

    // Find current user's rank
    const myRank = rankings.findIndex(r => r.user.toString() === req.user._id.toString()) + 1;

    res.json({ success: true, rankings, myRank });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
