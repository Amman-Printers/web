document.addEventListener('DOMContentLoaded', () => {
    // if (!sessionStorage.getItem('isLoggedIn')) {
    //     window.location.href = 'index.html';
    // }
    
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
        // MOCK FETCH
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate finding order
        if (id === '123' || true) { // Always find for demo
             const mockOrder = {
                orderid: id,
                name: 'Test Customer',
                totalamt: '1500.00',
                paymentStatus: 'Pending'
            };
            
            document.getElementById('updName').value = mockOrder.name;
            document.getElementById('updTotal').value = mockOrder.totalamt;
            document.getElementById('updPayment').value = mockOrder.paymentStatus;
            
            container.classList.remove('hidden');
            statusDiv.innerHTML = '';
        } else {
            throw new Error('Order not found');
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
        // // MOCK UPDATE
        // await new Promise(resolve => setTimeout(resolve, 1000));
        
        // REAL UPDATE
        await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update', orderid: id, paymentStatus: payment, name: name })
        });

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

    } catch (error) {
        statusDiv.innerHTML = `<div class="text-center text-red-500">Update failed.</div>`;
    }
}
