// 라이선스 키 시험(시험용 열쇠 쌍을 그때그때 만들어 씀 — 진짜 비밀 열쇠는 쓰지 않음)
// ① 복사한 파일(file://)에서 열면 키 창이 뜸 ② 위조·다른 열쇠·기한 지남·다른 사이트 키는 거절 ③ 맞는 키는 통과·저장·다시 열어도 통과
// ④ 발급 페이지(license-admin.html)에서 만든 키도 통과 ⑤ 명령줄 발급 도구(tools/issue-license.js) 키도 통과
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os'),crypto=require('crypto'),{execFileSync}=require('child_process');
const b64u=b=>Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const mk=()=>{const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'});return{pub:publicKey.export({format:'jwk'}),priv:privateKey,privJwk:privateKey.export({format:'jwk'})};};
const sign=(K,info)=>{const body=b64u(JSON.stringify({v:1,id:'L-TEST',ed:'BBCAD',iat:'2026-11-26',...info}));return'BBCAD1.'+body+'.'+b64u(crypto.sign('sha256',Buffer.from(body),{key:K.priv,dsaEncoding:'ieee-p1363'}));};
(async()=>{const K=mk(),Other=mk();const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log((v?'ok  ':'FAIL')+' '+n);};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lic-'));const privFile=path.join(tmp,'test-PRIVATE.jwk.json');fs.writeFileSync(privFile,JSON.stringify({kid:'TEST',...K.privJwk}));
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1200,height:800}});
await ctx.addInitScript(pub=>{window.__licForceGate=true;window.__licTestPub=pub;},K.pub);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const url='file://'+path.join(__dirname,'../../index.html');
await p.goto(url);await p.waitForTimeout(1200);
chk('복사한 파일에서 열면 키 창',await p.evaluate(()=>!$('licGate').hidden&&LIC.mode==='locked'));
const tryKey=async k=>{await p.fill('#licIn',k);await p.click('#licGo');await p.waitForTimeout(250);return p.evaluate(()=>({open:!$('licGate').hidden,err:$('licErr').textContent}));};
let r=await tryKey('아무 글자');chk('모양이 다른 키 거절: '+r.err,r.open&&/모양/.test(r.err));
r=await tryKey(sign(Other,{to:'x',dom:['file'],exp:null}));chk('다른 열쇠로 서명한 키 거절: '+r.err,r.open&&/서명/.test(r.err));
const good=sign(K,{to:'홍길동',dom:['file'],exp:null});const parts=good.split('.');const forged=parts[0]+'.'+b64u(JSON.stringify({v:1,id:'L-TEST',ed:'BBCAD',to:'해커',dom:['*'],exp:null}))+'.'+parts[2];
r=await tryKey(forged);chk('내용을 고친 키 거절: '+r.err,r.open&&/서명/.test(r.err));
r=await tryKey(sign(K,{to:'x',dom:['file'],exp:'2020-01-01'}));chk('기한 지난 키 거절: '+r.err,r.open&&/기한/.test(r.err));
r=await tryKey(sign(K,{to:'x',dom:['example.com'],exp:null}));chk('다른 사이트용 키 거절: '+r.err,r.open&&/example\.com/.test(r.err));
r=await tryKey(good);chk('맞는 키 통과',!r.open&&await p.evaluate(()=>LIC.mode==='key'&&LIC.info.to==='홍길동'));
await p.reload();await p.waitForTimeout(1200);chk('다시 열어도 통과(저장됨)',await p.evaluate(()=>$('licGate').hidden&&LIC.mode==='key'));
chk('[속성] 안내에 라이선스 표시',await p.evaluate(()=>helpHTML().includes('라이선스: 홍길동')));
// 발급 페이지
const a=await ctx.newPage();await a.goto('file://'+path.join(__dirname,'../../license-admin.html'));await a.setInputFiles('#kf',privFile);await a.waitForTimeout(300);
await a.fill('#to','김철수');await a.fill('#exp','2099-12-31');await a.click('#go');await a.waitForTimeout(300);const k2=await a.inputValue('#out');
chk('발급 페이지가 키를 만듦',/^BBCAD1\./.test(k2));
await p.evaluate(()=>{localStorage.clear();});await p.reload();await p.waitForTimeout(1200);r=await tryKey(k2);chk('발급 페이지 키 통과',!r.open&&await p.evaluate(()=>LIC.info.to==='김철수'&&LIC.info.exp==='2099-12-31'));
// 명령줄 도구
const out=execFileSync('node',[path.join(__dirname,'../../tools/issue-license.js'),'--key',privFile,'--to','이영희','--dom','file,.example.org','--exp','2099-01-01'],{encoding:'utf8'}).trim().split('\n');
await p.evaluate(()=>{localStorage.clear();});await p.reload();await p.waitForTimeout(1200);r=await tryKey(out[1]);chk('명령줄 도구 키 통과',!r.open&&await p.evaluate(()=>LIC.info.to==='이영희'));
// 공식 주소 판정
chk('공식 주소 목록',await p.evaluate(()=>LIC_OFFICIAL.includes('co2maker-cyber.github.io')));
chk('페이지 오류 없음 '+errs.join('|'),!errs.length);fs.rmSync(tmp,{recursive:true,force:true});
console.log(ok.every(Boolean)?'license PASS':'license FAIL');await b.close();})();
