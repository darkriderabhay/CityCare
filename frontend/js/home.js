// Load departments on homepage
document.addEventListener('DOMContentLoaded', async () => {
    await loadDepartments();
    setupScrollHighlight();
});

async function loadDepartments() {
    try {
        const response = await fetch('/api/departments');
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('departmentsList');
            
            if (data.data.length === 0) {
                container.innerHTML = '<p>No departments available</p>';
                return;
            }

            container.innerHTML = data.data.map(dept => `
                <div class="dept-card">
                    <h3>${dept.dept_name}</h3>
                    <p>📧 ${dept.dept_email}</p>
                    <p>📞 ${dept.dept_phone}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        document.getElementById('departmentsList').innerHTML = 
            '<p>Failed to load departments</p>';
    }
}

// Highlight active navigation link on scroll
function setupScrollHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}