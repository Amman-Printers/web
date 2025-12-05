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

    payload.noOfCopies = tempNoOfCopies;
    payload.totalamt = tempTotalAmount.toFixed(2);
    payload.pendingamt = tempTotalAmount.toFixed(2);
    payload.paid = "";
    payload.paymentId = "";
    payload.paymentStatus = "";
    payload.paymentRef = "";
    payload.action = 'create'; // For GAS


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
    if (typeof PDFLib === 'undefined') {
        alert('PDFLib library is not loaded. Please check your internet connection or try refreshing the page.');
        console.error('PDFLib is not defined');
        return;
    }
    const { PDFDocument, StandardFonts } = PDFLib;
    
    // Convert Base64 string to Uint8Array
    const formPdfBytes = Uint8Array.from(atob(PDF_TEMPLATE), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(formPdfBytes);
    const form = pdfDoc.getForm();

    const safeGet = (name) => {
        try { return form.getTextField(name); } catch { return { setText: () => {} }; }
    };

    safeGet("name").setText((queryData.name || "").toString());
    safeGet("gst").setText((queryData.gst || "").toString());
    safeGet("code").setText((queryData.code || "").toString());
    safeGet("orderid").setText((queryData.orderid || "").toString());
    safeGet("address").setText((queryData.address || "").toString());
    safeGet("orderDate").setText((queryData.orderDate || "").toString());

    let allAmt = 0;
    for (let i = 1; i <= 8; i++) {
        const bk = parseFloat(queryData[`book${i}`] || 0);
        const rt = parseFloat(queryData[`rate${i}`] || 0);
        
        if (bk > 0 || (queryData[`particular${i}`] || "") !== "") {
            safeGet(`sn${i}`).setText(i.toString());
            safeGet(`b${i}`).setText((queryData[`book${i}`] || "").toString());
            safeGet(`p${i}`).setText((queryData[`particular${i}`] || "").toString());
            safeGet(`r${i}`).setText((queryData[`rate${i}`] || "").toString());
            
            const amt = (bk * rt).toFixed(2);
            safeGet(`a${i}`).setText(amt.split(".")[0] || "0");
            safeGet(`pa${i}`).setText(amt.split(".")[1] || "00");
            allAmt += parseFloat(amt);
        }
    }

    safeGet("at").setText(Math.floor(allAmt).toString());
    safeGet("pat").setText(((allAmt % 1) * 100).toFixed(0).padStart(2, "0"));

    const numToWords = (n) => {
             const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
             const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
             const num = parseFloat(n).toFixed(2);
             const [whole, fraction] = num.split('.');
             const convert = (num) => {
                 if ((num = num.toString()).length > 9) return 'overflow';
                 n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                 if (!n) return; var str = '';
                 str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                 str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                 str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                 str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                 str += (n[5] != 0) ? ((str != '') ? 'And ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])  : '';
                 return str;
             };
             let str = convert(whole) + "Rupees ";
             if (parseInt(fraction) > 0) { str += "And " + convert(fraction) + "Paise "; }
             return str + "Only";
        };
    
    safeGet("ru").setText(numToWords(allAmt));

    try { form.flatten(); } catch (err) {}

    // Thermal Printer Page
    try {
        const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const mmToPt = (mm) => (mm / 25.4) * 72;
        const pageWidth = Math.round(mmToPt(80));
        
        const items = [];
        for (let i = 1; i <= 9; i++) {
            const part = (queryData[`particular${i}`] || "").toString().trim();
            const bk = (queryData[`book${i}`] || "").toString().trim();
            const rt = (queryData[`rate${i}`] || "").toString().trim();
            if (part || bk || rt) {
                items.push({
                    sn: i.toString(),
                    part: part || "-",
                    qty: bk || "0",
                    rate: rt || "0.00",
                    amount: (parseFloat(bk || 0) * parseFloat(rt || 0)).toFixed(2),
                });
            }
        }

        // Calculations
        const subTotalAmount = allAmt;
        const igst3Amount = subTotalAmount * 0.03;
        // const igst5Amount = subTotalAmount * 0.05; // REMOVED as per request
        // const igst12Amount = subTotalAmount * 0.12; // REMOVED as per request
        const grandTotalAmount = subTotalAmount + igst3Amount; 


        // Dynamic Height Calculation estimate
        const headerHeight = 220; 
        const itemHeight = 14;
        const footerHeight = 150; 
        const pageHeight = headerHeight + (items.length * itemHeight) + footerHeight; 
        const thermalPage = pdfDoc.addPage([pageWidth, pageHeight]);

        let y = pageHeight - 15;
        const left = 10;
        const right = pageWidth - 10;
        const centerX = pageWidth / 2;

        // HELPER FUNCTIONS
        const drawCenterAligned = (text, y, options) => {
            const width = options.font.widthOfTextAtSize(text, options.size);
            thermalPage.drawText(text, { x: (pageWidth - width) / 2, y, size: options.size, font: options.font });
        };
        const drawRightAligned = (text, x, y, options) => {
            const width = options.font.widthOfTextAtSize(text, options.size);
            thermalPage.drawText(text, { x: x - width, y, size: options.size, font: options.font });
        };
        const drawSolidLine = (y) => {
             thermalPage.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: PDFLib.rgb(0, 0, 0) });
        };
        const drawDottedLine = (y) => {
             thermalPage.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: PDFLib.rgb(0, 0, 0), dashArray: [2, 2] });
        };

        // Number to Words Helper
        const numToWords = (n) => {
             const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
             const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
             const num = parseFloat(n).toFixed(2);
             const [whole, fraction] = num.split('.');
             const convert = (num) => {
                 if ((num = num.toString()).length > 9) return 'overflow';
                 n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                 if (!n) return; var str = '';
                 str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                 str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                 str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                 str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                 str += (n[5] != 0) ? ((str != '') ? 'And ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])  : '';
                 return str;
             };
             let str = convert(whole) + "Rupees ";
             if (parseInt(fraction) > 0) { str += "And " + convert(fraction) + "Paise "; }
             return str + "Only";
        };


        // ===================== HEADER SECTION =====================
        drawCenterAligned("TAX INVOICE", y, { size: 10, font: helvBold });
        y -= 12;

        drawCenterAligned("Sri Amman Printers", y, { size: 14, font: helvBold });
        y -= 14;

        const companyAddressLines = [
            "99, Bhavani Road, Near Anna Statue,",
            "Perundurai - 638052, Erode District,",
            "Tamil Nadu"
        ];
        for (const addrLine of companyAddressLines) {
            drawCenterAligned(addrLine, y, { size: 8, font: helv });
            y -= 9;
        }

        drawCenterAligned("Phone: 04294-222001", y, { size: 8, font: helv });
        y -= 9;

        drawCenterAligned("GSTIN: 33ADKFS4757P1ZA", y, { size: 8, font: helv });
        y -= 9;

        drawCenterAligned("State Code: 33", y, { size: 8, font: helv });
        y -= 12;

        drawDottedLine(y + 4);
        y -= 8;

        // ===================== BILL METADATA SECTION =====================
        thermalPage.drawText(`Bill No: ${queryData.orderid || orderId}`, { x: left, y: y, size: 9, font: helvBold });

        const dateStr = (queryData.orderDate || new Date().toISOString().split('T')[0]).toString();
        drawRightAligned(`Date: ${dateStr}`, right, y, { size: 9, font: helvBold });
        y -= 12;

        drawDottedLine(y + 2);
        y -= 8;

        // ===================== CUSTOMER INFO SECTION =====================
        thermalPage.drawText("TO:", { x: left, y: y, size: 9, font: helvBold });
        y -= 10;

        thermalPage.drawText((queryData.name || "").toString(), { x: left + 4, y: y, size: 9, font: helv });
        y -= 10;

        if (queryData.address) {
            thermalPage.drawText(`Address: ${(queryData.address || "").toString()}`, {
                x: left + 4, y: y, size: 8, font: helv,
                maxWidth: pageWidth - left * 2 - 4,
            });
            y -= 9;
            // Hacky manual wrap for second line if needed (not perfect but simple)
            if ((queryData.address || "").length > 35) y -= 9; 
        }

        if (queryData.gst) {
            thermalPage.drawText(`GSTIN: ${(queryData.gst || "").toString()}`, { x: left + 4, y: y, size: 8, font: helv });
            y -= 9;
        }

        if (queryData.code) {
            thermalPage.drawText(`State Code: ${(queryData.code || "").toString()}`, { x: left + 4, y: y, size: 8, font: helv });
            y -= 12;
        } else {
            y -= 3;
        }

        drawDottedLine(y + 4);
        y -= 8;

        // ===================== TABLE SECTION =====================
        const colSN = left;
        const colPart = left + 18;
        const colQty = left + 115; 
        const colRate = left + 155; 
        const colAmt = right;      

        // Table Headers
        thermalPage.drawText("SN", { x: colSN, y: y, size: 8, font: helvBold });
        thermalPage.drawText("Particulars", { x: colPart, y: y, size: 8, font: helvBold });
        drawRightAligned("Qty", colQty, y, { size: 8, font: helvBold });
        drawRightAligned("Rate", colRate, y, { size: 8, font: helvBold });
        drawRightAligned("Amount", colAmt, y, { size: 8, font: helvBold });
        y -= 10;

        drawSolidLine(y + 3);
        y -= 8;

        // Items
        for (const it of items) {
            thermalPage.drawText(it.sn, { x: colSN, y: y, size: 8, font: helv });

            let partText = it.part;
            if (partText.length > 22) partText = partText.slice(0, 22) + '..';
            thermalPage.drawText(partText, { x: colPart, y: y, size: 8, font: helv });

            drawRightAligned(it.qty, colQty, y, { size: 8, font: helv });
            drawRightAligned(it.rate, colRate, y, { size: 8, font: helv });
            drawRightAligned(it.amount, colAmt, y, { size: 8, font: helv });
            y -= 10;
        }

        drawSolidLine(y + 3);
        y -= 8;

        // ===================== TOTALS SECTION =====================
        const rightColLabel = right - 80;
        const rightColValue = right;

        drawRightAligned("Subtotal:", rightColLabel, y, { size: 8, font: helv });
        drawRightAligned(`Rs. ${subTotalAmount.toFixed(2)}`, rightColValue, y, { size: 8, font: helvBold });
        y -= 10;

        drawDottedLine(y + 2);
        y -= 8;

        // IGST 3% Only
        if (igst3Amount > 0) {
            drawRightAligned("IGST @ 3%:", rightColLabel, y, { size: 8, font: helv });
            drawRightAligned(`Rs. ${igst3Amount.toFixed(2)}`, rightColValue, y, { size: 8, font: helv });
            y -= 9;
        }

        drawSolidLine(y + 2);
        y -= 8;

        drawRightAligned("TOTAL:", rightColLabel, y, { size: 10, font: helvBold });
        drawRightAligned(`Rs. ${grandTotalAmount.toFixed(2)}`, rightColValue, y, { size: 10, font: helvBold });
        y -= 14;

        drawSolidLine(y + 4);
        y -= 10;

        const words = numToWords(grandTotalAmount);
        thermalPage.drawText("Amount (in words):", { x: left, y: y, size: 8, font: helvBold });
        y -= 10;
        
        if (words.length > 45) {
             thermalPage.drawText(words.substring(0, 45), { x: left + 5, y: y, size: 8, font: helv });
             y -= 9;
             thermalPage.drawText(words.substring(45), { x: left + 5, y: y, size: 8, font: helv });
        } else {
             thermalPage.drawText(words, { x: left + 5, y: y, size: 8, font: helv });
        }
        y -= 20;
        
        drawDottedLine(y + 10);
        drawCenterAligned("Thank You! Visit Again.", y, { size: 9, font: helv });

    } catch (err) {
        console.error("Thermal page failed", err);
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${orderId}_GSTin_Invoice.pdf`;
    link.click();
}
