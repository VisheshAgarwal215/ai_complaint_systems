const Complaint = require('../models/Complaint');
const ApiError = require('../utils/ApiError');

const createComplaint = async (complaintData, userId = null) => {
  const complaint = await Complaint.create({
    ...complaintData,
    ...(userId && { createdBy: userId }),
  });

  return complaint;
};

const getAllComplaints = async () => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  return complaints;
};

const getComplaintById = async (id) => {
  const complaint = await Complaint.findById(id);

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  return complaint;
};

const updateComplaint = async (id, updateData) => {
  const complaint = await Complaint.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  return complaint;
};

const deleteComplaint = async (id) => {
  const complaint = await Complaint.findByIdAndDelete(id);

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  return complaint;
};

const searchComplaintsByLocation = async (location) => {
  const complaints = await Complaint.find({
    location: { $regex: location, $options: 'i' },
  }).sort({ createdAt: -1 });

  return complaints;
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  searchComplaintsByLocation,
};
