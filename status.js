document.addEventListener('DOMContentLoaded', () => {
    // Auth handled by auth.js
    fetchOrders();
    
    document.getElementById('searchOrder').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filterOrders(term);
    });
});

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
             renderOrders(allOrders);
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

function filterOrders(term) {
    const filtered = allOrders.filter(o => 
        o.orderid.toString().includes(term) || 
        o.name.toLowerCase().includes(term)
    );
    renderOrders(filtered);
    renderOrders(filtered);
}

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
