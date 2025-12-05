(function() {
    // Determine if we are on a protected page. 
    // We assume index.html is public.
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    // List of public pages
    const publicPages = ['index.html', '', 'login.html'];
    
    // If current page is NOT in publicPages list, check session
    if (!publicPages.includes(page)) {
        if (!sessionStorage.getItem('isLoggedIn')) {
             console.warn("Unauthorized access. Redirecting to login.");
             window.location.replace('index.html');
        }
    }
})();
