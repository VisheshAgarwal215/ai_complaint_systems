const express = require('express');
const { analyzeComplaint } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { validateWithErrors } = require('../middleware/validateMiddleware');
const { analyzeComplaintRules } = require('../validators/aiValidator');

const router = express.Router();

router.post(
  '/analyze',
  protect,
  analyzeComplaintRules,
  validateWithErrors,
  analyzeComplaint
);

module.exports = router;
