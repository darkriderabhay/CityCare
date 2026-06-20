// Prevent back button after logout
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // Check if logged in
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
        }
    }
});

// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Display user name
document.getElementById('userName').textContent = user.full_name || 'User';

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('editComplaintId');
    
    // Redirect and replace history
    window.location.replace('login.html');
});

// Load complaints on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadComplaints();
});

async function loadComplaints() {
    try {
        const response = await fetch('/api/complaints', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayComplaints(data.data);
            updateStatistics(data.data);
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
        container.innerHTML = '<p>No complaints yet. <a href="submit-complaint.html">Submit your first complaint</a></p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
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
                    const canEdit = c.status === 'pending'; // Only pending complaints can be edited
                    return `
                    <tr>
                        <td>#${c.complaint_id}</td>
                        <td>${c.title}</td>
                        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.description}">${c.description}</td>
                        <td>${c.location}</td>
                        <td>${c.dept_name || 'Not Assigned'}</td>
                        <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                        <td>${c.priority}</td>
                        <td>${hasImage ? `<img src="${c.image_path}" alt="Issue" style="width:50px;height:50px;object-fit:cover;border-radius:5px;cursor:pointer;" onclick="window.open('${c.image_path}', '_blank')">` : 'No image'}</td>
                        <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-primary" style="padding:5px 10px;font-size:0.85rem;margin-right:5px;" onclick="openReceiptModal(${c.complaint_id})">Print/Download</button>
                            ${canEdit ? `
                                <button class="btn btn-primary" style="padding:5px 10px;font-size:0.85rem;margin-right:5px;" onclick="editComplaint(${c.complaint_id})">Edit</button>
                                <button class="btn btn-secondary" style="padding:5px 10px;font-size:0.85rem;background:#dc3545;" onclick="deleteComplaint(${c.complaint_id})">Delete</button>
                            ` : ''}
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
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('resolvedComplaints').textContent = resolved;
}
// Edit Complaint Function
async function editComplaint(complaintId) {
    // Store complaint ID and redirect to edit page
    localStorage.setItem('editComplaintId', complaintId);
    window.location.href = 'edit-complaint.html';
}

// Delete Complaint Function
async function deleteComplaint(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint?')) {
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
            await loadComplaints(); // Reload the list
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete complaint');
    }
}
// Global variable to store current complaint ID
let currentReceiptComplaintId = null;

// Open Receipt Modal
async function openReceiptModal(complaintId) {
    currentReceiptComplaintId = complaintId;
    
    try {
        const response = await fetch(`/api/complaints/${complaintId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const complaint = data.data;
            const user = JSON.parse(localStorage.getItem('user'));
            
            // Generate receipt HTML
            const receiptHTML = `
                <div class="receipt-header" style="text-align:center; border-bottom:3px solid #667eea; padding-bottom:15px; margin-bottom:20px;">
                    <h1 style="color:#667eea; margin:0; font-size:2rem;">🏙️ CityCare</h1>
                    <p style="color:#666; margin:5px 0; font-size:0.9rem;">Online Civic Issue Reporting System</p>
                    <div style="background:#667eea; color:white; padding:8px 16px; display:inline-block; border-radius:5px; margin:15px 0; font-size:1rem;">
                        Complaint #${complaint.complaint_id}
                    </div>
                </div>

                <div style="margin:20px 0; padding:15px; background:#f8f9fa; border-radius:8px;">
                    <h3 style="color:#667eea; margin:0 0 10px 0; font-size:1.1rem; border-bottom:2px solid #667eea; padding-bottom:8px;">Complaint Details</h3>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Title:</div>
                        <div style="flex:1; color:#666;">${complaint.title}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Description:</div>
                        <div style="flex:1; color:#666;">${complaint.description}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Location:</div>
                        <div style="flex:1; color:#666;">${complaint.location}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Department:</div>
                        <div style="flex:1; color:#666;">${complaint.dept_name || 'Not Assigned'}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Priority:</div>
                        <div style="flex:1; color:#666; text-transform:capitalize;">${complaint.priority}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Status:</div>
                        <div style="flex:1;">
                            <span style="display:inline-block; padding:4px 12px; border-radius:15px; font-weight:bold; font-size:0.85rem; background:${getStatusColor(complaint.status)}; color:white;">
                                ${complaint.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div style="margin:20px 0; padding:15px; background:#f8f9fa; border-radius:8px;">
                    <h3 style="color:#667eea; margin:0 0 10px 0; font-size:1.1rem; border-bottom:2px solid #667eea; padding-bottom:8px;">Citizen Information</h3>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Name:</div>
                        <div style="flex:1; color:#666;">${user.full_name}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Email:</div>
                        <div style="flex:1; color:#666;">${user.email}</div>
                    </div>
                </div>

                <div style="margin:20px 0; padding:15px; background:#f8f9fa; border-radius:8px;">
                    <h3 style="color:#667eea; margin:0 0 10px 0; font-size:1.1rem; border-bottom:2px solid #667eea; padding-bottom:8px;">Timeline</h3>
                    <div style="display:flex; padding:8px 0; border-bottom:1px solid #ddd; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Submitted On:</div>
                        <div style="flex:1; color:#666;">${new Date(complaint.created_at).toLocaleString()}</div>
                    </div>
                    <div style="display:flex; padding:8px 0; font-size:0.9rem;">
                        <div style="font-weight:bold; width:150px; color:#333;">Last Updated:</div>
                        <div style="flex:1; color:#666;">${new Date(complaint.updated_at).toLocaleString()}</div>
                    </div>
                </div>

                <div style="margin-top:25px; padding-top:15px; border-top:2px solid #ddd; text-align:center; color:#666; font-size:0.8rem;">
                    <p style="margin:5px 0;"><strong>CityCare</strong> - Online Civic Issue Reporting System 2026</p>
                    <p style="margin:5px 0;">This is an auto-generated receipt. For queries, contact your concerned department.</p>
                    <p style="margin:5px 0;">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            `;
            
            document.getElementById('receiptContent').innerHTML = receiptHTML;
            document.getElementById('receiptModal').style.display = 'block';
        } else {
            alert('Failed to load complaint details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading complaint for receipt');
    }
}

// Helper function for status colors
function getStatusColor(status) {
    const colors = {
        'pending': '#ffc107',
        'assigned': '#17a2b8',
        'in-progress': '#007bff',
        'resolved': '#28a745',
        'rejected': '#dc3545'
    };
    return colors[status] || '#6c757d';
}

// Close Receipt Modal
function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
    currentReceiptComplaintId = null;
}

// Print Receipt
function printReceipt() {
    const printContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Complaint Receipt #${currentReceiptComplaintId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Download as PDF
function downloadPDF() {
    const element = document.getElementById('receiptContent');
    
    // Clone the element to modify styles without affecting the display
    const clone = element.cloneNode(true);
    clone.style.width = '700px';
    clone.style.fontSize = '12px';
    
    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `CityCare_Complaint_${currentReceiptComplaintId}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: 'avoid-all' }
    };
    
    // Show loading message
    const downloadBtn = event.target;
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = '⏳ Generating PDF...';
    downloadBtn.disabled = true;
    
    html2pdf().from(clone).set(opt).save().then(() => {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        alert('✅ PDF downloaded successfully!');
    }).catch((error) => {
        console.error('PDF Error:', error);
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        alert('❌ Failed to generate PDF. Please try again.');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('receiptModal');
    if (e.target === modal) {
        closeReceiptModal();
    }
});