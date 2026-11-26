// 연결 체크 시험(휴대폰 화면): 화면 오른쪽 아래 ✓ 버튼으로 켜기 → 체크 막대(개수) → 부품 누르면 ✓ → [초기화] 두 번 → 모두 지워짐 → 실행 취소로 되살림.
// 회로도 화면도 같은 막대·초기화
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html')+'#nand');await p.waitForTimeout(1200);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log((v?'ok  ':'FAIL')+' '+n);};
const inView=async sel=>p.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;},sel);
chk('✓ 버튼이 휴대폰 화면 안에 보임',await inView('#hchk'));
await p.tap('#hchk');
chk('체크 막대가 화면 안에 보임',await inView('#bcbar'));
for(const t of ['res','wire','ic']){const pt=await p.evaluate(t=>{const c=S.comps.find(c=>c.t===t&&!c.done);const r=document.querySelector(`#bb [data-id="${c.id}"]`).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},t);await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(120);}
const tx=await p.evaluate(()=>$('bcbTx').textContent);chk('부품 3개 누르면 3/… '+tx,/^3\//.test(tx));
await p.tap('#bcbReset');chk('초기화 한 번은 확인만',await p.evaluate(()=>chkable().filter(c=>c.done).length===3&&$('bcbReset').textContent.includes('정말')));
await p.tap('#bcbReset');chk('두 번 누르면 모두 지움',await p.evaluate(()=>chkable().filter(c=>c.done).length===0&&/^0\//.test($('bcbTx').textContent)));
await p.evaluate(()=>undo());chk('실행 취소로 되살림',await p.evaluate(()=>chkable().filter(c=>c.done).length===3));
await p.tap('#bcbEnd');chk('끝내기 → 막대 숨김, ✓는 남음',await p.evaluate(()=>$('bcbar').hidden&&!bchk&&chkable().filter(c=>c.done).length===3));
// 회로도
await p.tap('[data-vm="sch"]');await p.waitForTimeout(500);
chk('회로도 ✓ 버튼 보임',await inView('#schk2'));await p.tap('#schk2');chk('회로도 체크 막대',await inView('#scbar'));
await p.evaluate(()=>{for(const w of SCH.wires.slice(0,2))schToggleDone(w.id);});
chk('회로도 2/…',/^2\//.test(await p.evaluate(()=>$('scbTx').textContent)));
await p.tap('#scbReset');await p.tap('#scbReset');chk('회로도 초기화',await p.evaluate(()=>SCH.wires.every(w=>!w.done)));
chk('페이지 오류 없음 '+errs.join('|'),!errs.length);
await p.tap('[data-vm="bb"]');await p.waitForTimeout(300);await p.tap('#hchk');await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT||'/dev/null'}).catch(()=>{});
console.log(ok.every(Boolean)?'check-reset PASS':'check-reset FAIL');await b.close();})();
