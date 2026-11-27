// PCB 시험 1: 모든 예제를 PCB로 바꿔 자동 배선 → 안 이은 연결 수, 점검(DRC) 오류, 걸린 시간, 페이지 오류를 본다.
// 자동 배선이 만든 선은 점검 오류(간격·단락·보드 밖)가 하나도 없어야 한다
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const keys=await p.evaluate(()=>Object.keys(EXAMPLES).filter(k=>!BIG_EX.has(k)));let bad=0,left=0,tot=0;const V=process.argv.includes('-v');
for(const k of keys){const r=await p.evaluate(async k=>{setVM('bb');const ex=EXAMPLES[k]();loadComps(Array.isArray(ex)?ex:ex.comps,false,Array.isArray(ex)?null:ex.boards);orthoWires();commit(true);
    setVM('pcb');const C0=pcalc(),r0=C0.rats.length,t0=performance.now();if(r0)pcbAutoRoute();const ms=Math.round(performance.now()-t0);const C=pcalc(),E=pcbDRC().filter(e=>e.k==='bad');
    return{fps:C.fps.length,r0,left:C.rats.length,ms,bad:E.map(e=>e.t),w:PCB.w,h:PCB.h,vias:PCB.vias.length};},k);
  tot+=r.r0;left+=r.left;if(r.bad.length)bad++;
  if(V||r.bad.length||r.left)console.log(`${k.padEnd(9)} 부품 ${r.fps} 연결 ${r.r0} 못이음 ${r.left} 비아 ${r.vias} ${r.w}×${r.h}mm ${r.ms}ms ${r.bad.slice(0,2).join(' / ')}`);}
console.log(`예제 ${keys.length}개 · 연결 ${tot} · 못 이음 ${left} · 점검 오류 난 예제 ${bad} · 페이지 오류 ${errs.length} ${errs.slice(0,3).join('|')}`);
console.log(bad===0&&errs.length===0?'pcb-examples PASS':'pcb-examples FAIL');await b.close();})();
