// 자동 배치(목록 → 보드) 점검: 연결이 목록과 똑같은지(빠짐·합선 없음), 보드 장수, 전선 규칙
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const extra=process.argv.slice(2).map(f=>[path.basename(f),fs.readFileSync(f,'utf8')]);
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(800);
const md=fs.readFileSync(path.join(__dirname,'../../FILE-FORMAT.md'),'utf8');
const cases=[['IMPORT_EXAMPLE',null],['md-A1',md.match(/```text\n(# 부품[\s\S]*?)```/)[1]],['md-A4',md.match(/```json\n(\{\n  "title"[\s\S]*?)```/)[1]],...extra];
let bad=0;
for(const [name,src] of cases){const r=await p.evaluate(([name,src])=>{const txt=src==null?IMPORT_EXAMPLE:(pickPayload(src).json?specToText(pickPayload(src).json):src);
  const sp=parseSpec(txt);const out=autoLayout(sp);S.comps=out.comps;S.nextId=out.comps.length+1;S.power=true;RT.clear();renderBoards();applyWireRules(S.comps.filter(c=>c.t==='wire'),'all');commit(true);S.comps.forEach(c=>{if(c.t==='sw')c.on=false;if(c.t==='px'&&c.bits)c.bits=c.bits.map(()=>0);});settle();
  const by=out.byRef,nOf=(ref,pin)=>{const c=by.get(ref);const k=pinIndex(null,c,pin);const h=HOLES.get(pinHoles(c)[k]);return SIM.netOf[h.i];};
  const rails=s=>new Set(HL.filter(h=>h.r===(s==='+'?'tp':'tn')||h.r===(s==='+'?'bp':'bn')).map(h=>SIM.netOf[h.i]));
  const probs=[];const groups=[];
  for(const n of sp.nets){const sign=POWER_P.test(n.name)?'+':POWER_N.test(n.name)?'-':null;const ids=new Set(n.pins.filter(q=>by.get(q.ref)&&pinIndex(null,by.get(q.ref),q.pin)>=0).map(q=>nOf(q.ref,q.pin)));if(sign){const R=rails(sign);const bad=[...ids].filter(x=>!R.has(x));if(bad.length)probs.push('전원 끊김 '+n.name);ids.forEach(x=>groups.push([n.name,x]));continue;}
    if(ids.size>1)probs.push('끊김 '+n.name);groups.push([n.name,[...ids][0]]);}
  // 서로 다른 연결이 붙었는가(전원끼리는 같은 이름이면 같다)
  const seen=new Map();for(const [nm,id] of groups){const k=POWER_P.test(nm)?'VCC':POWER_N.test(nm)?'GND':nm;if(seen.has(id)&&seen.get(id)!==k)probs.push('합선 '+seen.get(id)+'='+k);seen.set(id,k);}
  // 부품 핀이 서로 다른 핀과 엉뚱하게 같은 구멍? 겹치는 구멍
  const hs=new Map();for(const c of S.comps)for(const h of pinHoles(c)){if(h[0]==='@')continue;if(hs.has(h))probs.push('구멍 겹침 '+h);hs.set(h,1);}
  const W=S.comps.filter(c=>c.t==='wire');let diag=0;for(const c of W){const L=wirePts(c);for(let i=0;i<L.length-1;i++)if(Math.abs(L[i].x-L[i+1].x)>.5&&Math.abs(L[i].y-L[i+1].y)>.5)diag++;}
  return{name,parts:sp.parts.length,placed:out.report.placed,wires:W.length,boards:out.report.boards,fail:out.report.fail,probs,diag,warns:SIM.warns.map(w=>w[1].slice(0,40))};},[name,src]);
  const ok=!r.probs.length&&!r.fail.length&&r.diag===0&&r.placed===r.parts;if(!ok)bad++;console.log((ok?'ok  ':'BAD ')+JSON.stringify(r));}
console.log('errors',errs);console.log(!bad&&!errs.length?'t60 PASS':'t60 FAIL');await b.close();})();
