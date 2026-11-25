// 전체 점검 6: 예제마다 부품 지우기 → 저장(파일·이 기기·지난번) → 불러오기 → 회로도 화면 오가기 → 회로도에서 저항 값 바꾸기가 보드에 반영
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
const keys=await p.evaluate(()=>Object.keys(EXAMPLES));let bad=0;
for(const k of keys){const e0=errs.length;await p.evaluate(k=>{$('ex').value=k;$('ex').onchange();},k);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{const sig=()=>{settle();const net=new Map();for(const c of S.comps){if(c.t==='wire')continue;pinHoles(c).forEach((h,i)=>{const H=HOLES.get(h);if(!H)return;const n=SIM.netOf[H.i];if(!net.has(n))net.set(n,[]);net.get(n).push((c.chip||c.kind||c.t)+'@'+h+'#'+i);});}return [...net.values()].map(a=>a.sort().join(',')).sort().join('|');};
    setVM('sch');setVM('bb');
    // 앞쪽 부품 2개, 전선 2개 지우기(번호에 구멍이 생기게)
    const del=[...S.comps.filter(c=>c.t!=='wire'&&!INST.has(c.t)).slice(1,3),...S.comps.filter(c=>c.t==='wire').slice(0,2)];del.forEach(c=>delComp(c.id));
    setVM('sch');setVM('bb');const n0=S.comps.length,s0=sig();const res={};
    const data=JSON.parse(JSON.stringify(circuitData()));
    // 파일
    loadComps([],false);loadComps(data.comps,false,data.boards);schLoadIf(data.sch,data.comps);setVM('sch');setVM('bb');res.file=S.comps.length===n0&&sig()===s0;
    // 이 기기에 저장 → 불러오기 (saveLocal 경로와 같은 데이터)
    const rec={comps:JSON.parse(JSON.stringify(S.comps)),boards:JSON.parse(JSON.stringify(S.boards)),sch:JSON.parse(JSON.stringify(schData()))};
    loadComps([],false);loadComps(JSON.parse(JSON.stringify(rec.comps)),false,rec.boards);schLoadIf(rec.sch,rec.comps);setVM('sch');setVM('bb');res.local=S.comps.length===n0&&sig()===s0;
    // 회로도에서 저항 값 바꾸기 → 보드 반영
    const sp=SCH.parts.find(q=>q.t==='res'&&q.bid);if(sp){const c=compById(sp.bid);sPush();sp.ohms=sp.ohms===4700?1000:4700;sCommit();res.edit=c&&compById(sp.bid)&&compById(sp.bid).ohms===sp.ohms;}else res.edit='n/a';
    res.after=S.comps.length===n0;return res;});
  const ok=r.file&&r.local&&r.edit!==false&&r.after&&errs.length===e0;if(!ok)bad++;console.log((ok?'ok  ':'BAD ')+k.padEnd(9)+JSON.stringify(r)+(errs.length>e0?' ERR '+errs.slice(e0)[0]:''));}
console.log(bad?'sweep6 FAIL '+bad:'sweep6 PASS');await b.close();})();
