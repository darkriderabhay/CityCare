document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Save token and user info to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success alert
            alert('✅ Login successful! Redirecting to dashboard...');

            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 500);
        } else {
            // Show error alert
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Login failed. Please try again.');
        console.error('Error:', error);
    }
});