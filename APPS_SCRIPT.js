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
        return output.setContent(JSON.stringify(handleGetOrders()));

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
        "count", "noOfCopies", "totalamt", "pendingamt", "paid",
        "paymentId", "paymentStatus", "paymentRef",
        "lastUpdateTimestamp", "orderDate"
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
    return params[header] || "";
  });

  sheet.appendRow(row);

  const resultObj = {};
  headers.forEach((h, i) => resultObj[h] = row[i]);

  return { result: 'success', data: resultObj };
}

// GET Orders Handler
function handleGetOrders() {
  const sheet = getSheet(ORDER_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  const start = Math.max(1, data.length - 50);

  for (let i = start; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
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
        const colIdx = headers.indexOf(key);
        if (colIdx > -1) {
          sheet.getRange(rowIdx, colIdx + 1).setValue(params[key]);
        }
      });

      sheet.getRange(rowIdx, headers.indexOf("lastUpdateTimestamp") + 1)
        .setValue(new Date().toISOString());

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
      "count", "noOfCopies", "totalamt", "pendingamt", "paid",
      "paymentId", "paymentStatus", "paymentRef",
      "lastUpdateTimestamp", "orderDate"
    ];

    ordersSheet.appendRow(headers);
    ordersSheet.setFrozenRows(1);
    SpreadsheetApp.getUi().alert("Orders sheet created successfully!");
  }
}
