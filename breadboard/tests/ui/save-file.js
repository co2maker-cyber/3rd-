// 파일 저장 시험: ① 휴대폰(터치, 공유 창 없음) → 보통 내려받기로 .md가 받아지는지
// ② 미리보기처럼 틀(iframe) 안 → 내려받기 대신 [전체 복사] 창이 뜨고 안내서 내용이 다 들어 있는지
const {chromium,devices}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
(async()=>{const b=await chromium.launch();const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log((v?'ok  ':'FAIL')+' '+n);};const url='file://'+path.join(__dirname,'../../index.html');
const prep=async f=>{await f.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});await f.evaluate(()=>openImport());};
{const ctx=await b.newContext({...devices['iPhone 13'],acceptDownloads:true});const p=await ctx.newPage();await p.goto(url);await p.waitForTimeout(900);await prep(p);
  const dP=p.waitForEvent('download',{timeout:6000}).catch(()=>null);await p.tap('#gSave');const d=await dP;
  let txt='';if(d){const f=path.join(os.tmpdir(),'g'+Date.now()+'.md');await d.saveAs(f);txt=fs.readFileSync(f,'utf8');fs.unlinkSync(f);}
  chk('휴대폰: .md 내려받기 '+(d?d.suggestedFilename():'없음'),d&&/\.md$/.test(d.suggestedFilename())&&txt.includes('## B.'));await ctx.close();}
{const ctx=await b.newContext({viewport:{width:1200,height:850}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const wrap=path.join(os.tmpdir(),'bbwrap'+Date.now()+'.html');fs.writeFileSync(wrap,`<!doctype html><iframe src="${url}" style="width:1180px;height:830px;border:0"></iframe>`);await p.goto('file://'+wrap);await p.waitForTimeout(1500);const f=p.frames()[1];await prep(f);
  await f.click('#gSave');await p.waitForTimeout(400);
  const r=await f.evaluate(()=>({open:!$('fbDlg').hidden,len:$('fbText').value.length,want:GUIDE_MD().length,msg:$('fbMsg').textContent}));
  chk('틀 안: 복사 창이 뜸',r.open);chk(`틀 안: 안내서 전체(${r.len}자)`,r.len===r.want&&r.len>1000);
  await f.press('body','Escape');chk('Esc로 닫힘',await f.evaluate(()=>$('fbDlg').hidden));
  chk('페이지 오류 없음 '+errs.join('|'),!errs.length);fs.unlinkSync(wrap);await ctx.close();}
console.log(ok.every(Boolean)?'save-file PASS':'save-file FAIL');await b.close();})();
