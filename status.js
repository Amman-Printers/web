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
        const res = await fetch(CONFIG.SCRIPT_URL + '?action=getOrders');
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

    tbody.innerHTML = orders.map(order => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#${order.orderid}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${order.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${order.orderDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">₹${order.totalamt}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.paymentStatus === 'Paid' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }">
                    ${order.paymentStatus || 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">View</a>
            </td>
        </tr>
    `).join('');
}

function filterOrders(term) {
    const filtered = allOrders.filter(o => 
        o.orderid.toString().includes(term) || 
        o.name.toLowerCase().includes(term)
    );
    renderOrders(filtered);
}
