
async function generateOrderPDF(queryData) {
    if (typeof PDFLib === 'undefined') {
        alert('PDFLib library is not loaded. Please check your internet connection or try refreshing the page.');
        console.error('PDFLib is not defined');
        return;
    }
    const { PDFDocument, StandardFonts } = PDFLib;
    
    // Convert Base64 string to Uint8Array
    // Access PDF_TEMPLATE from global scope or include it - assuming PDF_TEMPLATE is global from pdfTemplate.js
    const formPdfBytes = Uint8Array.from(atob(PDF_TEMPLATE), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(formPdfBytes);
    const form = pdfDoc.getForm();

    const safeGet = (name) => {
        try { return form.getTextField(name); } catch { return { setText: () => {} }; }
    };

    const orderId = queryData.orderid || "IN-00";

    safeGet("name").setText((queryData.name || "").toString());
    safeGet("gst").setText((queryData.gst || "").toString());
    safeGet("code").setText((queryData.code || "").toString());
    safeGet("orderid").setText(orderId.toString());
    safeGet("address").setText((queryData.address || "").toString());
    safeGet("orderDate").setText((queryData.orderDate || "").toString());

    let allAmt = 0;
    // Main PDF Table population
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

    // Force total from data if present and matching? No, recalculate for consistency or use passed total?
    // Using passed total might be safer if backend calculated it differently, but for now we recalculate to match client logic.
    // Actually, status page might have correct total in `totalamt`. 
    // BUT the form logic recalculates `allAmt` from rows. Let's stick to recalculating from rows if rows exist, 
    // but in status page we likely don't have individual rows as separate fields unless we fetch them or parse them.
    // WAIT. The status API returns ONE object per order. Does it return particular1, book1 etc?
    // Looking at APPS_SCRIPT.js handleCreateOrder appends params.
    // handleGetOrders returns the row data. So yes, particular1...8 should be there if they were saved!
    // So logic remains valid.

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
    
    // Main PDF text
    safeGet("ru").setText(numToWords(allAmt.toFixed(2)));


    try { form.flatten(); } catch (err) {}

    // Thermal Printer Page
    try {
        const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const mmToPt = (mm) => (mm / 25.4) * 72;
        const pageWidth = Math.round(mmToPt(80));
        
        const items = [];
        // Loop up to 9 as per form.js loop, though main pdf only supports 8? 
        // form.js loop for thermal uses 9.
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
        const igst3Amount = subTotalAmount * 0;
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
        thermalPage.drawText(`Bill No: ${orderId}`, { x: left, y: y, size: 9, font: helvBold });

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
