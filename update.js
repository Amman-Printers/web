// Import PDF library if available, ensuring it's accessible
// Assumes pdfGenerator.js is loaded and exposes generateOrderPDF(queryData)

document.addEventListener('DOMContentLoaded', () => {
    // Note: auth.js handles checking login state automatically assuming it runs first.
    // If not, we might need a check here. Use session storage as per existing patterns.
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = 'index.html';
        return;
    }

    initializeApp();
});

// App State
const state = {
    orderId: "",
    orderData: {}, // Full object from API
    rows: [], // Array of objects {id, particular, book, rate}
    customer: {
        name: "",
        phone: "",
        gst: "",
        code: "",
        address: ""
    },
    totals: {
        copies: 0,
        amount: 0,
        pending: 0,
        paid: 0,        // Current entry
        previousPaid: 0 // Previously paid (from DB)
    },
    rowIdCounter: 1
};

function initializeApp() {
    // Selectors
    const searchForm = document.getElementById('searchForm');
    const updateForm = document.getElementById('updateForm');
    const addItemBtn = document.getElementById('addItemBtn');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const startNewBtn = document.getElementById('startNewBtn');

    // Event Listeners
    searchForm.addEventListener('submit', handleSearch);
    clearBtn.addEventListener('click', handleClear);
    updateForm.addEventListener('submit', handleUpdate);
    addItemBtn.addEventListener('click', addNewRow);
    downloadPdfBtn.addEventListener('click', () => {
        if (state.orderData && state.orderData.orderid) {
            // Reconstruct a full data object with latest form values for PDF
            const currentData = prepareSubmissionData();
            // Merge with original data to keep fields we might not edit but need (like date)
            const pdfData = { ...state.orderData, ...currentData, orderDate: state.orderData.orderDate || new Date().toISOString() };
            generateOrderPDF(pdfData);
        }
    });
    startNewBtn.addEventListener('click', () => window.location.reload());

    // Input listeners for customer details
    ['custName', 'custPhone', 'custGst', 'custCode', 'custAddress'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const field = id.replace('cust', '').toLowerCase(); // name, phone, etc.
            state.customer[field] = e.target.value;
        });
    });

    // Amount Paid listener
    document.getElementById('amountPaid').addEventListener('input', (e) => {
        state.totals.paid = parseFloat(e.target.value) || 0;
        calculateTotals();
    });
}

function showStatus(elementId, type, message) {
    const el = document.getElementById(elementId);
    let classes = "p-4 rounded-xl flex items-start gap-3 border shadow-sm animate-fade-in ";
    let icon = "";
    
    if (type === 'success') {
        classes += "bg-green-50 border-green-200 text-green-800";
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-600"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'error') {
        classes += "bg-red-50 border-red-200 text-red-800";
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`;
    } else if (type === 'warn') {
        classes += "bg-yellow-50 border-yellow-200 text-yellow-800";
        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-yellow-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" /></svg>`;
    }

    el.innerHTML = `
        <div class="${classes}">
            <div class="mt-0.5">${icon}</div>
            <div><strong class="font-bold block capitalize">${type}!</strong>${message}</div>
        </div>
    `;
}

function setLoading(isLoading) {
    const btn = document.getElementById('searchBtn');
    const icon = document.getElementById('searchIcon');
    const text = document.getElementById('searchText');
    
    if (isLoading) {
        btn.disabled = true;
        text.textContent = 'Searching...';
        icon.classList.add('animate-spin');
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />`; // Using loading icon path or rotate existing
    } else {
        btn.disabled = false;
        text.textContent = 'Search';
        icon.classList.remove('animate-spin');
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />`;
    }
}

async function handleSearch(e) {
    e.preventDefault();
    const orderId = document.getElementById('searchOrderId').value.trim();
    if (!orderId) return;

    setLoading(true);
    document.getElementById('searchStatus').innerHTML = '';
    document.getElementById('updateForm').classList.add('hidden');
    document.getElementById('downloadSection').classList.add('hidden');

    try {
        const res = await fetch(`${CONFIG.SCRIPT_URL}?action=getOrders&apitoken=${CONFIG.API_TOKEN}`);
        const data = await res.json();

        if (data.result === 'success') {
            const order = data.data.find(o => o.orderid.toString().toLowerCase() === orderId.toLowerCase());
            
            if (order) {
                populateForm(order);
                showStatus('searchStatus', 'success', ` Order found. You can now edit the details.`);
            } else {
                showStatus('searchStatus', 'warn', ` Order ID "${orderId}" not found.`);
            }
        } else {
            throw new Error(data.message || 'Failed to fetch orders');
        }
    } catch (err) {
        showStatus('searchStatus', 'error', ` ${err.message}`);
    } finally {
        setLoading(false);
    }
}

function handleClear() {
    document.getElementById('searchForm').reset();
    document.getElementById('searchStatus').innerHTML = '';
    document.getElementById('updateForm').classList.add('hidden');
    document.getElementById('downloadSection').classList.add('hidden');
    state.rows = [];
    state.customer = {};
    state.orderId = "";
}

function populateForm(order) {
    state.orderData = order;
    state.orderId = order.orderid;
    
    // Customer
    state.customer = {
        name: order.name || "",
        phone: order.phone || "",
        gst: order.gst || "",
        code: order.code || "",
        address: order.address || ""
    };
    
    document.getElementById('custName').value = state.customer.name;
    document.getElementById('custPhone').value = state.customer.phone;
    document.getElementById('custGst').value = state.customer.gst;
    document.getElementById('custCode').value = state.customer.code;
    document.getElementById('custAddress').value = state.customer.address;

    // Rows
    state.rows = [];
    for (let i = 1; i <= 9; i++) {
        const part = order[`particular${i}`];
        const bk = order[`book${i}`];
        const rt = order[`rate${i}`];
        if (part || bk || rt) {
            state.rows.push({
                id: state.rowIdCounter++,
                particular: part || "",
                book: bk || "",
                rate: rt || ""
            });
        }
    }
    // Ensure at least one row
    if (state.rows.length === 0) {
        state.rows.push({ id: state.rowIdCounter++, particular: "", book: "", rate: "" });
    }

    // Amounts
    // Amounts
    // Calculate previous paid amount
    let previousPaid = parseFloat(order.paid || 0);

    // Legacy/Correction support: If 'paid' field is missing/zero but pending < total, infer paid
    if (previousPaid === 0 && order.pendingamt !== undefined) {
        const total = parseFloat(order.totalamt || 0);
        const pending = parseFloat(order.pendingamt || 0);
        if (total > 0 && pending < total) {
             previousPaid = total - pending;
        }
    }
    
    state.totals.previousPaid = previousPaid;
    state.totals.paid = 0; // Initialize current entry to 0
    
    document.getElementById('amountPaid').value = ""; // Show empty or 0 to encourage input? User asked for zero.
    document.getElementById('amountPaid').value = "0"; // Explicitly 0 as requested

    // User Info
    document.getElementById('createdByUser').textContent = order.createdByUser || 'N/A';
    document.getElementById('lastUpdatedByUser').textContent = order.lastUpdatedByUser || 'N/A';

    renderRows();
    // calculateTotals called in renderRows will update pending based on items and paid input

    document.getElementById('updateForm').classList.remove('hidden');
}

function renderRows() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    
    state.rows.forEach((row, index) => {
        const rowEl = document.createElement('div');
        rowEl.className = "group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out";
        rowEl.innerHTML = `
            <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-orange-200 z-10">
                ${index + 1}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-6">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Particulars</label>
                    <input type="text" value="${row.particular}" oninput="updateRow(${row.id}, 'particular', this.value)"
                        class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600" placeholder="Item description">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
                    <input type="number" min="0" value="${row.book}" oninput="updateRow(${row.id}, 'book', this.value)"
                        class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600" placeholder="0">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rate</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-400 sm:text-sm">₹</span></div>
                        <input type="number" step="0.01" min="0" value="${row.rate}" oninput="updateRow(${row.id}, 'rate', this.value)"
                            class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white pl-7 pr-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600" placeholder="0.00">
                    </div>
                </div>
                <div class="md:col-span-2 flex items-center justify-between md:justify-end gap-4 pb-1">
                    <div class="text-right">
                        <div class="text-xs text-gray-400 mb-1">Amount</div>
                        <div class="font-bold text-gray-800 dark:text-gray-100 text-lg">
                            ₹${(parseFloat(row.book || 0) * parseFloat(row.rate || 0)).toFixed(2)}
                        </div>
                    </div>
                    <button type="button" onclick="removeRow(${row.id})" ${state.rows.length <= 1 ? 'disabled' : ''}
                        class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(rowEl);
    });

    document.getElementById('itemCount').textContent = `${state.rows.length} items`;
    document.getElementById('addItemBtn').disabled = state.rows.length >= 9;
    calculateTotals();
}

window.updateRow = function(id, field, value) {
    const row = state.rows.find(r => r.id === id);
    if (row) {
        row[field] = value;
        // If changed fields affect total, render again to update amounts.
        // Optimizing this to not re-render full list for input focus loss issues:
        // Only re-calculate totals and update the specific row amount display
        const amtDiv = document.querySelector(`button[onclick="removeRow(${id})"]`).previousElementSibling.querySelector('.font-bold');
        amtDiv.textContent = `₹${(parseFloat(row.book || 0) * parseFloat(row.rate || 0)).toFixed(2)}`;
        calculateTotals();
    }
};

window.removeRow = function(id) {
    if (state.rows.length > 1) {
        state.rows = state.rows.filter(r => r.id !== id);
        renderRows();
    }
};

window.addNewRow = function() {
    if (state.rows.length < 9) {
        state.rows.push({ id: state.rowIdCounter++, particular: "", book: "", rate: "" });
        renderRows();
    }
};

function calculateTotals() {
    let copies = 0;
    let total = 0;
    
    state.rows.forEach(r => {
        copies += parseFloat(r.book || 0);
        total += parseFloat(r.book || 0) * parseFloat(r.rate || 0);
    });
    
    // Tally Pending = Total - (PreviousPaid + CurrentPaid)
    const currentPaid = state.totals.paid || 0;
    const previousPaid = state.totals.previousPaid || 0;
    let totalPaid = previousPaid + currentPaid;
    let pending = total - totalPaid;

    // ensure pending is not negative? or allow it (refund)?
    // Usually pending >= 0. But if paid > total, pending is -ve (overpayment). Allow it.
    
    state.totals.copies = copies;
    state.totals.amount = total.toFixed(2);
    state.totals.pending = pending.toFixed(2);
    
    document.getElementById('totalCopies').textContent = state.totals.copies;
    document.getElementById('totalAmount').textContent = state.totals.amount;
    document.getElementById('pendingAmount').textContent = state.totals.pending;
}

function prepareSubmissionData() {
    const username = sessionStorage.getItem('username') || 'Unknown';
    const payload = {
        action: 'update',
        orderid: state.orderId, // Note: Script expects 'orderid' lowercase based on previous code
        name: state.customer.name,
        phone: state.customer.phone,
        gst: state.customer.gst,
        code: state.customer.code,
        address: state.customer.address,
        count: state.rows.length,
        noOfCopies: state.totals.copies,
        totalamt: state.totals.amount,
        amountPaid: state.totals.paid, // Send Amount Paid
        pendingamt: state.totals.pending,
        apiToken: CONFIG.API_TOKEN,
        
        // User Tracking
        createdByUser: state.orderData.createdByUser || '', // Preserve original creator
        lastUpdatedByUser: username, // Update last updater
        
        // Preserve existing fields
        paid: state.orderData.paid || 0,
        paymentId: state.orderData.paymentId || "",
        paymentStatus: state.orderData.paymentStatus || "",
        paymentRef: state.orderData.paymentRef || ""
    };

    // Flatten rows
    state.rows.forEach((row, i) => {
        payload[`particular${i + 1}`] = row.particular;
        payload[`book${i + 1}`] = row.book;
        payload[`rate${i + 1}`] = row.rate;
    });
    // Clear remaining slots if row count decreased
    for(let i = state.rows.length + 1; i <= 9; i++) {
        payload[`particular${i}`] = "";
        payload[`book${i}`] = "";
        payload[`rate${i}`] = "";
    }

    return payload;
}

async function handleUpdate(e) {
    e.preventDefault();
    const btn = document.getElementById('updateBtn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Updating...`;
    
    const payload = prepareSubmissionData();

    try {
        const res = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const response = await res.json();

        if (response.result === 'success') {
            showStatus('updateResultStatus', 'success', ` Order updated successfully!`);
            // Update local state to match saved
            state.orderData = { ...state.orderData, ...payload };
            // Show download options
            document.getElementById('updateForm').classList.add('hidden');
            document.getElementById('downloadSection').classList.remove('hidden');
        } else {
            throw new Error(response.message || 'Update failed');
        }
    } catch (err) {
        showStatus('updateResultStatus', 'error', ` ${err.message}`);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
