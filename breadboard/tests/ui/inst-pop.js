// 계측기 앞판(실제 장비처럼): 표시 창을 누르면 열림 · LCD 모든 값 · 키패드 입력 · 노브(±·휠·키보드) · 빠른 값 · 채널 키 · 하드 키(출력·파형) · 멀티미터 모드 · 끌면 안 열림 · 속성 창 [앞판 열기]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
await p.evaluate(()=>{const B=[{id:1,type:'full',x:0,y:0}];S.power=true;loadComps([{t:'psu',k:1,x:0,y:440},{t:'fg',k:2,x:220,y:440},{t:'osc',k:3,x:460,y:440},{t:'dmm',k:4,x:770,y:440},{t:'bat',k:5,x:940,y:440}],true,B);RT.clear();settle();render();fitView();});
await p.waitForTimeout(200);
const box=async(sel)=>{const r=await p.locator(sel).first().boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
const click=async sel=>{const q=await box(sel);await p.mouse.click(q.x,q.y);await p.waitForTimeout(120);};
const st=()=>p.evaluate(()=>{const e=document.getElementById('valPop');if(!e)return null;return{ch:(e.querySelector('[data-ch][aria-pressed="true"]')||{}).textContent||'',main:e.querySelector('.ipmv').textContent,rows:e.querySelectorAll('.iprow').length,scroll:e.scrollHeight>e.clientHeight+2,h:e.offsetHeight};});
const P=f=>p.evaluate(f);
// 파워 서플라이 CH2: 키패드 7.5 입력
await click('[data-ied="psu:1"]');let s=await st();T('PSU 앞판: CH2 키 눌림 · 스크롤 없음',s&&s.ch==='CH2'&&!s.scroll,JSON.stringify(s));
T('PC: 숫자 키패드 없이 키보드 안내',await P(()=>!document.querySelector('#valPop .ipkp')&&!!document.querySelector('#valPop .iphint')));
await p.keyboard.type('7.5');T('키보드 입력 중 LCD에 보임',(await st()).main==='7.5_');
await p.keyboard.press('Enter');await p.waitForTimeout(80);
await p.click('#valPop .iptog');await p.waitForTimeout(80);
let v=await P(()=>{const c=S.comps.find(x=>x.t==='psu');return[c.ch[0].v,c.ch[0].on,c.v];});T('7.5V 입력·출력 켜기, CH1 그대로',v[0]===7.5&&v[1]===true&&v[2]===5,JSON.stringify(v));
await p.click('#valPop [data-st="1"]');await p.waitForTimeout(60);T('+ 단추 한 칸(0.1)',await P(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===7.6);
await p.click('#valPop [data-fine]');await p.click('#valPop [data-st="-1"]');await p.waitForTimeout(60);T('크게 ×10 으로 − (1V)',await P(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===6.6);
const kb=await box('#valPop .knob');await p.mouse.move(kb.x,kb.y);await p.mouse.wheel(0,-100);await p.waitForTimeout(80);T('노브 휠로 올리기',await P(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===7.6);
await p.keyboard.type('12');await p.keyboard.press('Enter');await p.waitForTimeout(80);T('키보드 숫자 + Enter',await P(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===12);
await p.keyboard.press('ArrowDown');await p.waitForTimeout(60);T('키보드 ↓ 한 칸(크게)',await P(()=>S.comps.find(x=>x.t==='psu').ch[0].v)===11);
await p.click('#valPop [data-ch="psu:2"]');await p.click('#valPop [data-p="-12"]');await p.waitForTimeout(80);
T('채널 키 CH3 → 빠른 값 −12V',await P(()=>S.comps.find(x=>x.t==='psu').ch[1].v)===-12&&(await st()).ch==='CH3');
await p.mouse.click(5,300);await p.waitForTimeout(80);T('바깥 누르면 닫힘',(await st())===null);
await p.keyboard.press('Control+z');await p.waitForTimeout(80);T('실행 취소',await P(()=>S.comps.find(x=>x.t==='psu').ch[1].v)===3.3);
// 함수 발생기: LCD 줄 고르기, 파형 하드 키
await click('[data-ied="fg:2"]');s=await st();T('함수 발생기 CH3 앞판, 값 5줄 모두 보임',s.ch==='CH3'&&s.rows===5&&!s.scroll,JSON.stringify(s));
await p.click('#valPop .iprow:has-text("위상")');await p.click('#valPop [data-p="90"]');await p.waitForTimeout(60);await p.click('#valPop .ipseg [data-o="2"]');await p.waitForTimeout(60);
v=await P(()=>{const c=S.comps.find(x=>x.t==='fg');return[c.ch[1].ph,c.ch[1].wave];});T('위상 90° · 삼각파',v[0]===90&&v[1]==='tri',JSON.stringify(v));
await p.keyboard.press('Escape');await p.waitForTimeout(60);T('Esc로 닫힘',(await st())===null);
// 오실로스코프
await click('[data-ied="osc:2"]');await p.click('#valPop [data-p="5"]');await p.waitForTimeout(60);T('오실로스코프 CH3 5V/칸',await P(()=>S.comps.find(x=>x.t==='osc').vdiv3)===5);
await p.click('#valPop [data-ch="osc:t"]');await p.click('#valPop .ipseg button:has-text("겹침")');await p.waitForTimeout(60);T('시간 키 → 겹침 화면',await P(()=>S.comps.find(x=>x.t==='osc').split)===false);await p.keyboard.press('Escape');
// 멀티미터
await click('[data-ied="dmm:m:o"]');T('멀티미터 Ω 단추 바로',await P(()=>S.comps.find(x=>x.t==='dmm').mode)==='o'&&(await st())===null);
await click('[data-ied="dmm"]');s=await st();T('멀티미터 앞판에 읽은 값',s&&/OL|---|[0-9]/.test(s.main),JSON.stringify(s));await p.keyboard.press('Escape');
// 건전지
await click('[data-ied="bat"]');await p.click('#valPop [data-p="4.5"]');await p.waitForTimeout(60);T('건전지 4.5V',await P(()=>S.comps.find(x=>x.t==='bat').v)===4.5);await p.keyboard.press('Escape');
// 끌면 안 열림
const q=await box('[data-ied="psu:0"]');const x0=await P(()=>S.comps.find(x=>x.t==='psu').x);
await p.mouse.move(q.x,q.y);await p.mouse.down();await p.mouse.move(q.x+40,q.y+20,{steps:5});await p.mouse.up();await p.waitForTimeout(100);
T('끌면 옮겨지고 앞판은 안 열림',(await P(()=>S.comps.find(x=>x.t==='psu').x))!==x0&&(await st())===null);
// 속성 창 [앞판 열기]
await P(()=>{const c=S.comps.find(x=>x.t==='fg');sel={type:'comp',id:c.id};SEL.clear();SEL.add(c.id);renderInfo();});await p.evaluate(()=>document.getElementById('instPanel').click());await p.waitForTimeout(150);
T('속성 창 [앞판 열기]',((await st())||{}).ch==='CH1');
// 핸드폰(터치 화면): 숫자 키패드가 나오고 눌러서 입력
{const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const m=await ctx.newPage();m.on('pageerror',e=>errs.push(e.message));
 await m.goto('file://'+path.join(__dirname,'../../index.html'));await m.waitForTimeout(900);
 await m.evaluate(()=>{const B=[{id:1,type:'full',x:0,y:0}];S.power=true;loadComps([{t:'psu',k:1,x:0,y:440}],true,B);RT.clear();settle();render();openInstPop(S.comps[0],'psu:0',190,300);});await m.waitForTimeout(150);
 const kp=await m.evaluate(()=>!!document.querySelector('#valPop .ipkp'));for(const k of ['9','.','5'])await m.tap(`#valPop [data-k="${k}"]`);await m.tap('#valPop [data-enter]');await m.waitForTimeout(80);
 const r=await m.evaluate(()=>{const e=document.getElementById('valPop').getBoundingClientRect();return[S.comps[0].v,e.bottom<=innerHeight,e.top>=0];});
 T('핸드폰: 숫자 키패드로 9.5V 입력, 화면 안에 다 들어감',kp&&r[0]===9.5&&r[1]&&r[2],JSON.stringify([kp,...r]));await ctx.close();}
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'inst-pop FAIL':'inst-pop PASS');await b.close();})();
