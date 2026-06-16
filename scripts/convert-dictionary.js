// scripts/convert-dictionary.js
// Usage: node scripts/convert-dictionary.js
// Requires: npm install xlsx

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'KDocTalk_Medical_Dictionary_5Lang_added_sheet.xlsx');
const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'medical-dictionary.json');

const wb = XLSX.readFile(INPUT);
const ws = wb.Sheets['추가 권장용어'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

let currentCat = '';
let id = 0;
const entries = [];

for (let i = 1; i < rows.length; i++) {
  const [cat, ko, en, ja, zhCN, zhTW, usage, check] = rows[i];
  if (cat) currentCat = cat;
  if (!ko) continue;
  id++;
  entries.push({
    id: `term_${String(id).padStart(4, '0')}`,
    category: (currentCat || '').trim(),
    ko: String(ko).trim(),
    en: String(en || '').trim(),
    ja: String(ja || '').trim(),
    zhCN: String(zhCN || '').trim(),
    zhTW: String(zhTW || '').trim(),
    doctorCheckRequired: String(check || '').trim().toUpperCase() === 'Y',
    usageContext: String(usage || '').trim()
  });
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Converted ${entries.length} entries → ${OUTPUT}`);
