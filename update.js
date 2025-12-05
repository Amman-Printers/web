document.addEventListener('DOMContentLoaded', () => {
    // Auth handled by auth.js
    
    document.getElementById('updateForm').addEventListener('submit', handleUpdate);
});

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

async function loadOrder() {
    const id = document.getElementById('searchId').value;
    const container = document.getElementById('updateFormContainer');
    const statusDiv = document.getElementById('updateStatus');
    
    if (!id) return;
    
    statusDiv.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';
    container.classList.add('hidden');

    try {
        const res = await fetch(CONFIG.SCRIPT_URL + '?action=getOrders');
        const data = await res.json();
        
        if (data.result === 'success') {
            const order = data.data.find(o => o.orderid.toString() === id.toString());
            
            if (order) {
                document.getElementById('updName').value = order.name;
                document.getElementById('updTotal').value = order.totalamt;
                document.getElementById('updPayment').value = order.paymentStatus;
                
                container.classList.remove('hidden');
                statusDiv.innerHTML = '';
            } else {
                throw new Error('Order not found');
            }
        } else {
            throw new Error(data.message || 'Failed to fetch orders');
        }

    } catch (error) {
        statusDiv.innerHTML = `<div class="text-center text-red-500">${error.message}</div>`;
    }
}

async function handleUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('searchId').value;
    const payment = document.getElementById('updPayment').value;
    const name = document.getElementById('updName').value;
    const statusDiv = document.getElementById('updateStatus');
    
    statusDiv.innerHTML = '<div class="text-center text-gray-500">Updating...</div>';

    try {
        const res = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update', orderid: id, paymentStatus: payment, name: name })
        });
        const response = await res.json();

        if (response.result === 'success') {
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-sm animate-fade-in mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-600 flex-shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <strong class="font-bold block">Order Updated!</strong>
                        <span class="text-sm opacity-90">Order #${id} has been successfully updated.</span>
                    </div>
                </div>
            `;
        } else {
             throw new Error(response.message || 'Update failed');
        }

    } catch (error) {
        statusDiv.innerHTML = `<div class="text-center text-red-500">${error.message || 'Update failed.'}</div>`;
    }
}
