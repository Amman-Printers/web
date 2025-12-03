// Google Apps Script Code
// Copy and paste this into your Google Apps Script project

const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual Sheet ID

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Enable CORS
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Handle CORS preflight or simple requests
  // Note: GAS doesn't fully support OPTIONS, but we can return JSON for everything
  
  let params = {};
  
  try {
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }
  } catch (err) {
    return output.setContent(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
  }

  const action = params.action;
  
  try {
    let result;
    switch (action) {
      case 'login':
        result = handleLogin(params);
        break;
      case 'create':
        result = handleCreateOrder(params);
        break;
      case 'getOrders':
        result = handleGetOrders(params);
        break;
      case 'update':
        result = handleUpdateOrder(params);
        break;
      default:
        result = { status: 'error', message: 'Unknown action' };
    }
    return output.setContent(JSON.stringify(result));
  } catch (err) {
    return output.setContent(JSON.stringify({ status: 'error', message: err.toString() }));
  }
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Initialize headers if new
    if (name === 'Login') {
      sheet.appendRow(['Mail', 'pwd']);
      sheet.appendRow(['admin', 'admin']); // Default user
    } else if (name === 'Orders') {
      const headers = [
        'orderid', 'name', 'phone', 'gst', 'code', 'address',
        'particular1', 'book1', 'rate1', 'particular2', 'book2', 'rate2',
        'particular3', 'book3', 'rate3', 'particular4', 'book4', 'rate4',
        'particular5', 'book5', 'rate5', 'particular6', 'book6', 'rate6',
        'particular7', 'book7', 'rate7', 'particular8', 'book8', 'rate8',
        'particular9', 'book9', 'rate9',
        'count', 'noOfCopies', 'totalamt', 'pendingamt', 'paid',
        'paymentId', 'paymentStatus', 'paymentRef', 'lastUpdateTimestamp', 'orderDate'
      ];
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

function handleLogin(params) {
  const sheet = getSheet('Login');
  const data = sheet.getDataRange().getValues();
  // Skip header
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == params.user && data[i][1] == params.password) {
      return { status: 'success', message: 'Login successful' };
    }
  }
  return { status: 'error', message: 'Invalid credentials' };
}

function handleCreateOrder(params) {
  const sheet = getSheet('Orders');
  const lastRow = sheet.getLastRow();
  // Generate Order ID (simple increment or timestamp)
  const orderId = lastRow === 1 ? 1001 : (parseInt(sheet.getRange(lastRow, 1).getValue()) + 1);
  
  const now = new Date();
  const orderDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MMM-yyyy");
  const timestamp = now.toISOString();

  const rowData = [
    orderId, params.name, params.phone, params.gst, params.code, params.address,
    params.particular1, params.book1, params.rate1,
    params.particular2, params.book2, params.rate2,
    params.particular3, params.book3, params.rate3,
    params.particular4, params.book4, params.rate4,
    params.particular5, params.book5, params.rate5,
    params.particular6, params.book6, params.rate6,
    params.particular7, params.book7, params.rate7,
    params.particular8, params.book8, params.rate8,
    params.particular9, params.book9, params.rate9,
    params.count, params.noOfCopies, params.totalamt, params.pendingamt, params.paid,
    params.paymentId, params.paymentStatus || 'Pending', params.paymentRef, timestamp, orderDate
  ];

  sheet.appendRow(rowData);
  
  // Return the created order object
  const resultObj = {};
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, index) => {
    resultObj[header] = rowData[index];
  });

  return { status: 'success', result: [resultObj] };
}

function handleGetOrders(params) {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  
  // Return last 50 orders for performance
  const start = Math.max(1, data.length - 50);
  
  for (let i = start; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    results.push(obj);
  }
  
  return { status: 'success', result: results.reverse() }; // Newest first
}

function handleUpdateOrder(params) {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const orderId = params.orderid;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == orderId) { // Assuming orderid is first column
      const rowIdx = i + 1;
      
      // Update specific fields
      if (params.paymentStatus) sheet.getRange(rowIdx, 40).setValue(params.paymentStatus); // paymentStatus col index (approx)
      if (params.name) sheet.getRange(rowIdx, 2).setValue(params.name);
      // Add more fields as needed. Better to map column names to indices dynamically.
      
      // Dynamic update based on headers
      const headers = data[0];
      for (const key in params) {
        const colIdx = headers.indexOf(key);
        if (colIdx > -1) {
           sheet.getRange(rowIdx, colIdx + 1).setValue(params[key]);
        }
      }

      return { status: 'success', message: 'Order updated' };
    }
  }
  return { status: 'error', message: 'Order not found' };
}
