document.addEventListener('DOMContentLoaded', () => {
    // Auth handled by auth.js
    initializeFilters();
    fetchOrders();
    
    document.getElementById('searchOrder').addEventListener('input', applyFilters);
    document.getElementById('filterMonth').addEventListener('change', fetchOrders);
    document.getElementById('filterYear').addEventListener('change', fetchOrders);
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

    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;

    let url = CONFIG.SCRIPT_URL + '?action=getOrders&apitoken=' + CONFIG.API_TOKEN;
    if (month !== "") url += `&month=${month}`;
    if (year !== "") url += `&year=${year}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.result === 'success') {
             allOrders = data.data; 
             applyFilters(); // Apply text search filter if any
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
    // Month/Year filtering is now handled server-side. 
    // We only need to filter by search term on the returned data set.
    
    const filtered = allOrders.filter(o => {
        // Text Search
        const matchesTerm = !term || 
            o.orderid.toString().includes(term) || 
            o.name.toLowerCase().includes(term);
        
        return matchesTerm;
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
