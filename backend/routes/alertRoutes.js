const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect } = require('../middleware/authMiddleware');

// ── GET /api/alerts ─── Get all alerts for user ──────────────
router.get('/', protect, async (req, res) => {
  try {
    const { severity, isRead } = req.query;
    const filter = { user: req.user._id };

    if (severity) filter.severity = severity;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const alerts = await Alert.find(filter)
      .populate('investment', 'assetName assetType')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Alert.countDocuments({ user: req.user._id, isRead: false });

    res.json({ success: true, alerts, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/alerts/:id/read ─── Mark alert as read ──────────
router.put('/:id/read', protect, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/alerts/read-all ─── Mark all as read ────────────
router.put('/read-all', protect, async (req, res) => {
  try {
    await Alert.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/alerts/:id ─── Dismiss alert ─────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Alert dismissed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
