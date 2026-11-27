// 계측기 표시 창을 누르면 그 자리에서 값 바꾸기: 파워 서플라이 CH 전압·출력, 함수 발생기 채널, 오실로스코프 채널·시간, 멀티미터 모드 단추, 건전지, 끌면 열리지 않음
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
await p.evaluate(()=>{const B=[{id:1,type:'full',x:0,y:0}];S.power=true;loadComps([{t:'psu',k:1,x:0,y:440},{t:'fg',k:2,x:220,y:440},{t:'osc',k:3,x:460,y:440},{t:'dmm',k:4,x:770,y:440},{t:'bat',k:5,x:940,y:440}],true,B);RT.clear();settle();render();fitView();});
await p.waitForTimeout(200);
const box=async(sel)=>{const r=await p.locator(sel).first().boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
const click=async sel=>{const q=await box(sel);await p.mouse.click(q.x,q.y);await p.waitForTimeout(120);};
const pop=()=>p.evaluate(()=>{const e=document.getElementById('valPop');return e?e.querySelector('.vh span').textContent:null;});
// 파워 서플라이 CH2
await click('[data-ied="psu:1"]');T('PSU CH2 창 열림',(await pop())==='파워 서플라이 CH2',await pop());
await p.fill('#valPop input[data-i="0"]','7.5');await p.keyboard.press('Enter');await p.waitForTimeout(100);
await p.click('#valPop [data-i="1"][data-b="1"]');await p.waitForTimeout(100);
let st=await p.evaluate(()=>{const c=S.comps.find(x=>x.t==='psu');return[c.ch[0].v,c.ch[0].on,c.v,!!document.getElementById('valPop')];});
T('입력한 7.5V·켜기 반영, CH1 그대로, 창 열린 채',st[0]===7.5&&st[1]===true&&st[2]===5&&st[3],JSON.stringify(st));
await p.click('#valPop [data-i="0"][data-p="12"]');await p.waitForTimeout(80);T('자주 쓰는 값 단추',await p.evaluate(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===12);
await p.mouse.click(5,300);await p.waitForTimeout(80);T('바깥 누르면 닫힘',(await pop())===null);
await p.keyboard.press('Control+z');await p.waitForTimeout(80);T('실행 취소',await p.evaluate(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===7.5);
// 함수 발생기 CH3 위상
await click('[data-ied="fg:2"]');T('함수 발생기 CH3 창',(await pop())==='함수 발생기 CH3');
await p.click('#valPop [data-p="90"]');await p.waitForTimeout(80);await p.click('#valPop [data-o="2"]');await p.waitForTimeout(80);
st=await p.evaluate(()=>{const c=S.comps.find(x=>x.t==='fg');return[c.ch[1].ph,c.ch[1].wave];});T('위상 90°·삼각파',st[0]===90&&st[1]==='tri',JSON.stringify(st));
await p.keyboard.press('Escape');
// 오실로스코프 채널·시간
await click('[data-ied="osc:2"]');T('오실로스코프 CH3 창',(await pop())==='오실로스코프 CH3');await p.click('#valPop [data-p="5"]');await p.waitForTimeout(80);
T('CH3 전압/칸 5V',await p.evaluate(()=>S.comps.find(x=>x.t==='osc').vdiv3)===5);await p.keyboard.press('Escape');
await click('[data-ied="osc:t"]');T('오실로스코프 시간 창',(await pop())==='오실로스코프');await p.click('#valPop [data-o="1"]');await p.waitForTimeout(80);
T('겹침 화면으로',await p.evaluate(()=>S.comps.find(x=>x.t==='osc').split)===false);await p.keyboard.press('Escape');
// 멀티미터 모드 단추 바로
await click('[data-ied="dmm:m:o"]');T('멀티미터 Ω 단추 바로 바뀜',await p.evaluate(()=>S.comps.find(x=>x.t==='dmm').mode)==='o'&&(await pop())===null);
await click('[data-ied="dmm"]');T('멀티미터 화면 누르면 모드 창',/멀티미터/.test(await pop()||''));await p.keyboard.press('Escape');
// 건전지
await click('[data-ied="bat"]');await p.click('#valPop [data-p="4.5"]');await p.waitForTimeout(80);T('건전지 4.5V',await p.evaluate(()=>S.comps.find(x=>x.t==='bat').v)===4.5);await p.keyboard.press('Escape');
// 끌면 창이 안 열리고 옮겨짐
const q=await box('[data-ied="psu:0"]');const x0=await p.evaluate(()=>S.comps.find(x=>x.t==='psu').x);
await p.mouse.move(q.x,q.y);await p.mouse.down();await p.mouse.move(q.x+40,q.y+20,{steps:5});await p.mouse.up();await p.waitForTimeout(100);
T('끌면 옮겨지고 창은 안 열림',(await p.evaluate(()=>S.comps.find(x=>x.t==='psu').x))!==x0&&(await pop())===null);
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'inst-pop FAIL':'inst-pop PASS');await b.close();})();
