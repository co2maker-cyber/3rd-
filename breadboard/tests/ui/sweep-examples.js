// 전체 점검 1: 예제마다 (a) 실행 중 오류 (b) 저장→다시 불러오기 왕복 (c) 회로도 화면 (d) 실행 취소
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});   // 글꼴(외부) 못 받는 것은 빼고
await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const keys=await p.evaluate(()=>Object.keys(EXAMPLES));
for(const k of keys){const e0=errs.length;
  await p.evaluate(k=>{$('ex').value=k;$('ex').onchange();},k);await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{const sig=()=>{settle();const by=new Map();S.comps.forEach(c=>by.set(c.id,c));
      // 연결 지문: 부품 핀마다 같은 연결인 핀 목록
      const net=new Map();for(const c of S.comps){if(c.t==='wire')continue;pinHoles(c).forEach((h,i)=>{const H=HOLES.get(h);if(!H)return;const n=SIM.netOf[H.i];if(!net.has(n))net.set(n,[]);net.get(n).push((c.chip||c.kind||c.t)+'@'+h+'#'+i);});}
      return [...net.values()].map(a=>a.sort().join(',')).sort().join('|');};
    const warns=SIM.warns.map(w=>w[1].slice(0,50));const n0=S.comps.length,s0=sig();
    const data=JSON.parse(JSON.stringify(circuitData()));
    loadComps([],false);applyCircuit(data,'x.json');const n1=S.comps.length,s1=sig();
    undo();const nu=S.comps.length;redo();const nr=S.comps.length;
    return{n0,n1,same:s0===s1,warns:warns.slice(0,3),nw:warns.length,undo:nu,redo:nr};});
  await p.evaluate(()=>setVM('sch'));await p.waitForTimeout(600);await p.evaluate(()=>setVM('bb'));await p.waitForTimeout(200);
  const bad=r.n0!==r.n1||!r.same||r.redo!==r.n1||errs.length>e0;
  console.log((bad?'BAD ':'ok  ')+k.padEnd(9)+JSON.stringify(r)+(errs.length>e0?' ERR '+errs.slice(e0).join(' / ').slice(0,300):''));}
await b.close();})();
