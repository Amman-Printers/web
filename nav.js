
const renderNav = () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isLoginPage = currentPath === 'index.html' || currentPath === '';

    // Define menu items based on page
    let desktopMenuHTML = '';
    let mobileMenuHTML = '';

    if (!isLoginPage) {
        desktopMenuHTML = `
            <div class="hidden md:flex items-center gap-4">
                <a href="form.html" class="${currentPath === 'form.html' ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    New Order
                </a>
                <a href="status.html" class="${currentPath === 'status.html' ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    Order Status
                </a>
                <a href="update.html" class="${currentPath === 'update.html' ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    Update Order
                </a>
                <button onclick="logout()" class="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                </button>
            </div>
            
            <!-- Mobile Menu Button -->
            <div class="flex items-center md:hidden">
                <button id="mobile-menu-btn" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 transition-colors" aria-controls="mobile-menu" aria-expanded="false">
                    <span class="sr-only">Open main menu</span>
                    <!-- Icon when menu is closed. -->
                    <svg id="menu-icon-closed" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    <!-- Icon when menu is open. -->
                    <svg id="menu-icon-open" class="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;

        mobileMenuHTML = `
            <div class="md:hidden hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700" id="mobile-menu">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <a href="form.html" class="${currentPath === 'form.html' ? 'bg-orange-50 dark:bg-gray-700 text-orange-600 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'} block px-3 py-2 rounded-md text-base font-medium">
                        New Order
                    </a>
                    <a href="status.html" class="${currentPath === 'status.html' ? 'bg-orange-50 dark:bg-gray-700 text-orange-600 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'} block px-3 py-2 rounded-md text-base font-medium">
                        Order Status
                    </a>
                    <a href="update.html" class="${currentPath === 'update.html' ? 'bg-orange-50 dark:bg-gray-700 text-orange-600 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'} block px-3 py-2 rounded-md text-base font-medium">
                        Update Order
                    </a>
                     <button onclick="logout()" class="w-full text-left text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
    } else {
        // Login Page Nav - Minimal
        desktopMenuHTML = `
            <div class="flex items-center gap-4">
                 <span class="text-xs font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200">
                    Employee Portal
                </span>
            </div>
        `;
    }
    
    const navHTML = `
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-lg bg-opacity-80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <!-- Logo -->
                <div class="flex items-center gap-3">
                    <img src="Amman.png" alt="Amman Logo" class="w-8 h-8 object-contain">
                    <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                        Sri Amman Printers
                    </span>
                </div>

                ${desktopMenuHTML}
            </div>
        </div>
        ${mobileMenuHTML}
    </nav>
    `;

    document.getElementById('nav-container').innerHTML = navHTML;

    // Mobile menu toggle logic only if it exists
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) {
        const menu = document.getElementById('mobile-menu');
        const iconClosed = document.getElementById('menu-icon-closed');
        const iconOpen = document.getElementById('menu-icon-open');

        btn.addEventListener('click', () => {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                menu.classList.add('hidden');
                iconClosed.classList.remove('hidden');
                iconOpen.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
            } else {
                menu.classList.remove('hidden');
                iconClosed.classList.add('hidden');
                iconOpen.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    }
};

// Initialize nav when DOM is loaded
document.addEventListener('DOMContentLoaded', renderNav);
