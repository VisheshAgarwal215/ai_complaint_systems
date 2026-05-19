const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const complaintService = require('../services/complaintService');

const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(
    req.body,
    req.user?._id
  );

  sendSuccess(res, 201, 'Complaint created successfully', complaint);
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await complaintService.getAllComplaints();

  sendSuccess(res, 200, 'Complaints retrieved successfully', {
    count: complaints.length,
    complaints,
  });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateComplaint(
    req.params.id,
    req.body
  );

  sendSuccess(res, 200, 'Complaint updated successfully', complaint);
});

const deleteComplaint = asyncHandler(async (req, res) => {
  await complaintService.deleteComplaint(req.params.id);

  sendSuccess(res, 200, 'Complaint deleted successfully');
});

const searchComplaints = asyncHandler(async (req, res) => {
  const { location } = req.query;

  const complaints = await complaintService.searchComplaintsByLocation(location);

  sendSuccess(res, 200, 'Complaints search completed successfully', {
    count: complaints.length,
    complaints,
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaint,
  deleteComplaint,
  searchComplaints,
};
