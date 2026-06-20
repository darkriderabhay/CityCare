const express = require('express');
const router = express.Router();
const {
    submitComplaint,
    getAllComplaints,
    getComplaintById,
    updateComplaintStatus,
    assignComplaint,
    getStatistics,
    deleteComplaint,
    updateComplaint
} = require('../controllers/complaintController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// Citizen routes
router.post('/submit', upload.single('image'), submitComplaint);
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint); // Edit complaint
router.delete('/:id', deleteComplaint); // Delete complaint

// Admin only routes
router.put('/:id/status', isAdmin, updateComplaintStatus);
router.put('/:id/assign', isAdmin, assignComplaint);
router.get('/stats/all', isAdmin, getStatistics);

module.exports = router;