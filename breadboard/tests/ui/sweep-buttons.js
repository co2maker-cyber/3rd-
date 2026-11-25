// 전체 점검 4: 화면의 모든 버튼·메뉴·창을 눌러 본다(데스크톱·휴대폰), 가로 스크롤, 단축키
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [nm,opt] of [['desktop',{viewport:{width:1300,height:850}}],['phone',{...devices['iPhone 13']}]]){
  const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});   // 글꼴(외부) 못 받는 것은 빼고
  await p.addInitScript(()=>{window.showSaveFilePicker=undefined;});
  await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'#sync10');await p.waitForTimeout(1200);
  await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
  const ids=await p.evaluate(()=>[...document.querySelectorAll('button[id], .tbtn, [data-dock], [data-tool], [data-tab]')].filter(b=>b.offsetParent!==null||b.closest('.toolbar')).map((b,i)=>{b.dataset.sweep=i;return i;}));
  const skip=/clr|새로/;let clicked=0;
  for(const i of ids){const info=await p.evaluate(i=>{const b=document.querySelector(`[data-sweep="${i}"]`);return b?(b.id||'')+'|'+b.textContent.trim().slice(0,12):null;},i);if(!info||skip.test(info))continue;
    const e0=errs.length;
    try{await p.evaluate(i=>{const b=document.querySelector(`[data-sweep="${i}"]`);b&&!b.disabled&&b.click();},i);await p.waitForTimeout(120);clicked++;}catch(e){errs.push('click '+info+' '+e.message);}
    // 열린 창·메뉴 닫기
    await p.keyboard.press('Escape');await p.evaluate(()=>{for(const id of ['impDlg','guideDlg','saveDlg','partDlg']){const d=document.getElementById(id);if(d)d.hidden=true;}closeMenu&&closeMenu();});
    if(errs.length>e0)errs.push('  ↑ after '+info);}
  // 단축키
  for(const k of ['v','e','w','m','f','+','-','Delete','Control+z','Control+y','Control+d','Control+c','Control+v','Control+s'])
    {await p.keyboard.press(k);await p.waitForTimeout(60);await p.keyboard.press('Escape');}
  // 회로도 화면 버튼
  await p.evaluate(()=>setVM('sch'));await p.waitForTimeout(400);
  const sids=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&!/새로|모두 지우기/.test(b.textContent)).map((b,i)=>{b.dataset.sw2=i;return i;}));
  for(const i of sids){const e0=errs.length;const info=await p.evaluate(i=>{const b=document.querySelector(`[data-sw2="${i}"]`);if(!b||b.disabled)return null;const t=(b.id||'')+'|'+b.textContent.trim().slice(0,12);b.click();return t;},i);
    await p.waitForTimeout(100);await p.keyboard.press('Escape');await p.evaluate(()=>{for(const id of ['impDlg','guideDlg','saveDlg','partDlg']){const d=document.getElementById(id);if(d)d.hidden=true;}closeMenu&&closeMenu();});if(errs.length>e0)errs.push('  ↑ sch after '+info);}
  await p.evaluate(()=>setVM('bb'));await p.waitForTimeout(200);
  const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
  console.log(nm,'clicked',clicked,'+',sids.length,'scroll',sw.join('/'),'errors',errs.length);console.log(JSON.stringify(errs.slice(0,20)));await ctx.close();}
await b.close();})();
