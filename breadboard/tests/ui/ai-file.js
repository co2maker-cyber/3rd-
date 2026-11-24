// AI 회로 · 안내서 · 붙여 넣기 적용 시험
const {chromium}=require('playwright');const fs=require('fs');
const md=fs.readFileSync(require('path').join(__dirname,'../../')+'FILE-FORMAT.md','utf8');
const B=[...md.matchAll(/```json\n([\s\S]*?)```/g)].map(m=>m[1]).find(x=>x.includes('"app"')&&x.includes('74LS08'));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
// 가짜 claude.sample: 첫 답은 틀린 핀, 둘째 답은 올바름
await p.addInitScript(()=>{window.__calls=[];window.claude={use:async k=>k==='sample'?{limits:async()=>({images:true}),json:async(prompt)=>{window.__calls.push(prompt);
  if(window.__calls.length===1)return{title:'시험',parts:[{ref:'U1',type:'74LS86'},{ref:'D1',type:'led',value:'red'}],nets:[{name:'Y',pins:['U1.3','D1.Z']}]};
  return{title:'XOR 시험',parts:[{ref:'U1',type:'74LS86'},{ref:'SW1',type:'switch',value:'on'},{ref:'SW2',type:'switch'},{ref:'R1',type:'resistor',value:'10k'},{ref:'R2',type:'resistor',value:'10k'},{ref:'R3',type:'resistor',value:'330'},{ref:'D1',type:'led',value:'red'}],
   nets:[{name:'VCC',pins:['U1.14','SW1.1','SW2.1']},{name:'GND',pins:['U1.7','R1.2','R2.2','R3.2']},{name:'A',pins:['SW1.2','R1.1','U1.1']},{name:'B',pins:['SW2.2','R2.1','U1.2']},{name:'Y',pins:['U1.3','D1.A']},{name:'L',pins:['D1.K','R3.1']}],notes:['SW1, SW2로 입력을 바꿔요']};}}:null};});
await p.addInitScript(()=>{window.showSaveFilePicker=undefined;});
await p.goto('file://'+require('path').join(__dirname,'../../index.html'));await p.waitForTimeout(800);
const out={};
await p.click('#aiBtn');await p.waitForTimeout(150);out.dlg=await p.$eval('#impDlg',e=>!e.hidden);out.focus=await p.evaluate(()=>document.activeElement.id);
// 안내서 보기
await p.click('#gView');await p.waitForTimeout(150);out.guide=await p.evaluate(()=>({open:!$('guideDlg').hidden,h2:$('gBody').querySelectorAll('h2').length,tables:$('gBody').querySelectorAll('table').length,pre:$('gBody').querySelectorAll('pre').length,rows:$('gBody').querySelectorAll('tr').length}));

await p.keyboard.press('Escape');out.afterEsc=await p.evaluate(()=>({g:$('guideDlg').hidden,i:$('impDlg').hidden}));
out.noAi={btn:await p.$('#aiGo'),steps:await p.$$eval('.aistep li',l=>l.length)};
await p.fill('#impText','');
// 다른 AI 답(설명 + ```json B 형식```)을 붙여 넣어 적용
await p.fill('#impText','네, 만들었어요!\n```json\n'+B+'\n```\n불러와 보세요.');await p.click('#impGo');await p.waitForTimeout(300);
out.pasteB=await p.evaluate(()=>{settle();return{dlg:$('impDlg').hidden,n:S.comps.length,name:curName,lit:S.comps.filter(c=>c.t==='led').map(c=>(SIM.led.get(c.id)||{}).lit)};});
// A 형식 목록이 ```text 블록 안에 든 답
await p.click('#upl');await p.fill('#impText','회로예요:\n```text\nU1 74LS04\nSW1 스위치 on\nR1 저항 10k\nD1 LED green\nR2 저항 330\nVCC: SW1.1\nA: SW1.2, R1.1, U1.1\nGND: R1.2, R2.2\nY: U1.2, D1.A\nL: D1.K, R2.1\n```');await p.click('#impGo');await p.waitForTimeout(300);
out.pasteA=await p.evaluate(()=>{settle();return{n:S.comps.filter(c=>c.t!=='wire').length,lit:S.comps.filter(c=>c.t==='led').map(c=>(SIM.led.get(c.id)||{}).lit)};});
// md 파일 올리기 (B 형식이 코드 블록에)
await p.click('#upl');await p.setInputFiles('#impFile',{name:'ai-answer.md',mimeType:'text/markdown',buffer:Buffer.from('# 답\n```json\n'+B+'\n```')});await p.waitForTimeout(400);
out.fileMd=await p.evaluate(()=>({dlg:$('impDlg').hidden,n:S.comps.length,name:curName}));
// 복사(클립보드) — 실패해도 파일 저장으로 넘어감
await p.click('#upl');await ctx.grantPermissions(['clipboard-read','clipboard-write']);await p.fill('#aiAsk','카운터');await p.click('#aiCopy');await p.waitForTimeout(200);
out.copy={msg:await p.$eval('#impMsg',e=>e.textContent.slice(0,30)),clip:await p.evaluate(async()=>{try{const t=await navigator.clipboard.readText();return t.slice(0,60)+' … '+t.length;}catch(e){return 'x '+e.message;}})};
// 안내서 내려받기
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:3000}).catch(()=>null),p.click('#gSave')]);out.dl=dl?dl.suggestedFilename():null;
out.errs=errs;console.log(JSON.stringify(out,null,1));
const ok=out.guide.tables>=9&&out.noAi.btn===null&&out.noAi.steps===3&&(await p.evaluate(()=>window.__calls.length))===0&&out.pasteB.dlg&&out.pasteB.n===13&&out.pasteB.lit[0]===true&&out.pasteA.lit[0]===false&&out.fileMd.n===13&&out.dl&&!errs.length;
console.log(ok?'t58 PASS':'t58 FAIL');await b.close();})();
