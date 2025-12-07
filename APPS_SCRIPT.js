// CONFIG
const LOGIN_SHEET = 'Login';
const ORDER_SHEET = 'Orders';

const API_TOKEN = 'gfghguytuyghgght6756hgfh67r';

// Entry Points
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    return handleRequest(e);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    return handleRequest(e);
  } finally {
    lock.releaseLock();
  }
}

// Request Dispatcher
function handleRequest(e) {
  const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  let params = {};

  try {
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }
  } catch (err) {
    return output.setContent(JSON.stringify({ result: 'error', message: 'Invalid JSON' }));
  }

  // Verify API Token
  const receivedToken = params.apitoken || params.apiToken;
  if (!receivedToken || receivedToken !== API_TOKEN) {
      return output.setContent(JSON.stringify({ result: 'error', message: 'Invalid API Token' }));
  }

  const action = params.action || '';

  try {
    switch (action) {
      case 'login':
        return output.setContent(JSON.stringify(handleLogin(params)));

      case 'create':
        return output.setContent(JSON.stringify(handleCreateOrder(params)));

      case 'getOrders':
        return output.setContent(JSON.stringify(handleGetOrders(params)));

      case 'update':
        return output.setContent(JSON.stringify(handleUpdateOrder(params)));

      default:
        return output.setContent(JSON.stringify({ result: 'error', message: 'Unknown action' }));
    }
  } catch (err) {
    return output.setContent(JSON.stringify({ result: 'error', error: err.toString() }));
  }
}

// Get/Create Sheet
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);

    if (name === LOGIN_SHEET) {
      sheet.appendRow(['Mail', 'pwd']);
      sheet.appendRow(['admin', 'admin']); // Default login
    }

    if (name === ORDER_SHEET) {
      const headers = [
        "orderid", "name", "phone", "gst", "code", "address",
        "particular1", "book1", "rate1",
        "particular2", "book2", "rate2",
        "particular3", "book3", "rate3",
        "particular4", "book4", "rate4",
        "particular5", "book5", "rate5",
        "particular6", "book6", "rate6",
        "particular7", "book7", "rate7",
        "particular8", "book8", "rate8",
        "particular9", "book9", "rate9",
        "count", "noOfCopies", "totalamt", "paid", // pendingamt removed
        "paymentId", "paymentStatus", "paymentRef",
        "lastUpdateTimestamp", "orderDate",
        "createdByUser", "lastUpdatedByUser" // Added User Tracking
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

// LOGIN Handler
function handleLogin(params) {
  const sheet = getSheet(LOGIN_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == params.user && data[i][1] == params.password) {
      return { result: 'success', message: 'Login successful' };
    }
  }
  return { result: 'error', message: 'Invalid credentials' };
}

// CREATE Order Handler
function handleCreateOrder(params) {
  const sheet = getSheet(ORDER_SHEET);
  const lastRow = sheet.getLastRow();

  const orderId = lastRow === 1 ? 1001 : (parseInt(sheet.getRange(lastRow, 1).getValue()) + 1);

  const now = new Date();
  const orderDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd-MMM-yyyy");
  const timestamp = now.toISOString();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    if (header === "orderid") return orderId;
    if (header === "lastUpdateTimestamp") return timestamp;
    if (header === "orderDate") return orderDate;
    if (header === "createdByUser") return params.createdByUser || "";
    if (header === "lastUpdatedByUser") return params.lastUpdatedByUser || "";
    return params[header] || "";
  });

  sheet.appendRow(row);

  const resultObj = {};
  headers.forEach((h, i) => resultObj[h] = row[i]);

  return { result: 'success', data: resultObj };
}

// GET Orders Handler
function handleGetOrders(params) {
  const sheet = getSheet(ORDER_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // Params for filtering
  // Expect params.month (0-11) and params.year (YYYY)
  // If provided, we scan ALL data. If not provided, we stick to default pagination (last 50).
  const filterMonth = (params && params.month !== undefined && params.month !== "") ? parseInt(params.month) : null;
  const filterYear = (params && params.year !== undefined && params.year !== "") ? parseInt(params.year) : null;
  
  const hasFilter = (filterMonth !== null && filterYear !== null);
  
  // If hasFilter, scan from row 1. Else scan last 50.
  const start = hasFilter ? 1 : Math.max(1, data.length - 50);

  for (let i = start; i < data.length; i++) {
    // Check Filter First
    if (hasFilter) {
       const dateCol = headers.indexOf("orderDate");
       if (dateCol > -1) {
           const cellValue = data[i][dateCol];
           let recordDate = null;

           if (cellValue instanceof Date) {
               // It's already a date object
               recordDate = cellValue;
           } else if (typeof cellValue === 'string') {
               // Try parsing string
               const parsed = new Date(cellValue);
               if (!isNaN(parsed.getTime())) {
                   recordDate = parsed;
               }
           }
           
           // If we have a valid date, check against filter
           if (recordDate) {
               if (recordDate.getMonth() !== filterMonth || recordDate.getFullYear() !== filterYear) {
                   continue; // Skip if no match
               }
           }
       }
    }

    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    
    // Dynamically calculate pending for frontend compatibility
    // resultObj.pendingamt is not in sheet anymore, assume total - paid
    const total = parseFloat(obj.totalamt || 0);
    const paid = parseFloat(obj.paid || 0);
    obj.pendingamt = (total - paid).toFixed(2);
    
    results.push(obj);
  }

  return { result: 'success', data: results.reverse() };
}

// UPDATE Order Handler
function handleUpdateOrder(params) {
  const sheet = getSheet(ORDER_SHEET);
  const data = sheet.getDataRange().getValues();
  const orderId = params.orderid;
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == orderId) {
      const rowIdx = i + 1;

      Object.keys(params).forEach(key => {
        // Skip special handling fields
        if (key === 'amountPaid') return;
        
        const colIdx = headers.indexOf(key);
        if (colIdx > -1) {
          sheet.getRange(rowIdx, colIdx + 1).setValue(params[key]);
        }
      });
      
      // Handle Incremental Payment
      if (params.amountPaid) {
          const paidCol = headers.indexOf("paid");
          if (paidCol > -1) {
              const currentPaid = parseFloat(data[i][paidCol] || 0);
              const additional = parseFloat(params.amountPaid || 0);
              const newTotalPaid = currentPaid + additional;
              sheet.getRange(rowIdx, paidCol + 1).setValue(newTotalPaid);
              
              // Update status?
              const totalCol = headers.indexOf("totalamt");
              const statusCol = headers.indexOf("paymentStatus");
              if (totalCol > -1 && statusCol > -1) {
                  // Note: params.totalamt might be updated in this very request, so check params first, else sheet
                  const total = params.totalamt ? parseFloat(params.totalamt) : parseFloat(data[i][totalCol] || 0);
                  const status = (newTotalPaid >= total) ? "Paid" : "Pending";
                  sheet.getRange(rowIdx, statusCol + 1).setValue(status);
              }
          }
      }

      const timeCol = headers.indexOf("lastUpdateTimestamp");
      if(timeCol > -1) sheet.getRange(rowIdx, timeCol + 1).setValue(new Date().toISOString());
      
      return { result: 'success', message: 'Order updated' };
    }
  }

  return { result: 'error', message: 'Order not found' };
}

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Login Sheet
  let loginSheet = doc.getSheetByName(LOGIN_SHEET);
  if (!loginSheet) {
    loginSheet = doc.insertSheet(LOGIN_SHEET);
    loginSheet.appendRow(['Mail', 'pwd']);
    loginSheet.appendRow(['admin', 'admin']); // Default user
    loginSheet.setFrozenRows(1);
    SpreadsheetApp.getUi().alert("Login sheet created successfully!");
  }

  // Setup Orders Sheet
  let ordersSheet = doc.getSheetByName(ORDER_SHEET);
  if (!ordersSheet) {
    ordersSheet = doc.insertSheet(ORDER_SHEET);

    const headers = [
      "orderid", "name", "phone", "gst", "code", "address",
      "particular1", "book1", "rate1",
      "particular2", "book2", "rate2",
      "particular3", "book3", "rate3",
      "particular4", "book4", "rate4",
      "particular5", "book5", "rate5",
      "particular6", "book6", "rate6",
      "particular7", "book7", "rate7",
      "particular8", "book8", "rate8",
      "particular9", "book9", "rate9",
      "count", "noOfCopies", "totalamt", "paid", // pendingamt removed
      "paymentId", "paymentStatus", "paymentRef",
      "lastUpdateTimestamp", "orderDate",
      "createdByUser", "lastUpdatedByUser"
    ];

    ordersSheet.appendRow(headers);
    ordersSheet.setFrozenRows(1);
    SpreadsheetApp.getUi().alert("Orders sheet created successfully!");
  }
}
