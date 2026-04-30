const mongoose = require('mongoose');

// Collection 4: Alerts
// The CORE LOGIC of this assignment is the Alert System.
// Alerts are generated automatically by backend logic when:
// - Investment drops more than threshold %
// - Investment rises above target %
// - Portfolio risk score exceeds limit
// - Diversification is too low
const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    default: null   // null means portfolio-level alert
  },
  alertType: {
    type: String,
    enum: [
      'price_drop',         // Investment fell below threshold
      'price_surge',        // Investment surged above target
      'high_risk',          // Risk score too high
      'low_diversification',// Portfolio needs diversification
      'stop_loss',          // Auto stop-loss triggered
      'target_reached'      // Investment hit profit target
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // The threshold value that triggered this alert
  triggerValue: Number,
  // The actual value at time of trigger
  actualValue: Number,
  isRead: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
