const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const aiService = require('../services/aiService');

const analyzeComplaint = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  const analysis = await aiService.analyzeComplaint({
    title,
    description,
    category,
  });

  sendSuccess(res, 200, 'Complaint analyzed successfully', analysis);
});

module.exports = { analyzeComplaint };
