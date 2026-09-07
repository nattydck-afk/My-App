/**
 * Management — Core Application & State Management
 * Google Sheets is the Source of Truth with Real-time Local Cache Fallback
 */

const SHEET_ID = '1XPcrfF-DGy54B_wnHb-mtbfcWPTjGSBdF2714d6fFBY';
const WRITE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwlxfhuUlixGbkC3srIRYydhe4Gpqx8OjFyWDNQRwSbtMg2iJYImRuIaoma5EbZpc-j/exec';

const thai = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
const money = n => thai.format(Number(n || 0));
const fmtDate = value => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
};
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Baseline seed data
const seed = {
  netAccounts: [
    { name: 'SCB Easy', balance: 48300, color: '#6366f1', icon: 'SCB' },
    { name: 'K PLUS', balance: 16180, color: '#10b981', icon: 'K+' },
    { name: 'Krungthai NEXT', balance: 8200, color: '#06b6d4', icon: 'KTB' },
    { name: 'ttb touch', balance: 12250, color: '#f97316', icon: 'TTB' },
    { name: 'KTC', balance: -18450, color: '#f43f5e', icon: 'KTC' },
    { name: 'Kept', balance: 25000, color: '#14b8a6', icon: 'Kept' },
    { name: 'TrueMoney', balance: 720, color: '#f97316', icon: 'TMN' },
    { name: 'Cash', balance: 3150, color: '#64748b', icon: 'Cash' },
    { name: 'Wallet', balance: 980, color: '#3b82f6', icon: 'Wallet' }
  ],
  costs: [
    { name: 'ขวด 220 ml.', category: 'บรรจุภัณฑ์', qty: 150, unit: 'ใบ', price: 226, originalPrice: 226, unitCost: 1.5067 },
    { name: 'ขวด 180 ml.', category: 'บรรจุภัณฑ์', qty: 150, unit: 'ใบ', price: 259, originalPrice: 259, unitCost: 1.7267 },
    { name: 'แก้ว 20 oz.', category: 'บรรจุภัณฑ์', qty: 50, unit: 'ใบ', price: 72, originalPrice: 72, unitCost: 1.44 },
    { name: 'ถุงแก้ว', category: 'บรรจุภัณฑ์', qty: 100, unit: 'ใบ', price: 20, originalPrice: 20, unitCost: 0.2 },
    { name: 'หลอด', category: 'บรรจุภัณฑ์', qty: 50, unit: 'อัน', price: 5, originalPrice: 5, unitCost: 0.1 },
    { name: 'สติกเกอร์', category: 'บรรจุภัณฑ์', qty: 100, unit: 'ชิ้น', price: 30, originalPrice: 30, unitCost: 0.3 },
    { name: 'กาแฟมังกรบิน', category: 'วัตถุดิบชง', qty: 1000, unit: 'กรัม', price: 95, originalPrice: 95, unitCost: 0.095 },
    { name: 'ชาเขียว', category: 'วัตถุดิบชง', qty: 200, unit: 'กรัม', price: 80, originalPrice: 80, unitCost: 0.4 },
    { name: 'ชาไทย', category: 'วัตถุดิบชง', qty: 190, unit: 'กรัม', price: 45, originalPrice: 45, unitCost: 0.2368 },
    { name: 'ชาอัสสัม', category: 'วัตถุดิบชง', qty: 250, unit: 'กรัม', price: 99, originalPrice: 99, unitCost: 0.396 },
    { name: 'โกโก้', category: 'วัตถุดิบชง', qty: 900, unit: 'กรัม', price: 180, originalPrice: 180, unitCost: 0.2 },
    { name: 'เฮลบลูบอย', category: 'วัตถุดิบชง', qty: 710, unit: 'กรัม', price: 69, originalPrice: 69, unitCost: 0.0972 },
    { name: 'เก๊กฮวย', category: 'วัตถุดิบชง', qty: 300, unit: 'กรัม', price: 105, originalPrice: 105, unitCost: 0.35 },
    { name: 'กระเจี๊ยบ', category: 'วัตถุดิบชง', qty: 1000, unit: 'กรัม', price: 138, originalPrice: 138, unitCost: 0.138 },
    { name: 'น้ำตาล', category: 'วัตถุดิบผสม', qty: 1000, unit: 'กรัม', price: 30, originalPrice: 30, unitCost: 0.03 },
    { name: 'น้ำตาลอ้อย', category: 'วัตถุดิบผสม', qty: 1000, unit: 'กรัม', price: 29, originalPrice: 29, unitCost: 0.029 },
    { name: 'ครีมเทียมดรีมมี', category: 'วัตถุดิบผสม', qty: 10000, unit: 'กรัม', price: 801, originalPrice: 801, unitCost: 0.0801 },
    { name: 'นมข้นหวาน', category: 'วัตถุดิบผสม', qty: 255, unit: 'กรัม', price: 28, originalPrice: 28, unitCost: 0.1098 },
    { name: 'ครีมเทียมจืดเอ็กซ์ตร้า', category: 'วัตถุดิบผสม', qty: 369, unit: 'กรัม', price: 26, originalPrice: 26, unitCost: 0.0705 },
    { name: 'นมสดจืด', category: 'วัตถุดิบผสม', qty: 379, unit: 'กรัม', price: 28, originalPrice: 28, unitCost: 0.0739 },
    { name: 'น้ำเชื่อม', category: 'วัตถุดิบผสม', qty: 300, unit: 'กรัม', price: 40, originalPrice: 40, unitCost: 0.1333 },
    { name: 'น้ำผึ้ง', category: 'วัตถุดิบผสม', qty: 130, unit: 'กรัม', price: 35, originalPrice: 35, unitCost: 0.2692 },
    { name: 'โซดา', category: 'วัตถุดิบผสม', qty: 325, unit: 'กรัม', price: 9, originalPrice: 9, unitCost: 0.0277 },
    { name: 'น้ำสะอาด', category: 'ต้นทุนแฝง', qty: 1500, unit: 'มิลลิลิตร', price: 1, originalPrice: 1, unitCost: 0.0007 },
    { name: 'ค่าแก๊ส', category: 'ต้นทุนแฝง', qty: 1, unit: 'ครั้ง', price: 2, originalPrice: 2, unitCost: 2.0 },
    { name: 'ผงมะนาว', category: 'ต้นทุนแฝง', qty: 67, unit: 'กรัม', price: 27, originalPrice: 27, unitCost: 0.403 },
    { name: 'น้ำแข็ง', category: 'ต้นทุนแฝง', qty: 1, unit: 'แก้ว', price: 1, originalPrice: 1, unitCost: 1.0 }
  ],
  investments: {
    gold: [{ date: '2026-08-10', entry: 49850, buy: 14955, weight: 3, sell: '', exit: 0, pnl: 0, status: 'open' }],
    funds: [{ account: 'K PLUS', date: '2026-08-15', name: 'K-GOLD-A(A)', buy: 3000, fee: 0, dividend: 0, sell: 0, pnl: 230, status: 'open' }],
    bonds: [{ name: 'สลากออมสิน 2 ปี', buy: 10000, prize: 100, pnl: 100, status: 'open' }],
    stocks: [{ name: 'AAPL', date: '2026-07-04', buy: 6500, dividend: 42, sell: 0, pnl: 520, status: 'open' }],
    together: [{ name: 'กระปุกเงินออม', interest: 220, return: 8220, status: 'open' }],
    provident: [{ date: '2026-08-31', employee: 1750, employer: 1750, total: 42000, status: 'open' }]
  },
  netInvestment: [
    { name: 'Gold Now', value: 53000, pnl: 509.8 },
    { name: 'Fund', value: 10000, pnl: 284.36 },
    { name: 'Prize Bond', value: 0, pnl: 402 },
    { name: 'Stock', value: 0, pnl: 0 },
    { name: 'Kept Together', value: 4225.24, pnl: 0 },
    { name: 'Provident Fund', value: 6058, pnl: 2422.6 }
  ],
  customBudgetRows: []
};

// Global App State
let data = {
  accounts: [],
  netAccounts: seed.netAccounts,
  investments: seed.investments,
  netInvestment: seed.netInvestment,
  costs: seed.costs,
  recipes: {},
  production: [],
  priceTrends: [],
  customBudgetRows: []
};

let selectedAccount = 'all';
let accountDateFilter = null;
let investmentDateFilter = null;
let storeDateFilter = null;
let activeInvestment = 'gold';
let charts = {};
let editing = null;
let editingCostItem = null;
let selectedProductionDate = null;

// LocalStorage Synchronization
const STORAGE_KEY = 'management_os_data_v3';

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accounts: data.accounts,
      netAccounts: data.netAccounts,
      investments: data.investments,
      netInvestment: data.netInvestment,
      costs: data.costs,
      production: data.production,
      priceTrends: data.priceTrends,
      customBudgetRows: data.customBudgetRows,
      updatedAt: Date.now()
    }));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const cached = JSON.parse(raw);
    if (cached && cached.accounts?.length) {
      data.accounts = cached.accounts;
      if (cached.netAccounts?.length) data.netAccounts = cached.netAccounts;
      if (cached.investments) data.investments = cached.investments;
      if (cached.netInvestment?.length) data.netInvestment = cached.netInvestment;
      if (cached.costs?.length) data.costs = cached.costs;
      if (cached.production?.length) data.production = cached.production;
      if (cached.priceTrends?.length) data.priceTrends = cached.priceTrends;
      if (cached.customBudgetRows?.length) data.customBudgetRows = cached.customBudgetRows;
      return true;
    }
  } catch (err) {
    console.warn('LocalStorage load error:', err);
  }
  return false;
}

// Google Apps Script Mutation Sender
async function sendMutation(mutation) {
  saveToLocalStorage();
  if (!WRITE_ENDPOINT || !navigator.onLine) return;
  try {
    const res = await fetch(WRITE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(mutation),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const json = await res.json();
    console.log('Mutation synced:', json);
  } catch (err) {
    console.warn('Background sync error (local cache preserved):', err);
  }
}

function chart(id, config) {
  if (charts[id]) charts[id].destroy();
  const canvas = document.getElementById(id);
  if (!canvas) return;
  charts[id] = new Chart(canvas, config);
}

function field(label, name, type = 'text', value = '', options = []) {
  if (type === 'select') {
    return `<label>${label}<select name="${name}">${options.map(opt => {
      const isObj = typeof opt === 'object';
      const val = isObj ? opt.value : opt;
      const text = isObj ? opt.label : opt;
      return `<option value="${val}" ${String(val) === String(value) ? 'selected' : ''}>${text}</option>`;
    }).join('')}</select></label>`;
  }
  return `<label>${label}<input required type="${type}" name="${name}" value="${value ?? ''}"></label>`;
}

// Open Dynamic Modal
function openModal(type, item = null) {
  editing = { type, item };
  const accountsList = (data.netAccounts || seed.netAccounts).map(x => x.name.replace(/ Easy| touch| NEXT/g, ''));
  const today = new Date().toISOString().slice(0, 10);

  const configs = {
    transaction: {
      eyebrow: 'ACCOUNTS',
      title: item ? 'แก้ไขรายการธุรกรรม' : 'เพิ่มรายการธุรกรรม',
      fields: [
        field('วันที่', 'date', 'date', item?.date || today),
        field('บัญชีต้นทาง', 'account', 'select', item?.account || 'SCB', accountsList),
        field('ชื่อรายการ', 'title', 'text', item?.title || ''),
        field('หมวดหมู่', 'category', 'text', item?.category || 'อื่นๆ'),
        field('ประเภท', 'type', 'select', item?.type || 'expense', [
          { value: 'income', label: 'เดบิต / รายรับ' },
          { value: 'expense', label: 'เครดิต / รายจ่าย' },
          { value: 'transfer', label: 'โอนเงิน' }
        ]),
        field('บัญชีปลายทาง', 'to', 'text', item?.to || '-'),
        field('จำนวนเงิน (บาท)', 'amount', 'number', Math.abs(item?.amount || 0))
      ]
    },
    storeInventory: {
      eyebrow: 'STORE-1 INVENTORY',
      title: item ? 'แก้ไขรายการใน Store-1' : 'เพิ่มรายการผลิต/สต็อก (Store-1)',
      fields: [
        field('วันที่', 'date', 'date', item?.date || today),
        field('ชื่อเมนู', 'menu', 'text', item?.menu || 'ชาไทย'),
        field('ประเภทบรรจุภัณฑ์', 'package', 'select', item?.package || 'ขวด', ['ขวด', 'แก้ว']),
        field('จำนวนผลิต (หน่วย)', 'quantity', 'number', item?.quantity || '30'),
        field('คาดการณ์สูญเสีย (หน่วย)', 'damage', 'number', item?.damage || '0'),
        field('คาดการณ์ยอดขาย (บาท)', 'sales', 'number', item?.sales || (Number(item?.quantity || 30) * 25)),
        field('สูญเสีย (บาท)', 'loss', 'number', item?.loss || '0')
      ]
    },
    investment: {
      eyebrow: 'INVESTMENT',
      title: 'เพิ่มการลงทุนใหม่',
      fields: [
        `<label>ประเภทสินทรัพย์<select name="asset" id="invAssetSelect" onchange="refreshInvFields(this.value)">
          <option value="gold">🪙 Gold Now (ทองคำ)</option>
          <option value="funds">📈 Funds (กองทุน)</option>
          <option value="bonds">🎟️ Prize Bond (สลากออมสิน)</option>
          <option value="stocks">🏢 Stock (หุ้น)</option>
          <option value="together">🍯 Together (กระปุกออมสิน)</option>
          <option value="provident">💼 Provident Fund (กองทุนสำรอง)</option>
        </select></label>`,
        `<div id="invDynamicFields"></div>`
      ]
    }
  };

  const c = configs[type];
  if (!c) return;

  document.getElementById('modalEyebrow').textContent = c.eyebrow;
  document.getElementById('modalTitle').textContent = c.title;
  document.getElementById('modalFields').innerHTML = c.fields.join('');
  document.getElementById('modal').classList.add('show');

  // For investment modal: show fields for default asset type (gold)
  if (type === 'investment') {
    refreshInvFields('gold');
  }
}

// Dynamic investment fields based on asset type (matching Sheet Investment column headers)
window.refreshInvFields = function(assetType) {
  const container = document.getElementById('invDynamicFields');
  if (!container) return;

  const today = new Date().toISOString().slice(0, 10);
  const statusSelect = `<label>สถานะ<select name="status">
    <option value="open">ยังไม่ขาย (Open)</option>
    <option value="closed">ขายแล้ว (Closed)</option>
  </select></label>`;

  const fieldsMap = {
    gold: `
      ${field('วันที่ซื้อ', 'date', 'date', today)}
      ${field('ราคาเข้า (บาท/บาท)', 'entry', 'number', '')}
      ${field('มูลค่าซื้อ (บาท)', 'buy', 'number', '')}
      ${field('น้ำหนักทอง (บาท)', 'weight', 'number', '')}
      ${field('วันที่ขาย', 'sell_date', 'date', '')}
      ${field('ราคาขาย (บาท/บาท)', 'exit_price', 'number', '')}
      ${field('มูลค่าขาย (บาท)', 'sell_value', 'number', '')}
      ${field('ค่าธรรมเนียม (บาท)', 'fee', 'number', '5')}
      <label>กำไร/ขาดทุน (คำนวณอัตโนมัติ)<input type="text" name="pnl" value="0" readonly style="background:#f1f5f9;cursor:not-allowed"></label>
      ${statusSelect}
    `,
    funds: `
      ${field('บัญชีกองทุน', 'account', 'select', 'กองทุนใน K+', ['กองทุนใน K+', 'กองทุนใน SCB', 'กองทุนใน KTB', 'กองทุนใน TTB'])}
      ${field('วันที่', 'date', 'date', today)}
      ${field('ชื่อกองทุน', 'name', 'text', '')}
      ${field('มูลค่าซื้อ (บาท)', 'buy', 'number', '')}
      ${field('ค่าธรรมเนียม', 'fee', 'text', '-')}
      ${field('ยอดปันผล (บาท)', 'dividend', 'number', '0')}
      ${field('วันที่ขาย', 'sell_date', 'date', '')}
      ${field('มูลค่าขาย (บาท)', 'sell_value', 'number', '0')}
      <label>กำไร/ขาดทุน (คำนวณอัตโนมัติ)<input type="text" name="pnl" value="0" readonly style="background:#f1f5f9;cursor:not-allowed"></label>
      ${statusSelect}
    `,
    bonds: `
      ${field('บัญชีกองทุน', 'account', 'select', 'สลากออมสิน', ['สลากออมสิน', 'สลากธนาคาร'])}
      ${field('วันที่', 'date', 'date', today)}
      ${field('ประเภท', 'bond_type', 'select', '1ปี', ['1ปี', '2ปี', '3ปี'])}
      ${field('มูลค่าซื้อ (บาท)', 'buy', 'number', '')}
      ${field('ค่าธรรมเนียม', 'fee', 'text', '-')}
      ${field('ถูกรางวัล (บาท)', 'prize', 'number', '0')}
      ${field('วันที่ขาย', 'sell_date', 'date', '')}
      ${field('มูลค่าขาย (บาท)', 'sell_value', 'number', '0')}
      <label>กำไร/ขาดทุน (คำนวณอัตโนมัติ)<input type="text" name="pnl" value="0" readonly style="background:#f1f5f9;cursor:not-allowed"></label>
      ${statusSelect}
    `,
    stocks: `
      ${field('ชื่อหุ้น', 'name', 'text', '')}
      ${field('วันที่ซื้อ', 'date', 'date', today)}
      ${field('ประเภท', 'stock_type', 'text', '')}
      ${field('มูลค่าซื้อ (บาท)', 'buy', 'text', '')}
      ${field('ค่าธรรมเนียม', 'fee', 'text', '')}
      ${field('ยอดปันผล (บาท)', 'dividend', 'text', '0')}
      ${field('วันที่ขาย', 'sell_date', 'text', '')}
      ${field('มูลค่าขาย (บาท)', 'sell_value', 'text', '0')}
      ${field('กำไร/ขาดทุน', 'pnl', 'text', '0')}
      ${statusSelect}
    `,
    together: `
      ${field('กระปุก', 'account', 'select', 'ดอกเบี้ยธนาคาร', ['ดอกเบี้ยธนาคาร', 'ผลตอบแทนกองทุน', 'ออมทอง'])}
      ${field('วันที่', 'date', 'date', today)}
      ${field('ชื่อรายการ', 'name', 'text', '')}
      ${field('มูลค่า (บาท)', 'buy', 'number', '')}
      ${statusSelect}
    `,
    provident: `
      ${field('วันที่', 'date', 'date', today)}
      ${field('เดือน', 'month_num', 'number', new Date().getMonth() + 1)}
      ${field('เงินสะสม (พนักงาน, บาท)', 'employee', 'number', '993')}
      ${field('เงินสมทบ (นายจ้าง, บาท)', 'employer', 'number', '397.08')}
      <label>ยอดรวม (คำนวณอัตโนมัติ)<input type="text" name="total" value="1390.08" readonly style="background:#f1f5f9;cursor:not-allowed"></label>
      ${statusSelect}
    `
  };

  container.innerHTML = fieldsMap[assetType] || fieldsMap.gold;

  // Auto-calculate formula columns on input
  const calcPnl = () => {
    const sellVal = Number(container.querySelector('[name="sell_value"]')?.value) || 0;
    const buyVal = Number(container.querySelector('[name="buy"]')?.value) || 0;
    const fee = Number(container.querySelector('[name="fee"]')?.value) || 0;
    const pnlEl = container.querySelector('[name="pnl"]');
    if (pnlEl && !pnlEl.readOnly === false) return;
    if (pnlEl) pnlEl.value = (sellVal - buyVal - fee).toFixed(2);
  };

  const calcTotal = () => {
    const emp = Number(container.querySelector('[name="employee"]')?.value) || 0;
    const er = Number(container.querySelector('[name="employer"]')?.value) || 0;
    const totalEl = container.querySelector('[name="total"]');
    if (totalEl) totalEl.value = (emp + er).toFixed(2);
  };

  container.querySelectorAll('input[type="number"]').forEach(inp => {
    inp.addEventListener('input', () => {
      calcPnl();
      calcTotal();
    });
  });
};

// Handle Form Submission
async function submitModal(e) {
  e.preventDefault();
  const o = Object.fromEntries(new FormData(e.target));

  if (editing.type === 'transaction') {
    const rawAmt = Number(o.amount) || 0;
    const isExpense = o.type === 'expense';
    const amount = isExpense ? -Math.abs(rawAmt) : Math.abs(rawAmt);

    if (editing.item) {
      Object.assign(editing.item, {
        date: o.date,
        account: o.account,
        title: o.title,
        category: o.category,
        type: o.type,
        to: o.to,
        amount
      });
      sendMutation({
        sheet: 'Accounts',
        action: 'update',
        rowIndex: editing.item.rowIndex,
        original: editing.item,
        row: {
          'วันที่': o.date,
          'บัญชี': o.account,
          'รายการ': o.title,
          'หมวดหมู่': o.category,
          'ประเภท': o.type === 'income' ? 'เดบิต' : o.type === 'expense' ? 'เครดิต' : 'โอนเงิน',
          'ปลายทาง': o.to,
          'จำนวนเงิน': Math.abs(amount)
        }
      });
    } else {
      const record = {
        id: uid(),
        date: o.date,
        account: o.account,
        title: o.title,
        category: o.category,
        type: o.type,
        to: o.to,
        amount
      };
      data.accounts.unshift(record);
      sendMutation({
        sheet: 'Accounts',
        action: 'append',
        row: {
          'วันที่': o.date,
          'บัญชี': o.account,
          'รายการ': o.title,
          'หมวดหมู่': o.category,
          'ประเภท': o.type === 'income' ? 'เดบิต' : o.type === 'expense' ? 'เครดิต' : 'โอนเงิน',
          'ปลายทาง': o.to,
          'จำนวนเงิน': Math.abs(amount)
        }
      });
    }
  }

  // Store-1 Inventory / Production CRUD
  if (editing.type === 'storeInventory') {
    const qty = Number(o.quantity) || 0;
    const dmg = Number(o.damage) || 0;
    const sales = Number(o.sales) || (qty * 25);
    const loss = Number(o.loss) || (dmg * 25);

    if (editing.item) {
      Object.assign(editing.item, {
        date: o.date,
        menu: o.menu,
        package: o.package,
        quantity: qty,
        damage: dmg,
        sales,
        loss
      });
      sendMutation({
        sheet: 'Store-1',
        action: 'updateStoreInventory',
        rowIndex: editing.item.rowIndex,
        original: editing.item,
        row: {
          date: o.date,
          menu: o.menu,
          package: o.package,
          quantity: qty,
          damage: dmg,
          sales,
          loss
        }
      });
    } else {
      const record = {
        id: uid(),
        rowIndex: data.production.length + 2,
        date: o.date,
        menu: o.menu,
        package: o.package,
        quantity: qty,
        damage: dmg,
        sales,
        loss
      };
      data.production.unshift(record);
      sendMutation({
        sheet: 'Store-1',
        action: 'appendStoreInventory',
        row: {
          date: o.date,
          menu: o.menu,
          package: o.package,
          quantity: qty,
          damage: dmg,
          sales,
          loss
        }
      });
    }
  }

  if (editing.type === 'investment') {
    const assetType = o.asset;
    let record = { status: o.status || 'open' };
    let sheetRow = { asset: assetType };

    if (assetType === 'gold') {
      const buyVal = Number(o.buy) || 0;
      const sellVal = Number(o.sell_value) || 0;
      const fee = Number(o.fee) || 5;
      const pnl = sellVal > 0 ? sellVal - buyVal - fee : 0;
      record = { date: o.date, entry: Number(o.entry)||0, buy: buyVal, weight: Number(o.weight)||0,
        sell: o.sell_date||'', exit: Number(o.exit_price)||0, sell_value: sellVal,
        fee, pnl, status: o.status };
      sheetRow = { asset: 'gold', 'วันที่ซื้อ': o.date, 'ราคาเข้า': o.entry, 'มูลค่าซื้อ': o.buy,
        'น้ำหนักทอง': o.weight, 'วันที่ขาย': o.sell_date||'', 'ราคาขาย': o.exit_price||'',
        'มูลค่าขาย': o.sell_value||'', 'ค่าธรรมเนียม': o.fee, 'กำไร/ขาดทุน': pnl,
        'สถานะ': o.status === 'open' ? 'ยังไม่ขาย' : 'ขายแล้ว' };

    } else if (assetType === 'funds') {
      const buyVal = Number(o.buy) || 0;
      const sellVal = Number(o.sell_value) || 0;
      const pnl = sellVal > 0 ? sellVal - buyVal : 0;
      record = { account: o.account, date: o.date, name: o.name, buy: buyVal,
        fee: o.fee||'-', dividend: Number(o.dividend)||0, sell_date: o.sell_date||'',
        sell: sellVal, pnl, status: o.status };
      sheetRow = { asset: 'funds', 'บัญชีกองทุน': o.account, 'วันที่': o.date, 'ชื่อกองทุน': o.name,
        'มูลค่าซื้อ': o.buy, 'ค่าธรรมเนียม': o.fee||'-', 'ยอดปันผล (บาท)': o.dividend||0,
        'วันที่ขาย': o.sell_date||'', 'มูลค่าขาย(บาท)': o.sell_value||0, 'กำไร/ขาดทุน': pnl,
        'สถานะ': o.status === 'open' ? 'ยังไม่ขาย' : 'ขายแล้ว' };

    } else if (assetType === 'bonds') {
      const buyVal = Number(o.buy) || 0;
      const sellVal = Number(o.sell_value) || 0;
      const prize = Number(o.prize) || 0;
      const pnl = sellVal > 0 ? sellVal - buyVal + prize : prize;
      record = { name: o.account, date: o.date, bond_type: o.bond_type, buy: buyVal,
        fee: o.fee||'-', prize, sell_date: o.sell_date||'', sell: sellVal, pnl, status: o.status };
      sheetRow = { asset: 'bonds', 'บัญชีกองทุน': o.account, 'วันที่': o.date, 'ประเภท': o.bond_type,
        'มูลค่าซื้อ': o.buy, 'ค่าธรรมเนียม': o.fee||'-', 'ถูกรางวัล': o.prize||0,
        'วันที่ขาย': o.sell_date||'', 'มูลค่าขาย(บาท)': o.sell_value||0, 'กำไร/ขาดทุน': pnl,
        'สถานะ': o.status === 'open' ? 'ยังไม่ขาย' : 'ขายแล้ว' };

    } else if (assetType === 'stocks') {
      record = { name: o.name, date: o.date, stock_type: o.stock_type||'', buy: o.buy||'',
        fee: o.fee||'', dividend: o.dividend||'0', sell_date: o.sell_date||'',
        sell: o.sell_value||'', pnl: o.pnl||'0', status: o.status };
      sheetRow = { asset: 'stocks', 'ชื่อหุ้น': o.name, 'วันที่ซื้อ': o.date, 'ประเภท': o.stock_type,
        'มูลค่าซื้อ': o.buy, 'ค่าธรรมเนียม': o.fee, 'ยอดปันผล (บาท)': o.dividend,
        'วันที่ขาย': o.sell_date, 'มูลค่าขาย(บาท)': o.sell_value, 'กำไร/ขาดทุน': o.pnl,
        'สถานะ': o.status === 'open' ? 'ยังไม่ขาย' : 'ขายแล้ว' };

    } else if (assetType === 'together') {
      record = { name: o.name, account: o.account, date: o.date,
        return: Number(o.buy)||0, interest: 0, status: o.status };
      sheetRow = { asset: 'together', 'กระปุก': o.account, 'วันที่': o.date,
        'ชื่อรายการ': o.name, 'มูลค่า (บาท)': o.buy };

    } else if (assetType === 'provident') {
      const emp = Number(o.employee) || 993;
      const er = Number(o.employer) || 397.08;
      record = { date: o.date, month: Number(o.month_num)||0,
        employee: emp, employer: er, total: emp + er, status: o.status };
      sheetRow = { asset: 'provident', 'วันที่': o.date, 'เดือน': o.month_num,
        'เงินสะสม': o.employee, 'เงินสมทบ': o.employer, 'ยอดรวม': emp + er };
    }

    record.status = o.status || 'open';
    if (data.investments[assetType]) {
      data.investments[assetType].unshift(record);
    }
    sendMutation({
      sheet: 'Investment',
      action: 'append',
      row: sheetRow
    });
  }

  document.getElementById('modal').classList.remove('show');
  if (typeof renderAll === 'function') renderAll();
}

// Delete Store-1 Inventory Item
function deleteStoreInventoryItem(index) {
  const item = data.production[index];
  if (!item) return;
  if (!confirm(`คุณต้องการลบรายการผลิต "${item.menu}" (${fmtDate(item.date)}) ออกจาก Sheet Store-1 หรือไม่?`)) return;

  data.production.splice(index, 1);
  sendMutation({
    sheet: 'Store-1',
    action: 'deleteStoreInventory',
    rowIndex: item.rowIndex,
    original: item
  });
  if (typeof renderStoreManagement === 'function') renderStoreManagement();
}

// Delete Transaction Item
function deleteTransactionItem(id) {
  const idx = data.accounts.findIndex(x => x.id === id);
  if (idx < 0) return;
  const item = data.accounts[idx];
  if (!confirm(`คุณต้องการลบธุรกรรม "${item.title}" (${item.date}) หรือไม่?`)) return;

  data.accounts.splice(idx, 1);
  sendMutation({
    sheet: 'Accounts',
    action: 'delete',
    rowIndex: item.rowIndex,
    original: item
  });
  if (typeof renderAccounts === 'function') renderAccounts();
}

// Cost Edit Modal Logic
function openCostEditModal(index) {
  const item = data.costs[index];
  if (!item) return;
  editingCostItem = { ...item, index };

  document.getElementById('costItemName').textContent = `แก้ไขราคา: ${item.name}`;
  document.getElementById('costCategory').textContent = item.category;
  document.getElementById('costQtyUnit').textContent = `${item.qty} ${item.unit}`;
  document.getElementById('costOldPrice').textContent = money(item.price);
  document.getElementById('costOldUnitCost').textContent = `${money(item.unitCost)} / ${item.unit}`;

  const input = document.getElementById('costNewPrice');
  input.value = item.price;
  updateCostPreview();

  input.oninput = updateCostPreview;
  document.getElementById('costModal').classList.add('show');
}

function updateCostPreview() {
  if (!editingCostItem) return;
  const newPrice = Number(document.getElementById('costNewPrice').value) || 0;
  const oldPrice = editingCostItem.price || 1;
  const diff = newPrice - oldPrice;
  const pct = ((diff / oldPrice) * 100);
  const newUnitCost = editingCostItem.qty ? (newPrice / editingCostItem.qty) : 0;

  const diffEl = document.getElementById('costDiffPrice');
  diffEl.textContent = `${diff > 0 ? '+' : ''}${money(diff)}`;
  diffEl.className = diff > 0 ? 'expense-amount' : diff < 0 ? 'income' : '';

  const pctEl = document.getElementById('costPctChange');
  pctEl.textContent = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  pctEl.className = diff > 0 ? 'expense-amount' : diff < 0 ? 'income' : '';

  document.getElementById('costNewUnitCost').textContent = `${money(newUnitCost)} / ${editingCostItem.unit}`;
}

function submitCostForm(e) {
  e.preventDefault();
  if (!editingCostItem) return;
  const newPrice = Number(document.getElementById('costNewPrice').value) || 0;
  const oldPrice = editingCostItem.price;
  const oldUnitCost = editingCostItem.unitCost;
  const diff = newPrice - oldPrice;
  const pct = oldPrice ? ((diff / oldPrice) * 100) : 0;
  const newUnitCost = editingCostItem.qty ? (newPrice / editingCostItem.qty) : 0;
  const pctStr = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;

  const target = data.costs[editingCostItem.index];
  if (target) {
    target.price = newPrice;
    target.unitCost = newUnitCost;
    target.pctChange = pct;
  }

  const transition = {
    date: new Date().toISOString(),
    name: editingCostItem.name,
    category: editingCostItem.category,
    oldPrice,
    newPrice,
    pctChange: pctStr,
    oldUnitCost,
    newUnitCost
  };
  data.priceTrends.unshift(transition);

  sendMutation({
    action: 'updateCost',
    name: editingCostItem.name,
    category: editingCostItem.category,
    oldPrice,
    newPrice,
    pctChange: pctStr,
    oldUnitCost,
    newUnitCost
  });

  document.getElementById('costModal').classList.remove('show');
  editingCostItem = null;
  if (typeof renderStore === 'function') renderStore();
}

function openPriceTrendsModal() {
  const tbody = document.getElementById('trendRows');
  if (!data.priceTrends || !data.priceTrends.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px">ยังไม่มีประวัติการเปลี่ยนแปลงราคา</td></tr>';
  } else {
    tbody.innerHTML = data.priceTrends.map(t => {
      const isUp = String(t.pctChange).includes('+');
      const isDown = String(t.pctChange).includes('-');
      const badgeClass = isUp ? 'pct-badge up' : isDown ? 'pct-badge down' : 'pct-badge same';
      return `<tr>
        <td>${fmtDate(t.date || t.recordedAt)}</td>
        <td><b>${t.name}</b></td>
        <td>${t.category || '-'}</td>
        <td class="right">${money(t.oldPrice)}</td>
        <td class="right"><b>${money(t.newPrice)}</b></td>
        <td class="center"><span class="${badgeClass}">${t.pctChange}</span></td>
        <td class="right">${money(t.newUnitCost)}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('trendModal').classList.add('show');
}

// Bootstrap Application Events
function initApp() {
  loadFromLocalStorage();

  document.addEventListener('click', e => {
    // Page tabs
    const nav = e.target.closest('[data-page]');
    if (nav) {
      document.querySelectorAll('.nav-item, .page').forEach(x => x.classList.remove('active'));
      nav.classList.add('active');
      const targetPage = document.getElementById(`${nav.dataset.page}Page`);
      if (targetPage) targetPage.classList.add('active');
      document.getElementById('pageTitle').textContent = nav.querySelector('b')?.textContent || '';
      document.getElementById('pageEyebrow').textContent =
        nav.dataset.page === 'accounts' ? 'PERSONAL FINANCE' :
        nav.dataset.page === 'investments' ? 'WEALTH MONITOR' : 'STORE OPERATIONS';
    }

    // My Account sub-tabs
    const accTab = e.target.closest('[data-account-tab]');
    if (accTab) {
      document.querySelectorAll('[data-account-tab]').forEach(x => x.classList.toggle('active', x === accTab));
      document.getElementById('accountOverviewView').hidden = accTab.dataset.accountTab !== 'overview';
      document.getElementById('accountBudgetView').hidden = accTab.dataset.accountTab !== 'budget';
    }

    // Store sub-tabs
    const stTab = e.target.closest('[data-store-tab]');
    if (stTab) {
      document.querySelectorAll('[data-store-tab]').forEach(x => x.classList.toggle('active', x === stTab));
      document.getElementById('storeCalculator').hidden = stTab.dataset.storeTab !== 'calculator';
      document.getElementById('storeManage').hidden = stTab.dataset.storeTab !== 'manage';
      if (stTab.dataset.storeTab === 'manage' && typeof renderStoreManagement === 'function') {
        renderStoreManagement();
      }
    }

    // Investment tabs
    const invTab = e.target.closest('[data-investment-tab]');
    if (invTab) {
      activeInvestment = invTab.dataset.investmentTab;
      if (typeof renderInvestments === 'function') renderInvestments();
    }

    // Bank card selection
    const bank = e.target.closest('[data-account]');
    if (bank) {
      selectedAccount = bank.dataset.account;
      if (typeof renderAccounts === 'function') renderAccounts();
    }

    // Modals
    const op = e.target.closest('[data-open-modal]');
    if (op) openModal(op.dataset.openModal);

    const editTx = e.target.closest('[data-edit-account]');
    if (editTx) openModal('transaction', data.accounts.find(x => x.id === editTx.dataset.editAccount));

    const delTx = e.target.closest('[data-del-account]');
    if (delTx) deleteTransactionItem(delTx.dataset.delAccount);

    // Store-1 Inventory edit & delete
    const editStoreInv = e.target.closest('[data-edit-store-inv]');
    if (editStoreInv) openModal('storeInventory', data.production[Number(editStoreInv.dataset.editStoreInv)]);

    const delStoreInv = e.target.closest('[data-del-store-inv]');
    if (delStoreInv) deleteStoreInventoryItem(Number(delStoreInv.dataset.delStoreInv));

    const editCost = e.target.closest('[data-edit-cost]');
    if (editCost) openCostEditModal(Number(editCost.dataset.editCost));

    // Close Modals
    if (e.target.id === 'closeModal' || e.target.id === 'cancelModal' || e.target.id === 'modal') {
      document.getElementById('modal').classList.remove('show');
    }
    if (e.target.id === 'closeCostModal' || e.target.id === 'cancelCostModal' || e.target.id === 'costModal') {
      document.getElementById('costModal').classList.remove('show');
    }
    if (e.target.id === 'closeTrendModal' || e.target.id === 'cancelTrendModal' || e.target.id === 'trendModal') {
      document.getElementById('trendModal').classList.remove('show');
    }

    // Menu Profit Card click to select recipe
    const profitCard = e.target.closest('[data-menu-recipe]');
    if (profitCard) {
      const select = document.getElementById('recipeSelect');
      if (select) {
        select.value = profitCard.dataset.menuRecipe;
        select.dispatchEvent(new Event('input'));
      }
    }
  });

  // Toolbar & Filter Events
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.getElementById('themeBtn').textContent = document.body.classList.contains('dark') ? '☼' : '☾';
  });

  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('collapseBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Date filters toggles
  document.getElementById('dateFilterBtn')?.addEventListener('click', () => {
    document.getElementById('dateRange').classList.toggle('show');
  });
  document.getElementById('applyDate')?.addEventListener('click', () => {
    const s = document.getElementById('dateStart').value;
    const e = document.getElementById('dateEnd').value;
    accountDateFilter = s && e ? { start: s, end: e } : null;
    if (typeof renderAccounts === 'function') renderAccounts();
  });
  document.getElementById('clearDate')?.addEventListener('click', () => {
    document.getElementById('dateStart').value = '';
    document.getElementById('dateEnd').value = '';
    accountDateFilter = null;
    document.getElementById('dateRange').classList.remove('show');
    if (typeof renderAccounts === 'function') renderAccounts();
  });

  document.getElementById('investmentDateBtn')?.addEventListener('click', () => {
    document.getElementById('investmentDateRange').classList.toggle('show');
  });
  document.getElementById('applyInvDate')?.addEventListener('click', () => {
    const s = document.getElementById('invDateStart').value;
    const e = document.getElementById('invDateEnd').value;
    investmentDateFilter = s && e ? { start: s, end: e } : null;
    if (typeof renderInvestments === 'function') renderInvestments();
  });
  document.getElementById('clearInvDate')?.addEventListener('click', () => {
    document.getElementById('invDateStart').value = '';
    document.getElementById('invDateEnd').value = '';
    investmentDateFilter = null;
    document.getElementById('investmentDateRange').classList.remove('show');
    if (typeof renderInvestments === 'function') renderInvestments();
  });

  document.getElementById('storeDateFilterBtn')?.addEventListener('click', () => {
    document.getElementById('storeDateRange').classList.toggle('show');
  });
  document.getElementById('storeApplyDate')?.addEventListener('click', () => {
    const s = document.getElementById('storeDateStart').value;
    const e = document.getElementById('storeDateEnd').value;
    storeDateFilter = s && e ? { start: s, end: e } : null;
    if (typeof renderStoreManagement === 'function') renderStoreManagement();
  });
  document.getElementById('storeClearDate')?.addEventListener('click', () => {
    document.getElementById('storeDateStart').value = '';
    document.getElementById('storeDateEnd').value = '';
    storeDateFilter = null;
    document.getElementById('storeDateRange').classList.remove('show');
    if (typeof renderStoreManagement === 'function') renderStoreManagement();
  });

  document.getElementById('clearAccount')?.addEventListener('click', () => {
    selectedAccount = 'all';
    if (typeof renderAccounts === 'function') renderAccounts();
  });

  // Export CSV (UTF-8 BOM for Microsoft Excel)
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    if (!data.accounts.length) return alert('ไม่มีข้อมูลธุรกรรมสำหรับ Export');
    const headers = ['วันที่', 'บัญชี', 'รายการ', 'หมวดหมู่', 'ประเภท', 'ปลายทาง', 'จำนวนเงิน'];
    const rows = data.accounts.map(x => [
      x.date, x.account, x.title, x.category,
      x.type === 'income' ? 'เดบิต' : x.type === 'expense' ? 'เครดิต' : 'โอนเงิน',
      x.to, x.amount
    ]);
    const csv = '\ufeff' + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `management_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  });

  document.getElementById('printBtn')?.addEventListener('click', () => window.print());

  // Forms
  document.getElementById('entryForm')?.addEventListener('submit', submitModal);
  document.getElementById('costForm')?.addEventListener('submit', submitCostForm);
  document.getElementById('viewPriceTrendsBtn')?.addEventListener('click', openPriceTrendsModal);
  document.getElementById('addStoreInventoryBtn')?.addEventListener('click', () => openModal('storeInventory'));

  // Refresh Button
  document.getElementById('refreshBtn')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.classList.add('spinning');
    button.disabled = true;
    if (typeof liveSync === 'function') await liveSync();
    button.classList.remove('spinning');
    button.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', initApp);
