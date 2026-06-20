const db = require('../config/db');

// ==========================================
// Submit New Complaint (Citizen)
// ==========================================
exports.submitComplaint = async (req, res) => {
    try {
        const { title, description, location, dept_id, priority } = req.body;
        const userId = req.user.id;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Validation
        if (!title || !description || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, description and location'
            });
        }

        // Insert complaint
        const [result] = await db.query(
            'INSERT INTO complaints (user_id, dept_id, title, description, location, image_path, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, dept_id || null, title, description, location, imagePath, priority || 'medium', 'pending']
        );

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            complaint_id: result.insertId
        });

    } catch (error) {
        console.error('Submit Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            error: error.message
        });
    }
};

// ==========================================
// Get All Complaints (Admin can see all, Citizen sees only their own)
// ==========================================
exports.getAllComplaints = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

      let query = `
            SELECT 
                c.complaint_id,
                c.title,
                c.description,
                c.location,
                c.status,
                c.priority,
                c.image_path,
                c.created_at,
                c.updated_at,
                u.full_name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.address as user_address,
                d.dept_name
            FROM complaints c   
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN departments d ON c.dept_id = d.dept_id
        `;

        let params = [];

        // If citizen, show only their complaints
        if (userRole === 'citizen') {
            query += ' WHERE c.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY c.created_at DESC';

        const [complaints] = await db.query(query, params);

        res.json({
            success: true,
            count: complaints.length,
            data: complaints
        });

    } catch (error) {
        console.error('Get Complaints Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints',
            error: error.message
        });
    }
};

// ==========================================
// Get Single Complaint by ID
// ==========================================
exports.getComplaintById = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [complaints] = await db.query(`
            SELECT 
                c.*,
                u.full_name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                d.dept_name,
                d.dept_email
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN departments d ON c.dept_id = d.dept_id
            WHERE c.complaint_id = ?
        `, [complaintId]);

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const complaint = complaints[0];

        // Citizens can only view their own complaints
        if (userRole === 'citizen' && complaint.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get status logs
        const [logs] = await db.query(`
            SELECT 
                sl.*,
                u.full_name as changed_by_name
            FROM complaint_status_logs sl
            LEFT JOIN users u ON sl.changed_by = u.user_id
            WHERE sl.complaint_id = ?
            ORDER BY sl.changed_at DESC
        `, [complaintId]);

        res.json({
            success: true,
            data: {
                ...complaint,
                status_logs: logs
            }
        });

    } catch (error) {
        console.error('Get Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaint',
            error: error.message
        });
    }
};

// ==========================================
// Update Complaint Status (Admin Only)
// ==========================================
exports.updateComplaintStatus = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const { status, remarks } = req.body;
        const adminId = req.user.id;

        // Validation
        const validStatuses = ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Get current status
        const [complaints] = await db.query(
            'SELECT status FROM complaints WHERE complaint_id = ?',
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const oldStatus = complaints[0].status;

        // Update complaint status
        await db.query(
            'UPDATE complaints SET status = ? WHERE complaint_id = ?',
            [status, complaintId]
        );

        // Insert status log
        await db.query(
            'INSERT INTO complaint_status_logs (complaint_id, old_status, new_status, remarks, changed_by) VALUES (?, ?, ?, ?, ?)',
            [complaintId, oldStatus, status, remarks || null, adminId]
        );

        res.json({
            success: true,
            message: 'Complaint status updated successfully'
        });

    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

// ==========================================
// Assign Complaint to Department (Admin Only)
// ==========================================
exports.assignComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const { dept_id } = req.body;
        const adminId = req.user.id;

        if (!dept_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide department ID'
            });
        }

        // Check if complaint exists
        const [complaints] = await db.query(
            'SELECT status FROM complaints WHERE complaint_id = ?',
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const oldStatus = complaints[0].status;

        // Update complaint department and status
        await db.query(
            'UPDATE complaints SET dept_id = ?, status = ? WHERE complaint_id = ?',
            [dept_id, 'assigned', complaintId]
        );

        // Insert status log
        await db.query(
            'INSERT INTO complaint_status_logs (complaint_id, old_status, new_status, remarks, changed_by) VALUES (?, ?, ?, ?, ?)',
            [complaintId, oldStatus, 'assigned', 'Complaint assigned to department', adminId]
        );

        res.json({
            success: true,
            message: 'Complaint assigned successfully'
        });

    } catch (error) {
        console.error('Assign Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign complaint',
            error: error.message
        });
    }
};

// ==========================================
// Get Complaint Statistics (Admin)
// ==========================================
exports.getStatistics = async (req, res) => {
    try {
        // Total complaints
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM complaints');
        
        // Status wise count
        const [statusCount] = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM complaints 
            GROUP BY status
        `);

        // Department wise count
        const [deptCount] = await db.query(`
            SELECT d.dept_name, COUNT(c.complaint_id) as count
            FROM departments d
            LEFT JOIN complaints c ON d.dept_id = c.dept_id
            GROUP BY d.dept_id, d.dept_name
        `);

        res.json({
            success: true,
            data: {
                total: totalResult[0].total,
                byStatus: statusCount,
                byDepartment: deptCount
            }
        });

    } catch (error) {
        console.error('Get Statistics Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};
// ==========================================
// Delete Complaint
// ==========================================
exports.deleteComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if complaint exists
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE complaint_id = ?',
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const complaint = complaints[0];

        // Citizens can only delete their own pending complaints
        if (userRole === 'citizen') {
            if (complaint.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own complaints'
                });
            }
            if (complaint.status !== 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete pending complaints'
                });
            }
        }

        // Delete complaint (cascade will delete status logs)
        await db.query('DELETE FROM complaints WHERE complaint_id = ?', [complaintId]);

        res.json({
            success: true,
            message: 'Complaint deleted successfully'
        });

    } catch (error) {
        console.error('Delete Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete complaint',
            error: error.message
        });
    }
};

// ==========================================
// Update Complaint (Citizen Edit)
// ==========================================
exports.updateComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const userId = req.user.id;
        const { title, description, location, dept_id, priority } = req.body;

        // Check if complaint exists and belongs to user
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE complaint_id = ?',
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const complaint = complaints[0];

        // Only complaint owner can edit
        if (complaint.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own complaints'
            });
        }

        // Can only edit if status is pending
        if (complaint.status !== 'pending') {
            return res.status(403).json({
                success: false,
                message: 'You can only edit pending complaints'
            });
        }

        // Update complaint
        await db.query(
            'UPDATE complaints SET title = ?, description = ?, location = ?, dept_id = ?, priority = ? WHERE complaint_id = ?',
            [title, description, location, dept_id || null, priority, complaintId]
        );

        res.json({
            success: true,
            message: 'Complaint updated successfully'
        });

    } catch (error) {
        console.error('Update Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint',
            error: error.message
        });
    }
};