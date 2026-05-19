const express = require('express');
const {
  createComplaint,
  getComplaints,
  updateComplaint,
  deleteComplaint,
  searchComplaints,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateWithErrors } = require('../middleware/validateMiddleware');
const {
  createComplaintRules,
  updateComplaintRules,
  complaintIdRules,
  searchComplaintRules,
} = require('../validators/complaintValidator');

const router = express.Router();

router.get(
  '/search',
  protect,
  searchComplaintRules,
  validateWithErrors,
  searchComplaints
);

router
  .route('/')
  .post(protect, createComplaintRules, validateWithErrors, createComplaint)
  .get(protect, getComplaints);

router
  .route('/:id')
  .put(protect, authorize('admin'), updateComplaintRules, validateWithErrors, updateComplaint)
  .delete(protect, authorize('admin'), complaintIdRules, validateWithErrors, deleteComplaint);

module.exports = router;
