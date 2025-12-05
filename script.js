document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const statusAlert = document.getElementById('statusAlert');
    const submitBtn = document.getElementById('submitBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            setLoading(true);
            setStatus(null);

            try {
                const params = new URLSearchParams({
                    action: 'login',
                    user: username,
                    password: password,
                    apitoken: CONFIG.API_TOKEN
                });
                const response = await fetch(`${CONFIG.SCRIPT_URL}?${params.toString()}`);
                const data = await response.json();

                if (data.result === 'success') {
                     setStatus('success');
                     sessionStorage.setItem('isLoggedIn', 'true'); // Set session
                     setTimeout(() => {
                         window.location.href = 'form.html';
                     }, 800);
                } else {
                    setStatus('authissue');
                }

            } catch (error) {
                console.error(error);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        });
    }
});

function setLoading(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
            </span>
        `;
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

function setStatus(type) {
    const statusAlert = document.getElementById('statusAlert');
    const base = "p-4 rounded-xl flex items-start gap-3 border shadow-sm animate-fade-in ";
    
    if (!type) {
        statusAlert.innerHTML = '';
        return;
    }

    if (type === 'success') {
        statusAlert.innerHTML = `
            <div class="${base} bg-green-50 border-green-200 text-green-800">
                <div class="mt-0.5 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <strong class="font-bold block">Welcome Back!</strong>
                    <span class="text-sm opacity-90">Logging you in securely...</span>
                </div>
            </div>
        `;
    } else if (type === 'authissue') {
        statusAlert.innerHTML = `
            <div class="${base} bg-yellow-50 border-yellow-200 text-yellow-800">
                <div class="mt-0.5 text-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <strong class="font-bold block">Access Denied</strong>
                    <span class="text-sm opacity-90">Invalid username or password. Please try again.</span>
                </div>
            </div>
        `;
    } else if (type === 'error') {
        statusAlert.innerHTML = `
            <div class="${base} bg-red-50 border-red-200 text-red-800">
                <div class="mt-0.5 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <strong class="font-bold block">Connection Error</strong>
                    <span class="text-sm opacity-90">Unable to connect to the server. Please check your internet connection.</span>
                </div>
            </div>
        `;
    }
}
