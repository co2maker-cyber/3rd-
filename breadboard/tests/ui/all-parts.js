// ⓩ 모든 부품 예제: (1) 부품 창의 모든 칸이 하나 이상 놓였는지 (2) 모든 핀이 다른 부품에 이어졌는지(떠 있는 핀 없음)
// (3) 전체가 회로 하나로 이어졌는지 (4) 경고·오류 없음 (5) 한 번 계산이 너무 느리지 않은지
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const tl=await p.evaluate(()=>{const t=performance.now();$('ex').value='zall';$('ex').onchange();return Math.round(performance.now()-t);});await p.waitForTimeout(1500);console.log('불러오기 ms',tl);
const r=await p.evaluate(()=>{const fail=[];
  const t0=performance.now();settle();const ms=performance.now()-t0;
  // (1) 부품 창 칸마다 놓인 부품 찾기
  const keys=[];const walk=n=>{(n.items||[]).forEach(it=>keys.push(it.t[0]));(n.kids||[]).forEach(walk);};PTREE.forEach(walk);
  const has=f=>S.comps.some(f);
  const miss=[...new Set(keys)].filter(k=>{let m;
    if(k.startsWith('ic:'))return!has(c=>c.t==='ic'&&c.chip===k.slice(3));
    if(k.startsWith('px:'))return!has(c=>c.t==='px'&&c.kind===k.slice(3));
    if(k.startsWith('gate:'))return!has(c=>c.t==='gate'&&c.kind===k.slice(5));
    if((m=/^led([@#%])(.+)$/.exec(k)))return!has(c=>c.t==='led'&&c[{'@':'pk','#':'ln','%':'lk'}[m[1]]]===m[2]);
    if((m=/^res@([\d.]+):(\w+)$/.exec(k)))return!has(c=>c.t==='res'&&(c.pw||.25)===+m[1]&&(c.mat||'carbon')===m[2]);
    if((m=/^cap@(\w+)$/.exec(k)))return!has(c=>c.t==='cap'&&c.dk===m[1]);
    if(k==='led3'||k==='led3a')return!has(c=>c.t==='led3'&&!!c.ca===(k==='led3a'));
    return!has(c=>c.t===k);});
  if(miss.length)fail.push('안 놓인 칸 '+miss.length+': '+miss.slice(0,10).join(' '));
  // (2) 핀마다: 같은 줄에 다른 부품 핀이 하나 이상
  const net=new Map(),nid=id=>{const h=HOLES.get(id);return h?SIM.netOf[h.i]:null;};
  for(const c of S.comps){if(c.t==='wire')continue;pinHoles(c).forEach((h,i)=>{const n=nid(h);if(n==null){fail.push('구멍 없음 '+c.t+' '+h);return;}if(!net.has(n))net.set(n,new Set());net.get(n).add(c.id);});}
  let lone=0;const loneEx=[];
  for(const c of S.comps){if(c.t==='wire')continue;pinHoles(c).forEach((h,i)=>{const n=nid(h);if(n!=null&&net.get(n).size<2){lone++;if(loneEx.length<8)loneEx.push((c.kind||c.chip||c.t)+':'+pinNames(c)[i]);}});}
  if(lone)fail.push('떠 있는 핀 '+lone+': '+loneEx.join(' '));
  // (3) 회로 하나: 부품 = 자기 핀 줄을 하나로 묶음
  const par=new Map(),fd=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x);}return x;},mk=x=>{if(!par.has(x))par.set(x,x);};
  for(const c of S.comps){if(c.t==='wire')continue;const ns=pinHoles(c).map(nid).filter(n=>n!=null);ns.forEach(mk);for(const n of ns.slice(1))par.set(fd(n),fd(ns[0]));}
  const roots=new Set(S.comps.filter(c=>c.t!=='wire').map(c=>fd(nid(pinHoles(c)[0]))));
  if(roots.size!==1)fail.push('따로 떨어진 덩어리 '+roots.size+'개');
  // (4) 경고
  const warns=SIM.warns.filter(w=>w[0]!=='info');if(warns.length)fail.push('경고 '+warns.length+': '+warns.slice(0,3).map(w=>w[1].slice(0,60)).join(' / '));
  // (5) 속도
  if(ms>6000)fail.push('계산이 느려요 '+Math.round(ms)+'ms');
  return{fail,ms:Math.round(ms),n:S.comps.length,parts:S.comps.filter(c=>c.t!=='wire'&&c.t!=='res').length,boards:S.boards.length,keys:new Set(keys).size};});
// (6) 회로도·PCB 전환은 막고 브레드보드에 남기, 저장→다시 열기 왕복·실행 취소
const r2=await p.evaluate(()=>{const o=[];setVM('sch');if(VM!=='bb')o.push('회로도로 바뀜');setVM('pcb');if(VM!=='bb')o.push('PCB로 바뀜');
  const n=S.comps.length,d=JSON.stringify(circuitData());loadComps([],false);applyCircuit(JSON.parse(d),'x.json');if(S.comps.length!==n)o.push(`왕복 ${n}→${S.comps.length}`);
  undo();const nu=S.comps.length;redo();if(nu!==0||S.comps.length!==n)o.push(`실행 취소 ${nu}·다시 ${S.comps.length}`);return o;});
r.fail.push(...r2);
if(errs.length)r.fail.push('페이지 오류: '+errs.slice(0,3).join(' / '));
console.log(JSON.stringify({ms:r.ms,n:r.n,parts:r.parts,boards:r.boards,keys:r.keys}));
r.fail.forEach(f=>console.log('FAIL',f));
console.log(r.fail.length?'all-parts FAIL':'all-parts PASS');
await b.close();process.exit(r.fail.length?1:0);})();
