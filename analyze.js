const XLSX = require('./node_modules/xlsx');
const wb = XLSX.readFile('./Sanz Payment List(통합 UPDATED).xlsx');
const ws = wb.Sheets['SANZ확인'];
const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

const data = rows.slice(4).filter(r => r.some(c => c !== ''));

// CI별 그룹핑
const ciMap = new Map();
let curPO = '', curPI = '', curAdv = 0, curAdvDate = '', curBal1 = 0, curBal1Date = '', curBal2 = 0, curBal2Date = '';

data.forEach(r => {
  if (r[0] !== '') {
    curPO = r[0]; curPI = r[1];
    curAdv = r[11] || 0; curAdvDate = r[12] || '';
    curBal1 = r[13] || 0; curBal1Date = r[14] || '';
    curBal2 = r[15] || 0; curBal2Date = r[16] || '';
  }
  const ci = r[7];
  if (!ci) return;
  if (!ciMap.has(ci)) {
    ciMap.set(ci, { ci, date: r[10], amount: 0, pos: [], pis: [], payments: [] });
  }
  const g = ciMap.get(ci);
  g.amount += (r[9] || 0);
  if (!g.pos.includes(curPO)) g.pos.push(curPO);
  if (!g.pis.includes(curPI)) g.pis.push(curPI);
  // 결제 정보 (PO별로 다를 수 있으므로 PO별로 저장)
  const existing = g.payments.find(p => p.po === curPO);
  if (!existing) {
    g.payments.push({ po: curPO, adv: curAdv, advDate: curAdvDate, bal1: curBal1, bal1Date: curBal1Date, bal2: curBal2, bal2Date: curBal2Date });
  }
});

console.log('\n=== CI별 집계 ===');
ciMap.forEach((v) => {
  const payStr = v.payments.map(p => `PO${p.po}[선급${p.adv}/잔금1:${p.bal1}/잔금2:${p.bal2}]`).join(' | ');
  console.log(`CI: ${v.ci} | 날짜: ${v.date} | CI금액: ${v.amount.toFixed(2)} | PO: ${v.pos.join(',')} | PI: ${v.pis.join(',')} | 결제: ${payStr}`);
});

// PO별로 CI가 몇 개인지
console.log('\n=== PO별 CI 개수 ===');
const poMap = new Map();
data.forEach(r => {
  if (r[0] !== '') curPO = r[0];
  const ci = r[7];
  if (!ci) return;
  if (!poMap.has(curPO)) poMap.set(curPO, new Set());
  poMap.get(curPO).add(ci);
});
poMap.forEach((cis, po) => {
  if (cis.size > 1) console.log(`PO ${po}: CI ${[...cis].join(', ')} (${cis.size}개)`);
});

// CI가 여러 PO에 걸쳐 있는지
console.log('\n=== CI가 여러 PO에 걸친 경우 ===');
ciMap.forEach((v) => {
  if (v.pos.length > 1) console.log(`CI ${v.ci}: PO ${v.pos.join(', ')}`);
});
