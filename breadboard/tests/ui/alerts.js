// 오류 알림 시험: 저항 없는 LED를 꽂으면 알림 카드가 뜨고, 그 부품에 테두리가 그려지고, [보기]를 누르면 그 부품이 선택되는지.
// 닫은 뒤 같은 문제가 계속 있어도 다시 뜨지 않는지, 문제를 고치면 테두리가 사라지는지도 본다
const {chromium}=require('playwright');
const SPEC=JSON.stringify({title:'저항 없는 LED',parts:[{ref:'D1',type:'led',value:'red'}],nets:[{name:'VCC',pins:['D1.A']},{name:'GND',pins:['D1.K']}]});
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
await p.click('#upl');await p.fill('#impText',SPEC);await p.waitForTimeout(300);await p.click('#impGo');await p.waitForTimeout(600);
const ok=[];const chk=(n,v)=>{ok.push(v);console.log((v?'ok  ':'FAIL')+' '+n);};
const a=await p.evaluate(()=>({n:document.querySelectorAll('#alerts .alert').length,t:document.querySelector('#alerts .alert')?.textContent||'',ring:document.querySelectorAll('#bb .wring').length,go:!!document.querySelector('#alerts [data-go]')}));
chk('알림 카드가 떠요: '+a.t.slice(0,40),a.n>=1&&/저항 없이/.test(a.t));
chk('부품에 테두리',a.ring>=1);
chk('[보기] 버튼',a.go);
await p.click('#alerts [data-go]');await p.waitForTimeout(200);
const s1=await p.evaluate(()=>({sel:sel&&sel.type==='comp'?compById(sel.id).t:null,n:document.querySelectorAll('#alerts .alert').length}));
chk('[보기] → LED 선택, 알림 닫힘',s1.sel==='led'&&s1.n===0);
for(let i=0;i<5;i++){await p.evaluate(()=>{settle();render();});await p.waitForTimeout(100);}
chk('같은 문제로 다시 안 뜸',await p.evaluate(()=>document.querySelectorAll('#alerts .alert').length)===0);
await p.evaluate(()=>{const c=S.comps.find(c=>c.t==='led');c.lk='res';commit(true);});await p.waitForTimeout(200);
chk('고치면 테두리 사라짐',await p.evaluate(()=>document.querySelectorAll('#bb .wring').length)===0);
await p.evaluate(()=>{const c=S.comps.find(c=>c.t==='led');delete c.lk;commit(true);});await p.waitForTimeout(3300);
await p.evaluate(()=>{settle();render();});await p.waitForTimeout(100);
// 3초 넘게 없다가 다시 생긴 게 아니라 바로 되살렸으므로: 3초 안에 다시 생기면 안 뜨고, 지금은 계속 있던 상태라 안 뜸
chk('점검 목록 항목 누르면 보기',await p.evaluate(()=>{const li=document.querySelector('#warns li[data-wid]');if(!li)return false;sel=null;li.click();return !!sel;}));
chk('페이지 오류 없음 '+errs.join('|'),!errs.length);
await p.screenshot({path:process.env.SHOT||'/dev/null'}).catch(()=>{});
console.log(ok.every(Boolean)?'alerts PASS':'alerts FAIL');await b.close();})();
