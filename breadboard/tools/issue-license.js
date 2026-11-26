#!/usr/bin/env node
// 브레드보드 CAD 라이선스 키 발급 (저작자 전용) — © 2026 co2maker-cyber. All rights reserved.
// 비밀 열쇠 파일은 저장소에 절대 넣지 마세요(.gitignore에 *PRIVATE*.jwk.json).
//
// 키 발급:   node breadboard/tools/issue-license.js --key 비밀열쇠.jwk.json --to "받는 사람" --dom file,example.com --exp 2027-12-31
//   --dom   쓸 수 있는 곳(쉼표로): file = 내 컴퓨터에서 연 파일, example.com, .example.com = 하위 도메인 포함, * = 어디서나
//   --exp   만료일(YYYY-MM-DD). 빼면 기한 없음
//   --id    키 번호(빼면 자동). 키를 취소하려면 index.html의 LIC_REVOKED에 이 번호를 넣어요
//   --build 파일이름.html  키를 미리 넣은 개인용 로컬 버전 파일도 만들어요(받은 사람은 더블클릭으로 바로 실행)
// 새 열쇠:   node breadboard/tools/issue-license.js --newkey 저장할경로-PRIVATE.jwk.json
//   → 비밀 열쇠 파일을 만들고, index.html의 LIC_PUB에 넣을 공개 열쇠를 보여 줘요(바꾸면 예전 키는 모두 못 써요)
const crypto=require('crypto'),fs=require('fs');
const arg=k=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:undefined;};
const b64u=b=>Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
if(arg('newkey')){const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'});const kid='BBCAD-K'+Date.now().toString(36).toUpperCase();
  fs.writeFileSync(arg('newkey'),JSON.stringify({kid,...privateKey.export({format:'jwk'}),note:'브레드보드 CAD 라이선스 발급용 비밀 열쇠. 절대 공유·업로드 금지'},null,1),{mode:0o600});
  const p=publicKey.export({format:'jwk'});console.log('비밀 열쇠 저장:',arg('newkey'));console.log('index.html LIC_PUB에 넣을 공개 열쇠:');console.log(JSON.stringify({kid,kty:p.kty,crv:p.crv,x:p.x,y:p.y}));process.exit(0);}
const keyPath=arg('key');if(!keyPath){console.error('사용법: --key 비밀열쇠.jwk.json --to "이름" --dom file,example.com [--exp YYYY-MM-DD] [--id L-…]');process.exit(1);}
const jwk=JSON.parse(fs.readFileSync(keyPath,'utf8'));if(!jwk.d){console.error('비밀 열쇠 파일이 아니에요(d 값 없음)');process.exit(1);}
const dom=(arg('dom')||'file').split(',').map(s=>s.trim()).filter(Boolean),exp=arg('exp')||null;
if(exp&&!/^\d{4}-\d{2}-\d{2}$/.test(exp)){console.error('--exp 는 YYYY-MM-DD');process.exit(1);}
const info={v:1,id:arg('id')||('L-'+crypto.randomBytes(4).toString('hex').toUpperCase()),to:arg('to')||'',dom,exp,ed:'BBCAD',iat:new Date().toISOString().slice(0,10)};
const body=b64u(JSON.stringify(info));
const sig=crypto.sign('sha256',Buffer.from(body),{key:crypto.createPrivateKey({key:{kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y,d:jwk.d},format:'jwk'}),dsaEncoding:'ieee-p1363'});
const key='BBCAD1.'+body+'.'+b64u(sig);console.log(JSON.stringify(info));console.log(key);
if(arg('build')){const path=require('path');const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const line='const LIC_EMBED=null;';
  if(!src.includes(line)){console.error('index.html에서 LIC_EMBED 줄을 찾지 못했어요');process.exit(1);}
  if(!dom.includes('file')&&!dom.includes('*'))console.error('주의: --dom 에 file 이 없어서 로컬 파일로 열면 키 창이 떠요');
  const out=src.replace(line,'const LIC_EMBED='+JSON.stringify(key)+';   // 개인용 로컬 버전: '+(info.to||'')+' ('+info.id+')').replace('<title>브레드보드 CAD</title>','<title>브레드보드 CAD · '+(info.to||'로컬')+'</title>');
  fs.writeFileSync(arg('build'),out);console.log('로컬 버전 파일:',arg('build'));}
