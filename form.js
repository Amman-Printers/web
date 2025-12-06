let rows = [];
let idCounter = 1;
let queryData = {};
let orderId = "";

document.addEventListener('DOMContentLoaded', () => {
    // Check auth verified by auth.js

    // Initial row
    addRow();

    document.getElementById('addItemBtn').addEventListener('click', addRow);
    document.getElementById('orderForm').addEventListener('submit', handleSubmit);
    document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
});

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

function addRow() {
    if (rows.length >= 9) return;

    const id = idCounter++;
    const row = { id, particular: '', book: '', rate: '' };
    rows.push(row);

    const container = document.getElementById('itemsContainer');
    const rowEl = document.createElement('div');
    rowEl.className = "group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out";
    rowEl.id = `row-${id}`;
    rowEl.innerHTML = `
        <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-orange-200 z-10">
            ${rows.length}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div class="md:col-span-6">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Particulars</label>
                <input type="text" onchange="updateRow(${id}, 'particular', this.value)" placeholder="Item description" class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 border">
            </div>

            <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
                <input type="number" min="0" onchange="updateRow(${id}, 'book', this.value)" placeholder="0" class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600 border">
            </div>

            <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rate</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-400 sm:text-sm">₹</span>
                    </div>
                    <input type="number" step="0.01" min="0" onchange="updateRow(${id}, 'rate', this.value)" placeholder="0.00" class="w-full rounded-lg border-gray-300 bg-gray-50 focus:bg-white pl-7 pr-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500 transition-colors dark:bg-gray-700 dark:border-gray-600 border">
                </div>
            </div>

            <div class="md:col-span-2 flex items-center justify-between md:justify-end gap-4 pb-1">
                <div class="text-right">
                    <div class="text-xs text-gray-400 mb-1">Amount</div>
                    <div class="font-bold text-gray-800 dark:text-gray-100 text-lg" id="amount-${id}">₹0.00</div>
                </div>

                <button type="button" onclick="removeRow(${id})" class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        </div>
    `;
    container.appendChild(rowEl);
    updateUI();
}

function removeRow(id) {
    if (rows.length <= 1) return;
    rows = rows.filter(r => r.id !== id);
    document.getElementById(`row-${id}`).remove();
    
    // Re-index UI numbers
    const rowEls = document.querySelectorAll('#itemsContainer > div');
    rowEls.forEach((el, index) => {
        el.querySelector('.absolute').textContent = index + 1;
    });
    
    updateUI();
}

function updateRow(id, field, value) {
    const row = rows.find(r => r.id === id);
    if (row) {
        row[field] = value;
        if (field === 'book' || field === 'rate') {
            const amount = (parseFloat(row.book || 0) * parseFloat(row.rate || 0)).toFixed(2);
            document.getElementById(`amount-${id}`).textContent = `₹${amount}`;
        }
    }
    updateUI();
}

function updateUI() {
    let total = 0;
    rows.forEach(r => {
        total += (parseFloat(r.book || 0) * parseFloat(r.rate || 0));
    });
    document.getElementById('totalDisplay').textContent = total.toFixed(2);
    document.getElementById('itemCount').textContent = `${rows.length} items`;
    
    const addItemBtn = document.getElementById('addItemBtn');
    addItemBtn.disabled = rows.length >= 9;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitOrderBtn');
    const statusDiv = document.getElementById('formStatus');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Order...';
    statusDiv.innerHTML = '';

    const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        gst: document.getElementById('gst').value,
        code: document.getElementById('code').value,
        address: document.getElementById('address').value,
        count: rows.length,
        // ... calculate totals
    };

    let tempNoOfCopies = 0;
    let tempTotalAmount = 0;

    rows.forEach((r, i) => {
        const b = parseFloat(r.book || 0);
        const rt = parseFloat(r.rate || 0);
        tempNoOfCopies += b;
        tempTotalAmount += b * rt;
        
        payload[`particular${i + 1}`] = r.particular || "";
        payload[`book${i + 1}`] = r.book || "";
        payload[`rate${i + 1}`] = r.rate || "";
    });

    // Fill remaining rows with empty strings
    for (let i = rows.length; i < 9; i++) {
        payload[`particular${i + 1}`] = "";
        payload[`book${i + 1}`] = "";
        payload[`rate${i + 1}`] = "";
    }

    const username = sessionStorage.getItem('username') || 'Unknown';

    payload.noOfCopies = tempNoOfCopies;
    payload.totalamt = tempTotalAmount.toFixed(2);
    // payload.pendingamt removed as per requirements
    payload.paid = "0"; // Initialize as 0 or empty? "paid" field in create usually implies initial payment. 
                        // If user wants removed 'pendingamt', likely 'paid' is 0 initially.
                        // Existing code had payload.paid = "";. Use "0".
    payload.paymentId = "";
    payload.paymentStatus = "Pending"; // Default status
    payload.paymentRef = "";
    
    // User Tracking
    payload.createdByUser = username;
    payload.lastUpdatedByUser = username;
    
    payload.action = 'create'; // For GAS
    payload.apiToken = CONFIG.API_TOKEN;


    try {
        // REAL SUBMISSION
        const res = await fetch(CONFIG.SCRIPT_URL, {
           method: 'POST',
           body: JSON.stringify(payload)
        });
        const response = await res.json();

        if (response.result === 'success') {
            orderId = response.data.orderid;
            queryData = response.data;
            
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-sm animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-600 flex-shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <strong class="font-bold block">Order Created Successfully!</strong>
                        <span class="text-sm opacity-90">Order ID #${orderId}. You can now download the invoice.</span>
                    </div>
                </div>
            `;
            
            document.getElementById('downloadPdfBtn').classList.remove('hidden');
            document.getElementById('downloadPdfBtn').disabled = false;
            submitBtn.textContent = 'Order Created';
        } else {
            throw new Error(response.message || 'Submission failed');
        }

    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = `
            <div class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 shadow-sm animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-600 flex-shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                    <strong class="font-bold block">System Error</strong>
                    <span class="text-sm opacity-90">${error.message || 'Something went wrong. Please try again.'}</span>
                </div>
            </div>
        `;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Order';
    }
}

async function generatePDF() {
    await generateOrderPDF(queryData);
}
