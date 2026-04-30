const mongoose = require('mongoose');

// Collection 2: Investments
// References User (referencing chosen over embedding because investments
// can be queried independently, updated frequently, and users can have
// many investments — embedding would cause document bloat and make
// individual investment updates expensive)
const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true   // Indexed for fast user-based queries
  },
  assetName: {
    type: String,
    required: [true, 'Asset name required'],
    trim: true
  },
  assetType: {
    type: String,
    enum: ['stock', 'crypto', 'bond', 'mutual_fund', 'etf'],
    required: true
  },
  amountInvested: {
    type: Number,
    required: [true, 'Amount invested is required'],
    min: [1, 'Minimum investment is $1']
  },
  currentValue: {
    type: Number,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  // Simulation fields
  expectedReturnRate: {
    type: Number,   // Annual % e.g. 8 means 8%
    default: 8
  },
  simulatedValue1Y: Number,   // Projected value after 1 year
  simulatedValue3Y: Number,   // Projected value after 3 years
  simulatedValue5Y: Number,   // Projected value after 5 years
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active'
  }
}, { timestamps: true });

// Virtual: Profit/Loss
investmentSchema.virtual('profitLoss').get(function () {
  return this.currentValue - this.amountInvested;
});

// Virtual: Return %
investmentSchema.virtual('returnPercentage').get(function () {
  return ((this.currentValue - this.amountInvested) / this.amountInvested * 100).toFixed(2);
});

investmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Investment', investmentSchema);
