// 순서 카드 시험: 모든 예제에서 카드를 만들어, 부품은 한 번씩, 전선은 정확히 한 번씩 연결 카드에 들어가는지,
// 연결 카드의 각 전선이 앞 전선이 닿은 줄에서 이어지는지(연속), [다 했어요]를 끝까지 누르면 연결 체크가 모두 ✓가 되는지
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const keys=await p.evaluate(()=>Object.keys(EXAMPLES).filter(k=>!BIG_EX.has(k)));let bad=0;
for(const k of keys){const r=await p.evaluate(k=>{const ex=EXAMPLES[k]();loadComps(Array.isArray(ex)?ex:ex.comps,false,Array.isArray(ex)?null:ex.boards);orthoWires();commit(true);
    const L=planSteps(),pc=new Map(),wc=new Map();let cont=true;
    for(const st of L){if(st.kind==='part')pc.set(st.c.id,(pc.get(st.c.id)||0)+1);else{let cur=st.st;for(const h of st.hops){wc.set(h.w.id,(wc.get(h.w.id)||0)+1);if(stripOf(h.from)!==cur)cont=false;cur=stripOf(h.to);}
      if(!planHTML(st).b.includes('도착'))cont=false;}}
    const parts=S.comps.filter(c=>c.t!=='wire'),wires=S.comps.filter(c=>c.t==='wire');
    const okP=parts.every(c=>pc.get(c.id)===1),okW=wires.every(c=>wc.get(c.id)===1);
    return{n:L.length,okP,okW,cont,np:parts.length,nw:wires.length};},k);
  const good=r.okP&&r.okW&&r.cont;if(!good)bad++;if(!good||process.argv.includes('-v'))console.log(`${good?'ok  ':'FAIL'} ${k.padEnd(9)} 카드 ${r.n} (부품 ${r.np}, 전선 ${r.nw}) 부품${r.okP?'○':'×'} 전선${r.okW?'○':'×'} 연속${r.cont?'○':'×'}`);}
// 한 예제로 끝까지 눌러 보기
await p.evaluate(()=>{const ex=EXAMPLES.counter();loadComps(Array.isArray(ex)?ex:ex.comps,false,Array.isArray(ex)?null:ex.boards);orthoWires();commit(true);});
await p.click('#hchk');await p.click('#bcbPlan');const n=await p.evaluate(()=>planSteps().length);
for(let i=0;i<n;i++)await p.click('#planGo');
const all=await p.evaluate(()=>chkable().every(c=>c.done)&&$('bcbTx').textContent);console.log('끝까지 [다 했어요] → 연결 체크',all);
await p.click('#planGo');const undone=await p.evaluate(()=>chkable().filter(c=>!c.done).length);console.log('한 번 더 누르면 그 카드만 취소',undone);
console.log(`예제 ${keys.length}개 · 문제 ${bad} · 페이지 오류 ${errs.length} ${errs.slice(0,2).join('|')}`);
console.log(bad===0&&!errs.length&&all&&undone>0?'plan-cards PASS':'plan-cards FAIL');await b.close();})();
