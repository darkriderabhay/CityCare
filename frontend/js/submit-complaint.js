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

if (!token) {
    window.location.href = 'login.html';
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

// Load departments on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadDepartments();
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


// Handle form submission
document.getElementById('complaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('dept_id', document.getElementById('dept_id').value || '');
    formData.append('priority', document.getElementById('priority').value);
    
   // Add image file if selected
    const imageFile = document.getElementById('image').files[0];
    console.log('Image file check:', imageFile); // DEBUG
    if (imageFile) {
        console.log('Image selected:', imageFile.name, imageFile.size); // DEBUG
        formData.append('image', imageFile);
    } else {
        console.log('No image selected'); // DEBUG
    }

    try {
        const response = await fetch('/api/complaints/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type - browser will set it automatically for FormData
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Complaint submitted successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('Failed to submit complaint. Please try again.', 'error');
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