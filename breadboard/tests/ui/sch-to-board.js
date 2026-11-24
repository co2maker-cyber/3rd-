// 회로도 → 브레드보드(schToBoard): 예제마다 회로도 연결과 새 보드 연결이 같은지
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html'));await p.waitForTimeout(800);
const keys=await p.evaluate(()=>Object.keys(EXAMPLES));let bad=0;
for(const k of keys){await p.evaluate(k=>{const ex=EXAMPLES[k]();S.power=true;loadComps(Array.isArray(ex)?ex:ex.comps,false,Array.isArray(ex)?null:ex.boards);orthoWires();commit(true);setVM('sch');},k);await p.waitForTimeout(150);
  const r=await p.evaluate(k=>{const t0=performance.now();const spec=schToSpec();schToBoard();const ms=Math.round(performance.now()-t0);
    S.comps.forEach(c=>{if(c.t==='sw')c.on=false;if(c.t==='px'&&c.bits)c.bits=c.bits.map(()=>0);if(c.t==='px'&&c.s!=null)c.s=0;});settle();
    const by=new Map();for(const p_ of SCH.parts){const c=p_.bid&&compById(p_.bid);const ref=spec.refOf.get(p_.id);if(c&&ref)by.set(ref,c);}
    const nOf=(ref,pin)=>{const c=by.get(ref);if(!c)return null;const k=pinIndex(null,c,pin);if(k<0)return null;const h=HOLES.get(pinHoles(c)[k]);return h?SIM.netOf[h.i]:null;};
    const rails=s=>new Set(HL.filter(h=>h.r===(s==='+'?'tp':'tn')||h.r===(s==='+'?'bp':'bn')).map(h=>SIM.netOf[h.i]));
    const probs=[],groups=[];
    for(const n of spec.nets){const sign=POWER_P.test(n.name)?'+':POWER_N.test(n.name)?'-':null;const ids=new Set(n.pins.map(q=>nOf(q.ref,q.pin)).filter(x=>x!=null));
      if(sign){const R=rails(sign);if([...ids].some(x=>!R.has(x)))probs.push('전원끊김 '+n.name);ids.forEach(x=>groups.push([sign,x]));continue;}
      if(ids.size>1)probs.push('끊김 '+n.name);ids.forEach(x=>groups.push([n.name,x]));}
    // 스위치 접점(기본 위치에서 붙어 있는 공통 단자)이 있으면 연결이 합쳐지는 게 정상이라 합선 검사는 건너뛴다
    const hasContacts=S.comps.some(c=>c.t==='px'&&PX[c.kind].contacts);
    if(!hasContacts){const seen=new Map();for(const [nm,id] of groups){if(seen.has(id)&&seen.get(id)!==nm)probs.push('합선 '+seen.get(id)+'='+nm);seen.set(id,nm);}}
    const W=S.comps.filter(c=>c.t==='wire');
    return{k,parts:spec.parts.length,placed:by.size,boards:S.boards.length,wires:W.length,ms,probs:probs.slice(0,4),fail:(spec.errors||[]).length};},k);
  const ok=!r.probs.length&&r.placed===r.parts;if(!ok)bad++;console.log((ok?'ok  ':'BAD ')+JSON.stringify(r));}
console.log('errors',errs);console.log(!bad&&!errs.length?'t61 PASS':'t61 FAIL '+bad);await b.close();})();
