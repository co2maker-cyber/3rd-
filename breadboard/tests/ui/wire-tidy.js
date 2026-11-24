// 전선 정리 버튼 시험: 예제마다 전선을 엉클어 놓고 정리 → 규칙 점검
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html'));await p.waitForTimeout(800);
const keys=await p.evaluate(()=>Object.keys(EXAMPLES));const rows=[];let bad=0;
for(const k of keys){const r=await p.evaluate(k=>{
  const ex=EXAMPLES[k]();S.power=true;loadComps(Array.isArray(ex)?ex:ex.comps,false,Array.isArray(ex)?null:ex.boards);orthoWires();commit(true);
  const check=()=>{const W=S.comps.filter(c=>c.t==='wire'),segs=[];let diag=0,body=0;
    const R=S.comps.filter(c=>c.t!=='wire'&&!INST.has(c.t)).map(bodyRect).filter(Boolean);
    for(const c of W){const L=wirePts(c);for(let i=0;i<L.length-1;i++){const a=L[i],q=L[i+1];if(Math.abs(a.x-q.x)>.5&&Math.abs(a.y-q.y)>.5)diag++;segs.push([c.id,a,q]);
      const xa=Math.min(a.x,q.x),xb=Math.max(a.x,q.x),ya=Math.min(a.y,q.y),yb=Math.max(a.y,q.y);if(R.some(r=>xa<r.x1-2&&xb>r.x0+2&&ya<r.y1-2&&yb>r.y0+2))body++;}}
    let ov=0;for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){const [ci,a,b]=segs[i],[cj,c,d]=segs[j];if(ci===cj)continue;
      if(Math.abs(a.y-b.y)<.5&&Math.abs(c.y-d.y)<.5&&Math.abs(a.y-c.y)<3){const lo=Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x)),hi=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x));if(hi-lo>4)ov++;}
      if(Math.abs(a.x-b.x)<.5&&Math.abs(c.x-d.x)<.5&&Math.abs(a.x-c.x)<3){const lo=Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y)),hi=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y));if(hi-lo>4)ov++;}}
    return{n:W.length,diag,body,ov};};
  const base=check();
  // 엉클기: 꺾는 점을 비스듬히, 색은 아무렇게나
  const lit0=JSON.stringify([...SIM.led.values()].map(v=>v.lit));
  S.comps.filter(c=>c.t==='wire').forEach((c,i)=>{const a=HOLES.get(c.pins[0]),q=HOLES.get(c.pins[1]);if(a&&q)c.pts=[{x:(a.x+q.x)/2+13,y:(a.y+q.y)/2-37}];c.color='#9B5DE5';});commit(true);
  const messy=check();
  tidyWires('all');const after=check();settle();
  const fn=wireFnOf();const W=S.comps.filter(c=>c.t==='wire');
  const colOk=W.every(c=>c.color===FNC[fn(c.pins[0])][0]);
  const railRed=W.filter(c=>c.pins.some(h=>/^(\d+:)?(tp|bp)\d/.test(h))).every(c=>c.color===FNC.pwr[0]);
  const railBlk=W.filter(c=>c.pins.some(h=>/^(\d+:)?(tn|bn)\d/.test(h))).every(c=>c.color===FNC.gnd[0]);
  const lit1=JSON.stringify([...SIM.led.values()].map(v=>v.lit));
  undo();const und=check();
  return{k,base,messy,after,colOk,railRed,railBlk,same:lit0===lit1,undoDiag:und.diag};},k);
  const ok=r.after.diag===0&&r.after.body<=r.base.body&&r.after.ov<=r.base.ov&&r.colOk&&r.railRed&&r.railBlk&&r.undoDiag>0;if(!ok)bad++;
  rows.push((ok?'ok  ':'BAD ')+JSON.stringify(r));}
console.log(rows.join('\n'));
// 고른 전선만 + 메뉴
const sel=await p.evaluate(()=>{const ex=EXAMPLES[Object.keys(EXAMPLES)[0]]();loadComps(ex.comps||ex,false,ex.boards||null);orthoWires();commit(true);
  const W=S.comps.filter(c=>c.t==='wire');W.forEach(c=>c.color='#9B5DE5');setSelIds([W[0].id]);tidyWires('color');return W.filter(c=>c.color!=='#9B5DE5').length;});
await p.evaluate(()=>{SEL.clear();});await p.click('#wTidy');await p.waitForTimeout(100);const menu=await p.$$eval('#cmenu button',bs=>bs.map(b=>b.textContent));
await p.click('#cmenu button[data-i="0"]');await p.waitForTimeout(100);const toastTx=await p.$eval('#toast',e=>e.textContent);
console.log('sel only',sel,'menu',JSON.stringify(menu),'toast',toastTx);
console.log('errors',errs);console.log(!bad&&sel===1&&menu.length===3&&!errs.length?'t59 PASS':'t59 FAIL '+bad);await b.close();})();
