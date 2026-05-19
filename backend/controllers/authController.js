const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/authService');

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await authService.registerUser({ name, email, password, role });

  sendSuccess(res, 201, 'User registered successfully', result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  sendSuccess(res, 200, 'Login successful', result);
});

module.exports = { signup, login };
