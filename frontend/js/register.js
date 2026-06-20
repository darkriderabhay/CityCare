document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
        full_name: document.getElementById('full_name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Save token to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success message
            alert('✅ Registration successful! Redirecting to dashboard...');

            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Registration failed. Please try again.');
        console.error('Error:', error);
    }
});