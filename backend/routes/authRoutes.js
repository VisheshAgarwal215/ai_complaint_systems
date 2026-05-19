const express = require('express');
const { signup, login } = require('../controllers/authController');
const { signupRules, loginRules } = require('../validators/authValidator');
const { validateWithErrors } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/signup', signupRules, validateWithErrors, signup);
router.post('/login', loginRules, validateWithErrors, login);

module.exports = router;
