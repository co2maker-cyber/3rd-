// 저작자 서명 검사: 모든 페이지에 저작권 주석·메타 태그·서명 ID가 있고, 브레드보드 출력물(저장 .json·거버·드릴·PCB README·SVG)에
// 서명이 들어가는지 확인한다. 서명이 지워지거나 바뀌면 실패한다 (breadboard/COPYRIGHT.md 12절)
const fs=require('fs'),path=require('path');const root=path.join(__dirname,'../..');
const ID='C2M-2026-BC51AA6C',OWNER='co2maker-cyber';
const pages={'index.html':'HOME','breadboard/index.html':'BBCAD','linux/index.html':'LINUX','router/index.html':'ROUTER','windows/index.html':'WINSRV'};
let bad=0;const chk=(n,v)=>{if(!v)bad++;console.log((v?'ok  ':'FAIL')+' '+n);};
for(const [f,code] of Object.entries(pages)){const s=fs.readFileSync(path.join(root,f),'utf8'),sid=`${ID}-${code}`;
  chk(`${f}: 맨 위 저작권 주석`,/^<!doctype html>\n<!--[\s\S]{0,1600}Copyright \(c\) 2026 co2maker-cyber\. All rights reserved\./.test(s)&&s.indexOf(`저작자 서명 ID: ${sid}`)>0&&s.indexOf(`저작자 서명 ID: ${sid}`)<2000);
  chk(`${f}: author·copyright 메타`,s.includes(`<meta name="author" content="${OWNER}">`)&&s.includes(`<meta name="copyright" content="© 2026 ${OWNER}. All rights reserved.">`)&&s.includes(sid+'">'));
  if(f!=='index.html')chk(`${f}: 코드 서명 상수 AUTHOR_SIG`,s.includes(`const AUTHOR_SIG=Object.freeze({author:'${OWNER}'`)&&s.includes(`id:'${sid}'`));
  chk(`${f}: 외부 글꼴 없음`,!/fonts\.googleapis|fonts\.gstatic/.test(s));}
const b=fs.readFileSync(path.join(root,'breadboard/index.html'),'utf8');
chk('저장 .json에 generator 서명',/circuitData=\(\)=>\(\{app:'breadboard-lab',v:2,generator:'브레드보드 CAD · © 2026 co2maker-cyber · '\+AUTHOR_SIG\.id/.test(b));
chk('거버 G04 서명',b.includes('G04 Generator: (c) 2026 co2maker-cyber, sig ${AUTHOR_SIG.id}*'));
chk('드릴 주석 서명',b.includes("; Generator: (c) 2026 co2maker-cyber, sig '+AUTHOR_SIG.id"));
chk('PCB README 서명',b.includes('서명 ${AUTHOR_SIG.id}\\n`;'));
chk('SVG 그림 서명',b.includes('(c) 2026 co2maker-cyber · 서명 ${AUTHOR_SIG.id} -->'));
chk('화면 [속성] © 줄',b.includes('© 2026 co2maker-cyber. All rights reserved.'));
const lib=fs.readFileSync(path.join(root,'breadboard/spice/bbcad-parts.lib'),'utf8');
chk('SPICE 라이브러리 저작권·서명',lib.includes('Copyright (c) 2026 co2maker-cyber. All rights reserved.')&&lib.includes(`저작자 서명 ID: ${ID}-BBCAD`));
console.log(bad?`sig-check FAIL (${bad})`:'sig-check PASS');process.exitCode=bad?1:0;
