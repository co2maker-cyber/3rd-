// 부품 고르기 검색(7490 → 74LS90, Enter로 바로 놓기), 회로도 우클릭 삭제, 회로도에 IC 모든 핀(VCC·GND·NC) 보이기
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
await p.evaluate(()=>{loadComps([],true,[{id:1,type:'full',x:0,y:0}]);});
T('검색 낱말 맞추기',await p.evaluate(()=>pqNorm('74LS90')==='7490'&&pqNorm('74HC161')==='74161'&&pqNorm('74 ls 47')==='7447'));
await p.click('#partOpen');await p.fill('#partQ','7490');await p.waitForTimeout(80);const f1=await p.evaluate(()=>PFIRST);T('7490 → 첫 결과 74LS90',f1==='ic:74LS90',f1);
await p.press('#partQ','Enter');await p.waitForTimeout(150);T('Enter로 바로 놓기(창 닫힘)',await p.evaluate(()=>S.comps.some(c=>c.chip==='74LS90')&&$('partDlg').hidden&&tool==='select'));
await p.click('#partOpen');await p.fill('#partQ','4511');await p.waitForTimeout(80);T('4511 → CD4511',await p.evaluate(()=>PFIRST==='ic:CD4511'),await p.evaluate(()=>PFIRST));
await p.fill('#partQ','bs170');await p.press('#partQ','Enter');await p.waitForTimeout(150);T('px 부품도 Enter로 빈자리에',await p.evaluate(()=>S.comps.some(c=>c.kind==='mbs170')));
await p.click('#partOpen');await p.fill('#partQ','zzzz');await p.press('#partQ','Enter');await p.waitForTimeout(80);T('없는 부품 Enter는 아무것도 안 놓음',await p.evaluate(()=>S.comps.length===2));await p.keyboard.press('Escape');
// 회로도: 모든 핀 · 가져올 때 전원 핀도 이어짐 · 우클릭 삭제
await p.evaluate(()=>{const ex=EXAMPLES.paana?null:null;setVM('sch');});await p.waitForTimeout(400);
const pins=await p.evaluate(()=>{const ic=SCH.parts.find(x=>x.t==='ic');return symOf(ic).pins.length;});T('회로도 74LS90 핀 14개 모두',pins===14,pins);

const box=await p.evaluate(()=>{const ic=SCH.parts.find(x=>x.t==='ic');const el=document.querySelector(`#sch [data-sp="${ic.id}"] .shit`)||document.querySelector(`#sch [data-sp="${ic.id}"]`);const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
await p.mouse.click(box.x,box.y,{button:'right'});await p.waitForTimeout(120);const menu=await p.evaluate(()=>[...document.querySelectorAll('#cmenu [data-i]')].map(b=>b.textContent).join('|'));T('우클릭 메뉴: 돌리기·삭제',/돌리기/.test(menu)&&/삭제/.test(menu),menu);
const n0=await p.evaluate(()=>SCH.parts.length);await p.evaluate(()=>[...document.querySelectorAll('#cmenu [data-i]')].find(b=>/삭제/.test(b.textContent)).click());await p.waitForTimeout(120);
T('우클릭 → 삭제로 지워짐',await p.evaluate(n0=>SCH.parts.length<n0&&!SCH.parts.some(x=>x.t==='ic'),n0));
const wbox=await p.evaluate(()=>{const el=document.querySelector('#sch [data-sw]');if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,id:+el.dataset.sw};});
if(wbox){await p.mouse.click(wbox.x,wbox.y,{button:'right'});await p.waitForTimeout(120);const m2=await p.evaluate(()=>[...document.querySelectorAll('#cmenu [data-i]')].map(b=>b.textContent).join('|'));T('선 우클릭 메뉴: 선 삭제',/선 삭제/.test(m2),m2);await p.keyboard.press('Escape');}
// 전원선이 이어진 예제(4비트 카운터)를 회로도로 가져오면 IC VCC 핀이 VCC 기호와 이어진다
const pw=await p.evaluate(()=>{setVM('bb');const ex=EXAMPLES.cnt4?EXAMPLES.cnt4():null;const k=Object.keys(EXAMPLES).find(k=>{const e=EXAMPLES[k]();const cs=Array.isArray(e)?e:e.comps;return cs.some(c=>c.t==='ic'&&CHIPS[c.chip]&&!CHIPS[c.chip].free);});
  const e=EXAMPLES[k]();S.power=true;loadComps(Array.isArray(e)?e:e.comps,false,Array.isArray(e)?null:e.boards);commit(true);setVM('sch');boardToSch();
  const ic=SCH.parts.find(x=>x.t==='ic'&&!CHIPS[x.chip].free),d=CHIPS[ic.chip],kv=d.pins.indexOf(d.vcc);return{k,ok:SCH.wires.some(w=>(w.a.p===ic.id&&w.a.k===kv)||(w.b.p===ic.id&&w.b.k===kv))};});
T('가져온 회로도에서 IC VCC 핀이 이어짐',pw.ok,pw.k);
await p.evaluate(()=>setVM('bb'));
for(const r of out)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);console.log('errors',errs);
const bad=out.filter(r=>!r.ok).length+errs.length;console.log(bad?'search-sch FAIL':'search-sch PASS');await b.close();})();
