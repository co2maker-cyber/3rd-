// index.html 안의 안내서 사본(<script id="guideMd">)이 FILE-FORMAT.md와 같은지 확인한다.
// 사용: node breadboard/tests/guide-sync.js        → 다르면 실패
//       node breadboard/tests/guide-sync.js --fix  → FILE-FORMAT.md 내용으로 사본을 고친다
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..'), htmlP = path.join(dir, 'index.html'), mdP = path.join(dir, 'FILE-FORMAT.md');
const html = fs.readFileSync(htmlP, 'utf8'), md = fs.readFileSync(mdP, 'utf8');
const re = /(<script type="text\/markdown" id="guideMd">\n)([\s\S]*?)(<\/script>)/;
const m = html.match(re);
if (!m) { console.error('guideMd 블록이 없어요'); process.exit(1); }
if (/<\/script/i.test(md)) { console.error('FILE-FORMAT.md에 </script 가 있으면 넣을 수 없어요'); process.exit(1); }
if (m[2] === md) { console.log('guide-sync: 같아요 (' + md.length + '자)'); process.exit(0); }
if (process.argv.includes('--fix')) { fs.writeFileSync(htmlP, html.replace(re, (_, a, __, c) => a + md + c)); console.log('guide-sync: 고쳤어요'); process.exit(0); }
console.error('guide-sync: index.html 안의 안내서가 FILE-FORMAT.md와 달라요. --fix 로 맞추세요'); process.exit(1);
