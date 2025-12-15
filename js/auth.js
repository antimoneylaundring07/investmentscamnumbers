// Authentication and user session management
function setButtonLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>Loading...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.id === 'loginBtn' ? 'Sign In' : 'Create Account';
    }
}

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleToLogin = document.getElementById('toggleToLogin');
    const toggleToSignup = document.querySelector('.toggle-form:not(#toggleToLogin)');

    loginForm.classList.toggle('hidden');
    signupForm.classList.toggle('hidden');
    toggleToLogin.classList.toggle('hidden');
    toggleToSignup.classList.toggle('hidden');

    clearMessage();
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    setButtonLoading(btn, true);

    try {
        const { data: users, error: queryError } = await supabaseClient
            .from('login')
            .select('*')
            .eq('email', email);

        if (queryError) {
            console.error('Query error:', queryError);
            showMessage('Login failed: ' + queryError.message, 'error');
            setButtonLoading(btn, false);
            return;
        }

        if (!users || users.length === 0) {
            showMessage('Invalid email or password', 'error');
            setButtonLoading(btn, false);
            return;
        }

        const user = users[0];

        // TODO: In production, implement bcrypt password hashing
        if (user.password !== password) {
            showMessage('Invalid email or password', 'error');
            setButtonLoading(btn, false);
            return;
        }

        sessionStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString()
        }));

        showMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error: ' + error.message, 'error');
        setButtonLoading(btn, false);
    }
});

window.addEventListener('load', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser && !window.location.pathname.includes('login.html')) {
        console.log('User already logged in');
    }
});

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function isLoggedIn() {
    return sessionStorage.getItem('currentUser') !== null;
}

function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function hasRole(requiredRole) {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
}

function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

console.log('Auth script loaded successfully');