document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    // Add a hidden dashboard div that will be shown after successful login
    const container = document.querySelector('.container');
    const dashboardDiv = document.createElement('div');
    dashboardDiv.id = 'dashboard';
    dashboardDiv.innerHTML = `
        <h2>Welcome to your Dashboard</h2>
        <p>You have successfully logged in. This is your dashboard area.</p>
    `;
    container.appendChild(dashboardDiv);

    // Valid credentials for testing
    const validCredentials = {
        username: 'testuser',
        password: 'password123'
    };

    loginButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Clear previous messages
        messageDiv.textContent = '';
        messageDiv.className = 'message';
        
        // Simple validation
        if (!username || !password) {
            messageDiv.textContent = 'Please enter both username and password';
            messageDiv.classList.add('error');
            return;
        }

        // Check credentials
        if (username === validCredentials.username && password === validCredentials.password) {
            // Success
            messageDiv.textContent = 'Login successful!';
            messageDiv.classList.add('success');
            
            // Show dashboard
            dashboardDiv.style.display = 'block';
            
            // Hide login form
            document.querySelector('.login-form').style.display = 'none';
        } else {
            // Failure
            messageDiv.textContent = 'Invalid username or password';
            messageDiv.classList.add('error');
        }
    });
});
