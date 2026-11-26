// index.html 안의 안내서 사본이 원본 .md와 같은지 확인한다.
//   <script id="guideMd">  ↔ FILE-FORMAT.md  (파일 만들기 안내서)
//   <script id="partsMd">  ↔ PARTS-GUIDE.md  (브레드보드 부품 고르기 안내)
// 사용: node breadboard/tests/guide-sync.js        → 다르면 실패
//       node breadboard/tests/guide-sync.js --fix  → .md 내용으로 사본을 고친다
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..'), htmlP = path.join(dir, 'index.html');
let html = fs.readFileSync(htmlP, 'utf8'), bad = 0, fixed = 0;
const msgs = [];
for (const [id, file] of [['guideMd', 'FILE-FORMAT.md'], ['partsMd', 'PARTS-GUIDE.md']]) {
  const md = fs.readFileSync(path.join(dir, file), 'utf8');
  const re = new RegExp(`(<script type="text\\/markdown" id="${id}">\\n)([\\s\\S]*?)(<\\/script>)`);
  const m = html.match(re);
  if (!m) { console.error(`${id} 블록이 없어요`); process.exit(1); }
  if (/<\/script/i.test(md)) { console.error(`${file}에 </script 가 있으면 넣을 수 없어요`); process.exit(1); }
  if (m[2] === md) { msgs.push(`${file} 같아요 (${md.length}자)`); continue; }
  if (process.argv.includes('--fix')) { html = html.replace(re, (_, a, __, c) => a + md + c); fixed++; msgs.push(`${file} 고쳤어요`); }
  else { bad++; msgs.push(`${file} 달라요`); }
}
if (fixed) fs.writeFileSync(htmlP, html);
console.log('guide-sync: ' + msgs.join(' · ') + (bad ? ' → --fix 로 맞추세요' : ''));
process.exit(bad ? 1 : 0);
