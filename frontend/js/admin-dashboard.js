// Prevent back button after logout
window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // Check if logged in
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || user.role !== 'admin') {
            window.location.href = 'login.html';
        }
    }
});

// Check if user is logged in and is admin
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
let allComplaints = []; // Store all complaints for filtering
let statusChart = null;
let departmentChart = null;

if (!token || user.role !== 'admin') {
    alert('Access denied. Admin only.');
    window.location.href = 'login.html';
}

let currentComplaintId = null;

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('editComplaintId');

    // Redirect and replace history
    window.location.replace('login.html');
});

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadDepartments();
    await loadComplaints();
});

async function loadDepartments() {
    try {
        const response = await fetch('/api/departments');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('modalDepartment');
            data.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.dept_id;
                option.textContent = dept.dept_name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

async function loadComplaints() {
    try {
        const response = await fetch('/api/complaints', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            allComplaints = data.data; // Store all complaints
            displayComplaints(data.data);
            updateStatistics(data.data);
            createCharts(data.data);
            populateDepartmentFilter(data.data); // Populate department filter
        } else {
            document.getElementById('complaintsTableContainer').innerHTML =
                '<p>Failed to load complaints</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('complaintsTableContainer').innerHTML =
            '<p>Error loading complaints</p>';
    }
}

function displayComplaints(complaints) {
    const container = document.getElementById('complaintsTableContainer');

    if (complaints.length === 0) {
        container.innerHTML = '<p>No complaints found</p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Image</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${complaints.map(c => {
        const hasImage = c.image_path && c.image_path !== 'null';
        return `
                    <tr>
                        <td>#${c.complaint_id}</td>
                        <td>
                            <strong>${c.user_name}</strong><br>
                            <small>📧 ${c.user_email}</small><br>
                            ${c.user_phone ? `<small>📞 ${c.user_phone}</small><br>` : ''}
                            ${c.user_address ? `<small>📍 ${c.user_address}</small>` : ''}
</td>
                        <td>${c.title}</td>
                        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.description}">${c.description}</td>
                        <td>${c.location}</td>
                        <td>${c.dept_name || 'Not Assigned'}</td>
                        <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                        <td>${c.priority}</td>
                        <td>${hasImage ? `<img src="${c.image_path}" alt="Issue" style="width:50px;height:50px;object-fit:cover;border-radius:5px;cursor:pointer;" onclick="window.open('${c.image_path}', '_blank')">` : 'No image'}</td>
                        <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-primary" style="padding:5px 10px;font-size:0.85rem;margin-right:5px;" onclick="openModal(${c.complaint_id}, '${c.title}', '${c.status}', ${c.dept_id || 'null'})">Update</button>
                            <button class="btn btn-secondary" style="padding:5px 10px;font-size:0.85rem;background:#dc3545;" onclick="deleteComplaintAdmin(${c.complaint_id})">Delete</button>
                        </td>
                    </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

function updateStatistics(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('inProgressComplaints').textContent = inProgress;
    document.getElementById('resolvedComplaints').textContent = resolved;
}

function openModal(complaintId, title, status, deptId) {
    currentComplaintId = complaintId;

    document.getElementById('modalComplaintInfo').innerHTML =
        `<p><strong>Complaint #${complaintId}:</strong> ${title}</p>`;

    document.getElementById('modalStatus').value = status;

    if (deptId) {
        document.getElementById('modalDepartment').value = deptId;
    }

    document.getElementById('updateModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('updateModal').style.display = 'none';
    currentComplaintId = null;
    document.getElementById('modalRemarks').value = '';
}

async function updateComplaint() {
    const status = document.getElementById('modalStatus').value;
    const deptId = document.getElementById('modalDepartment').value;
    const remarks = document.getElementById('modalRemarks').value;

    try {
        // Update status
        const statusResponse = await fetch(`/api/complaints/${currentComplaintId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, remarks })
        });

        const statusData = await statusResponse.json();

        if (statusData.success) {
            alert('Complaint updated successfully!');
            closeModal();
            await loadComplaints();
        } else {
            alert('Failed to update complaint: ' + statusData.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error updating complaint');
    }
}
// Delete Complaint (Admin)
async function deleteComplaintAdmin(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/complaints/${complaintId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('Complaint deleted successfully!');
            await loadComplaints();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete complaint');
    }
}

// Create Charts
function createCharts(complaints) {
    createStatusChart(complaints);
    createDepartmentChart(complaints);
}

// Status Chart
function createStatusChart(complaints) {
    const statusCounts = {
        'pending': 0,
        'assigned': 0,
        'in-progress': 0,
        'resolved': 0,
        'rejected': 0
    };

    complaints.forEach(c => {
        statusCounts[c.status]++;
    });

    const ctx = document.getElementById('statusChart');

    // Destroy existing chart if exists
    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
            datasets: [{
                data: [
                    statusCounts.pending,
                    statusCounts.assigned,
                    statusCounts['in-progress'],
                    statusCounts.resolved,
                    statusCounts.rejected
                ],
                backgroundColor: [
                    '#ffc107',
                    '#17a2b8',
                    '#007bff',
                    '#28a745',
                    '#dc3545'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Department Chart
function createDepartmentChart(complaints) {
    // Count by department
    const deptCounts = {};

    complaints.forEach(c => {
        const dept = c.dept_name || 'Not Assigned';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);

    const ctx = document.getElementById('departmentChart');

    // Destroy existing chart if exists
    if (departmentChart) {
        departmentChart.destroy();
    }

    departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Complaints',
                data: data,
                backgroundColor: '#667eea',
                borderColor: '#667eea',
                borderWidth: 1,
                barThickness: 40,  // Fixed bar width
                maxBarThickness: 50  // Maximum bar width
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Populate Department Filter
function populateDepartmentFilter(complaints) {
    const deptFilter = document.getElementById('filterDepartment');
    const departments = new Set();
    
    complaints.forEach(c => {
        if (c.dept_name) {
            departments.add(c.dept_name);
        }
    });
    
    // Clear existing options except "All"
    deptFilter.innerHTML = '<option value="">All Departments</option>';
    
    // Add department options
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptFilter.appendChild(option);
    });
}

// Apply Filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const deptFilter = document.getElementById('filterDepartment').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    const searchText = document.getElementById('searchText').value.toLowerCase();
    
    let filtered = allComplaints;
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Filter by department
    if (deptFilter) {
        filtered = filtered.filter(c => c.dept_name === deptFilter);
    }
    
    // Filter by priority
    if (priorityFilter) {
        filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    
    // Search by ID or title
    if (searchText) {
        filtered = filtered.filter(c => 
            c.complaint_id.toString().includes(searchText) ||
            c.title.toLowerCase().includes(searchText)
        );
    }
    
    displayComplaints(filtered);
    updateStatistics(filtered);
    createCharts(filtered);
}

// Reset Filters
function resetFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('searchText').value = '';
    
    displayComplaints(allComplaints);
    updateStatistics(allComplaints);
    createCharts(allComplaints);
}

// Real-time search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchText');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});