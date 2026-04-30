const mongoose = require('mongoose');

// Collection 3: Portfolios
// References User — one user has one portfolio document that aggregates
// overall stats. Kept separate from User to avoid growing the user document
// with heavy computed fields.
const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,   // One portfolio per user
    index: true
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  totalCurrentValue: {
    type: Number,
    default: 0
  },
  // Diversification score computed by backend logic (0–100)
  diversificationScore: {
    type: Number,
    default: 0
  },
  // Risk score computed from holdings (0–100)
  riskScore: {
    type: Number,
    default: 0
  },
  // Portfolio performance rank among all users (computed via aggregation)
  performanceRank: {
    type: Number,
    default: null
  },
  assetAllocation: {
    stock:       { type: Number, default: 0 },
    crypto:      { type: Number, default: 0 },
    bond:        { type: Number, default: 0 },
    mutual_fund: { type: Number, default: 0 },
    etf:         { type: Number, default: 0 }
  },
  lastRebalanced: Date
}, { timestamps: true });

// Virtual: Total Profit/Loss
portfolioSchema.virtual('totalProfitLoss').get(function () {
  return this.totalCurrentValue - this.totalInvested;
});

portfolioSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
