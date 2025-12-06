document.addEventListener('DOMContentLoaded', () => {
    // Auth handled by auth.js
    initializeFilters();
    fetchOrders();
    
    document.getElementById('searchOrder').addEventListener('input', applyFilters);
    document.getElementById('filterMonth').addEventListener('change', applyFilters);
    document.getElementById('filterYear').addEventListener('change', applyFilters);
});

function initializeFilters() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Populate Year Dropdown (Current - 2 to Current + 2)
    const yearSelect = document.getElementById('filterYear');
    yearSelect.innerHTML = '';
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
    
    // Set Month Default
    document.getElementById('filterMonth').value = currentMonth;
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

let allOrders = [];

async function fetchOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Loading orders...</td></tr>';

    try {
        const res = await fetch(CONFIG.SCRIPT_URL + '?action=getOrders&apitoken=' + CONFIG.API_TOKEN);
        const data = await res.json();
        
        if (data.result === 'success') {
             allOrders = data.data; // Corrected from data.result to data.data based on APPS_SCRIPT.js
             applyFilters(); // Apply default filters (current month)
        } else {
             throw new Error(data.message || 'Failed to fetch orders');
        }

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">Failed to load orders.</td></tr>';
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        // Format date to DD-MM-YYYY
        let dateStr = order.orderDate;
        if (dateStr) {
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj)) {
                // Ensure correct format if not already string. 
                // However, GAS usually returns string "dd-MMM-yyyy". 
                // If it's standard ISO or Date object, we format.
                // Request is DD-MM-CCyy (e.g. 05-12-2025)
                const d = String(dateObj.getDate()).padStart(2, '0');
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const y = dateObj.getFullYear();
                dateStr = `${d}-${m}-${y}`;
            }
        }
        
        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#${order.orderid}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${order.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${order.phone || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${dateStr}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">₹${order.totalamt}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">₹${order.pendingamt}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="downloadOrderPdf(${order.orderid})" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                    Download
                </button>
            </td>
        </tr>
    `}).join('');
}

function applyFilters() {
    const term = document.getElementById('searchOrder').value.toLowerCase();
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
    
    const filtered = allOrders.filter(o => {
        // Text Search
        const matchesTerm = !term || 
            o.orderid.toString().includes(term) || 
            o.name.toLowerCase().includes(term);
            
        // Date Filter
        let matchesDate = true;
        if (month !== "") {
            // Parse order date (dd-MMM-yyyy from GAS)
            // Note: Date parsing can be tricky. Using Date constructor usually works for standard formats,
            // but for "dd-MMM-yyyy", modern browsers handle it, or we parse manually.
            // Let's rely on Date.parse or new Date()
            const d = new Date(o.orderDate);
            if (!isNaN(d)) {
                // Check Month and Year
                // Note: filterMonth value is 0-11
                if (d.getMonth() != month || d.getFullYear() != year) {
                    matchesDate = false;
                }
            }
        }
        
        return matchesTerm && matchesDate;
    });

    renderOrders(filtered);
}

// Removed old filterOrders function as it is replaced by applyFilters

async function downloadOrderPdf(id) {
    const order = allOrders.find(o => o.orderid == id);
    if (!order) {
        alert('Order data not found');
        return;
    }
    
    // Create button loading state feedback if needed, but for now just call generator
    try {
        await generateOrderPDF(order);
    } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. See console for details.');
    }
}
