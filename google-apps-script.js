/**
 * Google Apps Script Web App Backend for Management OS
 * Deploy this script as a Web App:
 * 1. Open your Google Spreadsheet: https://docs.google.com/spreadsheets/d/1XPcrfF-DGy54B_wnHb-mtbfcWPTjGSBdF2714d6fFBY
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code with this file
 * 4. Click Deploy > Manage Deployments > Edit > Version: New Version > Deploy
 * 5. Ensure "Who has access" is set to "Anyone"
 */
const SPREADSHEET_ID = '1XPcrfF-DGy54B_wnHb-mtbfcWPTjGSBdF2714d6fFBY';

function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (err) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return response({ ok: false, error: 'doPost ต้องเรียกผ่าน Web App HTTP POST' });
  }

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return response({ ok: false, error: 'Malformed JSON: ' + err.message });
  }

  const ss = getSpreadsheet();
  const action = payload.action || 'append';

  // 1. UPDATE COST & LOG PRICE TREND (Sheet: Store-1 & แนวโน้มราคา)
  if (action === 'updateCost') {
    const storeSheet = ss.getSheetByName('Store-1');
    if (!storeSheet) return response({ ok: false, error: 'Sheet Store-1 not found' });

    const lastRow = storeSheet.getLastRow();
    const names = storeSheet.getRange(2, 2, Math.max(lastRow - 1, 1), 1).getValues().flat();
    const targetIdx = names.findIndex(name => String(name).trim() === String(payload.name).trim());

    if (targetIdx >= 0) {
      const rowIndex = targetIdx + 2;
      const qty = Number(storeSheet.getRange(rowIndex, 3).getValue()) || 1;
      const newPrice = Number(payload.newPrice);
      storeSheet.getRange(rowIndex, 5).setValue(newPrice); // Column E = price
      storeSheet.getRange(rowIndex, 6).setValue(newPrice / qty); // Column F = unitCost
    }

    // Append transition to "แนวโน้มราคา"
    let trendSheet = ss.getSheetByName('แนวโน้มราคา');
    if (!trendSheet) {
      trendSheet = ss.insertSheet('แนวโน้มราคา');
    }
    if (trendSheet.getLastRow() === 0) {
      trendSheet.appendRow(['วันที่บันทึก', 'วัตถุดิบ', 'หมวดหมู่', 'ราคาเดิม', 'ราคาใหม่', '% เปลี่ยนแปลง', 'ต้นทุนเดิม/หน่วย', 'ต้นทุนใหม่/หน่วย']);
    }
    const dateStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    trendSheet.appendRow([
      dateStr,
      payload.name,
      payload.category || '',
      Number(payload.oldPrice) || 0,
      Number(payload.newPrice) || 0,
      payload.pctChange || '',
      Number(payload.oldUnitCost) || 0,
      Number(payload.newUnitCost) || 0
    ]);

    return response({ ok: true, action: 'updateCost', name: payload.name, at: new Date().toISOString() });
  }

  // 2. STORE-1 INVENTORY / PRODUCTION LOG CRUD (Columns P to V)
  if (payload.sheet === 'Store-1' && (action === 'updateStoreInventory' || action === 'deleteStoreInventory' || action === 'appendStoreInventory')) {
    const storeSheet = ss.getSheetByName('Store-1');
    if (!storeSheet) return response({ ok: false, error: 'Sheet Store-1 not found' });

    if (action === 'appendStoreInventory') {
      let r = 2;
      while (storeSheet.getRange(r, 16).getValue() !== '' && r < 2000) {
        r++;
      }
      storeSheet.getRange(r, 16, 1, 7).setValues([[
        payload.row.date || '',
        payload.row.menu || '',
        payload.row.package || '',
        Number(payload.row.quantity) || 0,
        Number(payload.row.damage) || 0,
        Number(payload.row.sales) || 0,
        Number(payload.row.loss) || 0
      ]]);
      return response({ ok: true, action: 'appendStoreInventory', rowIndex: r, at: new Date().toISOString() });
    }

    const targetRow = Number(payload.rowIndex) || findProductionRow(storeSheet, payload.original);
    if (targetRow >= 2) {
      if (action === 'deleteStoreInventory') {
        storeSheet.getRange(targetRow, 16, 1, 7).clearContent();
        return response({ ok: true, action: 'deleteStoreInventory', rowIndex: targetRow, at: new Date().toISOString() });
      }
      if (action === 'updateStoreInventory') {
        storeSheet.getRange(targetRow, 16, 1, 7).setValues([[
          payload.row.date || '',
          payload.row.menu || '',
          payload.row.package || '',
          Number(payload.row.quantity) || 0,
          Number(payload.row.damage) || 0,
          Number(payload.row.sales) || 0,
          Number(payload.row.loss) || 0
        ]]);
        return response({ ok: true, action: 'updateStoreInventory', rowIndex: targetRow, at: new Date().toISOString() });
      }
    }
    return response({ ok: false, error: 'Target row in Store-1 not found' });
  }

  // 3. GENERAL SHEET ACTIONS (Accounts, Investment, etc.)
  const sheetName = payload.sheet;
  if (!sheetName) return response({ ok: false, error: 'Sheet name required' });

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return response({ ok: false, error: `Sheet not found: ${sheetName}` });

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());

  if (action === 'delete') {
    let targetRow = Number(payload.rowIndex);
    if (!targetRow || targetRow < 2) {
      targetRow = findRowIndex(sheet, payload.original, headers);
    }
    if (targetRow && targetRow >= 2 && targetRow <= sheet.getLastRow()) {
      sheet.deleteRow(targetRow);
      return response({ ok: true, action: 'delete', rowIndex: targetRow, at: new Date().toISOString() });
    }
    return response({ ok: false, error: 'Record to delete not found' });
  }

  if (action === 'update') {
    let targetRow = Number(payload.rowIndex);
    if (!targetRow || targetRow < 2) {
      targetRow = findRowIndex(sheet, payload.original || payload.row, headers);
    }
    if (targetRow && targetRow >= 2 && targetRow <= sheet.getLastRow()) {
      const rowValues = headers.map(h => {
        const key = headerKey(h);
        return payload.row[key] !== undefined ? payload.row[key] : (payload.row[h] ?? '');
      });
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
      return response({ ok: true, action: 'update', rowIndex: targetRow, at: new Date().toISOString() });
    }
    return response({ ok: false, error: 'Record to update not found' });
  }

  if (action === 'append') {
    if (!payload.row) return response({ ok: false, error: 'Row data required' });
    const rowValues = headers.map(h => {
      const key = headerKey(h);
      return payload.row[key] !== undefined ? payload.row[key] : (payload.row[h] ?? '');
    });
    sheet.appendRow(rowValues);
    return response({ ok: true, action: 'append', rowIndex: sheet.getLastRow(), at: new Date().toISOString() });
  }

  return response({ ok: false, error: `Unsupported action: ${action}` });
}

function findProductionRow(sheet, target) {
  if (!target) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const data = sheet.getRange(2, 16, lastRow - 1, 2).getValues(); // Cols P & Q
  for (let i = 0; i < data.length; i++) {
    const d = String(data[i][0]).trim();
    const m = String(data[i][1]).trim();
    if ((d.includes(target.date) || target.date.includes(d)) && m === target.menu) {
      return i + 2;
    }
  }
  return -1;
}

function findRowIndex(sheet, target, headers) {
  if (!target) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    let match = true;
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      const key = headerKey(h);
      if (target[key] !== undefined) {
        const cellVal = String(row[c]).trim();
        const targetVal = String(target[key]).trim();
        if (cellVal !== targetVal && Math.abs(Number(cellVal) - Number(targetVal)) > 0.01) {
          match = false;
          break;
        }
      }
    }
    if (match) return i + 2;
  }
  return -1;
}

function doGet() {
  return response({
    ok: true,
    service: 'management-sheets-bridge',
    version: '2.1.0',
    message: 'Web App พร้อมรับ POST (append, update, delete, updateCost, Store-1 inventory) จาก Management Dashboard'
  });
}

function headerKey(header) {
  const map = {
    'วันที่': 'date',
    'ว/ด/ป': 'date',
    'บัญชี': 'account',
    'บัญชีต้นทาง': 'account',
    'บัญชี - ต้นทาง': 'account',
    'รายการ': 'title',
    'ชื่อรายการ': 'title',
    'หมวดหมู่': 'category',
    'ประเภท': 'type',
    'ปลายทาง': 'to',
    'บัญชีปลายทาง': 'to',
    'บัญชี - ปลายทาง': 'to',
    'จำนวนเงิน': 'amount',
    'ยอดเงิน': 'amount',
    'ยอด (บาท)': 'amount'
  };
  return map[header] || header;
}

function response(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
