const { body, validationResult } = require('express-validator');

// Middleware 2: Input validation

// Validates incoming requests and returns errors if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Auth validators
const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('riskProfile').optional().isIn(['conservative', 'moderate', 'aggressive'])
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

// Investment validators
const investmentRules = [
  body('assetName').trim().notEmpty().withMessage('Asset name required'),
  body('assetType').isIn(['stock', 'crypto', 'bond', 'mutual_fund', 'etf']).withMessage('Invalid asset type'),
  body('quantity').isFloat({ min: 0.0001 }).withMessage('Quantity must be positive'),
  body('purchasePrice').isFloat({ min: 0.01 }).withMessage('Purchase price must be positive'),
  body('currentPrice').isFloat({ min: 0.01 }).withMessage('Current price must be positive'),
  body('expectedReturnRate').optional().isFloat({ min: -100, max: 1000 }),
  body('riskLevel').optional().isIn(['low', 'medium', 'high'])
];

module.exports = { validate, registerRules, loginRules, investmentRules };
