// Prevent back button after logout
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
        }
    }
});

// Check if user is logged in
const token = localStorage.getItem('token');
const complaintId = localStorage.getItem('editComplaintId');

if (!token) {
    window.location.href = 'login.html';
}

if (!complaintId) {
    alert('No complaint selected for editing');
    window.location.href = 'dashboard.html';
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('editComplaintId');
    
    // Redirect and replace history
    window.location.replace('login.html');
});

// Load complaint data and departments
document.addEventListener('DOMContentLoaded', async () => {
    await loadDepartments();
    await loadComplaintData();
});

async function loadDepartments() {
    try {
        const response = await fetch('/api/departments');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('dept_id');
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

async function loadComplaintData() {
    try {
        const response = await fetch(`/api/complaints/${complaintId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const complaint = data.data;
            
            // Check if can edit
            if (complaint.status !== 'pending') {
                alert('You can only edit pending complaints');
                window.location.href = 'dashboard.html';
                return;
            }

            // Fill form
            document.getElementById('title').value = complaint.title;
            document.getElementById('description').value = complaint.description;
            document.getElementById('location').value = complaint.location;
            document.getElementById('dept_id').value = complaint.dept_id || '';
            document.getElementById('priority').value = complaint.priority;
        } else {
            alert('Failed to load complaint data');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load complaint');
        window.location.href = 'dashboard.html';
    }
}

// Handle form submission
document.getElementById('editComplaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        dept_id: document.getElementById('dept_id').value || null,
        priority: document.getElementById('priority').value
    };

    try {
        const response = await fetch(`/api/complaints/${complaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Complaint updated successfully! Redirecting...', 'success');
            localStorage.removeItem('editComplaintId');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('Failed to update complaint. Please try again.', 'error');
        console.error('Error:', error);
    }
});

function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 5000);
}